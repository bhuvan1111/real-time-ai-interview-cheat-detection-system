import json
import logging
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.database import SessionLocal
from app.schemas.event import EventCreate
from app.services.websocket_manager import ws_manager
from app.services.event_processor import event_processor
from app.utils.security import decode_access_token
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter(tags=["WebSockets"])


def verify_ws_token(token: Optional[str]) -> Optional[User]:
    """Helper to authenticate user from WebSocket query token."""
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None
    user_id = int(payload["sub"])
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        return user
    finally:
        db.close()


@router.websocket("/ws/session/{session_id}")
async def session_websocket_endpoint(
    websocket: WebSocket,
    session_id: int,
    token: Optional[str] = Query(None)
):
    """
    Real-time bidirectional WebSocket channel for an active candidate assessment session.
    Candidate streams browser events; server responds with event ACKs and updated risk levels.
    """
    user = verify_ws_token(token)
    # We accept the connection to allow graceful messaging or token validation
    await ws_manager.connect_session(session_id, websocket)

    try:
        # Initial greeting
        await websocket.send_text(json.dumps({
            "type": "CONNECTION_ESTABLISHED",
            "session_id": session_id,
            "message": "Connected to real-time monitoring channel"
        }))

        while True:
            data_text = await websocket.receive_text()
            try:
                msg = json.loads(data_text)
            except Exception:
                await websocket.send_text(json.dumps({"type": "ERROR", "detail": "Invalid JSON format"}))
                continue

            msg_type = msg.get("type", "EVENT")
            
            if msg_type == "PING":
                await websocket.send_text(json.dumps({"type": "PONG"}))
                continue

            # Event received from candidate browser
            event_type = msg.get("event_type")
            if event_type:
                metadata = msg.get("metadata", {})
                db = SessionLocal()
                try:
                    event_in = EventCreate(
                        session_id=session_id,
                        event_type=event_type,
                        metadata=metadata
                    )
                    await event_processor.process_event(db, event_in)
                except Exception as e:
                    logger.error(f"Error processing WS event for session {session_id}: {e}")
                    await websocket.send_text(json.dumps({
                        "type": "ERROR",
                        "detail": f"Failed to process event: {str(e)}"
                    }))
                finally:
                    db.close()

    except WebSocketDisconnect:
        ws_manager.disconnect_session(session_id, websocket)
        logger.info(f"WebSocket disconnected for session {session_id}")
    except Exception as e:
        logger.error(f"WebSocket unexpected error for session {session_id}: {e}")
        ws_manager.disconnect_session(session_id, websocket)


@router.websocket("/ws/admin")
async def admin_websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
):
    """
    Real-time monitoring channel for Admin dashboard.
    Broadcasts all session events, live risk recalculations, and alerts.
    """
    await ws_manager.connect_admin(websocket)

    try:
        await websocket.send_text(json.dumps({
            "type": "ADMIN_CONNECTED",
            "message": "Subscribed to live assessment feeds"
        }))

        while True:
            # Admins mostly receive broadcasts, but can send ping/commands
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "PING":
                    await websocket.send_text(json.dumps({"type": "PONG"}))
            except Exception:
                pass

    except WebSocketDisconnect:
        ws_manager.disconnect_admin(websocket)
        logger.info("Admin WebSocket disconnected")
    except Exception as e:
        logger.error(f"Admin WebSocket error: {e}")
        ws_manager.disconnect_admin(websocket)

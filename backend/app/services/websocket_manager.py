import json
import logging
from typing import Dict, Set, Any
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # Maps session_id to set of candidate/session WebSockets
        self.session_connections: Dict[int, Set[WebSocket]] = {}
        # Set of admin monitoring WebSockets
        self.admin_connections: Set[WebSocket] = set()

    async def connect_session(self, session_id: int, websocket: WebSocket):
        await websocket.accept()
        if session_id not in self.session_connections:
            self.session_connections[session_id] = set()
        self.session_connections[session_id].add(websocket)
        logger.info(f"WebSocket connected for session {session_id}")

    def disconnect_session(self, session_id: int, websocket: WebSocket):
        if session_id in self.session_connections:
            self.session_connections[session_id].discard(websocket)
            if not self.session_connections[session_id]:
                del self.session_connections[session_id]
        logger.info(f"WebSocket disconnected for session {session_id}")

    async def connect_admin(self, websocket: WebSocket):
        await websocket.accept()
        self.admin_connections.add(websocket)
        logger.info("Admin WebSocket connected")

    def disconnect_admin(self, websocket: WebSocket):
        self.admin_connections.discard(websocket)
        logger.info("Admin WebSocket disconnected")

    async def send_session_message(self, session_id: int, message: Dict[str, Any]):
        """Send message specifically to candidate session."""
        if session_id in self.session_connections:
            disconnected = []
            for ws in list(self.session_connections[session_id]):
                try:
                    await ws.send_text(json.dumps(message, default=str))
                except Exception as e:
                    logger.warning(f"Error sending to session {session_id}: {e}")
                    disconnected.append(ws)
            for ws in disconnected:
                self.disconnect_session(session_id, ws)

    async def broadcast_to_admins(self, message: Dict[str, Any]):
        """Broadcast live event or risk change to all connected admins."""
        if not self.admin_connections:
            return
        disconnected = []
        payload = json.dumps(message, default=str)
        for ws in list(self.admin_connections):
            try:
                await ws.send_text(payload)
            except Exception as e:
                logger.warning(f"Error broadcasting to admin: {e}")
                disconnected.append(ws)
        for ws in disconnected:
            self.disconnect_admin(ws)

    async def broadcast_session_update(self, session_data: Dict[str, Any]):
        """Helper to send standardized update to admin dashboard."""
        await self.broadcast_to_admins({
            "type": "SESSION_UPDATE",
            "data": session_data
        })


ws_manager = ConnectionManager()

import { useEffect, useRef, useCallback } from 'react';
import { sessionService } from '../services/sessionService';

interface UseMonitoringProps {
  sessionId: number;
  sendWsMessage?: (msg: any) => boolean;
  enabled?: boolean;
}

export function useMonitoring({ sessionId, sendWsMessage, enabled = true }: UseMonitoringProps) {
  // References to keep track of state across renders without re-attaching listeners
  const hiddenStartTimeRef = useRef<number | null>(null);
  const blurStartTimeRef = useRef<number | null>(null);
  const lastActiveTimeRef = useRef<number>(Date.now());
  
  // Typing metrics
  const charactersTypedRef = useRef<number>(0);
  const charactersDeletedRef = useRef<number>(0);
  const pasteCharactersRef = useRef<number>(0);
  const lastEditTimeRef = useRef<number>(Date.now());

  const emitEvent = useCallback(async (eventType: string, metadata: Record<string, any> = {}) => {
    if (!enabled || !sessionId) return;

    const payload = {
      session_id: sessionId,
      event_type: eventType,
      metadata: {
        ...metadata,
        characters_typed: charactersTypedRef.current,
        characters_deleted: charactersDeletedRef.current,
        paste_characters: pasteCharactersRef.current,
        timestamp: new Date().toISOString()
      }
    };

    // Try WebSocket first for real-time delivery
    let wsSuccess = false;
    if (sendWsMessage) {
      wsSuccess = sendWsMessage(payload);
    }

    // Fallback or guarantee via REST
    if (!wsSuccess) {
      try {
        await sessionService.recordEvent(payload);
      } catch (err) {
        console.error('Failed to record event via REST fallback:', err);
      }
    }
  }, [enabled, sessionId, sendWsMessage]);

  // Tab Switching Listener (visibilitychange)
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab was hidden
        hiddenStartTimeRef.current = Date.now();
      } else {
        // Tab is visible again
        if (hiddenStartTimeRef.current) {
          const durationSec = (Date.now() - hiddenStartTimeRef.current) / 1000;
          hiddenStartTimeRef.current = null;
          lastActiveTimeRef.current = Date.now();

          emitEvent('TAB_SWITCH', {
            duration: Math.round(durationSec * 10) / 10,
            screen_state: 'returned_to_assessment'
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, emitEvent]);

  // Window Focus / Blur Listener
  useEffect(() => {
    if (!enabled) return;

    const handleBlur = () => {
      blurStartTimeRef.current = Date.now();
    };

    const handleFocus = () => {
      if (blurStartTimeRef.current) {
        const durationSec = (Date.now() - blurStartTimeRef.current) / 1000;
        blurStartTimeRef.current = null;
        lastActiveTimeRef.current = Date.now();

        // Only emit if focus loss was significant (> 1.5s) to avoid micro-blurs
        if (durationSec > 1.5) {
          emitEvent('WINDOW_BLUR', {
            duration: Math.round(durationSec * 10) / 10
          });
        }
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled, emitEvent]);

  // Inactivity Interval Checker (every 30s)
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const inactiveSec = (Date.now() - lastActiveTimeRef.current) / 1000;
      if (inactiveSec >= 60) {
        emitEvent('INACTIVITY', {
          duration: Math.round(inactiveSec)
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [enabled, emitEvent]);

  // Callbacks exposed to CodeEditor
  const recordPaste = useCallback((characterCount: number) => {
    pasteCharactersRef.current += characterCount;
    lastActiveTimeRef.current = Date.now();

    emitEvent('PASTE', {
      character_count: characterCount,
      is_large_paste: characterCount > 300
    });
  }, [emitEvent]);

  const recordKeystroke = useCallback((inserted: number, deleted: number) => {
    charactersTypedRef.current += inserted;
    charactersDeletedRef.current += deleted;
    lastActiveTimeRef.current = Date.now();

    const now = Date.now();
    const timeSinceLastEdit = (now - lastEditTimeRef.current) / 1000;
    lastEditTimeRef.current = now;

    // Detect unnatural burst (> 25 characters inserted within 0.5s without paste event)
    if (inserted > 25 && timeSinceLastEdit < 0.5) {
      emitEvent('TYPING_BURST', {
        characters_per_second: Math.round(inserted / Math.max(0.1, timeSinceLastEdit))
      });
    }
  }, [emitEvent]);

  return {
    recordPaste,
    recordKeystroke,
    emitEvent,
  };
}

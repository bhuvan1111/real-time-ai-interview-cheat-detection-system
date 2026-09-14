import { useState, useEffect, useRef, useCallback } from 'react';

interface UseWebSocketOptions {
  url: string;
  onMessage?: (data: any) => void;
  enabled?: boolean;
}

export function useWebSocket({ url, onMessage, enabled = true }: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (!enabled || !url) return;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setLastMessage(parsed);
          if (onMessage) {
            onMessage(parsed);
          }
        } catch (err) {
          console.error('Failed to parse WS message:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt reconnect after 3 seconds
        if (enabled) {
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        ws.close();
      };
    } catch (e) {
      console.error('Failed to initialize WebSocket:', e);
    }
  }, [url, enabled, onMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((msg: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
      return true;
    }
    return false;
  }, []);

  return { isConnected, lastMessage, sendMessage };
}

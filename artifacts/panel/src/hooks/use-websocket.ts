import { useState, useEffect, useRef } from 'react';

export function useWebSocket(url: string) {
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Convert relative path to absolute ws/wss URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}${url}`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setIsConnected(true);
      setMessages((prev) => [...prev, '\x1b[32m[Panel] Connected to server console.\x1b[0m']);
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
      setMessages((prev) => [...prev, '\x1b[31m[Panel] Disconnected from server console.\x1b[0m']);
    };

    wsRef.current.onmessage = (event) => {
      setMessages((prev) => {
        // Keep only last 1000 messages to prevent memory issues
        const newMessages = [...prev, event.data];
        if (newMessages.length > 1000) return newMessages.slice(newMessages.length - 1000);
        return newMessages;
      });
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url]);

  const sendMessage = (message: string) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(message);
    }
  };

  return { messages, isConnected, sendMessage, setMessages };
}

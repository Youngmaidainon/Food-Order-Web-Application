import { useEffect, useState, useRef } from 'react';

export function useSSE(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    let reconnectAttempts = 0;

    const connect = () => {
      eventSourceRef.current = new EventSource(url, { withCredentials: true });

      eventSourceRef.current.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttempts = 0;
      };

      eventSourceRef.current.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          setData({ event: event.type, payload: parsedData });
        } catch (err) {
          console.error('Failed to parse SSE data', err);
        }
      };

      // Listen for custom events
      eventSourceRef.current.addEventListener('store_status', (event) => {
        const parsedData = JSON.parse(event.data);
        setData({ event: 'store_status', payload: parsedData });
      });

      eventSourceRef.current.addEventListener('new_order', (event) => {
        const parsedData = JSON.parse(event.data);
        setData({ event: 'new_order', payload: parsedData });
      });

      eventSourceRef.current.addEventListener('order_status_updated', (event) => {
        const parsedData = JSON.parse(event.data);
        setData({ event: 'order_status_updated', payload: parsedData });
      });

      eventSourceRef.current.onerror = (err) => {
        setIsConnected(false);
        setError(err);
        eventSourceRef.current.close();
        
        // Exponential backoff reconnect
        const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        reconnectAttempts++;
        reconnectTimeoutRef.current = setTimeout(connect, timeout);
      };
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [url]);

  return { data, isConnected, error };
}

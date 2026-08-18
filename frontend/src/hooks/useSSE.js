import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * Enterprise-grade Server-Sent Events (SSE) Hook
 * - Manages EventSource lifecycle with automatic reconnection & exponential backoff + jitter
 * - Tracks connection health status (isConnected) to support Smart Fallback strategies
 * - Supports custom domain events and message payloads with safe JSON parsing
 */
export function useSSE(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEventTime, setLastEventTime] = useState(null);

  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!url) {
      setIsConnected(false);
      setData(null);
      setError(null);
      cleanup();
      return;
    }

    let isMounted = true;

    const safeParse = (raw) => {
      try {
        return JSON.parse(raw);
      } catch (err) {
        console.warn('[SSE] JSON parse warning:', err);
        return raw;
      }
    };

    const handleEventData = (eventType, eventRawData) => {
      if (!isMounted) return;
      const parsed = safeParse(eventRawData);
      const timestamp = Date.now();
      setLastEventTime(timestamp);
      setData({ event: eventType, payload: parsed, timestamp });
    };

    const connect = () => {
      cleanup();

      try {
        const es = new EventSource(url, { withCredentials: true });
        eventSourceRef.current = es;

        es.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
          setError(null);
          reconnectAttemptsRef.current = 0;
        };

        es.onmessage = (event) => {
          handleEventData(event.type || 'message', event.data);
        };

        // Custom domain event listeners
        const eventNames = ['store_status', 'new_order', 'order_status_updated', 'ping', 'heartbeat'];
        eventNames.forEach((name) => {
          es.addEventListener(name, (event) => {
            handleEventData(name, event.data);
          });
        });

        es.onerror = (err) => {
          if (!isMounted) return;
          setIsConnected(false);
          setError(err);

          // Close existing instance before scheduling reconnect
          es.close();
          eventSourceRef.current = null;

          // Exponential backoff with random jitter (1s - 15s)
          const attempts = reconnectAttemptsRef.current;
          const baseDelay = Math.min(1000 * Math.pow(1.5, attempts), 15000);
          const jitter = Math.random() * 1000;
          const delay = Math.round(baseDelay + jitter);

          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted) {
              connect();
            }
          }, delay);
        };
      } catch (err) {
        if (!isMounted) return;
        setIsConnected(false);
        setError(err);
      }
    };

    connect();

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [url, cleanup]);

  return { data, isConnected, error, lastEventTime };
}

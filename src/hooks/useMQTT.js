import { useEffect, useRef } from 'react';
import mqtt from 'mqtt';

export default function useMQTT({ url, topic, onMessage, options = {} }) {
  const clientRef = useRef(null);
  const stateRef = useRef({ connected: false, error: null });

  useEffect(() => {
    if (!url || !topic) return;

    const client = mqtt.connect(url, {
      keepalive: 30,
      reconnectPeriod: 5000,
      connectTimeout: 10_000,
      clientId: options.clientId || `web_${Math.random().toString(16).slice(2)}`,
      ...options,
    });
    clientRef.current = client;

    const handleConnect = () => {
      stateRef.current.connected = true;
      client.subscribe(topic, { qos: 0 }, (err) => {
        if (err) {
          stateRef.current.error = err;
          console.error('MQTT subscribe error', err);
        }
      });
    };
    const handleError = (err) => {
      stateRef.current.error = err;
      console.error('MQTT error', err);
    };
    const handleClose = () => {
      stateRef.current.connected = false;
    };

    client.on('connect', handleConnect);
    client.on('error', handleError);
    client.on('close', handleClose);

    client.on('message', (t, payload) => {
      if (t !== topic) return;
      try {
        const text = payload.toString();
        const data = JSON.parse(text);
        onMessage && onMessage(data);
      } catch (e) {
        stateRef.current.error = e;
        console.warn('MQTT message parse error', e);
      }
    });

    return () => {
      try {
        if (clientRef.current) {
          clientRef.current.end(true);
          clientRef.current.removeListener('connect', handleConnect);
          clientRef.current.removeListener('error', handleError);
          clientRef.current.removeListener('close', handleClose);
        }
      } catch (cleanupErr) {
        console.warn('MQTT cleanup error', cleanupErr);
      }
      clientRef.current = null;
    };
  }, [url, topic, onMessage, options]);

  return {
    get connected() {
      return stateRef.current.connected;
    },
    get error() {
      return stateRef.current.error;
    },
  };
}
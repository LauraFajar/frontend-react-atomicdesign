import { io } from 'socket.io-client';
import config from '../config/environment';

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(config.api.baseURL, {
      path: '/socket.io',
      autoConnect: false,
      transports: ['websocket'],
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
    });

    socket.on('connect_error', (err) => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[socket] connect_error:', err?.message);
      }
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
}

export function disconnectSocket() {
  const s = getSocket();
  if (s && s.connected) s.disconnect();
}
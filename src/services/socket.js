import { io } from 'socket.io-client';
import env from '../config/environment';

let socket = null;
const wsPath = process.env.REACT_APP_WS_PATH || '/socket.io';

export const initSocket = () => {
  if (!env.features.enableWs) {
    console.log('[ws] deshabilitado por configuración');
    return null;
  }
  if (socket?.connected) return socket;

  try {
    socket = io(env.ws.baseURL, {
      transports: ['websocket'],
      path: wsPath,
      withCredentials: true,
      reconnection: false,
      timeout: 4000,
      autoConnect: true,
      forceNew: true,
    });

    socket.on('connect', () => console.log('[ws] conectado', socket.id));
    socket.on('connect_error', (e) => {
      console.warn('[ws] error conexión, desactivando intentos', e?.message || e);
      safeDisconnect();
    });
    socket.on('disconnect', (reason) => console.log('[ws] desconectado', reason));
  } catch (err) {
    console.warn('[ws] no se pudo inicializar', err?.message || err);
  }

  return socket;
};

export const getSocket = () => socket;

export const safeDisconnect = () => {
  try {
    if (socket && socket.connected) socket.disconnect();
  } catch (_) {}
  socket = null;
};
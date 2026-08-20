import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');

let socket = null;

// Lazily creates a single authenticated socket connection for the session.
export function getSocket() {
  const token = localStorage.getItem('edgex_access_token');
  if (!token) return null;
  if (socket && socket.connected) return socket;

  socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

/**
 * socketClient.js
 * Instancias de Socket.IO para cada namespace.
 * Se crean una sola vez y se reutilizan en toda la app.
 *
 * Cada vista importa solo el socket que necesita:
 *   - adminSocket → /admin
 *   - tvSocket    → /tv
 *   - playSocket  → /play
 */

import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

const SOCKET_OPTIONS = {
    autoConnect: false,       // conectar manualmente cuando sea necesario
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
};

export const adminSocket = io(`${SERVER_URL}/admin`, SOCKET_OPTIONS);
export const tvSocket = io(`${SERVER_URL}/tv`, SOCKET_OPTIONS);
export const playSocket = io(`${SERVER_URL}/play`, SOCKET_OPTIONS);

/**
 * socketGateway/index.js
 * Inicializa Socket.IO y registra todos los handlers.
 *
 * Responsabilidades:
 *   - Configurar CORS para LAN local.
 *   - Registrar handlers de admin y jugadores.
 *   - Inicializar el broadcaster con los namespaces (no con io raíz).
 *   - Gestionar la unión de TV a las rooms.
 *
 * FIX: broadcaster.init() se llama DESPUÉS de crear los namespaces,
 * porque io.to(socketId) no alcanza sockets en namespaces.
 */

const { Server } = require('socket.io');
const broadcaster = require('./broadcaster');
const { registerAdminHandlers } = require('./adminHandlers');
const { registerPlayerHandlers } = require('./playerHandlers');
const roomManager = require('../roomManager/index');

/**
 * Inicializa Socket.IO sobre el servidor HTTP.
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
function initSocketGateway(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: '*', // LAN local: aceptar cualquier origen
            methods: ['GET', 'POST'],
        },
        pingTimeout: 30000,
        pingInterval: 10000,
    });

    // ── Crear namespaces PRIMERO ───────────────────────────────────────────────
    const adminNS = io.of('/admin');
    const tvNS = io.of('/tv');
    const playNS = io.of('/play');

    // ── Inicializar broadcaster con los namespaces ─────────────────────────────
    // IMPORTANTE: debe hacerse después de crear los namespaces.
    // io.to(socketId) NO alcanza sockets en namespaces — se necesita namespace.to()
    broadcaster.init(io, { admin: adminNS, tv: tvNS, play: playNS });

    // ── Namespace /admin ───────────────────────────────────────────────────────
    adminNS.on('connection', (socket) => {
        console.log(`[gateway] Admin conectado: ${socket.id}`);
        registerAdminHandlers(socket);
    });

    // ── Namespace /tv ──────────────────────────────────────────────────────────
    tvNS.on('connection', (socket) => {
        console.log(`[gateway] TV conectada: ${socket.id}`);

        socket.on('join_tv', (data) => {
            const roomId = data?.roomId;
            console.log(`[gateway] TV solicita unirse a sala: "${roomId}"`);

            const room = roomManager.getRoom(roomId);
            if (!room) {
                console.warn(`[gateway] Sala "${roomId}" no encontrada para TV ${socket.id}`);
                socket.emit('error', { code: 'ROOM_NOT_FOUND', message: `Sala "${roomId}" no encontrada.` });
                return;
            }
            socket.join(roomId);
            socket.join(`tv:${roomId}`);
            socket.data.roomId = roomId;

            // Sincronizar estado actual al conectar
            const state = room.toPublicState();
            console.log(`[gateway] Enviando estado inicial a TV ${socket.id} (Sala "${roomId}", Estado: "${state.state}")`);
            socket.emit('game_state_update', state);
        });

        socket.on('disconnect', () => {
            console.log(`[gateway] TV desconectada: ${socket.id}`);
        });
    });

    // ── Namespace /play ────────────────────────────────────────────────────────
    playNS.on('connection', (socket) => {
        console.log(`[gateway] Jugador conectado: ${socket.id}`);
        registerPlayerHandlers(socket);
    });

    console.log('[gateway] Socket.IO inicializado. Namespaces: /admin, /tv, /play');
    return io;
}

module.exports = { initSocketGateway };

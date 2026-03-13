/**
 * roomManager/index.js
 * Gestiona el ciclo de vida de las salas activas.
 *
 * Responsabilidades:
 *   - Crear y eliminar salas.
 *   - Proveer acceso a salas por roomId.
 *   - Generar roomIds únicos de 4 caracteres alfanuméricos.
 *
 * Almacenamiento: Map en memoria (suficiente para MVP local).
 * No depende de Socket.IO.
 */

const Room = require('./Room');

/** @type {Map<string, Room>} */
const rooms = new Map();

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin O, 0, I, 1 para evitar confusión

/**
 * Genera un roomId único de 4 caracteres.
 * @returns {string}
 */
function generateRoomId() {
    let id;
    do {
        id = Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
    } while (rooms.has(id));
    return id;
}

/**
 * Crea una nueva sala y la registra.
 * @param {object} options
 * @param {string} options.sessionType
 * @param {string} options.markingMode
 * @returns {Room}
 */
function createRoom({ sessionType, markingMode }) {
    const roomId = generateRoomId();
    const room = new Room({ roomId, sessionType, markingMode });
    rooms.set(roomId, room);
    console.log(`[roomManager] Sala creada: ${roomId} (${sessionType}, ${markingMode})`);
    return room;
}

/**
 * Obtiene una sala por su ID.
 * @param {string} roomId
 * @returns {Room|undefined}
 */
function getRoom(roomId) {
    return rooms.get(roomId);
}

/**
 * Elimina una sala del registro.
 * @param {string} roomId
 */
function deleteRoom(roomId) {
    rooms.delete(roomId);
    console.log(`[roomManager] Sala eliminada: ${roomId}`);
}

/**
 * Retorna todas las salas activas (para diagnóstico).
 * @returns {Room[]}
 */
function getAllRooms() {
    return Array.from(rooms.values());
}

/**
 * Busca la sala a la que pertenece un socketId.
 * Útil para manejar desconexiones inesperadas.
 * @param {string} socketId
 * @returns {{ room: Room, session: import('./PlayerSession') } | null}
 */
function findRoomBySocketId(socketId) {
    for (const room of rooms.values()) {
        const session = room.getSessionBySocketId(socketId);
        if (session) return { room, session };
    }
    return null;
}

module.exports = {
    createRoom,
    getRoom,
    deleteRoom,
    getAllRooms,
    findRoomBySocketId,
};

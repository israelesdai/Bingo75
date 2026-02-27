/**
 * broadcaster.js
 * Funciones puras de emisión de eventos Socket.IO.
 *
 * CORRECCIÓN: Los sockets viven en namespaces (/admin, /tv, /play).
 * io.to(socketId) NO alcanza sockets en namespaces.
 * Se deben usar las instancias de namespace para emitir a sockets individuales.
 *
 * Convención de nombres de eventos:
 *   room_created, player_joined, player_left, card_assigned,
 *   game_state_update, number_drawn, number_marked, nickname_updated,
 *   tie_break_start, tie_break_result, round_reset, room_closed, error
 */

/** @type {import('socket.io').Server} */
let io = null;

/** @type {import('socket.io').Namespace} */
let adminNS = null;

/** @type {import('socket.io').Namespace} */
let tvNS = null;

/** @type {import('socket.io').Namespace} */
let playNS = null;

/**
 * Inicializa el broadcaster con la instancia de Socket.IO y los namespaces.
 * Debe llamarse una sola vez desde socketGateway/index.js.
 * @param {import('socket.io').Server} ioInstance
 * @param {{ admin, tv, play }} namespaces
 */
function init(ioInstance, namespaces) {
    io = ioInstance;
    adminNS = namespaces.admin;
    tvNS = namespaces.tv;
    playNS = namespaces.play;
}

// ─── Helpers de targeting ────────────────────────────────────────────────────

/** Emite a todos en una sala (admin + tv + jugadores) usando los 3 namespaces. */
function toRoom(roomId, event, data) {
    adminNS.to(roomId).emit(event, data);
    tvNS.to(roomId).emit(event, data);
    playNS.to(roomId).emit(event, data);
}

/** Emite solo al admin de una sala. */
function toAdmin(roomId, event, data) {
    adminNS.to(`admin:${roomId}`).emit(event, data);
}

/** Emite solo a la TV de una sala. */
function toTV(roomId, event, data) {
    tvNS.to(`tv:${roomId}`).emit(event, data);
}

/** Emite a un socket específico del namespace /admin. */
function toAdminSocket(socketId, event, data) {
    adminNS.to(socketId).emit(event, data);
}

/** Emite a un socket específico del namespace /play. */
function toPlaySocket(socketId, event, data) {
    playNS.to(socketId).emit(event, data);
}

// ─── Eventos de sala ─────────────────────────────────────────────────────────

/**
 * Emite room_created al admin que creó la sala.
 * @param {string} adminSocketId
 * @param {{ roomId, ip, port, qrBase64, joinUrl }} data
 */
function emitRoomCreated(adminSocketId, data) {
    toAdminSocket(adminSocketId, 'room_created', data);
}

/**
 * Emite player_joined al admin y TV.
 * @param {string} roomId
 * @param {{ playerId, playerName, totalPlayers }} data
 */
function emitPlayerJoined(roomId, data) {
    toAdmin(roomId, 'player_joined', data);
    toTV(roomId, 'player_joined', data);
}

/**
 * Emite player_left al admin.
 * @param {string} roomId
 * @param {{ playerId, playerName, totalPlayers }} data
 */
function emitPlayerLeft(roomId, data) {
    toAdmin(roomId, 'player_left', data);
}

/**
 * Emite card_assigned al jugador específico.
 * @param {string} socketId
 * @param {{ card, cardHash, markingMode, sessionType, playerName, gameState }} data
 */
function emitCardAssigned(socketId, data) {
    toPlaySocket(socketId, 'card_assigned', data);
}

// ─── Eventos de juego ────────────────────────────────────────────────────────

/**
 * Emite game_state_update a toda la sala (admin + tv + jugadores).
 * @param {string} roomId
 * @param {object} publicState - Room.toPublicState()
 */
function emitGameStateUpdate(roomId, publicState) {
    toRoom(roomId, 'game_state_update', publicState);
}

/**
 * Emite number_drawn a toda la sala.
 * @param {string} roomId
 * @param {{ number, column, nickname, drawnNumbers }} data
 */
function emitNumberDrawn(roomId, data) {
    toRoom(roomId, 'number_drawn', data);
}

/**
 * Emite number_marked al jugador que marcó (confirmación).
 * @param {string} socketId
 * @param {{ number, valid, error? }} data
 */
function emitNumberMarked(socketId, data) {
    toPlaySocket(socketId, 'number_marked', data);
}

/**
 * Emite nickname_updated a toda la sala.
 * @param {string} roomId
 * @param {{ number, nickname }} data
 */
function emitNicknameUpdated(roomId, data) {
    toRoom(roomId, 'nickname_updated', data);
}

// ─── Eventos de desempate ────────────────────────────────────────────────────

/**
 * Emite tie_break_start a toda la sala.
 * @param {string} roomId
 * @param {{ tiedPlayers: Array<{ playerId, playerName }> }} data
 */
function emitTieBreakStart(roomId, data) {
    toRoom(roomId, 'tie_break_start', data);
}

/**
 * Emite tie_break_result a toda la sala.
 * @param {string} roomId
 * @param {{ winnerId, winnerName, tiedPlayers }} data
 */
function emitTieBreakResult(roomId, data) {
    toRoom(roomId, 'tie_break_result', data);
}

// ─── Eventos de ronda y cierre ───────────────────────────────────────────────

/**
 * Emite round_reset a toda la sala.
 * @param {string} roomId
 * @param {{ roundNumber }} data
 */
function emitRoundReset(roomId, data) {
    toRoom(roomId, 'round_reset', data);
}

/**
 * Emite room_closed a toda la sala.
 * @param {string} roomId
 * @param {{ reason }} data
 */
function emitRoomClosed(roomId, data) {
    toRoom(roomId, 'room_closed', data);
}

// ─── Error ───────────────────────────────────────────────────────────────────

/**
 * Emite error a un socket específico.
 * Intenta en adminNS primero, luego en playNS.
 * @param {string} socketId
 * @param {{ code, message }} data
 */
function emitError(socketId, data) {
    // Emitir en ambos namespaces — solo el que tenga el socket lo recibirá
    adminNS.to(socketId).emit('error', data);
    playNS.to(socketId).emit('error', data);
}

module.exports = {
    init,
    emitRoomCreated,
    emitPlayerJoined,
    emitPlayerLeft,
    emitCardAssigned,
    emitGameStateUpdate,
    emitNumberDrawn,
    emitNumberMarked,
    emitNicknameUpdated,
    emitTieBreakStart,
    emitTieBreakResult,
    emitRoundReset,
    emitRoomClosed,
    emitError,
};

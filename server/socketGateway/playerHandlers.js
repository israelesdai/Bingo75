/**
 * playerHandlers.js
 * Handlers de eventos Socket.IO de los jugadores.
 *
 * Responsabilidades:
 *   - Gestionar join_room, reconnect_player, mark_number.
 *   - Validar con gameEngine antes de aplicar cambios.
 *   - Emitir respuestas via broadcaster.
 *   - Manejar desconexiones de jugadores.
 *
 * REGLA: No modifica gameEngine ni roomManager internamente.
 */

const roomManager = require('../roomManager/index');
const engine = require('../gameEngine/index');
const broadcaster = require('./broadcaster');
const { MARKING_MODES } = require('../config/constants');

/**
 * Registra todos los handlers del jugador en un socket.
 * @param {import('socket.io').Socket} socket
 */
function registerPlayerHandlers(socket) {

    // ── join_room ──────────────────────────────────────────────────────────────
    socket.on('join_room', ({ roomId, playerId, playerName } = {}) => {
        try {
            if (!roomId || !playerId) {
                return broadcaster.emitError(socket.id, {
                    code: 'MISSING_PARAMS',
                    message: 'roomId y playerId son requeridos.',
                });
            }

            const room = roomManager.getRoom(roomId);
            if (!room) {
                return broadcaster.emitError(socket.id, {
                    code: 'ROOM_NOT_FOUND',
                    message: `La sala "${roomId}" no existe o ya fue cerrada.`,
                });
            }

            if (room.state === engine.GAME_STATES.CERRADO) {
                return broadcaster.emitError(socket.id, {
                    code: 'ROOM_CLOSED',
                    message: 'Esta sala está cerrada.',
                });
            }

            // Verificar si el jugador está baneado
            if (room.bannedPlayers.has(playerId)) {
                return broadcaster.emitError(socket.id, {
                    code: 'PLAYER_BANNED',
                    message: 'Has sido expulsado de esta sala.',
                });
            }

            const { session, isNew, error } = room.addOrReconnectPlayer(playerId, socket.id, playerName);

            if (error) {
                return broadcaster.emitError(socket.id, { code: 'JOIN_ERROR', message: error });
            }

            // Unir al jugador a la room de Socket.IO
            socket.join(roomId);
            socket.data.roomId = roomId;
            socket.data.playerId = playerId;

            // Enviar cartón asignado con toda la info que el cliente necesita
            broadcaster.emitCardAssigned(socket.id, {
                card: session.card,
                cardHash: session.cardHash,
                markingMode: room.markingMode,
                sessionType: room.sessionType,
                playerName: session.playerName,
                gameState: room.state,
            });

            // Enviar estado actual del juego (para sincronizar si reconecta a mitad de ronda)
            broadcaster.emitGameStateUpdate(roomId, room.toPublicState());

            // Notificar a admin y TV solo si es jugador nuevo
            if (isNew) {
                broadcaster.emitPlayerJoined(roomId, {
                    playerId: session.playerId,
                    playerName: session.playerName,
                    totalPlayers: room.players.size,
                });
            }

            console.log(`[player] ${isNew ? 'Nuevo' : 'Reconectado'}: ${session.playerName} (${playerId}) en sala ${roomId}`);
        } catch (err) {
            broadcaster.emitError(socket.id, { code: 'JOIN_ROOM_ERROR', message: err.message });
        }
    });

    // ── reconnect_player ───────────────────────────────────────────────────────
    // El cliente llama a este evento explícitamente tras detectar reconexión.
    // Restaura el cartón y el estado del juego sin crear nueva sesión.
    socket.on('reconnect_player', ({ roomId, playerId, playerName } = {}) => {
        try {
            if (!roomId || !playerId) {
                return broadcaster.emitError(socket.id, {
                    code: 'MISSING_PARAMS',
                    message: 'roomId y playerId son requeridos para reconectar.',
                });
            }

            const room = roomManager.getRoom(roomId);
            if (!room) {
                return broadcaster.emitError(socket.id, {
                    code: 'ROOM_NOT_FOUND',
                    message: `La sala "${roomId}" ya no existe.`,
                });
            }

            const { session, error } = room.addOrReconnectPlayer(playerId, socket.id, playerName);
            if (error) {
                const code = room.bannedPlayers.has(playerId) ? 'PLAYER_BANNED' : 'RECONNECT_ERROR';
                return broadcaster.emitError(socket.id, { code, message: error });
            }

            socket.join(roomId);
            socket.data.roomId = roomId;
            socket.data.playerId = playerId;

            broadcaster.emitCardAssigned(socket.id, {
                card: session.card,
                cardHash: session.cardHash,
                markingMode: room.markingMode,
                sessionType: room.sessionType,
                playerName: session.playerName,
                gameState: room.state,
            });

            broadcaster.emitGameStateUpdate(roomId, room.toPublicState());
            console.log(`[player] Reconexión: ${session.playerName} en sala ${roomId}`);
        } catch (err) {
            broadcaster.emitError(socket.id, { code: 'RECONNECT_ERROR', message: err.message });
        }
    });

    // ── mark_number ────────────────────────────────────────────────────────────
    socket.on('mark_number', ({ roomId, playerId, number } = {}) => {
        try {
            const rId = roomId || socket.data.roomId;
            const pId = playerId || socket.data.playerId;

            if (!rId || !pId || number === undefined) {
                return broadcaster.emitError(socket.id, {
                    code: 'MISSING_PARAMS',
                    message: 'roomId, playerId y number son requeridos.',
                });
            }

            const room = roomManager.getRoom(rId);
            if (!room) {
                return broadcaster.emitError(socket.id, {
                    code: 'ROOM_NOT_FOUND',
                    message: `Sala "${rId}" no encontrada.`,
                });
            }

            if (room.state !== engine.GAME_STATES.EN_JUEGO) {
                return broadcaster.emitError(socket.id, {
                    code: 'INVALID_STATE',
                    message: 'El juego no está en curso.',
                });
            }

            if (room.markingMode !== MARKING_MODES.MANUAL) {
                return broadcaster.emitError(socket.id, {
                    code: 'INVALID_MODE',
                    message: 'El marcado automático está activo. No se puede marcar manualmente.',
                });
            }

            const result = room.applyManualMark(pId, Number(number));

            broadcaster.emitNumberMarked(socket.id, {
                number: Number(number),
                valid: result.valid,
                error: result.error,
            });

            if (!result.valid) return;

            // Verificar si este jugador completó Blackout
            const { winners, hasWinner } = room.checkWinners();

            if (hasWinner) {
                if (winners.length === 1) {
                    room.transitionTo(engine.GAME_STATES.FINALIZADO);
                    broadcaster.emitGameStateUpdate(room.roomId, {
                        ...room.toPublicState(),
                        winner: winners[0],
                    });
                } else {
                    room.setTie(winners);
                    room.transitionTo(engine.GAME_STATES.EMPATE);
                    broadcaster.emitTieBreakStart(room.roomId, { tiedPlayers: winners });
                    broadcaster.emitGameStateUpdate(room.roomId, room.toPublicState());
                }
            }

        } catch (err) {
            broadcaster.emitError(socket.id, { code: 'MARK_ERROR', message: err.message });
        }
    });

    // ── disconnect ─────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
        try {
            const result = roomManager.findRoomBySocketId(socket.id);
            if (!result) return;

            const { room, session } = result;
            session.disconnect();

            broadcaster.emitPlayerLeft(room.roomId, {
                playerId: session.playerId,
                playerName: session.playerName,
                totalPlayers: room.connectedCount,
            });

            console.log(`[player] Desconectado: ${session.playerName} de sala ${room.roomId}`);
        } catch (err) {
            console.error('[player] Error en disconnect handler:', err.message);
        }
    });
}

module.exports = { registerPlayerHandlers };

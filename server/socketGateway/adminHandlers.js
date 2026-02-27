/**
 * adminHandlers.js
 * Handlers de eventos Socket.IO del panel Admin.
 *
 * Responsabilidades:
 *   - Escuchar eventos del admin.
 *   - Llamar a roomManager y gameEngine.
 *   - Emitir respuestas via broadcaster.
 *
 * REGLA: No modifica gameEngine ni roomManager internamente.
 * Solo llama sus APIs públicas.
 */

const roomManager = require('../roomManager/index');
const engine = require('../gameEngine/index');
const broadcaster = require('./broadcaster');
const { generateQR } = require('../utils/qrGenerator');
const { getLocalIP } = require('../utils/ipDetector');
const { PORT, CLIENT_PORT, SESSION_TYPES, MARKING_MODES } = require('../config/constants');

/**
 * Registra todos los handlers del admin en un socket.
 * @param {import('socket.io').Socket} socket
 */
function registerAdminHandlers(socket) {

    // ── create_room ────────────────────────────────────────────────────────────
    socket.on('create_room', async ({ sessionType, markingMode } = {}) => {
        try {
            const sType = Object.values(SESSION_TYPES).includes(sessionType)
                ? sessionType : SESSION_TYPES.SINGLE;
            const mMode = Object.values(MARKING_MODES).includes(markingMode)
                ? markingMode : MARKING_MODES.AUTO;

            const room = roomManager.createRoom({ sessionType: sType, markingMode: mMode });

            // Unir admin a las rooms de Socket.IO de la sala
            socket.join(room.roomId);
            socket.join(`admin:${room.roomId}`);
            socket.data.roomId = room.roomId;
            socket.data.isAdmin = true;

            const ip = getLocalIP();
            const joinUrl = `http://${ip}:${CLIENT_PORT}/play?room=${room.roomId}`;
            const tvUrl = `http://${ip}:${CLIENT_PORT}/tv?room=${room.roomId}`;
            const qrBase64 = await generateQR(joinUrl);

            // Guardar en la sala para que toPublicState() lo envíe a la TV
            room.joinUrl = joinUrl;
            room.qrBase64 = qrBase64;

            broadcaster.emitRoomCreated(socket.id, {
                roomId: room.roomId,
                ip,
                port: PORT,
                joinUrl,
                tvUrl,
                qrBase64,
                sessionType: sType,
                markingMode: mMode,
            });

            console.log(`[admin] Sala ${room.roomId} creada por socket ${socket.id}`);

        } catch (err) {
            broadcaster.emitError(socket.id, { code: 'CREATE_ROOM_ERROR', message: err.message });
        }
    });

    // ── start_game ─────────────────────────────────────────────────────────────
    socket.on('start_game', ({ roomId } = {}) => {
        try {
            const room = _getRoom(socket, roomId);
            if (!room) return;

            room.transitionTo(engine.GAME_STATES.EN_JUEGO);
            room.initPool();

            broadcaster.emitGameStateUpdate(room.roomId, room.toPublicState());
            console.log(`[admin] Juego iniciado en sala ${room.roomId}`);
        } catch (err) {
            broadcaster.emitError(socket.id, { code: 'START_GAME_ERROR', message: err.message });
        }
    });

    // ── draw_number ────────────────────────────────────────────────────────────
    socket.on('draw_number', ({ roomId } = {}) => {
        try {
            const room = _getRoom(socket, roomId);
            if (!room) return;

            if (room.state !== engine.GAME_STATES.EN_JUEGO) {
                return broadcaster.emitError(socket.id, {
                    code: 'INVALID_STATE',
                    message: `No se puede sortear en estado: ${room.state}`,
                });
            }

            const ball = room.drawNextBall();
            if (!ball) {
                return broadcaster.emitError(socket.id, {
                    code: 'POOL_EMPTY',
                    message: 'No quedan bolas por sortear.',
                });
            }

            // Marcado automático
            if (room.markingMode === MARKING_MODES.AUTO) {
                room.applyAutoMarkToAll(ball.number);
            }

            // Emitir número sorteado a toda la sala
            broadcaster.emitNumberDrawn(room.roomId, {
                number: ball.number,
                column: ball.column,
                nickname: ball.nickname,
                drawnNumbers: room.drawnNumbers,
                remaining: ball.remaining,
            });

            // Verificar ganadores
            const { winners, hasWinner } = room.checkWinners();

            if (hasWinner) {
                if (winners.length === 1) {
                    // Un solo ganador
                    room.transitionTo(engine.GAME_STATES.FINALIZADO);
                    broadcaster.emitGameStateUpdate(room.roomId, {
                        ...room.toPublicState(),
                        winner: winners[0],
                    });
                } else {
                    // Empate
                    room.setTie(winners);
                    room.transitionTo(engine.GAME_STATES.EMPATE);
                    broadcaster.emitTieBreakStart(room.roomId, { tiedPlayers: winners });
                    broadcaster.emitGameStateUpdate(room.roomId, room.toPublicState());
                }
            } else {
                // Actualizar estado (para que TV y jugadores vean el nuevo número)
                broadcaster.emitGameStateUpdate(room.roomId, room.toPublicState());
            }

            console.log(`[admin] Bola sorteada: ${ball.column}-${ball.number} en sala ${room.roomId}`);
        } catch (err) {
            broadcaster.emitError(socket.id, { code: 'DRAW_ERROR', message: err.message });
        }
    });

    // ── pause_game ─────────────────────────────────────────────────────────────
    socket.on('pause_game', ({ roomId } = {}) => {
        // En MVP: simplemente no sortear más. El estado EN_JUEGO se mantiene.
        // El admin deja de presionar "Sacar bola". No hay estado PAUSADO en MVP.
        broadcaster.emitError(socket.id, {
            code: 'INFO',
            message: 'Pausa: deja de sortear bolas. El juego continúa cuando presiones "Sacar bola".',
        });
    });

    // ── spin_roulette ──────────────────────────────────────────────────────────
    socket.on('spin_roulette', ({ roomId } = {}) => {
        try {
            const room = _getRoom(socket, roomId);
            if (!room) return;

            if (room.state !== engine.GAME_STATES.EMPATE) {
                return broadcaster.emitError(socket.id, {
                    code: 'INVALID_STATE',
                    message: `No hay empate activo. Estado actual: ${room.state}`,
                });
            }

            room.transitionTo(engine.GAME_STATES.RULETA);
            broadcaster.emitGameStateUpdate(room.roomId, room.toPublicState());

            // El ganador se determina ANTES de la animación (consistencia)
            const winner = room.resolveTie();

            // Emitir resultado (el cliente anima y luego muestra al ganador)
            setTimeout(() => {
                room.transitionTo(engine.GAME_STATES.FINALIZADO);
                broadcaster.emitTieBreakResult(room.roomId, {
                    winnerId: winner.playerId,
                    winnerName: winner.playerName,
                    tiedPlayers: room.tiedPlayers,
                });
                broadcaster.emitGameStateUpdate(room.roomId, room.toPublicState());
                console.log(`[admin] Desempate resuelto: ${winner.playerName} en sala ${room.roomId}`);
            }, 4000); // 4s para que la animación de ruleta en TV tenga tiempo

        } catch (err) {
            broadcaster.emitError(socket.id, { code: 'ROULETTE_ERROR', message: err.message });
        }
    });

    // ── new_round ──────────────────────────────────────────────────────────────
    socket.on('new_round', ({ roomId } = {}) => {
        try {
            const room = _getRoom(socket, roomId);
            if (!room) return;

            if (room.sessionType !== SESSION_TYPES.CONTINUOUS) {
                return broadcaster.emitError(socket.id, {
                    code: 'INVALID_SESSION_TYPE',
                    message: 'Solo las sesiones continuas pueden iniciar nuevas rondas.',
                });
            }

            room.resetForNewRound();

            // Emitir nuevos cartones a cada jugador conectado
            for (const session of room.players.values()) {
                if (session.isConnected) {
                    broadcaster.emitCardAssigned(session.socketId, {
                        card: session.card,
                        cardHash: session.cardHash,
                    });
                }
            }

            broadcaster.emitRoundReset(room.roomId, { roundNumber: room.roundNumber });
            broadcaster.emitGameStateUpdate(room.roomId, room.toPublicState());
            console.log(`[admin] Nueva ronda ${room.roundNumber} en sala ${room.roomId}`);
        } catch (err) {
            broadcaster.emitError(socket.id, { code: 'NEW_ROUND_ERROR', message: err.message });
        }
    });

    // ── close_room ─────────────────────────────────────────────────────────────
    socket.on('close_room', ({ roomId } = {}) => {
        try {
            const room = _getRoom(socket, roomId);
            if (!room) return;

            room.transitionTo(engine.GAME_STATES.CERRADO);
            broadcaster.emitRoomClosed(room.roomId, { reason: 'El administrador cerró la sala.' });
            roomManager.deleteRoom(room.roomId);
            console.log(`[admin] Sala ${room.roomId} cerrada.`);
        } catch (err) {
            broadcaster.emitError(socket.id, { code: 'CLOSE_ROOM_ERROR', message: err.message });
        }
    });

    // ── update_nickname ────────────────────────────────────────────────────────
    socket.on('update_nickname', ({ roomId, number, nickname } = {}) => {
        try {
            const room = _getRoom(socket, roomId);
            if (!room) return;

            if (!number || !nickname || typeof nickname !== 'string') {
                return broadcaster.emitError(socket.id, {
                    code: 'INVALID_NICKNAME',
                    message: 'Número y apodo son requeridos.',
                });
            }

            room.updateNickname(Number(number), nickname.trim());
            broadcaster.emitNicknameUpdated(room.roomId, { number: Number(number), nickname: nickname.trim() });
        } catch (err) {
            broadcaster.emitError(socket.id, { code: 'NICKNAME_ERROR', message: err.message });
        }
    });

    // ── toggle_speech ──────────────────────────────────────────────────────────
    socket.on('toggle_speech', ({ roomId, enabled } = {}) => {
        try {
            const room = _getRoom(socket, roomId);
            if (!room) return;

            room.speechEnabled = Boolean(enabled);
            broadcaster.emitGameStateUpdate(room.roomId, room.toPublicState());
        } catch (err) {
            broadcaster.emitError(socket.id, { code: 'SPEECH_ERROR', message: err.message });
        }
    });

    // ── disconnect ─────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
        console.log(`[admin] Admin desconectado: ${socket.id}`);
        // En MVP: si el admin se desconecta, la sala queda "huérfana" pero activa.
        // Los jugadores siguen conectados. El admin puede reconectar.
    });
}

// ─── Helper privado ──────────────────────────────────────────────────────────

/**
 * Obtiene la sala y valida que exista. Emite error si no.
 * @param {import('socket.io').Socket} socket
 * @param {string} roomId
 * @returns {import('../roomManager/Room')|null}
 */
function _getRoom(socket, roomId) {
    const id = roomId || socket.data.roomId;
    const room = roomManager.getRoom(id);
    if (!room) {
        broadcaster.emitError(socket.id, { code: 'ROOM_NOT_FOUND', message: `Sala "${id}" no encontrada.` });
        return null;
    }
    return room;
}

module.exports = { registerAdminHandlers };

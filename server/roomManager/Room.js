/**
 * Room.js
 * Representa una sala de juego activa.
 *
 * Responsabilidades:
 *   - Almacenar el estado completo de la sala (jugadores, bolas, ronda).
 *   - Delegar toda la lógica de juego al gameEngine (nunca la implementa aquí).
 *   - Proveer métodos de acceso y mutación controlados.
 *
 * REGLA: Room.js NO importa Socket.IO. Solo gestiona datos.
 */

const engine = require('../gameEngine/index');
const PlayerSession = require('./PlayerSession');
const { DEFAULT_NICKNAMES } = require('../config/nicknames');
const { SESSION_TYPES, MARKING_MODES, MAX_PLAYERS } = require('../config/constants');

class Room {
    /**
     * @param {object} params
     * @param {string} params.roomId
     * @param {string} params.sessionType  - 'single' | 'continuous'
     * @param {string} params.markingMode  - 'auto' | 'manual'
     */
    constructor({ roomId, sessionType, markingMode }) {
        this.roomId = roomId;
        this.sessionType = sessionType || SESSION_TYPES.SINGLE;
        this.markingMode = markingMode || MARKING_MODES.AUTO;

        // Estado del juego
        this.state = engine.GAME_STATES.LOBBY;
        this.roundNumber = 1;

        // Bolas
        this.pool = [];          // pool mutable de bolas restantes
        this.drawnNumbers = [];          // historial de números sorteados
        this.currentBall = null;        // { number, column, nickname, remaining }

        // Jugadores: Map<playerId, PlayerSession>
        this.players = new Map();

        // Unicidad de cartones: Set<cardHash>
        this.usedCardHashes = new Set();

        // Apodos (copia mutable del diccionario base)
        this.nicknames = { ...DEFAULT_NICKNAMES };

        // Desempate
        this.tiedPlayers = [];          // [{ playerId, playerName }]
        this.tieWinner = null;        // { playerId, playerName }

        // Jugadores expulsados (baneados durante el juego)
        this.bannedPlayers = new Set();

        // Configuración
        this.speechEnabled = false;
        this.maxPlayers = MAX_PLAYERS;

        // Info pública para la TV (se asigna desde adminHandlers tras crear la sala)
        this.joinUrl = null;
        this.qrBase64 = null;

        this.createdAt = new Date();
    }

    // ─── Jugadores ─────────────────────────────────────────────────────────────

    /**
     * Agrega un jugador nuevo o reconecta uno existente.
     * @param {string} playerId
     * @param {string} socketId
     * @param {string} [playerName]
     * @returns {{ session: PlayerSession, isNew: boolean, error?: string }}
     */
    addOrReconnectPlayer(playerId, socketId, playerName) {
        // Verificar si el jugador está baneado
        if (this.bannedPlayers.has(playerId)) {
            return { session: null, isNew: false, error: 'Has sido expulsado de esta sala.' };
        }

        // Reconexión: el jugador ya tiene sesión
        if (this.players.has(playerId)) {
            const session = this.players.get(playerId);
            session.reconnect(socketId);
            if (playerName) session.playerName = playerName;
            return { session, isNew: false };
        }

        // Jugador nuevo: verificar límite
        if (this.players.size >= this.maxPlayers) {
            return { session: null, isNew: true, error: `Sala llena (máximo ${this.maxPlayers} jugadores).` };
        }

        // Generar cartón único
        const { card, hash } = engine.generateUniqueCard(this.usedCardHashes);
        this.usedCardHashes.add(hash);

        const session = new PlayerSession({ playerId, socketId, playerName, card, cardHash: hash });
        this.players.set(playerId, session);

        return { session, isNew: true };
    }

    /**
     * Expulsa un jugador de la sala.
     * Si el juego ya inició (no está en LOBBY), lo banea permanentemente.
     * @param {string} playerId
     * @returns {{ session: PlayerSession|null, banned: boolean }}
     */
    kickPlayer(playerId) {
        const session = this.players.get(playerId);
        if (!session) return { session: null, banned: false };

        const banned = this.state !== engine.GAME_STATES.LOBBY;
        if (banned) {
            this.bannedPlayers.add(playerId);
        }

        // Liberar el hash del cartón
        if (session.cardHash) {
            this.usedCardHashes.delete(session.cardHash);
        }

        // Eliminar la sesión
        this.players.delete(playerId);

        return { session, banned };
    }

    /**
     * Marca un jugador como desconectado (sin eliminar su sesión).
     * @param {string} socketId
     * @returns {PlayerSession|null}
     */
    disconnectBySocketId(socketId) {
        for (const session of this.players.values()) {
            if (session.socketId === socketId) {
                session.disconnect();
                return session;
            }
        }
        return null;
    }

    /**
     * Busca una sesión por socketId.
     * @param {string} socketId
     * @returns {PlayerSession|undefined}
     */
    getSessionBySocketId(socketId) {
        for (const session of this.players.values()) {
            if (session.socketId === socketId) return session;
        }
        return undefined;
    }

    /** Retorna la lista pública de jugadores (sin datos sensibles). */
    getPublicPlayers() {
        return Array.from(this.players.values()).map(s => s.toPublic(this.drawnNumbers));
    }

    /** Retorna el conteo de jugadores conectados. */
    get connectedCount() {
        return Array.from(this.players.values()).filter(s => s.isConnected).length;
    }

    // ─── Estado del juego ──────────────────────────────────────────────────────

    /**
     * Transiciona el estado del juego.
     * Delega la validación al gameEngine (lanza Error si inválida).
     * @param {string} nextState
     */
    transitionTo(nextState) {
        this.state = engine.transition(this.state, nextState);
    }

    // ─── Bolas ─────────────────────────────────────────────────────────────────

    /** Inicializa el pool de bolas para una nueva ronda. */
    initPool() {
        this.pool = engine.createPool();
        this.drawnNumbers = [];
        this.currentBall = null;
    }

    /**
     * Sortea la siguiente bola.
     * @returns {{ number, column, nickname, remaining } | null}
     */
    drawNextBall() {
        const ball = engine.drawBall(this.pool, this.nicknames);
        if (ball) {
            this.drawnNumbers.push(ball.number);
            this.currentBall = ball;
        }
        return ball;
    }

    // ─── Marcado ───────────────────────────────────────────────────────────────

    /**
     * Aplica marcado automático a todos los cartones de jugadores conectados.
     * @param {number} number - Número recién sorteado.
     */
    applyAutoMarkToAll(number) {
        for (const session of this.players.values()) {
            session.updateCard(engine.applyAutoMark(session.card, number));
        }
    }

    /**
     * Valida y aplica marcado manual de un jugador.
     * @param {string} playerId
     * @param {number} number
     * @returns {{ valid: boolean, error?: string }}
     */
    applyManualMark(playerId, number) {
        const session = this.players.get(playerId);
        if (!session) return { valid: false, error: 'Jugador no encontrado.' };

        const result = engine.validateManualMark(number, this.drawnNumbers, session.card);
        if (!result.valid) return result;

        session.updateCard(engine.applyManualMark(session.card, number));
        return { valid: true };
    }

    // ─── Ganadores ─────────────────────────────────────────────────────────────

    /**
     * Evalúa todos los cartones y retorna ganadores (Blackout).
     * @returns {{ winners: Array<{ playerId, playerName }>, hasWinner: boolean }}
     */
    checkWinners() {
        return engine.detectWinners(this.players);
    }

    /**
     * Prepara el estado de empate con los jugadores empatados.
     * @param {Array<{ playerId, playerName }>} winners
     */
    setTie(winners) {
        this.tiedPlayers = winners;
        this.tieWinner = null;
    }

    /**
     * Selecciona el ganador del desempate (antes de la animación).
     * @returns {{ playerId, playerName }}
     */
    resolveTie() {
        this.tieWinner = engine.selectTieBreakWinner(this.tiedPlayers);
        return this.tieWinner;
    }

    // ─── Apodos ────────────────────────────────────────────────────────────────

    /**
     * Actualiza el apodo de un número en runtime.
     * @param {number} number
     * @param {string} nickname
     */
    updateNickname(number, nickname) {
        this.nicknames[number] = nickname;
        // Si es el número actual, actualizar también currentBall
        if (this.currentBall && this.currentBall.number === number) {
            this.currentBall = { ...this.currentBall, nickname };
        }
    }

    // ─── Nueva ronda ───────────────────────────────────────────────────────────

    /**
     * Reinicia la sala para una nueva ronda (sesión continua).
     * - Genera cartones nuevos para todos los jugadores.
     * - Limpia el pool y el historial de bolas.
     * - No elimina jugadores.
     */
    resetForNewRound() {
        this.roundNumber++;
        this.usedCardHashes = new Set();
        this.tiedPlayers = [];
        this.tieWinner = null;

        // Asignar cartones nuevos a todos los jugadores
        for (const session of this.players.values()) {
            const { card, hash } = engine.generateUniqueCard(this.usedCardHashes);
            this.usedCardHashes.add(hash);
            session.card = card;
            session.cardHash = hash;
        }

        this.initPool();
        this.transitionTo(engine.GAME_STATES.LOBBY);
    }

    // ─── Serialización ─────────────────────────────────────────────────────────

    /** Estado público de la sala (para game_state_update). */
    toPublicState() {
        // Cuántos jugadores tienen en su cartón el número actual sorteado
        let coincidencias = 0;
        if (this.currentBall) {
            const num = this.currentBall.number;
            for (const session of this.players.values()) {
                if (session.card) {
                    const hasNum = session.card.flat().some(c => !c.free && c.number === num);
                    if (hasNum) coincidencias++;
                }
            }
        }

        return {
            roomId: this.roomId,
            state: this.state,
            sessionType: this.sessionType,
            markingMode: this.markingMode,
            roundNumber: this.roundNumber,
            drawnNumbers: this.drawnNumbers,
            currentBall: this.currentBall,
            players: this.getPublicPlayers(),
            tiedPlayers: this.tiedPlayers,
            speechEnabled: this.speechEnabled,
            coincidencias,
            // Info para TV
            joinUrl: this.joinUrl,
            qrBase64: this.qrBase64,
        };
    }
}

module.exports = Room;

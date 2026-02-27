/**
 * PlayerSession.js
 * Representa la sesión de un jugador dentro de una sala.
 *
 * Responsabilidades:
 *   - Asociar playerId (UUID persistente) con socketId (efímero).
 *   - Almacenar el cartón asignado al jugador.
 *   - Gestionar el estado de conexión para reconexión.
 *
 * IMPORTANTE: playerId es la identidad permanente.
 * socketId cambia en cada reconexión y NO debe usarse como clave.
 */

class PlayerSession {
    /**
     * @param {object} params
     * @param {string} params.playerId   - UUID generado en el cliente (localStorage).
     * @param {string} params.socketId   - ID de socket actual (cambia en reconexión).
     * @param {string} params.playerName - Nombre opcional del jugador.
     * @param {import('../gameEngine/cardGenerator').Cell[][]} params.card - Cartón asignado.
     * @param {string} params.cardHash   - Hash SHA-256 del cartón.
     */
    constructor({ playerId, socketId, playerName, card, cardHash }) {
        this.playerId = playerId;
        this.socketId = socketId;
        this.playerName = playerName || `Jugador-${playerId.slice(0, 4).toUpperCase()}`;
        this.card = card;
        this.cardHash = cardHash;
        this.isConnected = true;
        this.joinedAt = new Date();
    }

    /**
     * Actualiza el socketId cuando el jugador reconecta.
     * @param {string} newSocketId
     */
    reconnect(newSocketId) {
        this.socketId = newSocketId;
        this.isConnected = true;
    }

    /** Marca al jugador como desconectado (sin eliminar su sesión). */
    disconnect() {
        this.isConnected = false;
    }

    /**
     * Actualiza el cartón del jugador (tras marcado auto o manual).
     * @param {import('../gameEngine/cardGenerator').Cell[][]} newCard
     */
    updateCard(newCard) {
        this.card = newCard;
    }

    /**
     * Serializa la sesión para enviar al cliente (sin datos sensibles).
     * @param {number[]} [drawnNumbers=[]] - Números sorteados hasta ahora.
     */
    toPublic(drawnNumbers = []) {
        const cells = this.card ? this.card.flat() : [];

        // Cuántas celdas tiene marcadas (máx 25)
        const markedCount = cells.filter(cell => cell.marked).length;

        // Números sorteados que están en el cartón pero NO están marcados
        const cardNumbers = new Set(cells.filter(c => !c.free).map(c => c.number));
        const pendingNumbers = drawnNumbers.filter(
            n => cardNumbers.has(n) && !cells.find(c => c.number === n)?.marked
        );

        return {
            playerId: this.playerId,
            playerName: this.playerName,
            isConnected: this.isConnected,
            joinedAt: this.joinedAt,
            markedCount,             // cuántas celdas tiene marcadas (máx 25)
            pendingCount: pendingNumbers.length,
            pendingNumbers,          // números pendientes de marcar
        };
    }
}

module.exports = PlayerSession;

/**
 * validator.js
 * Módulo puro de validación del juego.
 * No depende de Socket.IO ni Express.
 *
 * Responsabilidades:
 *   - Validar si un número puede ser marcado manualmente.
 *   - Detectar si un cartón tiene Blackout completo (todas las celdas marcadas).
 *   - Detectar ganadores entre todos los jugadores de una sala.
 */

const { wasDrawn } = require('./ballDrawer');

/**
 * Valida si un jugador puede marcar un número en modo manual.
 *
 * Condiciones para marcar:
 *   1. El número debe haber sido sorteado (está en drawnNumbers).
 *   2. La celda correspondiente en el cartón no debe estar ya marcada.
 *
 * @param {number} number - Número que el jugador quiere marcar.
 * @param {number[]} drawnNumbers - Números ya sorteados en la ronda.
 * @param {import('./cardGenerator').Cell[][]} card - Cartón del jugador.
 * @returns {{ valid: boolean, error?: string }}
 */
function validateManualMark(number, drawnNumbers, card) {
    if (!wasDrawn(number, drawnNumbers)) {
        return {
            valid: false,
            error: `El número ${number} aún no ha sido sorteado.`,
        };
    }

    // Buscar la celda en el cartón
    const cell = findCell(card, number);

    if (!cell) {
        return {
            valid: false,
            error: `El número ${number} no existe en este cartón.`,
        };
    }

    if (cell.marked) {
        return {
            valid: false,
            error: `El número ${number} ya está marcado en este cartón.`,
        };
    }

    return { valid: true };
}

/**
 * Aplica el marcado manual de un número sobre un cartón.
 * Retorna un nuevo cartón (inmutable).
 * Debe llamarse SOLO después de validateManualMark retorna { valid: true }.
 *
 * @param {import('./cardGenerator').Cell[][]} card
 * @param {number} number
 * @returns {import('./cardGenerator').Cell[][]}
 */
function applyManualMark(card, number) {
    return card.map(col =>
        col.map(cell => {
            if (cell.number === number && !cell.marked) {
                return { ...cell, marked: true };
            }
            return cell;
        })
    );
}

/**
 * Detecta si un cartón tiene Blackout completo.
 * Blackout: todas las celdas están marcadas (incluyendo el centro libre).
 *
 * @param {import('./cardGenerator').Cell[][]} card
 * @returns {boolean}
 */
function isBlackout(card) {
    return card.every(col => col.every(cell => cell.marked));
}

/**
 * Evalúa todos los jugadores de una sala y retorna los ganadores (Blackout).
 * Puede retornar múltiples ganadores si completaron en el mismo número.
 *
 * @param {Map<string, { card: import('./cardGenerator').Cell[][], playerName: string }>} players
 *   Map de playerId → { card, playerName }
 * @returns {{ winners: Array<{ playerId: string, playerName: string }>, hasWinner: boolean }}
 */
function detectWinners(players) {
    const winners = [];

    for (const [playerId, session] of players.entries()) {
        if (isBlackout(session.card)) {
            winners.push({ playerId, playerName: session.playerName });
        }
    }

    return {
        winners,
        hasWinner: winners.length > 0,
    };
}

/**
 * Selecciona un ganador al azar de una lista de empatados.
 * El resultado se determina ANTES de la animación (para consistencia).
 *
 * @param {Array<{ playerId: string, playerName: string }>} tiedPlayers
 * @returns {{ playerId: string, playerName: string }}
 * @throws {Error} Si la lista está vacía.
 */
function selectTieBreakWinner(tiedPlayers) {
    if (!tiedPlayers || tiedPlayers.length === 0) {
        throw new Error('[validator] No hay jugadores empatados para el desempate.');
    }

    const index = Math.floor(Math.random() * tiedPlayers.length);
    return tiedPlayers[index];
}

// ─── Helpers privados ────────────────────────────────────────────────────────

/**
 * Busca una celda en el cartón por número.
 * @param {import('./cardGenerator').Cell[][]} card
 * @param {number} number
 * @returns {import('./cardGenerator').Cell | undefined}
 */
function findCell(card, number) {
    for (const col of card) {
        for (const cell of col) {
            if (cell.number === number) return cell;
        }
    }
    return undefined;
}

module.exports = {
    validateManualMark,
    applyManualMark,
    isBlackout,
    detectWinners,
    selectTieBreakWinner,
};

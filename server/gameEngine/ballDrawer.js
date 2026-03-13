/**
 * ballDrawer.js
 * Módulo puro para el sorteo de bolas de Bingo 75.
 * No depende de Socket.IO ni Express.
 *
 * Responsabilidades:
 *   - Crear y mantener el pool de 75 bolas (1-75).
 *   - Sortear bolas sin repetición.
 *   - Determinar la columna (B/I/N/G/O) de cada número.
 *   - Retornar el apodo del número sorteado.
 */

const { COLUMN_RANGES, COLUMNS, TOTAL_BALLS } = require('../config/constants');

/**
 * Determina la columna BINGO de un número dado.
 * @param {number} number - Número entre 1 y 75.
 * @returns {string} Letra de columna: 'B' | 'I' | 'N' | 'G' | 'O'
 * @throws {Error} Si el número está fuera de rango.
 */
function getColumn(number) {
    for (const col of COLUMNS) {
        const { min, max } = COLUMN_RANGES[col];
        if (number >= min && number <= max) return col;
    }
    throw new Error(`[ballDrawer] Número fuera de rango: ${number}. Debe estar entre 1 y ${TOTAL_BALLS}.`);
}

/**
 * Crea un nuevo pool de sorteo con las 75 bolas en orden aleatorio.
 * Usa Fisher-Yates completo para máxima aleatoriedad.
 * @returns {number[]} Array de 75 números mezclados.
 */
function createPool() {
    const pool = Array.from({ length: TOTAL_BALLS }, (_, i) => i + 1);

    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool;
}

/**
 * Sortea la siguiente bola del pool.
 * Muta el array pool (extrae el último elemento).
 *
 * @param {number[]} pool - Pool mutable de bolas restantes.
 * @param {Record<number, string>} nicknames - Diccionario de apodos actual de la sala.
 * @returns {{ number: number, column: string, nickname: string, remaining: number } | null}
 *   Retorna null si el pool está vacío (todas las bolas sorteadas).
 */
function drawBall(pool, nicknames) {
    if (pool.length === 0) return null;

    const number = pool.pop();
    const column = getColumn(number);
    const nickname = nicknames[number] || `Número ${number}`;

    return {
        number,
        column,
        nickname,
        remaining: pool.length,
    };
}

/**
 * Verifica si un número ya fue sorteado.
 * @param {number} number
 * @param {number[]} drawnNumbers - Lista de números ya sorteados.
 * @returns {boolean}
 */
function wasDrawn(number, drawnNumbers) {
    return drawnNumbers.includes(number);
}

module.exports = {
    getColumn,
    createPool,
    drawBall,
    wasDrawn,
};

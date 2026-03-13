/**
 * cardGenerator.js
 * Generador de cartones de Bingo 75 (5x5).
 * Módulo puro: sin efectos secundarios, sin dependencias externas.
 *
 * Estructura del cartón:
 *   - 5 columnas: B(1-15), I(16-30), N(31-45), G(46-60), O(61-75)
 *   - 5 filas por columna, 5 números únicos por columna
 *   - Centro [fila 2][col 2] = celda libre (number: null, marked: true)
 *
 * Cada celda tiene forma:
 *   { number: number|null, column: string, marked: boolean }
 *
 * El cartón se representa como array de 5 columnas, cada una con 5 celdas:
 *   card[colIndex][rowIndex]
 */

const crypto = require('crypto');
const { COLUMN_RANGES, COLUMNS, CARD_SIZE, FREE_CELL_ROW, FREE_CELL_COL } = require('../config/constants');

/**
 * Genera un array de `count` números únicos aleatorios en el rango [min, max].
 * @param {number} min
 * @param {number} max
 * @param {number} count
 * @returns {number[]}
 */
function randomUniqueInRange(min, max, count) {
    const pool = [];
    for (let i = min; i <= max; i++) pool.push(i);

    // Fisher-Yates shuffle parcial
    for (let i = pool.length - 1; i > pool.length - 1 - count; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool.slice(pool.length - count);
}

/**
 * Genera un cartón 5x5 de Bingo 75.
 * @returns {{ card: Cell[][], hash: string }}
 *
 * @typedef {{ number: number|null, column: string, marked: boolean }} Cell
 */
function generateCard() {
    // card[colIndex][rowIndex]
    const card = [];

    COLUMNS.forEach((col, colIndex) => {
        const { min, max } = COLUMN_RANGES[col];
        const numbers = randomUniqueInRange(min, max, CARD_SIZE);

        const column = numbers.map((num, rowIndex) => {
            const isFreeCell = colIndex === FREE_CELL_COL && rowIndex === FREE_CELL_ROW;
            return {
                number: isFreeCell ? null : num,
                column: col,
                marked: isFreeCell, // centro libre marcado desde el inicio
            };
        });

        card.push(column);
    });

    const hash = hashCard(card);
    return { card, hash };
}

/**
 * Genera un hash SHA-256 del cartón para garantizar unicidad por sala.
 * @param {Cell[][]} card
 * @returns {string}
 */
function hashCard(card) {
    // Serializar solo los números (el estado "marked" no forma parte de la identidad)
    const numbers = card.map(col => col.map(cell => cell.number));
    const serialized = JSON.stringify(numbers);
    return crypto.createHash('sha256').update(serialized).digest('hex');
}

/**
 * Genera un cartón garantizando que su hash no esté en el Set de hashes usados.
 * Reintenta hasta maxAttempts veces antes de lanzar error.
 * @param {Set<string>} usedHashes - Hashes de cartones ya asignados en la sala.
 * @param {number} [maxAttempts=100]
 * @returns {{ card: Cell[][], hash: string }}
 * @throws {Error} Si no puede generar un cartón único tras maxAttempts intentos.
 */
function generateUniqueCard(usedHashes, maxAttempts = 100) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const { card, hash } = generateCard();
        if (!usedHashes.has(hash)) {
            return { card, hash };
        }
    }
    throw new Error(`[cardGenerator] No se pudo generar un cartón único tras ${maxAttempts} intentos.`);
}

/**
 * Aplica el marcado automático de un número sobre un cartón.
 * Retorna un nuevo cartón (inmutable) con las celdas actualizadas.
 * @param {Cell[][]} card
 * @param {number} drawnNumber
 * @returns {Cell[][]}
 */
function applyAutoMark(card, drawnNumber) {
    return card.map(col =>
        col.map(cell => {
            if (cell.number === drawnNumber && !cell.marked) {
                return { ...cell, marked: true };
            }
            return cell;
        })
    );
}

module.exports = {
    generateCard,
    generateUniqueCard,
    hashCard,
    applyAutoMark,
};

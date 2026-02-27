/**
 * constants.js
 * Configuración global del juego. Modificar aquí para ajustar reglas.
 */

/** Estados posibles del juego (máquina de estados centralizada) */
const GAME_STATES = {
    LOBBY: 'LOBBY',
    EN_JUEGO: 'EN_JUEGO',
    EMPATE: 'EMPATE',
    RULETA: 'RULETA',
    FINALIZADO: 'FINALIZADO',
    CERRADO: 'CERRADO',
};

/** Transiciones válidas entre estados */
const VALID_TRANSITIONS = {
    [GAME_STATES.LOBBY]: [GAME_STATES.EN_JUEGO],
    [GAME_STATES.EN_JUEGO]: [GAME_STATES.EMPATE, GAME_STATES.FINALIZADO],
    [GAME_STATES.EMPATE]: [GAME_STATES.RULETA],
    [GAME_STATES.RULETA]: [GAME_STATES.FINALIZADO],
    [GAME_STATES.FINALIZADO]: [GAME_STATES.LOBBY, GAME_STATES.CERRADO],
    [GAME_STATES.CERRADO]: [], // estado terminal
};

/** Rangos de números por columna (Bingo 75) */
const COLUMN_RANGES = {
    B: { min: 1, max: 15 },
    I: { min: 16, max: 30 },
    N: { min: 31, max: 45 },
    G: { min: 46, max: 60 },
    O: { min: 61, max: 75 },
};

/** Orden de columnas */
const COLUMNS = ['B', 'I', 'N', 'G', 'O'];

/** Número total de bolas */
const TOTAL_BALLS = 75;

/** Tamaño del cartón (5x5) */
const CARD_SIZE = 5;

/** Índice de la celda central (fila 2, columna 2 → índice [2][2]) */
const FREE_CELL_ROW = 2;
const FREE_CELL_COL = 2;

/** Máximo de jugadores por sala (configurable) */
const MAX_PLAYERS = parseInt(process.env.MAX_PLAYERS || '20', 10);

/** Puerto del servidor */
const PORT = parseInt(process.env.PORT || '3000', 10);

/** Puerto del cliente React (5173 en dev, igual al PORT en producción) */
const CLIENT_PORT = parseInt(process.env.CLIENT_PORT || process.env.PORT || '3000', 10);

/** Tipos de sesión */
const SESSION_TYPES = {
    SINGLE: 'single',
    CONTINUOUS: 'continuous',
};

/** Modos de marcado */
const MARKING_MODES = {
    AUTO: 'auto',
    MANUAL: 'manual',
};

module.exports = {
    GAME_STATES,
    VALID_TRANSITIONS,
    COLUMN_RANGES,
    COLUMNS,
    TOTAL_BALLS,
    CARD_SIZE,
    FREE_CELL_ROW,
    FREE_CELL_COL,
    MAX_PLAYERS,
    PORT,
    CLIENT_PORT,
    SESSION_TYPES,
    MARKING_MODES,
};

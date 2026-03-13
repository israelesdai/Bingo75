/**
 * gameEngine/index.js
 * API pública del motor del juego.
 *
 * Este módulo es el único punto de entrada al gameEngine.
 * El socketGateway y roomManager SOLO deben importar desde aquí,
 * nunca directamente desde los submódulos internos.
 *
 * El gameEngine NO tiene estado propio: opera sobre los datos
 * que le pasa el roomManager (Room, PlayerSession).
 * Esto lo hace completamente testeable y sin efectos secundarios.
 */

const stateMachine = require('./stateMachine');
const cardGenerator = require('./cardGenerator');
const ballDrawer = require('./ballDrawer');
const validator = require('./validator');

module.exports = {
    // ── Máquina de estados ──────────────────────────────────────────────────
    /** Verifica si una transición es válida sin ejecutarla. */
    canTransition: stateMachine.canTransition,
    /** Ejecuta una transición. Lanza Error si no es válida. */
    transition: stateMachine.transition,
    /** Retorna true si el estado es terminal (CERRADO). */
    isTerminal: stateMachine.isTerminal,
    /** Retorna los estados permitidos desde el estado actual. */
    getAllowedTransitions: stateMachine.getAllowedTransitions,
    /** Objeto con todos los estados posibles. */
    GAME_STATES: stateMachine.GAME_STATES,

    // ── Generación de cartones ──────────────────────────────────────────────
    /** Genera un cartón 5x5 con hash. */
    generateCard: cardGenerator.generateCard,
    /** Genera un cartón único (no repetido en la sala). */
    generateUniqueCard: cardGenerator.generateUniqueCard,
    /** Calcula el hash SHA-256 de un cartón. */
    hashCard: cardGenerator.hashCard,
    /** Aplica marcado automático sobre un cartón (inmutable). */
    applyAutoMark: cardGenerator.applyAutoMark,

    // ── Sorteo de bolas ─────────────────────────────────────────────────────
    /** Crea el pool de 75 bolas mezcladas. */
    createPool: ballDrawer.createPool,
    /** Sortea la siguiente bola del pool. */
    drawBall: ballDrawer.drawBall,
    /** Verifica si un número ya fue sorteado. */
    wasDrawn: ballDrawer.wasDrawn,
    /** Determina la columna BINGO de un número. */
    getColumn: ballDrawer.getColumn,

    // ── Validación ──────────────────────────────────────────────────────────
    /** Valida si un jugador puede marcar un número en modo manual. */
    validateManualMark: validator.validateManualMark,
    /** Aplica marcado manual sobre un cartón (inmutable). */
    applyManualMark: validator.applyManualMark,
    /** Detecta si un cartón tiene Blackout completo. */
    isBlackout: validator.isBlackout,
    /** Evalúa todos los jugadores y retorna los ganadores. */
    detectWinners: validator.detectWinners,
    /** Selecciona ganador al azar del desempate. */
    selectTieBreakWinner: validator.selectTieBreakWinner,
};

/**
 * stateMachine.js
 * Máquina de estados centralizada del juego.
 * No depende de Socket.IO ni Express.
 * Toda transición de estado pasa por aquí.
 */

const { GAME_STATES, VALID_TRANSITIONS } = require('../config/constants');

/**
 * Verifica si una transición de estado es válida.
 * @param {string} currentState - Estado actual del juego.
 * @param {string} nextState - Estado al que se quiere transicionar.
 * @returns {{ valid: boolean, error?: string }}
 */
function canTransition(currentState, nextState) {
    const allowed = VALID_TRANSITIONS[currentState];

    if (!allowed) {
        return { valid: false, error: `Estado desconocido: "${currentState}"` };
    }

    if (!allowed.includes(nextState)) {
        return {
            valid: false,
            error: `Transición inválida: "${currentState}" → "${nextState}". Permitidas: [${allowed.join(', ')}]`,
        };
    }

    return { valid: true };
}

/**
 * Ejecuta una transición de estado.
 * Lanza un Error si la transición no es válida.
 * @param {string} currentState - Estado actual.
 * @param {string} nextState - Estado destino.
 * @returns {string} El nuevo estado confirmado.
 * @throws {Error} Si la transición no está permitida.
 */
function transition(currentState, nextState) {
    const result = canTransition(currentState, nextState);

    if (!result.valid) {
        throw new Error(`[stateMachine] ${result.error}`);
    }

    return nextState;
}

/**
 * Verifica si un estado es terminal (no puede transicionar a ningún otro).
 * @param {string} state
 * @returns {boolean}
 */
function isTerminal(state) {
    const allowed = VALID_TRANSITIONS[state];
    return Array.isArray(allowed) && allowed.length === 0;
}

/**
 * Retorna los estados a los que se puede transicionar desde el estado actual.
 * @param {string} currentState
 * @returns {string[]}
 */
function getAllowedTransitions(currentState) {
    return VALID_TRANSITIONS[currentState] || [];
}

module.exports = {
    GAME_STATES,
    canTransition,
    transition,
    isTerminal,
    getAllowedTransitions,
};

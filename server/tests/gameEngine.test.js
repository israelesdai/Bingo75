/**
 * tests/gameEngine.test.js
 * Test de integración del gameEngine — Node.js puro (sin frameworks).
 *
 * Ejecutar con: node tests/gameEngine.test.js
 *
 * Valida:
 *   1. Generación de cartones (estructura, rangos, unicidad, centro libre)
 *   2. Sorteo de bolas (sin repetición, columna correcta)
 *   3. Marcado automático y manual
 *   4. Detección de Blackout
 *   5. Detección de ganadores y desempate
 *   6. Máquina de estados (transiciones válidas e inválidas)
 */

const engine = require('../gameEngine/index');
const { DEFAULT_NICKNAMES } = require('../config/nicknames');
const { COLUMNS, COLUMN_RANGES, CARD_SIZE } = require('../config/constants');

// ─── Utilidades de test ──────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ ${message}`);
        passed++;
    } else {
        console.error(`  ❌ FALLO: ${message}`);
        failed++;
    }
}

function assertThrows(fn, message) {
    try {
        fn();
        console.error(`  ❌ FALLO (no lanzó error): ${message}`);
        failed++;
    } catch (e) {
        console.log(`  ✅ ${message} → "${e.message}"`);
        passed++;
    }
}

function section(title) {
    console.log(`\n📋 ${title}`);
    console.log('─'.repeat(50));
}

// ─── Tests ───────────────────────────────────────────────────────────────────

section('1. Generación de cartones');

const { card, hash } = engine.generateCard();

assert(Array.isArray(card), 'El cartón es un array');
assert(card.length === 5, 'El cartón tiene 5 columnas');
assert(card.every(col => col.length === 5), 'Cada columna tiene 5 celdas');

// Verificar rangos por columna
COLUMNS.forEach((col, colIndex) => {
    const { min, max } = COLUMN_RANGES[col];
    const cells = card[colIndex];
    const nonFreeCells = cells.filter(c => c.number !== null);
    assert(
        nonFreeCells.every(c => c.number >= min && c.number <= max),
        `Columna ${col}: todos los números están en rango [${min}-${max}]`
    );
    assert(
        cells.every(c => c.column === col),
        `Columna ${col}: todas las celdas tienen column="${col}"`
    );
});

// Centro libre
const freeCell = card[2][2];
assert(freeCell.number === null, 'Centro [2][2] tiene number=null');
assert(freeCell.marked === true, 'Centro [2][2] está marcado desde el inicio');

// Unicidad de números dentro del cartón
const allNumbers = card.flatMap(col => col.map(c => c.number).filter(n => n !== null));
const uniqueNumbers = new Set(allNumbers);
assert(uniqueNumbers.size === allNumbers.length, 'No hay números repetidos en el cartón');
assert(allNumbers.length === 24, 'El cartón tiene 24 números + 1 centro libre = 25 celdas');

// Hash
assert(typeof hash === 'string' && hash.length === 64, 'Hash SHA-256 tiene 64 caracteres');

section('2. Unicidad de cartones');

const usedHashes = new Set();
const cards = [];
for (let i = 0; i < 10; i++) {
    const result = engine.generateUniqueCard(usedHashes);
    usedHashes.add(result.hash);
    cards.push(result);
}
assert(usedHashes.size === 10, 'Se generaron 10 cartones con hashes únicos');

section('3. Sorteo de bolas');

const pool = engine.createPool();
assert(pool.length === 75, 'El pool inicial tiene 75 bolas');

const drawnNumbers = [];
const result1 = engine.drawBall(pool, DEFAULT_NICKNAMES);
assert(result1 !== null, 'drawBall retorna resultado');
assert(result1.number >= 1 && result1.number <= 75, `Número sorteado en rango: ${result1.number}`);
assert(['B', 'I', 'N', 'G', 'O'].includes(result1.column), `Columna correcta: ${result1.column}`);
assert(typeof result1.nickname === 'string', 'Tiene apodo');
assert(result1.remaining === 74, 'Quedan 74 bolas');
drawnNumbers.push(result1.number);

// Sortear todas las bolas restantes
let lastResult;
while (pool.length > 0) {
    lastResult = engine.drawBall(pool, DEFAULT_NICKNAMES);
    drawnNumbers.push(lastResult.number);
}
assert(drawnNumbers.length === 75, 'Se sortearon exactamente 75 bolas');
assert(new Set(drawnNumbers).size === 75, 'No hay bolas repetidas');

const emptyResult = engine.drawBall(pool, DEFAULT_NICKNAMES);
assert(emptyResult === null, 'drawBall retorna null cuando el pool está vacío');

section('4. Marcado automático');

const { card: card2 } = engine.generateCard();
const testNumber = card2[0][0].number; // primer número de columna B (no es centro)

const markedCard = engine.applyAutoMark(card2, testNumber);
const markedCell = markedCard[0][0];
assert(markedCell.marked === true, `Celda con número ${testNumber} fue marcada automáticamente`);

// Inmutabilidad: el cartón original no fue modificado
assert(card2[0][0].marked === false, 'El cartón original no fue mutado (inmutabilidad)');

section('5. Marcado manual y validación');

const { card: card3 } = engine.generateCard();
const drawn = [card3[0][0].number, card3[1][0].number]; // dos números sorteados

// Marcado válido
const validResult = engine.validateManualMark(drawn[0], drawn, card3);
assert(validResult.valid === true, 'Marcado manual válido para número sorteado');

// Número no sorteado
const notDrawn = engine.validateManualMark(card3[3][0].number, drawn, card3);
assert(notDrawn.valid === false, 'Marcado rechazado: número no sorteado');

// Aplicar marcado manual
const card3Marked = engine.applyManualMark(card3, drawn[0]);
// Intentar marcar de nuevo
const alreadyMarked = engine.validateManualMark(drawn[0], drawn, card3Marked);
assert(alreadyMarked.valid === false, 'Marcado rechazado: celda ya marcada');

section('6. Detección de Blackout');

// Cartón sin Blackout
assert(engine.isBlackout(card3) === false, 'Cartón nuevo no tiene Blackout');

// Crear cartón con Blackout (marcar todos los números)
const { card: card4 } = engine.generateCard();
const allNums = card4.flatMap(col => col.map(c => c.number).filter(n => n !== null));
let blackoutCard = card4;
for (const num of allNums) {
    blackoutCard = engine.applyAutoMark(blackoutCard, num);
}
assert(engine.isBlackout(blackoutCard) === true, 'Cartón con todos los números marcados tiene Blackout');

section('7. Detección de ganadores');

const players = new Map([
    ['player-1', { card: blackoutCard, playerName: 'Ana' }],
    ['player-2', { card: card3, playerName: 'Bob' }],
]);

const { winners, hasWinner } = engine.detectWinners(players);
assert(hasWinner === true, 'Se detectó al menos un ganador');
assert(winners.length === 1, 'Solo un ganador (Ana)');
assert(winners[0].playerId === 'player-1', 'El ganador es player-1 (Ana)');

// Sin ganadores
const { hasWinner: noWinner } = engine.detectWinners(new Map([
    ['p1', { card: card3, playerName: 'Bob' }],
]));
assert(noWinner === false, 'Sin ganadores cuando ningún cartón tiene Blackout');

section('8. Desempate');

const tied = [
    { playerId: 'p1', playerName: 'Ana' },
    { playerId: 'p2', playerName: 'Bob' },
    { playerId: 'p3', playerName: 'Carlos' },
];

const tieWinner = engine.selectTieBreakWinner(tied);
assert(tied.some(p => p.playerId === tieWinner.playerId), 'El ganador del desempate está en la lista de empatados');

assertThrows(
    () => engine.selectTieBreakWinner([]),
    'selectTieBreakWinner lanza error con lista vacía'
);

section('9. Máquina de estados');

// Transiciones válidas
assert(engine.canTransition('LOBBY', 'EN_JUEGO').valid === true, 'LOBBY → EN_JUEGO es válida');
assert(engine.canTransition('EN_JUEGO', 'EMPATE').valid === true, 'EN_JUEGO → EMPATE es válida');
assert(engine.canTransition('EN_JUEGO', 'FINALIZADO').valid === true, 'EN_JUEGO → FINALIZADO es válida');
assert(engine.canTransition('EMPATE', 'RULETA').valid === true, 'EMPATE → RULETA es válida');
assert(engine.canTransition('RULETA', 'FINALIZADO').valid === true, 'RULETA → FINALIZADO es válida');
assert(engine.canTransition('FINALIZADO', 'LOBBY').valid === true, 'FINALIZADO → LOBBY es válida (sesión continua)');
assert(engine.canTransition('FINALIZADO', 'CERRADO').valid === true, 'FINALIZADO → CERRADO es válida (sesión única)');

// Transiciones inválidas
assert(engine.canTransition('LOBBY', 'FINALIZADO').valid === false, 'LOBBY → FINALIZADO es inválida');
assert(engine.canTransition('CERRADO', 'LOBBY').valid === false, 'CERRADO → LOBBY es inválida (terminal)');
assert(engine.canTransition('EN_JUEGO', 'LOBBY').valid === false, 'EN_JUEGO → LOBBY es inválida');

// transition() lanza error
assertThrows(
    () => engine.transition('LOBBY', 'CERRADO'),
    'transition() lanza Error en transición inválida'
);

// transition() retorna el nuevo estado
const newState = engine.transition('LOBBY', 'EN_JUEGO');
assert(newState === 'EN_JUEGO', 'transition() retorna el nuevo estado correcto');

// Estado terminal
assert(engine.isTerminal('CERRADO') === true, 'CERRADO es estado terminal');
assert(engine.isTerminal('LOBBY') === false, 'LOBBY no es estado terminal');

// ─── Resumen ─────────────────────────────────────────────────────────────────

console.log('\n' + '═'.repeat(50));
console.log(`📊 RESULTADO: ${passed} pasados, ${failed} fallidos`);
if (failed === 0) {
    console.log('🎉 Todos los tests pasaron correctamente.');
} else {
    console.log('⚠️  Hay tests fallidos. Revisar antes de continuar.');
    process.exit(1);
}

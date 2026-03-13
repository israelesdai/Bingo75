/**
 * BingoCard.jsx
 * Cartón 5x5 interactivo — Mobile First.
 *
 * Modos:
 *   - auto:   celdas marcadas automáticamente por el servidor (no clickeables).
 *   - manual: el jugador toca para marcar; el servidor valida.
 *
 * El cartón se indexa como card[colIndex][rowIndex] (5 columnas × 5 filas).
 * Se renderiza transpuesto: 5 filas × 5 columnas para visualización natural.
 */

import styles from './Play.module.css';

const COLUMNS = ['B', 'I', 'N', 'G', 'O'];

export default function BingoCard({ card, markingMode, drawnNumbers = [], onMarkNumber, lastMarkedNumber }) {
    if (!card) return null;

    const drawnSet = new Set(drawnNumbers);

    // Transponer: de card[col][row] a filas[row][col]
    const rows = Array.from({ length: 5 }, (_, rowIndex) =>
        card.map((col) => col[rowIndex])
    );

    const handleCellClick = (cell) => {
        if (markingMode !== 'manual') return;
        if (cell.number === null) return;   // centro libre
        if (cell.marked) return;            // ya marcada
        if (!drawnSet.has(cell.number)) return; // número no sorteado
        onMarkNumber(cell.number);
    };

    return (
        <div className={styles.cardWrapper}>
            {/* Cabeceras de columna */}
            <div className={styles.cardHeader}>
                {COLUMNS.map(col => (
                    <div
                        key={col}
                        className={styles.cardColHeader}
                        style={{ '--col-color': `var(--color-${col})` }}
                    >
                        {col}
                    </div>
                ))}
            </div>

            {/* Filas del cartón */}
            <div className={styles.cardGrid}>
                {rows.map((row, rowIndex) =>
                    row.map((cell, colIndex) => {
                        const isFree = cell.number === null;
                        const isMarked = cell.marked;
                        const isDrawn = cell.number !== null && drawnSet.has(cell.number);
                        const isLast = cell.number === lastMarkedNumber;
                        const canMark = markingMode === 'manual' && !isMarked && isDrawn && !isFree;

                        return (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className={`
                  ${styles.cardCell}
                  ${isFree ? styles.cardCellFree : ''}
                  ${isMarked ? styles.cardCellMarked : ''}
                  ${canMark ? styles.cardCellCanMark : ''}
                  ${isLast ? styles.cardCellLast : ''}
                `}
                                style={{
                                    '--cell-color': isFree ? 'var(--color-primary)' : `var(--color-${cell.column})`,
                                }}
                                onClick={() => handleCellClick(cell)}
                                role={canMark ? 'button' : undefined}
                                aria-label={isFree ? 'Centro libre' : `${cell.column}-${cell.number}${isMarked ? ' (marcado)' : ''}`}
                            >
                                {isFree ? (
                                    <span className={styles.freeCell}>FREE</span>
                                ) : (
                                    <>
                                        <span className={styles.cellNumber}>{cell.number}</span>
                                        {/* Removed redundant checkmark for cleaner look, or can keep it if desired. The image doesn't explicitly show checkmarks, just highlighted cells. keeping checkmark for accessibility/clarity but maybe styling it differently in CSS if needed. */}
                                    </>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

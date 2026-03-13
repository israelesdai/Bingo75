/**
 * BingoBoard.jsx
 * Grid completo 1-75 organizado en columnas B-I-N-G-O.
 * Resalta números sorteados y el número actual.
 */

import styles from './TV.module.css';

const COLUMNS = ['B', 'I', 'N', 'G', 'O'];
const RANGES = { B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75] };

export default function BingoBoard({ drawnNumbers = [], currentBall }) {
    const drawnSet = new Set(drawnNumbers);

    return (
        <div className={styles.bingoBoard}>
            {COLUMNS.map(col => {
                const [min, max] = RANGES[col];
                const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);

                return (
                    <div key={col} className={styles.boardColumn}>
                        {/* Cabecera de columna */}
                        <div
                            className={styles.boardColHeader}
                            style={{ color: `var(--color-${col})`, borderColor: `var(--color-${col})` }}
                        >
                            {col}
                        </div>

                        {/* Números */}
                        {nums.map(n => {
                            const isDrawn = drawnSet.has(n);
                            const isCurrent = currentBall?.number === n;

                            return (
                                <div
                                    key={n}
                                    className={`
                    ${styles.boardCell}
                    ${isDrawn ? styles.boardCellDrawn : ''}
                    ${isCurrent ? styles.boardCellCurrent : ''}
                  `}
                                    style={isDrawn ? {
                                        background: `var(--color-${col})22`,
                                        color: `var(--color-${col})`,
                                        borderColor: `var(--color-${col})55`,
                                        boxShadow: isCurrent ? `0 0 20px var(--color-${col})` : 'none',
                                    } : {}}
                                >
                                    {n}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}

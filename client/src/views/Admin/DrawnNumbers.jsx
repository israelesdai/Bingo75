/**
 * DrawnNumbers.jsx
 * Historial visual de números sorteados, agrupados por columna BINGO.
 */

import styles from './Admin.module.css';

const COLUMNS = ['B', 'I', 'N', 'G', 'O'];
const RANGES = { B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75] };

export default function DrawnNumbers({ drawnNumbers = [], currentBall }) {
    const drawnSet = new Set(drawnNumbers);

    return (
        <div className={`card-glass ${styles.drawnCard}`}>
            <div className={styles.drawnHeader}>
                <h3 className={styles.sectionTitle}>🎱 Números Sorteados</h3>
                <span className="text-muted text-sm">{drawnNumbers.length} / 75</span>
            </div>

            {/* Últimos 5 números sorteados */}
            {drawnNumbers.length > 0 ? (
                <div className={`${styles.recentBallsRow} animate-scale-in`}>
                    {[...drawnNumbers].reverse().slice(0, 5).map((num, index) => {
                        const col = num <= 15 ? 'B' : num <= 30 ? 'I' : num <= 45 ? 'N' : num <= 60 ? 'G' : 'O';
                        const isCurrent = index === 0;
                        return (
                            <div
                                key={`${col}-${num}`}
                                className={`${styles.recentBall} ${isCurrent ? styles.recentBallCurrent : ''}`}
                                style={{
                                    '--ball-color': `var(--color-${col})`,
                                    opacity: isCurrent ? 1 : 0.6 - (index * 0.08)
                                }}
                            >
                                <span className={styles.recentCol}>{col}</span>
                                <span className={styles.recentNum}>{num}</span>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className={styles.recentBallsEmpty}>
                    <span className={styles.recentBallsWaiting}>Esperando primer número...</span>
                </div>
            )}

            {/* Grid por columna */}
            <div className={styles.columnsGrid}>
                {COLUMNS.map(col => {
                    const [min, max] = RANGES[col];
                    const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
                    return (
                        <div key={col} className={styles.column}>
                            <div
                                className={styles.columnHeader}
                                style={{ color: `var(--color-${col})`, borderColor: `var(--color-${col})` }}
                            >
                                {col}
                            </div>
                            <div className={styles.numberGrid}>
                                {nums.map(n => (
                                    <span
                                        key={n}
                                        className={`${styles.numCell} ${drawnSet.has(n) ? styles.numDrawn : ''} ${currentBall?.number === n ? styles.numCurrent : ''}`}
                                        style={drawnSet.has(n) ? { background: `var(--color-${col})22`, color: `var(--color-${col})`, borderColor: `var(--color-${col})55` } : {}}
                                    >
                                        {n}
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

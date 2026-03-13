/**
 * LastNumber.jsx
 * Muestra el último número sorteado en la vista del jugador.
 * Compacto y visible en la parte superior del cartón.
 */

import styles from './Play.module.css';

export default function LastNumber({ recentBalls = [], currentBall }) {
    if (!recentBalls || recentBalls.length === 0) {
        return (
            <div className={styles.lastNumberEmpty}>
                <span className={styles.lastNumberWaiting}>Esperando primer número...</span>
            </div>
        );
    }

    // recentBalls[0] es el actual (el más reciente) si viene en orden reverso desde PlayView
    // recentBalls = [actual, anterior, anterior...]

    return (
        <div className={`${styles.recentContainer} animate-scale-in`}>
            {recentBalls.map((num, index) => {
                const col = num <= 15 ? 'B' : num <= 30 ? 'I' : num <= 45 ? 'N' : num <= 60 ? 'G' : 'O';
                const isCurrent = index === 0;

                return (
                    <div
                        key={`${col}-${num}`}
                        className={`${styles.recentBall} ${isCurrent ? styles.recentBallCurrent : ''}`}
                        style={{
                            '--ball-color': `var(--color-${col})`,
                            opacity: isCurrent ? 1 : 0.6 - (index * 0.1)
                        }}
                    >
                        <span className={styles.recentCol}>{col}</span>
                        <span className={styles.recentNum}>{num}</span>
                    </div>
                );
            })}
        </div>
    );
}

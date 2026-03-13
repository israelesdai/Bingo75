/**
 * GameResult.jsx
 * Pantalla de resultado final: GANASTE o PERDISTE.
 * Se muestra cuando el juego termina (estado FINALIZADO).
 */

import styles from './Play.module.css';

export default function GameResult({ winner, myPlayerId, sessionType, onWaitNewRound }) {
    const isWinner = winner?.playerId === myPlayerId;

    return (
        <div className={`${styles.resultScreen} ${isWinner ? styles.resultWin : styles.resultLose}`}>
            <div className={styles.resultCard}>
                {isWinner ? (
                    <>
                        <div className={styles.resultEmoji}>🏆</div>
                        <h1 className={styles.resultTitle}>¡BINGO!</h1>
                        <p className={styles.resultSubtitle}>¡Completaste el cartón!</p>
                        <p className={styles.resultMessage}>¡Felicitaciones, ganaste la partida!</p>
                    </>
                ) : (
                    <>
                        <div className={styles.resultEmoji}>😔</div>
                        <h1 className={`${styles.resultTitle} ${styles.resultTitleLose}`}>
                            ¡Casi!
                        </h1>
                        <p className={styles.resultSubtitle}>
                            {winner ? `${winner.playerName} ganó esta vez` : 'El juego terminó'}
                        </p>
                        <p className={styles.resultMessage}>¡Mejor suerte en la próxima!</p>
                    </>
                )}

                {sessionType === 'continuous' && (
                    <div className={styles.resultWaiting}>
                        <span className="spinner" />
                        <span className="text-muted text-sm">
                            Esperando nueva ronda...
                        </span>
                    </div>
                )}
            </div>

            {/* Confetti animado para el ganador */}
            {isWinner && (
                <div className={styles.confettiContainer} aria-hidden="true">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div
                            key={i}
                            className={styles.confettiPiece}
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${2 + Math.random() * 2}s`,
                                background: ['var(--color-primary)', 'var(--color-secondary)', 'var(--color-accent)', 'var(--color-success)', 'var(--color-warning)'][i % 5],
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * Coincidencia.jsx
 * Tarjeta que muestra cuántos jugadores tienen en su cartón
 * el número que acaba de salir sorteado.
 */

import styles from './Coincidencia.module.css';

export default function Coincidencia({ currentBall, coincidencias = 0, totalPlayers = 0, gameState }) {
    const isPlaying =
        gameState === 'EN_JUEGO' || gameState === 'EMPATE' ||
        gameState === 'RULETA' || gameState === 'FINALIZADO';

    if (!isPlaying || !currentBall) return null;

    const pct = totalPlayers > 0 ? Math.round((coincidencias / totalPlayers) * 100) : 0;

    return (
        <div className={styles.card}>
            <h3 className={styles.title}>🎯 Coincidencia</h3>

            <div className={styles.ballRow}>
                <span className={styles.ballNum} style={{ color: `var(--col-${currentBall.column?.toLowerCase()})` }}>
                    {currentBall.column}{currentBall.number}
                </span>
            </div>

            <p className={styles.counter}>
                <span className={styles.countNum}>{coincidencias}</span>
                <span className={styles.countOf}>/ {totalPlayers}</span>
                <span className={styles.countLabel}> jugadores</span>
            </p>

            {/* Barra de proporción */}
            <div className={styles.barTrack}>
                <div
                    className={styles.barFill}
                    style={{ width: `${pct}%` }}
                />
            </div>

            <p className={styles.pct}>{pct}%</p>
        </div>
    );
}

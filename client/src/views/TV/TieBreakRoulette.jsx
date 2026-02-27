/**
 * TieBreakRoulette.jsx
 * Animación de ruleta visual para el desempate.
 *
 * Flujo:
 *   1. Admin emite spin_roulette → estado RULETA → se muestra esta pantalla.
 *   2. El servidor ya determinó el ganador (antes de la animación).
 *   3. Tras 4s, el servidor emite tie_break_result.
 *   4. Se muestra el ganador con animación de revelación.
 */

import { useState, useEffect, useRef } from 'react';
import styles from './TV.module.css';

export default function TieBreakRoulette({ tiedPlayers = [], tieWinner, isSpinning }) {
    const [displayIndex, setDisplayIndex] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const intervalRef = useRef(null);

    // Animación de ruleta: cicla por los jugadores empatados
    useEffect(() => {
        if (!isSpinning || tiedPlayers.length === 0) return;

        setRevealed(false);
        let speed = 80;
        let elapsed = 0;
        const totalDuration = 3800; // ms — un poco menos que el delay del servidor (4000ms)

        const tick = () => {
            setDisplayIndex(i => (i + 1) % tiedPlayers.length);
            elapsed += speed;

            // Desacelerar progresivamente
            if (elapsed > totalDuration * 0.5) speed = 150;
            if (elapsed > totalDuration * 0.75) speed = 300;
            if (elapsed > totalDuration * 0.9) speed = 500;

            if (elapsed < totalDuration) {
                intervalRef.current = setTimeout(tick, speed);
            }
        };

        intervalRef.current = setTimeout(tick, speed);
        return () => clearTimeout(intervalRef.current);
    }, [isSpinning, tiedPlayers.length]);

    // Cuando llega el ganador, revelar
    useEffect(() => {
        if (tieWinner) {
            clearTimeout(intervalRef.current);
            const winnerIndex = tiedPlayers.findIndex(p => p.playerId === tieWinner.playerId);
            if (winnerIndex >= 0) setDisplayIndex(winnerIndex);
            setTimeout(() => setRevealed(true), 300);
        }
    }, [tieWinner]);

    const currentPlayer = tiedPlayers[displayIndex];

    return (
        <div className={styles.rouletteOverlay}>
            <div className={styles.rouletteCard}>
                {!revealed ? (
                    <>
                        <h2 className={styles.rouletteTitle}>🎡 Desempate</h2>
                        <p className={styles.rouletteSubtitle}>
                            {tiedPlayers.length} jugadores empatados
                        </p>

                        {/* Ruleta visual */}
                        <div className={styles.rouletteSpinner}>
                            <div className={styles.rouletteTrack}>
                                {tiedPlayers.map((p, i) => (
                                    <div
                                        key={p.playerId}
                                        className={`${styles.rouletteSlot} ${i === displayIndex ? styles.rouletteSlotActive : ''}`}
                                    >
                                        <div className={styles.rouletteAvatar}>
                                            {p.playerName.charAt(0).toUpperCase()}
                                        </div>
                                        <span className={styles.roulettePlayerName}>{p.playerName}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.roulettePointer}>▼</div>

                        <p className={styles.rouletteWaiting}>Girando...</p>
                    </>
                ) : (
                    /* Revelación del ganador */
                    <div className={`${styles.rouletteWinner} animate-scale-in`}>
                        <div className={styles.rouletteWinnerGlow} />
                        <span className={styles.rouletteWinnerEmoji}>🏆</span>
                        <h2 className={styles.rouletteWinnerTitle}>¡Ganador del Desempate!</h2>
                        <div className={styles.rouletteWinnerAvatar}>
                            {tieWinner?.playerName?.charAt(0).toUpperCase()}
                        </div>
                        <p className={styles.rouletteWinnerName}>{tieWinner?.playerName}</p>
                        <p className={styles.rouletteWinnerSub}>¡Felicitaciones!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * GameTimer.jsx
 * Tarjeta de tiempo de juego en la barra lateral izquierda.
 * El cronómetro arranca cuando gameState pasa a 'EN_JUEGO'
 * y se detiene/reinicia cuando el juego termina o vuelve a LOBBY.
 */

import { useEffect, useRef, useState } from 'react';
import styles from './GameTimer.module.css';

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function GameTimer({ gameState }) {
    const [elapsed, setElapsed] = useState(0);
    const intervalRef = useRef(null);
    const isPlaying = gameState === 'EN_JUEGO' || gameState === 'EMPATE' || gameState === 'RULETA';

    useEffect(() => {
        if (isPlaying) {
            // Solo iniciar si no hay intervalo activo
            if (!intervalRef.current) {
                intervalRef.current = setInterval(() => {
                    setElapsed(prev => prev + 1);
                }, 1000);
            }
        } else {
            // Detener intervalo
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            // Reiniciar si vuelve a LOBBY (nueva partida)
            if (gameState === 'LOBBY') {
                setElapsed(0);
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isPlaying, gameState]);

    // No mostrar en LOBBY antes de empezar
    if (gameState === 'LOBBY' || !gameState) return null;

    return (
        <div className={styles.card}>
            <p className={styles.label}>⏱ Tiempo de juego</p>
            <p className={styles.time}>{formatTime(elapsed)}</p>
            {gameState === 'FINALIZADO' && (
                <p className={styles.finished}>Partida finalizada</p>
            )}
        </div>
    );
}

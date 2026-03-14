/**
 * CurrentNumber.jsx
 * Número actual GIGANTE para proyección en TV.
 * Muestra columna, número y apodo con animación de entrada.
 */

import { useEffect, useRef } from 'react';
import styles from './TV.module.css';

export default function CurrentNumber({ currentBall }) {
    const prevNumber = useRef(null);

    // Detectar cambio de número para re-disparar animación
    const isNew = currentBall && currentBall.number !== prevNumber.current;
    useEffect(() => {
        if (currentBall) prevNumber.current = currentBall.number;
    }, [currentBall?.number]);

    if (!currentBall) {
        return (
            <div className={styles.currentNumberEmpty}>
                <span className={styles.waitingText}>Esperando sorteo...</span>
            </div>
        );
    }

    return (
        <div className={`${styles.currentNumber} ${isNew ? styles.currentNumberAnimate : ''}`}>
            {/* Columna */}
            <span
                className={styles.currentColumn}
                style={{ color: `var(--color-${currentBall.column})` }}
            >
                {currentBall.column}
            </span>

            {/* Separador */}
            <span className={styles.currentSeparator}>-</span>

            {/* Número */}
            <span
                className={styles.currentNum}
                style={{ color: `var(--color-${currentBall.column})` }}
            >
                {currentBall.number}
            </span>



            {/* Glow de fondo */}
            <div
                className={styles.currentGlow}
                style={{ background: `var(--color-${currentBall.column})` }}
            />
        </div>
    );
}

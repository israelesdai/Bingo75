/**
 * GameStatus.jsx
 * Muestra el estado actual del juego en la TV con indicadores visuales.
 */

import StatusBadge from '@/components/StatusBadge';
import styles from './TV.module.css';

const STATE_MESSAGES = {
    LOBBY: '🎮 Esperando que el administrador inicie el juego',
    EN_JUEGO: '🎱 ¡El juego está en curso!',
    EMPATE: '🤝 ¡Empate! Preparando la ruleta...',
    RULETA: '🎡 ¡Girando la ruleta del destino!',
    FINALIZADO: '🏆 ¡Tenemos un ganador!',
    CERRADO: '🔒 La sala fue cerrada',
};

export default function GameStatus({ state, players, drawnCount, winner, roundNumber }) {
    console.log('[GameStatus] Renderizando estado:', state);
    const message = STATE_MESSAGES[state] || state;

    return (
        <div className={styles.gameStatus}>
            <div className={styles.statusRow}>
                <StatusBadge state={state} />
                <span className={styles.statusMessage}>{message}</span>
            </div>

            <div className={styles.statusStats}>
                <div className={styles.statItem}>
                    <span className={styles.statNum}>{players?.length || 0}</span>
                    <span className={styles.statLabel}>Jugadores</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.statItem}>
                    <span className={styles.statNum}>{drawnCount}</span>
                    <span className={styles.statLabel}>Bolas</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.statItem}>
                    <span className={styles.statNum}>{75 - drawnCount}</span>
                    <span className={styles.statLabel}>Restantes</span>
                </div>
                {roundNumber > 1 && (
                    <>
                        <div className={styles.statDivider} />
                        <div className={styles.statItem}>
                            <span className={styles.statNum}>#{roundNumber}</span>
                            <span className={styles.statLabel}>Ronda</span>
                        </div>
                    </>
                )}
            </div>

            {/* Banner ganador */}
            {state === 'FINALIZADO' && winner && (
                <div className={`${styles.winnerBannerTV} animate-scale-in`}>
                    <span className={styles.winnerEmoji}>🏆</span>
                    <div>
                        <p className={styles.winnerLabelTV}>¡BINGO! ¡Cartón Completo!</p>
                        <p className={styles.winnerNameTV}>{winner.playerName}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

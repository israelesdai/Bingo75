/**
 * SupportCard.jsx
 * Tarjeta de soporte para el admin: muestra jugadores con números pendientes
 * (sorteados, en el cartón, sin marcar) solo en modo MANUAL.
 *
 * En modo AUTO siempre muestra 0 pendientes y el botón queda desactivado.
 */

import { useState } from 'react';
import styles from './SupportCard.module.css';

export default function SupportCard({ players = [], drawnNumbers = [], markingMode, gameState }) {
    const [modalOpen, setModalOpen] = useState(false);

    const isAuto = markingMode === 'auto';
    const isPlaying =
        gameState === 'EN_JUEGO' || gameState === 'EMPATE' ||
        gameState === 'RULETA' || gameState === 'FINALIZADO';

    if (!isPlaying || players.length === 0) return null;

    // En modo auto, pendientes siempre 0
    const playersWithPending = isAuto
        ? []
        : players.filter(p => (p.pendingCount ?? 0) > 0);

    const totalPending = playersWithPending.length;

    return (
        <>
            {/* Tarjeta */}
            <div className={styles.card}>
                <h3 className={styles.title}>🛟 Soporte</h3>

                <p className={styles.counter}>
                    {isAuto
                        ? '✅ Pendientes: 0'
                        : totalPending > 0
                            ? `⚠ Pendientes: ${totalPending} ${totalPending === 1 ? 'jugador' : 'jugadores'}`
                            : '✅ Pendientes: 0'}
                </p>

                <button
                    className={styles.btn}
                    disabled={isAuto || totalPending === 0}
                    onClick={() => setModalOpen(true)}
                >
                    Ver pendientes
                </button>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className={styles.overlay} onClick={() => setModalOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>🛟 Jugadores con pendientes</h2>
                            <button className={styles.closeBtn} onClick={() => setModalOpen(false)}>✕</button>
                        </div>

                        {playersWithPending.length === 0 ? (
                            <p className={styles.emptyMsg}>Sin pendientes en este momento.</p>
                        ) : (
                            <ul className={styles.playerList}>
                                {playersWithPending.map(p => (
                                    <li key={p.playerId} className={styles.playerItem}>
                                        <div className={styles.playerHeader}>
                                            <span className={styles.playerName}>{p.playerName}</span>
                                            <span className={styles.badgeCount}>{p.pendingCount} pendiente{p.pendingCount !== 1 ? 's' : ''}</span>
                                        </div>
                                        <div className={styles.numberList}>
                                            {(p.pendingNumbers ?? []).map(n => (
                                                <span key={n} className={styles.numChip}>{n}</span>
                                            ))}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

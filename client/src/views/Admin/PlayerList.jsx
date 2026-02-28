/**
 * PlayerList.jsx
 * Leaderboard de jugadores para el Admin.
 *
 * Durante el juego: ordenado por markedCount desc, con barra de progreso X/24.
 * En lobby: orden de ingreso, sin progreso.
 */

import styles from './Admin.module.css';

const MAX_CELLS = 24; // 24 casillas marcables (excluye FREE)

export default function PlayerList({ players, gameState, onKickPlayer }) {
    if (!players || players.length === 0) {
        return (
            <div className={`card-glass ${styles.playerListCard}`}>
                <h3 className={styles.sectionTitle}>👥 Jugadores</h3>
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>🎮</span>
                    <p className="text-muted text-sm">Esperando jugadores...</p>
                    <p className="text-muted text-xs">Comparte el QR desde la TV</p>
                </div>
            </div>
        );
    }

    const isPlaying = gameState === 'EN_JUEGO' || gameState === 'EMPATE'
        || gameState === 'RULETA' || gameState === 'FINALIZADO';

    // Ordenar: durante el juego → por markedCount desc; lobby → por ingreso
    const sorted = isPlaying
        ? [...players].sort((a, b) => (b.markedCount ?? 0) - (a.markedCount ?? 0))
        : players;

    const connected = players.filter(p => p.isConnected).length;
    const disconnected = players.length - connected;

    return (
        <div className={`card-glass ${styles.playerListCard}`}>
            <div className={styles.playerListHeader}>
                <h3 className={styles.sectionTitle}>
                    {isPlaying ? '🏅 Ranking' : '👥 Jugadores'}
                </h3>
                <div className={styles.playerCount}>
                    <span className={styles.countConnected}>{connected} online</span>
                    {disconnected > 0 && (
                        <span className={styles.countDisconnected}>{disconnected} off</span>
                    )}
                </div>
            </div>

            <ul className={styles.playerList}>
                {sorted.map((player, i) => {
                    const markedRaw = player.markedCount ?? 0;
                    const marked = Math.max(0, markedRaw - 1);
                    const pct = Math.round((marked / MAX_CELLS) * 100);
                    const barColor = pct >= 80
                        ? 'var(--color-danger)'
                        : pct >= 55
                            ? 'var(--color-warning)'
                            : 'var(--color-primary)';

                    return (
                        <li
                            key={player.playerId}
                            className={`${styles.playerItem} ${!player.isConnected ? styles.playerDisconnected : ''}`}
                        >
                            {isPlaying && (
                                <span className={styles.playerRank}>
                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                                </span>
                            )}

                            <div className={styles.playerAvatar}>
                                {player.playerName.charAt(0).toUpperCase()}
                            </div>

                            <div className={styles.playerInfo} style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <span className={styles.playerName}>{player.playerName}</span>
                                    {isPlaying && (
                                        <span className={styles.markedCount}>
                                            {marked}<span className={styles.markedTotal}>/{MAX_CELLS}</span>
                                        </span>
                                    )}
                                </div>

                                {isPlaying && (
                                    <div className={styles.progressBar}>
                                        <div
                                            className={styles.progressFill}
                                            style={{ width: `${pct}%`, background: barColor }}
                                        />
                                    </div>
                                )}

                                {!isPlaying && (
                                    <span className={`text-xs ${player.isConnected ? styles.onlineLabel : styles.offlineLabel}`}>
                                        {player.isConnected ? '● En línea' : '○ Desconectado'}
                                    </span>
                                )}
                            </div>

                            {/* Botón de expulsión */}
                            {onKickPlayer && (
                                <button
                                    className={styles.kickBtn}
                                    title={`Expulsar a ${player.playerName}`}
                                    onClick={() => onKickPlayer(player.playerId, player.playerName)}
                                >
                                    🚫
                                </button>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

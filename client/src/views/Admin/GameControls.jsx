/**
 * GameControls.jsx
 * Botones de control del juego para el Admin.
 *
 * Nuevo: panel de auto-sorteo con toggle, pausa/reanuda y control de velocidad.
 */

import styles from './Admin.module.css';

// Opciones de velocidad en segundos
const SPEED_OPTIONS = [
    { label: 'Muy rápido', value: 2, emoji: '⚡' },
    { label: 'Rápido', value: 4, emoji: '🚀' },
    { label: 'Normal', value: 6, emoji: '🎱' },
    { label: 'Lento', value: 10, emoji: '🐢' },
    { label: 'Muy lento', value: 15, emoji: '🦥' },
];

export default function GameControls({
    gameState, sessionType,
    onStartGame, onDrawNumber, onSpinRoulette, onNewRound, onCloseRoom,
    speechEnabled, onToggleSpeech,
    hasRoom, drawnCount, remaining,
    // Auto-sorteo
    autoDrawEnabled, autoDrawPaused, drawInterval,
    onToggleAutoDraw, onPauseResume, onSpeedChange,
}) {
    const isLobby = gameState === 'LOBBY';
    const isPlaying = gameState === 'EN_JUEGO';
    const isEmpate = gameState === 'EMPATE';
    const isFinalizado = gameState === 'FINALIZADO';
    const isCerrado = gameState === 'CERRADO';

    return (
        <div className={`card-glass ${styles.controlsCard}`}>
            <div className={styles.controlsHeader}>
                <h3 className={styles.sectionTitle}>🎮 Controles</h3>
                {isPlaying && (
                    <div className={styles.ballCounter}>
                        <span className={styles.ballCountNum}>{drawnCount}</span>
                        <span className="text-muted text-xs">/ 75 bolas</span>
                    </div>
                )}
            </div>

            <div className={styles.controlsGrid}>
                {/* Iniciar juego */}
                <button
                    id="btn-start-game"
                    className="btn btn-success btn-lg"
                    onClick={onStartGame}
                    disabled={!hasRoom || !isLobby}
                >
                    ▶ Iniciar Juego
                </button>

                {/* ── Panel de sorteo: manual vs auto ── */}
                {isPlaying && (
                    <div className={styles.drawModePanel}>
                        {/* Toggle manual / auto */}
                        <div className={styles.drawModeToggle}>
                            <button
                                id="btn-draw-manual-mode"
                                className={`btn btn-sm ${!autoDrawEnabled ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => autoDrawEnabled && onToggleAutoDraw()}
                                disabled={!autoDrawEnabled}
                            >
                                👆 Manual
                            </button>
                            <button
                                id="btn-draw-auto-mode"
                                className={`btn btn-sm ${autoDrawEnabled ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => !autoDrawEnabled && onToggleAutoDraw()}
                                disabled={autoDrawEnabled}
                            >
                                🔄 Automático
                            </button>
                        </div>

                        {/* Modo Manual: botón sacar bola */}
                        {!autoDrawEnabled && (
                            <button
                                id="btn-draw-number"
                                className={`btn btn-primary btn-lg ${styles.drawBtn}`}
                                onClick={onDrawNumber}
                            >
                                🎱 Sacar Bola
                                {remaining != null && (
                                    <span className={styles.remainingBadge}>{remaining} restantes</span>
                                )}
                            </button>
                        )}

                        {/* Modo Auto: controles de velocidad + pausa */}
                        {autoDrawEnabled && (
                            <div className={styles.autoDrawControls}>
                                {/* Estado visual del auto-sorteo */}
                                <div className={styles.autoDrawStatus}>
                                    <span
                                        className={styles.autoDrawDot}
                                        style={{ background: autoDrawPaused ? 'var(--color-warning)' : 'var(--color-success)' }}
                                    />
                                    <span className="text-sm">
                                        {autoDrawPaused
                                            ? '⏸ Pausado'
                                            : `▶ Sorteando cada ${drawInterval}s`}
                                    </span>
                                    {remaining != null && (
                                        <span className={styles.remainingBadge}>{remaining} restantes</span>
                                    )}
                                </div>

                                {/* Botón pausa / reanudar */}
                                <button
                                    id="btn-auto-pause-resume"
                                    className={`btn btn-lg ${autoDrawPaused ? 'btn-success' : 'btn-warning'}`}
                                    onClick={onPauseResume}
                                >
                                    {autoDrawPaused ? '▶ Reanudar' : '⏸ Pausar'}
                                </button>

                                {/* Selector de velocidad */}
                                <div className={styles.speedSelector}>
                                    <span className="label" style={{ marginBottom: 0, fontSize: '0.75rem' }}>
                                        Velocidad
                                    </span>
                                    <div className={styles.speedOptions}>
                                        {SPEED_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                id={`btn-speed-${opt.value}s`}
                                                className={`btn btn-sm ${drawInterval === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                                                onClick={() => onSpeedChange(opt.value)}
                                                title={opt.label}
                                            >
                                                {opt.emoji} {opt.value}s
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Girar ruleta (solo en empate) */}
                {isEmpate && (
                    <button
                        id="btn-spin-roulette"
                        className="btn btn-warning btn-lg animate-scale-in"
                        onClick={onSpinRoulette}
                    >
                        🎡 Girar Ruleta
                    </button>
                )}

                {/* Nueva ronda (sesión continua, finalizado) */}
                {isFinalizado && sessionType === 'continuous' && (
                    <button
                        id="btn-new-round"
                        className="btn btn-secondary btn-lg animate-scale-in"
                        onClick={onNewRound}
                    >
                        🔄 Nueva Ronda
                    </button>
                )}

                {/* Cerrar sala */}
                <button
                    id="btn-close-room"
                    className="btn btn-danger"
                    onClick={onCloseRoom}
                    disabled={!hasRoom || isCerrado}
                >
                    ✕ Cerrar Sala
                </button>
            </div>

            {/* Toggle síntesis de voz */}
            {hasRoom && (
                <div className={styles.speechToggle}>
                    <span className="text-muted text-sm">🔊 Síntesis de voz</span>
                    <button
                        id="btn-toggle-speech"
                        className={`btn btn-sm ${speechEnabled ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={onToggleSpeech}
                    >
                        {speechEnabled ? 'ON' : 'OFF'}
                    </button>
                </div>
            )}
        </div>
    );
}

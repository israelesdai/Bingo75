/**
 * AdminView.jsx
 * Vista principal del panel de administración (/admin).
 *
 * Agrega: modo auto-sorteo con intervalo configurable, pausa/reanuda.
 * El auto-sorteo es 100% del lado del cliente: setInterval → emit draw_number.
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { adminSocket } from '@/socket/socketClient';
import useGameStore from '@/store/gameStore';
import StatusBadge from '@/components/StatusBadge';
import RoomSetup from './RoomSetup';
import GameControls from './GameControls';
import PlayerList from './PlayerList';
import DrawnNumbers from './DrawnNumbers';
import NicknameEditor from './NicknameEditor';
import ConfirmationModal from '@/components/ConfirmationModal';
import RoomProgress from './RoomProgress';
import SupportCard from './SupportCard';
import GameTimer from './GameTimer';
import Coincidencia from './Coincidencia';
import styles from './Admin.module.css';

export default function AdminView() {
    const {
        roomId, roomInfo, gameState, drawnNumbers, currentBall,
        players, winner, tiedPlayers, speechEnabled, isConnected, coincidencias,
        setRoomCreated, setGameStateUpdate, setNumberDrawn,
        setNicknameUpdated, setTiedPlayers, setTieWinner,
        setConnected, setConnecting, reset,
    } = useGameStore();

    // ── Estado: auto-sorteo ───────────────────────────────────────────────────
    const [autoDrawEnabled, setAutoDrawEnabled] = useState(false); // modo auto activo
    const [autoDrawPaused, setAutoDrawPaused] = useState(false); // pausado
    const [drawInterval, setDrawInterval] = useState(5);     // segundos entre bolas
    const autoDrawRef = useRef(null);   // ref al setInterval activo
    const roomIdRef = useRef(roomId); // ref para acceder al roomId dentro del interval

    // Estado para modal de confirmación
    const [showCloseModal, setShowCloseModal] = useState(false);

    // Mantener roomIdRef actualizado
    useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

    // ── Auto-sorteo: arrancar / detener intervalo ─────────────────────────────
    const startAutoInterval = useCallback(() => {
        if (autoDrawRef.current) clearInterval(autoDrawRef.current);
        autoDrawRef.current = setInterval(() => {
            if (roomIdRef.current) {
                adminSocket.emit('draw_number', { roomId: roomIdRef.current });
            }
        }, drawInterval * 1000);
    }, [drawInterval]);

    const stopAutoInterval = useCallback(() => {
        if (autoDrawRef.current) {
            clearInterval(autoDrawRef.current);
            autoDrawRef.current = null;
        }
    }, []);

    // Cuando cambia la velocidad y el auto está activo y no pausado → reiniciar
    useEffect(() => {
        if (autoDrawEnabled && !autoDrawPaused && gameState === 'EN_JUEGO') {
            startAutoInterval();
        }
        return () => stopAutoInterval();
    }, [drawInterval]);

    // Detener auto-sorteo si el juego ya no está EN_JUEGO
    useEffect(() => {
        if (gameState !== 'EN_JUEGO') {
            stopAutoInterval();
            setAutoDrawEnabled(false);
            setAutoDrawPaused(false);
        }
    }, [gameState]);

    // Limpiar al desmontar
    useEffect(() => () => stopAutoInterval(), []);

    // ── Handlers auto-sorteo ──────────────────────────────────────────────────
    const handleToggleAutoDraw = useCallback(() => {
        if (!autoDrawEnabled) {
            // Activar modo auto
            setAutoDrawEnabled(true);
            setAutoDrawPaused(false);
            startAutoInterval();
        } else {
            // Desactivar modo auto → volver a manual
            setAutoDrawEnabled(false);
            setAutoDrawPaused(false);
            stopAutoInterval();
        }
    }, [autoDrawEnabled, startAutoInterval, stopAutoInterval]);

    const handlePauseResume = useCallback(() => {
        if (!autoDrawPaused) {
            // Pausar
            stopAutoInterval();
            setAutoDrawPaused(true);
        } else {
            // Reanudar
            setAutoDrawPaused(false);
            startAutoInterval();
        }
    }, [autoDrawPaused, startAutoInterval, stopAutoInterval]);

    const handleSpeedChange = useCallback((seconds) => {
        setDrawInterval(seconds);
        // Si está activo y no pausado, el useEffect de drawInterval reinicia el intervalo
    }, []);

    // ── Conexión Socket.IO ────────────────────────────────────────────────────
    useEffect(() => {
        setConnecting(true);
        adminSocket.connect();

        adminSocket.on('connect', () => setConnected(true));
        adminSocket.on('disconnect', () => setConnected(false));

        adminSocket.on('room_created', (data) => setRoomCreated(data));
        adminSocket.on('game_state_update', (data) => setGameStateUpdate(data));
        adminSocket.on('number_drawn', (data) => setNumberDrawn(data));
        adminSocket.on('nickname_updated', (data) => setNicknameUpdated(data));

        adminSocket.on('tie_break_start', (data) => setTiedPlayers(data.tiedPlayers));
        adminSocket.on('tie_break_result', (data) => setTieWinner({ playerId: data.winnerId, playerName: data.winnerName }));

        adminSocket.on('player_joined', (data) => {
            console.log('[admin] Jugador unido:', data.playerName);
        });

        adminSocket.on('room_closed', () => {
            reset(); // Limpia roomId, triggers RoomSetup view
        });

        adminSocket.on('error', (err) => {
            if (err.code !== 'INFO') {
                console.error('[admin] Error del servidor:', err);
            }
        });

        return () => {
            adminSocket.off('connect');
            adminSocket.off('disconnect');
            adminSocket.off('room_created');
            adminSocket.off('game_state_update');
            adminSocket.off('number_drawn');
            adminSocket.off('nickname_updated');
            adminSocket.off('tie_break_start');
            adminSocket.off('tie_break_result');
            adminSocket.off('player_joined');
            adminSocket.off('room_closed');
            adminSocket.off('error');
            adminSocket.disconnect();
        };
    }, []);

    // ── Síntesis de voz ───────────────────────────────────────────────────────
    useEffect(() => {
        if (!speechEnabled || !currentBall) return;
        const utterance = new SpeechSynthesisUtterance(
            `${currentBall.column} ${currentBall.number}. ${currentBall.nickname}`
        );
        utterance.lang = 'es-ES';
        utterance.rate = 0.85;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }, [currentBall?.number, speechEnabled]);

    // ── Handlers hacia el servidor ────────────────────────────────────────────
    const handleCreateRoom = useCallback(({ sessionType, markingMode }) => {
        adminSocket.emit('create_room', { sessionType, markingMode });
    }, []);

    const handleStartGame = useCallback(() => {
        adminSocket.emit('start_game', { roomId });
    }, [roomId]);

    const handleDrawNumber = useCallback(() => {
        adminSocket.emit('draw_number', { roomId });
    }, [roomId]);

    const handleSpinRoulette = useCallback(() => {
        adminSocket.emit('spin_roulette', { roomId });
    }, [roomId]);

    const handleNewRound = useCallback(() => {
        adminSocket.emit('new_round', { roomId });
    }, [roomId]);

    const handleCloseRoom = useCallback(() => {
        setShowCloseModal(true);
    }, []);

    const confirmCloseRoom = useCallback(() => {
        stopAutoInterval();
        adminSocket.emit('close_room', { roomId });
        setShowCloseModal(false);
    }, [roomId, stopAutoInterval]);

    const handleUpdateNickname = useCallback((number, nickname) => {
        adminSocket.emit('update_nickname', { roomId, number, nickname });
    }, [roomId]);

    const handleToggleSpeech = useCallback(() => {
        adminSocket.emit('toggle_speech', { roomId, enabled: !speechEnabled });
    }, [roomId, speechEnabled]);

    // ── Render ────────────────────────────────────────────────────────────────
    const remaining = currentBall?.remaining ?? null;

    return (
        <div className={styles.adminLayout}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <span className={styles.logo}>🎱 Bingo 75</span>
                    <StatusBadge state={gameState} />
                    {roomId && (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                            Sala <strong style={{ color: 'var(--color-primary)' }}>{roomId}</strong>
                        </span>
                    )}
                </div>
                <div className={styles.headerRight}>
                    <span className="text-muted text-sm">
                        {isConnected ? 'Conectado' : 'Desconectado'}
                    </span>
                    <div className={`${styles.connectionDot} ${isConnected ? styles.connected : ''}`} />
                </div>
            </header>

            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <RoomSetup
                    onCreateRoom={handleCreateRoom}
                    roomInfo={roomInfo}
                    isConnected={isConnected}
                />

                <GameControls
                    gameState={gameState}
                    sessionType={roomInfo?.sessionType}
                    onStartGame={handleStartGame}
                    onDrawNumber={handleDrawNumber}
                    onSpinRoulette={handleSpinRoulette}
                    onNewRound={handleNewRound}
                    onCloseRoom={handleCloseRoom}
                    speechEnabled={speechEnabled}
                    onToggleSpeech={handleToggleSpeech}
                    hasRoom={!!roomId}
                    drawnCount={drawnNumbers.length}
                    remaining={remaining}
                    // Auto-sorteo
                    autoDrawEnabled={autoDrawEnabled}
                    autoDrawPaused={autoDrawPaused}
                    drawInterval={drawInterval}
                    onToggleAutoDraw={handleToggleAutoDraw}
                    onPauseResume={handlePauseResume}
                    onSpeedChange={handleSpeedChange}
                />

                <GameTimer gameState={gameState} />
            </aside>

            {/* Área principal (Centro) */}
            <main className={styles.mainArea}>
                {/* Banner de ganador */}
                {winner && gameState === 'FINALIZADO' && (
                    <div className={`${styles.winnerBanner} animate-scale-in`}>
                        <p className={styles.winnerTitle}>🏆 ¡BINGO! ¡Cartón Completo!</p>
                        <p className={styles.winnerName}>{winner.playerName} ganó la partida</p>
                    </div>
                )}

                {/* Fila: 50% Tablero | 50% columna derecha (Progreso + espacio futuro) */}
                <div className={styles.mainRow}>
                    <DrawnNumbers
                        drawnNumbers={drawnNumbers}
                        currentBall={currentBall}
                    />
                    <div className={styles.mainRowRight}>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoGridLeft}>
                                <RoomProgress players={players} gameState={gameState} />
                            </div>
                            <SupportCard
                                players={players}
                                drawnNumbers={drawnNumbers}
                                markingMode={roomInfo?.markingMode}
                                gameState={gameState}
                            />
                            <Coincidencia
                                currentBall={currentBall}
                                coincidencias={coincidencias}
                                totalPlayers={players.length}
                                gameState={gameState}
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Sidebar Derecho (Jugadores) */}
            <aside className={styles.rightSidebar}>
                <PlayerList players={players} gameState={gameState} />
            </aside>

            {/* Modal de confirmación */}
            <ConfirmationModal
                isOpen={showCloseModal}
                title="¿Cerrar Sala?"
                message="Esta acción no se puede deshacer. Todos los jugadores serán desconectados."
                onConfirm={confirmCloseRoom}
                onCancel={() => setShowCloseModal(false)}
            />
        </div>
    );
}

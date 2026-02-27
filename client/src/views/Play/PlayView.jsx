/**
 * PlayView.jsx
 * Vista del jugador (/play) — Mobile First.
 *
 * Flujo completo:
 *   1. Leer roomId del query param (?room=XXXX).
 *   2. Conectar al namespace /play.
 *   3. Mostrar NameEntry → el jugador ingresa su nombre.
 *   4. Emitir join_room o reconnect_player (si ya tiene playerId en localStorage).
 *   5. Recibir card_assigned → mostrar cartón.
 *   6. Escuchar number_drawn → actualizar números sorteados.
 *   7. En modo manual: el jugador toca celdas → emitir mark_number.
 *   8. Mostrar GameResult al finalizar.
 *
 * REGLA: No modifica el backend. Solo consume eventos ya definidos.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { playSocket } from '@/socket/socketClient';
import { usePlayerId } from '@/hooks/usePlayerId';
import StatusBadge from '@/components/StatusBadge';
import NameEntry from './NameEntry';
import BingoCard from './BingoCard';
import LastNumber from './LastNumber';
import GameResult from './GameResult';
import DisconnectBanner from './DisconnectBanner';
import styles from './Play.module.css';

export default function PlayView() {
    const [searchParams] = useSearchParams();
    const roomId = searchParams.get('room');
    const playerId = usePlayerId();

    // ── Estado local ──────────────────────────────────────────────────────────
    const [phase, setPhase] = useState('name_entry'); // name_entry | lobby | playing | finished | error
    const [playerName, setPlayerName] = useState('');
    const [gameState, setGameState] = useState('LOBBY');
    const [card, setCard] = useState(null);
    const [drawnNumbers, setDrawnNumbers] = useState([]);
    const [currentBall, setCurrentBall] = useState(null);
    const [winner, setWinner] = useState(null);
    const [tiedPlayers, setTiedPlayers] = useState([]);
    const [markingMode, setMarkingMode] = useState('auto');
    const [sessionType, setSessionType] = useState('single');
    const [lastMarked, setLastMarked] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [markedCount, setMarkedCount] = useState(1); // 1 = centro libre
    const [roundNumber, setRoundNumber] = useState(1);

    const hasJoined = useRef(false);

    const markingModeRef = useRef('auto');

    useEffect(() => {
        markingModeRef.current = markingMode;
    }, [markingMode]);

    // ── Sin roomId ────────────────────────────────────────────────────────────
    if (!roomId) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px', padding: '24px', textAlign: 'center' }}>
                <span style={{ fontSize: '3rem' }}>❌</span>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Sala no especificada</h1>
                <p style={{ color: 'var(--color-text-muted)' }}>
                    Necesitás un enlace con el código de sala, por ejemplo:
                </p>
                <code style={{ color: 'var(--color-accent)', fontSize: '1rem' }}>/play?room=XXXX</code>
            </div>
        );
    }

    // ── Conexión Socket.IO ────────────────────────────────────────────────────
    useEffect(() => {
        playSocket.connect();

        playSocket.on('connect', () => {
            setIsConnected(true);
            setIsConnecting(false);

            // Si ya había unido antes, intentar reconexión
            const savedName = localStorage.getItem('bingo75_playerName');
            if (hasJoined.current && savedName) {
                playSocket.emit('reconnect_player', { roomId, playerId, playerName: savedName });
            }
        });

        playSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        // ── Eventos del servidor ──────────────────────────────────────────────

        playSocket.on('card_assigned', (data) => {
            setCard(data.card);
            setMarkingMode(data.markingMode);
            setSessionType(data.sessionType || 'single');
            setPlayerName(data.playerName);
            localStorage.setItem('bingo75_playerName', data.playerName);
            hasJoined.current = true;

            // Contar celdas ya marcadas (centro libre = 1)
            const count = data.card.flat().filter(c => c.marked).length;
            setMarkedCount(count);

            setPhase(data.gameState === 'EN_JUEGO' ? 'playing' : 'lobby');
            setGameState(data.gameState || 'LOBBY');
        });

        playSocket.on('game_state_update', (data) => {
            setGameState(data.state);
            setDrawnNumbers(data.drawnNumbers || []);
            setCurrentBall(data.currentBall || null);
            setRoundNumber(data.roundNumber || 1);

            // Transición robusta: si el server dice que está en juego, ¡a jugar!
            // Esto cubre reconexiones o refrescos tardíos.
            if (data.state === 'EN_JUEGO' || data.state === 'EMPATE' || data.state === 'RULETA') {
                setPhase('playing');
            }
            if (data.state === 'FINALIZADO') {
                setWinner(data.winner || null);
                setPhase('finished');
            }
            if (data.tiedPlayers?.length) setTiedPlayers(data.tiedPlayers);
        });

        playSocket.on('number_drawn', (data) => {
            // Si llega una bola, ¡el juego empezó sí o sí!
            setPhase('playing');
            setGameState('EN_JUEGO');

            setCurrentBall({ number: data.number, column: data.column, nickname: data.nickname });
            setDrawnNumbers(data.drawnNumbers);

            // En modo auto: marcar la celda en el cartón local
            // Usamos ref para evitar closure stale y respetamos la configuración local
            if (markingModeRef.current === 'auto') {
                setCard(prev => {
                    if (!prev) return prev;
                    const updated = prev.map(col =>
                        col.map(cell =>
                            cell.number === data.number ? { ...cell, marked: true } : cell
                        )
                    );
                    const count = updated.flat().filter(c => c.marked).length;
                    setMarkedCount(count);
                    return updated;
                });
            }
        });

        playSocket.on('number_marked', (data) => {
            // Confirmación del servidor de un marcado manual
            setCard(prev => {
                if (!prev) return prev;
                const updated = prev.map(col =>
                    col.map(cell =>
                        cell.number === data.number ? { ...cell, marked: true } : cell
                    )
                );
                const count = updated.flat().filter(c => c.marked).length;
                setMarkedCount(count);
                setLastMarked(data.number);
                return updated;
            });
        });

        playSocket.on('nickname_updated', (data) => {
            setCurrentBall(prev =>
                prev?.number === data.number ? { ...prev, nickname: data.nickname } : prev
            );
        });

        playSocket.on('bingo_winner', (data) => {
            setWinner({ playerId: data.playerId, playerName: data.playerName });
            setPhase('finished');
            setGameState('FINALIZADO');
        });

        playSocket.on('tie_break_start', (data) => {
            setTiedPlayers(data.tiedPlayers);
            setGameState('EMPATE');
        });

        playSocket.on('round_reset', (data) => {
            // Nueva ronda en sesión continua
            setRoundNumber(data.roundNumber);
            setDrawnNumbers([]);
            setCurrentBall(null);
            setWinner(null);
            setTiedPlayers([]);
            setLastMarked(null);
            setMarkedCount(1);
            setPhase('lobby');
            setGameState('LOBBY');
            setCard(null); // Se recibirá nuevo card_assigned
        });

        playSocket.on('room_closed', () => {
            setPhase('error');
            setErrorMsg('La sala fue cerrada por el administrador.');
        });

        playSocket.on('error', (err) => {
            if (err.code === 'ROOM_NOT_FOUND') {
                setPhase('error');
                setErrorMsg('La sala no existe o ya fue cerrada.');
            } else if (err.code === 'ROOM_FULL') {
                setPhase('error');
                setErrorMsg('La sala está llena. Máximo de jugadores alcanzado.');
            } else {
                console.error('[play] Error:', err);
            }
        });

        return () => {
            playSocket.off('connect');
            playSocket.off('disconnect');
            playSocket.off('card_assigned');
            playSocket.off('game_state_update');
            playSocket.off('number_drawn');
            playSocket.off('number_marked');
            playSocket.off('nickname_updated');
            playSocket.off('bingo_winner');
            playSocket.off('tie_break_start');
            playSocket.off('round_reset');
            playSocket.off('room_closed');
            playSocket.off('error');
            playSocket.disconnect();
        };
    }, [roomId, playerId]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleJoin = useCallback((name) => {
        setIsConnecting(true);
        playSocket.emit('join_room', { roomId, playerId, playerName: name });
    }, [roomId, playerId]);

    const handleMarkNumber = useCallback((number) => {
        playSocket.emit('mark_number', { roomId, playerId, number });
    }, [roomId, playerId]);

    // ── Calcular progreso del cartón ──────────────────────────────────────────
    // Excluir la casilla libre (que suele ser la del centro, number: null)
    // El backend puede enviarla marcada o no, pero para el usuario es 0/24 aciertos.
    const activeCells = card ? card.flat().filter(c => c.number !== null) : [];
    const markedActiveCount = activeCells.filter(c => c.marked).length;
    const totalCells = 24;
    const progressPct = Math.round((markedActiveCount / totalCells) * 100);

    // ── Pantalla de error ─────────────────────────────────────────────────────
    if (phase === 'error') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px', padding: '24px', textAlign: 'center' }}>
                <span style={{ fontSize: '3rem' }}>⚠️</span>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Error</h1>
                <p style={{ color: 'var(--color-text-muted)' }}>{errorMsg}</p>
            </div>
        );
    }

    // ── Pantalla de ingreso de nombre ─────────────────────────────────────────
    if (phase === 'name_entry') {
        return (
            <NameEntry
                onJoin={handleJoin}
                roomId={roomId}
                isConnecting={isConnecting}
            />
        );
    }

    // ── Pantalla de resultado ─────────────────────────────────────────────────
    if (phase === 'finished') {
        return (
            <GameResult
                winner={winner}
                myPlayerId={playerId}
                sessionType={sessionType}
            />
        );
    }

    // ── Vista principal del juego ─────────────────────────────────────────────
    // Últimos 5 números para mostrar en la cabecera
    const recentBalls = drawnNumbers.slice(-5).reverse();

    return (
        <div className={styles.playLayout}>
            {/* Banner de desconexión */}
            <DisconnectBanner isConnected={isConnected} isReconnecting={!isConnected} />

            {/* Header: Logo izq, Estado centro, Nombre der */}
            <header className={styles.playHeader}>
                <div className={styles.headerLeft}>
                    <span className={styles.playLogo}>🎱 Bingo 75</span>
                </div>

                <div className={styles.headerCenter}>
                    <StatusBadge state={gameState} />
                </div>

                <div className={styles.headerRight}>
                    <span className={styles.playerNameTag}>{playerName}</span>
                </div>
            </header>

            {/* Overlay de empate */}
            {(gameState === 'EMPATE' || gameState === 'RULETA') && (
                <div className={styles.tieOverlay}>
                    <div className={styles.tieCard}>
                        <div className={styles.tieEmoji}>🤝</div>
                        <h2 className={styles.tieTitle}>¡Empate!</h2>
                        <p className={styles.tieSubtitle}>
                            {tiedPlayers.length} jugadores empataron.
                            <br />El administrador girará la ruleta...
                        </p>
                    </div>
                </div>
            )}

            <div className={styles.playContent}>
                {/* Lobby: esperando inicio */}
                {phase === 'lobby' && (
                    <div className={styles.playerLobby}>
                        <p className={styles.lobbyWaitText}>
                            Esperando que el administrador inicie el juego
                            <span className={styles.lobbyWaitDots} />
                        </p>
                        {/* Mostrar cartón en preview si ya fue asignado */}
                        {card && (
                            <div className={styles.lobbyCardPreview}>
                                <BingoCard
                                    card={card}
                                    markingMode="auto"
                                    drawnNumbers={[]}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Juego activo */}
                {phase === 'playing' && (
                    <>
                        {/* Últimos números (Strip) */}
                        <LastNumber recentBalls={recentBalls} currentBall={currentBall} />

                        {/* Hint modo manual */}
                        {markingMode === 'manual' && (
                            <div className={styles.manualHint}>
                                👆 Tocá los números sorteados para marcarlos
                            </div>
                        )}

                        {/* Cartón */}
                        <BingoCard
                            card={card}
                            markingMode={markingMode}
                            drawnNumbers={drawnNumbers}
                            onMarkNumber={handleMarkNumber}
                            lastMarkedNumber={lastMarked}
                        />

                        {/* Barra de progreso */}
                        <div className={styles.progressBar}>
                            <div className={styles.progressLabel}>
                                <span>Progreso del cartón</span>
                                <span>{markedActiveCount} / {totalCells} ({progressPct}%)</span>
                            </div>
                            <div className={styles.progressTrack}>
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                        </div>

                        {/* Contador de bolas */}
                        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                            {drawnNumbers.length} de 75 bolas sorteadas
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/**
 * PlayView.jsx
 * Vista del jugador (/play) — Mobile First.
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
    const [phase, setPhase] = useState('name_entry'); // name_entry | lobby | playing | finished | kicked | error
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
    const [wasBanned, setWasBanned] = useState(false);

    const hasJoined = useRef(false);
    const markingModeRef = useRef('auto');

    useEffect(() => {
        markingModeRef.current = markingMode;
    }, [markingMode]);

    // ── Sin roomId ────────────────────────────────────────────────────────────
    if (!roomId) {
        return (
            <div className={styles.playLayout}>
                <div className={styles.playContent}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
                        <span style={{ fontSize: '3rem' }}>❌</span>
                        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Sala no especificada</h1>
                        <p style={{ color: 'var(--color-text-muted)' }}>
                            Necesitás un enlace con el código de sala, por ejemplo:
                        </p>
                        <code style={{ color: 'var(--color-accent)', fontSize: '1rem' }}>/play?room=XXXX</code>
                    </div>
                </div>
            </div>
        );
    }

    // ── Conexión Socket.IO ────────────────────────────────────────────────────
    useEffect(() => {
        playSocket.connect();

        playSocket.on('connect', () => {
            setIsConnected(true);
            setIsConnecting(false);

            const savedName = localStorage.getItem('bingo75_playerName');
            if (hasJoined.current && savedName) {
                playSocket.emit('reconnect_player', { roomId, playerId, playerName: savedName });
            }
        });

        playSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        playSocket.on('card_assigned', (data) => {
            setCard(data.card);
            setMarkingMode(data.markingMode);
            setSessionType(data.sessionType || 'single');
            setPlayerName(data.playerName);
            localStorage.setItem('bingo75_playerName', data.playerName);
            hasJoined.current = true;

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
            setPhase('playing');
            setGameState('EN_JUEGO');

            setCurrentBall({ number: data.number, column: data.column, nickname: data.nickname });
            setDrawnNumbers(data.drawnNumbers);

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
            setRoundNumber(data.roundNumber);
            setDrawnNumbers([]);
            setCurrentBall(null);
            setWinner(null);
            setTiedPlayers([]);
            setLastMarked(null);
            setMarkedCount(1);
            setPhase('lobby');
            setGameState('LOBBY');
            setCard(null);
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
            } else if (err.code === 'PLAYER_BANNED') {
                setPhase('kicked');
                setWasBanned(true);
            } else {
                console.error('[play] Error:', err);
            }
        });

        playSocket.on('player_kicked', (data) => {
            setPhase('kicked');
            setWasBanned(data.banned || false);
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
            playSocket.off('player_kicked');
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

    // ── Progreso del cartón ───────────────────────────────────────────────────
    const activeCells = card ? card.flat().filter(c => c.number !== null) : [];
    const markedActiveCount = activeCells.filter(c => c.marked).length;
    const totalCells = 24;
    const progressPct = Math.round((markedActiveCount / totalCells) * 100);

    // ── Contenido según fase ─────────────────────────────────────────────────
    const recentBalls = drawnNumbers.slice(-5).reverse();

    const renderMain = () => {
        if (phase === 'error') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
                    <span style={{ fontSize: '3rem' }}>⚠️</span>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Error</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>{errorMsg}</p>
                </div>
            );
        }

        if (phase === 'name_entry') {
            return (
                <NameEntry
                    onJoin={handleJoin}
                    roomId={roomId}
                    isConnecting={isConnecting}
                />
            );
        }

        if (phase === 'kicked') {
            return (
                <div className={styles.kickedScreen}>
                    <div className={styles.kickedCard}>
                        <div className={styles.kickedEmoji}>🚫</div>
                        <h1 className={styles.kickedTitle}>Expulsado</h1>
                        <p className={styles.kickedMessage}>
                            Fuiste expulsado de la sala por el administrador.
                            {wasBanned
                                ? ' No podés volver a unirte a esta partida.'
                                : ' Podés intentar unirte nuevamente.'}
                        </p>
                    </div>
                </div>
            );
        }

        if (phase === 'finished') {
            return (
                <GameResult
                    winner={winner}
                    myPlayerId={playerId}
                    sessionType={sessionType}
                />
            );
        }

        // lobby / playing
        return (
            <>
                {/* Header: solo cuando ya estás dentro (no en name_entry) */}
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

                {/* Contenido */}
                {phase === 'lobby' && (
                    <div className={styles.playerLobby}>
                        <p className={styles.lobbyWaitText}>
                            Esperando que el administrador inicie el juego
                            <span className={styles.lobbyWaitDots} />
                        </p>

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

                {phase === 'playing' && (
                    <>
                        <LastNumber recentBalls={recentBalls} currentBall={currentBall} />

                        {markingMode === 'manual' && (
                            <div className={styles.manualHint}>
                                👆 Tocá los números sorteados para marcarlos
                            </div>
                        )}

                        <BingoCard
                            card={card}
                            markingMode={markingMode}
                            drawnNumbers={drawnNumbers}
                            onMarkNumber={handleMarkNumber}
                            lastMarkedNumber={lastMarked}
                        />

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

                        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                            {drawnNumbers.length} de 75 bolas sorteadas
                        </div>
                    </>
                )}
            </>
        );
    };

    // ── Wrapper único (centrado SIEMPRE) ───────────────────────────────────────
    // ✅ Esto hace que name_entry también quede centrado y con max-width.
    return (
        <div className={styles.playLayout}>
            <DisconnectBanner isConnected={isConnected} isReconnecting={!isConnected} />

            {/* ✅ el contenido completo vive dentro del contenedor centrado */}
            <div className={styles.playContent}>
                {renderMain()}
            </div>
        </div>
    );
}
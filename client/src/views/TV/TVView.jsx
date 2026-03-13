/**
 * TVView.jsx
 * Vista de proyección para TV/pantalla grande (/tv).
 *
 * Responsabilidades:
 *   - Conectar al namespace /tv de Socket.IO.
 *   - Emitir join_tv con el roomId del query param.
 *   - Escuchar game_state_update, number_drawn, nickname_updated,
 *     tie_break_start, tie_break_result, room_closed.
 *   - Renderizar BingoBoard, CurrentNumber, GameStatus, TieBreakRoulette.
 *
 * REGLA: No modifica el backend. Solo consume eventos ya definidos.
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { tvSocket } from '@/socket/socketClient';
import StatusBadge from '@/components/StatusBadge';
import BingoBoard from './BingoBoard';
import CurrentNumber from './CurrentNumber';
import GameStatus from './GameStatus';
import TieBreakRoulette from './TieBreakRoulette';
import styles from './TV.module.css';

const COLUMN_COLOR = { B: 'var(--color-B)', I: 'var(--color-I)', N: 'var(--color-N)', G: 'var(--color-G)', O: 'var(--color-O)' };

export default function TVView() {
    const [searchParams] = useSearchParams();
    const roomId = searchParams.get('room');

    const [isConnected, setIsConnected] = useState(false);
    const [gameState, setGameState] = useState('LOBBY');
    const [drawnNumbers, setDrawnNumbers] = useState([]);
    const [currentBall, setCurrentBall] = useState(null);
    const [players, setPlayers] = useState([]);
    const [winner, setWinner] = useState(null);
    const [tiedPlayers, setTiedPlayers] = useState([]);
    const [tieWinner, setTieWinner] = useState(null);
    const [roundNumber, setRoundNumber] = useState(1);
    const [roomInfo, setRoomInfo] = useState(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [roomClosed, setRoomClosed] = useState(false);
    const [qrBase64, setQrBase64] = useState(null);
    const [joinUrl, setJoinUrl] = useState(null);


    // ── Conexión Socket.IO ────────────────────────────────────────────────────
    useEffect(() => {
        tvSocket.connect();

        tvSocket.on('connect', () => {
            setIsConnected(true);
            // Unirse a la sala especificada en el query param
            if (roomId) {
                tvSocket.emit('join_tv', { roomId });
            }
        });

        tvSocket.on('disconnect', () => setIsConnected(false));

        tvSocket.on('game_state_update', (data) => {
            console.log('[TV] Nuevo estado recibido:', data.state);
            setGameState(data.state);
            setDrawnNumbers(data.drawnNumbers || []);
            setCurrentBall(data.currentBall || null);
            setPlayers(data.players || []);
            setRoundNumber(data.roundNumber || 1);
            if (data.winner) setWinner(data.winner);
            if (data.tiedPlayers?.length) setTiedPlayers(data.tiedPlayers);
            if (data.qrBase64) setQrBase64(data.qrBase64);
            if (data.joinUrl) setJoinUrl(data.joinUrl);
        });


        tvSocket.on('number_drawn', (data) => {
            setGameState(prev => prev === 'LOBBY' ? 'EN_JUEGO' : prev);
            setCurrentBall({ number: data.number, column: data.column, nickname: data.nickname, remaining: data.remaining });
            setDrawnNumbers(data.drawnNumbers);
        });

        tvSocket.on('nickname_updated', (data) => {
            setCurrentBall(prev =>
                prev?.number === data.number ? { ...prev, nickname: data.nickname } : prev
            );
        });

        tvSocket.on('tie_break_start', (data) => {
            setTiedPlayers(data.tiedPlayers);
            setTieWinner(null);
            setIsSpinning(true);
        });

        tvSocket.on('tie_break_result', (data) => {
            setTieWinner({ playerId: data.winnerId, playerName: data.winnerName });
            setIsSpinning(false);
        });

        tvSocket.on('round_reset', (data) => {
            setRoundNumber(data.roundNumber);
            setDrawnNumbers([]);
            setCurrentBall(null);
            setWinner(null);
            setTiedPlayers([]);
            setTieWinner(null);
            setIsSpinning(false);
        });

        tvSocket.on('room_closed', () => {
            setRoomClosed(true);
            setGameState('CERRADO');
            // Intentar cerrar la pestaña
            try {
                window.close();
                // Si no funciona, intento secundario
                if (!window.closed) {
                    window.open('', '_self', '');
                    window.close();
                }
            } catch (e) {
                console.log('No se pudo cerrar la pestaña automáticamente', e);
            }
        });

        tvSocket.on('error', (err) => {
            console.error('[tv] Error:', err);
        });

        return () => {
            tvSocket.off('connect');
            tvSocket.off('disconnect');
            tvSocket.off('game_state_update');
            tvSocket.off('number_drawn');
            tvSocket.off('nickname_updated');
            tvSocket.off('tie_break_start');
            tvSocket.off('tie_break_result');
            tvSocket.off('round_reset');
            tvSocket.off('room_closed');
            tvSocket.off('error');
            tvSocket.disconnect();
        };
    }, [roomId]);

    // ── Pantalla: sin roomId ──────────────────────────────────────────────────
    if (!roomId) {
        return (
            <div className={styles.lobbyScreen}>
                <h1 className={styles.tvLogo}>🎱 Bingo 75</h1>
                <p className={styles.lobbySubtitle}>
                    Abre esta URL con el parámetro de sala:
                </p>
                <code style={{ color: 'var(--color-accent)', fontSize: '1.1rem' }}>
                    /tv?room=XXXX
                </code>
            </div>
        );
    }

    // ── Pantalla: sala cerrada ────────────────────────────────────────────────
    if (roomClosed) {
        return (
            <div className={styles.lobbyScreen}>
                <span style={{ fontSize: '4rem' }}>🔒</span>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem' }}>Sala Cerrada</h1>
                <p className={styles.lobbySubtitle}>El administrador cerró la sala.</p>
            </div>
        );
    }

    // ── Pantalla: Lobby (esperando jugadores) ─────────────────────────────────
    if (gameState === 'LOBBY') {
        return (
            <div className={styles.lobbyScreen}>
                {!isConnected && (
                    <div className={styles.disconnectedBanner}>
                        ⚠️ Reconectando...
                    </div>
                )}

                <h1 className={styles.lobbyLogo}>🎱 Bingo 75</h1>

                {/* Layout: QR a la izquierda, info a la derecha */}
                <div className={styles.lobbyContent}>

                    {/* QR */}
                    <div className={styles.qrBlock}>
                        {qrBase64 ? (
                            <>
                                <img
                                    src={qrBase64}
                                    alt="QR para unirse"
                                    className={styles.qrLarge}
                                />
                                <p className={styles.qrCaption}>Escanea para jugar</p>
                            </>
                        ) : (
                            <div className={styles.qrPlaceholder}>
                                <span style={{ fontSize: '4rem' }}>⏳</span>
                                <p className="text-muted text-sm">Esperando sala...</p>
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className={styles.lobbyInfo}>
                        <p className={styles.lobbyInstruction}>Ingresa con el código:</p>
                        <div className={styles.lobbyRoomId}>{roomId}</div>

                        {joinUrl && (
                            <p className={styles.lobbyUrl}>{joinUrl}</p>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
                            <StatusBadge state="LOBBY" />
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>
                                {players.length} jugador{players.length !== 1 ? 'es' : ''} conectado{players.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* Lista de jugadores */}
                        {players.length > 0 && (
                            <div className={styles.lobbyPlayerList}>
                                {players.map(p => (
                                    <div key={p.playerId} className={styles.lobbyPlayerChip}>
                                        {p.playerName}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── Vista principal del juego ─────────────────────────────────────────────
    const recentDrawn = [...drawnNumbers].reverse().slice(0, 12);

    return (
        <div className={styles.tvLayout}>
            {/* Banner de desconexión */}
            {!isConnected && (
                <div className={styles.disconnectedBanner}>
                    ⚠️ Conexión perdida — Reconectando...
                </div>
            )}

            {/* Overlay de ruleta */}
            {(gameState === 'EMPATE' || gameState === 'RULETA') && tiedPlayers.length > 0 && (
                <TieBreakRoulette
                    tiedPlayers={tiedPlayers}
                    tieWinner={tieWinner}
                    isSpinning={isSpinning || gameState === 'RULETA'}
                />
            )}

            {/* Header */}
            <header className={styles.tvHeader}>
                <span className={styles.tvLogo}>🎱 Bingo 75</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <StatusBadge state={gameState} />
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        Sala <strong style={{ color: 'var(--color-primary)' }}>{roomId}</strong>
                    </span>
                </div>
            </header>

            {/* Área izquierda */}
            <div className={styles.tvLeft}>
                {/* Número actual GIGANTE */}
                <CurrentNumber currentBall={currentBall} />

                {/* Grid 1-75 */}
                <BingoBoard drawnNumbers={drawnNumbers} currentBall={currentBall} />
            </div>

            {/* Área derecha */}
            <div className={styles.tvRight}>
                <GameStatus
                    state={gameState}
                    players={players}
                    drawnCount={drawnNumbers.length}
                    winner={winner}
                    roundNumber={roundNumber}
                />

                {/* Últimos números sorteados */}
                {/* Historial Cronológico de Números */}
                {drawnNumbers.length > 0 && (
                    <div className={styles.historySection}>
                        <p className={styles.historyTitle}>Historial del Juego</p>
                        <div className={styles.historyGrid}>
                            {drawnNumbers.map((n, i) => {
                                const col = n <= 15 ? 'B' : n <= 30 ? 'I' : n <= 45 ? 'N' : n <= 60 ? 'G' : 'O';
                                const isLast = i === drawnNumbers.length - 1;
                                return (
                                    <span
                                        key={`${i}-${n}`}
                                        className={`${styles.historyChip} ${isLast ? styles.historyChipLast : ''}`}
                                        style={{
                                            color: `var(--color-${col})`,
                                            borderColor: `var(--color-${col})`,
                                            background: isLast ? `var(--color-${col})` : `var(--color-${col})11`,
                                            color: isLast ? '#000' : `var(--color-${col})`
                                        }}
                                    >
                                        <span style={{ fontSize: '0.7em', opacity: 0.8, marginRight: '2px' }}>{i + 1}</span>
                                        <span style={{ fontWeight: 900 }}>{col}{n}</span>
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

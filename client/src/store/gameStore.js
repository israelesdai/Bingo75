/**
 * gameStore.js
 * Estado global del juego compartido entre componentes.
 * Usa Zustand para simplicidad y rendimiento.
 *
 * Cada vista solo suscribe a las partes del estado que necesita.
 */

import { create } from 'zustand';

const useGameStore = create((set, get) => ({
    // ── Estado de sala ──────────────────────────────────────────────
    roomId: null,
    roomInfo: null,   // { ip, port, joinUrl, tvUrl, qrBase64, sessionType, markingMode }

    // ── Estado del juego ────────────────────────────────────────────
    gameState: 'LOBBY',  // LOBBY | EN_JUEGO | EMPATE | RULETA | FINALIZADO | CERRADO
    roundNumber: 1,
    drawnNumbers: [],
    currentBall: null,     // { number, column, nickname, remaining }
    players: [],
    winner: null,     // { playerId, playerName }
    tiedPlayers: [],
    tieWinner: null,
    speechEnabled: false,
    coincidencias: 0,     // cuántos cartones contienen el número actual

    // ── Estado de conexión ──────────────────────────────────────────
    isConnected: false,
    isConnecting: false,

    // ── Cartón del jugador (solo /play) ────────────────────────────
    myCard: null,
    myCardHash: null,
    myPlayerId: null,
    myPlayerName: '',

    // ── Acciones ────────────────────────────────────────────────────

    setRoomCreated: (info) => set({
        roomId: info.roomId,
        roomInfo: info,
        gameState: 'LOBBY',
    }),

    setGameStateUpdate: (state) => set({
        gameState: state.state,
        roundNumber: state.roundNumber,
        drawnNumbers: state.drawnNumbers || [],
        currentBall: state.currentBall || null,
        players: state.players || [],
        tiedPlayers: state.tiedPlayers || [],
        speechEnabled: state.speechEnabled || false,
        winner: state.winner || null,
        roomId: state.roomId || get().roomId,
        coincidencias: state.coincidencias ?? 0,
    }),

    setNumberDrawn: (data) => set({
        currentBall: { number: data.number, column: data.column, nickname: data.nickname, remaining: data.remaining },
        drawnNumbers: data.drawnNumbers,
    }),

    setNicknameUpdated: (data) => set((s) => ({
        currentBall: s.currentBall?.number === data.number
            ? { ...s.currentBall, nickname: data.nickname }
            : s.currentBall,
    })),

    setTiedPlayers: (players) => set({ tiedPlayers: players }),
    setTieWinner: (winner) => set({ tieWinner: winner }),

    setCard: (card, hash) => set({ myCard: card, myCardHash: hash }),

    setConnected: (v) => set({ isConnected: v, isConnecting: false }),
    setConnecting: (v) => set({ isConnecting: v }),

    setPlayerId: (id) => set({ myPlayerId: id }),
    setPlayerName: (name) => set({ myPlayerName: name }),

    reset: () => set({
        roomId: null, roomInfo: null, gameState: 'LOBBY',
        roundNumber: 1, drawnNumbers: [], currentBall: null,
        players: [], winner: null, tiedPlayers: [], tieWinner: null,
        myCard: null, myCardHash: null,
    }),
}));

export default useGameStore;

/**
 * server/index.js
 * Entry point del servidor Bingo 75.
 *
 * Arranca Express + Socket.IO y sirve el cliente React (en producción).
 * En desarrollo, el cliente corre en Vite (puerto 5173) con proxy al servidor.
 */

require('dotenv').config();

const express = require('express');
const http = require('http');
const path = require('path');
const { initSocketGateway } = require('./socketGateway/index');
const { getLocalIP } = require('./utils/ipDetector');
const { PORT, MAX_PLAYERS } = require('./config/constants');

const app = express();
const httpServer = http.createServer(app);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Rutas de diagnóstico (API REST mínima) ────────────────────────────────────

/** Health check */
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/** Info del servidor (IP, puerto, configuración) */
app.get('/api/info', (req, res) => {
    res.json({
        ip: getLocalIP(),
        port: PORT,
        maxPlayers: MAX_PLAYERS,
        version: '1.0.0-mvp',
    });
});

// ── Servir cliente React (solo en producción) ─────────────────────────────────
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(clientDist));
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientDist, 'index.html'));
    });
}

// ── Socket.IO ─────────────────────────────────────────────────────────────────
initSocketGateway(httpServer);

// ── Arrancar servidor ─────────────────────────────────────────────────────────
httpServer.listen(PORT, '0.0.0.0', () => {
    const ip = getLocalIP();
    const isDev = process.env.NODE_ENV !== 'production';
    const clientPort = isDev ? 5173 : PORT;
    const localBase = `http://localhost:${clientPort}`;
    const lanBase = `http://${ip}:${clientPort}`;

    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║              🎱  BINGO 75 — MVP LOCAL                    ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    if (isDev) {
        console.log('║  MODO DESARROLLO — cliente en Vite (puerto 5173)         ║');
        console.log('╠══════════════════════════════════════════════════════════╣');
    }
    console.log(`║  Admin (tu PC):   ${localBase}/admin`.padEnd(61) + '║');
    console.log(`║  TV (tu PC):      ${localBase}/tv?room=XXXX`.padEnd(61) + '║');
    console.log(`║  Jugadores (LAN): ${lanBase}/play?room=XXXX`.padEnd(61) + '║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');

    if (MAX_PLAYERS > 20) {
        console.warn(`⚠️  MAX_PLAYERS=${MAX_PLAYERS} supera el límite recomendado de 20 para LAN.`);
    }
});

// ── Manejo de errores no capturados ──────────────────────────────────────────
process.on('uncaughtException', (err) => {
    console.error('[server] Error no capturado:', err.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('[server] Promise rechazada:', reason);
});

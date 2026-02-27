/**
 * RoomSetup.jsx
 * Panel de creación/info de sala para el Admin.
 *
 * Tras el rediseño: el QR y las URLs de jugadores están en la TV.
 * Aquí solo mostramos el código de sala y la configuración.
 */

import { useState } from 'react';
import styles from './Admin.module.css';

export default function RoomSetup({ onCreateRoom, roomInfo, isConnected }) {
    const [sessionType, setSessionType] = useState('single');
    const [markingMode, setMarkingMode] = useState('auto');

    const handleCreate = () => {
        onCreateRoom({ sessionType, markingMode });
    };

    // ── Sala ya creada ────────────────────────────────────────────────────────
    if (roomInfo) {
        return (
            <div className={`card-glass ${styles.roomInfoCard} animate-scale-in`}>
                <h2 className={styles.roomId}>
                    Sala <span>{roomInfo.roomId}</span>
                </h2>
                <p className="text-muted text-sm" style={{ marginBottom: '16px' }}>
                    {roomInfo.sessionType === 'continuous' ? '🔄 Sesión continua' : '1️⃣ Sesión única'}
                    {' · '}
                    {roomInfo.markingMode === 'auto' ? '🤖 Marcado automático' : '👆 Marcado manual'}
                </p>

                <a
                    id="btn-open-tv"
                    href={roomInfo.tvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary w-full"
                    style={{ textDecoration: 'none', textAlign: 'center' }}
                >
                    📺 Abrir TV en nueva pestaña
                </a>
            </div>
        );
    }

    // ── Crear sala ────────────────────────────────────────────────────────────
    return (
        <div className="card-glass animate-fade-in">
            <h2 className={styles.sectionTitle}>🎱 Nueva Sala</h2>
            <p className="text-muted text-sm" style={{ marginBottom: '24px' }}>
                Configura la sala antes de que los jugadores se unan.
            </p>

            <div className={styles.formGrid}>
                <div>
                    <label className="label">Tipo de sesión</label>
                    <select
                        id="sessionType"
                        className={`input select ${styles.select}`}
                        value={sessionType}
                        onChange={(e) => setSessionType(e.target.value)}
                    >
                        <option value="single">Sesión única (1 ronda)</option>
                        <option value="continuous">Sesión continua (múltiples rondas)</option>
                    </select>
                </div>

                <div>
                    <label className="label">Modo de marcado</label>
                    <select
                        id="markingMode"
                        className={`input select ${styles.select}`}
                        value={markingMode}
                        onChange={(e) => setMarkingMode(e.target.value)}
                    >
                        <option value="auto">Automático (el servidor marca)</option>
                        <option value="manual">Manual (el jugador toca)</option>
                    </select>
                </div>
            </div>

            <button
                id="btn-create-room"
                className="btn btn-primary btn-lg w-full"
                style={{ marginTop: '24px' }}
                onClick={handleCreate}
                disabled={!isConnected}
            >
                {isConnected ? '✨ Crear Sala' : '⏳ Conectando...'}
            </button>
        </div>
    );
}

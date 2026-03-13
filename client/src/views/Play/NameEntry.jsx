/**
 * NameEntry.jsx
 * Pantalla de ingreso de nombre antes de unirse a la sala.
 * El nombre es opcional — si no ingresa, el servidor asigna uno automático.
 */

import { useState } from 'react';
import styles from './Play.module.css';

export default function NameEntry({ onJoin, roomId, isConnecting }) {
    const [name, setName] = useState('');

    const handleJoin = () => {
        onJoin(name.trim());
    };

    const handleKey = (e) => {
        if (e.key === 'Enter') handleJoin();
    };

    return (
        <div className={styles.nameEntryScreen}>
            <div className={styles.nameEntryCard}>
                {/* Logo */}
                <div className={styles.nameEntryLogo}>🎱</div>
                <h1 className={styles.nameEntryTitle}>Bingo 75</h1>
                <p className={styles.nameEntrySubtitle}>
                    Sala <span className={styles.roomIdBadge}>{roomId}</span>
                </p>

                <div className={styles.nameEntryForm}>
                    <label className="label" htmlFor="input-player-name">
                        Tu nombre (opcional)
                    </label>
                    <input
                        id="input-player-name"
                        className={`input ${styles.nameInput}`}
                        type="text"
                        placeholder="Ej: María, El Tío Juan..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={handleKey}
                        maxLength={30}
                        autoComplete="off"
                        autoFocus
                    />
                    <p className={styles.nameHint}>
                        Si lo dejás vacío, se te asignará un nombre automático.
                    </p>
                </div>

                <button
                    id="btn-join-game"
                    className={`btn btn-primary btn-lg w-full ${styles.joinBtn}`}
                    onClick={handleJoin}
                    disabled={isConnecting}
                >
                    {isConnecting ? (
                        <><span className="spinner" /> Conectando...</>
                    ) : (
                        '🎮 ¡Unirse al juego!'
                    )}
                </button>

                <p className={styles.nameWarning}>
                    Juego familiar: elige un nombre apropiado y mantén un buen ambiente. Quien no respete las reglas será expulsado.
                </p>
            </div>
        </div>
    );
}

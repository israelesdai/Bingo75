/**
 * DisconnectBanner.jsx
 * Banner de aviso cuando el jugador pierde conexión con el servidor.
 * Aparece en la parte superior con mensaje claro y estado de reconexión.
 */

import styles from './Play.module.css';

export default function DisconnectBanner({ isConnected, isReconnecting }) {
    if (isConnected) return null;

    return (
        <div className={styles.disconnectBanner} role="alert">
            <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
            <span>
                {isReconnecting
                    ? 'Reconectando... Tu progreso se guardará.'
                    : 'Sin conexión — Intentando reconectar...'}
            </span>
        </div>
    );
}

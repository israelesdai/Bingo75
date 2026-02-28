/**
 * RoomProgress.jsx
 * Muestra el progreso colectivo de la sala agrupando jugadores
 * por cantidad de casillas marcadas. Solo visible durante la partida.
 */

import styles from './RoomProgress.module.css';

// Definición de grupos con sus rangos, colores e íconos
const GROUPS = [
    { key: 'low', label: '0–4 marcados', min: 0, max: 4, color: 'var(--rp-blue)', icon: '🔵' },
    { key: 'midLow', label: '5–9 marcados', min: 5, max: 9, color: 'var(--rp-purple)', icon: '🟣' },
    { key: 'mid', label: '10–14 marcados', min: 10, max: 14, color: 'var(--rp-green)', icon: '🟢' },
    { key: 'high', label: '15–19 marcados', min: 15, max: 19, color: 'var(--rp-orange)', icon: '🟠' },
    { key: 'critical', label: '20–23 marcados', min: 20, max: 23, color: 'var(--rp-red)', icon: '🔴' },
];

// Hitos positivos: se activan cuando al menos un jugador alcanza el rango
// Se evalúan de mayor a menor, se muestra solo el más alto alcanzado
const REACH_MILESTONES = [
    { key: 'critical', threshold: 20, text: '🔥 Ya hay jugadores con 20 números' },
    { key: 'high', threshold: 15, text: '🟠 Ya hay jugadores con 15 números' },
    { key: 'mid', threshold: 10, text: '🟢 Ya hay jugadores con 10 números' },
    { key: 'midLow', threshold: 5, text: '🟣 Ya hay jugadores con 5 números' },
];

export default function RoomProgress({ players = [], gameState }) {
    const isPlaying = gameState === 'EN_JUEGO' || gameState === 'EMPATE'
        || gameState === 'RULETA' || gameState === 'FINALIZADO';

    if (!isPlaying || players.length === 0) return null;

    const total = players.length;

    // Calcular jugadores en cada grupo (markedCount incluye FREE, igual que PlayerList)
    const counts = {};
    GROUPS.forEach(({ key, min, max }) => {
        counts[key] = players.filter(p => {
            const raw = p.markedCount ?? 0;
            const effective = Math.max(0, raw - 1); // excluir FREE
            return effective >= min && effective <= max;
        }).length;
    });

    // Buscar el mayor hito de marcado alcanzado por algún jugador
    const maxEffective = Math.max(...players.map(p => Math.max(0, (p.markedCount ?? 0) - 1)));
    const milestone = REACH_MILESTONES.find(m => maxEffective >= m.threshold) || null;

    return (
        <div className={styles.card}>
            <h3 className={styles.title}>📊 Progreso de la Sala</h3>

            <div className={styles.groupList}>
                {GROUPS.map(({ key, label, color, icon }) => {
                    const count = counts[key];
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;

                    return (
                        <div key={key} className={styles.groupRow}>
                            {/* Ícono circular */}
                            <span
                                className={styles.dot}
                                style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                                title={label}
                            />

                            {/* Etiqueta */}
                            <span className={styles.groupLabel}>{label}</span>

                            {/* Cantidad */}
                            <span className={styles.groupCount} style={{ color }}>
                                {count}
                            </span>

                            {/* Barra de progreso */}
                            <div className={styles.barTrack}>
                                <div
                                    className={styles.barFill}
                                    style={{
                                        width: `${pct}%`,
                                        background: color,
                                        boxShadow: pct > 0 ? `0 0 6px ${color}` : 'none',
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Mensaje de hito */}
            {milestone && (
                <div className={styles.milestone}>
                    {milestone.text}
                </div>
            )}
        </div>
    );
}

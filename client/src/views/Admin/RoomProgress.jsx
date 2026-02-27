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

// Hitos por progreso: se activan cuando el grupo llega a 0 jugadores
const ZERO_MILESTONES = [
    { key: 'low', text: '✅ Ya todos superaron 4 marcados' },
    { key: 'midLow', text: '✅ Ya todos superaron 9 marcados' },
    { key: 'mid', text: '✅ Ya todos superaron 14 marcados' },
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

    // Hito de alerta: hay jugadores con 20+ marcados (más urgente, tiene prioridad)
    const criticalAlert = counts.critical > 0
        ? { text: '🔥 Ya hay jugadores con 20 marcados' }
        : null;

    // Hito de avance: el más reciente grupo en llegar a 0 (de mayor a menor para obtener el último)
    const progressMilestone = [...ZERO_MILESTONES].reverse().find(m => counts[m.key] === 0) || null;

    // Prioridad: alerta crítica > hito de avance
    const milestone = criticalAlert || progressMilestone;

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

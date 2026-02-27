/**
 * StatusBadge.jsx
 * Badge visual del estado del juego con dot pulsante.
 */

const STATE_LABELS = {
    LOBBY: 'Lobby',
    EN_JUEGO: 'En Juego',
    EMPATE: 'Empate',
    RULETA: 'Ruleta',
    FINALIZADO: 'Finalizado',
    CERRADO: 'Cerrado',
};

export default function StatusBadge({ state }) {
    const label = STATE_LABELS[state] || state;
    const cls = `badge badge-${state?.toLowerCase()}`;

    return (
        <span className={cls}>
            <span className="pulse-dot" />
            {label}
        </span>
    );
}

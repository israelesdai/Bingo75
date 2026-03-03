/**
 * WelcomeView.jsx
 * Portada inmersiva del sistema Bingo 75.
 * Diseño visual con bolas de bingo, efectos de brillo y estilo gaming premium.
 */

import { useNavigate } from 'react-router-dom';
import styles from './Welcome.module.css';

// Bolas decorativas con posiciones predefinidas para el layout
const DECO_BALLS = [
    { num: 16, color: 'blue', x: '8%', y: '18%', size: 68, delay: 0 },
    { num: 25, color: 'silver', x: '4%', y: '38%', size: 56, delay: 0.3 },
    { num: 31, color: 'purple', x: '22%', y: '12%', size: 60, delay: 0.6 },
    { num: 21, color: 'gold', x: '15%', y: '35%', size: 54, delay: 0.9 },
    { num: 67, color: 'pink', x: '82%', y: '12%', size: 64, delay: 0.2 },
    { num: 57, color: 'silver', x: '76%', y: '25%', size: 58, delay: 0.5 },
    { num: 63, color: 'blue', x: '88%', y: '28%', size: 52, delay: 0.8 },
    { num: 45, color: 'gold', x: '80%', y: '42%', size: 60, delay: 1.1 },
    { num: 39, color: 'pink', x: '6%', y: '56%', size: 64, delay: 0.4 },
    { num: 43, color: 'blue', x: '12%', y: '72%', size: 50, delay: 0.7 },
    { num: 57, color: 'silver', x: '85%', y: '58%', size: 56, delay: 1.0 },
    { num: 64, color: 'gold', x: '78%', y: '68%', size: 66, delay: 0.1 },
    { num: 10, color: 'blue', x: '30%', y: '48%', size: 44, delay: 1.3 },
    { num: 29, color: 'pink', x: '48%', y: '38%', size: 42, delay: 0.5 },
    { num: 37, color: 'gold', x: '38%', y: '58%', size: 46, delay: 0.8 },
    { num: 48, color: 'purple', x: '52%', y: '55%', size: 44, delay: 1.2 },
    { num: 20, color: 'silver', x: '40%', y: '42%', size: 48, delay: 0.6 },
    { num: 46, color: 'blue', x: '58%', y: '50%', size: 40, delay: 0.9 },
];

// Colores de las bolas
const BALL_COLORS = {
    blue: { main: '#4a8eff', light: '#a0c4ff', dark: '#1a4eb8' },
    gold: { main: '#d4a844', light: '#f0d88a', dark: '#8a6a1a' },
    pink: { main: '#e06090', light: '#f0a0c0', dark: '#a03060' },
    silver: { main: '#b0b8c8', light: '#e0e4ea', dark: '#6a7080' },
    purple: { main: '#8b5cf6', light: '#c4a8ff', dark: '#5a2ea0' },
};

function BingoBall({ num, color, x, y, size, delay }) {
    const c = BALL_COLORS[color] || BALL_COLORS.blue;
    return (
        <div
            className={styles.ball}
            style={{
                left: x,
                top: y,
                width: size,
                height: size,
                '--ball-main': c.main,
                '--ball-light': c.light,
                '--ball-dark': c.dark,
                animationDelay: `${delay}s`,
            }}
        >
            <div className={styles.ballStripe}>
                <span className={styles.ballNumber}>{num}</span>
            </div>
        </div>
    );
}

export default function WelcomeView() {
    const navigate = useNavigate();

    return (
        <div className={styles.welcomeLayout}>
            {/* ── Fondo con partículas/estrellas ── */}
            <div className={styles.starsContainer} aria-hidden="true">
                {Array.from({ length: 40 }, (_, i) => (
                    <div
                        key={i}
                        className={styles.star}
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            '--star-size': `${1 + Math.random() * 2}px`,
                            '--star-duration': `${2 + Math.random() * 3}s`,
                            '--star-delay': `${Math.random() * 4}s`,
                        }}
                    />
                ))}
            </div>

            {/* ── Formas geométricas decorativas ── */}
            <div className={styles.geoShape1} aria-hidden="true" />
            <div className={styles.geoShape2} aria-hidden="true" />

            {/* ── Bolas de bingo decorativas ── */}
            <div className={styles.ballsContainer} aria-hidden="true">
                {DECO_BALLS.map((ball, i) => (
                    <BingoBall key={i} {...ball} />
                ))}
            </div>

            {/* ── Tómbola central ── */}
            <div className={styles.cageContainer}>
                <div className={styles.cageRing1} />
                <div className={styles.cageRing2} />
                <div className={styles.cageGlobe} />
            </div>

            {/* ── Contenido superpuesto ── */}
            <div className={styles.content}>
                <h1 className={styles.title}>Bingo 75</h1>

                <div className={styles.cageSpacer} />

                <button
                    className={styles.ctaButton}
                    onClick={() => navigate('/admin')}
                >
                    <svg className={styles.playIcon} viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>¡INICIAR JUEGO!</span>
                </button>
            </div>
        </div>
    );
}

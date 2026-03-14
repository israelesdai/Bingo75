import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Welcome.module.css';

const STAR_COUNT = 58;

const SCENE_BALLS = [
  { num: 16, color: 'purple', left: '17%', top: '30%', size: 76, delay: 0.2 },
  { num: 21, color: 'gold', left: '12%', top: '57%', size: 84, delay: 1.0 },
  { num: 16, color: 'blue', left: '24%', top: '74%', size: 86, delay: 0.6 },
  { num: 67, color: 'blue', left: '84%', top: '28%', size: 80, delay: 0.4 },
  { num: 42, color: 'gold', left: '90%', top: '49%', size: 84, delay: 1.2 },
  { num: 39, color: 'pink', left: '77%', top: '61%', size: 76, delay: 0.8 },
];

const BALL_COLORS = {
  blue: { main: '#67a8ff', light: '#d7ebff', dark: '#3462dc' },
  gold: { main: '#e4c766', light: '#fff4c0', dark: '#b28d2f' },
  pink: { main: '#df6fc1', light: '#ffd2ef', dark: '#a43f97' },
  purple: { main: '#9d7cff', light: '#ece0ff', dark: '#6840d8' },
};

function BingoBall({ num, color, left, top, size, delay }) {
  const palette = BALL_COLORS[color] || BALL_COLORS.blue;
  const fontSize = Math.max(18, Math.round(size * 0.28));

  return (
    <div
      className={styles.sceneBall}
      style={{
        left,
        top,
        width: `${size}px`,
        height: `${size}px`,
        '--ball-main': palette.main,
        '--ball-light': palette.light,
        '--ball-dark': palette.dark,
        '--ball-font-size': `${fontSize}px`,
        animationDelay: `${delay}s`,
      }}
      aria-hidden="true"
    >
      <div className={styles.ballStripe}>
        <span className={styles.ballNumber}>{num}</span>
      </div>
    </div>
  );
}

export default function WelcomeView() {
  const navigate = useNavigate();

  const stars = useMemo(
    () =>
      Array.from({ length: STAR_COUNT }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: `${1 + Math.random() * 2.8}px`,
        duration: `${2.5 + Math.random() * 4.5}s`,
        delay: `${Math.random() * 5}s`,
        opacity: 0.35 + Math.random() * 0.55,
      })),
    []
  );

  return (
    <div className={styles.welcomeLayout}>
      <div className={styles.starsContainer} aria-hidden="true">
        {stars.map((star) => (
          <span
            key={star.id}
            className={styles.star}
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              animationDuration: star.duration,
              animationDelay: star.delay,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>

      <div className={`${styles.nebula} ${styles.nebulaA}`} aria-hidden="true" />
      <div className={`${styles.nebula} ${styles.nebulaB}`} aria-hidden="true" />
      <div className={`${styles.nebula} ${styles.nebulaC}`} aria-hidden="true" />

      <div className={styles.content}>
        <h1 className={styles.title}>Bingo 75</h1>
        <p className={styles.subtitle}>Juega online con amigos y familiares</p>

        <div className={styles.scene} aria-hidden="true">
          <div className={styles.sceneGlow} />
          <div className={`${styles.ring} ${styles.ring1}`} />
          <div className={`${styles.ring} ${styles.ring2}`} />
          <div className={`${styles.ring} ${styles.ring3}`} />

          {SCENE_BALLS.map((ball) => (
            <BingoBall
              key={`${ball.num}-${ball.left}-${ball.top}`}
              {...ball}
            />
          ))}

          <div className={styles.heroBall}>
            <div className={styles.heroBallSheen} />
            <div className={styles.heroLabel}>75</div>
          </div>
        </div>

        <button
          className={styles.ctaButton}
          onClick={() => navigate('/admin')}
        >
          Entrar al juego
        </button>
      </div>
    </div>
  );
}

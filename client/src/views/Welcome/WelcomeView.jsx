import { useNavigate } from 'react-router-dom';
import styles from './Welcome.module.css';
import bingoCover from './bingo-cover.png';

export default function WelcomeView() {
  const navigate = useNavigate();

  return (
    <main className={styles.welcomeLayout}>
      <div className={styles.backgroundGlow} aria-hidden="true" />

      <div className={styles.artboard} aria-hidden="true">
        <img
          src={bingoCover}
          alt=""
          className={styles.coverImage}
          draggable="false"
        />
      </div>

      <section className={styles.content} aria-label="Portada Bingo 75">
        <h1 className={styles.srOnly}>Bingo 75</h1>
        <p className={styles.srOnly}>Juega online con amigos y familiares</p>

        <button
          type="button"
          className={styles.ctaButton}
          onClick={() => navigate('/admin')}
        >
          JUGAR
        </button>
      </section>
    </main>
  );
}

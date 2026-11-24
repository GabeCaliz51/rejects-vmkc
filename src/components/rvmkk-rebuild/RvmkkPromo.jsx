import styles from './RvmkkPromo.module.css';

export default function RvmkkPromo() {
  return (
    <section className={styles.promo} aria-labelledby="rvmkk-promo-title" data-rvmkk-promo>
      <a className={styles.poster} href="/rvmkk-rebuild" aria-label="Play Rejects Very Mortal Kumbat Kockfight">
        <img src="/assets/rvmkk-rebuild/cover.png" alt="Rejects Very Mortal Kumbat Kockfight game cover" loading="lazy" decoding="async" />
        <span>PLAY NOW <span aria-hidden="true">↗</span></span>
      </a>
      <div className={styles.copy}>
        <p className={styles.exclusive}>THE PLAYGROUND · REJECTSUNIVERSE.COM EXCLUSIVE</p>
        <h2 id="rvmkk-promo-title">REJECTS VERY MORTAL<br />KUMBAT KOCKFIGHT</h2>
        <p className={styles.tagline}>THICK SKIN. TERRIBLE TECHNIQUE.</p>
        <p>Seven Rejects. Ridiculous strikes. Living arenas. Win the match and finish the disrespect with a FUCKTALITY.</p>
        <a className={styles.play} href="/rvmkk-rebuild">ENTER THE KOCKFIGHT <span aria-hidden="true">→</span></a>
        <p className={styles.controls}>SINGLE PLAYER VS CPU · LOCAL TWO-PLAYER · PHONE CONTROLS</p>
      </div>
    </section>
  );
}

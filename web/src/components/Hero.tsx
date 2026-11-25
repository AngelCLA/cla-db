import { CoreIllustration } from './CoreIllustration';
import { hero } from '../content';
import styles from './Hero.module.css';

const TerminalGlyph = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
        <path d="m2 4 4 4-4 4 M9 12h5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
);

export const Hero = () => (
    <div className={styles.hero}>
        <div className={styles.copy}>
            <p className={styles.badge}>
                <span className={styles.badgeDot} aria-hidden="true" />
                v0.1.1 <span className={styles.badgeSep}>/</span> open source
            </p>
            <h1 className={styles.title}>
                {hero.titleLead}
                <br />
                <span className={styles.titleAccent}>{hero.titleAccent}</span>
            </h1>
            <p className={styles.lede}>{hero.lede}</p>
            <div className={styles.actions}>
                <a className={styles.primaryAction} href="#documentacion">
                    <TerminalGlyph />
                    {hero.primaryCta}
                </a>
                <a className={styles.secondaryAction} href="#ejemplo">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" focusable="false">
                        <path d="m5 5-4 4 4 4 M13 5l4 4-4 4 M11 3 7 15" stroke="currentColor" strokeWidth="1.4" />
                    </svg>
                    {hero.secondaryCta}
                </a>
            </div>
        </div>
        <figure className={styles.art}>
            <CoreIllustration />
            <figcaption className={styles.caption}>
                <span className={styles.captionDot} aria-hidden="true" />
                {hero.caption}
            </figcaption>
        </figure>
    </div>
);

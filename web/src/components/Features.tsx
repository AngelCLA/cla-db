import { FeatureIcon } from './FeatureIcon';
import { features } from '../content';
import styles from './Features.module.css';

export const Features = () => (
    <section className="section" id="caracteristicas">
        <p className="kicker">// Características</p>
        <h2 className="section-title">
            Dentro del motor<span className="accent">.</span>
        </h2>
        <div className={styles.grid}>
            {features.map(feature => (
                <article key={feature.title} className={styles.card}>
                    <span className={styles.icon}>
                        <FeatureIcon name={feature.icon} />
                    </span>
                    <h3 className={styles.cardTitle}>{feature.title}</h3>
                    <p className={styles.cardText}>{feature.text}</p>
                </article>
            ))}
        </div>
    </section>
);

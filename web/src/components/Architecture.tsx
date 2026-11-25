import { architecture } from '../content';
import styles from './Architecture.module.css';

export const Architecture = () => (
    <section className="section" id="arquitectura">
        <p className="kicker">{architecture.kicker}</p>
        <h2 className="section-title">
            {architecture.title}
            <span className="accent">.</span>
        </h2>
        <div className={styles.grid}>
            <div className={styles.copy}>
                {architecture.paragraphs.map(paragraph => (
                    <p key={paragraph.slice(0, 24)} className={styles.paragraph}>
                        {paragraph}
                    </p>
                ))}
            </div>
            <div className={styles.deltaPanel}>
                <p className={styles.deltaTitle}>{architecture.deltaTitle}</p>
                <ul className={styles.deltaList}>
                    {architecture.delta.map(entry => (
                        <li key={entry}>{entry}</li>
                    ))}
                </ul>
            </div>
        </div>
    </section>
);

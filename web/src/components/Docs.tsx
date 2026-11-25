import { CodeWindow } from './CodeWindow';
import { docs } from '../content';
import styles from './Docs.module.css';

export const Docs = () => (
    <section className="section" id="documentacion">
        <p className="kicker">{docs.kicker}</p>
        <h2 className="section-title">
            {docs.title}
            <span className="accent">.</span>
        </h2>
        <div className={styles.grid}>
            <div>
                <p className={styles.lede}>{docs.lede}</p>
                <nav className={styles.links} aria-label="Documentación">
                    {docs.links.map(link => (
                        <a key={link.label} className={styles.link} href={link.href}>
                            {link.label}
                            <span className={styles.arrow} aria-hidden="true">
                                -&gt;
                            </span>
                        </a>
                    ))}
                </nav>
            </div>
            <CodeWindow fileName={docs.codeFileName} />
        </div>
    </section>
);

import { footer } from '../content';
import styles from './Footer.module.css';

export const Footer = () => (
    <footer className={styles.footer}>
        <p className={styles.note}>{footer.note}</p>
        <nav className={styles.links} aria-label="Pie de página">
            {footer.links.map(link => (
                <a key={link.label} className={styles.link} href={link.href}>
                    {link.label}
                </a>
            ))}
        </nav>
    </footer>
);

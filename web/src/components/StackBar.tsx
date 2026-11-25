import { stackItems } from '../content';
import styles from './StackBar.module.css';

export const StackBar = () => (
    <section className={styles.bar} aria-label="Stack nativo">
        <p className={styles.kicker}>STACK NATIVO</p>
        <ul className={styles.items}>
            {stackItems.map(item => (
                <li key={item.short} className={styles.item}>
                    <span className={styles.tile} aria-hidden="true">
                        {item.short}
                    </span>
                    {item.label}
                </li>
            ))}
        </ul>
    </section>
);

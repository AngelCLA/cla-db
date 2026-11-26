import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import {
    copyInstallCommand,
    defaultInstallTargetId,
    installSection,
    installTargetById,
    installTargets,
    nextInstallTargetId
} from '../install';
import type { PackageManagerId } from '../install';
import styles from './Install.module.css';

export const Install = () => {
    const [selectedId, setSelectedId] = useState<PackageManagerId>(defaultInstallTargetId);
    const [message, setMessage] = useState('');
    const tabRefs = useRef<Partial<Record<PackageManagerId, HTMLButtonElement | null>>>({});
    const selected = installTargetById(selectedId);

    const select = (id: PackageManagerId) => {
        setSelectedId(id);
        setMessage('');
        tabRefs.current[id]?.focus();
    };

    const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        const nextId = nextInstallTargetId(selectedId, event.key);
        if (!nextId) {
            return;
        }
        event.preventDefault();
        select(nextId);
    };

    const onCopy = async () => {
        const clipboard = typeof navigator === 'undefined' ? undefined : navigator.clipboard;
        const outcome = await copyInstallCommand(selectedId, clipboard);
        setMessage(installSection.messages[outcome]);
    };

    return (
        <section className="section" id="instalacion" aria-labelledby="instalacion-title">
            <p className="kicker">{installSection.kicker}</p>
            <h2 className="section-title" id="instalacion-title">
                {installSection.title}
                <span className="accent">.</span>
            </h2>
            <p className={styles.lede}>{installSection.lede}</p>
            <div className={styles.selector} role="tablist" aria-label={installSection.selectorLabel} aria-orientation="horizontal">
                {installTargets.map(target => (
                    <button
                        key={target.id}
                        ref={element => {
                            tabRefs.current[target.id] = element;
                        }}
                        type="button"
                        role="tab"
                        id={`install-tab-${target.id}`}
                        className={styles.tab}
                        aria-selected={target.id === selectedId}
                        aria-controls={`install-panel-${target.id}`}
                        tabIndex={target.id === selectedId ? 0 : -1}
                        onClick={() => select(target.id)}
                        onKeyDown={onTabKeyDown}
                    >
                        {target.label}
                    </button>
                ))}
            </div>
            <div
                className={`surface ${styles.panel}`}
                role="tabpanel"
                id={`install-panel-${selectedId}`}
                aria-labelledby={`install-tab-${selectedId}`}
            >
                <pre className={styles.command}>
                    <code>{selected.command}</code>
                </pre>
                <button type="button" className={`button button--secondary ${styles.copy}`} onClick={onCopy}>
                    {installSection.copyLabel}
                </button>
                <p className={styles.note}>{selected.note}</p>
                <p className={styles.status} role="status">
                    {message}
                </p>
            </div>
            <p className={styles.boundary}>{installSection.boundary}</p>
        </section>
    );
};

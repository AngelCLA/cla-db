import styles from './CoreIllustration.module.css';

// CLA-DB: draw back to front so each dense wireframe plane remains crisp.
const plates = [
    { top: 202, radius: 220 },
    { top: 150, radius: 196 },
    { top: 98, radius: 172 },
    { top: 46, radius: 148 }
];

export const CoreIllustration = () => (
    <svg
        className={styles.illustration}
        viewBox="0 0 520 460"
        role="img"
        aria-label="Ilustración isométrica del núcleo de CLA DB: cuatro capas apiladas de la base de datos"
    >
        <defs>
            <radialGradient id="claDbBackdrop">
                <stop offset="0" stopColor="var(--color-primary)" stopOpacity="0.12" />
                <stop offset="1" stopColor="var(--color-primary)" stopOpacity="0" />
            </radialGradient>
            <pattern id="claDbGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M10 0H0V10" fill="none" stroke="var(--color-primary)" strokeWidth="0.6" strokeOpacity="0.65" />
            </pattern>
            <pattern id="claDbHatching" width="5" height="5" patternUnits="userSpaceOnUse">
                <path d="M1 0V5" stroke="var(--color-primary)" strokeWidth="0.65" strokeOpacity="0.7" />
            </pattern>
        </defs>

        <rect width="520" height="460" fill="url(#claDbBackdrop)" />
        <g className={styles.traces}>
            <path d="M40 336h52l58 29 M20 376h84l50 25 M480 336h-52l-58 29 M500 376h-84l-50 25 M260 421v23h72" />
            <rect x="37" y="333" width="6" height="6" />
            <rect x="17" y="373" width="6" height="6" />
            <rect x="477" y="333" width="6" height="6" />
            <rect x="497" y="373" width="6" height="6" />
            <rect x="329" y="441" width="6" height="6" />
        </g>

        {plates.map(({ top, radius }, index) => {
            const left = 260 - radius;
            const right = 260 + radius;
            const middle = top + radius / 2;
            const front = top + radius;
            const sides = `${left},${middle} 260,${front} ${right},${middle} ${right},${middle + 12} 260,${front + 12} ${left},${middle + 12}`;
            return (
                <g key={top}>
                    <polygon points={sides} fill="var(--color-bg-code)" />
                    <polygon points={sides} fill="url(#claDbHatching)" stroke="var(--color-primary)" strokeWidth="0.8" />
                    <g transform={`matrix(1 .5 -1 .5 260 ${top})`}>
                        <rect width={radius} height={radius} fill="var(--color-bg-dark)" />
                        <rect width={radius} height={radius} fill="var(--color-primary)" fillOpacity="0.04" />
                        <rect width={radius} height={radius} fill="url(#claDbGrid)" stroke="var(--color-primary)" strokeWidth="1.2" />
                        {index === plates.length - 1 && (
                            <text x={radius / 2} y="35" textAnchor="middle" className={styles.plateLabel}>CLA DB</text>
                        )}
                    </g>
                    <path d={`M260 ${front}v12`} fill="none" stroke="var(--color-primary)" strokeWidth="0.8" />
                </g>
            );
        })}
    </svg>
);

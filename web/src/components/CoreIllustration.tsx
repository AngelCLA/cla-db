import styles from './CoreIllustration.module.css';

// CLA-DB: draw back to front so each dense wireframe plane remains crisp.
const plates = [
    { top: 202, radius: 220 },
    { top: 150, radius: 204 },
    { top: 98, radius: 188 },
    { top: 46, radius: 172 }
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
            <pattern id="claDbDots" width="18" height="18" patternUnits="userSpaceOnUse">
                <circle cx="9" cy="9" r="0.8" fill="var(--color-primary)" fillOpacity="0.24" />
            </pattern>
            <pattern id="claDbHatching" width="5" height="5" patternUnits="userSpaceOnUse">
                <path d="M1 0V5" stroke="var(--color-primary)" strokeWidth="0.65" strokeOpacity="0.7" />
            </pattern>
        </defs>

        <rect width="520" height="460" fill="url(#claDbBackdrop)" />
        <rect x="8" y="136" width="504" height="324" fill="url(#claDbDots)" />
        <g className={styles.traces}>
            {/* CLA-DB: mirrored circuits remain behind the opaque chip planes. */}
            {[false, true].map(mirrored => (
                <g key={String(mirrored)} transform={mirrored ? 'translate(520 0) scale(-1 1)' : undefined}>
                    {Array.from({ length: 9 }, (_, index) => {
                        const x = 24 + index * 23;
                        const y = 286 + index * 18;
                        return (
                            <g key={index}>
                                <path d={`M${x} ${y}l38 -19h24l46 -23v-26`} />
                                <rect x={x - 2} y={y - 2} width="4" height="4" />
                            </g>
                        );
                    })}
                </g>
            ))}
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
                        {[6, 12, 18].map(inset => (
                            <rect key={inset} x={inset} y={inset} width={radius - inset * 2} height={radius - inset * 2} fill="none" stroke="var(--color-primary)" strokeWidth="0.8" />
                        ))}
                        {index === plates.length - 1 && (
                            <g data-core-panel="true">
                                <rect x="28" y="28" width={radius - 56} height={radius - 56} fill="var(--color-bg-dark)" />
                                <rect x="28" y="28" width={radius - 56} height={radius - 56} fill="var(--color-primary)" fillOpacity="0.18" stroke="var(--color-primary)" strokeWidth="1" />
                                <text x={radius / 2} y={radius / 2} dy="0.35em" textAnchor="middle" className={styles.plateLabel}>CLA DB</text>
                            </g>
                        )}
                    </g>
                    <path d={`M260 ${front}v12`} fill="none" stroke="var(--color-primary)" strokeWidth="0.8" />
                </g>
            );
        })}
    </svg>
);

import type { Feature } from '../content';

type IconProps = {
    readonly name: Feature['icon'];
};

const paths: Record<Feature['icon'], React.ReactNode> = {
    layers: <path d="M2 4 L10 7.5 L18 4 M2 10 L10 13.5 L18 10 M2 16 L10 19.5 L18 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />,
    pulse: <path d="M2 10 C4 4 7 4 10 10 C13 16 16 16 18 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />,
    overlap: (
        <>
            <circle cx="6" cy="10" r="4" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="14" cy="10" r="4" stroke="currentColor" strokeWidth="1.6" />
        </>
    ),
    sync: <path d="M10 2 v16 M2 10 h16 M5 5 l10 10 M15 5 L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />,
    check: (
        <>
            <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
            <path d="M7 10 l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
    ),
    code: <path d="M6 4 L2 10 L6 16 M14 4 L18 10 L14 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
};

export const FeatureIcon = ({ name }: IconProps) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
        {paths[name]}
    </svg>
);

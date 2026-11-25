import styles from './CodeWindow.module.css';

type TokenKind = 'comment' | 'keyword' | 'function' | 'string' | 'constant';

type Token = {
    readonly text: string;
    readonly kind?: TokenKind;
};

/**
 * Code sample rendered from tokens instead of raw HTML, so the markup stays
 * declarative and the palette comes from the shiki tokens of the design system.
 */
const sample: readonly (readonly Token[])[] = [
    [{ text: '// Consulta reactiva: se re-emite con cada cambio.', kind: 'comment' }],
    [
        { text: 'import', kind: 'keyword' },
        { text: ' { createRxDatabase } ' },
        { text: 'from', kind: 'keyword' },
        { text: ' \'@clatech/db\'', kind: 'string' },
        { text: ';' }
    ],
    [],
    [
        { text: 'const', kind: 'keyword' },
        { text: ' db = ' },
        { text: 'await', kind: 'keyword' },
        { text: ' ' },
        { text: 'createRxDatabase', kind: 'function' },
        { text: '(' }
    ],
    [
        { text: '  name: ' },
        { text: '\'clientes\'', kind: 'string' },
        { text: ',' }
    ],
    [
        { text: '  storage: ' },
        { text: 'getRxStorageDexie', kind: 'function' },
        { text: '()' }
    ],
    [{ text: '});' }],
    [
        { text: 'await', kind: 'keyword' },
        { text: ' db.' },
        { text: 'addCollections', kind: 'function' },
        { text: '({ clientes: { schema: clienteSchema } });' }
    ],
    [
        { text: 'await', kind: 'keyword' },
        { text: ' db.clientes.' },
        { text: 'insert', kind: 'function' },
        { text: '({ id: ' },
        { text: '\'c-001\'', kind: 'string' },
        { text: ', nombre: ' },
        { text: '\'Ana\'', kind: 'string' },
        { text: ', plan: ' },
        { text: '\'abono\'', kind: 'string' },
        { text: ' });' }
    ],
    [],
    [
        { text: 'db.clientes.' },
        { text: 'find', kind: 'function' },
        { text: '({ selector: { plan: ' },
        { text: '\'abono\'', kind: 'string' },
        { text: ' } })' }
    ],
    [
        { text: '  .$.' },
        { text: 'subscribe', kind: 'function' },
        { text: '(docs => ' },
        { text: 'render', kind: 'function' },
        { text: '(docs));' }
    ]
];

type Props = {
    readonly fileName: string;
};

export const CodeWindow = ({ fileName }: Props) => (
    <div className={styles.window} id="ejemplo">
        <div className={styles.bar}>
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.fileName}>{fileName}</span>
        </div>
        <pre className={styles.code}>
            <code>
                {sample.map((line, lineIndex) => (
                    <span key={lineIndex} className={styles.line}>
                        {line.map((token, tokenIndex) =>
                            token.kind ? (
                                <span key={tokenIndex} className={styles[token.kind]}>
                                    {token.text}
                                </span>
                            ) : (
                                <span key={tokenIndex}>{token.text}</span>
                            )
                        )}
                        {'\n'}
                    </span>
                ))}
            </code>
        </pre>
    </div>
);

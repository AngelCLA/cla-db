import styles from './TechnicalOverview.module.css';

// CLA-DB: technical context for the landing, based on SYSTEM_DESIGN.md.
const topics = [
    { id: 'offline-first', label: 'Sin conexión' },
    { id: 'sync-engine', label: 'Sincronización' },
    { id: 'rxstorage', label: 'Storage' },
    { id: 'modelo-reactivo', label: 'Modelo y consultas' }
] as const;

const fieldFlow = [
    { title: 'Guardá la venta', text: 'En una visita sin señal, registrá el pedido y el abono en el storage local, sin esperar al servidor.', symbol: '01 / ESCRIBIR' },
    { title: 'Consultá lo local', text: 'Revisá el saldo del cliente desde el dispositivo. La interfaz trabaja con los datos locales disponibles.', symbol: '02 / LEER' },
    { title: 'Retomá la replicación', text: 'Cuando vuelve la conexión, la replicación configurada envía los cambios pendientes y trae los del servidor.', symbol: '03 / REPLICAR' }
] as const;

const storages = [
    { runtime: 'Navegador / PWA', name: 'Dexie / IndexedDB', detail: 'Persistencia local entre sesiones, sujeta al almacenamiento disponible y a las políticas del navegador.' },
    { runtime: 'Pruebas / estado temporal', name: 'Memory', detail: 'Estado efímero en memoria. No conserva los datos al cerrar el proceso.' },
    { runtime: 'Node.js', name: 'FoundationDB / MongoDB', detail: 'Storages para el servidor. Requieren la infraestructura correspondiente.' },
    { runtime: 'Deno / workers / procesos', name: 'DenoKV / Remote', detail: 'DenoKV para Deno. Remote permite acceder a un storage alojado en otro worker o proceso.' }
] as const;

export const TechnicalOverview = () => (
    <>
        <section className={`section ${styles.section}`} id="offline-first" aria-labelledby="offline-title">
            <p className="kicker">// Offline-first en campo</p>
            <h2 className="section-title" id="offline-title">La venta sigue sin señal<span className="accent">.</span></h2>
            <p className={styles.intro}>Primero el dispositivo, después la red. En una app de ventas en campo, el pedido no tiene que esperar a que vuelva la señal.</p>
            <nav className={styles.topics} aria-label="Recorrido técnico">
                {topics.map(topic => <a key={topic.id} href={`#${topic.id}`}>{topic.label}</a>)}
            </nav>
            <ol className={styles.flow}>
                {fieldFlow.map(step => (
                    <li className={`surface ${styles.step}`} key={step.title}>
                        <span className={styles.marker} aria-hidden="true">{step.symbol}</span>
                        <h3>{step.title}</h3>
                        <p>{step.text}</p>
                    </li>
                ))}
            </ol>
        </section>

        <section className={`section ${styles.section}`} id="sync-engine" aria-labelledby="sync-title">
            <p className="kicker">// Sync Engine</p>
            <h2 className="section-title" id="sync-title">Tu backend, conectado por protocolo<span className="accent">.</span></h2>
            <div className={styles.split}>
                <div className={styles.copy}>
                    <p>La Sync Engine coordina la replicación bidireccional. Tu backend no se conecta solo: tenés que integrarlo con el protocolo existente y configurar el transporte.</p>
                    <p>Hay transportes documentados para GraphQL, WebSocket, CouchDB y Supabase. Son opciones de integración, no conexiones automáticas a cualquier API.</p>
                </div>
                <dl className={`surface ${styles.protocol}`}>
                    <div><dt>push / pull</dt><dd>Enviá revisiones locales y recibí lotes de cambios remotos.</dd></div>
                    <div><dt>checkpoints</dt><dd>Registran el avance para continuar la replicación desde el último punto procesado.</dd></div>
                    <div><dt>conflictHandler</dt><dd>Ante cambios concurrentes, el handler de la colección resuelve el conflicto. Podés definir uno propio para tu dominio.</dd></div>
                </dl>
            </div>
        </section>

        <section className={`section ${styles.section}`} id="rxstorage" aria-labelledby="storage-title">
            <p className="kicker">// RxStorage</p>
            <h2 className="section-title" id="storage-title">Elegí dónde viven los datos<span className="accent">.</span></h2>
            <p className={styles.intro}>RxStorage separa la API de colecciones del motor de almacenamiento. Elegí según el entorno y si necesitás conservar los datos al cerrar la app.</p>
            <dl className={`surface ${styles.storages}`}>
                {storages.map(storage => (
                    <div className={styles.storageRow} key={storage.name}>
                        <dt><span className={styles.marker}>{storage.runtime}</span><strong>{storage.name}</strong></dt>
                        <dd>{storage.detail}</dd>
                    </div>
                ))}
            </dl>
        </section>

        <section className={`section ${styles.section}`} id="modelo-reactivo" aria-labelledby="model-title">
            <p className="kicker">// Un modelo, tres piezas</p>
            <h2 className="section-title" id="model-title">Del esquema a la pantalla<span className="accent">.</span></h2>
            <div className={styles.model}>
                <article><span className={styles.marker}>01 / DEFINÍ</span><h3>JSON Schema</h3><p>Definí campos, clave primaria e índices de cada colección. Sumá un plugin de validación para comprobar los documentos contra el esquema.</p></article>
                <article><span className={styles.marker}>02 / CONSULTÁ</span><h3>Mango + RxJS</h3><p>Filtrá ese modelo con selectores Mango y suscribite a <code>.find().$</code>. RxJS entrega resultados actualizados cuando cambian los datos de la consulta.</p></article>
                <article><span className={styles.marker}>03 / EVOLUCIONÁ</span><h3>Migraciones versionadas</h3><p>Cuando cambia el modelo, incrementá la versión del esquema. Con el plugin de migración y <code>migrationStrategies</code>, transformá los documentos existentes antes de consultarlos con la nueva versión.</p></article>
            </div>
        </section>
    </>
);

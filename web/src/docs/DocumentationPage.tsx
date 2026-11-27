// CLA-DB: Spanish introduction adapted from README.md and inherited docs-src/docs/ APIs.
// RxDB copyright 2016–2026 Daniel Meyer and contributors, Apache-2.0.
import styles from './DocumentationPage.module.css';

const repository = 'https://github.com/AngelCLA/cla-db/blob/master/';
const sections = [
    ['instalacion', 'Instalación'], ['quickstart', 'Quickstart'],
    ['esquemas', 'Esquemas'], ['colecciones', 'Colecciones'],
    ['consultas', 'Consultas reactivas'], ['almacenamiento', 'Almacenamiento'],
    ['compatibilidad', 'Compatibilidad 0.1.3'], ['referencias', 'Referencias y licencia']
] as const;

const schema = `const schema = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        name: { type: 'string' }
    },
    required: ['id', 'name']
};`;

const quickstart = `import { createRxDatabase } from '@clatech/db';
import { getRxStorageMemory } from '@clatech/db/plugins/storage-memory';
import { firstValueFrom, filter } from 'rxjs';

${schema}
const db = await createRxDatabase({
    name: 'customersdb', storage: getRxStorageMemory(), multiInstance: false
});
await db.addCollections({ customers: { schema } });
const query = db.customers.find();
const subscription = query.$.subscribe(docs => {
    if (docs.length === 1) console.log('Clientes:', docs.length);
});
await db.customers.insert({ id: 'alice', name: 'Alice' });
await firstValueFrom(query.$.pipe(filter(docs => docs.length === 1)));
console.log((await db.customers.findOne('alice').exec()).name);
subscription.unsubscribe();
await db.close();`;

const dexie = `import { createRxDatabase } from '@clatech/db';
import { getRxStorageDexie } from '@clatech/db/plugins/storage-dexie';

${schema}
async function openCustomers() {
    const db = await createRxDatabase({
        name: 'savedcustomers', storage: getRxStorageDexie(), multiInstance: false
    });
    await db.addCollections({ customers: { schema } });
    return db;
}
let db = await openCustomers();
await db.customers.upsert({ id: 'saved', name: 'Cliente guardado' });
await db.close();
db = await openCustomers();
console.log((await db.customers.findOne('saved').exec()).name);
await db.close();`;

const Code = ({ children, id }: { children: string; id?: string }) => (
    <pre className={styles.code} id={id}><code>{children}</code></pre>
);
const Upstream = ({ page, children }: { page: string; children: string }) => (
    <a href={`https://rxdb.info/${page}.html`}>{children} (upstream)</a>
);

export const DocumentationPage = () => (
    <main className={`container ${styles.layout}`}>
        <aside className={styles.sidebar}>
            <p className="kicker">// CLA DB 0.1.3</p>
            <nav aria-label="En esta guía">
                {sections.map(([id, title]) => <a key={id} href={`#${id}`}>{title}</a>)}
            </nav>
        </aside>
        <article className={styles.article}>
            <p className="kicker">// Documentación</p>
            <h1 className="section-title">Tus primeros datos <span className="accent">locales.</span></h1>
            <p>CLA DB es un fork independiente de RxDB con licencia Apache 2.0. Guarda documentos JSON,
                consulta con selectores Mango y recibe cambios mediante RxJS. Empieza con Memory sin servidor,
                después elige Dexie para persistir en el navegador.</p>

            <section id="instalacion">
                <h2>Instalación</h2>
                <Code>{'npm install @clatech/db rxjs'}</Code>
                <p>La versión 0.1.3 está publicada en npm como latest. <code>rxjs</code> es una
                    <strong> peer dependency</strong> requerida (<code>^7.8.2</code>): la API reactiva expone
                    sus Observables y tu aplicación comparte esa dependencia.</p>
                <p>El ejemplo usa ESM mediante un archivo <code>.mjs</code>. No mezcles imports de <code>rxdb</code>
                    y <code>@clatech/db</code> en un mismo bundle. El paquete declara Node.js <code>&gt;=20</code>;
                    los alcances comprobados se detallan más abajo.</p>
            </section>

            <section id="quickstart">
                <h2>Quickstart sin servidor</h2>
                <p>Guarda este ejemplo completo como <code>quickstart.mjs</code> y ejecuta
                    <code> node quickstart.mjs</code>. Crea una colección y observa la inserción de Alice.
                    Memory no persiste al cerrar el proceso.</p>
                <Code id="quickstart-code">{quickstart}</Code>
                <p>Salida: <code>Clientes: 1</code> y <code>Alice</code>. <code>.$</code> emite los resultados
                    cuando cambian los documentos coincidentes. Cancela la suscripción y espera
                    <code> close()</code> cuando termines.</p>
            </section>

            <section id="esquemas">
                <h2>Esquemas</h2>
                <p>Cada colección tiene un esquema basado en JSON Schema. En el ejemplo,
                    <code> version: 0</code> identifica la primera versión, <code>primaryKey</code> selecciona
                    el identificador único y <code>required</code> indica los campos obligatorios.
                    La clave primaria es un string con <code>maxLength</code>.</p>
                <p>Para añadir índices o cambiar un esquema existente, consulta
                    {' '}<Upstream page="rx-schema">RxSchema</Upstream> y
                    {' '}<Upstream page="migration-schema">migraciones</Upstream>.
                    Cambiar la versión exige planificar la migración, no borrar los datos.</p>
            </section>

            <section id="colecciones">
                <h2>Colecciones</h2>
                <p><code>addCollections()</code> crea las colecciones con su esquema y las expone en la base,
                    por ejemplo <code>db.customers</code>. <code>insert()</code> añade un documento nuevo;
                    <code> upsert()</code> inserta o actualiza por clave primaria.</p>
                <p>CLA DB elimina el límite artificial de <strong>13 colecciones</strong> de RxDB y conserva
                    el seguimiento de limpieza <code>OPEN_COLLECTIONS</code>. Memoria, handles y coste de
                    inicialización siguen limitando el trabajo. Esto no habilita plugins Premium ni modifica
                    su validación de licencia. La advertencia del límite en
                    {' '}<Upstream page="rx-collection">RxCollection</Upstream> no aplica a CLA DB.</p>
            </section>

            <section id="consultas">
                <h2>Consultas reactivas</h2>
                <p>Usa selectores MongoDB-style (Mango). <code>exec()</code> devuelve una instantánea;
                    <code> .$</code> permite suscribirte a los resultados y actualizar tu interfaz.</p>
                <Code>{`// Dentro del quickstart, antes de subscription.unsubscribe() y db.close():
const customers = await db.customers.find({
    selector: { name: { $eq: 'Alice' } }
}).exec();
console.log(customers.map(customer => customer.name)); // ['Alice']`}</Code>
                <p><code>find()</code> devuelve una lista; <code>findOne('alice')</code> devuelve un documento
                    o <code>null</code>. El quickstart usa <code>firstValueFrom</code> y <code>filter</code>
                    para esperar el resultado reactivo sin pausas arbitrarias.
                    {' '}<Upstream page="rx-query">Referencia de RxQuery</Upstream>.</p>
            </section>

            <section id="almacenamiento">
                <h2>Almacenamiento: Memory y Dexie</h2>
                <h3>Memory</h3>
                <p>Usa <code>getRxStorageMemory()</code>, como en el <a href="#quickstart">quickstart</a>,
                    para guardar datos efímeros en pruebas y procesos locales.</p>
                <h3 id="dexie">Dexie</h3>
                <p>Dexie usa IndexedDB para persistir en el navegador; Node.js no aporta esa API de forma nativa.</p>
                <p>Ejemplo completo para un módulo de tu aplicación de navegador con bundler (por ejemplo Vite).
                    Reabre la misma base y lee el documento guardado:</p>
                <Code id="dexie-code">{dexie}</Code>
                <p>Salida: <code>Cliente guardado</code>. Dexie también puede mostrar el aviso informativo
                    heredado de RxDB en la consola. Conserva nombre y esquema para reabrir datos.
                    Cuotas, expulsión de datos, navegación privada y cierres abruptos afectan la durabilidad.
                    Las pruebas de navegador no certifican recuperación ante fallos.</p>
                <p><Upstream page="rx-storage-memory">Memory</Upstream>{' · '}
                    <Upstream page="rx-storage-dexie">Dexie</Upstream></p>
            </section>

            <section id="compatibilidad">
                <h2>Compatibilidad 0.1.3: evidencia acotada</h2>
                <p>Lee la <a href={`${repository}release/0.1.3/COMPATIBILITY.md`}>matriz exacta de 0.1.3</a>.
                    Sus recuentos son evidencia local histórica del candidato, no nuevas mediciones del paquete
                    del registro. PASS solo cubre las pruebas ejecutadas; SKIP no equivale a soporte.</p>
                <ul>
                    <li>Node 22.23.5, 24.22.3 y 26.13.1: pruebas de consumidor completas;
                        Node 20.0.0 y 20.20.2: smoke legacy, no integración completa.</li>
                    <li>Bun 1.3.14: pruebas acotadas del artefacto; las suites heredadas completas Memory/Dexie fallan.
                        Deno 2.8.3: Memory, CRUD reactivo, colecciones, replicación y limpieza acotados,
                        más una prueba básica del DenoKV en memoria deprecado. No cubre Deno Deploy,
                        DenoKV remoto o en archivo, ni chequeo de tipos completo.</li>
                    <li>Chromium, Firefox y WebKit con Playwright 1.65.1: 15 pruebas por motor, 45 en total,
                        incluido reinicio con Dexie nativo. No certifica Safari/iOS, cuotas ni concurrencia amplia.</li>
                    <li>Memory, Dexie simulado y Dexie nativo están comprobados en esos alcances.
                        Reapertura entre versiones usa IndexedDB simulado, no linaje nativo ni downgrade.</li>
                    <li>Vanilla JS, TypeScript NodeNext/Bundler, Vite y React 19.3.1 + Vite 8.4.0 tienen pruebas
                        acotadas. Vue, Svelte, Angular, Electron y Capacitor no están verificados por esa matriz;
                        React Native sigue sin verificación de integración.</li>
                </ul>
                <p>localStorage, FoundationDB, MongoDB, DenoKV, Remote y Remote WebSocket son plugins
                    heredados e incluidos. La matriz no verifica todos sus usos. La replicación comprobada usa
                    handlers locales, no servicios con credenciales. SQLite es un trial restringido, no un adaptador
                    propio de producción.
                    D1, OPFS y SQLite independiente siguen planificados como paquetes externos.
                    Los plugins propietarios de RxDB Premium no están incluidos.</p>
                <p>La versión del paquete 0.1.3 está desacoplada de la versión de compatibilidad de almacenamiento
                    17.6.0. No implica compatibilidad universal con todos los plugins o runtimes.</p>
            </section>

            <section id="referencias">
                <h2>Referencias y licencia</h2>
                <p>Esta guía adapta el <a href={`${repository}README.md`}>README de CLA DB</a> y la documentación
                    heredada en <a href={`${repository}docs-src/docs`}>docs-src/docs/</a> donde la API coincide.
                    Las referencias upstream pueden usar imports <code>rxdb</code> o funciones Premium ajenas a este paquete.</p>
                <p>Derivado de RxDB. Copyright 2016–2026 Daniel Meyer y contribuidores.
                    Se conservan los avisos y la <a href="/licenses/rxdb-apache-2.0.txt">licencia Apache 2.0</a>
                    {' '}(<a href={`${repository}LICENSE.txt`}>original en el repositorio</a>).
                    Las modificaciones del fork son mantenidas por CLA Tech. CLA DB es independiente y no está
                    afiliado ni respaldado por RxDB o RxDB Premium.</p>
            </section>
        </article>
    </main>
);

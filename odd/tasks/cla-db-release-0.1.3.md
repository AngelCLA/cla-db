# CLA DB 0.1.3: Universal Compatibility
Branch `chore/release-0.1.3`; base `94383e9432519afb46f0185e35fb48238a7167f2`. Local candidate only.
Specification and design: `release/0.1.3/SPEC.md`. No remote delivery authorized.

## Specs

- S1: “No repitas estos trabajos desde cero. Reutiliza y amplía la infraestructura existente.” “Conserva los cambios existentes del usuario.”
- S2: “Actualiza la versión pública a `0.1.3`.” “Preservar `RXDB_VERSION` y la compatibilidad de almacenamiento `17.6.0`.” “No incrementes silenciosamente la versión mínima de Node.js.” “No romper los imports públicos existentes.”
- S3: “Todos los gestores deben consumir exactamente el mismo artefacto de distribución.” “Los consumidores de prueba deben generar sus propios archivos de bloqueo en directorios aislados.” “Generar resultados estructurados en JSON.” “Generar un reporte legible en Markdown.” “Una prueba omitida no debe contarse como aprobada.”
- S4: “No utilices `shamefully-hoist`, `node-linker=hoisted` ni configuraciones equivalentes para ocultar dependencias faltantes.” “Bun debe evaluarse tanto como gestor de paquetes como runtime.” “Evalúa por separado:”; “Yarn con `node_modules`.”; “Yarn Plug'n'Play.” “No solicites permisos globales innecesarios para los consumidores de prueba.”
- S5: “Node.js supera las pruebas correspondientes a las versiones soportadas.” “Se prueban hasta 100 colecciones simultáneas.” “CommonJS.” “TypeScript NodeNext.” “TypeScript Bundler.” “React + Vite.” “Replicación mediante handlers personalizados.”
- S6: “Utiliza una aplicación de prueba construida mediante Vite que consuma el tarball real de CLA DB.” “Las pruebas deben utilizar IndexedDB real mediante Dexie, sin `fake-indexeddb`.” “Cerrar y reabrir el navegador utilizando un perfil persistente.” “No presentes la ejecución en WebKit como certificación completa de Safari o iOS.”
- S7: “Un service worker mínimo para el app shell.” “Un backend de prueba controlado localmente.” “Verificar convergencia de datos.” “Comprobar resolución de conflictos.” “Verificar reintentos y ausencia de duplicados.”
- S8: “Amplía la infraestructura existente de `scripts/verify-storage-compat.mjs`.” “Utiliza versiones exactas realmente disponibles en el registro.” “Prioriza ampliar la evidencia de IndexedDB simulado a IndexedDB real.” “La compatibilidad inversa o downgrade debe evaluarse y documentarse por separado; no asumirla.”
- S9: “Compila y empaqueta CLA DB una vez por ejecución de compatibilidad.” “Distribuye ese mismo tarball a los jobs mediante artifacts de GitHub Actions.” “Verifica el hash antes de cada instalación.” “No otorgues permisos de publicación a los workflows de pruebas.”
- S10: “No introduzcas tokens permanentes como solución rápida.” “No debilites los controles de seguridad existentes.” “No publiques automáticamente la versión 0.1.3.” “Revisa las 26 advertencias moderadas de desarrollo registradas anteriormente y su disposición documentada.” “No anuncies ausencia total de telemetría sin evidencia suficiente.”
- S11: “Implementa selectores de gestores de paquetes en el sitio web, conservando su identidad visual.” “Corrige las referencias desactualizadas que todavía describan versiones publicadas como candidatas, únicamente después de verificar su estado real.” “Documenta la modificación de los metadatos del repositorio como una acción separada que requiere autorización.”
- S12: “Realiza calentamiento, múltiples iteraciones y registra mediana y percentiles.” “No compares Memory Storage contra IndexedDB como si fueran el mismo tipo de almacenamiento.” “No establezcas rankings de rendimiento sin controlar las condiciones de ejecución.”
- S13: “Tarball `clatech-db-0.1.3.tgz`.” “Hash SHA-256.” “No inventes evidencias ni declares exitosas pruebas que no fueron ejecutadas.” “Clasifica los criterios incumplidos como bloqueantes o no bloqueantes, justificando cada decisión.”
- S14: “Trabaja en una rama independiente:” `chore/release-0.1.3`. “Utiliza Conventional Commits y cambios pequeños y revisables.” “No modifiques releases históricas sin autorización.” “No hagas merge automático a master.” “No publiques en npm.”

## Tasks

- T1 | S1,S14 | baseline, proposal, spec and design | parent | done | final evidence unit (see release review index)
- T2 | S2,S10 | release version and gated publication fixtures | worker `mwxr6o9c-4-ou0q` | version/staging proof passed; storage consumer hard-pin resolved by T5 | `8a1bd58a9d`
- T3 | S3,S4,S5 | isolated package and runtime matrix | worker `mwxr6o92-2-f8wo` | done; 123 PASS and 23 SKIP, replayed on `8891dabc42` | `5fca1d6b3a`
- T4 | S6,S7 | real browsers and offline-first PWA | worker `mwxr6o93-3-qtwn` | done; 15/15 per engine on `8891dabc42` | `4b6da5f629`
- T5 | S8,S12 | sequential storage compatibility and benchmarks | worker `mwxrgnuf-7-ct4n` | simulated lineage and equivalent Memory benchmarks passed; native lineage pending | `23ada7fdd6`, `8891dabc42`
- T6 | S9,S10 | core and artifact-based compatibility CI | worker unavailable (`ENOSPC`); parent implementation and independent local verification passed, hosted run not authorized | `c279ec1a56`
- T7 | S11,S13 | site, docs, compatibility matrix and release reports | worker `mwxr7d84-5-stg2` (site/docs) / parent (evidence) | done; selector verified and reports bound to implementation revision | `59e7593c88` plus final evidence unit
- T8 | S10,S13,S14 | build once, verify evidence and assemble local candidate | parent/verify | local proofs complete; remote CI and protected staging remain open | final evidence unit (see `release/0.1.3/REVIEW.md`)

## Log

### L1

# CLA DB v0.1.3 — Universal Compatibility Release

Tu misión es preparar la versión **0.1.3 de CLA DB**, consolidando su compatibilidad con múltiples gestores de paquetes, runtimes, navegadores y entornos de desarrollo.

## 1. Contexto del proyecto

- Proyecto: CLA DB.
- Organización: CLA Tech.
- Repositorio: [https://github.com/AngelCLA/cla-db](https://github.com/AngelCLA/cla-db)
- Paquete: `@clatech/db`.
- Versión de referencia: `0.1.2`.
- Versión objetivo: `0.1.3`.
- Nombre de la release: Universal Compatibility.
- Licencia: Apache 2.0.
- Upstream: [https://github.com/pubkey/rxdb](https://github.com/pubkey/rxdb)
- Storage compatibility version: `17.6.0`.
- Principio rector: **Minimal fork, maximum compatibility**.

CLA DB es un fork independiente del núcleo open source de RxDB que elimina el límite artificial de 13 colecciones simultáneas, conserva sus interfaces públicas y permite desarrollar aplicaciones reactivas, local-first y offline-first.

La versión 0.1.2 incorporó:

- Auditoría de infraestructura externa.
- Eliminación del iframe automático de marketing en DevMode.
- Consolidación de correcciones de upstream.
- Optimización del paquete distribuido.
- Validación de 56 exports públicos.
- Pruebas de compatibilidad entre versiones.
- Validación ESM, CommonJS y TypeScript.
- Integración con Vite.
- CI para Node.js 22 y 24.
- SBOM CycloneDX.
- Auditoría de dependencias.
- Política de seguridad.
- Proceso protegido de publicación.
- Documentación técnica y evidencias de release.

No repitas estos trabajos desde cero. Reutiliza y amplía la infraestructura existente.

## 2. Metodología de trabajo

Utiliza el workflow SDD disponible en Gentle Shell y Gentle AI.

Si están disponibles, utiliza Engram, Context7 y CodeGraph para recuperar decisiones, consultar documentación y comprender dependencias.

Antes de implementar:

1. Lee `AGENTS.md`, `SYSTEM_DESIGN.md`, `ROADMAP.md`, `UPSTREAM.md`, `CLA_CHANGELOG.md`, `CONTRIBUTING.md` y `SECURITY.md`.
2. Revisa todos los documentos de `release/0.1.2/`.
3. Inspecciona el estado actual de Git, ramas, tags y cambios pendientes.
4. Verifica las versiones realmente publicadas en npm.
5. Inspecciona las últimas ejecuciones de GitHub Actions.
6. Identifica qué funcionalidades ya fueron implementadas.
7. Genera una especificación técnica con criterios de aceptación.
8. Establece un plan de implementación por fases.
9. Conserva los cambios existentes del usuario.

Consulta documentación oficial actualizada de npm, pnpm, Bun, Yarn, Deno, Node.js, Playwright, Vite y TypeScript antes de tomar decisiones que dependan de sus versiones o APIs.

Utiliza pruebas de regresión para cualquier modificación del comportamiento del núcleo.

## 3. Restricciones arquitectónicas

Es obligatorio:

- Mantener una superficie de modificación mínima respecto a upstream.
- Preservar la API pública existente.
- Preservar `RXDB_VERSION` y la compatibilidad de almacenamiento `17.6.0`.
- Mantener eliminado el límite artificial de 13 colecciones.
- Preservar `OPEN_COLLECTIONS` y la liberación de recursos.
- No alterar los mecanismos de validación Premium.
- No incorporar código propietario.
- No sustituir RxJS.
- No introducir telemetría.
- No reescribir el motor de almacenamiento.
- No introducir dependencias de producción innecesarias.
- No romper los imports públicos existentes.
- No eliminar funcionalidades heredadas legítimas.
- No hacer refactorizaciones masivas.
- No incorporar todavía adaptadores propios de Cloudflare, SQLite, OPFS o R2.

La infraestructura de pruebas debe permanecer separada del código de producción.

Mantén npm como gestor canónico para el desarrollo del núcleo, salvo que exista una razón técnica demostrable para cambiarlo.

## 4. Distribución universal

Mantén un único paquete oficial publicado en npm:

`@clatech/db`

Debe poder instalarse mediante:

```bash
npm install @clatech/db rxjs
pnpm add @clatech/db rxjs
bun add @clatech/db rxjs
yarn add @clatech/db rxjs
```

Evalúa también el consumo desde Deno mediante npm specifiers y el mecanismo oficial de gestión de dependencias.

No publiques paquetes duplicados en otros registros únicamente para soportar distintos gestores.

Todos los gestores deben consumir exactamente el mismo artefacto de distribución.

No agregues lockfiles de pnpm, Bun o Yarn al núcleo únicamente para satisfacer las pruebas.

Los consumidores de prueba deben generar sus propios archivos de bloqueo en directorios aislados.

## 5. Infraestructura de pruebas de consumidores

Amplía `scripts/verify-pack-consumer.mjs` o crea una infraestructura modular compatible con el verificador existente.

Estructura sugerida:

```text
scripts/
  compatibility/
    run.mjs
    package-managers.mjs
    runtimes.mjs
    artifact.mjs
    report.mjs
    fixtures/
      esm/
      commonjs/
      typescript/
      vite/
      storage/
      replication/
```

Adapta esta estructura a las convenciones reales del repositorio.

La infraestructura debe:

- Generar o recibir un tarball previamente construido.
- Calcular y verificar su SHA-256.
- Crear consumidores completamente independientes.
- Instalar el mismo artefacto con cada gestor.
- Evitar dependencias del `node_modules` del repositorio.
- Verificar resolución de módulos.
- Ejecutar las pruebas correspondientes.
- Aplicar tiempos máximos de ejecución.
- Registrar versiones de gestores y runtimes.
- Generar resultados estructurados en JSON.
- Generar un reporte legible en Markdown.
- Liberar recursos incluso cuando existan errores.

Diferencia explícitamente entre:

- PASS: prueba ejecutada satisfactoriamente.
- FAIL: prueba ejecutada con errores.
- SKIP: prueba omitida justificadamente.
- UNSUPPORTED: entorno no soportado o con incompatibilidad demostrada.

Una prueba omitida no debe contarse como aprobada.

## 6. Compatibilidad con pnpm

Verifica el funcionamiento con la resolución de dependencias predeterminada de pnpm.

Comprueba:

- Instalación desde el tarball.
- Peer dependencies.
- RxJS.
- Resolución de subpaths.
- Imports ESM.
- CommonJS.
- TypeScript NodeNext.
- TypeScript Bundler.
- Integración con Vite.
- CRUD.
- Reactividad.
- Creación de más de 13 colecciones.
- Persistencia simulada mediante Dexie.
- Migraciones.
- Replicación mediante handlers personalizados.

No utilices `shamefully-hoist`, `node-linker=hoisted` ni configuraciones equivalentes para ocultar dependencias faltantes.

Si existe una dependencia implícita no declarada, identifica su origen y aplica la solución mínima compatible con upstream.

## 7. Compatibilidad con Bun

Bun debe evaluarse tanto como gestor de paquetes como runtime.

### Bun como gestor

- Instalar el tarball con Bun.
- Ejecutar el consumidor resultante mediante Node.js.
- Verificar dependencias, tipos y exports.

### Bun como runtime

Ejecutar directamente mediante Bun:

- Imports ESM.
- CommonJS.
- TypeScript.
- RxJS.
- Memory Storage.
- CRUD.
- Consultas reactivas.
- Creación de 14, 20, 50 y 100 colecciones.
- Migraciones.
- Replicación bidireccional.
- Resolución de conflictos.
- Inicio, pausa y reanudación de replicaciones.
- Cierre de bases de datos.
- Liberación de recursos.

Reutiliza las suites heredadas:

```bash
npm run test:bun:memory
npm run test:bun:dexie
```

Comprueba previamente sus requisitos, configuración y compatibilidad.

Dexie dentro de Bun puede probarse utilizando una implementación simulada de IndexedDB. No lo presentes como evidencia de almacenamiento persistente nativo.

Evalúa y documenta las posibilidades de `bun:sqlite`, pero no implementes un adaptador SQLite propio en esta release.

## 8. Compatibilidad con Yarn

Verifica:

- Instalación mediante Yarn.
- Resolución de dependencias.
- Peer dependencies.
- Imports públicos.
- ESM.
- CommonJS.
- TypeScript.
- CRUD.
- Reactividad.
- Integración con Vite.

Evalúa por separado:

- Yarn con `node_modules`.
- Yarn Plug'n'Play.

Si Plug'n'Play presenta incompatibilidades, documenta el motivo y no comprometas el diseño del núcleo para corregir problemas externos.

Utiliza una versión moderna, explícita y reproducible de Yarn.

## 9. Compatibilidad con Deno

Evalúa CLA DB bajo el runtime de Deno.

Verifica:

- Imports mediante npm specifiers.
- Resolución de dependencias de npm.
- RxJS.
- ESM.
- TypeScript.
- Memory Storage.
- CRUD.
- Consultas reactivas.
- Creación de múltiples colecciones.
- Replicación mediante handlers.
- Cierre de recursos.

Evalúa también el adaptador heredado DenoKV, cuando esté disponible y sea compatible con la versión seleccionada.

Reutiliza las suites existentes:

```bash
npm run test:deno:memory
npm run test:deno:dexie
npm run test:deno:denokv
```

Verifica sus requisitos y permisos actuales antes de ejecutarlas.

No solicites permisos globales innecesarios para los consumidores de prueba.

Documenta explícitamente las APIs de Node.js, permisos o configuraciones de Deno requeridas.

DenoKV solo debe presentarse como oficialmente verificado si supera sus pruebas correspondientes.

## 10. Compatibilidad con Node.js

Revisa la declaración actual:

```json
{
  "engines": {
    "node": ">=20"
  }
}
```

La versión anterior verifica Node.js 22 y 24.

Consulta el calendario oficial de soporte de Node.js y determina cuáles versiones deben formar parte de la matriz de CLA DB.

Verifica por separado:

- Versiones mínimas declaradas.
- Versiones LTS mantenidas.
- Versiones modernas adicionales, cuando sea viable.

No confundas una versión soportada por Node.js upstream con una versión efectivamente verificada por CLA DB.

Si Node.js 20 ya no recibe mantenimiento, documenta su estado y evalúa si debe conservarse como compatibilidad heredada.

No incrementes silenciosamente la versión mínima de Node.js.

Cualquier modificación de `engines.node` debe justificarse y recibir aprobación explícita del mantenedor si rompe la compatibilidad existente.

## 11. Pruebas en navegadores reales

Implementa una suite de integración utilizando Playwright o la infraestructura existente, según la alternativa más mantenible.

Navegadores objetivo:

- Chromium.
- Firefox.
- WebKit.

Utiliza una aplicación de prueba construida mediante Vite que consuma el tarball real de CLA DB.

No utilices únicamente imports relativos al código fuente del repositorio.

Las pruebas deben utilizar IndexedDB real mediante Dexie, sin `fake-indexeddb`.

### Escenarios obligatorios

- Crear una base de datos.
- Crear 14, 20, 50 y 100 colecciones.
- Insertar documentos.
- Consultar documentos.
- Actualizar documentos.
- Eliminar documentos.
- Verificar consultas reactivas.
- Cerrar y reabrir la base de datos.
- Recargar la página.
- Verificar persistencia de documentos.
- Cerrar y reabrir el navegador utilizando un perfil persistente.
- Migrar un esquema.
- Eliminar completamente la base de datos.
- Verificar liberación de recursos.

Utiliza un origen web estable durante cada prueba de persistencia.

Cuando sea viable, agrega pruebas de:

- Varias pestañas del mismo origen.
- Coordinación entre instancias.
- Elección de líder.
- Escrituras concurrentes.
- Conflictos.
- Errores de cuota simulados de forma controlada.
- Interrupción inesperada del proceso.

Distingue entre persistencia tras recargar una página, persistencia después de cerrar el navegador y recuperación ante fallos abruptos.

No presentes la ejecución en WebKit como certificación completa de Safari o iOS.

## 12. Validación offline-first y PWA

Crea una aplicación de integración mínima para demostrar el comportamiento offline-first.

Debe utilizar:

- CLA DB instalado desde el tarball.
- Vite.
- Dexie.
- IndexedDB real.
- Un service worker mínimo para el app shell.
- Un backend de prueba controlado localmente.
- Replicación mediante handlers personalizados.

Escenarios:

1. Abrir la aplicación con conectividad.
2. Realizar una sincronización inicial.
3. Interrumpir la conexión.
4. Crear y modificar documentos offline.
5. Recargar la aplicación sin conexión.
6. Comprobar la disponibilidad de los datos.
7. Restablecer la conexión.
8. Reanudar la replicación.
9. Verificar convergencia de datos.
10. Comprobar resolución de conflictos.
11. Verificar reintentos y ausencia de duplicados.

La aplicación PWA será exclusivamente una herramienta de integración y referencia.

No introduzcas el service worker dentro del núcleo de CLA DB.

No implementes todavía el adaptador Cloudflare Workers + D1.

## 13. Compatibilidad con frameworks y bundlers

Verifica como mínimo:

- JavaScript sin framework.
- TypeScript.
- React + Vite.
- Resolución TypeScript NodeNext.
- Resolución TypeScript Bundler.

Evalúa adicionalmente, reutilizando pruebas existentes:

- Vue.
- Svelte.
- Angular.
- Electron.
- Capacitor.

No es obligatorio certificar todos estos frameworks en la versión 0.1.3.

Distingue los frameworks probados de los simplemente compatibles por diseño o heredados de upstream.

Comprueba que las dependencias opcionales de un framework no sean necesarias cuando el consumidor utiliza otro.

Valida el tree shaking y evita importar adaptadores de almacenamiento o plugins innecesarios en los bundles.

## 14. Compatibilidad entre versiones

Amplía la infraestructura existente de `scripts/verify-storage-compat.mjs`.

Verifica la apertura secuencial de bases de datos creadas con:

- CLA DB 0.1.1.
- CLA DB 0.1.2.
- CLA DB 0.1.3.
- RxDB 17.6.0.

Utiliza versiones exactas realmente disponibles en el registro.

Si una versión no está publicada, documenta la procedencia del artefacto alternativo utilizado.

Comprueba:

- Integridad de documentos.
- Claves primarias.
- Modificaciones.
- Eliminaciones.
- Migraciones.
- Reapertura.
- Índices.
- Compatibilidad de metadatos.
- Limpieza de almacenamiento.

Prioriza ampliar la evidencia de IndexedDB simulado a IndexedDB real.

No mantengas simultáneamente dos versiones de CLA DB o RxDB escribiendo sobre la misma base de datos durante estas pruebas.

La compatibilidad inversa o downgrade debe evaluarse y documentarse por separado; no asumirla.

## 15. GitHub Actions

Diseña una CI modular que no repita innecesariamente las suites completas.

Estructura sugerida:

```text
.github/workflows/
  ci.yml
  compatibility.yml
  browser-integration.yml
  publish.yml
```

Adapta esta propuesta a los workflows existentes.

### Core CI

- Instalación reproducible.
- Lint.
- Compilación.
- TypeScript.
- Dependencias circulares.
- Memory.
- Dexie.
- Seguridad.
- Licencias.

### Package Compatibility CI

Matriz mínima:

| Gestor              | Runtime |
| ------------------- | ------- |
| npm                 | Node.js |
| pnpm                | Node.js |
| Bun                 | Node.js |
| Bun                 | Bun     |
| Yarn                | Node.js |
| Deno npm resolution | Deno    |

### Browser Integration CI

- Chromium.
- Firefox.
- WebKit.
- IndexedDB real.
- Persistencia.
- Reactividad.
- PWA offline-first.
- Replicación controlada.

Compila y empaqueta CLA DB una vez por ejecución de compatibilidad.

Distribuye ese mismo tarball a los jobs mediante artifacts de GitHub Actions.

Verifica el hash antes de cada instalación.

Utiliza versiones explícitas y reproducibles de las herramientas.

Configura:

- Timeouts.
- Concurrencia.
- Permisos mínimos.
- Cachés apropiadas.
- Reportes de pruebas.
- Conservación de logs y traces de fallos.
- Matrices parametrizadas.
- Ejecución programada de suites extensas, si resulta conveniente.

No otorgues permisos de publicación a los workflows de pruebas.

## 16. Seguridad y publicación npm

Revisa el proceso de publicación existente.

En la revisión anterior, el workflow:

`Manually stage vetted CLA DB`

falló durante:

```bash
npm stage publish ./clatech-db-0.1.2.tgz --provenance --access public --ignore-scripts
```

Con el error:

```text
ENEEDAUTH
This command requires you to be logged in to https://registry.npmjs.org/
```

Ejecución de referencia:

[https://github.com/AngelCLA/cla-db/actions/runs/45837219576](https://github.com/AngelCLA/cla-db/actions/runs/45837219576)

Primero verifica si este problema ya fue solucionado o si la versión 0.1.2 fue publicada manualmente.

Si continúa pendiente, investiga la causa real:

- Configuración de npm Trusted Publishing.
- Compatibilidad de la versión de npm con OIDC y staged publishing.
- Permisos `id-token: write`.
- Identidad del repositorio.
- Nombre del workflow.
- Environment configurado.
- Restricciones de npm.
- Configuración del registro.
- Autenticación.
- Provenance.

Consulta la documentación oficial vigente.

No supongas que ENEEDAUTH tiene una única causa.

Conserva:

- Verificación SHA-256.
- Protección de ramas.
- Trusted Publishing, cuando sea compatible.
- Aprobación explícita del mantenedor.
- Provenance.
- Separación entre build y publicación.
- Autenticación de dos factores.
- Verificación del artefacto publicado.

No introduzcas tokens permanentes como solución rápida.

No debilites los controles de seguridad existentes.

No publiques automáticamente la versión 0.1.3.

Actualiza `SECURITY.md`, la auditoría de dependencias y el SBOM si los cambios de distribución lo requieren.

Revisa las 26 advertencias moderadas de desarrollo registradas anteriormente y su disposición documentada. No realices actualizaciones masivas sin una razón técnica.

## 17. Independencia y privacidad

Verifica que los cambios no reintroduzcan conexiones externas automáticas.

Mantén eliminado el iframe automático de marketing heredado.

Evalúa el funcionamiento del núcleo con la red bloqueada.

Revisa especialmente:

- DevMode.
- Viewer.
- WebRTC.
- Señalización.
- Plugins opcionales.
- Nuevas dependencias de pruebas y compilación.
- Sitio web.

Documenta los servicios predeterminados de upstream que aún existen y cómo reemplazarlos mediante configuración explícita.

No anuncies ausencia total de telemetría sin evidencia suficiente.

No elimines atribuciones al proyecto original.

## 18. Distribución y tamaño del paquete

Conserva la lista explícita de archivos distribuibles en `package.json`.

Verifica:

- Todos los exports públicos.
- Declaraciones TypeScript.
- ESM.
- CommonJS.
- Shims.
- Source maps.
- Recursos de runtime.
- Licencias.
- Atribuciones.

Excluye:

- Playwright.
- Navegadores descargados.
- Fixtures.
- Reportes internos.
- Logs.
- Capturas de pruebas.
- Lockfiles temporales.
- Consumidores de integración.
- Sitios web.
- Archivos de agentes.
- Tarballs anteriores.

Compara el paquete con la distribución anterior de aproximadamente 2.24 MB comprimidos.

Documenta cualquier crecimiento significativo.

No sacrifiques funcionalidades públicas solamente para reducir el tamaño.

## 19. Documentación y sitio web

Actualiza:

- `README.md`.
- `CLA_CHANGELOG.md`.
- `ROADMAP.md`.
- `CONTRIBUTING.md`.
- `SYSTEM_DESIGN.md`, cuando corresponda.
- Sitio web oficial.
- Documentación técnica.

Agrega una sección de instalación con comandos para npm, pnpm, Bun, Yarn y Deno.

Implementa selectores de gestores de paquetes en el sitio web, conservando su identidad visual.

Agrega una matriz oficial de compatibilidad que distinga:

- Gestores de paquetes.
- Runtimes.
- Navegadores.
- Frameworks.
- Motores de almacenamiento.
- Funcionalidades verificadas.
- Limitaciones conocidas.

Corrige las referencias desactualizadas que todavía describan versiones publicadas como candidatas, únicamente después de verificar su estado real.

Actualiza los metadatos propuestos para GitHub.

Descripción sugerida:

"Open-source, reactive, local-first JavaScript database without artificial collection limits. An independent RxDB fork maintained by CLA Tech."

Documenta la modificación de los metadatos del repositorio como una acción separada que requiere autorización.

Conserva la atribución a RxDB y no presentes CLA DB como un motor desarrollado desde cero.

## 20. Benchmarks de compatibilidad

Evalúa el comportamiento bajo:

- Node.js.
- Bun.
- Deno.
- Chromium.
- Firefox.
- WebKit.

Cuando los entornos y adaptadores sean comparables, mide:

- Inicialización.
- Escrituras.
- Lecturas.
- Consultas reactivas.
- Creación de colecciones.
- Consumo de memoria, donde pueda medirse correctamente.
- Replicación.
- Reapertura de bases de datos.

Utiliza cargas de trabajo equivalentes.

Realiza calentamiento, múltiples iteraciones y registra mediana y percentiles.

No compares Memory Storage contra IndexedDB como si fueran el mismo tipo de almacenamiento.

No establezcas rankings de rendimiento sin controlar las condiciones de ejecución.

No conviertas benchmarks inestables en bloqueantes de CI sin una justificación técnica.

## 21. Evidencias de release

Conserva el sistema de documentación utilizado en 0.1.2.

Crea una estructura equivalente a:

```text
release/
  0.1.3/
    RELEASE_NOTES.md
    COMPATIBILITY.md
    PACKAGE_MANAGERS.md
    RUNTIMES.md
    BROWSERS.md
    OFFLINE_FIRST.md
    TESTS.md
    BENCHMARKS.md
    PACKAGE.md
    NETWORK_AUDIT.md
    DEPENDENCIES.md
    PUBLISHING.md
    compatibility-results.json
    sbom.cdx.json
```

Evita duplicar información cuando sea posible referenciar un reporte existente.

Cada resultado debe indicar:

- Commit probado.
- Versión del paquete.
- Hash del artefacto.
- Sistema operativo.
- Runtime.
- Gestor de paquetes.
- Versiones de herramientas.
- Comando ejecutado.
- Resultado.
- Limitaciones.

No inventes evidencias ni declares exitosas pruebas que no fueron ejecutadas.

## 22. Criterios de aceptación

### Distribución

- [ ] Existe un único artefacto oficial.
- [ ] npm instala correctamente el artefacto.
- [ ] pnpm instala correctamente el artefacto.
- [ ] Bun instala correctamente el artefacto.
- [ ] Yarn instala correctamente el artefacto.
- [ ] Todos los exports públicos se conservan.
- [ ] No se distribuyen archivos de pruebas.

### Runtimes

- [ ] Node.js supera las pruebas correspondientes a las versiones soportadas.
- [ ] Bun ejecuta correctamente el núcleo.
- [ ] Deno supera la evaluación de compatibilidad.
- [ ] ESM, CommonJS y TypeScript están verificados donde corresponda.

### Navegadores

- [ ] Chromium supera las pruebas de integración.
- [ ] Firefox supera las pruebas de integración.
- [ ] WebKit supera las pruebas de integración.
- [ ] IndexedDB real conserva documentos.
- [ ] Se verifican cierres y reaperturas.
- [ ] Se verifican consultas reactivas.
- [ ] Se verifica el funcionamiento offline-first.
- [ ] Se verifica la sincronización posterior a una desconexión.

### Arquitectura

- [ ] Se conserva la compatibilidad de almacenamiento.
- [ ] No se reintroduce el límite de 13 colecciones.
- [ ] Se prueban hasta 100 colecciones simultáneas.
- [ ] No se altera la validación Premium.
- [ ] Se conserva la API pública.
- [ ] No se incorpora código propietario.
- [ ] No se agregan adaptadores fuera del alcance.

### Seguridad

- [ ] No se reintroducen conexiones automáticas de marketing.
- [ ] Se verifica el contenido del paquete.
- [ ] Se actualizan las evidencias de dependencias.
- [ ] Se conserva el procedimiento protegido de publicación.
- [ ] Se identifica el estado real del problema ENEEDAUTH.

### Documentación

- [ ] Se actualiza el README.
- [ ] Se actualiza el sitio web.
- [ ] Se documentan los gestores y runtimes.
- [ ] Se publica una matriz de compatibilidad verificable.
- [ ] Se actualiza el changelog.
- [ ] Se actualiza el roadmap.
- [ ] Se documentan las limitaciones reales.

Clasifica los criterios incumplidos como bloqueantes o no bloqueantes, justificando cada decisión.

Los objetivos de compatibilidad que no puedan verificarse deberán quedar pendientes y no podrán anunciarse como oficialmente soportados.

## 23. Versionado y roadmap

Actualiza la versión pública a `0.1.3`.

Conserva:

```text
Package version: 0.1.3
Storage compatibility version: 17.6.0
```

Mantén el roadmap:

- v0.1.3 — Universal Compatibility.
- v0.2.0 — Cloudflare Workers + D1.
- v0.3.0 — Independent SQLite Storage.
- v0.4.0 — OPFS Storage and Optimization.
- v0.5.0 — Developer Tools and Backup.
- v1.0.0 — First Stable Release.

No adelantes funcionalidades pertenecientes a las siguientes versiones.

## 24. Entregables finales

Entrega:

1. Código actualizado.
2. Infraestructura de compatibilidad.
3. Consumidores aislados.
4. Suite de pruebas de runtimes.
5. Suite de navegadores reales.
6. Aplicación PWA de integración.
7. GitHub Actions actualizados.
8. Matriz de compatibilidad.
9. Reportes técnicos.
10. Documentación actualizada.
11. SBOM actualizado.
12. Changelog.
13. Release notes.
14. Tarball `clatech-db-0.1.3.tgz`.
15. Hash SHA-256.
16. Instrucciones de publicación.
17. Registro de limitaciones.
18. Resumen de decisiones arquitectónicas.

Registra las decisiones relevantes en Engram, cuando esté disponible.

## 25. Control de cambios

Trabaja en una rama independiente:

```bash
chore/release-0.1.3
```

Utiliza Conventional Commits y cambios pequeños y revisables.

No ejecutes force push.

No sobrescribas tags existentes.

No modifiques releases históricas sin autorización.

No hagas merge automático a master.

No publiques en npm.

No ejecutes npm unpublish.

No crees una release pública sin autorización explícita.

No cierres la versión si existen regresiones críticas sin resolver.

## 26. Instrucción final

Comienza auditando el estado actual del repositorio y las evidencias de la versión 0.1.2.

Utiliza el flujo SDD para separar exploración, propuesta, especificación, diseño, tareas, implementación y verificación.

No te limites a entregar recomendaciones: implementa las mejoras, ejecuta las pruebas disponibles y genera un candidato de CLA DB 0.1.3 listo para revisión.

Prioriza compatibilidad real, estabilidad, privacidad, reproducibilidad y mantenibilidad.

Evita aumentar la complejidad del núcleo.

**CLA DB v0.1.3 — Universal Compatibility Release.**

**Minimal fork, maximum compatibility.**

### L2

sigue

### L3: Baseline evidence

- The explorer `mwxqyd7s-1-0u4b` audited required documents and existing verifiers. CodeGraph confirms public `OPEN_COLLECTIONS` tracking and existing cleanup assertions. No registered SDD commands or Context7 were exposed for this session; run the SDD phases using this task file, the technical specification and ODD evidence controls.
- `origin/master` was `94383e9432519afb46f0185e35fb48238a7167f2`, same tree as the prior local branch. Branch switch preserved both modified files and all five untracked 0.1.2 files. Branch and historical material are not staged.
- npm registry queried on 2026-11-26: latest `@clatech/db@0.1.2`, exact 0.1.1 and `rxdb@17.6.0` available, 0.1.3 returned E404. Registry SHA-1 for 0.1.2 `a059e3547acd6160dda3baa732b9068304334580` matches prior 2FA publication evidence in Engram 2487. Staging run 45837219576 failed; build passed. Master CI 45832442960 passed. OIDC immutable subject issue npm/cli#9969 remains open, no live staging attempted.

### L4: Tool preparation and environment incident

- `job-3` exit 0: isolated exact Yarn 4.19.0 and Deno 2.8.3 installed with npm lifecycle scripts disabled. Official release SHA256 checks verified Linux x64 Node 20.0.0/npm 9.6.4, 20.20.2/npm 10.8.2, 22.23.5/npm 10.9.9 and 26.13.1/npm 11.20.0. Existing Node 24.22.3/npm 11.19.1, Bun 1.3.14 and pnpm 11.23.0. This is tool-preflight only, not release validation.
- CI worker `mwxr8fmn-6-0dn5` failed before its first turn with `ENOSPC` creating the harness scratch directory. Incident readback: `/tmp` has 0 free inodes; project disk has free space and inodes. No cleanup, disabled checks or worker retry.
- T4 worker confirmed ownership of untracked `playwright-core-{1.59.1,1.61.0,1.62.0,1.63.0,1.64.0}.tgz` and `package/browsers.json`; a failed `mktemp` followed by semicolon-separated commands wrote them to the root. Do not stage. No removal or move authorized. Playwright 1.65.1 requires Chromium 1255, Firefox 1572, WebKit 2388; pre-existing Chromium 1234 is not evidence for this pin. Requested explicit outside-repo scratch authorization for detached tests; no test passed based on this preflight.
- Maintainer selected “Sí, usá esa ruta aislada” for `/var/tmp/cla-db-0.1.3-compat` exclusively, including the pinned Playwright browser downloads and cleanup of task-owned temporaries there. Browser download job `job-4` started; no OS packages or shared caches changed. This does not change the harness's exhausted `/tmp` or authorize moving the root scratch.
- `job-5` exit 0: GitHub `master` requires `verify (22)`, `verify (24)`, `site` from app 15368, applies checks to admins, blocks force push and deletion; solo maintainer requires zero additional approvals. `npm-release` allows only `master`. GitHub's `use_immutable_subject` is true and npm/cli#9969 is OPEN. Read-only; preserve names and protections.
- `job-4` exit 0: Playwright 1.65.1 installed exact Chromium 1255, Firefox 1572 and WebKit 2388 into authorized scratch. Separate actual launch probe exit 1: Chromium 159.0.8154.6 and Firefox 159.0 launched, WebKit reported missing host runtime libraries. This is preflight, not package compatibility evidence.
- T7 selector worker delivered the site/installation docs. `cd web && npm run check`: RED `FAIL (42)` before implementation, GREEN `PASS: 30 copy checks, 3 preserved anchors, 4 technical sections, 4 documentation links, 5 install tabs and 5 install commands, 16 color tokens verified against design/system.md`; site `tsc --noEmit` and changelog schema passed. No browser focus/clipboard proof; root build and final evidence pending.
- T2 staging policy fixture RED exit 1 `CI must derive the artifact name from the manifest version`, then GREEN exit 0 `Workflow syntax, positive policy, ten negative mutation probes and one offline version-guard probe: PASS`. Manifest version only, npm lock root version only, 56 exports, Node engine >=20, and storage 17.6.0 unchanged. Pre-final npm archive smoke validated 2,071 files with ESM/CJS/TS/Vite/basic migration/replication; do not treat it as final artifact evidence. Storage command observed RED `actual 0.1.3 expected 0.1.2` in hard-pinned candidate fixture, delegated to T5. No OIDC or publishing operation performed. Worker reported an out-of-scope scratch artifact under `/var/tmp/cla-t2-BIQhnp`; do not access, move, or remove it.
- `job-6` and `job-8` verified missing host libraries with exact pinned WebKit. `job-10` still failed (child exit 127 `libevent-2.1.so.7`) because WebKit's wrapper replaces `LD_LIBRARY_PATH`. `job-12` exit 0: pinned WebKit 27.2 launched after symlinking six exact distro libraries into the isolated loader path. Downloaded launcher and browser executable checksums verified unchanged; no host package installation. Browser compatibility remains to be tested.
- `job-7` stopped at root lint exit 1 (34 errors across in-progress consumer/browser code and completed staging/site fixtures). Remaining root checks did not execute. Staging-policy and site fixture lint corrections happened locally; site fixture PASS with approved `TMPDIR` after an auxiliary site probe failed under exhausted `/tmp`. Active workers own the reported lint corrections in their surfaces.
- T6 policy fixture RED exit 1 `Compatibility CI must have a dedicated artifact-based workflow`, then GREEN exit 0 `Compatibility workflow artifact, permissions, matrix, and four mutation probes: PASS`. Initial `actionlint` command used the wrong flag (`-color=never`), then actual YAML check rejected `runner` at job env scope; moved browser cache setup into the install step and `actionlint -no-color` passed. No hosted workflow execution.
- `job-13` exit 0: Node 24.22.3/npm 11.19.1 type check/build, and exactly one scripts-disabled pack of the local candidate. Tarball `release/0.1.3/clatech-db-0.1.3.tgz` SHA-256 `a32518f06bb9c9b5a9df54c14df47eb45381af72aae4a606f8e75d356e689cbc`; npm metadata: 2,071 entries, 2,236,394 bytes compressed / 12,784,778 unpacked. Final suites and exact commit association pending.
- `job-14` exit 0: reproduced pinned CI tool-install commands with scripts disabled; Bun 1.3.14, pnpm 11.23.0, Yarn 4.19.0 and Deno 2.8.3. Preflight, not consumer proof.
- `job-15` exit 0: SHA-verified candidate archive, npm metadata vs actual 2,071 entries, 56 exports, 578 source maps, license allowlist and no credential-pattern alerts. Detached production audit exit 0, zero advisories; development audit exit 1, 26 moderate, zero high/critical. CycloneDX 1.5 SBOM 75 components/76 graph records; no dependency identity delta compared with 0.1.2 after excluding the CLA DB package version. `job-16` complete: typings, Memory 1,833, Dexie 1,837, three circular checks passed. Bun inherited Memory exit 1 at Mocha CLI require() of async unparse-args.js; Bun inherited Dexie 455 pass / 1 failed nested property access with process exit 0, recorded FAIL, not PASS. Distinct from pending tarball Bun lanes. Inherited Deno `-A` suites not run; no-permission legacy flag preflight and in-memory unstable Deno.openKv operation passed, not DenoKV adapter proof.
- `job-17` site render/Vite build passed, one attached metadata assertion failed because the expected string was English instead of rendered Spanish. Corrected separate check against existing built site passed Spanish metadata, Chromium keyboard focus movement, clipboard, and zero observed cross-origin requests. No rebuild or site deployment.
- Exact archive differential against the registry-identical SHA-verified 0.1.2 archive: paths identical, 2,069 files byte-identical; only packed `README.md` and `package.json` changed. Packed manifest differs only by version, no source behavior or production dependency delta.
- T5: storage verifier CLI RED 7/7 failed before change, GREEN 7/7 offline guard probes passed and scoped lint green. Exact SHA-verified candidate storage test exit 0: 30/30 probes, 4/4 sequential lineage pairs, including published 0.1.1/0.1.2 and RxDB 17.6.0, plus self-reopen. Inherited old candidate pin fixed. Native lineage/downgrade not verified. Benchmark: two warm-ups, nine iterations, median/p95, three comparable simulated Dexie series, no ranking/gate; build/runner diffs were unstaged during run.
- T3: `node --test scripts/compatibility/test/run.test.mjs` RED before modules existed, GREEN 18/18 plus scoped ESLint and changelog validation. All eight historical 0.1.2 baseline lanes passed applicable required probes; limited legacy Node, Bun, and Deno lanes have explicit planned skips. 0.1.3 dry-run correctly returned NOT_RUN; exact matrix now running. Deno fallback uses extracted checked bytes and an isolated file dependency because Deno did not handle tarball file dependencies in the probe; this is not npm specifier evidence. Worker reported scratch outside approved scope; do not access or remove it.
- Exact 0.1.3 package/runtime jobs 18, 19 and 20 exited 0: Node 20.0.0/20.20.2 smoke 6 pass + 7 skip; Node 22.23.5/24.22.3/26.13.1 full 13 each; pnpm, Bun→Node and each modern Yarn layout 13 each; Bun→Bun 11 pass + 3 skip; Deno 9 pass + 6 skip, including in-memory DenoKV. None of the skips counts as passed.
- Separate candidate Deno npm specifier probe initially failed on `os.tmpdir()` under restricted environment (`job-21`, exit 1 after scoped registry cache population). Corrected offline invocation `deno run --cached-only --no-prompt --allow-env=NODE_ENV,TMPDIR consumer.ts` passed Memory CRUD, RxJS, version and close; `deno.lock` SHA-512 matched the exact archive. No npm publication or blanket Deno permissions.
- Maintainer selected “Bloques sobre la rama de la release” (`chain_strategy=feature-branch-chain`) for reviewable local commits and any separately authorized future handoff. Do not create any remotes, PRs, tags or releases.
- `job-22` exit 0: detached React 19.3.1 + Vite 8.4.0 with the exact candidate; Chromium rendered the first value and a reactive edit, then cleaned up. Emitted module check excluded Dexie/SQLite, WebSocket/Firestore and alternative frameworks while including React and Memory.
- T4 delivered 45/45 total exact-candidate browser/PWA scenarios with Playwright 1.65.1 (15 each Chromium, Firefox, WebKit). Negative bad-hash probe exited 2 without output/scratch creation. Default isolated Playwright install passed Chromium smoke. Native cross-version lineage, abrupt recovery and Safari/iOS remain outside evidence.
- Read-only ASSESS returned native risk unassessable on the mixed untracked workspace, but explicit Task Size item 2 escalation returned an independent verifier plan. RDD stays off. Independent verifier `mwxs6dnf-8-jem7` passed protected workflow/dependency version/hash/SBOM checks for S2/S9/S10 and artefact S13, no blockers in scope; hosted execution remains unverified. Parent addressed advisory by wiring the same policy probe into compatibility `pack`: RED missing invocation, GREEN and `actionlint` passed after wiring. No new permission or privilege.
- `job-23` exit 0: root lint, 25 deterministic offline tests, changelog schemas, both policy fixtures, `actionlint`, site render, whitespace and candidate checksum passed.
- `job-24` exit 0: local test units committed, package matrix `5fca1d6b3a` and browser/PWA `4b6da5f629`; original tracked user diff unchanged. Complex fixture units exceed the advisory size because the runner, test application, and assertions must land together. Future reviews use the maintainer's feature-branch chain strategy, not one combined PR.
- `job-25` exit 0: fixed Memory workload measured across Node/Bun/Deno and Chromium/Firefox/WebKit (2 warm-ups, 9 iterations each); same archive, insert/read/reactive edit/20 collections/push. This is separate from simulated Dexie reopen/heap data; no cross-adapter ranking, timings not a CI gate.
- `job-26` exit 0: storage `23ada7fdd6`, protected guards `8a1bd58a9d`, compatibility CI `c279ec1a56`, site `59e7593c88`, Memory benchmark `8891dabc42`. No prior user diff touched.
- Jobs 27–31 all exit 0 on `8891dabc42f220e451223bed4ebbca55e47127ae`: 11 detached lanes (123 PASS/23 SKIP), 45 browser scenarios, 30 simulated lineage probes, 25 deterministic fixtures, both workflow policies, lint, types, build, Memory 1,833 and simulated Dexie 1,837. JSON evidence records exact artifact and checkout tree. Earlier benchmark and auxiliary runs are labeled separately.
- No push, PR, remote dispatch, tag, GitHub settings mutation or npm publish/stage action for the 0.1.3 candidate. Publication remains gated on hosted CI and a successful protected npm staging run. Inherited Bun failures and untested scopes remain explicit in the compatibility matrix.

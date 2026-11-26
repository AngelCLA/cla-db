# CLA DB 0.1.2 release candidate
Branch: `chore/release-0.1.2` | Delivery: `feature-branch-chain` (local commits only; forecast 900–1,500 authored lines, excluding generated evidence)
Runners: npm scripts and the isolated packed consumer; no push, tag, merge, or publication.

## Specs

- S1: “Conserva los cambios existentes del usuario.” “No supongas que la documentación representa fielmente el estado actual del código. Verifica las afirmaciones contra la implementación.”
- S2: “Mantener el fork lo más cercano posible a upstream.” “Preservar la API pública de RxDB.” “Mantener la compatibilidad del formato de almacenamiento.” “No falsificar ni alterar los mecanismos de validación de Premium.” “No reintroducir el límite artificial de 13 colecciones.” “Preservar el seguimiento y cierre de `OPEN_COLLECTIONS`.”
- S3: “Analiza todos los cambios realizados desde `v0.1.1`.” “Comprueba si los metadatos de upstream continúan siendo correctos. Si se han incorporado cherry-picks adicionales, documenta sus hashes sin modificar artificialmente la referencia a la base original.” “Corrige regresiones verificadas, pero evita implementar funcionalidades nuevas fuera del alcance de esta release.”
- S4: “La versión pública del paquete deberá ser `0.1.2`.” “Mantén desacoplada la versión pública de CLA DB de `RXDB_VERSION`.” “Verifica la apertura de bases de datos creadas por versiones anteriores de CLA DB y, cuando sea posible, por versiones compatibles de RxDB.”
- S5: “Audita el contenido real que se incluye en el paquete mediante:” `npm pack --dry-run --json` “Genera también un tarball de prueba e inspecciona su contenido.” “Evalúa la incorporación de una lista explícita `files` en `package.json` para controlar la distribución.” “No elimines archivos necesarios para preservar los exports existentes.” “Verifica que no se distribuya código propietario ni información sensible.”
- S6: “Mejora `scripts/verify-pack-consumer.mjs` cuando sea necesario.” “El paquete generado debe instalarse y probarse en un directorio completamente independiente del repositorio.” “Comprueba que todos los archivos declarados en `exports` existan dentro del tarball.” “Siempre que sea viable, verifica también el paquete actualmente publicado en npm para identificar diferencias con la distribución local.”
- S7: “Realiza una auditoría de conexiones externas en el código de producción.” “No elimines atribuciones ni conexiones que sean parte legítima de una integración configurada explícitamente.” “La finalidad es verificar que el núcleo de CLA DB pueda operar localmente sin depender de infraestructura controlada por RxDB.” “Cuando sea posible, agrega una prueba de funcionamiento del núcleo con acceso a la red bloqueado.” “Documenta los hallazgos en `docs/audits/NETWORK_AUDIT.md` o en una ubicación equivalente que respete la estructura del repositorio.” “No afirmes que existe cero telemetría hasta comprobarlo.”
- S8: “Actualiza el README para que sea profesional, claro y orientado al consumidor final.” “La instalación principal debe ser:” `npm install @clatech/db rxjs` “Utiliza ejemplos reales, funcionales y coherentes con la API actual.” “Documenta que el adaptador SQLite heredado conserva las restricciones de su implementación de prueba, incluyendo límites de documentos y operaciones.”
- S9: “Revisa los directorios `web/` y `docs-src/`.” “Conserva la identidad visual existente de CLA Tech.” “Ausencia de servicios de analytics heredados no autorizados.” “No presentes CLA DB como una base de datos desarrollada desde cero. Debe reconocerse su origen como fork de RxDB.”
- S10: “Realiza una auditoría de dependencias mediante las herramientas disponibles.” “No ejecutes `npm audit fix --force` de manera automática.” “No actualices dependencias masivamente si esto afecta la compatibilidad con upstream.” “Agrega o mejora:” “`SECURITY.md`.” “SBOM en formato estándar, preferentemente CycloneDX o SPDX.” “Verificación de licencias de dependencias.” “Documentación del proceso de publicación segura.” “Estrategia de npm provenance y Trusted Publishing.”
- S11: “Verifica el cumplimiento de Apache 2.0.” “Preserva:” “Licencia original.” “Avisos de copyright.” “Atribuciones.” “Historial original de cambios.” “Avisos de terceros aplicables.” “Comprueba los requisitos relacionados con archivos `NOTICE`, si existen en upstream o son necesarios para la distribución.”
- S12: “Ejecuta como mínimo:” `npm run lint`, `npm run build`, `npm run check-types`, `npm run test:typings`, `npm run test:circular`, `npm run test:fast:memory`, `npm run test:fast:dexie`, `node ./scripts/verify-pack-consumer.mjs`. “Las pruebas que no puedan ejecutarse deben quedar documentadas con su motivo.” “Nunca reportes como exitosa una prueba que no fue ejecutada.”
- S13: “Revisa la metodología actual de benchmarks.” “Distingue resultados de `fake-indexeddb` de IndexedDB real.” “Compara con la versión anterior bajo condiciones equivalentes.” “No afirmes que CLA DB es más rápido que RxDB sin una comparación reproducible.”
- S14: “Revisa y mejora la configuración existente de CI.” “Evalúa una matriz con las versiones de Node.js soportadas por el proyecto.” “Prepara un workflow de publicación independiente, protegido y ejecutado únicamente mediante una acción explícitamente autorizada.” “No agregues tokens ni secretos directamente al repositorio.”
- S15: “Actualiza `CLA_CHANGELOG.md`” “Omite las secciones que no tengan cambios reales.” “Conserva el historial original de RxDB por separado.” “Actualiza `ROADMAP.md` manteniendo la siguiente dirección estratégica:” see original milestones in L1.
- S16: “Agrupa los reportes técnicos dentro de una ubicación coherente con la arquitectura del repositorio.” “Registra las decisiones arquitectónicas relevantes en Engram, si está disponible.” “Si algún criterio no puede cumplirse, debe identificarse como bloqueante o no bloqueante y justificarse.”
- S17: “Trabaja en una rama independiente, preferentemente:” `chore/release-0.1.2` “Utiliza commits pequeños y descriptivos siguiendo Conventional Commits.” “No realices force push.” “No sobrescribas tags existentes.” “No publiques automáticamente en npm.” “No ejecutes `npm unpublish`.” “No crees una release pública ni hagas merge a `master` sin autorización explícita.”

- S18: “hazlo” and selected “Adoptar el nuevo hash (recomendado)”: “Incorporar el cambio mínimo a la rama local y actualizar tarball, evidencia y SBOM. No publicar ni tocar gRPC.”

## Tasks

- T1 | S1–S7, S12, S17 | parent + read-only explorer | done: baseline review, access check, registry and ancestry (L2–L5); no commit.
- T2 | S2, S4–S7, S11–S12, S15 | two bounded writers, parallel and disjoint (privacy and distribution; context backstop) | done: independent verifiers passed both units; privacy boundary `e41bc43cfb..050c71bbe0`, package boundary `050c71bbe0..18b14f907c` (owner authorized separate local commit; no push).
- T3 | S2–S4, S6, S12–S13 | bounded writer, context backstop | done: boundary `18b14f907c..7200413fe5`; lint, types, both published baselines to candidate with fake IndexedDB, and local benchmark proof. Real browser durability remains unverified (see COMPATIBILITY.md).
- T4 | S1, S3–S4, S8–S9, S11–S12, S15 | bounded writer, context backstop | done: site `91cb17aaf8` and docs `a6a205a9b7`; independent site privacy/example checks passed, README samples and both production builds passed. Residual embeds and no deployed browser audit recorded in SITES.md.
- T5 | S10–S12, S14–S16 | bounded writer + independent verification for high risks | done: CI `b1a1996506`, docs and SBOM `17169c81a5`; one added route `web/package.json` explicitly approved. Writer clean install/build, verifier workflow/SBOM/payload checks passed. Extra verifier batch denied and not retried. OIDC registration, remote protections and suites not asserted; dev audit exit 1 (31, 6 high), detached prod exit 0.
- T6 | S2, S5–S7, S12–S17 | parent coordinates and verifies | done: `66bf60dc4d`. Jobs 12/13 passed all required checks in clean locked copies after correcting typecheck order (build before check-types). Memory 1,918; Dexie 1,922; isolated consumer 56 exports; both cross-version reopens passed. Final tarball `release/0.1.2/clatech-db-0.1.2.tgz` (not tracked) SHA-256 `617c176b7891e986f41e9f72963a829dc0f279898c2936d1bde95716ca55715b`; fresh production audit exit 0 and persisted SBOM matches final graph. Job 11 failed before tests (tmpfs out of inodes); used disposable disk-backed scratch. Review-ready, not publication-cleared; development findings and remote protections remain open.

- T7 | S10–S12, S15–S18 | inline scoped lock change + maintainer review | done: `34196d9ab5`. Prototype and final checks passed (jobs 24–26); `rxdb-old@16.21.1` uses existing `ws@8.23.0`, no other resolution change. Adopted SHA-256 `6bcb34477e02c14da4e54a8993716f5a72b6d309c9b6d6b7dd7a494f2c40b1ed`; previous tarball preserved. Automated verifier aborted with `ENOSPC` and was not retried. Maintainer confirmed review of scoped diff and tarball/SBOM SHA-256 (L8); job 27 committed locally. No gRPC, workflow, or remote changes.

## Log

### L1

# CLA DB — Consolidación y release v0.1.2

Actúa como un Senior Software Engineer especializado en bases de datos local-first, TypeScript, mantenimiento de proyectos open source, arquitectura de software y distribución de librerías mediante npm.

Vamos a preparar la versión **0.1.2 de CLA DB (`@clatech/db`)**, un fork independiente del núcleo open source de RxDB, mantenido por CLA Tech bajo licencia Apache 2.0.

## 1. Contexto

- Repositorio: https://github.com/AngelCLA/cla-db
- Paquete: https://www.npmjs.com/package/@clatech/db
- Versión anterior: `0.1.1`.
- Versión objetivo: `0.1.2`.
- Upstream: https://github.com/pubkey/rxdb
- Base de compatibilidad: RxDB `17.6.0`.
- Política de desarrollo: **Minimal fork, maximum compatibility**.

CLA DB busca proporcionar una base de datos reactiva, local-first y offline-first sin el límite artificial de 13 colecciones simultáneas, manteniendo la compatibilidad con las interfaces públicas de RxDB.

Esta versión debe ser una release de consolidación, mantenimiento, documentación, seguridad y distribución, no una expansión funcional del proyecto.

## 2. Metodología de trabajo

Antes de modificar cualquier archivo:

- Lee `AGENTS.md`, `SYSTEM_DESIGN.md`, `ROADMAP.md`, `UPSTREAM.md`, `CLA_CHANGELOG.md` y `CONTRIBUTING.md`.
- Utiliza Engram para recuperar decisiones arquitectónicas previas, si está disponible.
- Inspecciona el estado actual del repositorio, ramas, tags, commits y cambios pendientes.
- Compara `v0.1.1` con el estado actual de `master`.
- Verifica el estado real del paquete publicado en npm.
- Identifica riesgos, inconsistencias y cambios no documentados.
- Establece un plan de implementación con criterios de aceptación verificables.
- Conserva los cambios existentes del usuario.
- Sigue las convenciones y workflows definidos en el repositorio.

No supongas que la documentación representa fielmente el estado actual del código. Verifica las afirmaciones contra la implementación.

## 3. Restricciones arquitectónicas

Es obligatorio respetar lo siguiente:

- Mantener el fork lo más cercano posible a upstream.
- Preservar la API pública de RxDB.
- Mantener la compatibilidad del formato de almacenamiento.
- No incorporar código propietario de RxDB Premium.
- No falsificar ni alterar los mecanismos de validación de Premium.
- No reintroducir el límite artificial de 13 colecciones.
- Preservar el seguimiento y cierre de `OPEN_COLLECTIONS`.
- No sustituir RxJS.
- No renombrar las funciones públicas heredadas, como `createRxDatabase`, `addRxPlugin` o `replicateRxCollection`.
- No realizar refactorizaciones masivas innecesarias.
- No introducir nuevas dependencias de producción sin una justificación técnica.
- No implementar todavía los adaptadores propios de Cloudflare, SQLite, OPFS o R2.
- No eliminar funcionalidades open source heredadas únicamente por contener referencias a RxDB.
- No modificar, eliminar ni reescribir el historial de upstream.

Los cambios deben estar respaldados por pruebas y mantener una superficie de modificación reducida.

## 4. Auditoría y consolidación de cambios

Analiza todos los cambios realizados desde `v0.1.1`.

Presta especial atención a:

- Protocolo de replicación.
- Replicación upstream y downstream.
- Gestión de checkpoints.
- Resolución de conflictos.
- Inicio, pausa, reanudación y cancelación de replicaciones.
- Prevención de streams duplicados.
- Validación de documentos.
- Validación de claves primarias.
- Ciclo de vida de las colecciones.
- Migraciones de esquemas.
- Plugins de replicación.
- Señalización de Google Drive y Microsoft OneDrive.
- Cambios de documentación y sitio web.

Determina cuáles son correcciones heredadas de upstream y cuáles son modificaciones específicas de CLA DB.

Comprueba si los metadatos de upstream continúan siendo correctos. Si se han incorporado cherry-picks adicionales, documenta sus hashes sin modificar artificialmente la referencia a la base original.

Corrige regresiones verificadas, pero evita implementar funcionalidades nuevas fuera del alcance de esta release.

## 5. Identidad y versionado

Actualiza de manera consistente:

- `package.json`.
- Metadatos del paquete.
- README.
- Roadmap.
- CLA Changelog.
- Documentación propia.
- Referencias de versión del sitio web.
- Archivos de bloqueo, si corresponde.
- Shims de plugins generados.

La versión pública del paquete deberá ser `0.1.2`.

Mantén desacoplada la versión pública de CLA DB de `RXDB_VERSION`.

Ejemplo conceptual:

- CLA DB package version: `0.1.2`.
- Storage compatibility version: `17.6.0`.

No reemplaces automáticamente `RXDB_VERSION` por `0.1.2`, ya que esto podría romper las comprobaciones de compatibilidad de bases de datos existentes.

Verifica la apertura de bases de datos creadas por versiones anteriores de CLA DB y, cuando sea posible, por versiones compatibles de RxDB.

No anuncies compatibilidad total sin pruebas que la respalden.

## 6. Optimización de la distribución npm

Audita el contenido real que se incluye en el paquete mediante:

```bash
npm pack --dry-run --json
```

Genera también un tarball de prueba e inspecciona su contenido.

Evalúa la incorporación de una lista explícita `files` en `package.json` para controlar la distribución.

Conserva todos los recursos necesarios para:

- ESM.
- CommonJS.
- Declaraciones TypeScript.
- Imports mediante subpaths.
- Plugins públicos.
- Recursos utilizados en tiempo de ejecución.
- Source maps funcionales, cuando corresponda.
- Licencia y atribuciones.
- Herramientas heredadas que formen parte de la API distribuida.

Excluye archivos que no sean necesarios para los consumidores:

- `web/`.
- `design/`.
- Archivos de agentes.
- Metadatos locales.
- Tarballs anteriores.
- Pruebas internas.
- Archivos temporales.
- Ejemplos de desarrollo.
- Documentación completa del sitio.
- Configuraciones exclusivas de desarrollo.

No elimines archivos necesarios para preservar los exports existentes.

Registra:

- Tamaño comprimido del paquete.
- Tamaño descomprimido.
- Cantidad de archivos.
- Dependencias directas.
- Diferencias respecto al paquete anterior.

Verifica que no se distribuya código propietario ni información sensible.

## 7. Validación del paquete como consumidor externo

Mejora `scripts/verify-pack-consumer.mjs` cuando sea necesario.

El paquete generado debe instalarse y probarse en un directorio completamente independiente del repositorio.

Valida:

- Importación ESM.
- Importación CommonJS.
- Resolución TypeScript con NodeNext.
- Resolución TypeScript con Bundler.
- Imports desde los plugins públicos.
- Compatibilidad con Vite.
- Compatibilidad con las versiones de Node.js declaradas en `engines`.
- Ausencia de dependencias directas o indirectas no justificadas del paquete original `rxdb`.
- Creación de más de 13 colecciones.
- Operaciones CRUD.
- Consultas reactivas.
- Persistencia mediante Dexie.
- Migración de esquemas.
- Replicación mediante handlers personalizados.

Comprueba que todos los archivos declarados en `exports` existan dentro del tarball.

Siempre que sea viable, verifica también el paquete actualmente publicado en npm para identificar diferencias con la distribución local.

## 8. Independencia de infraestructura

Realiza una auditoría de conexiones externas en el código de producción.

Busca referencias relacionadas con:

- `rxdb.info`.
- Servicios de RxDB.
- Telemetría.
- Analytics.
- Seguimiento de usuarios.
- Validaciones remotas de licencias.
- Peticiones HTTP automáticas.
- WebSockets.
- Servidores de señalización WebRTC.
- Servicios de terceros.
- Herramientas de diagnóstico.

Clasifica cada referencia en:

1. Referencia documental.
2. Atribución al proyecto original.
3. Conexión solicitada explícitamente por el consumidor.
4. Dependencia externa necesaria para un plugin específico.
5. Comunicación automática no requerida por el consumidor.

No elimines atribuciones ni conexiones que sean parte legítima de una integración configurada explícitamente.

La finalidad es verificar que el núcleo de CLA DB pueda operar localmente sin depender de infraestructura controlada por RxDB.

Cuando sea posible, agrega una prueba de funcionamiento del núcleo con acceso a la red bloqueado.

Documenta los hallazgos en `docs/audits/NETWORK_AUDIT.md` o en una ubicación equivalente que respete la estructura del repositorio.

No afirmes que existe cero telemetría hasta comprobarlo.

## 9. Documentación

Actualiza el README para que sea profesional, claro y orientado al consumidor final.

Debe incluir:

- Qué es CLA DB.
- Qué problemas resuelve.
- Diferencias respecto a RxDB.
- Instalación desde npm.
- Inicio rápido.
- Ejemplo con JavaScript.
- Ejemplo con TypeScript.
- Consultas reactivas.
- Almacenamiento persistente.
- Replicación personalizada.
- Compatibilidad de plataformas.
- Motores de almacenamiento disponibles.
- Limitaciones conocidas.
- Enlaces a documentación.
- Estado del proyecto.
- Licencia.
- Atribución a RxDB.
- Información para contribuir.

La instalación principal debe ser:

```bash
npm install @clatech/db rxjs
```

Verifica primero que el paquete esté disponible en el registro. Si no lo está, conserva instrucciones de instalación local y documenta el motivo.

Utiliza ejemplos reales, funcionales y coherentes con la API actual.

Distingue claramente entre:

- Funcionalidades disponibles.
- Funcionalidades heredadas.
- Funcionalidades experimentales.
- Funcionalidades planificadas.
- Funcionalidades Premium no incluidas.

Documenta que el adaptador SQLite heredado conserva las restricciones de su implementación de prueba, incluyendo límites de documentos y operaciones.

No presentes SQLite como un adaptador propio listo para producción.

## 10. Sitio web y documentación pública

Revisa los directorios `web/` y `docs-src/`.

Establece y documenta el propósito de cada uno:

- `web/`: sitio oficial o landing page de CLA DB.
- `docs-src/`: documentación técnica y referencia de API, si esta estructura sigue siendo válida.

Evita mantener dos implementaciones que dupliquen innecesariamente la misma responsabilidad.

Conserva la identidad visual existente de CLA Tech.

Verifica:

- Referencias correctas a `@clatech/db`.
- Comandos de instalación actualizados.
- Ejemplos funcionales.
- Navegación.
- Enlaces.
- Metadatos SEO.
- Open Graph.
- Favicons.
- Diseño responsive.
- Accesibilidad.
- Compilación de producción.
- Ausencia de servicios de analytics heredados no autorizados.
- Diferenciación clara entre CLA DB y RxDB.

No presentes CLA DB como una base de datos desarrollada desde cero. Debe reconocerse su origen como fork de RxDB.

No inventes cifras de rendimiento, usuarios, empresas, descargas o adopción.

## 11. Seguridad y cadena de suministro

Realiza una auditoría de dependencias mediante las herramientas disponibles.

Evalúa:

- Vulnerabilidades conocidas.
- Dependencias obsoletas.
- Dependencias innecesarias.
- Dependencias transitivas.
- Scripts ejecutados durante la instalación.
- Archivos sensibles incluidos accidentalmente.
- Reproducibilidad del proceso de compilación.

No ejecutes `npm audit fix --force` de manera automática.

No actualices dependencias masivamente si esto afecta la compatibilidad con upstream.

Agrega o mejora:

- `SECURITY.md`.
- Política de reporte responsable de vulnerabilidades.
- Política de versiones soportadas.
- SBOM en formato estándar, preferentemente CycloneDX o SPDX.
- Verificación de licencias de dependencias.
- Documentación del proceso de publicación segura.
- Estrategia de npm provenance y Trusted Publishing.

Distingue vulnerabilidades confirmadas de advertencias que no afectan el código distribuido.

## 12. Licencia y atribución

Verifica el cumplimiento de Apache 2.0.

Preserva:

- Licencia original.
- Avisos de copyright.
- Atribuciones.
- Historial original de cambios.
- Avisos de terceros aplicables.

Identifica claramente las modificaciones realizadas por CLA Tech.

Comprueba los requisitos relacionados con archivos `NOTICE`, si existen en upstream o son necesarios para la distribución.

CLA DB debe identificarse como un fork independiente, no afiliado ni respaldado oficialmente por RxDB.

## 13. Pruebas y calidad

Ejecuta como mínimo:

```bash
npm run lint
npm run build
npm run check-types
npm run test:typings
npm run test:circular
npm run test:fast:memory
npm run test:fast:dexie
node ./scripts/verify-pack-consumer.mjs
```

Verifica que los comandos sean válidos para el estado actual del repositorio.

Mantén y amplía las pruebas específicas de CLA DB para cubrir:

- 14 colecciones.
- 20 colecciones.
- 50 colecciones.
- 100 colecciones.
- Cierre y liberación de recursos.
- Reapertura de bases de datos.
- Persistencia.
- Reactividad.
- Replicación bidireccional.
- Conflictos.
- Migraciones.
- Compatibilidad con versiones anteriores.
- Inicio y pausa repetidos de replicaciones.

Evalúa agregar pruebas de integración con navegadores reales mediante la infraestructura existente o una alternativa justificada.

Prioriza Chromium, Firefox y WebKit para validar IndexedDB y persistencia.

Las pruebas que no puedan ejecutarse deben quedar documentadas con su motivo.

Nunca reportes como exitosa una prueba que no fue ejecutada.

## 14. Benchmarks

Revisa la metodología actual de benchmarks.

Cuando sea posible:

- Ejecuta calentamiento previo.
- Realiza múltiples iteraciones.
- Reporta mediana y percentiles.
- Separa tiempos de inicialización, escritura y lectura.
- Registra consumo de memoria.
- Distingue resultados de `fake-indexeddb` de IndexedDB real.
- Documenta hardware, sistema operativo y runtime.
- Compara con la versión anterior bajo condiciones equivalentes.

No afirmes que CLA DB es más rápido que RxDB sin una comparación reproducible.

## 15. GitHub Actions y proceso de release

Revisa y mejora la configuración existente de CI.

Debe verificar:

- Instalación reproducible.
- Compilación.
- Lint.
- Tipos.
- Pruebas automatizadas.
- Integridad de exports.
- Contenido del paquete.
- Licencias.
- Seguridad.
- Instalación como consumidor externo.
- Compilación del sitio web, cuando corresponda.

Evalúa una matriz con las versiones de Node.js soportadas por el proyecto.

Prepara un workflow de publicación independiente, protegido y ejecutado únicamente mediante una acción explícitamente autorizada.

Considera npm Trusted Publishing mediante OIDC y generación de provenance.

No restaures workflows heredados que publiquen paquetes de RxDB, notifiquen servicios de upstream o desplieguen documentación ajena.

No agregues tokens ni secretos directamente al repositorio.

## 16. Changelog y roadmap

Actualiza `CLA_CHANGELOG.md` para incluir:

```text
## [0.1.2]

### Added
### Changed
### Fixed
### Security
### Documentation
### Testing
### Distribution
### Known Limitations
```

Omite las secciones que no tengan cambios reales.

Registra:

- Base upstream exacta.
- Cherry-picks adicionales, si existen.
- Correcciones incorporadas.
- Resultados de pruebas.
- Cambios en distribución.
- Resultados de auditoría.
- Limitaciones conocidas.

Conserva el historial original de RxDB por separado.

Actualiza `ROADMAP.md` manteniendo la siguiente dirección estratégica:

- `0.1.2`: Consolidación.
- `0.2.0`: Integración con Cloudflare Workers y D1.
- `0.3.0`: Adaptador SQLite independiente.
- `0.4.0`: Adaptador OPFS y optimización.
- `0.5.0`: DevTools, diagnóstico y respaldo.
- `1.0.0`: Primera versión estable validada en aplicaciones reales.

Los nuevos adaptadores deberán diseñarse preferentemente como paquetes independientes del núcleo.

## 17. Criterios de aceptación

La versión `0.1.2` estará preparada para publicación cuando:

- [ ] El núcleo conserve la compatibilidad pública prevista con RxDB.
- [ ] El límite artificial de colecciones continúe eliminado.
- [ ] Los mecanismos Premium permanezcan sin alteraciones.
- [ ] Se preserve la compatibilidad de almacenamiento.
- [ ] Se documenten los cambios posteriores a `0.1.1`.
- [ ] El paquete sea instalable en un proyecto externo.
- [ ] Los exports públicos sean válidos.
- [ ] ESM, CommonJS y TypeScript funcionen correctamente.
- [ ] Las pruebas obligatorias sean satisfactorias.
- [ ] No se distribuyan archivos innecesarios.
- [ ] Se preserve la licencia y atribución.
- [ ] La auditoría de infraestructura externa esté documentada.
- [ ] Los riesgos de seguridad estén identificados.
- [ ] La documentación refleje el estado real del proyecto.
- [ ] El sitio web compile correctamente, si se modifica.
- [ ] El changelog y roadmap estén actualizados.
- [ ] Exista un procedimiento reproducible para publicar la release.

Si algún criterio no puede cumplirse, debe identificarse como bloqueante o no bloqueante y justificarse.

## 18. Entregables

Al finalizar genera:

1. Código fuente actualizado.
2. Documentación actualizada.
3. `CLA_CHANGELOG.md` actualizado.
4. `ROADMAP.md` actualizado.
5. `SECURITY.md`.
6. Auditoría de infraestructura externa.
7. Reporte de dependencias y seguridad.
8. SBOM.
9. Reporte de pruebas.
10. Reporte de contenido y tamaño del paquete.
11. Tarball de distribución `clatech-db-0.1.2.tgz`.
12. Release notes para GitHub.
13. Resumen de cambios y decisiones técnicas.
14. Instrucciones finales de publicación.

Agrupa los reportes técnicos dentro de una ubicación coherente con la arquitectura del repositorio.

Registra las decisiones arquitectónicas relevantes en Engram, si está disponible.

## 19. Control de cambios y publicación

Trabaja en una rama independiente, preferentemente:

```bash
chore/release-0.1.2
```

Utiliza commits pequeños y descriptivos siguiendo Conventional Commits.

No realices force push.

No sobrescribas tags existentes.

No publiques automáticamente en npm.

No ejecutes `npm unpublish`.

No crees una release pública ni hagas merge a `master` sin autorización explícita.

La publicación será una operación posterior a la revisión de los entregables y resultados de CI.

## 20. Instrucción final

Comienza con la auditoría del estado actual del repositorio.

Después, presenta un plan técnico y ejecuta las tareas de manera ordenada, verificando cada cambio antes de continuar.

Prioriza estabilidad, mantenibilidad, compatibilidad, seguridad y calidad de distribución por encima de incorporar nuevas funcionalidades.

No te limites a generar recomendaciones: implementa los cambios necesarios, ejecuta las pruebas disponibles y entrega una versión candidata de CLA DB v0.1.2 lista para revisión.

Si encuentras un problema que impide garantizar la estabilidad de la release, documenta el problema y evita publicar una versión defectuosa.

**Principio rector: Minimal fork, maximum compatibility.**

### L2 — baseline

`master` and `origin/master` were clean at `e41bc43cfb`; the release branch was created at the same revision. `d08621c7e2` is an ancestor through merge `515bb00884`, integrated by `e41bc43cfb`; no cherry-picks among nine integrated upstream commits. Foundation base `9d5849cf4c695ffc27d60e134b2039539e77a9b0` stays unchanged. Only `src/rx-collection.ts` differs between the integrated upstream source tree and `master` under `src/`.

### L3 — access

Owner asked “vuelve a probar”, “si te autorizo”, then “hazlo”. Rooted `!/src/plugins/` is a narrowly verified workspace config change, left unstaged and excluded from release commits unless requested. No access was broadened to other exclusions.

### L4 — distribution

npm `latest` is `0.1.1`, published artifact 2,270,333 compressed bytes, 12,889,867 unpacked, 2,110 entries, SHA-512 `n5nPux+L1eEvVOeoL6zd+DBQ1LEyPaoQGmOzwJ5i0zf36/CBFdxZsmBvSXZvqXGRoongPILmtRdJalwrB760nQ==`. Current pre-change dry run on Node 24.22.3 / npm 11.19.1: 27,272,149 compressed, 95,484,388 unpacked, 2,734 entries, including `web/` (615), `design/` (8), `.codegraph` (1). 56 package exports; 24 direct production dependencies.

### L5 — network, scope, review

The read-only audit confirmed that `RxDBDevModePlugin.init` triggers a hidden `rxdb.info` tracking iframe across browser origins, and Premium flag validation is local. Default hosted viewer and signaling are activated by explicit integration choices; keep those public behaviors and document destinations and overrides. Verify the automatic iframe by a deterministic browser-like probe before a minimal fix; preserve validation hooks, Premium and attribution. Dev-mode tracking and Docusaurus conversion-worker eligibility are distinct paths. User chose the feature-branch review chain; this does not authorize a push, PR, merge, release or publish.

### L6 — T2 implementation and seam evidence

Both workers observed RED and GREEN. Parent combined verification (job-3) passed lint, check-types, build, fast:memory (1,918 passing), packed consumer and diff check. The rebuilt pack has 2,071 files, 2,232,799 compressed and 12,774,831 unpacked bytes, and all pack runner checks including 578 maps passed. Privacy committed at `050c71bbe0ba054fc19cd74369cb3315f6605b74`. The combined 25-second Git command failed by timeout during the second commit; read-back confirmed only the intended seven package paths staged with no package commit and no retry. T2 stays in progress pending independent privacy and distribution verdicts and completion of the local package commit. Read-only assessment native evidence unavailable due to an untracked-file requirement; RDD remains off and the plan requires independent verifiers for both named risks.

### L7

hazlo

Adoptar el nuevo hash (recomendado)

Incorporar el cambio mínimo a la rama local y actualizar tarball, evidencia y SBOM. No publicar ni tocar gRPC.

### L8

acepto los cambios

si

The second reply confirmed the owner reviewed both the scoped ws diff and the tarball SHA-256 against the SBOM. The automated verifier had no verdict; no automated retry was requested or executed. Local commit only.

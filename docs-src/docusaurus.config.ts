// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { readFileSync } from 'node:fs';
import type { Config } from '@docusaurus/types';
import rehypePrettyCode from 'rehype-pretty-code';
import type { Options as RehypePrettyCodeOptions, Theme } from 'rehype-pretty-code';
import { createCssVariablesTheme, ThemeRegistrationAny } from 'shiki';
// CLA-DB: the EU consent import was removed with the GA4 script.
import remarkArticleByline from './src/remark/article-byline';

/**
 * Query for CSS imports that are loaded on demand,
 * see the custom-webpack-tweaks plugin.
 */
const LAZY_CSS_QUERY = /lazy-css/;

/**
 * The RxDB version from the root package.json, used for the
 * softwareVersion field of the JSON-LD structured data so it
 * stays in sync with each release.
 */
const rxdbVersion: string = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
).version;

const rehypePrettyCodeOptions: RehypePrettyCodeOptions = {
    theme: createCssVariablesTheme({
        name: 'css-variables',
        variablePrefix: '--shiki-',
        fontStyle: true,
        // rehype-pretty-code expects "settings" to always be available,
        // but shiki doesn't always provide it.
    }) satisfies ThemeRegistrationAny as Theme,
    bypassInlineCode: true,
};

/** @type {import('@docusaurus/types').Config} */
const config: Config = {
    /**
     * Docusaurus appends this to every page title as `<page title> | <title>`
     * (see useTitleFormatter in @docusaurus/theme-common), so it doubles as the
     * sitewide title suffix. Keep it short: Google truncates titles around 60
     * characters and treats repeated boilerplate as a reason to rewrite the
     * title link, which loses us control of the search listing.
     * @link https://developers.google.com/search/docs/appearance/title-link
     *
     * Pages that need the longer descriptive form set it explicitly (the
     * homepage and /consulting/ pass HOME_TITLE below).
     */
    // CLA-DB: rebranded from RxDB to CLA DB. The inherited docs content still
    // documents the RxDB API that this fork preserves.
    title: 'CLA DB',
    tagline: 'Local-first reactive NoSQL database for JavaScript',
    favicon: '/files/logo/cla-db-mark.svg',
    headTags: [
        /**
         * CLA-DB: the RxDB GA4 consent-mode script was removed. The fork's
         * documentation site disables inherited marketing callbacks. The upstream comment below
         * documents the removed behavior and returns with the next sync.
         *
         * Google Consent Mode v2 default. For EU/EEA (and UK) regions the
         * analytics and ad storage is denied until the visitor accepts in the
         * client-side consent banner (see src/theme/consent-manager.ts).
         * Google detects the region server-side from the IP, so this stays
         * accurate independent of the timezone heuristic used to decide
         * whether the banner is shown. The commands are queued on dataLayer
         * before gtag.js boots, so the default applies to the very first hit.
         *
         * gtag.js itself is loaded by src/theme/Root.tsx after the analytics
         * consent was given, on the first interaction of the visitor or 3 seconds
         * after the page load. The config command then sends
         * the page_view of the first page. Page views of client-side navigations
         * are sent by the enhanced measurement of the GA4 data stream
         * (browser history events).
         */
        { tagName: 'meta', attributes: { name: 'theme-color', content: '#ed168f' } },
        // CLA-DB: the RxDB .ico/apple-touch fallbacks and the RxDB GA4 consent
        // script were removed; legacy integrations remain documented. Favicon is SVG only.
        {
            tagName: 'script',
            attributes: { type: 'application/ld+json' },
            innerHTML: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'SoftwareApplication',
                'name': 'CLA DB',
                'applicationCategory': 'DeveloperApplication',
                'operatingSystem': 'Storage-dependent; see consumer compatibility evidence',
                'description': 'A minimal Apache 2.0 fork of RxDB maintained by CLA Tech. Local-first reactive NoSQL for JavaScript with explicitly configured replication. Platform support depends on storage and runtime.',
                'url': 'https://db.claangel.site',
                'softwareVersion': rxdbVersion + ' candidate (npm latest: 0.1.1)',
                'license': 'https://github.com/AngelCLA/cla-db/blob/master/LICENSE.txt',
                'downloadUrl': 'https://www.npmjs.com/package/@clatech/db',
                'softwareHelp': {
                    '@type': 'CreativeWork',
                    'url': 'https://db.claangel.site/quickstart.html',
                },
                'offers': {
                    '@type': 'Offer',
                    'price': '0',
                    'priceCurrency': 'USD',
                },
                'author': {
                    '@type': 'Organization',
                    'name': 'CLA DB',
                    'url': 'https://db.claangel.site',
                    'logo': 'https://db.claangel.site/files/logo/cla-db-mark.svg',
                    'sameAs': [
                        'https://github.com/AngelCLA/cla-db',
                        'https://www.npmjs.com/package/@clatech/db',
                    ],
                },
            }),
        },
        {
            tagName: 'script',
            attributes: { type: 'application/ld+json' },
            innerHTML: JSON.stringify({
                '@context': 'https://schema.org',
                '@graph': [
                    {
                        '@type': 'Organization',
                        '@id': 'https://db.claangel.site/#organization',
                        'name': 'CLA DB',
                        'url': 'https://db.claangel.site',
                        'logo': 'https://db.claangel.site/files/logo/cla-db-mark.svg',
                        'sameAs': [
                            'https://github.com/AngelCLA/cla-db',
                            'https://www.npmjs.com/package/@clatech/db',
                        ],
                    },
                    {
                        '@type': 'WebSite',
                        '@id': 'https://db.claangel.site/#website',
                        'name': 'CLA DB',
                        'url': 'https://db.claangel.site',
                        'inLanguage': 'en',
                        'publisher': { '@id': 'https://db.claangel.site/#organization' },
                    },
                ],
            }),
        },
    ],

    // CLA-DB: production domain of the CLA DB documentation site.
    url: 'https://db.claangel.site',
    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    baseUrl: '/',

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: 'AngelCLA', // Usually your GitHub org/user name.
    projectName: 'cla-db', // Usually your repo name.

    future: {
        /**
         * Docusaurus Faster: Rspack bundler, SWC loader and minifier,
         * Lightning CSS minifier and SSG worker threads.
         * @link https://docusaurus.io/blog/releases/3.6#docusaurus-faster
         */
        faster: {
            swcJsLoader: true,
            swcJsMinimizer: true,
            /**
             * The SWC HTML minifier also minifies the CSS inside inline <style> tags.
             * Components like the docs animations render <style>{`...`}</style>,
             * so the minified CSS in the HTML no longer matches the text that React
             * renders on the client. React then throws a hydration error (#418) and
             * renders the whole page content again, which delays the
             * Largest Contentful Paint. The Terser HTML minifier keeps the CSS as is.
             */
            swcHtmlMinimizer: false,
            lightningCssMinimizer: true,
            mdxCrossCompilerCache: true,
            rspackBundler: true,
            rspackPersistentCache: true,
            ssgWorkerThreads: true,
        },
        v4: {
            /**
             * Required by the ssgWorkerThreads option of experimental_faster.
             */
            removeLegacyPostBuildHeadAttribute: true,
        },
    },
    onBrokenLinks: 'throw',
    markdown: {
        hooks: {
            onBrokenMarkdownLinks: 'throw',
        },
    },

    // Even if you don't use internationalization, you can use this field to set
    // useful metadata like html lang. For example, if your site is Chinese, you
    // may want to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: 'en',
        locales: ['en'],
    },
    clientModules: [
        './src/client-modules/prefetch-on-hover.ts',
    ],
    plugins: [
        [
            'docusaurus-plugin-llms',
            {
                generateLLMsTxt: true,
                generateLLMsFullTxt: true,
                docsDir: 'docs',
                /**
                 * Add deprecated stuff here
                 */
                ignoreFiles: [
                    'docs/adapters.md',
                    'docs/rx-storage-lokijs.md'
                ],
                title: 'CLA DB Documentation',
                description: 'Reference documentation for CLA DB, a minimal Apache 2.0 fork of RxDB. Documents the inherited RxDB API: a reactive, local-first NoSQL database for JavaScript with offline support and explicit replication.',
                rootContent: `CLA DB (@clatech/db) is a minimal Apache 2.0 fork of RxDB.
It stores data on the client (browser, Node.js, React Native, Electron, Capacitor) and optionally replicates with a backend server.
Data is modeled as JSON documents inside collections, validated by JSON Schema, and queried with the Mango/MongoDB query syntax.
All data access is reactive through RxJS Observables so that UI components update automatically when data changes.

Source code: https://github.com/AngelCLA/cla-db
Website: https://db.claangel.site
Upstream project: RxDB, https://rxdb.info. These pages document the RxDB API that CLA DB preserves; the upstream documentation remains authoritative for upstream-specific questions.

Topic-specific documentation files:
- [Core API](https://db.claangel.site/llms-api.txt): RxDatabase, RxSchema, RxCollection, RxDocument, RxQuery
- [Storages](https://db.claangel.site/llms-storages.txt): RxStorage layer, all storage backends and wrappers
- [Replication](https://db.claangel.site/llms-replication.txt): Sync engine, HTTP, GraphQL, WebSocket, CouchDB, Firestore, Supabase, WebRTC P2P`,
                excludeImports: false,
                removeDuplicateHeadings: true,
                generateMarkdownFiles: true,
                /**
                 * Order docs by logical sections matching the sidebar structure
                 * so that LLMs see foundational concepts first.
                 */
                includeOrder: [
                    // Getting Started
                    'overview.md',
                    'quickstart.md',
                    'install.md',
                    'dev-mode.md',
                    'docs/tutorials/typescript.md',
                    // Core Entities
                    'rx-database.md',
                    'rx-schema.md',
                    'rx-collection.md',
                    'rx-document.md',
                    'rx-query.md',
                    // Storages
                    'rx-storage.md',
                    'rx-storage-localstorage.md',
                    'rx-storage-indexeddb.md',
                    'rx-storage-opfs.md',
                    'rx-storage-memory.md',
                    'rx-storage-filesystem-node.md',
                    'rx-storage-filesystem-expo.md',
                    'rx-storage-sqlite.md',
                    'rx-storage-dexie.md',
                    'rx-storage-mongodb.md',
                    'rx-storage-denokv.md',
                    'rx-storage-foundationdb.md',
                    // Storage Wrappers
                    'schema-validation.md',
                    'encryption.md',
                    'key-compression.md',
                    'logger.md',
                    'rx-storage-remote.md',
                    'rx-storage-worker.md',
                    'rx-storage-shared-worker.md',
                    'rx-storage-memory-mapped.md',
                    'rx-storage-memory-synced.md',
                    'rx-storage-sharding.md',
                    'rx-storage-localstorage-meta-optimizer.md',
                    'electron.md',
                    // Replication
                    'replication.md',
                    'replication-http.md',
                    'replication-server.md',
                    'replication-graphql.md',
                    'replication-websocket.md',
                    'replication-couchdb.md',
                    'replication-webrtc.md',
                    'replication-firestore.md',
                    'replication-mongodb.md',
                    'replication-supabase.md',
                    'replication-google-drive.md',
                    'replication-microsoft-onedrive.md',
                    'replication-nats.md',
                    'replication-appwrite.md',
                    // Server
                    'rx-server.md',
                    'rx-server-scaling.md',
                    // How RxDB works
                    'transactions-conflicts-revisions.md',
                    'query-cache.md',
                    'plugins.md',
                    'errors.md',
                    // Advanced Features
                    'testing.md',
                    'migration-schema.md',
                    'migration-storage.md',
                    'rx-attachment.md',
                    'rx-pipeline.md',
                    'reactivity.md',
                    'rx-state.md',
                    'rx-local-document.md',
                    'cleanup.md',
                    'backup.md',
                    'leader-election.md',
                    'middleware.md',
                    'crdt.md',
                    'population.md',
                    'orm.md',
                    'fulltext-search.md',
                    'query-optimizer.md',
                    'webmcp.md',
                    'dbviewer.md',
                    'third-party-plugins.md',
                    // Performance
                    'rx-storage-performance.md',
                    'nosql-performance-tips.md',
                    'slow-indexeddb.md',
                ],
                includeUnmatchedLast: true,
                pathTransformation: {
                    ignorePaths: ['docs'],
                },
                customLLMFiles: [
                    {
                        filename: 'llms-api.txt',
                        includePatterns: [
                            'overview.md',
                            'quickstart.md',
                            'install.md',
                            'rx-database.md',
                            'rx-schema.md',
                            'rx-collection.md',
                            'rx-document.md',
                            'rx-query.md',
                            'rx-attachment.md',
                            'rx-local-document.md',
                            'rx-state.md',
                            'rx-pipeline.md',
                            'rx-storage.md',
                            'docs/tutorials/typescript.md',
                        ],
                        fullContent: true,
                        title: 'CLA DB Core API Documentation (RxDB API)',
                        description: 'Reference for the core RxDB API: RxDatabase, RxSchema, RxCollection, RxDocument, RxQuery, and related entities.',
                    },
                    {
                        filename: 'llms-storages.txt',
                        includePatterns: [
                            'rx-storage.md',
                            'rx-storage-*.md',
                            'schema-validation.md',
                            'encryption.md',
                            'key-compression.md',
                            'logger.md',
                            'electron.md',
                        ],
                        fullContent: true,
                        title: 'CLA DB Storage Documentation (RxDB RxStorage API)',
                        description: 'Complete reference for the RxDB RxStorage layer, all storage backends (LocalStorage, IndexedDB, OPFS, SQLite, Memory, Dexie.js, MongoDB, FoundationDB, DenoKV) and storage wrappers (encryption, compression, sharding, workers).',
                    },
                    {
                        filename: 'llms-replication.txt',
                        includePatterns: [
                            'replication.md',
                            'replication-*.md',
                        ],
                        fullContent: true,
                        title: 'CLA DB Replication Documentation (RxDB Sync Engine API)',
                        description: 'Complete reference for RxDB replication and data sync: HTTP, GraphQL, WebSocket, CouchDB, Firestore, Supabase, WebRTC P2P, and more.',
                    },
                ],
            },
        ],
        function myWebpackTweaks() {
            return {
                name: 'custom-webpack-tweaks',
                configureWebpack(webpackConfig, _isServer, _utils) {
                    /**
                     * Docusaurus merges all CSS into a single render-blocking
                     * styles.css, including the CSS of lazy loaded chunks.
                     * Stylesheets imported with the ?lazy-css query are excluded
                     * from that and emitted as their own hashed file instead.
                     * The import returns the URL of that file so the code can
                     * load it with loadStylesheet() when it is needed.
                     */
                    webpackConfig.module.rules.forEach((rule: any) => {
                        if (rule && rule.test instanceof RegExp && rule.test.test('x.css')) {
                            rule.resourceQuery = { not: LAZY_CSS_QUERY };
                        }
                    });
                    return {
                        // Emit source maps in the production build so tools like
                        // Lighthouse can map the minified bundle back to the source
                        // and give more detailed optimization tips.
                        devtool: 'source-map',
                        resolve: {
                            alias: {
                                // we no longer use prism, and highlight with Shiki on the server
                                // alias the built-in prism-react-renderer with empty stub to reduce bundle size
                                'prism-react-renderer': require.resolve('./src/prism-stub'),
                            },
                        },
                        module: {
                            /**
                             * Disable file hashing of fonts so we can
                             * use html-preload on them.
                             */
                            rules: [
                                {
                                    test: /\.css$/i,
                                    resourceQuery: LAZY_CSS_QUERY,
                                    type: 'asset/resource',
                                    generator: {
                                        filename: 'assets/css/[name].[contenthash:8][ext]',
                                    },
                                },
                                {
                                    test: /\.(woff(2)?|ttf|eot|otf)$/,
                                    type: 'asset/resource',
                                    generator: {
                                        // Remove hash from font filenames
                                        filename: 'static/fonts/[name][ext]',
                                    },
                                },
                            ],
                        },
                    };
                },
            };
        },
    ],
    scripts: [
        /*
         * Pipedrive embedded chat.
         * Disabled because people should fill out the premium form
         * and ask questions there so that we have more meta info.
         */
        // {
        //   src: 'https://leadbooster-chat.pipedrive.com/assets/loader.js',
        //   type: 'text/javascript',
        //   async: true
        // }
    ],

    presets: [
        [
            'classic',
            /** @type {import('@docusaurus/preset-classic').Options} */
            {
                /**
                 * Analytics is not loaded through the preset because the preset
                 * injects the script directly into the head. gtag.js is loaded
                 * by src/theme/Root.tsx after the consent, on the first interaction
                 * or 3 seconds after the page load.
                 */
                sitemap: {
                    lastmod: 'date',
                    changefreq: 'weekly',
                    priority: 0.5,
                    filename: 'sitemap.xml',
                },
                docs: {
                    sidebarPath: './sidebars.js',
                    routeBasePath: '',
                    path: './docs',
                    showLastUpdateTime: true,
                    breadcrumbs: false,
                    remarkPlugins: [remarkArticleByline],
                    // I disabled the editUrl because it just confuses users and does not look professional
                    // editUrl: 'https://github.com/pubkey/rxdb/tree/master/docs-src/',
                    beforeDefaultRehypePlugins: [
                        [rehypePrettyCode, rehypePrettyCodeOptions],
                    ],
                },
                /**
                 * The docs have no blog. Without this, the preset
                 * generates an empty /blog/ page.
                 */
                blog: false,
                theme: {
                    customCss: './src/css/custom.css',
                },
            },
        ],
    ],

    themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    {
        // Replace with your project's social card
        // CLA-DB: no default og:image yet; a CLA DB social card is pending.
        metadata: [
            { name: 'keywords', content: 'CLA DB, RxDB, JavaScript database, local-first, offline-first, reactive database, NoSQL, real-time sync, browser database, IndexedDB, TypeScript' },
            { property: 'og:type', content: 'website' },
        ],
        colorMode: {
            defaultMode: 'dark',
            disableSwitch: true,
            respectPrefersColorScheme: false,
        },
        navbar: {
            // CLA-DB: rebranded navbar. The RxDB logo and the commercial
            // items (Pricing, Support, Discord) were removed; the fork has
            // no premium offering and no own community chat yet.
            title: 'CLA DB',
            logo: {
                alt: 'CLA DB',
                src: 'files/logo/cla-db-mark.svg',
                width: 26,
                height: 26,
            },
            items: [
                {
                    href: '/overview.html',
                    label: 'Docs',
                    position: 'left'
                },
                {
                    href: '/replication.html',
                    label: 'Sync',
                    position: 'left',
                    dropdown: 'sync'
                },
                {
                    href: '/rx-storage.html',
                    label: 'Storages',
                    position: 'left',
                    dropdown: 'storages'
                },
                {
                    href: 'https://github.com/AngelCLA/cla-db',
                    target: '_blank',
                    label: 'GitHub',
                    position: 'right',
                },
                {
                    href: 'https://www.npmjs.com/package/@clatech/db',
                    target: '_blank',
                    label: 'npm',
                    position: 'right',
                },
            ],
        },
        // CLA-DB: the RxDB Algolia DocSearch index was removed. The swizzled
        // src/theme/SearchBar override was deleted with it, so the site has
        // no search until an own index exists.
        footer: {
            style: 'dark',
            links: [],
            copyright: ' ',
        },
    },
};

export default config;

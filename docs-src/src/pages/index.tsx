import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import React from 'react';
import { HOME_TITLE } from '../constants';

// CLA-DB: the RxDB marketing homepage (hero animation, reviews, premium and
// social proof sections) was replaced with a minimal CLA DB home that routes
// to the documentation and the fork repository. The upstream homepage lives
// in git history and returns with the next upstream sync.

const repoUrl = 'https://github.com/AngelCLA/cla-db';
const npmUrl = 'https://www.npmjs.com/package/@clatech/db';
const upstreamUrl = 'https://rxdb.info';

export default function Home() {
    return (
        <Layout
            title={HOME_TITLE}
            description={'CLA DB is a minimal Apache 2.0 fork of RxDB: a local-first, reactive NoSQL database for JavaScript applications with offline support and explicit replication.'}
        >
            <Head>
                <link rel="canonical" href="https://db.claangel.site/" />
            </Head>
            <main>
                <div className="block dark" style={{ paddingTop: 80, paddingBottom: 80 }}>
                    <div className="content centered" style={{ textAlign: 'center' }}>
                        <img
                            src="/files/logo/cla-db-mark.svg"
                            alt="CLA DB"
                            width={80}
                            height={80}
                            style={{ marginBottom: 20 }}
                        />
                        <h1 style={{ fontSize: '3rem', marginBottom: 16 }}>
                            CLA <b>DB</b>
                        </h1>
                        <p style={{ fontSize: '1.2rem', maxWidth: 720, margin: '0 auto 12px' }}>
                            A minimal <b>Apache 2.0 fork</b> of <a href={upstreamUrl} target="_blank" rel="noopener">RxDB</a>,
                            the reactive, local-first NoSQL database for JavaScript.
                        </p>
                        <p style={{ maxWidth: 720, margin: '0 auto 32px' }}>
                            The fork preserves RxDB public interfaces and storage compatibility version 17.6.0
                            while removing the artificial 13-collection cap. These pages are inherited API
                            reference, including experimental integrations and Premium features not included in CLA DB.
                            See the <a href={`${repoUrl}/blob/master/README.md`}>consumer README and evidence</a> for tested boundaries.
                        </p>
                        <p>
                            <code>npm install @clatech/db rxjs</code> installs published 0.1.1.
                            Version 0.1.2 is an unpublished candidate tarball preview, not a certified release.
                        </p>
                        <div className="buttons" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <a className="button button--primary button--lg" href="/overview.html">
                                Read the docs
                            </a>
                            <a className="button button--secondary button--lg" href={repoUrl} target="_blank" rel="noopener">
                                GitHub repository
                            </a>
                            <a className="button button--secondary button--lg" href={npmUrl} target="_blank" rel="noopener">
                                npm package
                            </a>
                        </div>
                    </div>
                </div>
                <div className="block">
                    <div className="content centered" style={{ textAlign: 'center', paddingBottom: 60 }}>
                        <p>
                            The documentation inherits the complete RxDB documentation: quickstart,
                            storages, replication and migrations. Questions that concern the upstream
                            project are answered by the <a href={upstreamUrl} target="_blank" rel="noopener">upstream documentation</a>.
                            This site is not affiliated with rxdb.info.
                        </p>
                    </div>
                </div>
            </main>
        </Layout>
    );
}

import Layout from '@theme/Layout';
import React from 'react';

// CLA-DB: the /code/ route now redirects to the CLA DB repository instead of
// the upstream RxDB repository. The tracking event of the upstream page was
// removed together with the tracking stack.

const repoUrl = 'https://github.com/AngelCLA/cla-db';

export default function Home() {
    return (
        <Layout
            title={'Code'}
            description="CLA DB Source Code"
        >
            <main>
                <div className='redirectBox' style={{ textAlign: 'center' }}>
                    <a href="/">
                        <div className="logo">
                            <img src="/files/logo/cla-db-mark.svg" alt="CLA DB" width={80} />
                        </div>
                    </a>
                    <h1>CLA DB Code</h1>
                    <p>
                        <b>You will be redirected in a few seconds.</b>
                    </p>
                    <p>
                        <a href={repoUrl}>Click here to open Code</a>
                    </p>
                    <meta httpEquiv="Refresh" content="1; url=https://github.com/AngelCLA/cla-db" />
                </div>
            </main>
        </Layout >
    );
}

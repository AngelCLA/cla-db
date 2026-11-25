import React from 'react';
import clsx from 'clsx';
import Translate from '@docusaurus/Translate';
import Heading from '@theme/Heading';
// CLA-DB: replaced the RxDB GlitchLogo animation with the CLA DB mark and
// removed the SearchBar, which was deleted together with the Algolia config.
export default function NotFoundContent({ className }) {
  return (
    <main className={clsx('container margin-vert--xl', className)}>
      <div className="row">
        <div className="col col--6 col--offset-3">
          <Heading as="h1" className="hero__title">
            <a href="/">
              <div style={{ textAlign: 'center' }}>
                <img src="/files/logo/cla-db-mark.svg" alt="CLA DB" width={60} height={60} />
              </div>
            </a>
            <Translate
              id="theme.NotFound.title"
              description="The title of the 404 page">
              404 Page Not Found
            </Translate>
          </Heading>
          <p>
            <Translate
              id="theme.NotFound.p1"
              description="The first paragraph of the 404 page">
              The page you are looking for does not exist anymore or never has existed.
              If you have found this page through a link, you should tell the link author to update it.
            </Translate>
          </p>

          <p>Maybe one of these can help you to find the desired content:</p>
          <div className="ul-container">
            <ul>
              <li>
                <a href="/overview.html">CLA DB Documentation</a>
              </li>
              <li>
                <a href="https://github.com/AngelCLA/cla-db">CLA DB at GitHub</a>
              </li>
              <li>
                <a href="https://www.npmjs.com/package/@clatech/db">CLA DB on npm</a>
              </li>
              <li>
                <a href="https://rxdb.info/overview.html">RxDB upstream documentation</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}

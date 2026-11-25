import React from 'react';

// CLA-DB: rebranded footer for the CLA DB fork. The RxDB premium/support,
// newsletter and social links were removed; only destinations that exist for
// the fork remain. The inherited RxDB documentation stays linked as upstream.

export default function FooterWrapper() {

  const footerConfig = {
    navLinks: [
      {
        label: 'Docs',
        href: '/overview.html'
      },
      {
        href: '/replication.html',
        label: 'Sync',
      },
      {
        href: '/rx-storage.html',
        label: 'Storages',
      },
      {
        label: 'GitHub',
        target: '_blank',
        href: 'https://github.com/AngelCLA/cla-db',
      },
      {
        label: 'npm',
        target: '_blank',
        href: 'https://www.npmjs.com/package/@clatech/db',
      }
    ],
    communityLinks: [
      {
        label: 'GitHub',
        target: '_blank',
        href: 'https://github.com/AngelCLA/cla-db',
        logo: <span className="navbar-icon-github" style={{ width: 22, height: 22, display: 'inline-block' }}></span>
      },
    ],
    policyLinks: [
      {
        label: 'License',
        target: '_blank',
        href: 'https://github.com/AngelCLA/cla-db/blob/master/LICENSE.txt',
      },
      {
        label: 'llms.txt',
        target: '_blank',
        href: '/llms.txt',
      },
    ],
  };

  return (
    <>
      <>

        <div className='block footer dark'>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 44
          }} className='content'>
            <div className="half left">
              <span>
                <a
                  variant="text"
                  href="/"
                  className="footer-logo-button"
                  aria-label="CLA DB"
                >
                  <img src="/files/logo/cla-db-mark.svg" alt="CLA DB" loading="lazy" width="32" height="32" className='width-140-120' />
                  <b style={{ marginLeft: 10 }}>CLA DB</b>
                </a>
                <div className="footer-community-links">
                  {footerConfig.communityLinks.map((link, index) => (
                    <a
                      key={link.href + index}
                      variant="text"
                      href={link.href}
                      target={link.target ? '_blank' : ''}
                      aria-label={link.label}
                    >
                      {typeof link.logo === 'string' ? (
                        <img
                          src={link.logo}
                          alt={link.label}
                          width="24"
                          height="22"
                          loading="lazy"
                        />
                      ) : (
                        link.logo
                      )}
                    </a>
                  ))}
                </div>
              </span>

            </div>
            <div className="half right" style={{
              display: 'flex',
              flex: 1
            }}>
              <div style={{
                display: 'flex'
              }}>
                <div className="footer-links min-width-180-135">
                  {footerConfig.navLinks.map((link, index) => (
                    <a
                      variant="text"
                      href={link.href}
                      target={link.target ? '_blank' : ''}
                      key={link.href + index}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>

                <div className="footer-links min-width-180-135">
                  {footerConfig.policyLinks.map((link, index) => (
                    <a
                      variant="text"
                      href={link.href}
                      key={link.href + index}
                      target={link.target ? '_blank' : ''}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
      <div
        className='navbar-line'
        style={{
          display: 'block',
          zIndex: 10,
          height: 1.5,
          backgroundColor: 'var(--color-top)',
          borderTopRightRadius: 2,
          borderBottomRightRadius: 2,
          width: '100%'
        }}
      ></div>
    </>
  );
}

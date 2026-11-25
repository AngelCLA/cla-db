import React from 'react';

/**
 * CLA-DB: the RxDB tracking stack was removed for the CLA DB fork. The
 * upstream implementation loads Google Analytics 4, an EU consent banner, a
 * tracker suite and a marketing call-to-action popup; none of that belongs on
 * the fork's documentation site. The original code lives in git history and
 * returns with the next upstream sync if the fork decides to use trackers of
 * its own.
 */
export default function Root({ children }) {
    return <>{children}</>;
}

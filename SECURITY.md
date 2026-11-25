# Security Policy

Report suspected vulnerabilities privately before sharing exploit details publicly.

## Private Reporting

Use [GitHub private vulnerability reporting](https://github.com/AngelCLA/cla-db/security/advisories/new) when available for this repository. Include the affected CLA DB version, runtime, storage or plugin, impact, and a minimal reproduction without credentials or personal data.

If GitHub does not offer that form, contact the repository maintainer through the [official repository](https://github.com/AngelCLA/cla-db). A public issue may request a private reporting channel, but must not include vulnerability details. No separate security email or response deadline is promised. Private reporting availability and access controls depend on repository settings, not this file.

## Supported Versions

Security fixes target the latest published CLA DB release. Older releases have no separate maintained security branch or guaranteed backports. Version `0.1.2` is a candidate until publication; do not infer support from a branch name. Check [npm](https://www.npmjs.com/package/@clatech/db) for the published version.

The package declares Node.js `>=20`. This is not a claim that every compatible Node version has been tested or remains supported by Node.js itself. Prefer a maintained Node LTS version. See the [dependency evidence](release/0.1.2/DEPENDENCIES.md) for tested versions, known development vulnerabilities, and coverage gaps.

## Scope And Disclosure

Include explicitly configured integrations and inherited tooling when reporting issues. Do not send live keys or customer databases. Maintainers can assess remediation and coordinate disclosure with the reporter; there is no guaranteed response time, fix date, bounty, or embargo duration. CLA DB is an independent Apache-2.0 fork of RxDB, not an RxDB Premium distribution.

// Package entrypoint. n8n itself loads the node and credential from the `n8n`
// field in package.json (dist paths), not from this module — but a resolvable
// `main` keeps `require('@chronary/n8n-nodes-chronary')` working for tooling
// and tests that import the package root.
export { Chronary } from './nodes/Chronary/Chronary.node';
export { ChronaryApi } from './credentials/ChronaryApi.credentials';

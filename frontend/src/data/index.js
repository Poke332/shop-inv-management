/**
 * Public re-export surface for the app: `import { mockApi } from '@/data'`
 * (the @/ alias → frontend/src, per docs/ARCHITECTURE §folder structure).
 *
 * Everything else (the seed records, the shared store, the section modules, the
 * per-section `failure` flags) is importable directly from its module — the
 * app code only ever needs the facade.
 */

export { mockApi } from './mockApi.js';

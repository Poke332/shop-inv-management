// Facade alias: the http client is re-exported under the `mockApi` symbol — the 21 consumer import sites read that name, so the facade stays the single import surface.
export { httpApi as mockApi } from './httpApi.js'


export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 6961, hash: 'b09d563a1d240daca03eb17f139238f1ecffb7687e9434895d5d9ea95eed7134', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 6245, hash: 'd144472e80130bd40359032e4ef77fafb047a852452a2ce7fb91437416ae9f85', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 36012, hash: '68fda5f5a0960c4a0bbcbb25c62df5f1eb63ea2d8cb9728c6d85070f58b514be', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-3WPJQLRD.css': {size: 1884, hash: 'TIV8cpKbBCs', text: () => import('./assets-chunks/styles-3WPJQLRD_css.mjs').then(m => m.default)}
  },
};

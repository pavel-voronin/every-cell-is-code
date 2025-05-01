import { defineConfig } from 'vite';
import { version, preloadChunks } from './package.json';
import fs from 'fs';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  appType: 'mpa',
  server: {
    allowedHosts: true,
  },
  plugins: [
    {
      name: 'inject-version',
      transformIndexHtml(html) {
        return html.replace(/%APP_VERSION%/g, version);
      },
    },
    {
      name: 'inject-preload-chunks',
      enforce: 'post',
      async transform(code, id) {
        if (!id.endsWith('/app.ts')) return;

        if (!preloadChunks || !preloadChunks.length) return;

        const chunkCalls = preloadChunks
          .map((coords) => {
            const chunkPath = `./src/public/meta/chunk_${coords[0]}_${coords[1]}.json`;
            const blocks = JSON.parse(fs.readFileSync(chunkPath, 'utf-8'));
            return `this.metaStore.loadChunkData([${coords.join(',')}], ${JSON.stringify(blocks, null, 2)});`;
          })
          .filter(Boolean)
          .join('\n');

        return code.replace(`"__PRELOAD_CHUNKS__";`, chunkCalls);
      },
    },
  ],
});

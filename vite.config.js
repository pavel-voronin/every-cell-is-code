import { defineConfig } from 'vite';
import { version } from './package.json';

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
  ],
});

import { coverageConfigDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      include: ['src/**'],
      exclude: ['src/public/**', ...coverageConfigDefaults.exclude],
    },
  },
});

import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setupTests.ts'],
    globals: true,
    coverage: {
      reporter: ['text', 'lcov'],
    },
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
  },
});

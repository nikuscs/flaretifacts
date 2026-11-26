import { fileURLToPath } from 'node:url';
import Icons from 'unplugin-icons/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [Icons({ compiler: 'jsx', jsx: 'react' })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
      'cloudflare:workers': fileURLToPath(new URL('tests/support/cloudflare-workers.ts', import.meta.url)),
      '@cf-wasm/og/workerd': fileURLToPath(new URL('tests/support/cf-wasm-og.ts', import.meta.url)),
      'vinext/server/fetch-handler': fileURLToPath(new URL('tests/support/vinext-fetch-handler.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/support/setup.ts'],
    clearMocks: true,
    restoreMocks: true,
  },
});

import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import Icons from 'unplugin-icons/vite';
import vinext from 'vinext';
import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    // Pre-bundling gives the browser a second copy of the package, and its hooks then fail with
    // "No QueryClient set".
    exclude: ['@tanstack/react-query'],
  },
  environments: {
    rsc: { optimizeDeps: { exclude: ['@cf-wasm/og', '@cf-wasm/resvg', '@cf-wasm/satori'] } },
    ssr: { optimizeDeps: { exclude: ['@cf-wasm/og', '@cf-wasm/resvg', '@cf-wasm/satori'] } },
  },
  server: {
    // Vite rejects unknown Host headers with a 403; add your own hostname here to reach dev through a tunnel.
    allowedHosts: ['.localhost', 'localhost'],
  },
  plugins: [
    Icons({
      compiler: 'jsx',
      jsx: 'react',
      iconCustomizer: (_collection, _icon, props) => {
        props.width = '24';
        props.height = '24';
        props['aria-hidden'] = 'true';
      },
    }),
    tailwindcss(),
    vinext(),
    cloudflare({
      viteEnvironment: {
        name: 'rsc',
        childEnvironments: ['ssr'],
      },
    }),
  ],
});

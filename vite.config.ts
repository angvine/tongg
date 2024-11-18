import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react';
import mkcert from 'vite-plugin-mkcert';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    // Allows using React dev server along with building a React application with Vite.
    // https://npmjs.com/package/@vitejs/plugin-react-swc
    react(),
    // Allows using the compilerOptions.paths property in tsconfig.json.
    // https://www.npmjs.com/package/vite-tsconfig-paths
    tsconfigPaths(),
    // Create a custom SSL certificate valid for the local machine.
    // https://www.npmjs.com/package/vite-plugin-mkcert
    mkcert(),
  ],
  publicDir: './public',
  server: {
    // Exposes your dev server and makes it accessible for the devices in the same network.
    host: true, // Listen on all addresses
    port: 8080, // Default HTTP port
    https: true, // Enable HTTPS
    proxy: {
      '/socket.io': {
        target: 'wss://games.ton.gg',
        ws: true,
        secure: false
      }
    },
    hmr: {
      protocol: 'wss',
      host: 'localhost',
      port: 8080
    }
  },
});

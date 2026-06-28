import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  publicDir: 'public',
  server: {
    proxy: {
      // Proxy all non-API requests to backend for hosted apps
      '/': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // Don't proxy API requests
        bypass: (req) => {
          // Don't proxy API requests, uploads, or static assets
          if (req.url?.startsWith('/api') || 
              req.url?.startsWith('/uploads') ||
              req.url?.startsWith('/favicon') ||
              req.url?.includes('.png') ||
              req.url?.includes('.jpg') ||
              req.url?.includes('.jpeg') ||
              req.url?.includes('.svg') ||
              req.url?.includes('.ico')) {
            return null;
          }
          // Proxy app requests to backend
          return req.url;
        },
      },
    },
  },
  resolve: {
    alias: {
      process: "process/browser",
      stream: "stream-browserify",
      zlib: "browserify-zlib",
      util: "util",
      events: "events",
    },
  },
  optimizeDeps: {
    include: ['util', 'events', 'stream-browserify', 'process', 'browserify-zlib'],
  },
  define: {
    global: 'window',
    'process.env': {},
  },
})

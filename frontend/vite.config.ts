import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://acpn-ota-zone.onrender.com',
        changeOrigin: true,
        secure: true,
        timeout: 120000, // 2 minutes timeout for file uploads
        proxyTimeout: 120000, // 2 minutes timeout for proxy
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, _res) => {
            console.log('Proxy error with request:', req.method, req.url, err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to Target:', req.method, req.url);
            // Log important headers for debugging upload issues
            if (req.url?.includes('/payments/submit')) {
              console.log('Upload headers:', {
                'content-type': req.headers['content-type'],
                'content-length': req.headers['content-length'],
                'x-requested-with': req.headers['x-requested-with'],
              });
            }
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log(
              'Received Response from Target:',
              proxyRes.statusCode,
              req.method,
              req.url
            );

            // Add detailed logging for file upload responses
            if (req.url?.includes('/payments/submit')) {
              const statusCode = proxyRes.statusCode;
              if (statusCode >= 400) {
                console.error(`Upload error ${statusCode} for ${req.url}`, {
                  headers: proxyRes.headers,
                  statusMessage: proxyRes.statusMessage,
                });
              } else {
                console.log(`Upload success ${statusCode} for ${req.url}`);
              }
            }
          });
        },
      },
    },
  },
});

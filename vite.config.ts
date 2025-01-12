import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// Load .env file
dotenv.config();

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'manifest-env',
      writeBundle: {
        async handler() {
          const manifest = JSON.parse(
            fs.readFileSync('./public/manifest.json', 'utf-8')
          );
          manifest.oauth2.client_id = process.env.VITE_GOOGLE_CLIENT_ID;
          
          fs.writeFileSync(
            'dist/manifest.json',
            JSON.stringify(manifest, null, 2)
          );
        }
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/pages/Popup/index.tsx'),
        background: resolve(__dirname, 'src/background.ts')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  },
  publicDir: 'public'
}); 
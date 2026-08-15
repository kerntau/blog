import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [pluginReact()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  source: {
    entry: {
      index: './src/main.tsx',
    },
  },
  html: {
    template: './index.html',
    title: 'Chirpy',
    meta: {
      viewport: 'width=device-width, initial-scale=1, shrink-to-fit=no',
      description: 'A minimal, responsive and feature-rich Jekyll theme for technical writing.',
    },
    favicon: './assets/img/favicons/favicon.ico',
  },
  server: {
    port: 3000,
    open: false,
    historyApiFallback: true,
  },
  output: {
    distPath: {
      root: 'dist',
    },
    assetPrefix: '/',
  },
});

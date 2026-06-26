import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/orbit-janitor/' : '/',
  server: {
    host: '127.0.0.1'
  }
}));

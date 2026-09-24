import { execSync } from 'node:child_process';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import basicSsl from '@vitejs/plugin-basic-ssl';
import type { PluginOption } from 'vite';
import { defineConfig } from 'vitest/config';

let appVersion = 'dev';
try {
  appVersion = execSync('git describe --tags --always --dirty', { encoding: 'utf8' }).trim();
} catch {
  // Git not available or not in a repo
}

const plugins: PluginOption[] = [svelte()];
if (process.env.HTTPS === 'true') {
  plugins.push(basicSsl());
}

// https://vite.dev/config/
export default defineConfig({
  plugins,
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  test: {
    environment: 'node',
  },
});

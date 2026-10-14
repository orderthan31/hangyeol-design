import assert from 'node:assert/strict';
import test from 'node:test';
import {validateViteConfig} from '../src/tools/host-config.mjs';

const settings = {basePath: '/', publicRoot: 'public', sourceRoot: 'src/hangyeol', alias: null};
export const dynamic = `import {defineConfig, loadEnv} from 'vite';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', 'VITE_');
  return {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: (env.VITE_ALLOWED_HOSTS || '').split(',').map((host) => host.trim()).filter(Boolean),
      proxy: {'/api': env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000'},
    },
  };
});
`;

test('existing mode/loadEnv proxy and allowedHosts are supported without evaluating the config', () => {
  assert.doesNotThrow(() => validateViteConfig(dynamic, settings));
});
test('renamed imports and callback locals retain binding-aware validation', () => {
  const renamed = dynamic.replace('defineConfig, loadEnv', 'defineConfig as define, loadEnv as readEnv')
    .replace('export default defineConfig', 'export default define')
    .replace('({mode})', '({mode: activeMode})')
    .replace('const env = loadEnv(mode', 'const values = readEnv(activeMode')
    .replaceAll('env.VITE_', 'values.VITE_');
  assert.doesNotThrow(() => validateViteConfig(renamed, settings));
});
test('dynamic host still requires the actual Tailwind plugin and matching static paths/aliases', () => {
  assert.throws(() => validateViteConfig(dynamic.replace('plugins: [tailwindcss()],', ''), settings), /Tailwind|plugins/);
  assert.throws(() => validateViteConfig(dynamic.replace('plugins:', "base: '/other/', plugins:"), settings), /base conflicts/);
  assert.throws(() => validateViteConfig(dynamic.replace('plugins:', "publicDir: 'other', plugins:"), settings), /publicDir conflicts/);
  assert.throws(() => validateViteConfig(dynamic, {...settings, alias: '@hangyeol'}), /alias/);
});
test('no broad callback, expression, import or side-effect execution escape is opened', () => {
  const bad = [
    dynamic.replace('const env =', "globalThis.__hangyeolHostExecuted = true; const env ="),
    dynamic.replace('const env =', "require('fs').writeFileSync('executed', 'bad'); const env ="),
    dynamic.replace('const env =', "const extra = process.env; const env ="),
    dynamic.replace('({mode}) =>', 'async ({mode}) =>'),
    dynamic.replace('({mode}) =>', '({mode, command}) =>'),
    dynamic.replace("loadEnv(mode, '.', 'VITE_')", "loadEnv(mode, process.cwd(), '')"),
    dynamic.replace("loadEnv(mode, '.', 'VITE_')", "loadEnv(mode, '.', '')"),
    dynamic.replace("loadEnv(mode, '.', 'VITE_')", "loadEnv(mode, '../secrets', 'VITE_')"),
    dynamic.replace('env.VITE_API_PROXY_TARGET', 'process.env.SECRET'),
    dynamic.replace('host.trim()', '(globalThis.__hangyeolHostExecuted = true)'),
    dynamic.replace('.filter(Boolean)', '.filter(eval)'),
    dynamic.replace("plugins:", "base: env.VITE_BASE || '/', plugins:"),
    dynamic.replace("plugins:", "publicDir: env.VITE_PUBLIC || 'public', plugins:"),
    dynamic.replace("plugins:", 'build: {copyPublicDir: false}, plugins:'),
    dynamic.replace("plugins:", 'build: {write: false}, plugins:'),
    dynamic.replace("plugins:", '...process.env, plugins:'),
    dynamic.replace("plugins:", 'get base() {return "/";}, plugins:'),
    dynamic.replace('const env =', 'let env ='),
    dynamic.replace('return {', 'if (mode) return {}; return {'),
    dynamic.replace('host.trim()', 'host.toLowerCase()'),
    dynamic.replace(".split(',')", ".split('/')"),
    dynamic.replace('env.VITE_ALLOWED_HOSTS', 'env.constructor'),
    dynamic.replace("server: {", "server: {fs: {allow: env.VITE_ROOT || '/'},"),
    dynamic.replace("export default", "import other from './custom.mjs'; export default"),
    dynamic.replace('tailwindcss()', 'tailwindcss({optimize:true})'),
    dynamic.replace('const env =', 'const loadEnv = () => ({}); const env ='),
  ];
  delete globalThis.__hangyeolHostExecuted;
  for (const text of bad) assert.throws(() => validateViteConfig(text, settings), /Unsupported|conflicts|preserve|outside|unreviewed/);
  assert.equal(globalThis.__hangyeolHostExecuted, undefined);
});
test('proxy target objects, literal server options and nullish environment fallback remain bounded', () => {
  const text = dynamic.replace("proxy: {'/api': env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000'}",
    "port: 5173, host: '127.0.0.1', proxy: {'/api': {target: env.VITE_API_PROXY_TARGET ?? 'http://127.0.0.1:8000', changeOrigin: true}}");
  assert.doesNotThrow(() => validateViteConfig(text, settings));
});

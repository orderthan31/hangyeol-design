import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const name = '@orderthan31/hangyeol-core';
export const version = '0.0.1';
const registry = 'https://npm.pkg.github.com';
const repository = 'orderthan31/hangyeol-design';
const readJSON = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

export function validateContext(env) {
  assert.equal(env.GITHUB_ACTIONS, 'true', 'Actions only');
  assert.equal(env.GITHUB_EVENT_NAME, 'workflow_dispatch');
  assert.equal(env.GITHUB_REPOSITORY, repository);
  assert.equal(env.GITHUB_REF, 'refs/heads/main');
  assert.equal(env.GITHUB_JOB, 'verify');
  assert.equal(env.GITHUB_WORKFLOW_REF, `${repository}/.github/workflows/publish-core.yml@refs/heads/main`);
  assert.match(env.GITHUB_SHA || '', /^[a-f0-9]{40}$/);
  assert.ok(env.NODE_AUTH_TOKEN, 'read token required');
  for (const key of ['RUNNER_TEMP', 'GITHUB_WORKSPACE']) {
    assert.ok(env[key] && path.isAbsolute(env[key]), `${key} must be absolute`);
    assert.equal(path.resolve(env[key]), env[key], `${key} must be normalized`);
    assert.equal(fs.realpathSync(env[key]), env[key], `${key} must not use symlinks`);
  }
  assert.ok(!env.RUNNER_TEMP.startsWith(env.GITHUB_WORKSPACE + path.sep) && env.RUNNER_TEMP !== env.GITHUB_WORKSPACE, 'consumer must be outside checkout');
}

export function safeFile(root, relative) {
  assert.ok(typeof relative === 'string' && relative && !relative.includes('\\') && !path.isAbsolute(relative));
  assert.ok(relative.split('/').every(part => part && part !== '.' && part !== '..'), 'unsafe manifest path');
  const target = path.join(root, relative);
  assert.equal(fs.realpathSync(target), target, 'symlink in proof input');
  assert.ok(fs.statSync(target).isFile());
  return target;
}

export function validateRegistryMetadata(metadata, installed, lock) {
  for (const pkg of [metadata, installed]) {
    assert.equal(pkg.name, name); assert.equal(pkg.version, version);
    assert.equal(pkg.license, 'UNLICENSED');
    assert.equal(pkg.repository?.url?.replace(/^git\+/, ''), `https://github.com/${repository}.git`);
    assert.equal(pkg.repository?.directory, 'packages/core');
  }
  assert.equal(installed.private, false);
  assert.equal(installed.bin?.hangyeol, 'bin/hangyeol.mjs');
  assert.equal(lock.version, version); assert.ok(!lock.link);
  assert.match(metadata.dist?.integrity || '', /^sha512-[A-Za-z0-9+/]+={0,2}$/);
  assert.match(metadata.dist?.shasum || '', /^[a-f0-9]{40}$/);
  assert.equal(lock.integrity, metadata.dist.integrity);
  assert.equal(lock.resolved, metadata.dist.tarball);
  const url = new URL(lock.resolved);
  assert.equal(url.origin, registry); assert.ok(!url.username && !url.password && !url.search && !url.hash);
}

export function verifyShippedFiles(installed, checkout) {
  const payload = readJSON(path.join(installed, 'payload/manifest.json'));
  const tools = readJSON(path.join(installed, 'dist/tool-manifest.json'));
  for (const manifest of [payload, tools]) {
    assert.equal(manifest.package, name); assert.equal(manifest.version, version);
  }
  assert.equal(Object.keys(payload.files).length, 103);
  for (const [relative, record] of Object.entries(payload.files)) {
    const shipped = fs.readFileSync(safeFile(installed, `payload/source/${relative}`));
    assert.equal(hash(shipped), record.hash); assert.equal(shipped.length, record.bytes);
    assert.deepEqual(shipped, fs.readFileSync(safeFile(checkout, `packages/core/src/ui/${relative}`)));
  }
  for (const [relative, record] of Object.entries(tools.files)) {
    const shipped = fs.readFileSync(safeFile(installed, relative));
    assert.equal(hash(shipped), record.hash); assert.equal(shipped.length, record.bytes);
    if (record.source.startsWith('packages/') || record.source.startsWith('scripts/')) {
      assert.deepEqual(shipped, fs.readFileSync(safeFile(checkout, record.source)));
    }
  }
  for (const relative of ['README.md', 'publication-readiness.json', 'publish-guard.mjs', 'LICENSE', 'THIRD_PARTY_NOTICES.md']) {
    assert.deepEqual(fs.readFileSync(safeFile(installed, relative)), fs.readFileSync(safeFile(checkout, `packages/core/${relative}`)));
  }
  return {sourceCount: Object.keys(payload.files).length, toolCount: Object.keys(tools.files).length};
}

export function scaffold(consumer, checkout) {
  fs.mkdirSync(path.join(consumer, 'src'), {recursive: true});
  fs.writeFileSync(path.join(consumer, 'package.json'), JSON.stringify({
    name: 'hangyeol-registry-consumer', version: '1.0.0', private: true, type: 'module',
    dependencies: {react: '19.2.0', 'react-dom': '19.2.0', clsx: '2.1.1', 'tailwind-merge': '3.7.0'},
    devDependencies: {[name]: version, typescript: '5.9.3', vite: '7.3.6', tailwindcss: '4.3.3', '@tailwindcss/vite': '4.3.3', '@types/react': '19.2.2', '@types/react-dom': '19.2.2', '@types/node': '22.20.5', '@vitejs/plugin-react': '5.0.4'},
  }, null, 2));
  fs.writeFileSync(path.join(consumer, 'tsconfig.json'), JSON.stringify({compilerOptions: {
    target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler', jsx: 'react-jsx', strict: true,
    noEmit: true, skipLibCheck: true, types: ['vite/client'], lib: ['ES2022', 'DOM'],
  }, include: ['src']}, null, 2));
  fs.writeFileSync(path.join(consumer, 'index.html'), '<div id="root"></div>\n<script type="module" src="/src/main.tsx"></script>\n');
  // Execute the README example, not a separately maintained approximation.
  const readme = fs.readFileSync(path.join(checkout, 'packages/core/README.md'), 'utf8');
  const example = readme.match(/<!-- registry-example -->\n```tsx\n([\s\S]*?)\n```/);
  assert.ok(example, 'README example missing');
  return example[1];
}

export function exerciseConsumer(consumer, checkout, run, example) {
  const cli = path.join(consumer, 'node_modules/.bin/hangyeol');
  const cliVersion = run('cli-version', cli, ['--version']).trim();
  assert.equal(cliVersion, version);
  run('init', cli, ['init']);
  run('add', cli, ['add', 'theme', 'text-field', 'button']);
  // Keep the authored example in sourceRoot so installed lint actually checks it.
  fs.writeFileSync(path.join(consumer, 'src/hangyeol/App.tsx'), example + '\n');
  fs.writeFileSync(path.join(consumer, 'src/main.tsx'), "import {createRoot} from 'react-dom/client';\nimport {App} from './hangyeol/App';\nimport './hangyeol.css';\ncreateRoot(document.getElementById('root')!).render(<App />);\n");
  for (const [label, args] of [['inspect', ['inspect']], ['doctor', ['doctor']], ['tokens', ['tokens', 'validate']], ['lint', ['lint']]]) run(label, cli, args);
  run('typecheck', path.join(consumer, 'node_modules/.bin/tsc'), ['-p', 'tsconfig.json', '--pretty', 'false']);
  run('build', path.join(consumer, 'node_modules/.bin/vite'), ['build']);
  return cliVersion;
}

function main() {
  validateContext(process.env);
  assert.equal(process.version, 'v22.22.2');
  const checkout = process.env.GITHUB_WORKSPACE;
  const consumer = path.join(process.env.RUNNER_TEMP, 'hangyeol-registry-consumer');
  const cache = path.join(process.env.RUNNER_TEMP, 'hangyeol-registry-cache');
  assert.ok(!fs.existsSync(consumer) && !fs.existsSync(cache), 'fresh consumer and empty cache required');
  fs.mkdirSync(consumer); fs.mkdirSync(cache);
  const env = {...process.env, npm_config_cache: cache, npm_config_registry: 'https://registry.npmjs.org', npm_config_audit: 'false', npm_config_fund: 'false', npm_config_offline: 'false', npm_config_ignore_scripts: 'false'};
  delete env.NODE_PATH; delete env.NODE_OPTIONS;
  const commands = {};
  const run = (label, command, args) => {
    const result = spawnSync(command, args, {cwd: consumer, env, encoding: 'utf8', maxBuffer: 32e6, timeout: 240000});
    // Never print subprocess environments, npm configuration or cache bodies.
    if (result.stderr) process.stderr.write(result.stderr);
    assert.equal(result.status, 0, `${label} failed (${result.signal || 'exit'}); no registry proof issued`);
    commands[label] = 'PASS';
    return result.stdout;
  };
  const example = scaffold(consumer, checkout);
  const metadata = JSON.parse(run('registry-metadata', 'npm', ['view', `${name}@${version}`, 'name', 'version', 'license', 'repository', 'dist', '--json', `--registry=${registry}`]));
  run('registry-install', 'npm', ['install', '--save-exact', '--no-audit', '--no-fund']);
  const installed = path.join(consumer, 'node_modules', name);
  assert.equal(fs.realpathSync(installed), installed, 'physical package required');
  const lock = readJSON(path.join(consumer, 'package-lock.json'));
  assert.equal(lock.packages[''].devDependencies[name], version);
  for (const entry of Object.values(lock.packages)) assert.ok(!entry.link, 'workspace links forbidden');
  validateRegistryMetadata(metadata, readJSON(path.join(installed, 'package.json')), lock.packages[`node_modules/${name}`]);
  const counts = verifyShippedFiles(installed, checkout);
  const cliVersion = exerciseConsumer(consumer, checkout, run, example);
  console.log('HANGYEOL_REGISTRY_PROOF ' + JSON.stringify({
    name, version, registry, distIntegrity: metadata.dist.integrity, distShasum: metadata.dist.shasum,
    installRegistryURL: lock.packages[`node_modules/${name}`].resolved, nodeVersion: process.version,
    ...counts, cliVersion, commands, workflowSHA: process.env.GITHUB_SHA,
    visibility: 'unverified; read package metadata separately', browserAcceptance: 'not performed',
  }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}

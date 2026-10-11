import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const evidence = process.env.CORE01_EVIDENCE_DIR;
assert.ok(evidence, 'External fixtures require an explicit CORE01_EVIDENCE_DIR');
const artifact = JSON.parse(fs.readFileSync(path.join(evidence, 'artifact.json')));
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function run(label, command, args, cwd, expected = 0) {
  const started = new Date().toISOString(), start = performance.now();
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16e6 });
  fs.writeFileSync(path.join(evidence, `installed-${label}-${Date.now()}.json`), JSON.stringify({
    command: [command, ...args], cwd, started, runtime: process.version,
    exit: result.status, durationMs: Math.round(performance.now() - start),
    stdout: result.stdout, stderr: result.stderr,
  }, null, 2));
  assert.equal(result.status, expected, `${label}: ${result.stdout}\n${result.stderr}`);
  return result.stdout;
}

test('external host retains core as a pinned devDependency and runs only its installed bin', () => {
  const host = fs.mkdtempSync(path.join(evidence, 'host-'));
  const corePackage = JSON.parse(fs.readFileSync(path.join(artifact.unpacked, 'package/package.json')));
  const manifest = JSON.parse(fs.readFileSync(path.join(artifact.unpacked, 'package/payload/manifest.json')));
  fs.writeFileSync(path.join(host, 'package.json'), JSON.stringify({
    name: 'core01-external-host', version: '1.0.0', private: true, type: 'module',
    dependencies: { react: '19.2.0', 'react-dom': '19.2.0', ...manifest.runtime },
    devDependencies: { vite: '7.3.6', ...manifest.build, ...manifest.types },
  }, null, 2));
  run('install', 'npm', ['install', '--offline', '--save-dev', '--save-exact', artifact.tarball], host);
  const pkg = JSON.parse(fs.readFileSync(path.join(host, 'package.json')));
  const lock = JSON.parse(fs.readFileSync(path.join(host, 'package-lock.json')));
  assert.ok(pkg.devDependencies['@orderthan31/hangyeol-core']);
  assert.ok(pkg.devDependencies['@orderthan31/hangyeol-core'].startsWith('file:'), 'Local tarball is pinned, not a floating registry range');
  assert.ok(!pkg.dependencies['@orderthan31/hangyeol-core']);
  assert.equal(lock.packages['node_modules/@orderthan31/hangyeol-core'].version, artifact.version);
  assert.equal(lock.packages['node_modules/@orderthan31/hangyeol-core'].dev, true);
  assert.equal(lock.packages[''].devDependencies['@orderthan31/hangyeol-core'], pkg.devDependencies['@orderthan31/hangyeol-core']);
  const installed = path.join(host, 'node_modules/@orderthan31/hangyeol-core');
  assert.ok(!fs.lstatSync(installed).isSymbolicLink(), 'External core must be physical, not a workspace link');
  assert.ok(!fs.existsSync(path.join(host, 'src')), 'Package install must not generate UI');
  const bin = path.join(host, 'node_modules/.bin/hangyeol');
  assert.equal(fs.realpathSync(bin), path.join(installed, corePackage.bin.hangyeol));
  assert.equal(run('version', bin, ['--version'], host).trim(), artifact.version);
  const inspect = JSON.parse(run('inspect', bin, ['inspect'], host));
  assert.equal(inspect.package, '@orderthan31/hangyeol-core');
  assert.equal(inspect.integrity, 'verified');
  const packedManifest = path.join(installed, 'payload/manifest.json');
  const manifestBytes = fs.readFileSync(packedManifest);
  fs.writeFileSync(packedManifest, JSON.stringify({ ...manifest, version: '0.0.0-wrong' }));
  run('version-mismatch-rejected', bin, ['--version'], host, 1);
  fs.writeFileSync(packedManifest, manifestBytes);
  const beforePackage = fs.readFileSync(path.join(host, 'package.json'));
  const beforeLock = fs.readFileSync(path.join(host, 'package-lock.json'));
  const init = JSON.parse(run('init-plan', bin, ['init', '--dry-run'], host));
  assert.equal(init.version, artifact.version);
  assert.equal(init.dryRun, true);
  assert.ok(!fs.existsSync(path.join(host, 'src')));
  assert.deepEqual(fs.readFileSync(path.join(host, 'package.json')), beforePackage);
  assert.deepEqual(fs.readFileSync(path.join(host, 'package-lock.json')), beforeLock);
  run('init', bin, ['init'], host);
  const add = JSON.parse(run('add-plan', bin, ['add', 'button', '--dry-run'], host));
  assert.equal(add.dryRun, true);
  assert.ok(!fs.existsSync(path.join(host, 'src/hangyeol/primitives/button.tsx')));
  run('add', bin, ['add', 'button'], host);
  run('add-noop', bin, ['add', 'button'], host);
  const config = JSON.parse(fs.readFileSync(path.join(host, 'hangyeol.json')));
  assert.deepEqual(config.tool, { package: '@orderthan31/hangyeol-core', version: artifact.version });
  for (const [source, record] of Object.entries(manifest.files)) {
    const target = path.join(host, 'src/hangyeol', source);
    if (fs.existsSync(target)) assert.equal(digest(fs.readFileSync(target)), record.hash);
  }
  assert.ok(!fs.existsSync(path.join(host, 'src/hangyeol/primitives/select.tsx')));
  assert.ok(!fs.existsSync(path.join(host, 'src/hangyeol/index.ts')));
  const button = path.join(host, 'src/hangyeol/primitives/button.tsx');
  fs.appendFileSync(button, '\n// external owner edit\n');
  const edit = fs.readFileSync(button), previousConfig = fs.readFileSync(path.join(host, 'hangyeol.json'));
  run('add-conflict', bin, ['add', 'button'], host, 1);
  assert.deepEqual(fs.readFileSync(button), edit);
  assert.deepEqual(fs.readFileSync(path.join(host, 'hangyeol.json')), previousConfig);
  run('add-overwrite', bin, ['add', 'button', '--overwrite'], host);
  assert.equal(digest(fs.readFileSync(button)), manifest.files['primitives/button.tsx'].hash);
  const backups = fs.readdirSync(path.join(host, '.hangyeol-backups'));
  assert.ok(backups.some(dir => {
    const backup = path.join(host, '.hangyeol-backups', dir, 'src/hangyeol/primitives/button.tsx');
    return fs.existsSync(backup) && fs.readFileSync(backup).equals(edit);
  }));
  const lint = JSON.parse(run('lint-inspect', bin, ['lint', 'inspect'], host));
  assert.equal(lint.dependencies.length, 5);
  const tokens = JSON.parse(run('tokens-inspect', bin, ['tokens', 'inspect'], host));
  assert.ok(tokens.declarations.length > 0);
  const consumerLint=JSON.parse(run('lint-consumer',bin,['lint'],host));
  assert.equal(consumerLint.sourceRoot,'src/hangyeol');
  assert.equal(consumerLint.compiler.mode,'actual');
  assert.deepEqual(consumerLint.diagnostics,[]);
  assert.equal(consumerLint.readOnly,true);
  const consumerTokens=JSON.parse(run('tokens-consumer', bin, ['tokens'], host));
  assert.equal(consumerTokens.operation,'validate');
  assert.equal(consumerTokens.readOnly,true);
  assert.equal(consumerTokens.sourceRoot,'src/hangyeol');
  assert.ok(consumerTokens.schemes.light.roles['--g-surface']);
  assert.ok(consumerTokens.schemes.dark.roles['--g-surface']);
  const doctor = JSON.parse(run('doctor-consumer', bin, ['doctor'], host));
  assert.equal(doctor.status, 'ok');
  assert.equal(doctor.readOnly, true);
  assert.equal(doctor.config.sourceRoot, 'src/hangyeol');
  assert.equal(doctor.capabilities.update, false);
  assert.ok(doctor.checks.some(check => check.code === 'source.runtime-separation' && check.status === 'ok'));
  const theme = path.join(installed, 'payload/source/foundation/theme.css');
  const original = fs.readFileSync(theme);
  fs.appendFileSync(theme, '\n/* tamper */\n');
  run('tamper-rejected', bin, ['inspect'], host, 1);
  fs.writeFileSync(theme, original);
  const finalPackage = JSON.parse(fs.readFileSync(path.join(host, 'package.json')));
  const finalLock = JSON.parse(fs.readFileSync(path.join(host, 'package-lock.json')));
  const finalCoreRecord = finalLock.packages['node_modules/@orderthan31/hangyeol-core'];
  assert.equal(finalCoreRecord.version, artifact.version);
  assert.equal(finalCoreRecord.dev, true);
  assert.equal(finalCoreRecord.integrity, lock.packages['node_modules/@orderthan31/hangyeol-core'].integrity);
  assert.match(finalCoreRecord.integrity, /^sha512-/);
  assert.equal(finalCoreRecord.resolved, lock.packages['node_modules/@orderthan31/hangyeol-core'].resolved);
  assert.match(finalCoreRecord.resolved, /^file:/);
  assert.equal(finalLock.packages[''].devDependencies['@orderthan31/hangyeol-core'], finalPackage.devDependencies['@orderthan31/hangyeol-core']);
  assert.equal(finalPackage.devDependencies['@orderthan31/hangyeol-core'], pkg.devDependencies['@orderthan31/hangyeol-core']);
  assert.ok(!finalPackage.dependencies['recharts']);
  assert.ok(!finalPackage.dependencies['react-is']);
  const installedModules = fs.readFileSync(path.join(installed, 'dist/router.mjs'), 'utf8');
  assert.ok(!installedModules.includes('packages/cli') && !installedModules.includes('scripts/'));
  fs.writeFileSync(path.join(evidence, 'external-host.json'), JSON.stringify({
    host, localBin: bin, coreDevDependency: pkg.devDependencies['@orderthan31/hangyeol-core'],
    installedVersion: finalCoreRecord.version, finalCoreLockRecord: finalCoreRecord,
    lockRetained: true, physicalCorePackage: true, noPostinstallGeneration: true,
    payloadVersion: manifest.version, sourceClosure: config.components,
  }, null, 2));
});

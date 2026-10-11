import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const evidence = process.env.CORE01_EVIDENCE_DIR;
assert.ok(evidence, 'Set CORE01_EVIDENCE_DIR to the authorized external scratch directory');
assert.ok(!path.resolve(evidence).startsWith(path.resolve(root) + path.sep));
fs.mkdirSync(evidence, { recursive: true });
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function invoke(label, command, args, cwd = root, expected = 0) {
  const start = performance.now();
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16e6 });
  fs.writeFileSync(path.join(evidence, `packed-${label}-${Date.now()}.json`), JSON.stringify({
    command: [command, ...args], cwd, runtime: process.version,
    exit: result.status, durationMs: Math.round(performance.now() - start),
    stdout: result.stdout, stderr: result.stderr,
  }, null, 2));
  assert.equal(result.status, expected, `${label}: ${result.stdout}\n${result.stderr}`);
  return result.stdout;
}

test('packed core owns its executable, shared installer and same-version canonical payload', () => {
  const dry = JSON.parse(invoke('dry-run', 'npm', ['pack', '--dry-run', '--json', '--workspace=@orderthan31/hangyeol-core']))[0];
  const files = new Set(dry.files.map(entry => entry.path));
  for (const file of ['bin/hangyeol.mjs', 'dist/router.mjs', 'dist/tools/installer.mjs',
    'dist/tools/safety.mjs', 'dist/tools/host-config.mjs', 'dist/tools/common.mjs', 'dist/tools/lint.mjs', 'dist/tools/lint-css.mjs',
    'dist/tools/tokens.mjs', 'payload/manifest.json', 'LICENSE', 'THIRD_PARTY_NOTICES.md',
    'payload/assets/LICENSE', 'payload/assets/provenance.json']) assert.ok(files.has(file), `Missing packed boundary: ${file}`);
  assert.ok(!dry.files.some(file => /^(src|test|build\.mjs)\//.test(file.path)));
  const metadata = JSON.parse(fs.readFileSync(path.join(root, 'packages/core/package.json')));
  assert.equal(dry.version, metadata.version);
  assert.equal(metadata.license, 'UNLICENSED');
  assert.equal(metadata.private, false);
  assert.equal(metadata.scripts.prepublishOnly, 'node publish-guard.mjs');
  assert.equal(dry.name, '@orderthan31/hangyeol-core');
  assert.equal(dry.filename, 'orderthan31-hangyeol-core-0.0.1.tgz');
  assert.ok(!metadata.scripts.postinstall, 'Installing tools must not secretly generate consumer UI');

  const destination = fs.mkdtempSync(path.join(evidence, 'artifact-'));
  const packed = JSON.parse(invoke('pack', 'npm', ['pack', '--json', '--workspace=@orderthan31/hangyeol-core', `--pack-destination=${destination}`]))[0];
  const tarball = path.join(destination, packed.filename);
  const entries = invoke('tar-list', 'tar', ['-tzf', tarball]).trim().split('\n');
  assert.ok(entries.every(entry => entry.startsWith('package/') && !entry.split('/').includes('..')));
  const unpacked = fs.mkdtempSync(path.join(evidence, 'unpacked-'));
  invoke('tar-extract', 'tar', ['-xzf', tarball, '-C', unpacked]);
  const packageRoot = path.join(unpacked, 'package');
  const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, 'payload/manifest.json')));
  assert.equal(manifest.version, metadata.version);
  assert.equal(manifest.package, metadata.name);
  for (const [file, record] of Object.entries(manifest.files)) {
    const bytes = fs.readFileSync(path.join(packageRoot, 'payload/source', file));
    assert.equal(digest(bytes), record.hash);
    assert.deepEqual(bytes, fs.readFileSync(path.join(root, 'packages/core/src/ui', file)));
  }
  for (const [file, record] of Object.entries(manifest.assets)) {
    assert.equal(digest(fs.readFileSync(path.join(packageRoot, 'payload/assets', file))), record.hash);
  }
  assert.equal(fs.readFileSync(path.join(packageRoot, 'dist/tools/installer.mjs'), 'utf8'), fs.readFileSync(path.join(root, 'packages/core/src/tools/installer.mjs'), 'utf8'));
  assert.ok(fs.statSync(path.join(packageRoot, metadata.bin.hangyeol)).mode & 0o111);
  assert.equal(invoke('packed-version', process.execPath, [path.join(packageRoot, metadata.bin.hangyeol), '--version'], unpacked).trim(), metadata.version);
  fs.writeFileSync(path.join(evidence, 'artifact.json'), JSON.stringify({
    tarball, filename: packed.filename, version: metadata.version, sha256: digest(fs.readFileSync(tarball)),
    unpacked, files: dry.files, sourceCount: Object.keys(manifest.files).length,
    assetCount: Object.keys(manifest.assets).length,
  }, null, 2));
});

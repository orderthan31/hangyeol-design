// Build an explicitly unpublished adapter candidate without changing published identity/guards.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
const [version, destination] = process.argv.slice(2);
if (!/^0\.0\.2-adapter\.[1-9]\d*$/.test(version ?? '') || !destination || process.argv.length !== 4) {
  throw Error('Usage: node scripts/pack-core-adapter-candidate.mjs 0.0.2-adapter.1 /absolute/outside-repo/output');
}
const out = path.resolve(destination);
fs.mkdirSync(out, {recursive: true});
if (fs.realpathSync(out) === fs.realpathSync(root) || fs.realpathSync(out).startsWith(fs.realpathSync(root) + path.sep)) throw Error('Candidate staging must stay outside the repository');
function run(command, args, cwd) {
  const result = spawnSync(command, args, {cwd, encoding: 'utf8', env: {...process.env, npm_config_audit: 'false', npm_config_fund: 'false'}, maxBuffer: 32e6});
  if (result.status !== 0) throw Error(`${command} failed (${result.status}): ${result.stderr}`);
  return result.stdout;
}
run(process.execPath, ['packages/core/build.mjs'], root);
const source = path.join(root, 'packages/core');
const pkg = JSON.parse(fs.readFileSync(path.join(source, 'package.json')));
if (pkg.name !== '@orderthan31/hangyeol-core' || pkg.version !== '0.0.1' || pkg.scripts.prepublishOnly !== 'node publish-guard.mjs') throw Error('Unexpected published baseline');
const stage = fs.mkdtempSync(path.join(out, 'candidate-stage-'));
for (const entry of pkg.files) fs.cpSync(path.join(source, entry), path.join(stage, entry), {recursive: true});
// These are producer metadata, not consumer installation/ownership records.
pkg.version = version;
fs.writeFileSync(path.join(stage, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
for (const filename of ['payload/manifest.json', 'dist/tool-manifest.json']) {
  const file = path.join(stage, filename), manifest = JSON.parse(fs.readFileSync(file));
  manifest.version = version;
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
}
const readme = path.join(stage, 'README.md');
fs.writeFileSync(readme, `> Unpublished dynamic-host adapter candidate ${version}. Install this exact local tgz; it is not the immutable published 0.0.1. The retained publication guard rejects this candidate version. See the separate provenance receipt and docs/dynamic-vite-adapter.md for supported host syntax.\n\n` + fs.readFileSync(readme, 'utf8'));
const packed = JSON.parse(run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', out], stage));
if (packed.length !== 1 || packed[0].name !== pkg.name || packed[0].version !== version) throw Error('Candidate identity mismatch');
const archive = path.join(out, packed[0].filename), bytes = fs.readFileSync(archive);
const sha256 = createHash('sha256').update(bytes).digest('hex');
const integrity = 'sha512-' + createHash('sha512').update(bytes).digest('base64');
if (integrity !== packed[0].integrity) throw Error('Packed integrity mismatch');
const sourceRevision = run('git', ['rev-parse', 'HEAD'], root).trim();
const sourceDirty = run('git', ['status', '--porcelain'], root).trim();
const receipt = {name: pkg.name, version, archive, bytes: bytes.length, sha256, integrity, sourceRevision, sourceClean: !sourceDirty, publication: 'not published; 0.0.1 registry/version/guard unchanged', identityTransform: 'producer package/version and payload/tool manifest versions, plus explicit candidate README banner; no consumer ownership records altered', runtime: process.version};
fs.writeFileSync(path.join(out, 'candidate-provenance.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify(receipt, null, 2));

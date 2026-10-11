import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repo = fs.realpathSync(path.resolve(fileURLToPath(new URL('../../../', import.meta.url))));
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const inside = (root, target) => target === root || target.startsWith(root + path.sep);
function externalDirectory(value, label) {
  assert.ok(value && path.isAbsolute(value), `${label} must be an explicit absolute directory`);
  assert.ok(!inside(repo, fs.realpathSync(value)), `${label} must be physically outside the repository`);
  return fs.realpathSync(value);
}
const evidence = externalDirectory(process.env.CORE10_EVIDENCE_DIR, 'CORE10_EVIDENCE_DIR');
const packageRoot = externalDirectory(process.env.CORE10_PACKAGE_ROOT, 'CORE10_PACKAGE_ROOT');
const scratch = externalDirectory(process.env.TMPDIR, 'TMPDIR');
assert.ok(inside(scratch, evidence), 'Fixtures/evidence must remain in the explicit scratch parent');
const artifactPath = process.env.CORE10_ARTIFACT_PATH;
assert.ok(artifactPath && path.isAbsolute(artifactPath), 'CORE10_ARTIFACT_PATH must identify the new artifact.json');
assert.ok(inside(evidence, fs.realpathSync(artifactPath)), 'Artifact metadata must be in this evidence directory');
const childEnv = { ...process.env };
delete childEnv.NODE_PATH;
Object.assign(childEnv, { npm_config_offline: 'true', npm_config_ignore_scripts: 'true', npm_config_audit: 'false', npm_config_fund: 'false' });

function record(label, data) {
  const file = path.join(evidence, `external-${label}-${process.hrtime.bigint()}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return file;
}
function snapshot(root) {
  const result = {};
  function visit(full) {
    const stat = fs.lstatSync(full, { bigint: true }), name = path.relative(root, full) || '.';
    result[name] = { inode: String(stat.ino), mtimeNs: String(stat.mtimeNs), mode: String(stat.mode),
      kind: stat.isSymbolicLink() ? 'link' : stat.isDirectory() ? 'directory' : 'file',
      ...(stat.isSymbolicLink() ? { link: fs.readlinkSync(full) } : stat.isFile() ? { hash: digest(fs.readFileSync(full)), bytes: Number(stat.size) } : {}) };
    if (stat.isDirectory()) for (const entry of fs.readdirSync(full).sort()) visit(path.join(full, entry));
  }
  visit(root);
  return result;
}
function run(label, command, args, cwd, { expected = 0, readOnly = false, env = childEnv } = {}) {
  const before = snapshot(cwd), started = new Date().toISOString(), start = performance.now();
  const result = spawnSync(command, args, { cwd, env, encoding: 'utf8', maxBuffer: 32e6 });
  const after = snapshot(cwd);
  record(label, { argv: [command, ...args], cwd, runtime: process.version, started,
    ended: new Date().toISOString(), durationMs: performance.now() - start, exit: result.status,
    error: result.error && { code: result.error.code, message: result.error.message },
    stdout: result.stdout, stderr: result.stderr, readOnly, before, after });
  if (Array.isArray(expected)) assert.ok(expected.includes(result.status), `${label}: expected ${expected.join('/')} but received ${result.status}; ${result.stderr}`);
  else assert.equal(result.status, expected, `${label}: ${result.stdout}\n${result.stderr}`);
  if (readOnly) assert.deepEqual(after, before, `${label} must preserve bytes/inodes/mtime/modes/links, including node_modules`);
  return result;
}
function gitValue(args) {
  const r = spawnSync('git', args, { cwd: repo, env: childEnv, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim();
}
function validateArtifact(metadata) {
  assert.equal(metadata.sourceRevision.HEAD, gitValue(['rev-parse', 'HEAD']), 'Artifact must identify current source HEAD');
  assert.equal(metadata.sourceRevision.tree, gitValue(['rev-parse', 'HEAD^{tree}']), 'Artifact tree must match current source');
  assert.ok(path.isAbsolute(metadata.tarball) && inside(evidence, fs.realpathSync(metadata.tarball)), 'Tarball must be in this scratch evidence');
  const tarBytes = fs.readFileSync(metadata.tarball);
  assert.equal(digest(tarBytes), metadata.sha256, 'Actual tarball SHA256 must match artifact metadata');
  assert.equal('sha512-' + crypto.createHash('sha512').update(tarBytes).digest('base64'), metadata.integrity, 'Actual tarball SRI must match metadata');
  const pkg = json(path.join(packageRoot, 'package.json'));
  assert.equal(pkg.name, '@orderthan31/hangyeol-core');
  assert.equal(pkg.version, metadata.version);
  assert.equal(pkg.private, false);
  assert.equal(pkg.license, 'UNLICENSED');
  assert.deepEqual(pkg.bin, { hangyeol: 'bin/hangyeol.mjs' });
  const manifest = json(path.join(packageRoot, 'payload/manifest.json'));
  assert.equal(manifest.package, pkg.name);
  assert.equal(manifest.version, pkg.version);
  for (const [name, value] of Object.entries(manifest.files)) {
    assert.equal(digest(fs.readFileSync(path.join(packageRoot, 'payload/source', name))), value.hash);
    assert.equal(digest(fs.readFileSync(path.join(repo, 'packages/core/src/ui', name))), value.hash, `Current canonical source: ${name}`);
  }
  const tools = json(path.join(packageRoot, 'dist/tool-manifest.json'));
  for (const [name, value] of Object.entries(tools.files)) {
    assert.equal(digest(fs.readFileSync(path.join(packageRoot, name))), value.hash);
    assert.equal(metadata.toolHashes[name], value.hash);
    if (/^(packages|scripts)\//.test(value.source)) assert.equal(digest(fs.readFileSync(path.join(repo, value.source))), value.hash, `Current canonical tool: ${name}`);
  }
  for (const [name, value] of Object.entries(manifest.assets)) assert.equal(digest(fs.readFileSync(path.join(packageRoot, 'payload/assets', name))), value.hash);
  return { pkg, manifest, tools };
}
const artifact = json(artifactPath);
const { pkg: corePackage, manifest, tools } = validateArtifact(artifact);

function npmGuard(label) {
  const dir = fs.mkdtempSync(path.join(evidence, `${label}-npm-guard-`)), trace = path.join(dir, 'trace.jsonl');
  fs.writeFileSync(trace, '');
  for (const name of ['npm', 'npx']) fs.writeFileSync(path.join(dir, name), `#!${process.execPath}\nimport fs from 'node:fs';fs.appendFileSync(${JSON.stringify(trace)},JSON.stringify(process.argv)+"\\n");process.exit(97);\n`, { mode: 0o755 });
  return { trace, env: { ...childEnv, PATH: dir + path.delimiter + path.dirname(process.execPath) } };
}
function assertCoreIdentity(host) {
  const pkg = json(path.join(host, 'package.json')), lock = json(path.join(host, 'package-lock.json'));
  const spec = pkg.devDependencies['@orderthan31/hangyeol-core'], entry = lock.packages['node_modules/@orderthan31/hangyeol-core'];
  assert.match(spec, /^file:/);
  assert.equal(path.resolve(host, spec.slice(5)), artifact.tarball);
  assert.ok(!pkg.dependencies['@orderthan31/hangyeol-core']);
  assert.equal(lock.packages[''].devDependencies['@orderthan31/hangyeol-core'], spec);
  assert.equal(entry.version, artifact.version);
  assert.equal(entry.dev, true);
  assert.ok(!entry.link);
  assert.equal(entry.integrity, artifact.integrity);
  assert.match(entry.resolved, /^file:/);
  assert.equal(path.resolve(host, entry.resolved.slice(5)), artifact.tarball);
  const physical = path.join(host, 'node_modules/@orderthan31/hangyeol-core'), bin = path.join(host, 'node_modules/.bin/hangyeol');
  assert.equal(fs.lstatSync(physical).isSymbolicLink(), false);
  assert.equal(fs.realpathSync(physical), physical);
  assert.equal(fs.realpathSync(bin), path.join(physical, corePackage.bin.hangyeol));
  for (const [name, value] of Object.entries(tools.files)) assert.equal(digest(fs.readFileSync(path.join(physical, name))), value.hash);
  return { physical, bin, spec, lock: entry };
}

test('external directory boundary rejects repository roots descendants and internal symlinks before consumer creation', () => {
  const root = fs.realpathSync(path.resolve(repo)), descendant = path.join(root, 'packages/core');
  const probe = fs.mkdtempSync(path.join(evidence, 'boundary-probe-'));
  const link = path.join(probe, 'repository-descendant');
  fs.symlinkSync(descendant, link, 'dir');
  const before = fs.readdirSync(evidence).sort();
  try {
    for (const target of [root, root + path.sep, descendant, link]) {
      assert.throws(() => externalDirectory(target, 'boundary negative control'), /physically outside the repository/);
    }
    assert.equal(externalDirectory(probe, 'external positive control'), fs.realpathSync(probe));
    assert.deepEqual(fs.readdirSync(evidence).sort(), before, 'Rejected boundary checks must not create consumer hosts');
    record('directory-boundary', { rejected: ['repository root', 'trailing-separator root', 'repository descendant', 'symlink to repository descendant'], externalAccepted: true });
  } finally {
    fs.unlinkSync(link);
  }
});

test('artifact negative controls reject stale revision and wrong bytes before consumer creation', () => {
  const before = fs.readdirSync(evidence).sort();
  const inputs = [
    [{ ...artifact, sha256: '0'.repeat(64) }, /SHA256/],
    [{ ...artifact, sourceRevision: { ...artifact.sourceRevision, HEAD: '0'.repeat(40) } }, /current source HEAD/],
    [{ ...artifact, integrity: 'sha512-wrong' }, /SRI/],
  ], errors = [];
  for (const [input, diagnostic] of inputs) assert.throws(() => validateArtifact(input), error => {
    assert.match(error.message, diagnostic); errors.push(error.message); return true;
  });
  assert.deepEqual(fs.readdirSync(evidence).sort(), before);
  record('artifact-negative-controls', { expectedRejections: 3, observedRejections: errors.length, errors, artifactSHA256: artifact.sha256,
    reason: 'Test harness preflight controls; not a product RED or registry download test.' });
});

test('independent physical consumer runs installed core and builds preserved editable local UI', () => {
  const host = fs.mkdtempSync(path.join(evidence, 'normal-host-'));
  fs.writeFileSync(path.join(host, 'package.json'), JSON.stringify({ name: 'core10-external-consumer', version: '1.0.0', private: true, type: 'module',
    scripts: { build: 'vite build' }, owner: { kept: 'host-setting' },
    dependencies: { react: '19.2.0', 'react-dom': '19.2.0', ...manifest.runtime },
    devDependencies: { vite: '7.3.6', typescript: '5.9.3', ...manifest.build, ...manifest.types } }, null, 2));
  fs.mkdirSync(path.join(host, 'styles'));
  const hostCSS = '.host-sentinel { color: rebeccapurple; }\n';
  fs.writeFileSync(path.join(host, 'styles/theme.css'), hostCSS);
  fs.writeFileSync(path.join(host, 'tsconfig.json'), JSON.stringify({ compilerOptions: {
    target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler', jsx: 'react-jsx', strict: true,
    noEmit: true, skipLibCheck: true, types: ['vite/client'], lib: ['ES2022', 'DOM'] }, include: ['src', 'ui/system'] }, null, 2));
  const originalTSConfig = fs.readFileSync(path.join(host, 'tsconfig.json'));
  run('install', 'npm', ['install', '--save-dev', '--save-exact', artifact.tarball, '--offline', '--ignore-scripts', '--no-audit', '--no-fund'], host);
  const identity = assertCoreIdentity(host), { bin, physical } = identity;
  for (const name of ['hangyeol.json', 'ui', 'src', 'static', '.hangyeol-backups']) assert.ok(!fs.existsSync(path.join(host, name)), `Package install alone must not generate ${name}`);
  assert.equal(fs.readFileSync(path.join(host, 'styles/theme.css'), 'utf8'), hostCSS);
  const require = createRequire(path.join(host, 'package.json')), resolutions = {};
  for (const name of [...Object.keys(json(path.join(host, 'package.json')).dependencies), ...Object.keys(manifest.build), ...Object.keys(manifest.types), 'vite', 'typescript', ...Object.keys(corePackage.dependencies)]) {
    const metadata = path.join(host, 'node_modules', name, 'package.json');
    assert.equal(fs.lstatSync(path.dirname(metadata)).isSymbolicLink(), false);
    assert.ok(inside(path.join(host, 'node_modules'), fs.realpathSync(metadata)));
    const resolved = require.resolve(name.startsWith('@types/') ? name + '/package.json' : name);
    assert.ok(inside(path.join(host, 'node_modules'), fs.realpathSync(resolved)), `${name} must resolve from physical host`);
    const info = json(metadata);
    if (name.startsWith('@types/')) {
      const declaration = path.resolve(path.dirname(metadata), info.types);
      assert.ok(inside(path.join(host, 'node_modules'), fs.realpathSync(declaration)));
      resolutions[name] = { entry: fs.realpathSync(declaration), metadata: fs.realpathSync(resolved), version: info.version, kind: 'type declaration; no runtime JS entry' };
    } else resolutions[name] = { entry: fs.realpathSync(resolved), version: info.version, kind: 'runtime/build/tool module' };
  }
  assert.equal(resolutions.typescript.version, '5.9.3');
  const guard = npmGuard('normal'), env = guard.env;
  for (const name of ['npm', 'npx']) run(`guard-proof-${name}`, path.join(path.dirname(guard.trace), name), ['--version'], host, { expected: 97, readOnly: true, env });
  fs.writeFileSync(guard.trace, '');
  const cli = (label, args, expected = 0, readOnly = true) => run(label, bin, args, host, { expected, readOnly, env });
  assert.equal(cli('version', ['--version']).stdout.trim(), artifact.version);
  assert.equal(JSON.parse(cli('inspect', ['inspect']).stdout).integrity, 'verified');
  const flags = ['--source-root', 'ui/system', '--style-path', 'styles/theme.css', '--public-root', 'static', '--font-path', 'assets/type', '--base-path', '/design/', '--alias', '@hangyeol'];
  const initPlan = JSON.parse(cli('init-plan', ['init', ...flags, '--dry-run']).stdout);
  assert.equal(initPlan.dryRun, true);
  cli('init', ['init', ...flags], 0, false);
  cli('init-noop', ['init']);
  const originalInitConfig = fs.readFileSync(path.join(host, 'hangyeol.json'));
  const addPlan = JSON.parse(cli('add-plan', ['add', 'text-field', '--dry-run']).stdout);
  assert.equal(addPlan.dryRun, true);
  cli('add', ['add', 'text-field'], 0, false);
  cli('add-noop', ['add', 'text-field']);
  assert.equal(fs.readFileSync(guard.trace, 'utf8'), '', 'All required dependencies were installed explicitly before init/add');
  const sourceRoot = path.join(host, 'ui/system'), configFile = path.join(host, 'hangyeol.json');
  const config = json(configFile), originalRecords = structuredClone(config.installed);
  assert.deepEqual([...config.components].sort(), ['button', 'input', 'text-field']);
  const listFiles = (dir, prefix = '') => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? listFiles(path.join(dir, entry.name), prefix + entry.name + '/') : [prefix + entry.name]).sort();
  const backupRoot = path.join(host, '.hangyeol-backups'), backupFiles = listFiles(backupRoot);
  for (const [name, bytes] of [['styles/theme.css', Buffer.from(hostCSS)], ['tsconfig.json', originalTSConfig], ['hangyeol.json', originalInitConfig]]) {
    assert.ok(backupFiles.some(file => file.endsWith('/' + name) && fs.readFileSync(path.join(backupRoot, file)).equals(bytes)), `Actual integration/metadata change must retain exact prior ${name} bytes`);
  }
  assert.ok(initPlan.files.some(file => file.path === 'styles/theme.css' && file.action === 'replace' && file.backup));
  assert.ok(addPlan.metadata.some(file => file.path === 'hangyeol.json' && file.action === 'replace'));
  assert.ok(fs.readFileSync(path.join(host, 'styles/theme.css'), 'utf8').endsWith(hostCSS));
  assert.ok(!fs.readFileSync(path.join(host, 'styles/theme.css'), 'utf8').includes('tailwindcss/preflight'));
  for (const [key, value] of Object.entries(JSON.parse(originalTSConfig).compilerOptions)) assert.deepEqual(json(path.join(host, 'tsconfig.json')).compilerOptions[key], value);
  const backupsBeforeOwnerEdits = snapshot(backupRoot);
  assert.deepEqual(listFiles(sourceRoot), ['components/text-field.tsx', 'foundation/fonts.css', 'foundation/theme.css', 'lib/cn.ts', 'primitives/button.tsx', 'primitives/input.tsx']);
  for (const name of [...manifest.common, 'components/text-field.tsx', 'primitives/button.tsx', 'primitives/input.tsx']) assert.equal(digest(fs.readFileSync(path.join(sourceRoot, name))), manifest.files[name].hash);
  for (const [name, entry] of Object.entries(manifest.assets)) assert.equal(digest(fs.readFileSync(path.join(host, 'static/assets/type', name))), entry.hash);
  const checkTools = suffix => {
    const lint = JSON.parse(cli('lint-' + suffix, ['lint']).stdout);
    assert.equal(lint.compiler.mode, 'actual'); assert.deepEqual(lint.diagnostics, []); assert.equal(lint.readOnly, true);
    assert.equal(lint.sourceRoot, 'ui/system');
    const tokens = JSON.parse(cli('tokens-' + suffix, ['tokens']).stdout);
    assert.equal(tokens.operation, 'validate'); assert.equal(tokens.readOnly, true);
    const doctor = JSON.parse(cli('doctor-' + suffix, ['doctor']).stdout);
    assert.equal(doctor.status, 'ok'); assert.equal(doctor.capabilities.update, false);
    return { lint, tokens, doctor };
  };
  checkTools('initial');
  config.owner = { kept: 'minified-consumer-config' }; config.tokens = { palette: 'Owner' };
  fs.writeFileSync(configFile, JSON.stringify(config));
  fs.appendFileSync(path.join(sourceRoot, 'lib/cn.ts'), '\nexport const ownerCnMarker="CORE10_OWNER_CN";\n');
  fs.appendFileSync(path.join(sourceRoot, 'components/text-field.tsx'), '\nexport const ownerFieldMarker="CORE10_OWNER_TEXT_FIELD";\n');
  fs.appendFileSync(path.join(sourceRoot, 'foundation/theme.css'), '\n[data-hangyeol] { --g-surface: #654321; --g-danger: rebeccapurple; }\n[data-hangyeol][data-palette="Owner"] { --g-action: #a16207; }\n');
  const edited = checkTools('edited');
  for (const scheme of ['light', 'dark']) {
    assert.equal(edited.tokens.schemes[scheme].roles['--g-surface'].value, '#654321');
    assert.equal(edited.tokens.schemes[scheme].roles['--g-danger'].value, 'rebeccapurple');
  }
  const exported = cli('tokens-export-readonly', ['tokens', 'export', '--format', 'json']);
  assert.equal(JSON.parse(exported.stdout).readOnly, true);
  assert.equal(JSON.parse(exported.stderr).exportHash, digest(Buffer.from(exported.stdout)));
  cli('add-unchanged-button', ['add', 'button']);
  assert.match(cli('add-edited-conflict', ['add', 'text-field'], 1).stderr, /conflict/);
  assert.match(cli('add-edited-dryrun-conflict', ['add', 'text-field', '--dry-run'], 1).stderr, /conflict/);
  assert.match(cli('init-edited-conflict', ['init'], 1).stderr, /conflict/);
  assert.match(cli('update-unsupported', ['update'], 1).stderr, /Unsupported command.*No registry fallback or update engine/);
  assert.deepEqual(json(configFile).installed, originalRecords, 'Read-only tools and preserved commons do not adopt owner edits');
  assert.equal(fs.readFileSync(guard.trace, 'utf8'), '');
  assert.deepEqual(snapshot(backupRoot), backupsBeforeOwnerEdits, 'No new or rewritten backups on noop/conflict/read-only operations');

  fs.mkdirSync(path.join(host, 'src'));
  fs.writeFileSync(path.join(host, 'index.html'), '<div id="root"></div><script type="module" src="/src/main.tsx"></script>');
  fs.writeFileSync(path.join(host, 'src/main.tsx'), 'import {createRoot} from "react-dom/client";\nimport {TextField,ownerFieldMarker} from "@hangyeol/components/text-field";\nimport {cn,ownerCnMarker} from "@hangyeol/lib/cn";\nimport "../styles/theme.css";\ncreateRoot(document.getElementById("root")!).render(<main data-hangyeol data-palette="Owner" className={cn("grid","gap-3")}><TextField id="owner" label={ownerCnMarker+ownerFieldMarker} name="owner" required clearable defaultValue="owner value" /></main>);\n');
  const ts = require('typescript'), imports = [];
  for (const name of listFiles(sourceRoot).filter(name => /\.tsx?$/.test(name))) {
    const ast = ts.createSourceFile(name, fs.readFileSync(path.join(sourceRoot, name), 'utf8'), ts.ScriptTarget.Latest, true);
    function visit(node) {
      let specifier;
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) specifier = node.moduleSpecifier;
      else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) specifier = node.moduleReference.expression;
      else if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || ts.isIdentifier(node.expression) && node.expression.text === 'require')) specifier = node.arguments[0];
      if (specifier && ts.isStringLiteral(specifier)) { imports.push({ file: name, line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1, specifier: specifier.text }); assert.ok(!/^(@orderthan31\/hangyeol-core|@orderthan31\/hangyeol-core\/tools)(\/|$)/.test(specifier.text)); }
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
  const ownedFiles = [configFile, path.join(sourceRoot, 'lib/cn.ts'), path.join(sourceRoot, 'components/text-field.tsx'), path.join(sourceRoot, 'foundation/theme.css')];
  const ownedBefore = Object.fromEntries(ownedFiles.map(file => [path.relative(host, file), digest(fs.readFileSync(file))]));
  const buildBins = {};
  for (const [name, relative] of [['tsc', 'typescript/bin/tsc'], ['vite', 'vite/bin/vite.js']]) {
    const local = path.join(host, 'node_modules/.bin', name);
    assert.equal(fs.realpathSync(local), path.join(host, 'node_modules', relative));
    buildBins[name] = { path: local, resolved: fs.realpathSync(local) };
  }
  assert.equal(json(path.join(host, 'tsconfig.json')).compilerOptions.strict, true);
  run('tsc-local', path.join(host, 'node_modules/.bin/tsc'), ['-p', 'tsconfig.json', '--pretty', 'false'], host, { readOnly: true, env });
  run('vite-local', path.join(host, 'node_modules/.bin/vite'), ['build'], host, { env });
  const assets = fs.readdirSync(path.join(host, 'dist/assets'));
  const bundle = assets.filter(name => name.endsWith('.js')).map(name => fs.readFileSync(path.join(host, 'dist/assets', name), 'utf8')).join('\n');
  const css = assets.filter(name => name.endsWith('.css')).map(name => fs.readFileSync(path.join(host, 'dist/assets', name), 'utf8')).join('\n');
  assert.match(bundle, /CORE10_OWNER_CN/); assert.match(bundle, /CORE10_OWNER_TEXT_FIELD/); assert.match(css, /--g-surface:\s*#654321/);
  checkTools('after-build');
  for (const file of ownedFiles) assert.equal(digest(fs.readFileSync(file)), ownedBefore[path.relative(host, file)]);
  assert.equal(fs.readFileSync(guard.trace, 'utf8'), '');
  const finalIdentity = assertCoreIdentity(host);
  assert.deepEqual(finalIdentity.lock, identity.lock);
  assert.equal(finalIdentity.spec, identity.spec);
  assert.equal(json(path.join(host, 'package.json')).owner.kept, 'host-setting');
  assert.deepEqual(Object.keys(json(path.join(host, 'package.json')).dependencies).sort(), ['clsx', 'react', 'react-dom', 'tailwind-merge']);
  fs.writeFileSync(path.join(evidence, 'normal-consumer.json'), JSON.stringify({ host, artifact: { path: artifact.tarball, sha256: artifact.sha256, integrity: artifact.integrity },
    physical, localBin: bin, binResolved: fs.realpathSync(bin), coreDevPin: finalIdentity.spec, coreLock: finalIdentity.lock,
    resolutions, buildBins, sourceClosure: listFiles(sourceRoot), imports, ownerFileHashes: ownedBefore,
    integrationBackups: backupsBeforeOwnerEdits, initPlan, addPlan,
    bundleHash: digest(Buffer.from(bundle)), cssHash: digest(Buffer.from(css)), noPostinstallGeneration: true,
    noNpmAfterExplicitInstall: true, editedTools: edited, limitations: ['No browser/HTTP/kernel network audit or empty-cache portability proof.'] }, null, 2));
});

test('absent core fails explicit local-only execution without npm npx or host mutation', () => {
  const host = fs.mkdtempSync(path.join(evidence, 'absent-core-'));
  fs.writeFileSync(path.join(host, 'owner-sentinel.txt'), 'No package install authorized in this absent-core fixture.\n');
  const guard = npmGuard('absent');
  for (const name of ['npm', 'npx']) run(`absent-guard-proof-${name}`, path.join(path.dirname(guard.trace), name), ['--version'], host, { expected: 97, readOnly: true, env: guard.env });
  fs.writeFileSync(guard.trace, '');
  const result = run('absent-local-bin', '/bin/sh', ['-c', 'exec ./node_modules/.bin/hangyeol --version'], host, { expected: [126, 127], readOnly: true, env: guard.env });
  assert.match(result.stderr, /node_modules\/\.bin\/hangyeol/);
  assert.equal(fs.readFileSync(guard.trace, 'utf8'), '');
  for (const name of ['package.json', 'package-lock.json', 'node_modules', 'hangyeol.json']) assert.ok(!fs.existsSync(path.join(host, name)));
  fs.writeFileSync(path.join(evidence, 'absent-core.json'), JSON.stringify({ host, argv: ['/bin/sh', '-c', 'exec ./node_modules/.bin/hangyeol --version'],
    exit: result.status, stderr: result.stderr, noNpmNpxCalls: true, noPackageLockModulesCreated: true,
    controlledPATH: guard.env.PATH, NODE_PATH: 'removed', snapshotEqual: true,
    limitation: 'Explicit local path and process trap prove no fallback calls in this fixture, not a complete kernel network audit.' }, null, 2));
});

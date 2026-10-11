import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

// Explicit opt-in: prepare a physical selected-owner consumer using the real
// packed artifact first. Never silently substitute source tools or a symlink.
const host = process.env.HANGYEOL_CSS_INSTALLED_HOST;
const evidence = process.env.CORE07_EVIDENCE_DIR;
const repo = fileURLToPath(new URL('../../../', import.meta.url));
assert.ok(host && path.isAbsolute(host) && !path.resolve(host).startsWith(repo));
assert.ok(evidence && path.isAbsolute(evidence) && !path.resolve(evidence).startsWith(repo));
const installed = path.join(host, 'node_modules/@orderthan31/hangyeol-core');
const bin = path.join(host, 'node_modules/.bin/hangyeol');
assert.equal(fs.lstatSync(installed).isSymbolicLink(), false);
assert.equal(fs.realpathSync(bin), path.join(installed, 'bin/hangyeol.mjs'));
const config = JSON.parse(fs.readFileSync(path.join(host, 'hangyeol.json')));
const source = path.join(host, config.sourceRoot);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
function snapshot() {
  const result = {};
  function visit(dir) { for (const entry of fs.readdirSync(dir, {withFileTypes: true})) { const full = path.join(dir, entry.name), stat = fs.lstatSync(full, {bigint: true}); result[full] = {mode: String(stat.mode), mtime: String(stat.mtimeNs), ...(entry.isFile() ? {hash: digest(fs.readFileSync(full))} : {}), ...(entry.isSymbolicLink() ? {link: fs.readlinkSync(full)} : {})}; if (entry.isDirectory()) visit(full); } }
  visit(source);
  for (const file of ['hangyeol.json', 'package.json', 'package-lock.json']) result[file] = digest(fs.readFileSync(path.join(host, file)));
  return result;
}
function lint(label, expected, rule, message) {
  const before = snapshot();
  const result = spawnSync(bin, ['lint'], {cwd: host, encoding: 'utf8', maxBuffer: 8e6});
  assert.deepEqual(snapshot(), before, 'installed lint must not write source/config/package/lock');
  fs.writeFileSync(path.join(evidence, `installed-css-${label}.json`), JSON.stringify({bin, host, exit: result.status, stdout: result.stdout, stderr: result.stderr}, null, 2));
  assert.equal(result.status, expected, result.stdout + '\n' + result.stderr);
  const report = result.stdout.startsWith('{') ? JSON.parse(result.stdout) : null;
  if (rule) assert.ok(report?.diagnostics.some(item => item.rule === rule), result.stdout + result.stderr);
  if (message) assert.match(result.stderr, message);
  if (report) assert.equal(report.compiler.mode, 'actual');
  return report;
}

test('physical installed CSS discovery retains negative enforcement and does not transfer inline ownership', () => {
  assert.deepEqual(lint('baseline', 0).diagnostics, []);
  const dir = path.join(source, 'lint-regression');
  assert.equal(fs.existsSync(dir), false);
  fs.mkdirSync(dir);
  const put = (name, bytes) => fs.writeFileSync(path.join(dir, name), bytes);
  const brand = path.join(source, 'components/brand-mark.tsx');
  const original = fs.readFileSync(brand);
  try {
    put('local.css', '@import "./shared.css"; @media (min-width:1rem) { .fixture-owned:focus-visible {color:var(--g-action);mask:var(--hangyeol-brand-mask)} }');
    put('shared.css', '.fixture-shared {display:block}');
    put('unrelated.css', '.fixture-unrelated {display:block}');
    put('importer.tsx', 'import "./local.css"; export const V=()=> <div className="fixture-owned"/>;');
    put('case.tsx', 'import "./local.css"; const variants={"not-a-class":"fixture-owned"}; export const V=()=> <div className="fixture-owned fixture-shared"/>;');
    assert.deepEqual(lint('css-values-positive', 0).diagnostics, []);
    const cases = [
      ['typo', 'import "./local.css"; export const V=()=> <div className="fixture-ownedd"/>;', 'core/unknown-class'],
      ['unrelated', 'import "./local.css"; export const V=()=> <div className="fixture-unrelated"/>;', 'core/unknown-class'],
      ['missing-import', 'export const V=()=> <div className="fixture-owned"/>;', 'core/unknown-class'],
      ['restyle', 'import "./local.css"; import {Button} from "../primitives/button"; export const V=()=> <Button className="fixture-owned"/>;', 'shadcn/no-restyle'],
      ['raw-color', 'import "./local.css"; export const V=()=> <div className="fixture-owned bg-red-600"/>;', 'shadcn/no-raw-colors'],
      ['arbitrary', 'import "./local.css"; export const V=()=> <div className="fixture-owned p-[13px]"/>;', 'shadcn/no-arbitrary-values'],
      ['semantic-override', 'import "./local.css"; export const V=()=> <div className="fixture-owned" style={{"--g-action":"var(--g-soft)"}}/>;', 'ds/no-unowned-custom-properties'],
      ['mask-override', 'import "../components/brand-mark.css"; export const V=()=> <div className="hangyeol-brand-symbol" style={{"--hangyeol-brand-mask":"var(--g-soft)"}}/>;', 'ds/no-unowned-custom-properties'],
    ];
    for (const [label, code, rule] of cases) { put('case.tsx', code); lint(label, 1, rule); }
    for (const [label, specifier, error] of [
      ['missing-css', './missing.css', /ENOENT/],
      ['escape', '../../../outside.css', /escapes sourceRoot/],
      ['remote', 'https://example.invalid/file.css', /Unsupported CSS import/],
      ['query', './local.css?inline', /Unsafe CSS import/],
    ]) { put('case.tsx', `import ${JSON.stringify(specifier)};export {};`); lint(label, 1, null, error); }
    put('case.tsx', 'import "./linked.css";export {};');
    fs.symlinkSync(path.join(dir, 'local.css'), path.join(dir, 'linked.css'));
    lint('symlink', 1, null, /symlink/);
    fs.unlinkSync(path.join(dir, 'linked.css'));
    put('case.tsx', 'import "./malformed.css";export {};');
    put('malformed.css', '@import "./local.css" nonsense(');
    lint('malformed-css', 1, null, /Unclosed|malformed|bracket/);
    fs.unlinkSync(path.join(dir, 'malformed.css'));
    put('case.tsx', 'export {};');
    fs.appendFileSync(brand, '\nexport const Bad=()=> <div style={{"--g-action":"var(--g-soft)"}}/>;\n');
    const changed = lint('edited-canonical-owner', 1, 'ds/no-unowned-custom-properties');
    assert.deepEqual(changed.inlinePropertyOwners, []);
    assert.equal(changed.diagnostics.filter(item => item.file.endsWith('/brand-mark.tsx') && item.rule === 'ds/no-unowned-custom-properties').length, 3);
  } finally {
    fs.writeFileSync(brand, original);
    fs.rmSync(dir, {recursive: true});
  }
  assert.deepEqual(lint('restored', 0).diagnostics, []);
});

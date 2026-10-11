import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {parse} from '@typescript-eslint/parser';
import {createCSSDiscovery, inlinePropertyOwnership} from '../src/tools/lint-css.mjs';
import {staticClasses} from '../src/tools/lint-policy.mjs';
import {hash} from '../src/tools/safety.mjs';

const repo = fileURLToPath(new URL('../../../', import.meta.url));
const core = path.join(repo, 'packages/core');
const evidence = process.env.CORE07_EVIDENCE_DIR || process.env.TMPDIR;
assert.ok(evidence && path.isAbsolute(evidence) && !path.resolve(evidence).startsWith(repo));
const ast = text => parse(text, {sourceType: 'module', ecmaFeatures: {jsx: true}, loc: true});
const manifest = JSON.parse(fs.readFileSync(path.join(core, 'payload/manifest.json')));
const boundary = {root: core, manifest};
function fixture(compiler = false) {
  const root = fs.mkdtempSync(path.join(evidence, 'css-lint-'));
  const config = {schemaVersion: 1, sourceRoot: 'ui/system', stylePath: 'styles/theme.css', alias: '@hangyeol', installed: {}};
  const put = (name, content) => { const target = path.join(root, name); fs.mkdirSync(path.dirname(target), {recursive: true}); fs.writeFileSync(target, content); return target; };
  const ui = (name, content) => put(config.sourceRoot + '/' + name, content);
  const install = names => { for (const name of names) { ui(name, fs.readFileSync(path.join(core, 'payload/source', name))); config.installed[config.sourceRoot + '/' + name] = {hash: manifest.files[name].hash, version: manifest.version}; } };
  install(['foundation/theme.css', 'lib/cn.ts', 'primitives/button.tsx']);
  put('package.json', JSON.stringify({name: 'css-discovery-fixture', private: true, type: 'module'}));
  put(config.stylePath, '@import "tailwindcss/theme.css";\n@import "tailwindcss/utilities.css";\n@import "../ui/system/foundation/theme.css";\n');
  if (compiler) {
    const require = createRequire(import.meta.url);
    fs.cpSync(path.dirname(require.resolve('tailwindcss/package.json')), path.join(root, 'node_modules/tailwindcss'), {recursive: true});
  }
  function lint() {
    put('hangyeol.json', JSON.stringify(config));
    const before = snapshot(root);
    const wrapper = `import fs from 'node:fs';import {runLint} from ${JSON.stringify(pathToFileURL(path.join(core, 'src/tools/lint.mjs')).href)};const root=${JSON.stringify(core)};process.exitCode=await runLint([],{root,pkg:JSON.parse(fs.readFileSync(root+'/package.json')),manifest:JSON.parse(fs.readFileSync(root+'/payload/manifest.json'))});`;
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', wrapper], {cwd: root, encoding: 'utf8', maxBuffer: 8e6});
    assert.deepEqual(snapshot(root), before, 'lint is read-only');
    const output = {...result, report: result.stdout.startsWith('{') ? JSON.parse(result.stdout) : null};
    fs.writeFileSync(path.join(evidence, `css-lint-${process.hrtime.bigint()}.json`), JSON.stringify({root, exit: result.status, stdout: result.stdout, stderr: result.stderr}, null, 2));
    return output;
  }
  return {root, config, ui, put, install, lint, discover: text => createCSSDiscovery(root, config)('view.tsx', ast(text))};
}
function snapshot(root) {
  const result = {};
  function visit(dir) { for (const entry of fs.readdirSync(dir, {withFileTypes: true})) { const full = path.join(dir, entry.name), stat = fs.lstatSync(full, {bigint: true}); result[path.relative(root, full)] = {mtime: String(stat.mtimeNs), mode: String(stat.mode), ...(entry.isFile() ? {hash: hash(fs.readFileSync(full))} : {}), ...(entry.isSymbolicLink() ? {link: fs.readlinkSync(full)} : {})}; if (entry.isDirectory()) visit(full); } }
  visit(root); return result;
}

test('variant/size values, not quoted or computed keys or type literals, are static class candidates', () => {
  const values = staticClasses(ast(`const variants = {'not-a-class': 'flex', ['also-not-a-class']: { 'nested-key': 'block' }, selected: ok ? 'grid' : 'hidden'} as const;
const sizes = {'size-key': 'p-4'} satisfies Record<'type-key', string>;
export const View = () => <div className={cn('gap-2', 'unknown-left' || 'inline')}/>;`)).map(item => item.value);
  assert.deepEqual(new Set(values), new Set(['flex', 'block', 'grid', 'hidden', 'p-4', 'gap-2', 'unknown-left', 'inline']));
});

test('CSS AST discovery follows only module imports and their bounded selector/state/media graph', () => {
  const f = fixture();
  f.ui('owner.css', '@import "./shared.css";\n@media (min-width: 1rem) { .owner:hover, :where(.group) > .child[data-kind=".attribute-decoy"] { color: var(--g-action); content: ".declaration-decoy"; } }\n/* .comment-decoy {} */\n.owner:not(.negation-only) { display:block }\n@supports (display:grid) { .escaped\\:state { display:grid } }\n@keyframes motion { from { --value: ".animation-decoy"; } }');
  f.ui('shared.css', '@import url("./owner.css"); @layer owner { .shared:focus-visible { display:block; } }');
  f.ui('unrelated.css', '.unrelated {display:block}');
  const result = f.discover('import "@hangyeol/owner.css";');
  assert.deepEqual([...result.classes].sort(), ['child', 'escaped:state', 'group', 'owner', 'shared']);
  assert.deepEqual(result.dependencies, ['owner.css', 'shared.css']);
  assert.equal(f.discover('export const View=()=> <div/>;').classes.size, 0);
  const sharedDiscovery = createCSSDiscovery(f.root, f.config);
  assert.ok(sharedDiscovery('owner.tsx', ast('import "./owner.css";')).classes.has('owner'));
  assert.equal(sharedDiscovery('consumer.tsx', ast('export {};')).classes.size, 0, 'a cache is not a global allowlist');
});

test('CSS import escapes, reserved paths, URLs, malformed/escaped paths and symlinks are refused', () => {
  const f = fixture();
  f.ui('owner.css', '.owner {display:block}');
  f.put('outside.css', '.outside {display:block}');
  const specs = ['../../outside.css', '/absolute.css', 'https://example.invalid/a.css', 'data:text/css,.x{}.css', './owner.css?inline', './owner.css#x', './%2e%2e/outside.css', './node_modules/file.css', './.git/file.css', '@hangyeol/../owner.css', './missing.css'];
  for (const spec of specs) assert.throws(() => f.discover(`import ${JSON.stringify(spec)};`), /CSS|ENOENT|unsafe/i, spec);
  assert.throws(() => f.discover(String.raw`import './own\u0065r.css';`), /Escaped CSS/);
  for (const code of ['import type {} from "./owner.css";', 'import {type Style} from "./owner.css";']) assert.throws(() => f.discover(code), /Type-only CSS/);
  const link = f.ui('link-target.css', '.linked {display:block}');
  fs.symlinkSync(link, path.join(f.root, f.config.sourceRoot, 'linked.css'));
  assert.throws(() => f.discover('import "./linked.css";'), /symlink/);
  for (const css of ['@import "../../outside.css";', '@import "https://example.invalid/a.css";', '@import "./own\\65r.css";', '@import "./owner.css" garbage;', '@import url("./owner.css";', '@media print { @import "./owner.css"; }', '.first {} @import "./owner.css";', '@plugin "./evil.mjs";', '@config "./evil.mjs";', '@reference "./owner.css";', '.broken {']) {
    f.ui('entry.css', css);
    assert.throws(() => f.discover('import "./entry.css";'), /CSS|Unclosed|bracket/i, css);
  }
});

test('CSS discovery has graph/size bounds rather than unlimited recursive host reads', () => {
  const f = fixture();
  for (let i = 0; i < 35; i++) f.ui(`depth-${i}.css`, i < 34 ? `@import "./depth-${i + 1}.css";` : '.deep {display:block}');
  assert.throws(() => f.discover('import "./depth-0.css";'), /bounded discovery/);
  f.ui('large.css', ' '.repeat(1024 * 1024 + 1));
  assert.throws(() => f.discover('import "./large.css";'), /file\/size/);
});

test('inline property contract binds exact canonical installed owner AND imported stylesheet bytes', () => {
  const f = fixture();
  const names = ['components/brand-mark.tsx', 'components/brand-mark.css'];
  f.install(names);
  const source = fs.readFileSync(path.join(f.root, f.config.sourceRoot, names[0]), 'utf8');
  const getCSS = () => createCSSDiscovery(f.root, f.config)(names[0], ast(source));
  const owned = (relative = names[0], css = getCSS()) => inlinePropertyOwnership(boundary, f.config, relative, css, f.root);
  assert.deepEqual(owned(), ['--hangyeol-brand-mask']);
  assert.deepEqual(owned('consumer.tsx'), []);
  assert.deepEqual(owned(names[0], f.discover('export {};')), []);
  f.ui(names[0], source + '\n// edited owner\n');
  assert.deepEqual(owned(), []);
  f.install(names);
  f.ui(names[1], fs.readFileSync(path.join(core, 'payload/source', names[1]), 'utf8') + '\n.consumer {color:var(--g-action)}');
  assert.deepEqual(owned(), []);
  f.install(names);
  delete f.config.installed[f.config.sourceRoot + '/' + names[1]];
  assert.deepEqual(owned(), []);
  f.install(names);
  f.config.installed[f.config.sourceRoot + '/' + names[0]].version = 'wrong-version';
  assert.deepEqual(owned(), []);
  f.install(names);
  f.config.installed[f.config.sourceRoot + '/' + names[0]].hash = '0'.repeat(64);
  assert.deepEqual(owned(), []);
});

test('actual lint accepts imported class values but rejects typos, absent imports and unrelated selectors', () => {
  const f = fixture(true);
  f.ui('owner.css', '@media print { .owned:hover {display:block} }');
  f.ui('unrelated.css', '.unrelated {display:block}');
  f.ui('view.tsx', 'import "./owner.css"; const variants = {"not-a-class": "owned"}; export const View=()=> <div className="owned"/>;');
  let result = f.lint();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.report.compiler.mode, 'actual');
  assert.ok(result.report.cssSources.some(item => item.file.endsWith('view.tsx') && item.classes.includes('owned')));
  f.ui('another.tsx', 'import "./owner.css"; export const Other=()=> <div className="owned"/>;');
  for (const code of ['import "./owner.css"; export const View=()=> <div className="ownedd unrelated"/>;', 'export const View=()=> <div className="owned"/>;']) {
    f.ui('view.tsx', code); result = f.lint();
    assert.equal(result.status, 1, result.stderr);
    assert.ok(result.report.diagnostics.some(item => item.rule === 'core/unknown-class'));
  }
  f.ui('view.tsx', 'import "./missing.css"; export const View=()=> <div className="owned"/>;');
  result = f.lint(); assert.equal(result.status, 1); assert.match(result.stderr, /ENOENT/);
});

test('real CSS presence does not waive restyling, colors, arbitrary values or semantic/custom property enforcement', () => {
  const f = fixture(true);
  f.ui('owner.css', '.owned {color:var(--g-action); mask:var(--hangyeol-brand-mask)} .bg-red-600 {display:block} .p-\\[13px\\] {display:block}');
  f.ui('view.tsx', `import './owner.css'; import {Button} from './primitives/button';
export const View=()=> <><Button className="p-8"/><Button className="owned"/><div className="owned bg-red-600 p-[13px]" style={{'--g-action':'var(--g-soft)', '--hangyeol-brand-mask':'var(--g-soft)', '--consumer-property':'1rem'}}/></>;`);
  const result = f.lint();
  assert.equal(result.status, 1, result.stderr);
  for (const rule of ['shadcn/no-restyle', 'shadcn/no-raw-colors', 'shadcn/no-arbitrary-values', 'ds/no-unowned-custom-properties']) assert.ok(result.report.diagnostics.some(item => item.rule === rule), rule);
  assert.equal(result.report.diagnostics.filter(item => item.rule === 'ds/no-unowned-custom-properties').length, 3);
  assert.ok(result.report.diagnostics.some(item => item.rule === 'shadcn/no-restyle' && item.message.includes('owned')), 'imported CSS presence never permits unknown appearance classes on Button');
  assert.deepEqual(result.report.inlinePropertyOwners, []);
});

test('canonical BrandMark passes; copied/edited owner cannot gain mask or semantic override authorization', () => {
  const f = fixture(true);
  const names = ['foundation/theme.tsx', 'components/brand-mark.tsx', 'components/brand-mark.css'];
  f.install(names);
  let result = f.lint();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.report.inlinePropertyOwners, [{file: 'ui/system/components/brand-mark.tsx', properties: ['--hangyeol-brand-mask']}]);
  f.ui('consumer.tsx', `import './components/brand-mark.css';export const View=()=> <div className="hangyeol-brand-symbol" style={{'--hangyeol-brand-mask':'var(--g-soft)','--g-action':'var(--g-soft)'}}/>;`);
  result = f.lint(); assert.equal(result.status, 1, result.stderr);
  assert.equal(result.report.diagnostics.filter(item => item.file.endsWith('consumer.tsx') && item.rule === 'ds/no-unowned-custom-properties').length, 2);
  const owner = path.join(f.root, f.config.sourceRoot, 'components/brand-mark.tsx');
  fs.appendFileSync(owner, '\nexport const Bad=()=> <div style={{"--g-action":"var(--g-soft)"}}/>;\n');
  result = f.lint(); assert.equal(result.status, 1, result.stderr);
  assert.deepEqual(result.report.inlinePropertyOwners, []);
  assert.equal(result.report.diagnostics.filter(item => item.file.endsWith('brand-mark.tsx') && item.rule === 'ds/no-unowned-custom-properties').length, 3);
});

test('canonical geometry inputs transfer narrowly and edited owner bytes revoke all privileges', () => {
 const f=fixture(true);
 const names=['primitives/progress.tsx','components/bottom-cta.tsx','components/bottom-sheet.tsx','components/text-field.tsx'];
 f.install(names);
 let result=f.lint();assert.equal(result.status,0,result.stderr);
 assert.ok(result.report.inlinePropertyOwners.some(x=>x.file.endsWith('/progress.tsx')&&x.properties.length===1&&x.properties[0]==='--g-progress-width'));
 const owner='components/text-field.tsx',original=fs.readFileSync(path.join(f.root,f.config.sourceRoot,owner),'utf8');
 // Keep the ORIGINAL installation hash: that metadata alone never authorizes edited code.
 f.ui(owner,original.replace('shrink-0 whitespace-nowrap','p-8'));
 result=f.lint();assert.equal(result.status,1,result.stderr);
 assert.ok(result.report.diagnostics.some(x=>x.file.endsWith('/text-field.tsx')&&x.rule==='shadcn/no-restyle'));
 f.install([owner]);
 const progress=fs.readFileSync(path.join(f.root,f.config.sourceRoot,'primitives/progress.tsx'),'utf8');
 f.ui('primitives/progress.tsx',progress+'\n// consumer edited\n');
 result=f.lint();assert.equal(result.status,1,result.stderr);
 for(const rule of ['ds/no-unowned-custom-properties','shadcn/no-arbitrary-values'])assert.ok(result.report.diagnostics.some(x=>x.file.endsWith('/progress.tsx')&&x.rule===rule));
 f.install(['primitives/progress.tsx']);
 f.ui('consumer.tsx',`import {Button} from './primitives/button'; export const Bad=()=> <Button className="w-[var(--g-progress-width)]" style={{'--g-progress-width':'20%'}}/>;`);
 result=f.lint();assert.equal(result.status,1,result.stderr);
 for(const rule of ['ds/no-unowned-custom-properties','shadcn/no-arbitrary-values'])assert.ok(result.report.diagnostics.some(x=>x.file.endsWith('/consumer.tsx')&&x.rule===rule));
});

test('imported CSS does not replace the actual compiler requirement', () => {
  const f = fixture();
  f.ui('owner.css', '.owned {display:block}');
  f.ui('view.tsx', 'import "./owner.css"; export const View=()=> <div className="owned"/>;');
  const result = f.lint();
  assert.equal(result.status, 2, result.stderr);
  assert.equal(result.report.compiler.mode, 'unavailable');
  assert.equal(result.report.compiler.fallback, 'none');
});

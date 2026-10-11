import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import postcss from 'postcss';
import { safeTarget, hash } from './tools/safety.mjs';
import { validateViteConfig, validateHostScripts, validateTypeScriptAliases } from './tools/host-config.mjs';

const viteNames = ['vite.config.js', 'vite.config.mjs', 'vite.config.ts', 'vite.config.cjs', 'vite.config.mts', 'vite.config.cts'];
const reserved = new Set(['node_modules', '.git', '.hangyeol-backups', '.hangyeol-transactions', 'hangyeol.json', 'package.json', 'package-lock.json']);

// Data/files only. No host modules, repair, npm, or inferred update operation.
export async function runDoctor(args, boundary) {
  const root = process.cwd(), checks = [];
  const report = {
    operation: 'doctor', readOnly: true, package: { name: boundary.pkg.name, version: boundary.pkg.version, integrity: 'verified' },
    config: null, checks, capabilities: { repair: false, update: false },
    limitations: ['Static installed records and connections; not build, CSS cascade, HTTP/font load, browser/AT or update acceptance.'],
  };
  const add = (code, status, target, cause, action, extra = {}) => checks.push({ code, status, path: target, cause, action, ...extra });
  const error = (code, target, cause, action = 'Review this file explicitly; doctor performs no repair.') => add(code, 'error', target, cause, action);
  function target(name, label = name) {
    try { return safeTarget(root, name); }
    catch { throw Object.assign(Error('Unsafe path, symlink, or non-directory ancestry; no outside target read.'), { code: 'path.unsafe', target: label }); }
  }
  function bytes(name, code) {
    const full = target(name);
    if (!fs.existsSync(full)) { error(code + '.missing', name, 'Required file is missing.', 'Restore the identified owned file from a verified source; review init/add explicitly.'); return null; }
    const stat = fs.statSync(full);
    if (!stat.isFile() || stat.size > 2e6) { error(code + '.invalid', name, 'Expected a regular file of at most 2 MB.'); return null; }
    return fs.readFileSync(full);
  }
  function json(name, code) {
    const value = bytes(name, code);
    if (value === null) return null;
    try {
      const data = JSON.parse(value);
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error('Expected object');
      return data;
    }
    catch { error(code + '.json', name, 'Expected a valid JSON object; no code was evaluated.'); return null; }
  }
  function finish(uninitialized = false) {
    const bad = checks.some(c => c.status === 'error'), unsupported = checks.some(c => c.status === 'unsupported');
    report.status = uninitialized ? 'uninitialized' : bad ? 'error' : unsupported ? 'unsupported' : 'ok';
    report.exit = bad ? 1 : unsupported ? 2 : 0;
    console.log(JSON.stringify(report, null, 2));
    for (const c of checks.filter(c => ['error', 'unsupported'].includes(c.status))) console.error(`${c.path}: [${c.code}] ${c.cause} ${c.action}`);
    return report.exit;
  }
  try {
    if (args.length) { add('doctor.arguments', 'unsupported', 'doctor', 'Only hangyeol doctor is supported.', 'Run the installed local bin without doctor options.'); return finish(); }
    const configFile = target('hangyeol.json');
    if (!fs.existsSync(configFile)) { error('config.missing', 'hangyeol.json', 'Consumer is not initialized.', 'Review host prerequisites and run the installed local bin init explicitly.'); return finish(true); }
    const config = json('hangyeol.json', 'config');
    if (!config) return finish();
    if (config.schemaVersion !== 1 || !config.installed || typeof config.installed !== 'object' || Array.isArray(config.installed) || !Array.isArray(config.components) || config.components.some(c => typeof c !== 'string')) {
      error('config.schema', 'hangyeol.json', 'Expected schemaVersion 1, installed record object and component name array.'); return finish();
    }
    for (const key of ['sourceRoot', 'stylePath', 'publicRoot', 'fontPath']) {
      const value = config[key];
      if (typeof value !== 'string' || !/^[a-zA-Z0-9_./-]+$/.test(value) || value.split('/').some(p => reserved.has(p.toLowerCase()) || viteNames.includes(p.toLowerCase()) || /^tsconfig(?:\.[\w-]+)*\.json$/i.test(p))) {
        error('config.path', `hangyeol.json#${key}`, 'Expected a safe local generated path, not a reserved host target.'); return finish();
      }
      target(value, `hangyeol.json#${key}`);
    }
    if (typeof config.basePath !== 'string' || !/^\/(?:[a-zA-Z0-9_/-]*\/)?$/.test(config.basePath) || config.basePath.includes('..') || config.basePath.startsWith('//')) {
      error('config.base', 'hangyeol.json#basePath', 'Expected a same-origin root-relative base ending in /; leading // is unsupported.'); return finish();
    }
    if (config.alias !== null && (typeof config.alias !== 'string' || !/^@[a-zA-Z][\w/-]*$/.test(config.alias))) { error('config.alias', 'hangyeol.json#alias', 'Expected null or a literal @name path.'); return finish(); }
    const overlap = (a, b) => a === b || a.startsWith(b + '/') || b.startsWith(a + '/');
    if (overlap(config.sourceRoot.toLowerCase(), config.publicRoot.toLowerCase()) || overlap(config.stylePath.toLowerCase(), config.publicRoot.toLowerCase()) || config.stylePath === config.sourceRoot) { error('config.overlap', 'hangyeol.json', 'Source/style/public paths overlap unsafely.'); return finish(); }
    report.config = Object.fromEntries(['sourceRoot', 'stylePath', 'publicRoot', 'fontPath', 'basePath', 'alias'].map(k => [k, config[k]]));
    if (config.version !== boundary.pkg.version || config.tool?.package !== boundary.pkg.name || config.tool?.version !== boundary.pkg.version) error('version.config', 'hangyeol.json', 'Configured tool/version does not identify this installed candidate.', 'Review the identified installation/archive; no update engine is supported.');
    if (config.integration && !isDeepStrictEqual(Object.fromEntries(Object.keys(report.config).map(k => [k, config.integration.settings?.[k]])), report.config)) error('config.integration', 'hangyeol.json#integration.settings', 'Recorded integration path/alias settings differ from current settings.');

    const pkg = json('package.json', 'package'), lock = json('package-lock.json', 'lock');
    const installedPkg = json('node_modules/@orderthan31/hangyeol-core/package.json', 'core');
    const pin = pkg?.devDependencies?.['@orderthan31/hangyeol-core'], record = lock?.packages?.['node_modules/@orderthan31/hangyeol-core'];
    if (!pin || typeof pin !== 'string' || !(pin.startsWith('file:') && pin.length > 5 || pin === boundary.pkg.version) || pkg?.dependencies?.['@orderthan31/hangyeol-core']) error('core.dev-pin', 'package.json', 'Core must be an exact devDependency, separate from UI runtime dependencies.');
    if (!record || record.version !== boundary.pkg.version || record.dev !== true || record.link || typeof record.integrity !== 'string' || !/^sha512-[A-Za-z0-9+/]{86}==$/.test(record.integrity) || typeof record.resolved !== 'string' || !record.resolved || lock?.packages?.['']?.devDependencies?.['@orderthan31/hangyeol-core'] !== pin || installedPkg?.name !== boundary.pkg.name || installedPkg?.version !== boundary.pkg.version) error('core.identity', 'package-lock.json', 'Physical core/version/dev pin/lock integrity identity is missing or inconsistent.');
    else add('core.identity', 'ok', 'node_modules/@orderthan31/hangyeol-core/package.json', 'Physical installed package, dev pin and lock identify this version.', 'No action.', { version: record.version, integrity: record.integrity });

    const manifest = boundary.manifest, sourceNames = new Set(manifest.common), visited = new Set();
    function visit(name) {
      if (visited.has(name)) return;
      const item = Object.hasOwn(manifest.items, name) ? manifest.items[name] : null;
      if (!item) { error('component.unknown', 'hangyeol.json#components', 'An installed component name is absent from this registry.', 'Review actual installed records; no inferred migration or update.'); return; }
      visited.add(name); for (const edge of item.requires) visit(edge); for (const file of item.files) sourceNames.add(file);
    }
    for (const name of config.components) visit(name);
    const runtime = { react: null, 'react-dom': null, ...manifest.runtime };
    const types = { ...manifest.types };
    for (const name of visited) { Object.assign(runtime, manifest.items[name].runtime); Object.assign(types, manifest.items[name].types); }
    const groups = { runtime, build: { vite: null, ...manifest.build }, types };
    report.dependencies = { runtime: [], build: [], types: [], coreTools: [] };
    const declared = { ...pkg?.dependencies, ...pkg?.devDependencies };
    for (const [kind, dependencies] of Object.entries(groups)) for (const [name, expected] of Object.entries(dependencies)) {
      const value = declared[name], metadataPath = `node_modules/${name}/package.json`, metadata = json(metadataPath, 'dependency');
      if (typeof value !== 'string') error('dependency.declared', 'package.json', `Required ${kind} dependency ${name} is not declared.`, 'Review and install dependencies explicitly outside doctor.');
      const supported = expected ? value === expected && metadata?.version === expected : name === 'vite' ? typeof value === 'string' && value.replace(/^\^/, '') === metadata?.version : /^\^?19\./.test(value ?? '') && /^19\./.test(metadata?.version ?? '');
      if (typeof value === 'string' && metadata && !supported) error('dependency.version', metadataPath, `${kind} dependency ${name} does not match the supported declared/installed version.`, 'Review exact adapter pins or React 19 explicitly; no upgrade/downgrade is performed.');
      if (metadata && lock?.packages?.[`node_modules/${name}`]?.version !== metadata.version) error('dependency.lock', 'package-lock.json', `Lock version for ${name} differs from physical dependency metadata.`, 'Review package/lock/install state explicitly; doctor runs no npm.');
      report.dependencies[kind].push({ name, expected: expected ?? (name === 'vite' ? 'declared installed Vite version' : 'React 19'), status: metadata && supported && typeof value === 'string' ? 'present' : 'problem' });
    }
    const toolRequire = createRequire(path.join(boundary.root, 'package.json'));
    for (const [name, expected] of Object.entries(boundary.pkg.dependencies)) {
      const metadata = JSON.parse(fs.readFileSync(toolRequire.resolve(`${name}/package.json`)));
      if (metadata.version !== expected) error('core.tool-version', 'node_modules/@orderthan31/hangyeol-core/package.json', `Installed core tool dependency ${name} does not match its pinned version.`);
      report.dependencies.coreTools.push({ name, version: expected, license: metadata.license, role: 'development tool; not requested UI runtime' });
    }
    const expected = new Map([...sourceNames].map(n => [`${config.sourceRoot}/${n}`, { kind: 'source', template: manifest.files[n].hash }]));
    for (const [name, asset] of Object.entries(manifest.assets)) expected.set(`${config.publicRoot}/${config.fontPath}/${name}`, { kind: 'asset', template: asset.hash });
    expected.set(config.stylePath, { kind: 'style' }); expected.set(`${config.sourceRoot}/foundation/fonts.css`, { kind: 'style' });
    const recordNames = new Set([...Object.keys(manifest.files).map(n => `${config.sourceRoot}/${n}`), ...expected.keys(), ...viteNames, 'tsconfig.json']);
    for (const [name, installed] of Object.entries(config.installed)) {
      if (!recordNames.has(name)) { error('record.path', 'hangyeol.json#installed', 'Install record names an unrecognized target; it was not read.'); continue; }
      target(name);
      if (!installed || typeof installed !== 'object' || !/^[a-f0-9]{64}$/.test(installed.hash ?? '') || installed.version !== boundary.pkg.version) error('record.invalid', name, 'Install record needs a SHA256 hash and matching candidate version.');
    }
    for (const [name, value] of expected) {
      const installed = config.installed[name];
      if (!installed) error('record.missing', name, 'Required initialized source/asset/integration record is missing.');
      const local = bytes(name, value.kind);
      if (!local) continue;
      const actual = hash(local);
      if (value.kind === 'asset' && actual !== value.template) error('asset.hash', name, 'Font/license/provenance bytes differ from the packaged immutable asset.', 'Review actual asset provenance; doctor never replaces it.');
      else if (installed && actual !== installed.hash) add(value.kind + '.edited', 'info', name, 'Local consumer bytes differ from the recorded installation. This alone is not corruption.', 'Keep authored edits; independently review syntax/connections as needed.', { hash: actual, recordedHash: installed.hash });
      else add(value.kind + '.present', 'ok', name, 'Required owned file exists.', 'No action.', { hash: actual });
    }
    function css(name) {
      const value = bytes(name, 'style');
      if (!value) return null;
      try { return postcss.parse(value, { from: name }); }
      catch (cause) { error('connection.css', name, `Invalid CSS at line ${cause.line ?? 1}; no code was evaluated.`); return null; }
    }
    css(`${config.sourceRoot}/foundation/theme.css`);
    const style = css(config.stylePath);
    if (style) {
      const imports = style.nodes.filter(n => n.type === 'atrule' && n.name === 'import').map(n => n.params.match(/^(['"])([^'"\\]+)\1(?:\s|$)/)?.[2]);
      const relative = specifier => specifier?.startsWith('.') ? path.posix.normalize(path.posix.join(path.posix.dirname(config.stylePath), specifier)) : null;
      const required = [`${config.sourceRoot}/foundation/theme.css`, `${config.sourceRoot}/foundation/fonts.css`];
      if (!['tailwindcss/theme.css', 'tailwindcss/utilities.css'].every(n => imports.filter(i => i === n).length === 1) || !required.every(n => imports.some(i => relative(i) === n))) error('connection.stylesheet', config.stylePath, 'Missing/ambiguous direct Tailwind theme/utilities or configured local theme/fonts imports.', 'Retain the host body and explicitly align the local integration imports.');
      else add('connection.stylesheet', 'ok', config.stylePath, 'Direct configured import declarations match; target files are reported separately.', 'No action.');
      const scans = style.nodes.filter(n => n.type === 'atrule' && n.name === 'source').map(n => n.params.match(/^(['"])([^'"\\]+)\1$/)?.[2]);
      if (!scans.some(n => relative(n) === config.sourceRoot)) error('connection.source', config.stylePath, 'No direct literal @source scans the configured sourceRoot.', 'Align @source with the actual editable source root.');
      else add('connection.source', 'ok', config.stylePath, 'Configured sourceRoot has a direct literal @source.', 'No action.');
      style.walkAtRules(node => {
        if (node.name === 'tailwind' || node.name === 'import' && /(?:preflight|normalize|reset|^['"]tailwindcss(?:\/index\.css)?['"])/i.test(node.params)) error('connection.reset', config.stylePath, `Reset/legacy Tailwind import or directive at line ${node.source?.start?.line ?? 1}.`, 'Split reset integration explicitly; doctor does not rewrite host CSS.');
      });
    }
    const fontsPath = `${config.sourceRoot}/foundation/fonts.css`, fonts = css(fontsPath);
    if (fonts) {
      const faces = [];
      fonts.walkAtRules('font-face', node => {
        const declarations = Object.fromEntries((node.nodes ?? []).filter(d => d.type === 'decl').map(d => [d.prop, d.value]));
        if (declarations['font-family']?.replace(/^['"]|['"]$/g, '') === 'Pretendard') faces.push(declarations);
      });
      const connections = [['Regular', 400], ['Medium', 500], ['SemiBold', 600], ['Bold', 700]].map(([name, weight]) => {
        const url = `${config.basePath}${config.fontPath}/Pretendard-${name}.woff2`, matching = faces.filter(f => f['font-weight'] === String(weight) && f['font-style'] === 'normal' && f.src?.match(/^url\((['"])([^'"\\]+)\1\)\s+format\((['"])woff2\3\)$/)?.[2] === url);
        return { weight, url, path: `${config.publicRoot}/${config.fontPath}/Pretendard-${name}.woff2`, matches: matching.length };
      });
      if (faces.length !== 4 || connections.some(f => f.matches !== 1)) error('connection.fonts', fontsPath, 'Pretendard 400/500/600/700 declarations do not match same-origin basePath/fontPath URLs.', 'Align font declarations and configured public assets explicitly; no HTTP or FontFace test is performed.');
      else add('connection.fonts', 'ok', fontsPath, 'Four configured same-origin font URL declarations match; asset bytes are reported separately.', 'No action; serving/font load is separate.', { fonts: connections });
    }
    try { validateHostScripts(pkg?.scripts); }
    catch { add('connection.scripts.unsupported', 'unsupported', 'package.json#scripts', 'Vite script is outside the reviewed direct command subset.', 'Use ordinary vite / vite build / vite preview or obtain explicit host review; no script was run.'); }
    const configs = viteNames.filter(name => fs.existsSync(target(name)));
    if (configs.length !== 1) error('connection.vite', 'vite.config', 'Expected one supported Vite config; missing or ambiguous discovery.', 'Keep one explicit config and align Tailwind/base/public/alias connections manually.');
    else {
      const value = bytes(configs[0], 'host');
      if (value) try {
        validateViteConfig(value.toString(), config);
        add('connection.vite', 'ok', configs[0], 'Static Tailwind plugin, base/publicDir/alias and supported build configuration match.', 'No config module was executed.');
      } catch (cause) {
        const conflict = cause.message.startsWith('Existing Vite ');
        const detail = /\bpublicDir\b/.test(cause.message) ? 'publicDir/publicRoot' : /\bbase\b/.test(cause.message) ? 'base/basePath' : /\balias\b/.test(cause.message) ? 'alias/sourceRoot' : 'Tailwind plugin or adapter grammar';
        add(conflict ? 'connection.vite' : 'connection.vite.unsupported', conflict ? 'error' : 'unsupported', configs[0], `Static ${detail} is conflicting or outside the reviewed adapter subset.`, 'Review this config as data and align it explicitly; no imported module/plugin was executed.');
      }
    }
    if (config.alias) {
      const ts = json('tsconfig.json', 'typescript');
      if (ts) try {
        if (ts.extends || ts.references || ts.compilerOptions?.baseUrl && ts.compilerOptions.baseUrl !== '.') throw Error('Unsupported effective TypeScript config');
        validateTypeScriptAliases(ts.compilerOptions?.paths, config.alias);
        if (!isDeepStrictEqual(ts.compilerOptions.paths[config.alias + '/*'], ['./' + config.sourceRoot + '/*'])) throw Error('Alias target mismatch');
        add('connection.typescript', 'ok', 'tsconfig.json', 'Plain JSON alias points to the actual configured editable source root.', 'No config execution.');
      } catch { error('connection.typescript', 'tsconfig.json', 'Cannot verify the configured alias in the supported plain JSON paths subset.', 'Align alias/sourceRoot explicitly; extends/references or competing aliases require separate host review.'); }
    }
    const sourceRoot = target(config.sourceRoot), sourceFiles = [];
    function scan(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        const name = path.relative(root, path.join(dir, entry.name)).split(path.sep).join('/');
        if (reserved.has(entry.name.toLowerCase())) { error('source.reserved', config.sourceRoot, 'Reserved directory encountered in sourceRoot; its contents were not read.'); continue; }
        const full = target(name);
        if (entry.isDirectory()) scan(full);
        else if (entry.isFile() && /\.tsx?$/.test(entry.name)) sourceFiles.push(name);
      }
    }
    if (fs.existsSync(sourceRoot) && fs.statSync(sourceRoot).isDirectory()) scan(sourceRoot);
    if (!sourceFiles.length || sourceFiles.length > 1000) error('source.coverage', config.sourceRoot, 'Expected 1–1000 TS/TSX files for a bounded source check.');
    else {
      const require = createRequire(path.join(boundary.root, 'package.json'));
      const parserPkg = JSON.parse(fs.readFileSync(require.resolve('@typescript-eslint/parser/package.json')));
      if (parserPkg.version !== boundary.pkg.dependencies['@typescript-eslint/parser']) throw Error('Tool parser version mismatch');
      const { parse } = await import(pathToFileURL(require.resolve('@typescript-eslint/parser')).href);
      const imports = [], before = checks.length;
      function inspectImport(file, node, specifier, typeOnly = false) {
        const line = node.loc?.start.line ?? 1;
        const issue = (code, cause, status = 'error') => add(code, status, file, cause, 'Review the local source import explicitly; no source module was executed.', { line });
        if (typeof specifier !== 'string') { issue('source.import.dynamic', 'Computed module import cannot be certified by static inspection.', 'unsupported'); return; }
        if (!typeOnly && (specifier === boundary.pkg.name || specifier.startsWith(boundary.pkg.name + '/'))) { issue('source.core-runtime', 'Installed core/CLI tools must not be imported by runtime UI.'); return; }
        let local = null;
        if (specifier.startsWith('.')) local = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
        else if (config.alias && (specifier === config.alias || specifier.startsWith(config.alias + '/'))) local = config.sourceRoot + specifier.slice(config.alias.length);
        else if (specifier.startsWith('/') || specifier.includes('\\')) { issue('source.import.outside', 'Source import is not a safe local module specifier.'); return; }
        if (local !== null) {
          if (!(local === config.sourceRoot || local.startsWith(config.sourceRoot + '/'))) { issue('source.import.outside', 'Relative module import escapes configured sourceRoot; no target was read.'); return; }
          const candidates = [local, ...['.ts', '.tsx', '.css', '/index.ts', '/index.tsx'].map(suffix => local + suffix)];
          if (!candidates.some(name => { const full = target(name); return fs.existsSync(full) && fs.statSync(full).isFile(); })) { issue('source.import.missing', 'Literal local module import has no supported TS/TSX/CSS target.'); return; }
        }
        imports.push({ file, line, kind: local === null ? 'external' : 'local', usage: typeOnly ? 'type-only' : 'runtime' });
      }
      function walk(file, node) {
        if (!node || typeof node !== 'object') return;
        if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) && node.source) {
          const typeOnly = node.importKind === 'type' || node.exportKind === 'type' ||
            node.specifiers?.length > 0 && node.specifiers.every(s => s.importKind === 'type' || s.exportKind === 'type');
          inspectImport(file, node, node.source.value, typeOnly);
        }
        if (node.type === 'TSImportEqualsDeclaration' && node.moduleReference?.type === 'TSExternalModuleReference') inspectImport(file, node, node.moduleReference.expression?.value, node.importKind === 'type');
        if (node.type === 'TSImportType') inspectImport(file, node, node.source?.value, true);
        if (node.type === 'ImportExpression') inspectImport(file, node, node.source?.value);
        if (node.type === 'CallExpression' && (node.callee?.type === 'Import' || node.callee?.type === 'Identifier' && node.callee.name === 'require')) inspectImport(file, node, node.arguments[0]?.value);
        for (const value of Object.values(node)) if (Array.isArray(value)) { for (const child of value) if (child?.type) walk(file, child); } else if (value?.type) walk(file, value);
      }
      for (const file of sourceFiles) {
        const value = bytes(file, 'source');
        if (!value) continue;
        try { walk(file, parse(value.toString(), { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true }, loc: true })); }
        catch (cause) {
          if (cause.code === 'path.unsafe') throw cause;
          add('source.parse', 'error', file, 'Local TS/TSX syntax cannot be statically parsed.', 'Review syntax locally; no code was executed.', { line: cause.lineNumber ?? 1 });
        }
      }
      report.coverage = { sourceFiles: sourceFiles.length, imports: imports.length, parser: parserPkg.version, mode: 'static AST; not execution or bundler proof' };
      if (!checks.slice(before).some(c => ['error', 'unsupported'].includes(c.status))) add('source.runtime-separation', 'ok', config.sourceRoot, 'Inspected runtime imports have no core/CLI tool coupling; literal local references, including type-only references, remain in sourceRoot.', 'Static type-only classification is not TypeScript resolution/emission proof; computed paths and broader bundler semantics require separate verification.', { imports });
    }
    return finish();
  } catch (cause) {
    error(cause.code === 'path.unsafe' ? cause.code : 'doctor.read', cause.target ?? 'hangyeol.json', cause.code === 'path.unsafe' ? cause.message : 'Cannot safely read consumer data; no outside path or file content is disclosed.');
    return finish();
  }
}

import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import {safeTarget, hash} from './safety.mjs';

const reserved = new Set(['node_modules', '.git', '.hangyeol-backups', '.hangyeol-transactions']);
const groups = new Set(['media', 'supports', 'layer', 'container', 'scope', 'starting-style']);
// This is an input contract, not inferred authorization from var(--*) references.
// Both installed files must still be byte-identical to their canonical payloads.
const inlineContracts = [{
  file: 'components/brand-mark.tsx', stylesheet: 'components/brand-mark.css',
  properties: ['--hangyeol-brand-mask'],
}];

function cssTarget(root, config, importer, specifier) {
  if (typeof specifier !== 'string' || /[\\%?#\s\x00-\x1f]/.test(specifier)) throw Error(`Unsafe CSS import: ${specifier}`);
  let relative;
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    if (specifier.split('/').some(part => !part)) throw Error(`Unsafe CSS import: ${specifier}`);
    relative = path.posix.normalize(path.posix.join(path.posix.dirname(importer), specifier));
  } else if (config.alias && specifier.startsWith(config.alias + '/')) {
    relative = specifier.slice(config.alias.length + 1);
    if (relative.split('/').some(part => !part || part === '.' || part === '..')) throw Error(`Unsafe CSS alias import: ${specifier}`);
  } else throw Error(`Unsupported CSS import: ${specifier}; use relative sourceRoot CSS`);
  if (relative === '..' || relative.startsWith('../')) throw Error(`CSS import escapes sourceRoot: ${specifier}`);
  if (!relative.endsWith('.css') || relative.split('/').some(part => reserved.has(part.toLowerCase()))) throw Error(`Unsafe CSS target: ${specifier}`);
  return {relative, full: safeTarget(root, config.sourceRoot + '/' + relative)};
}

function importSpecifier(params) {
  // Deliberately bounded grammar: plain string/url imports only. Conditional
  // imports must be expressed through a local stylesheet's grouping at-rules.
  // Reject unsupported syntax rather than guessing paths or fetching resources.
  const match = params.match(/^(?:"([^"\\]+)"|'([^'\\]+)'|url\(\s*(?:"([^"\\]+)"|'([^'\\]+)'|([^\s"'()\\]+))\s*\))\s*$/i);
  if (!match) throw Error(`Unsupported or malformed CSS import: ${params}`);
  return match.slice(1).find(value => value !== undefined);
}

function selectorClasses(selector) {
  const classes = new Set();
  selectorParser(selectors => selectors.walkClasses(node => {
    // A class occurring only in a negation does not style that class. Attribute
    // strings, comments and declaration values are never selector class nodes.
    for (let parent = node.parent; parent; parent = parent.parent) {
      if (parent.type === 'pseudo' && parent.value.toLowerCase() === ':not') return;
    }
    classes.add(node.value);
  })).processSync(selector);
  return classes;
}

export function createCSSDiscovery(root, config) {
  const cache = new Map();
  function stylesheet(target) {
    // Check again even for a cached path: no symlink shortcut through the cache.
    const full = safeTarget(root, config.sourceRoot + '/' + target.relative);
    const stat = fs.statSync(full);
    if (!stat.isFile() || stat.size > 1024 * 1024) throw Error(`Unsupported CSS file/size: ${target.relative}`);
    if (cache.has(target.relative)) return cache.get(target.relative);
    const bytes = fs.readFileSync(full), ast = postcss.parse(bytes, {from: full});
    const result = {classes: new Set(), imports: [], hash: hash(bytes), bytes: bytes.length};
    let importsClosed = false;
    for (const node of ast.nodes) {
      if (node.type === 'comment') continue;
      if (node.type === 'atrule' && node.name.toLowerCase() === 'import') {
        if (importsClosed || node.nodes) throw Error(`Invalid CSS import position: ${target.relative}`);
        result.imports.push(cssTarget(root, config, target.relative, importSpecifier(node.params)));
      } else if (!(node.type === 'atrule' && ['charset', 'layer'].includes(node.name.toLowerCase()) && !node.nodes)) importsClosed = true;
    }
    ast.walkAtRules(node => {
      const name = node.name.toLowerCase();
      if (['plugin', 'config', 'reference'].includes(name)) throw Error(`Unsupported CSS @${name}: ${target.relative}; executable/config discovery is forbidden`);
      if (name === 'import' && node.parent !== ast) throw Error(`Invalid nested CSS import: ${target.relative}`);
    });
    ast.walkRules(rule => {
      for (let parent = rule.parent; parent; parent = parent.parent) {
        if (parent.type === 'atrule' && !groups.has(parent.name.toLowerCase())) return;
      }
      for (const name of selectorClasses(rule.selector)) result.classes.add(name);
    });
    cache.set(target.relative, result);
    return result;
  }
  return function discover(relative, ast) {
    const classes = new Set(), dependencies = [], records = new Map();
    let bytes = 0;
    function visit(target, depth = 0) {
      if (records.has(target.relative)) return;
      if (depth > 32 || records.size >= 128) throw Error('CSS import graph exceeds bounded discovery limit');
      const record = stylesheet(target);
      bytes += record.bytes;
      if (bytes > 8 * 1024 * 1024) throw Error('CSS import graph exceeds bounded byte limit');
      records.set(target.relative, record);
      dependencies.push(target.relative);
      for (const name of record.classes) classes.add(name);
      for (const next of record.imports) visit(next, depth + 1);
    }
    for (const node of ast.body) {
      if (node.type !== 'ImportDeclaration' || typeof node.source.value !== 'string') continue;
      const value = node.source.value;
      if (!/\.css(?:$|[?#])/.test(value)) continue;
      if (node.importKind === 'type' || node.specifiers.length && node.specifiers.every(item => item.importKind === 'type')) throw Error(`Type-only CSS import does not load a stylesheet: ${value}`);
      if (node.source.raw?.includes('\\')) throw Error(`Escaped CSS import is unsupported: ${value}`);
      visit(cssTarget(root, config, relative, value));
    }
    return {classes, dependencies, records};
  };
}

export function canonicalOwner(boundary, config, relative, css, root = process.cwd()) {
  const files = [relative, ...(css?.dependencies ?? [])];
  return files.every(file => {
    const canonical = boundary.manifest.files[file], record = config.installed?.[config.sourceRoot + '/' + file];
    if (!canonical || record?.version !== boundary.manifest.version || record?.hash !== canonical.hash) return false;
    return hash(fs.readFileSync(safeTarget(root, config.sourceRoot + '/' + file))) === canonical.hash
      && hash(fs.readFileSync(path.join(boundary.root, 'payload/source', file))) === canonical.hash;
  });
}

export function inlinePropertyOwnership(boundary, config, relative, css, root = process.cwd()) {
  // Progress owns only a percentage input consumed by its exact width utility;
  // it has no separate owner stylesheet. No semantic token is writable here.
  if (relative === 'primitives/progress.tsx' && canonicalOwner(boundary, config, relative, css, root)) return ['--g-progress-width'];
  const contract = inlineContracts.find(item => item.file === relative);
  if (!contract || !css?.records.has(contract.stylesheet)) return [];
  for (const file of [contract.file, contract.stylesheet]) {
    const canonical = boundary.manifest.files[file], installed = config.installed?.[config.sourceRoot + '/' + file];
    if (!canonical || installed?.version !== boundary.manifest.version || installed?.hash !== canonical.hash) return [];
    const actual = file === contract.stylesheet ? css.records.get(file).hash : hash(fs.readFileSync(safeTarget(root, config.sourceRoot + '/' + file)));
    if (actual !== canonical.hash) return [];
  }
  return [...contract.properties];
}

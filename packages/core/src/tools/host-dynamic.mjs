// Parse a bounded mode/loadEnv callback as data. Never import, execute, or read its environment.
import {parse} from '@typescript-eslint/parser';

export function readDynamicViteConfig(text, unsupported) {
  if (!text.includes('=>')) return null;
  let program;
  try { program = parse(text, {sourceType: 'module'}); }
  catch { return unsupported('invalid Vite configuration syntax'); }
  const imports = new Map();
  const body = program.body;
  if (body.at(-1)?.type !== 'ExportDefaultDeclaration') return unsupported('expected a single default config export');
  for (const node of body.slice(0, -1)) {
    if (node.type !== 'ImportDeclaration' || node.importKind === 'type' || node.attributes?.length || !node.specifiers.length) return unsupported('unreviewed top-level statement/import');
    for (const spec of node.specifiers) {
      if (!['ImportSpecifier', 'ImportDefaultSpecifier'].includes(spec.type) || spec.importKind === 'type') return unsupported('unreviewed import binding');
      const local = spec.local.name;
      if (imports.has(local)) return unsupported('duplicate import binding');
      imports.set(local, {from: node.source.value, name: spec.type === 'ImportDefaultSpecifier' ? 'default' : spec.imported.name});
    }
  }
  const exported = body.at(-1).declaration;
  const isId = (n, name) => n?.type === 'Identifier' && n.name === name;
  const isLiteral = (n, value) => n?.type === 'Literal' && !n.regex && n.value === value;
  const isBinding = (n, from, name) => n?.type === 'Identifier' && imports.get(n.name)?.from === from && imports.get(n.name)?.name === name;
  if (exported?.type !== 'CallExpression' || exported.optional || exported.arguments.length !== 1 || !isBinding(exported.callee, 'vite', 'defineConfig')) return unsupported('expected imported defineConfig');
  const callback = exported.arguments[0];
  // Static configurations continue through the existing reviewed static adapter.
  if (callback.type !== 'ArrowFunctionExpression') return null;
  if (callback.async || callback.params.length !== 1 || callback.body.type !== 'BlockStatement') return unsupported('only the reviewed synchronous mode/loadEnv callback is supported');
  const parameter = callback.params[0];
  if (parameter.type !== 'ObjectPattern' || parameter.properties.length !== 1 || parameter.typeAnnotation) return unsupported('callback parameter must destructure mode only');
  const modeProperty = parameter.properties[0];
  if (modeProperty.type !== 'Property' || modeProperty.computed || modeProperty.kind !== 'init' || !isId(modeProperty.key, 'mode') || modeProperty.value.type !== 'Identifier') return unsupported('ambiguous mode binding');
  const modeName = modeProperty.value.name;
  const statements = callback.body.body;
  if (statements.length !== 2 || statements[0].type !== 'VariableDeclaration' || statements[0].kind !== 'const' || statements[0].declarations.length !== 1 || statements[1].type !== 'ReturnStatement') return unsupported('callback must contain only const loadEnv binding followed by one return');
  const binding = statements[0].declarations[0];
  if (binding.id.type !== 'Identifier' || binding.id.typeAnnotation || imports.has(modeName) || imports.has(binding.id.name) || binding.id.name === modeName || ['Boolean', 'URL', 'import'].includes(modeName) || ['Boolean', 'URL', 'import'].includes(binding.id.name)) return unsupported('shadowed/ambiguous environment binding');
  const envName = binding.id.name, load = binding.init;
  if (load?.type !== 'CallExpression' || load.optional || !isBinding(load.callee, 'vite', 'loadEnv') || load.arguments.length !== 3 || !isId(load.arguments[0], modeName) || !isLiteral(load.arguments[1], '.') || !isLiteral(load.arguments[2], 'VITE_')) return unsupported("reviewed loadEnv is loadEnv(mode, '.', 'VITE_')");
  const member = (n, key) => n?.type === 'MemberExpression' && !n.optional && !n.computed && isId(n.property, key);
  function envString(n) {
    if (n?.type !== 'LogicalExpression' || !['||', '??'].includes(n.operator) || n.right.type !== 'Literal' || typeof n.right.value !== 'string') return null;
    const left = n.left;
    if (left.type !== 'MemberExpression' || left.optional || left.computed || !isId(left.object, envName) || left.property.type !== 'Identifier' || !/^VITE_[A-Z0-9_]+$/.test(left.property.name)) return null;
    return {type: 'env-string', name: left.property.name, fallback: n.right.value, operator: n.operator};
  }
  function methodCall(n, name, args) {
    return n?.type === 'CallExpression' && !n.optional && member(n.callee, name) && n.arguments.length === args;
  }
  function envHosts(n) {
    if (!methodCall(n, 'filter', 1) || !isId(n.arguments[0], 'Boolean') || imports.has('Boolean')) return null;
    const map = n.callee.object;
    if (!methodCall(map, 'map', 1)) return null;
    const arrow = map.arguments[0];
    if (arrow.type !== 'ArrowFunctionExpression' || arrow.async || arrow.params.length !== 1 || arrow.params[0].type !== 'Identifier' || arrow.params[0].typeAnnotation || !methodCall(arrow.body, 'trim', 0) || !isId(arrow.body.callee.object, arrow.params[0].name)) return null;
    const split = map.callee.object;
    if (!methodCall(split, 'split', 1) || !isLiteral(split.arguments[0], ',')) return null;
    const input = envString(split.callee.object);
    return input?.fallback === '' ? {type: 'env-hosts', input} : null;
  }
  function convert(n) {
    if (!n) return unsupported('missing config expression');
    const hosts = envHosts(n), env = envString(n);
    if (hosts) return hosts;
    if (env) return env;
    if (n.type === 'Literal' && !n.regex && !n.bigint && (n.value === null || ['string', 'number', 'boolean'].includes(typeof n.value))) return {type: 'literal', value: n.value};
    if (n.type === 'ObjectExpression') {
      const values = new Map();
      for (const prop of n.properties) {
        if (prop.type !== 'Property' || prop.kind !== 'init' || prop.method || prop.computed || prop.shorthand) return unsupported('spread/getter/computed/shorthand config property');
        const key = prop.key.type === 'Identifier' ? prop.key.name : prop.key.type === 'Literal' && typeof prop.key.value === 'string' ? prop.key.value : null;
        if (key === null || values.has(key)) return unsupported('ambiguous/duplicate config property');
        values.set(key, convert(prop.value));
      }
      return {type: 'object', values};
    }
    if (n.type === 'ArrayExpression') return {type: 'array', values: n.elements.map(convert)};
    if (n.type === 'Identifier') {
      if (!imports.has(n.name) && n.name !== 'import') return unsupported('unreviewed config identifier');
      return {type: 'identifier', name: n.name};
    }
    if (n.type === 'MetaProperty' && isId(n.meta, 'import') && isId(n.property, 'meta')) return {type: 'member', object: {type: 'identifier', name: 'import'}, name: 'meta'};
    if (n.type === 'MemberExpression' && !n.optional && !n.computed && n.property.type === 'Identifier') return {type: 'member', object: convert(n.object), name: n.property.name};
    if (n.type === 'CallExpression' && !n.optional) return {type: 'call', callee: convert(n.callee), args: n.arguments.map(convert)};
    if (n.type === 'NewExpression' && isId(n.callee, 'URL')) return {type: 'new', name: 'URL', args: n.arguments.map(convert)};
    return unsupported(`unreviewed config expression ${n.type}`);
  }
  const result = convert(statements[1].argument);
  if (result.type !== 'object') return unsupported('callback must return one explicit configuration object');
  return {config: result.values, imports, dynamic: true};
}

// Dynamic values are permitted only at the reviewed network option positions.
export function dynamicNetworkTree(node, literalTree) {
  if (node?.type !== 'object') return false;
  for (const [key, value] of node.values) {
    if (key === 'allowedHosts' && value.type === 'env-hosts') continue;
    if (key === 'proxy' && value.type === 'object') {
      for (const [route, proxy] of value.values) {
        if (literalTree(proxy)) continue;
        if (!route.startsWith('/') || route.startsWith('//')) return false;
        if (proxy.type === 'env-string' && proxy.fallback.length) continue;
        if (proxy.type !== 'object') return false;
        for (const [option, setting] of proxy.values) {
          if (option === 'target' && setting.type === 'env-string' && setting.fallback.length) continue;
          if (!literalTree(setting)) return false;
        }
      }
      continue;
    }
    if (!literalTree(value)) return false;
  }
  return true;
}

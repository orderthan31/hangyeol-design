import {readDynamicViteConfig, dynamicNetworkTree} from './host-dynamic.mjs';
// A deliberately bounded Vite adapter. Never import/evaluate host configuration.
// Unsupported syntax is a diagnostic, not a guess about the effective host settings.
function unsupported(detail) {
  throw Error(`Unsupported/ambiguous Vite config: ${detail}. Use a static defineConfig object or the reviewed mode/loadEnv callback, with literal base/publicDir, imported plugin calls and explicit alias mapping; init does not rewrite host JS`);
}
function tokenize(text) {
  const tokens=[];
  for(let i=0;i<text.length;) {
    if(/\s/.test(text[i])) {i++;continue;}
    if(text.startsWith('//',i)) {const end=text.indexOf('\n',i);i=end<0?text.length:end+1;continue;}
    if(text.startsWith('/*',i)) {const end=text.indexOf('*/',i+2);if(end<0)unsupported('unclosed comment');i=end+2;continue;}
    if(text[i]==='"'||text[i]==="'") {
      const quote=text[i++];let value='',closed=false;
      while(i<text.length) {
        let ch=text[i++];
        if(ch===quote) {closed=true;break;}
        if(ch==='\\') {ch=text[i++];if(!['\\','"',"'",'/'].includes(ch))unsupported('escaped/dynamic string');}
        if(ch==='\n'||ch==='\r')unsupported('multiline string');
        value+=ch;
      }
      if(!closed)unsupported('unclosed string');tokens.push({type:'string',value});continue;
    }
    const id=text.slice(i).match(/^[A-Za-z_$][\w$]*/);
    if(id) {tokens.push({type:'id',value:id[0]});i+=id[0].length;continue;}
    const number=text.slice(i).match(/^-?\d+(?:\.\d+)?/);
    if(number) {tokens.push({type:'number',value:number[0]});i+=number[0].length;continue;}
    if('{}[]():,;.'.includes(text[i])) {tokens.push({type:'punct',value:text[i++]});continue;}
    unsupported(`syntax near ${JSON.stringify(text.slice(i,i+20))}`);
  }
  return tokens;
}
function readConfig(text) {
  const dynamic = readDynamicViteConfig(text, unsupported);
  if (dynamic) return dynamic;
  const tokens=tokenize(text),imports=new Map();let i=0;
  const at=v=>tokens[i]?.type!=='string'&&tokens[i]?.value===v;
  function take(v) {if(!at(v))unsupported(`expected ${v}`);return tokens[i++];}
  function identifier() {if(tokens[i]?.type!=='id')unsupported('expected identifier');return tokens[i++].value;}
  function string() {if(tokens[i]?.type!=='string')unsupported('expected literal string');return tokens[i++].value;}
  function bind(local,from,name) {if(imports.has(local))unsupported('duplicate import binding');imports.set(local,{from,name});}
  while(at('import')) {
    take('import');const bindings=[];
    if(tokens[i]?.type==='id') {bindings.push([identifier(),'default']);if(at(','))take(',');}
    if(at('{')) {
      take('{');while(!at('}')) {const name=identifier();let local=name;if(at('as')) {take('as');local=identifier();}bindings.push([local,name]);if(!at(','))break;take(',');}take('}');
    }
    if(!bindings.length)unsupported('side-effect/namespace import');take('from');const from=string();
    for(const [local,name] of bindings)bind(local,from,name);
    if(at(';'))take(';');
  }
  function list(end) {const result=[];while(!at(end)) {result.push(expr());if(!at(','))break;take(',');}take(end);return result;}
  function expr() {
    let node;
    if(at('{')) {
      take('{');const values=new Map();
      while(!at('}')) {
        const key=tokens[i]?.type==='string'?string():identifier();
        if(values.has(key))unsupported(`duplicate property ${key}`);
        take(':');values.set(key,expr());if(!at(','))break;take(',');
      }
      take('}');node={type:'object',values};
    } else if(at('[')) {take('[');node={type:'array',values:list(']')};}
    else if(tokens[i]?.type==='string')node={type:'literal',value:string()};
    else if(tokens[i]?.type==='number')node={type:'literal',value:Number(tokens[i++].value)};
    else if(['true','false','null'].some(at)) {const value=identifier();node={type:'literal',value:JSON.parse(value)};}
    else if(at('new')) {take('new');const name=identifier();take('(');node={type:'new',name,args:list(')')};}
    else {node={type:'identifier',name:identifier()};}
    while(at('.')||at('(')) {
      if(at('.')) {take('.');node={type:'member',object:node,name:identifier()};}
      else {take('(');node={type:'call',callee:node,args:list(')')};}
    }
    return node;
  }
  take('export');take('default');const node=expr();if(at(';'))take(';');if(i!==tokens.length)unsupported('extra statements');
  if(node.type!=='call'||node.callee.type!=='identifier'||imports.get(node.callee.name)?.from!=='vite'||imports.get(node.callee.name)?.name!=='defineConfig'||node.args.length!==1||node.args[0].type!=='object')unsupported('export must be imported defineConfig with a static object');
  return {config:node.args[0].values,imports};
}
function literalTree(node) {
  return node?.type==='literal'||(node?.type==='array'&&node.values.every(literalTree))||(node?.type==='object'&&[...node.values.values()].every(literalTree));
}
export function validateViteConfig(text,settings) {
  const {config,imports,dynamic}=readConfig(text);
  // Even an unused imported module may have side effects when Vite loads it.
  // The existing adapter needs only these bindings; custom/React plugins are
  // outside this reviewed subset, not executed to discover their hooks.
  for(const {from,name} of imports.values())if(!(
    from==='vite'&&(name==='defineConfig'||dynamic&&name==='loadEnv')||
    from==='node:url'&&name==='fileURLToPath'||
    from==='@tailwindcss/vite'&&name==='default'
  ))unsupported(`unreviewed import/plugin ${from} (${name})`);
  for(const [key,node] of config) {
    if(!['base','publicDir','plugins','resolve','build','server','preview','optimizeDeps','css','define'].includes(key))unsupported(`host option ${key} is outside the supported subset`);
    if(!['plugins','resolve'].includes(key)&&!literalTree(node)&&!(dynamic&&['server','preview'].includes(key)&&dynamicNetworkTree(node,literalTree)))unsupported(`dynamic ${key}`);
  }
  // The installer relies on Vite's default disk output and public asset copy.
  // Literal nested options can still disable/redirect those effects; only this
  // small, typed build object is reviewed, not library/SSR/Rollup strategies.
  const build=config.get('build');
  if(build) {
    if(build.type!=='object')unsupported('build must be a static object');
    for(const [key,node] of build.values) {
      if(!['copyPublicDir','write'].includes(key))unsupported(`build.${key} is outside the supported subset; use the default application build`);
      if(node.type!=='literal'||node.value!==true)unsupported(`build.${key} must be omitted or literal true to preserve ${key==='copyPublicDir'?'public assets (fonts/license/provenance)':'production assets on disk'}`);
    }
  }
  for(const [key,expected,fallback] of [['base',settings.basePath,'/'],['publicDir',settings.publicRoot,'public']]) {
    const node=config.get(key);if(node&&node.type!=='literal')unsupported(`nonliteral ${key}`);
    if((node?node.value:fallback)!==expected)throw Error(`Existing Vite ${key} conflicts with configured ${key==='base'?'basePath':'publicRoot'}; align host settings explicitly before init`);
  }
  const plugins=config.get('plugins');
  if(plugins?.type!=='array')unsupported('plugins must be an array of imported calls');
  let tailwind=false;
  for(const node of plugins.values) {
    if(node.type!=='call'||node.callee.type!=='identifier'||!imports.has(node.callee.name))unsupported('plugin must be the reviewed imported Tailwind call');
    const plugin=imports.get(node.callee.name);
    if(plugin.from!=='@tailwindcss/vite'||plugin.name!=='default')unsupported('unreviewed plugin; only the default Tailwind adapter is supported');
    if(node.args.length||tailwind)unsupported('Tailwind plugin options/duplicate calls; use one zero-argument call');tailwind=true;
  }
  if(!tailwind)throw Error('Existing Vite config must actually invoke imported @tailwindcss/vite; init will not rewrite arbitrary config');
  const resolve=config.get('resolve');
  if(resolve&&resolve.type!=='object')unsupported('dynamic resolve');
  if(resolve)for(const [key,node] of resolve.values)if(key!=='alias'&&!literalTree(node))unsupported(`dynamic resolve.${key}`);
  const aliases=resolve?.values.get('alias');
  if(aliases&&aliases.type!=='object')unsupported('alias must be a static object');
  if(aliases) {
    const names=[...aliases.values.keys()];validateAliasNamespaces(names);
    // Match Vite's case-sensitive string alias rule against the actual imports
    // generated by init; unrelated near-prefix names do not intercept them.
    for(const name of names)for(const specifier of ['tailwindcss/theme.css','tailwindcss/utilities.css'])if(specifier===name||specifier.startsWith(name+'/'))unsupported(`alias ${name} intercepts mandatory Tailwind import ${specifier}; remove or rename this alias before init`);
  }
  if(aliases)for(const node of aliases.values.values()) {
    if(node.type==='literal'&&typeof node.value==='string')continue;
    if(!urlAlias(node,imports))unsupported('alias must be a string or imported fileURLToPath(new URL(literal, import.meta.url))');
  }
  if(settings.alias) {
    const actual=urlAlias(aliases?.values.get(settings.alias),imports);
    if(actual!=='./'+settings.sourceRoot)throw Error('Existing Vite alias must map the configured alias to sourceRoot via fileURLToPath(new URL("./sourceRoot", import.meta.url))');
  }
}
function validateAliasNamespaces(names) {
  for(const name of names)if(!/^[\w@~.-]+(?:\/[\w@~.-]+)*$/.test(name)||name.split('/').some(part=>part==='.'||part==='..'))unsupported(`ambiguous alias name ${name}`);
  // Vite's string aliases use case-sensitive exact or slash-prefix matching.
  // Reject overlaps in either ordering instead of depending on first-match order.
  for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++)if(names[i]===names[j]||names[i].startsWith(names[j]+'/')||names[j].startsWith(names[i]+'/'))unsupported(`competing/intercepting aliases ${names[i]} and ${names[j]}`);
}
export function validateTypeScriptAliases(paths,alias) {
  if(!paths||typeof paths!=='object'||Array.isArray(paths))unsupported('ambiguous TypeScript alias paths; use an explicit object');
  const names=[alias];
  for(const key of Object.keys(paths)) {
    if(key===alias+'/*')continue;
    const name=key.endsWith('/*')?key.slice(0,-2):key;
    if(name.includes('*'))unsupported(`ambiguous TypeScript alias pattern ${key}; only exact names or terminal /* are supported`);
    names.push(name);
  }
  validateAliasNamespaces(names);
}
export function validateHostScripts(scripts) {
  function fail(){throw Error('Unsupported Vite host script: use direct vite, vite build or vite preview (dev/preview may use literal --host/--port/--strictPort), optionally after tsc -b or tsc -p tsconfig.json &&. Alternate config/base/root selections and shell wrappers require explicit host review');}
  for(const script of Object.values(scripts||{})) {
    if(typeof script!=='string'||! /\bvite\b/.test(script))continue;
    const direct=script.trim().replace(/^tsc\s+(?:-b|-p\s+tsconfig\.json)\s*&&\s*/, '');
    // No shell parser or script execution: only this explicit token subset.
    if(/[;&|$`"'\\()[\]<>\n\r]/.test(direct))fail();
    const tokens=direct.split(/\s+/);if(tokens.shift()!=='vite')fail();
    let command='dev';if(['build','preview'].includes(tokens[0]))command=tokens.shift();
    while(tokens.length) {
      const token=tokens.shift(),match=token.match(/^--(host|port)(?:=(.+))?$/);
      if(token==='--strictPort'&&command!=='build')continue;
      if(!match||command==='build')fail();
      const name=match[1];let value=match[2];
      if(value===undefined&&tokens[0]&&!tokens[0].startsWith('-'))value=tokens.shift();
      if(name==='port'&&(!value||!/^\d+$/.test(value)||Number(value)>65535))fail();
      if(name==='host'&&value!==undefined&&!/^[\w.:-]+$/.test(value))fail();
    }
  }
}
function urlAlias(node,imports) {
  if(node?.type!=='call'||node.callee.type!=='identifier'||imports.get(node.callee.name)?.from!=='node:url'||imports.get(node.callee.name)?.name!=='fileURLToPath'||node.args.length!==1)return null;
  const url=node.args[0];
  if(url.type!=='new'||url.name!=='URL'||imports.has('URL')||url.args.length!==2||url.args[0].type!=='literal'||typeof url.args[0].value!=='string')return null;
  const base=url.args[1];
  if(base.type!=='member'||base.name!=='url'||base.object.type!=='member'||base.object.name!=='meta'||base.object.object.type!=='identifier'||base.object.object.name!=='import')return null;
  return url.args[0].value;
}

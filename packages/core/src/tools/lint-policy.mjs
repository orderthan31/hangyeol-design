import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {safeTarget} from './safety.mjs';
import postcss from 'postcss';
import {inlinePropertyOwnership,canonicalOwner} from './lint-css.mjs';

export function walk(node,visit){if(!node||typeof node!=='object')return;visit(node);for(const [key,value] of Object.entries(node))if(!['parent','loc','range','tokens','comments'].includes(key)){if(Array.isArray(value))for(const child of value)walk(child,visit);else if(value&&typeof value==='object')walk(value,visit);}}
export function staticClasses(ast){
 const result=[];
 function literal(node){if(!node)return;if(node.type==='Literal'&&typeof node.value==='string')for(const value of node.value.split(/\s+/))if(value)result.push({value,line:node.loc.start.line,column:node.loc.start.column+1});else{}else if(node.type==='ConditionalExpression'){literal(node.consequent);literal(node.alternate);}else if(node.type==='LogicalExpression'){literal(node.left);literal(node.right);}else if(node.type==='CallExpression'&&node.callee.name==='cn')node.arguments.forEach(literal);}
 function values(node){if(!node)return;if(['TSAsExpression','TSSatisfiesExpression','TSNonNullExpression'].includes(node.type))return values(node.expression);if(node.type==='ObjectExpression'){for(const property of node.properties)if(property.type==='Property'&&!property.method)values(property.value);}else if(node.type==='ArrayExpression')node.elements.forEach(values);else literal(node);}
 walk(ast,node=>{if(node.type==='JSXAttribute'&&node.name.name==='className')literal(node.value?.type==='JSXExpressionContainer'?node.value.expression:node.value);if(node.type==='CallExpression'&&node.callee.name==='cn')literal(node);if(node.type==='VariableDeclarator'&&['variants','sizes'].includes(node.id.name))values(node.init);});
 return [...new Map(result.map(r=>[`${r.line}:${r.column}:${r.value}`,r])).values()];
}
const escapeRegExp=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export async function consumerPolicy(boundary,config,relative,ast,semantic={colors:[],text:[]},css){
 const {sliceConfig,geometryClasses}=await import(pathToFileURL(path.join(boundary.root,'dist/policy/slice-eslint-policy.mjs')));
 const {default:ds}=await import(pathToFileURL(path.join(boundary.root,'dist/policy/design-jsx-policy.mjs')));
 const base=sliceConfig[0],rules={...base.rules},imports=[];
 for(const node of ast.body)if(node.type==='ImportDeclaration'){
  const value=node.source.value;let target;
  if(value.startsWith('.')){target=path.posix.normalize(path.posix.join(path.posix.dirname(relative),value));if(target.startsWith('../')||target==='..')throw Error(`Import escapes sourceRoot: ${value}`);safeTarget(process.cwd(),config.sourceRoot+'/'+target);}
  else if(config.alias&&value.startsWith(config.alias+'/')){target=value.slice(config.alias.length+1);if(target.includes('\\')||target.split('/').some(p=>!p||p==='.'||p==='..'))throw Error(`Unsafe configured alias import: ${value}`);safeTarget(process.cwd(),config.sourceRoot+'/'+target);}
  if(target&&Object.keys(boundary.manifest.files).some(name=>name.replace(/\.(tsx?|css)$/,'')===target.replace(/\.(tsx?|css)$/,''))&&/^(?:primitives|components|foundation)\//.test(target))imports.push('^'+escapeRegExp(value)+'$');
 }
 const owners=sliceConfig[1].files.filter(p=>p.startsWith('packages/core/src/ui/')).map(p=>p.slice('packages/core/src/ui/'.length));
 const trusted=canonicalOwner(boundary,config,relative,css);
 const owner=owners.includes(relative)&&trusted;
 if(trusted&&geometryClasses[relative])rules['shadcn/no-arbitrary-values']=['error',{allow:geometryClasses[relative]}];
 if(owner)rules['shadcn/no-restyle']='off';
 // Exact candidates declared by the consumer's own @theme bridge the grammar's
 // packaged discovery context. Package default palette declarations are excluded.
 const allowed=staticClasses(ast).map(c=>c.value).filter(value=>{
  const bare=value.split(':').pop(),color=bare.match(/^(?:bg|text|border|outline|ring|fill|stroke|decoration|accent|caret|shadow|placeholder)-(.+)$/);
  return color&&(semantic.colors.includes(color[1])||bare.startsWith('text-')&&semantic.text.includes(color[1]));
 });
 if(allowed.length)rules['shadcn/no-raw-colors']=['error',{allow:[...new Set(allowed)]}];
 // The authoring docs customization exception is intentionally not transferred.
 const inlineProperties=inlinePropertyOwnership(boundary,config,relative,css);
 rules['ds/no-unowned-custom-properties']=['error',{owners:inlineProperties.length?[{file:'dist/policy/lint-input.tsx',properties:inlineProperties}]:[]}];
 return {config:{...base,files:['**/*.{ts,tsx}'],plugins:{...base.plugins,ds},settings:{shadcn:{componentImports:imports,mergeFunctions:['cn']}},rules},owner:!!owner,imports,inlineProperties};
}
export async function consumerCompiler(root,config,expected){
 const require=createRequire(path.join(root,'package.json'));let metadataPath,modulePath;
 try{metadataPath=require.resolve('tailwindcss/package.json');modulePath=require.resolve('tailwindcss');}catch{return {mode:'unavailable',reason:'Install the adapter-pinned Tailwind dependency in this host; unknown utilities were not checked',fallback:'none'};}
 function checked(full){const relative=path.relative(root,full);if(!relative.startsWith('node_modules'+path.sep))throw Error('Compiler must resolve inside physical host node_modules');return safeTarget(root,relative.split(path.sep).join('/'));}
 const metadata=JSON.parse(fs.readFileSync(checked(metadataPath)));if(metadata.version!==expected)return {mode:'unavailable',reason:`Expected tailwindcss ${expected}, found ${metadata.version}; unknown utilities were not checked`,fallback:'none'};
 const tailwind=await import(pathToFileURL(checked(modulePath))),compile=tailwind.compile??tailwind.default?.compile;
 if(typeof compile!=='function')throw Error('Installed Tailwind does not expose its compile API');
 const stylesheet=safeTarget(root,config.stylePath),dependencies=[],colors=new Set(),text=new Set();
 function css(full){const file=safeTarget(root,path.relative(root,full).split(path.sep).join('/')),relative=path.relative(root,file),content=fs.readFileSync(file,'utf8');dependencies.push(relative);
  if(!relative.startsWith('node_modules'+path.sep))postcss.parse(content).walkDecls(decl=>{let theme=false;for(let parent=decl.parent;parent;parent=parent.parent)if(parent.type==='atrule'&&parent.name==='theme')theme=true;if(theme&&decl.prop.startsWith('--color-'))colors.add(decl.prop.slice(8));if(theme&&decl.prop.startsWith('--text-'))text.add(decl.prop.slice(7));});return content;
 }
 const compiler=await compile(css(stylesheet),{base:path.dirname(stylesheet),loadModule:async()=>{throw Error('Host @plugin/@config executable modules are unsupported by consumer lint');},loadStylesheet:async(id,base)=>{
  let full;if(['tailwindcss/theme.css','tailwindcss/utilities.css'].includes(id))full=path.join(path.dirname(metadataPath),id.split('/').pop());
  else if(id.startsWith('.'))full=path.resolve(base,id);else throw Error(`Unsupported CSS import: ${id}; use mandatory Tailwind theme/utilities and relative host CSS`);
  return {path:full,base:path.dirname(full),content:css(full)};
 }});
 return {mode:'actual',package:metadata.name,version:metadata.version,license:metadata.license,fallback:'none',dependencies:[...new Set(dependencies)],semantic:{colors:[...colors].sort(),text:[...text].sort()},build:values=>compiler.build(values)};
}
export function hasUtility(css,candidate){
 // group/peer are exact Tailwind marker roles, not standalone declarations.
 if(/^(?:group|peer)(?:\/[a-zA-Z0-9_-]+)?$/.test(candidate))return true;
 let escaped=candidate.replace(/[^a-zA-Z0-9_-]/g,ch=>'\\'+ch);if(/^\d/.test(escaped))escaped='\\'+escaped.charCodeAt(0).toString(16)+' '+escaped.slice(1);
 return new RegExp('\\.'+escapeRegExp(escaped)+'(?![a-zA-Z0-9_\\\\-])').test(css);
}

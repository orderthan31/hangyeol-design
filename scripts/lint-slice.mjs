import fs from 'node:fs';
import path from 'node:path';
import {parse} from '@typescript-eslint/parser';
import {ESLint} from 'eslint';
import {compile} from '@tailwindcss/node';
import {sliceImports} from './slice-eslint-policy.mjs';
import {staticClasses,hasUtility,walk} from '../packages/core/src/tools/lint-policy.mjs';
import {createCSSDiscovery,canonicalOwner} from '../packages/core/src/tools/lint-css.mjs';
const eslint=new ESLint(),root=process.cwd();
const candidates=[],diagnostics=[],patterns=sliceImports.map(p=>new RegExp(p));
let sites=0,files=0,cliFiles=0;
const discoveries=new Map(),cssSources=[];
const result=await eslint.lintFiles(['packages/core/src/ui/**/*.{ts,tsx}','apps/docs/src/**/*.{ts,tsx}']);
const boundary={root:path.join(root,'packages/core'),manifest:JSON.parse(fs.readFileSync('packages/core/payload/manifest.json'))};
const installed=JSON.parse(fs.readFileSync('apps/docs/hangyeol.json'));
for(const entry of result){
 files++;const rel=path.relative(root,entry.filePath);
 diagnostics.push(...entry.messages.map(m=>({file:rel,line:m.line,rule:m.ruleId,message:m.message})));
 const ast=parse(fs.readFileSync(entry.filePath,'utf8'),{ecmaVersion:'latest',sourceType:'module',ecmaFeatures:{jsx:true},loc:true}),names=new Set();
 for(const node of ast.body)if(node.type==='ImportDeclaration'&&patterns.some(p=>p.test(node.source.value)))for(const spec of node.specifiers)names.add(spec.local.name);
 walk(ast,node=>{if(node.type==='JSXOpeningElement'&&node.name.type==='JSXIdentifier'&&names.has(node.name.name))sites++;});
 const classes=staticClasses(ast),sourceRoot=rel.startsWith('packages/')?'packages/core/src/ui':'apps/docs/src';
 if(!discoveries.has(sourceRoot))discoveries.set(sourceRoot,createCSSDiscovery(root,{sourceRoot}));
 // Entry-only compiler stylesheets are handled by the real compiler below;
 // selector evidence is needed only in modules that author class candidates.
 const styleAST={...ast,body:ast.body.filter(node=>!(node.type==='ImportDeclaration'&&node.source.value.endsWith('.css?raw')&&node.specifiers.length===1&&node.specifiers[0].type==='ImportDefaultSpecifier'))}; // Vite text imports do not load CSS or authorize any selector.
 const css=classes.length?discoveries.get(sourceRoot)(path.relative(sourceRoot,rel),styleAST):{classes:new Set(),dependencies:[]};
 if(css.dependencies.length)cssSources.push({file:rel,stylesheets:css.dependencies.map(p=>sourceRoot+'/'+p),classes:[...css.classes].sort()});
 if(rel.startsWith('apps/docs/src/hangyeol/')){
  const owner=rel.slice('apps/docs/src/hangyeol/'.length);
  const localCSS={dependencies:css.dependencies.map(p=>p.replace(/^hangyeol\//,''))};
  if(!canonicalOwner(boundary,installed,owner,localCSS,path.join(root,'apps/docs')))diagnostics.push({file:rel,line:1,rule:'core/owner-integrity',message:'Installed owner, original record and canonical payload must agree before authoring exemptions apply.'});
 }
 candidates.push(...classes.map(c=>({...c,file:rel,sourceCSS:css.classes.has(c.value)})));
}
const compiler=await compile(fs.readFileSync('apps/docs/src/hangyeol.css','utf8'),{base:path.resolve('apps/docs/src'),onDependency:()=>{}});
const unique=[...new Set(candidates.map(c=>c.value))],css=compiler.build(unique),unknown=[];
for(const c of candidates)if(!c.sourceCSS&&!hasUtility(css,c.value)){unknown.push(c);diagnostics.push({file:c.file,line:c.line,rule:'core/unknown-class',message:`Unknown Tailwind utility or module-local CSS class: ${c.value}`});}
const invented='hangyeol-not-a-real-utility';if(hasUtility(compiler.build([invented]),invented))throw Error('Compiler negative fixture falsely recognized');
for(const dir of ['packages/core/src/tools','packages/core/registry'])for(const name of fs.readdirSync(dir)){const p=path.join(dir,name);if(name.endsWith('.mjs')){parse(fs.readFileSync(p,'utf8'),{ecmaVersion:'latest',sourceType:'module'});cliFiles++;}if(name.endsWith('.json')){JSON.parse(fs.readFileSync(p));cliFiles++;}}
const bad="import {Button} from './hangyeol/primitives/button'; export const Bad=()=> <Button className=\"p-8 rounded-full\">Bad</Button>;";
const good="import {Button} from './hangyeol/primitives/button'; export const Good=()=> <Button variant=\"secondary\" className=\"w-full\">Good</Button>;";
const probe=async text=>(await eslint.lintText(text,{filePath:'apps/docs/src/recognition-fixture.tsx'})).flatMap(r=>r.messages);
const negative=(await probe(bad)).some(m=>m.ruleId==='shadcn/no-restyle'),positive=(await probe(good)).length===0;
const report={scope:'Full canonical UI and Docs TS/TSX; module-local CSS evidence, strict unknown classes and installed owner integrity',coverage:{sourceFiles:files,componentSites:sites,cliManifestFiles:cliFiles,staticClasses:unique.length,classOccurrences:candidates.length},compiler:'tailwindcss 4.3.3 actual compile/build (no grammar fallback)',cssSources,unknown,diagnostics,fixtures:{recognizedComponentRestyle:negative,publicVariantLayout:positive,compilerUnknownRejected:true}};
if(process.env.HANGYEOL_SLICE_REPORT)fs.writeFileSync(process.env.HANGYEOL_SLICE_REPORT,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(!files||!sites||!cliFiles||!candidates.length||diagnostics.length||unknown.length||!negative||!positive)process.exitCode=1;

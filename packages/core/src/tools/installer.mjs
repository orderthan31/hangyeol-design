import fs from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {planFiles,createTransaction,safeTarget,hash} from './safety.mjs';
import {validateViteConfig,validateHostScripts,validateTypeScriptAliases} from './host-config.mjs';
export function runInstaller(inputArgs, { payloadRoot }) {
const payload=payloadRoot;
const manifest=JSON.parse(fs.readFileSync(path.join(payload,'manifest.json')));
const args=[...inputArgs],command=args.shift();
const overwrite=args.includes('--overwrite'),dryRun=args.includes('--dry-run');
const migrate=args.includes('--migrate-from-unscoped');
const settingsFlags={'--source-root':'sourceRoot','--style-path':'stylePath','--public-root':'publicRoot','--font-path':'fontPath','--base-path':'basePath','--alias':'alias'};
const options={},components=[];
function parseArgs(){const seen=new Set();for(let i=0;i<args.length;i++){const arg=args[i];if(!arg.startsWith('--')){components.push(arg);continue;}if(seen.has(arg))throw Error(`Duplicate flag: ${arg}`);seen.add(arg);if(['--dry-run','--overwrite','--migrate-from-unscoped'].includes(arg))continue;const key=settingsFlags[arg];if(!key)throw Error(`Unknown flag: ${arg}`);const value=args[++i];if(!value||value.startsWith('--'))throw Error(`Missing value for ${arg}`);options[key]=value;}if(command==='init'&&components.length)throw Error('init does not add components; use add separately');}
const settingKeys=Object.values(settingsFlags);
const viteConfigs=['vite.config.js','vite.config.mjs','vite.config.ts','vite.config.cjs','vite.config.mts','vite.config.cts'];
function settings(config){return Object.fromEntries(settingKeys.map(key=>[key,config[key]]));}
function sourceFiles(config,items){
 const names=new Set(manifest.common),runtime={...manifest.runtime},types={},visited=new Set();
 function visit(name){if(visited.has(name))return;const item=manifest.items[name];if(!item)throw Error(`Unknown component: ${name}`);visited.add(name);for(const edge of item.requires)visit(edge);for(const file of item.files)names.add(file);Object.assign(runtime,item.runtime);Object.assign(types,item.types);}
 for(const name of items)visit(name);
 return {files:[...names].map(name=>{
  const target=`${config.sourceRoot}/${name}`,bytes=fs.readFileSync(path.join(payload,'source',name)),digest=manifest.files[name].hash;
  if(hash(bytes)!==digest)throw Error(`payload hash mismatch: ${target}`);
  if(command==='add'&&manifest.common.includes(name)){
   // Common sources belong to the initialized consumer. Keep local edits, while
   // retaining the original template record rather than adopting those edits.
   const record=config.installed[target];
   if(!record||record.version!==manifest.version||record.hash!==digest)throw Error(`conflict: missing/incompatible initialized common record ${target}; review init ownership explicitly`);
   const full=safeTarget(process.cwd(),target);
   if(!fs.existsSync(full)||!fs.statSync(full).isFile())throw Error(`conflict: missing/non-file initialized common source ${target}; restore/review explicitly`);
   const local=fs.readFileSync(full);
   // A planned noop still checks safe paths and rechecks current bytes in applyPlan.
   return {path:target,bytes:local,hash:hash(local),preserve:true};
  }
  return {path:target,bytes,hash:digest};
 }),runtime,types,items:[...visited]};
}
function discover(root){
 for(const name of ['package-lock.json','node_modules','hangyeol.json'])safeTarget(root,name);
 const packageFile=safeTarget(root,'package.json');if(!fs.existsSync(packageFile))throw Error('Run inside a React/Vite host with package.json');
 const pkg=JSON.parse(fs.readFileSync(packageFile)),all={...pkg.dependencies,...pkg.devDependencies};
 validateHostScripts(pkg.scripts);
 if(!all.react||!all['react-dom']||!all.vite)throw Error('Unsupported host: first adapter requires React, React DOM and Vite');
 if(all.tailwindcss&&!/^\^?4\./.test(all.tailwindcss))throw Error('Unsupported Tailwind version; v3 migration is outside this adapter');
 for(const name of ['react','react-dom'])if(!/^\^?19\./.test(all[name]))throw Error(`Unsupported ${name}: first adapter is tested with React 19; host is not downgraded`);
 return pkg;
}
function validateBasePath(base){
 if(typeof base!=='string'||!/^\/(?:[a-zA-Z0-9_/-]*\/)?$/.test(base)||base.includes('..')||base.startsWith('//'))throw Error('basePath must be a same-origin root-relative path ending in /; leading // is not allowed');
}
function fontCSS(config){const base=config.basePath,dir=config.fontPath;return [['Regular',400],['Medium',500],['SemiBold',600],['Bold',700]].map(([name,weight])=>`@font-face { font-family: Pretendard; font-style: normal; font-weight: ${weight}; font-display: swap; src: url("${base}${dir}/Pretendard-${name}.woff2") format("woff2"); }`).join('\n')+'\n';}
function relativeImport(from,to){let rel=path.posix.relative(path.posix.dirname(from),to);return rel.startsWith('.')?rel:'./'+rel;}
function buildInit(root,config){
 validateBasePath(config.basePath);
 for(const filename of [...viteConfigs,'tsconfig.json'])if(config.installed?.[filename]){const full=safeTarget(root,filename);if(!fs.existsSync(full)||hash(fs.readFileSync(full))!==config.installed[filename].hash)throw Error(`conflict: edited/missing managed host config ${filename}; restore/review explicitly, host config migration is outside init`);}
 const files=[];const graph=sourceFiles(config,[]);files.push(...graph.files);
 for(const name of Object.keys(manifest.assets)){const bytes=fs.readFileSync(path.join(payload,'assets',name));files.push({path:`${config.publicRoot}/${config.fontPath}/${name}`,bytes,hash:manifest.assets[name].hash});}
 files.push({path:`${config.sourceRoot}/foundation/fonts.css`,bytes:Buffer.from(fontCSS(config))});
 const stylePath=safeTarget(root,config.stylePath),existing=fs.existsSync(stylePath)?fs.readFileSync(stylePath,'utf8'):'';
 const activeCSS=existing.replace(/\/\*[\s\S]*?\*\//g,'');
 if(/@import\s+(?:url\(\s*)?(['"]?)tailwindcss(?:\/index\.css)?\1(?=[\s);]|$)/i.test(activeCSS)||/preflight|@tailwind\b|@import\s+[^;]*(?:normalize|reset)/i.test(activeCSS)||/(?:^|[;}])\s*(?:\*|html\s*,\s*body|html\s*,\s*body\s*,[^{}]*)\s*\{[^}]*\b(?:margin|padding|all)\s*:/i.test(activeCSS))throw Error('Host stylesheet imports/contains a reset or legacy Tailwind directive; split it explicitly before init');
 const css=`@layer theme, base, components, utilities;\n@import "tailwindcss/theme.css" layer(theme);\n@import "tailwindcss/utilities.css" layer(utilities);\n@import "${relativeImport(config.stylePath,`${config.sourceRoot}/foundation/theme.css`)}";\n@import "${relativeImport(config.stylePath,`${config.sourceRoot}/foundation/fonts.css`)}";\n@source "${relativeImport(config.stylePath,config.sourceRoot)}";\n`;
 const marker='/* Hangyeol managed integration v1 */';
 let styleBody=existing;
 if(existing.includes(marker)){
   if(!config.installed?.[config.stylePath]||existing.split(marker+'\n').length!==2)throw Error('Unowned/ambiguous managed stylesheet; review integration explicitly');
   if(hash(Buffer.from(existing))!==config.installed[config.stylePath].hash&&!overwrite)throw Error('conflict: edited managed stylesheet; review then use --overwrite for a backup');
   styleBody=config.integration?.styleBody??existing.split(marker+'\n')[1];
   if(typeof styleBody!=='string')throw Error('Invalid integration styleBody');
   const expected=css+marker+'\n'+styleBody;
   if(existing!==expected&&!overwrite)throw Error('conflict: managed stylesheet header/body differs; no automatic adoption');
   files.push({path:config.stylePath,bytes:Buffer.from(expected)});
 }else{
   if(config.installed?.[config.stylePath])throw Error('conflict: installed stylesheet marker removed; restore/review explicitly');
   files.push({path:config.stylePath,bytes:Buffer.from(css+marker+'\n'+existing),integrate:!!existing});
 }
 const configs=viteConfigs.filter(p=>fs.existsSync(path.join(root,p)));
 if(configs.length>1)throw Error('Ambiguous host: multiple Vite configs; keep one explicit supported config before init');
 if(configs.length)validateViteConfig(fs.readFileSync(safeTarget(root,configs[0]),'utf8'),config);
 else files.push({path:'vite.config.ts',bytes:Buffer.from(`import {defineConfig} from 'vite';\nimport {fileURLToPath} from 'node:url';\nimport tailwindcss from '@tailwindcss/vite';\nexport default defineConfig({base:${JSON.stringify(config.basePath)},publicDir:${JSON.stringify(config.publicRoot)},${config.alias?`resolve:{alias:{${JSON.stringify(config.alias)}:fileURLToPath(new URL(${JSON.stringify('./'+config.sourceRoot)},import.meta.url))}},`:''}plugins:[tailwindcss()]});\n`)});
 if(config.alias){const filename='tsconfig.json';const current=fs.existsSync(path.join(root,filename))?JSON.parse(fs.readFileSync(safeTarget(root,filename),'utf8')):{};if(current.extends||current.references||current.compilerOptions?.baseUrl&&current.compilerOptions.baseUrl!=='.')throw Error('Ambiguous TypeScript alias: supported subset requires one plain tsconfig.json without extends/references and baseUrl omitted or "."; configure the effective host explicitly');current.compilerOptions??={};current.compilerOptions.paths??={};validateTypeScriptAliases(current.compilerOptions.paths,config.alias);const key=config.alias+'/*';if(current.compilerOptions.paths[key] && JSON.stringify(current.compilerOptions.paths[key])!==JSON.stringify(['./'+config.sourceRoot+'/*']))throw Error('Existing alias conflicts');current.compilerOptions.paths[key]=['./'+config.sourceRoot+'/*'];files.push({path:filename,bytes:Buffer.from(JSON.stringify(current,null,2)+'\n'),integrate:!config.installed?.[filename]});}
 return {files,runtime:graph.runtime,items:[],integration:{settings:settings(config),styleBody}};
}
try{
 if(command==='--version'){console.log(manifest.version);return 0;}
 if(!['init','add'].includes(command))throw Error('Usage: hangyeol init [--source-root src/hangyeol --style-path src/hangyeol.css --public-root public --font-path fonts/hangyeol --base-path / --alias @hangyeol] | hangyeol add button ... [--overwrite] [--dry-run]');
 parseArgs();
 const root=process.cwd(),pkg=discover(root),configFile=safeTarget(root,'hangyeol.json');
 const previousBytes=fs.existsSync(configFile)?fs.readFileSync(configFile):null;
 const previous=previousBytes?JSON.parse(previousBytes):null;
 if(command==='add'&&!previous)throw Error('Run hangyeol init first');
 const defaults={schemaVersion:1,sourceRoot:'src/hangyeol',stylePath:'src/hangyeol.css',publicRoot:'public',fontPath:'fonts/hangyeol',basePath:'/',alias:null,installed:{}};
 const config={...defaults,...previous,...(!previous?options:{})};
 validateBasePath(config.basePath);
 for(const [key,value] of Object.entries(options))if(previous&&config[key]!==value)throw Error(`Flag ${key} conflicts with hangyeol.json; changing installed settings is outside init/add`);
 if(config.schemaVersion!==1||!config.installed||typeof config.installed!=='object'||Array.isArray(config.installed)||config.components&&!Array.isArray(config.components))throw Error('Unsupported/invalid hangyeol.json schema or install records');
 if(config.integration&&JSON.stringify(settings(config.integration.settings||{}))!==JSON.stringify(settings(config)))throw Error('hangyeol.json conflicts with installed integration settings; no update/migration engine');
 if(migrate && (command!=='init' || overwrite || !previous || config.tool?.package!=='hangyeol-core' || config.tool?.version!=='0.1.0-s2.1' || config.version!=='0.1.0-s2.1' || manifest.package!=='@orderthan31/hangyeol-core' || manifest.version!=='0.0.1'))throw Error('Migration requires unchanged unscoped 0.1.0-s2.1 to scoped 0.0.1, init only, no overwrite');
 if(!migrate&&config.tool&&(config.tool.package!==manifest.package||config.tool.version!==manifest.version))throw Error('Installed tool/version conflicts with this payload; no update engine');
 for(const key of ['sourceRoot','stylePath','publicRoot','fontPath']){
   if(typeof config[key]!=='string'||!/^[a-zA-Z0-9_./-]+$/.test(config[key]))throw Error(`Unsafe configurable path: ${key}`);
   const parts=config[key].split('/').map(part=>part.toLowerCase());
   // User-controlled roots cannot impersonate host config files/directories.
   // buildInit's explicit generated Vite/TS config targets remain permitted.
   if(parts.some(part=>viteConfigs.includes(part)||/^tsconfig(?:\.[\w-]+)*\.json$/.test(part)))throw Error(`Reserved host config target in ${key}: ${config[key]}`);
   if(parts.some(part=>['node_modules','.git','.hangyeol-backups','.hangyeol-transactions','hangyeol.json','package.json','package-lock.json'].includes(part)))throw Error(`Unsafe configurable path: ${key}`);
   const full=safeTarget(root,config[key]);if(key!=='stylePath'&&fs.existsSync(full)&&!fs.statSync(full).isDirectory())throw Error(`Configurable directory is a file: ${key}`);
 }
 const overlap=(a,b)=>{a=a.toLowerCase();b=b.toLowerCase();return a===b||a.startsWith(b+'/')||b.startsWith(a+'/');};
 if(overlap(config.sourceRoot,config.publicRoot)||overlap(config.stylePath,config.publicRoot)||config.stylePath===config.sourceRoot)throw Error('Configured source/style/public roots overlap unsafely');
 if(config.alias!==null&&(typeof config.alias!=='string'||!/^@[a-zA-Z][\w/-]*$/.test(config.alias)))throw Error('alias must be a safe @name path');
 if(Object.keys(config.installed).length){const required=[...manifest.common.map(name=>`${config.sourceRoot}/${name}`),...Object.keys(manifest.assets).map(name=>`${config.publicRoot}/${config.fontPath}/${name}`),`${config.sourceRoot}/foundation/fonts.css`,config.stylePath];for(const name of required)if(!config.installed[name]||!/^\w{64}$/.test(config.installed[name].hash??''))throw Error('Installed records conflict with configured roots; init cannot adopt changed managed config');}
 const requested=command==='add'?components:[];
 if(command==='add'&&!requested.length)throw Error('Specify at least one component');
 const result=command==='init'?buildInit(root,config):sourceFiles(config,requested);
 // Explicit identity-only migration. Re-plan verified canonical bytes, never adopt
 // edited files or rewrite hashes by hand. Existing transaction backs up metadata.
 if(migrate){
   const expected=new Map(result.files.map(f=>[f.path,f]));
   for(const name of config.components||[]){
     if(!Object.hasOwn(manifest.items,name))throw Error('Migration has unknown selection');
   }
   for(const file of sourceFiles(config,config.components||[]).files)expected.set(file.path,file);
   for(const [name,record] of Object.entries(config.installed)){
     const file=expected.get(name);
     const local=fs.readFileSync(safeTarget(root,name));
     if(!file || record.version!=='0.1.0-s2.1' || hash(local)!==record.hash || hash(file.bytes)!==record.hash)throw Error(`Migration conflict: edited or incompatible owner ${name}`);
   }
   if([...expected.keys()].some(name=>!config.installed[name]))throw Error('Migration requires complete ownership records');
   result.files=[...expected.values()];
 }

 // All source+metadata+host integration paths/collisions/hashes are planned before ANY write or npm action.
 const sourcePlan=planFiles(root,result.files.map(f=>{if(f.integrate){const full=safeTarget(root,f.path);return {...f,previous:fs.existsSync(full)?hash(fs.readFileSync(full)):undefined};}return f;}),{overwrite});
 for(const file of sourcePlan)if(file.preserve&&file.action!=='noop')throw Error(`conflict: common source changed while planning ${file.path}; retry after reviewing local edits`);
 // Integration is additive and deliberately shown by --dry-run; ordinary arbitrary files remain conflicts.
 const deps=command==='init'?{runtime:result.runtime,build:manifest.build,types:manifest.types}:{runtime:result.runtime,...(Object.keys(result.types).length?{types:result.types}:{})};
 const all={...pkg.dependencies,...pkg.devDependencies},needed={};
 for(const [kind,values] of Object.entries(deps)){needed[kind]=[];for(const [name,version]of Object.entries(values)){if(all[name]&&all[name]!==version)throw Error(`Dependency conflict: ${name} host=${all[name]} requested=${version}; resolve explicitly`);if(!all[name])needed[kind].push(`${name}@${version}`);}}
 const next=structuredClone(config);next.version=manifest.version;if(manifest.package)next.tool={package:manifest.package,version:manifest.version};next.installed??={};
 if(command==='init'&&manifest.package)next.integration=result.integration;
 for(const file of sourcePlan)if(!file.preserve)next.installed[file.path]={version:manifest.version,hash:file.hash};
 next.components=[...new Set([...(config.components||[]),...result.items])];
 if(sourcePlan.some(file=>file.path==='hangyeol.json'||file.path==='package.json'||file.path==='package-lock.json'))throw Error('unsafe source/metadata/dependency target overlap');
 // Preserve consumer serialization when the resulting metadata is identical.
 // Required source/dependency operations still run independently of this noop.
 if(previousBytes&&hash(fs.readFileSync(configFile))!==hash(previousBytes))throw Error('conflict: hangyeol.json changed while planning');
 const configBytes=previous&&isDeepStrictEqual(next,previous)?previousBytes:Buffer.from(JSON.stringify(next,null,2)+'\n');
 // Config is owned metadata: preserve user settings, update only successful records.
 const metadataPlan=planFiles(root,[{path:'hangyeol.json',bytes:configBytes}],{overwrite:true});
 const summary=sourcePlan.map(({path,action,backup,hash})=>({path,action,backup,hash}));
 console.log(JSON.stringify({command,version:manifest.version,files:summary,dependencies:needed,metadata:metadataPlan.map(({path,action})=>({path,action})),dryRun},null,2));
 if(dryRun)return 0;
 const transaction=createTransaction(root);let dependencyAttempted=false;
 try{
  transaction.validate([...sourcePlan,...metadataPlan]);
  if(Object.values(needed).some(values=>values.length)){transaction.watch('package.json');transaction.watch('package-lock.json');}
  transaction.apply(sourcePlan);
  for(const [kind,values]of Object.entries(needed)){
   if(!values.length)continue;dependencyAttempted=true;
   const install=spawnSync(process.platform==='win32'?'npm.cmd':'npm',['install','--save-exact',...(kind==='runtime'?[]:['--save-dev']),...values],{cwd:root,stdio:'inherit'});
   transaction.observeExternal();
   if(install.status!==0)throw Error(`Dependency install failed (${install.status ?? install.error?.message})`);
  }
  transaction.apply(metadataPlan);
  const committed=transaction.commit();if(committed.errors.length)throw Object.assign(Error('Files committed; transaction cleanup incomplete'),{recovery:committed});
 }catch(error){
  const recovery=error.recovery??transaction.rollback();
  console.error(JSON.stringify({transactionRecovery:recovery,dependencyAttempted,nodeModules:dependencyAttempted?'not rolled back; external npm/node_modules effects remain unverified. Review dependencies and reinstall explicitly.':'npm not invoked',dependencyStatus:dependencyAttempted?'package/lock bytes or absence recovered only where safe; dependency installation not certified':'unchanged by npm'}));
  throw Error(`${error.message}; managed transaction ${recovery.status}; ${recovery.errors.length} recovery/cleanup problems. ${dependencyAttempted?'node_modules was not rolled back; dependency effects remain unverified.':'npm was not invoked.'}`);
 }
 console.log(`SUCCESS ${command}: ${sourcePlan.filter(f=>f.action!=='noop').length} writes; ${sourcePlan.filter(f=>f.action==='noop').length} identical no-ops. Import ${config.stylePath} from your host entry. ${config.alias?'Configured TypeScript and Vite alias contract.':''}`);
return 0;
}catch(error){console.error(`HANGYEOL ERROR: ${error.message}`);return 1;}
}

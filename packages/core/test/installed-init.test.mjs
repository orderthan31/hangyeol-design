import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import test from 'node:test';

const evidence=process.env.CORE02_EVIDENCE_DIR;
assert.ok(evidence,'Installed CORE02 fixtures require designated scratch');
const artifact=JSON.parse(fs.readFileSync(path.join(evidence,'artifact.json')));
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function run(label,command,args,cwd,expected=0,options={}) {
  const start=performance.now(),started=new Date().toISOString();
  const result=spawnSync(command,args,{cwd,encoding:'utf8',maxBuffer:16e6,env:options.env??process.env});
  fs.writeFileSync(path.join(evidence,`custom-${label}-${process.hrtime.bigint()}.json`),JSON.stringify({command:[command,...args],cwd,started,runtime:process.version,exit:result.status,expectedExit:expected,durationMs:performance.now()-start,stdout:result.stdout,stderr:result.stderr},null,2));
  assert.equal(result.status,expected,`${label}: ${result.stdout}\n${result.stderr}`);
  return options.result?result:result.stdout;
}
function snapshot(dir,base=dir) {
  const result={};
  if(dir===base)result['.']={mtimeNs:fs.lstatSync(dir,{bigint:true}).mtimeNs.toString(),mode:fs.lstatSync(dir,{bigint:true}).mode.toString()};
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const p=path.join(dir,entry.name),stat=fs.lstatSync(p,{bigint:true});
    result[path.relative(base,p)]={mtimeNs:stat.mtimeNs.toString(),mode:stat.mode.toString(),...(entry.isFile()?{sha256:digest(fs.readFileSync(p))}:{}),...(entry.isSymbolicLink()?{link:fs.readlinkSync(p)}:{})};
    if(entry.isDirectory())Object.assign(result,snapshot(p,base));
  }
  return result;
}
function unchanged(label,host,bin,args,expected,options={}) {
  const before=snapshot(host);let result,after;
  try {result=run(label,bin,args,host,expected,{...options,result:true});}
  finally {after=snapshot(host);fs.writeFileSync(path.join(evidence,`full-snapshot-${label}-${process.hrtime.bigint()}.json`),JSON.stringify({host,args,before,after},null,2));}
  const differences=[...new Set([...Object.keys(before),...Object.keys(after)])].filter(key=>JSON.stringify(before[key])!==JSON.stringify(after[key]));
  fs.writeFileSync(path.join(evidence,`snapshot-${label}-${process.hrtime.bigint()}.json`),JSON.stringify({host,filesInspected:Object.keys(before).length,differences,before,after},null,2));
  assert.deepEqual(differences,[],`${label}: complete host bytes/mtimes including node_modules/package/lock/config must remain unchanged`);
  if(options.diagnostic)assert.match(result.stderr,options.diagnostic);
}

test('physical installed init honors custom roots, alias, base and publicDir with atomic preflight/no-op',()=>{
  const host=fs.mkdtempSync(path.join(evidence,'custom-host-'));
  const manifest=JSON.parse(fs.readFileSync(path.join(artifact.unpacked,'package/payload/manifest.json')));
  // Runtime helpers are deliberately absent: real init must install them and retain core.
  fs.writeFileSync(path.join(host,'package.json'),JSON.stringify({name:'core02-custom-host',version:'1.0.0',private:true,type:'module',dependencies:{react:'19.2.0','react-dom':'19.2.0'},devDependencies:{vite:'7.3.6',typescript:'5.9.3',...manifest.build,...manifest.types}},null,2)+'\n');
  run('install','npm',['install','--offline','--save-dev','--save-exact',artifact.tarball],host);
  const installed=path.join(host,'node_modules/@orderthan31/hangyeol-core'),bin=path.join(host,'node_modules/.bin/hangyeol');
  assert.equal(fs.lstatSync(installed).isSymbolicLink(),false);
  assert.equal(fs.realpathSync(bin),path.join(installed,'bin/hangyeol.mjs'));
  assert.equal(run('version',bin,['--version'],host).trim(),artifact.version);
  assert.ok(!fs.existsSync(path.join(host,'hangyeol.json'))&&!fs.existsSync(path.join(host,'src')),'no postinstall UI generation');
  const initialLock=JSON.parse(fs.readFileSync(path.join(host,'package-lock.json')));
  const initialRecord=initialLock.packages['node_modules/@orderthan31/hangyeol-core'];
  const expectedIntegrity='sha512-'+crypto.createHash('sha512').update(fs.readFileSync(artifact.tarball)).digest('base64');
  assert.equal(initialRecord.integrity,expectedIntegrity);
  fs.mkdirSync(path.join(host,'styles'));
  const body='body { margin: 17px; color: chocolate; }\n.native-sentinel { padding: 13px; }\n';
  fs.writeFileSync(path.join(host,'styles/theme.css'),body);
  fs.writeFileSync(path.join(host,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'ES2022',lib:['ES2022','DOM'],module:'ESNext',moduleResolution:'Bundler',jsx:'react-jsx',strict:true,skipLibCheck:true,noEmit:true},include:['src','ui']},null,2)+'\n');
  const flags=['--source-root','ui/system','--style-path','styles/theme.css','--public-root','static','--font-path','assets/type','--base-path','/design/','--alias','@hangyeol'];
  unchanged('dry-run',host,bin,['init',...flags,'--dry-run'],0);
  // The effective host cannot be inferred from comments or conflicting literals.
  const configFile=path.join(host,'vite.config.ts');
  for(const text of [
    "import {defineConfig} from 'vite';import tw from '@tailwindcss/vite';export default defineConfig({base:'/host/',publicDir:'public',plugins:[tw()]});",
    "// /design/ static @hangyeol ui/system @tailwindcss/vite\nexport default {};",
  ]) {fs.writeFileSync(configFile,text);unchanged('host-conflict',host,bin,['init',...flags],1);}
  // Fixture setup removes only its own synthetic config, never repository files.
  fs.unlinkSync(configFile);
  for(const unsafe of [['--source-root','../outside'],['--source-root','.Git'],['--style-path','ui/system/lib'],['--public-root','UI/system'],['--font-path','../fonts']]) {
    // Replace the relevant fixture flag rather than append a duplicate.
    const changed=[...flags],index=changed.indexOf(unsafe[0]);changed[index+1]=unsafe[1];
    unchanged('unsafe-'+unsafe[0].slice(2),host,bin,['init',...changed],1);
  }
  const linkTarget=fs.mkdtempSync(path.join(evidence,'font-symlink-target-'));fs.symlinkSync(linkTarget,path.join(host,'static'));
  unchanged('symlink-public',host,bin,['init',...flags],1);fs.unlinkSync(path.join(host,'static'));
  run('init',bin,['init',...flags],host);
  const config=JSON.parse(fs.readFileSync(path.join(host,'hangyeol.json')));
  assert.deepEqual(Object.fromEntries(['sourceRoot','stylePath','publicRoot','fontPath','basePath','alias'].map(key=>[key,config[key]])),{sourceRoot:'ui/system',stylePath:'styles/theme.css',publicRoot:'static',fontPath:'assets/type',basePath:'/design/',alias:'@hangyeol'});
  assert.deepEqual(config.components,[],'init foundation is distinct from add graph');
  assert.ok(!fs.existsSync(path.join(host,'ui/system/primitives')));
  for(const source of manifest.common)assert.equal(digest(fs.readFileSync(path.join(host,'ui/system',source))),manifest.files[source].hash);
  const fontEvidence={};
  for(const [name,record] of Object.entries(manifest.assets)) {
    const bytes=fs.readFileSync(path.join(host,'static/assets/type',name));
    assert.equal(digest(bytes),record.hash);
    assert.deepEqual(bytes,fs.readFileSync(path.join(installed,'payload/assets',name)));
    if(name.endsWith('.woff2'))assert.equal(bytes.subarray(0,4).toString(),'wOF2');
    fontEvidence[name]={sha256:digest(bytes),bytes:bytes.length};
  }
  const css=fs.readFileSync(path.join(host,'styles/theme.css'),'utf8');
  assert.ok(css.endsWith(body));assert.match(css,/@source "\.\.\/ui\/system";/);
  assert.match(css,/@import "\.\.\/ui\/system\/foundation\/theme.css";/);
  assert.match(css,/@import "\.\.\/ui\/system\/foundation\/fonts.css";/);
  assert.ok(!/preflight|@import\s+"tailwindcss"/.test(css));
  const fonts=fs.readFileSync(path.join(host,'ui/system/foundation/fonts.css'),'utf8');
  for(const weight of [400,500,600,700])assert.ok(fonts.includes(`font-weight: ${weight}`));
  assert.ok(fonts.includes('/design/assets/type/Pretendard-Regular.woff2'));
  unchanged('repeat-init',host,bin,['init'],0);
  unchanged('same-flags',host,bin,['init',...flags],0);
  unchanged('changed-flags',host,bin,['init','--base-path','/different/'],1);
  unchanged('add-dry',host,bin,['add','button','--dry-run'],0);
  run('add',bin,['add','button'],host);
  assert.equal(digest(fs.readFileSync(path.join(host,'ui/system/primitives/button.tsx'))),manifest.files['primitives/button.tsx'].hash);
  unchanged('repeat-after-add',host,bin,['init'],0);
  for(const filename of ['ui/system/lib/cn.ts','styles/theme.css','vite.config.ts','tsconfig.json']) {
    const p=path.join(host,filename),original=fs.readFileSync(p);
    fs.appendFileSync(p,'\n/* owner edit */\n');unchanged('edited-'+path.basename(filename),host,bin,['init'],1);fs.writeFileSync(p,original);
  }
  const configPath=path.join(host,'hangyeol.json'),originalConfig=fs.readFileSync(configPath);
  fs.writeFileSync(configPath,JSON.stringify({...config,sourceRoot:'changed/ui'},null,2));unchanged('config-conflict',host,bin,['init'],1);fs.writeFileSync(configPath,originalConfig);
  const helper=path.join(host,'ui/system/lib/cn.ts');fs.appendFileSync(helper,'\n// intentional owner edit\n');const edited=fs.readFileSync(helper);
  run('overwrite',bin,['init','--overwrite'],host);
  assert.equal(digest(fs.readFileSync(helper)),manifest.files['lib/cn.ts'].hash);
  assert.ok(fs.readdirSync(path.join(host,'.hangyeol-backups')).some(dir=>{const p=path.join(host,'.hangyeol-backups',dir,'ui/system/lib/cn.ts');return fs.existsSync(p)&&fs.readFileSync(p).equals(edited);}));
  const styleFile=path.join(host,'styles/theme.css');
  fs.appendFileSync(styleFile,'\n/* intentional stylesheet edit */\nbody { color: orchid; }\n');const editedStyle=fs.readFileSync(styleFile);
  run('overwrite-managed-stylesheet',bin,['init','--overwrite'],host);
  assert.equal(fs.readFileSync(styleFile,'utf8'),css,'overwrite restores original managed header and recorded host body');
  const styleBackup=fs.readdirSync(path.join(host,'.hangyeol-backups')).map(dir=>path.join(host,'.hangyeol-backups',dir,'styles/theme.css')).find(p=>fs.existsSync(p)&&fs.readFileSync(p).equals(editedStyle));
  assert.ok(styleBackup,'backup must preserve exact edited stylesheet bytes');
  unchanged('repeat-after-stylesheet-overwrite',host,bin,['init','--overwrite'],0);
  fs.writeFileSync(path.join(evidence,'stylesheet-overwrite-evidence.json'),JSON.stringify({host,styleFile,styleBackup,editedHash:digest(editedStyle),backupHash:digest(fs.readFileSync(styleBackup)),restoredHash:digest(fs.readFileSync(styleFile)),originalManagedHash:digest(Buffer.from(css)),recordedBody:JSON.parse(fs.readFileSync(path.join(host,'hangyeol.json'))).integration.styleBody,expectedBody:body},null,2));
  // Actual alias imports and configured source scanning are exercised by host tools.
  fs.mkdirSync(path.join(host,'src'));
  fs.writeFileSync(path.join(host,'index.html'),'<div id="root"></div><script type="module" src="/src/main.tsx"></script>\n');
  fs.writeFileSync(path.join(host,'src/main.tsx'),"import {createRoot} from 'react-dom/client';import {Button} from '@hangyeol/primitives/button';import '../styles/theme.css';createRoot(document.getElementById('root')!).render(<main data-hangyeol><Button>확인</Button><span className=\"native-sentinel\">Native</span></main>);\n");
  run('typecheck',path.join(host,'node_modules/.bin/tsc'),['--pretty','false'],host);
  run('build',path.join(host,'node_modules/.bin/vite'),['build'],host);
  const builtCSS=fs.readdirSync(path.join(host,'dist/assets')).filter(p=>p.endsWith('.css')).map(p=>fs.readFileSync(path.join(host,'dist/assets',p),'utf8')).join('\n');
  assert.ok(builtCSS.includes('.inline-flex'),'Tailwind compiler scanned real installed Button source outside src');
  assert.ok(builtCSS.includes('margin:17px'),'host body retained in actual compiled CSS');
  for(const name of Object.keys(fontEvidence).filter(name=>name.endsWith('.woff2')))assert.ok(builtCSS.includes('/design/assets/type/'+name),'actual compiled font URL must match the configured base/public output');
  const postcss=createRequire(path.join(installed,'package.json'))('postcss');
  postcss.parse(builtCSS).walkRules(rule=>rule.walkDecls('box-sizing',decl=>{if(decl.value==='border-box')assert.ok(rule.selector.includes('[data-hangyeol]'),'box sizing stays inside canonical scope; no global Preflight');}));
  const finalPackage=JSON.parse(fs.readFileSync(path.join(host,'package.json'))),finalLock=JSON.parse(fs.readFileSync(path.join(host,'package-lock.json'))),record=finalLock.packages['node_modules/@orderthan31/hangyeol-core'];
  assert.equal(record.version,artifact.version);assert.equal(record.integrity,expectedIntegrity);assert.equal(record.resolved,initialRecord.resolved);assert.equal(record.dev,true);
  assert.equal(finalPackage.devDependencies['@orderthan31/hangyeol-core'],initialLock.packages[''].devDependencies['@orderthan31/hangyeol-core']);
  assert.equal(finalLock.packages[''].devDependencies['@orderthan31/hangyeol-core'],finalPackage.devDependencies['@orderthan31/hangyeol-core']);
  assert.ok(!finalPackage.dependencies['@orderthan31/hangyeol-core']);
  for(const [name,record] of Object.entries(fontEvidence))assert.equal(digest(fs.readFileSync(path.join(host,'dist/assets/type',name))),record.sha256,'Vite publicDir assets must be copied to actual production URL path');
  fs.writeFileSync(path.join(evidence,'custom-installed-evidence.json'),JSON.stringify({host,bin,physicalPackage:true,version:artifact.version,tarball:artifact.tarball,packageDevDependency:finalPackage.devDependencies['@orderthan31/hangyeol-core'],finalCoreLockRecord:record,settings:config.integration.settings,fonts:fontEvidence,httpFonts:'NOT VERIFIED; separate installed-init-http.test.mjs',sourceScanCompiled:true,aliasTypecheckAndBuild:true,noPostinstallGeneration:true,browserFontLoad:'NOT RUN',cache:'prepared CORE01 Mac cache, offline; not independent empty-cache/VPS proof'},null,2));
});

function reviewHost(label) {
  const host=fs.mkdtempSync(path.join(evidence,`review-${label}-`));
  const manifest=JSON.parse(fs.readFileSync(path.join(artifact.unpacked,'package/payload/manifest.json')));
  fs.writeFileSync(path.join(host,'package.json'),JSON.stringify({name:'core02-review-host',version:'1.0.0',private:true,type:'module',dependencies:{react:'19.2.0','react-dom':'19.2.0',...manifest.runtime},devDependencies:{vite:'7.3.6',...manifest.build,...manifest.types}},null,2)+'\n');
  run('review-install-'+label,'npm',['install','--offline','--save-dev','--save-exact',artifact.tarball],host);
  const installed=path.join(host,'node_modules/@orderthan31/hangyeol-core'),bin=path.join(host,'node_modules/.bin/hangyeol');
  assert.equal(fs.lstatSync(installed).isSymbolicLink(),false);assert.equal(fs.realpathSync(bin),path.join(installed,'bin/hangyeol.mjs'));
  assert.equal(run('review-version-'+label,bin,['--version'],host).trim(),artifact.version);
  return {host,bin};
}
const reviewVite="import {defineConfig} from 'vite';import {fileURLToPath} from 'node:url';import tw from '@tailwindcss/vite';export default defineConfig({base:'/design/',publicDir:'static',resolve:{alias:{'@hangyeol':fileURLToPath(new URL('./ui/system',import.meta.url))}},plugins:[tw()]});\n";
const reviewFlags=['--source-root','ui/system','--style-path','styles/theme.css','--public-root','static','--font-path','assets/type','--base-path','/design/','--alias','@hangyeol'];

test('installed review fix1 refuses an imported override plugin without loading its module',()=>{
  const {host,bin}=reviewHost('plugin');
  fs.writeFileSync(path.join(host,'override.mjs'),"import fs from 'node:fs';fs.writeFileSync('plugin-executed','bad');export default ()=>({name:'override',config(){return {base:'/other/',publicDir:'other',resolve:{alias:{'@hangyeol':'./elsewhere'}}}},configResolved(config){config.base='/changed/';config.publicDir='other';}});\n");
  fs.writeFileSync(path.join(host,'vite.config.ts'),reviewVite.replace('export default',"import override from './override.mjs';export default").replace('tw()]','tw(),override()]'));
  unchanged('review-plugin',host,bin,['init',...reviewFlags],1,{diagnostic:/unreviewed|unsupported.*plugin/i});
  assert.ok(!fs.existsSync(path.join(host,'plugin-executed')));
});
test('installed review fix1 refuses competing Vite and TypeScript alias mappings',()=>{
  const {host,bin}=reviewHost('aliases'),configFile=path.join(host,'vite.config.ts');
  for(const text of [reviewVite.replace('alias:{',"alias:{'@hangyeol/primitives':'./elsewhere',"),reviewVite.replace('}},plugins',",'@hangyeol/primitives':'./elsewhere'}},plugins")]) {
    fs.writeFileSync(configFile,text);unchanged('review-alias',host,bin,['init',...reviewFlags],1,{diagnostic:/intercept|competing|ambiguous.*alias/i});
  }
  fs.writeFileSync(configFile,reviewVite);fs.writeFileSync(path.join(host,'tsconfig.json'),JSON.stringify({compilerOptions:{paths:{'@hangyeol/primitives/*':['./elsewhere/*']}}}));
  unchanged('review-ts-alias',host,bin,['init',...reviewFlags],1,{diagnostic:/intercept|competing|ambiguous.*alias/i});
});
test('installed review fix1 reserves host config paths without file/package/lock/npm mutation',()=>{
  const {host,bin}=reviewHost('targets'),packageFile=path.join(host,'package.json'),pkg=JSON.parse(fs.readFileSync(packageFile));delete pkg.dependencies.clsx;fs.writeFileSync(packageFile,JSON.stringify(pkg));
  const trap=path.join(host,'fixture-bin'),trace=path.join(evidence,`installed-npm-trace-${process.hrtime.bigint()}.txt`);fs.mkdirSync(trap);fs.writeFileSync(trace,'');fs.writeFileSync(path.join(trap,'npm'),'#!/bin/sh\nprintf "npm invoked\\n" >> "$CORE02_NPM_TRACE"\nexit 93\n');fs.chmodSync(path.join(trap,'npm'),0o755);
  for(const [flag,value] of [['--style-path','vite.config.js'],['--source-root','vite.config.mjs/ui'],['--public-root','tsconfig.json'],['--font-path','vite.config.ts/fonts']]) {
    unchanged('review-target-'+flag,host,bin,['init',flag,value],1,{diagnostic:/reserved.*host|host.*target/i,env:{...process.env,PATH:trap+path.delimiter+process.env.PATH,CORE02_NPM_TRACE:trace}});assert.equal(fs.readFileSync(trace,'utf8'),'');
  }
});
test('installed review fix1 refuses alternative Vite script selections',()=>{
  const {host,bin}=reviewHost('scripts'),file=path.join(host,'package.json'),pkg=JSON.parse(fs.readFileSync(file));
  for(const script of ['vite -c custom.ts','vite -ccustom.ts','vite build other','vite preview -b/other/']) {
    fs.writeFileSync(file,JSON.stringify({...pkg,scripts:{dev:script}}));unchanged('review-script',host,bin,['init'],1,{diagnostic:/unsupported.*(?:script|vite)|effective.*host/i});
  }
});
test('installed review fix1 isolated publicDir mismatch identifies its own branch',()=>{
  const {host,bin}=reviewHost('publicdir');fs.writeFileSync(path.join(host,'vite.config.ts'),reviewVite.replace("publicDir:'static'","publicDir:'public'"));
  unchanged('review-publicdir',host,bin,['init',...reviewFlags],1,{diagnostic:/Vite publicDir conflicts/});
});

function installedBuildRefusal(option, diagnostic) {
  const {host,bin}=reviewHost('fix2-build'),pkgFile=path.join(host,'package.json'),pkg=JSON.parse(fs.readFileSync(pkgFile));
  delete pkg.dependencies.clsx;fs.writeFileSync(pkgFile,JSON.stringify(pkg));
  fs.writeFileSync(path.join(host,'vite.config.ts'),reviewVite.replace('plugins:',`build:${option},plugins:`));
  const trap=path.join(host,'fixture-bin'),trace=path.join(evidence,`fix2-installed-npm-trace-${process.hrtime.bigint()}.txt`);
  fs.mkdirSync(trap);fs.writeFileSync(trace,'');fs.writeFileSync(path.join(trap,'npm'),'#!/bin/sh\nprintf "npm invoked\\n" >> "$CORE02_NPM_TRACE"\nexit 93\n');fs.chmodSync(path.join(trap,'npm'),0o755);
  try {unchanged('fix2-build',host,bin,['init',...reviewFlags],1,{diagnostic,env:{...process.env,PATH:trap+path.delimiter+process.env.PATH,CORE02_NPM_TRACE:trace}});}
  finally {fs.writeFileSync(path.join(evidence,`fix2-installed-build-${process.hrtime.bigint()}.json`),JSON.stringify({host,option,trace,npmInvocations:fs.readFileSync(trace,'utf8')},null,2));}
  assert.equal(fs.readFileSync(trace,'utf8'),'','build rejection must precede npm');
}
test('installed review fix2 refuses disabled public asset copy before any writes or npm',()=>{
  installedBuildRefusal('{copyPublicDir:false}',/build\.copyPublicDir must be omitted or literal true.*public assets/i);
});
test('installed review fix2 refuses disabled production writes before any writes or npm',()=>{
  installedBuildRefusal('{write:false}',/build\.write must be omitted or literal true.*production assets/i);
});
test('installed review fix2 explicit enabled build options preserve actual custom production fonts',()=>{
  const {host,bin}=reviewHost('fix2-enabled'),text=reviewVite.replace('plugins:','build:{copyPublicDir:true,write:true},plugins:');
  fs.writeFileSync(path.join(host,'vite.config.ts'),text);unchanged('fix2-enabled-dry',host,bin,['init',...reviewFlags,'--dry-run'],0);
  run('fix2-enabled-init',bin,['init',...reviewFlags],host);assert.equal(fs.readFileSync(path.join(host,'vite.config.ts'),'utf8'),text);
  unchanged('fix2-enabled-repeat',host,bin,['init'],0);
  fs.writeFileSync(path.join(host,'index.html'),'<link rel="stylesheet" href="/styles/theme.css"><main data-hangyeol>Font build</main>\n');
  run('fix2-enabled-build',path.join(host,'node_modules/.bin/vite'),['build'],host);
  const manifest=JSON.parse(fs.readFileSync(path.join(host,'node_modules/@orderthan31/hangyeol-core/payload/manifest.json'))),fonts={};
  const css=fs.readdirSync(path.join(host,'dist/assets')).filter(p=>p.endsWith('.css')).map(p=>fs.readFileSync(path.join(host,'dist/assets',p),'utf8')).join('\n');
  for(const [name,record] of Object.entries(manifest.assets)) {
    const bytes=fs.readFileSync(path.join(host,'dist/assets/type',name));assert.equal(digest(bytes),record.hash);fonts[name]={sha256:digest(bytes),bytes:bytes.length};
    if(name.endsWith('.woff2'))assert.ok(css.includes('/design/assets/type/'+name));
  }
  const pkg=JSON.parse(fs.readFileSync(path.join(host,'package.json'))),lock=JSON.parse(fs.readFileSync(path.join(host,'package-lock.json'))),record=lock.packages['node_modules/@orderthan31/hangyeol-core'];
  assert.equal(record.version,artifact.version);assert.equal(record.dev,true);assert.equal(record.integrity,'sha512-'+crypto.createHash('sha512').update(fs.readFileSync(artifact.tarball)).digest('base64'));assert.equal(lock.packages[''].devDependencies['@orderthan31/hangyeol-core'],pkg.devDependencies['@orderthan31/hangyeol-core']);
  fs.writeFileSync(path.join(evidence,'enabled-build-evidence.json'),JSON.stringify({host,bin,fonts,explicitBuildOptions:{copyPublicDir:true,write:true},version:record.version,coreLock:record,coreDevDependency:pkg.devDependencies['@orderthan31/hangyeol-core'],browserFontLoad:'NOT RUN',http:'NOT RUN this cycle'},null,2));
});

for(const name of ['tailwindcss','tailwindcss/theme.css','tailwindcss/utilities.css'])test(`installed review fix3 refuses mandatory Tailwind alias ${name} before writes/npm`,()=>{
  const {host,bin}=reviewHost('fix3-alias'),text=reviewVite.replace('alias:{',`alias:{'${name}':'/absolute/alternate-tailwind',`);
  fs.writeFileSync(path.join(host,'vite.config.ts'),text);
  for(const [file,body] of [['styles/theme.css','body { color: chocolate; }\n'],['ui/system/owner.txt','existing source\n'],['static/assets/type/owner.txt','existing asset\n'],['.hangyeol-backups/owner/checkpoint.txt','existing backup\n']]){fs.mkdirSync(path.dirname(path.join(host,file)),{recursive:true});fs.writeFileSync(path.join(host,file),body);}
  const trap=path.join(host,'fixture-bin'),trace=path.join(evidence,`fix3-installed-npm-trace-${process.hrtime.bigint()}.txt`);
  fs.mkdirSync(trap);fs.writeFileSync(trace,'');fs.writeFileSync(path.join(trap,'npm'),'#!/bin/sh\nprintf "npm invoked\\n" >> "$CORE02_NPM_TRACE"\nexit 93\n');fs.chmodSync(path.join(trap,'npm'),0o755);
  try {unchanged('fix3-alias',host,bin,['init',...reviewFlags],1,{diagnostic:/alias .*intercepts mandatory Tailwind import.*remove or rename/i,env:{...process.env,PATH:trap+path.delimiter+process.env.PATH,CORE02_NPM_TRACE:trace}});}
  finally {fs.writeFileSync(path.join(evidence,`fix3-installed-alias-${process.hrtime.bigint()}.json`),JSON.stringify({host,bin,alias:name,input:text,args:['init',...reviewFlags],trace,npmInvocations:fs.readFileSync(trace,'utf8'),fixtureKind:'physical installed localbin; real package/lock/node_modules'},null,2));}
  assert.equal(fs.readFileSync(trace,'utf8'),'','alias refusal must precede npm');
});
test('installed review fix3 preserves normal UI and unrelated near-prefix aliases individually',()=>{
  const {host,bin}=reviewHost('fix3-near-prefix');
  for(const name of [null,'tailwindcss-extra','tailwindcss/theme.css-extra','tailwindcss/utilities.css-extra']) {
    const text=name===null?reviewVite:reviewVite.replace('alias:{',`alias:{'${name}':'/absolute/unrelated',`);
    fs.writeFileSync(path.join(host,'vite.config.ts'),text);run('fix3-compatible-init',bin,['init',...reviewFlags],host);assert.equal(fs.readFileSync(path.join(host,'vite.config.ts'),'utf8'),text);
    unchanged('fix3-compatible-repeat',host,bin,['init'],0);
  }
});
test('installed review fix3 generated UI alias cannot select mandatory imports',()=>{
  const {host,bin}=reviewHost('fix3-generated');
  for(const name of ['tailwindcss','tailwindcss/theme.css','tailwindcss/utilities.css'])unchanged('fix3-generated-alias',host,bin,['init','--alias',name],1,{diagnostic:/alias must be a safe @name path/});
  run('fix3-generated-compatible',bin,['init','--alias','@tailwindcss'],host);unchanged('fix3-generated-repeat',host,bin,['init'],0);
});

function p2InstalledHost(base,mode) {
  const {host,bin}=reviewHost('p2-base'),installed=path.join(host,'node_modules/@orderthan31/hangyeol-core'),config={schemaVersion:1,sourceRoot:'ui/system',stylePath:'styles/theme.css',publicRoot:'static',fontPath:'assets/type',alias:'@hangyeol',installed:{},components:[],basePath:base};
  for(const [file,bytes] of [['styles/theme.css',Buffer.from('body { color: chocolate; }\n')],['ui/system/lib/cn.ts',fs.readFileSync(path.join(installed,'payload/source/lib/cn.ts'))],['static/assets/type/owner.txt',Buffer.from('owner asset\n')],['.hangyeol-backups/sentinel/owner.txt',Buffer.from('owner backup\n')],['owner-metadata.json',Buffer.from('{"owner":"sentinel"}\n')]]){fs.mkdirSync(path.dirname(path.join(host,file)),{recursive:true});fs.writeFileSync(path.join(host,file),bytes);}
  fs.symlinkSync('owner-metadata.json',path.join(host,'owner-link'));
  if(mode==='config')fs.writeFileSync(path.join(host,'hangyeol.json'),JSON.stringify(config,null,2)+'\n');
  const flags=mode==='config'?[]:['--source-root',config.sourceRoot,'--style-path',config.stylePath,'--public-root',config.publicRoot,'--font-path',config.fontPath,'--alias',config.alias,'--base-path',base];
  const trap=path.join(host,'fixture-bin'),trace=path.join(evidence,`p2-installed-npm-${process.hrtime.bigint()}.txt`);fs.mkdirSync(trap);fs.writeFileSync(trace,'');fs.writeFileSync(path.join(trap,'npm'),'#!/bin/sh\nprintf "npm invoked\\n" >> "$CORE02_NPM_TRACE"\nexit 93\n');fs.chmodSync(path.join(trap,'npm'),0o755);
  return {host,bin,installed,base,mode,config,flags,trace,env:{...process.env,PATH:trap+path.delimiter+process.env.PATH,CORE02_NPM_TRACE:trace}};
}
function p2InstalledCall(fixture,args) {
  const {host,bin,installed,base,mode,trace,env}=fixture,command=[bin,...args],before=snapshot(host),started=new Date().toISOString(),start=performance.now();
  const result=spawnSync(bin,args,{cwd:host,encoding:'utf8',env,maxBuffer:16e6}),after=snapshot(host),file=path.join(host,'ui/system/foundation/fonts.css');
  const origin='https://host.example',urls=fs.existsSync(file)?[...fs.readFileSync(file,'utf8').matchAll(/url\("([^"\n]+)"\)/g)].map(([,input])=>{const url=new URL(input,origin);return {input,origin:url.origin,pathname:url.pathname};}):[];
  const pkg=JSON.parse(fs.readFileSync(path.join(host,'package.json'))),lock=JSON.parse(fs.readFileSync(path.join(host,'package-lock.json'))),coreLock=lock.packages['node_modules/@orderthan31/hangyeol-core'];
  assert.equal(coreLock.version,artifact.version);assert.equal(coreLock.dev,true);assert.equal(coreLock.integrity,'sha512-'+crypto.createHash('sha512').update(fs.readFileSync(artifact.tarball)).digest('base64'));assert.equal(lock.packages[''].devDependencies['@orderthan31/hangyeol-core'],pkg.devDependencies['@orderthan31/hangyeol-core']);
  fs.writeFileSync(path.join(evidence,`p2-installed-call-${process.hrtime.bigint()}.json`),JSON.stringify({runner:'physical-installed',base,mode,input:fixture.config,args,command,cwd:host,started,durationMs:performance.now()-start,runtime:process.version,exit:result.status,stdout:result.stdout,stderr:result.stderr,before,after,npmTrace:trace,npmInvocations:fs.readFileSync(trace,'utf8'),generatedFontURLs:urls,installerSha256:digest(fs.readFileSync(path.join(installed,'dist/tools/installer.mjs'))),bin,binResolved:fs.realpathSync(bin),physicalPackage:!fs.lstatSync(installed).isSymbolicLink(),tarball:artifact.tarball,tarballSha256:digest(fs.readFileSync(artifact.tarball)),coreLock,coreDevPin:pkg.devDependencies['@orderthan31/hangyeol-core'],lockRootCorePin:lock.packages[''].devDependencies['@orderthan31/hangyeol-core']},null,2));
  return {result,before,after,urls};
}
for(const base of ['//','//cdn/'])for(const mode of ['flags','config'])test(`basePath P2 refuses installed ${mode} ${base} atomically`,()=>{
  const fixture=p2InstalledHost(base,mode),{result,before,after}=p2InstalledCall(fixture,['init',...fixture.flags]);
  assert.equal(result.status,1,result.stdout+'\n'+result.stderr);assert.match(result.stderr,/basePath.*same-origin root-relative.*leading \/\//i);assert.deepEqual(after,before,'complete bytes/mtimeNs/modes/links including node_modules must remain unchanged');assert.equal(fs.readFileSync(fixture.trace,'utf8'),'');
});
for(const base of ['/','/design/'])for(const mode of ['flags','config'])test(`basePath P2 preserves installed ${mode} ${base} same-origin fonts/no-op`,()=>{
  const fixture=p2InstalledHost(base,mode),first=p2InstalledCall(fixture,['init',...fixture.flags]);assert.equal(first.result.status,0,first.result.stderr);assert.equal(first.urls.length,4);
  for(const url of first.urls){assert.equal(url.origin,'https://host.example');assert.ok(url.pathname.startsWith(base+'assets/type/'));}
  assert.deepEqual(first.urls.map(url=>url.pathname),['Regular','Medium','SemiBold','Bold'].map(name=>base+'assets/type/Pretendard-'+name+'.woff2'));
  const manifest=JSON.parse(fs.readFileSync(path.join(fixture.installed,'payload/manifest.json')));for(const [name,record] of Object.entries(manifest.assets))assert.equal(digest(fs.readFileSync(path.join(fixture.host,'static/assets/type',name))),record.hash);
  const repeat=p2InstalledCall(fixture,['init']);assert.equal(repeat.result.status,0,repeat.result.stderr);assert.deepEqual(repeat.after,repeat.before);assert.equal(fs.readFileSync(fixture.trace,'utf8'),'');
});
test('basePath P2 common installed guard covers add/dry-run/overwrite without bypass',()=>{
  const fixture=p2InstalledHost('//cdn/','config');
  for(const args of [['init','--dry-run'],['init','--overwrite'],['add','button'],['add','button','--dry-run','--overwrite']]){
    const call=p2InstalledCall(fixture,args);assert.equal(call.result.status,1,call.result.stderr);assert.match(call.result.stderr,/basePath.*same-origin root-relative.*leading \/\//i);assert.deepEqual(call.after,call.before);assert.equal(fs.readFileSync(fixture.trace,'utf8'),'');
  }
});

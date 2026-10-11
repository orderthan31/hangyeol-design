import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import test from 'node:test';

const evidence=process.env.CORE04_EVIDENCE_DIR;
assert.ok(evidence,'Require designated CORE04 scratch');
const artifact=JSON.parse(fs.readFileSync(path.join(evidence,'artifact.json')));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function snapshot(dir,base=dir){
 const s=fs.lstatSync(dir,{bigint:true}),out=dir===base?{'.':{mtimeNs:String(s.mtimeNs),mode:String(s.mode)}}:{};
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,entry.name),stat=fs.lstatSync(p,{bigint:true});
  out[path.relative(base,p)]={mtimeNs:String(stat.mtimeNs),mode:String(stat.mode),...(entry.isFile()?{sha256:sha(fs.readFileSync(p))}:{}),...(entry.isSymbolicLink()?{link:fs.readlinkSync(p)}:{})};
  if(entry.isDirectory())Object.assign(out,snapshot(p,base));
 }return out;
}
function run(label,command,args,cwd,expected=0,env=process.env){
 const started=new Date().toISOString(),start=performance.now(),r=spawnSync(command,args,{cwd,encoding:'utf8',maxBuffer:16e6,env});
 const record={command:[command,...args],cwd,started,runtime:process.version,durationMs:performance.now()-start,exit:r.status,expectedExit:expected,stdout:r.stdout,stderr:r.stderr};
 fs.writeFileSync(path.join(evidence,`installed-textfield-command-${label}-${process.hrtime.bigint()}.json`),JSON.stringify(record,null,2));
 assert.equal(r.status,expected,`${label}: ${r.stdout}\n${r.stderr}`);return r;
}
function plan(r){return JSON.parse(r.stdout.slice(0,r.stdout.indexOf('\n}')+2));}
function readJSON(p){return JSON.parse(fs.readFileSync(p));}

test('physical TextField closure dedupes shared Button, retains edits and builds editable local sources',()=>{
 const host=fs.mkdtempSync(path.join(evidence,'textfield-installed-'));
 const manifest=readJSON(path.join(artifact.unpacked,'package/payload/manifest.json'));
 const settings={schemaVersion:1,sourceRoot:'ui/system',stylePath:'styles/theme.css',publicRoot:'static',fontPath:'assets/type',basePath:'/design/',alias:'@hangyeol'};
 const initialConfig={...settings,ownerSetting:{density:'owner-kept'}};
 const body='body { margin: 17px; color: chocolate; }\n.native-sentinel { padding: 13px; }\n';
 fs.writeFileSync(path.join(host,'package.json'),JSON.stringify({name:'core04-textfield-host',private:true,type:'module',description:'original owner metadata',dependencies:{react:'19.2.0','react-dom':'19.2.0',postcss:'8.5.28'},devDependencies:{vite:'7.3.6',typescript:'5.9.3',...manifest.build,...manifest.types},scripts:{build:'vite build'}},null,2)+'\n');
 fs.writeFileSync(path.join(host,'sentinel.txt'),'unrelated owner file\n');const pkgBefore=readJSON(path.join(host,'package.json'));
 run('physical-install','npm',['install','--offline','--save-dev','--save-exact',artifact.tarball],host);
 const installed=path.join(host,'node_modules/@orderthan31/hangyeol-core'),bin=path.join(host,'node_modules/.bin/hangyeol');
 assert.equal(fs.lstatSync(installed).isSymbolicLink(),false);assert.equal(fs.realpathSync(bin),path.join(installed,'bin/hangyeol.mjs'));
 assert.equal(sha(fs.readFileSync(artifact.tarball)),artifact.sha256);assert.equal(run('version',bin,['--version'],host).stdout.trim(),artifact.version);
 assert.ok(!fs.existsSync(path.join(host,'hangyeol.json'))&&!fs.existsSync(path.join(host,'ui')),'no postinstall generation');
 const lockBefore=readJSON(path.join(host,'package-lock.json')),coreBefore=lockBefore.packages['node_modules/@orderthan31/hangyeol-core'];
 const integrity='sha512-'+crypto.createHash('sha512').update(fs.readFileSync(artifact.tarball)).digest('base64');assert.equal(coreBefore.integrity,integrity);assert.notEqual(coreBefore.link,true);
 assert.equal(sha(fs.readFileSync(path.join(installed,'dist/tools/installer.mjs'))),sha(fs.readFileSync(new URL('../src/tools/installer.mjs',import.meta.url))));
 assert.deepEqual(readJSON(path.join(installed,'payload/manifest.json')),manifest);
 fs.mkdirSync(path.join(host,'styles'));fs.writeFileSync(path.join(host,settings.stylePath),body);fs.writeFileSync(path.join(host,'hangyeol.json'),JSON.stringify(initialConfig,null,2)+'\n');
 fs.writeFileSync(path.join(host,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'ES2022',lib:['ES2022','DOM'],module:'ESNext',moduleResolution:'Bundler',jsx:'react-jsx',strict:true,skipLibCheck:true,noEmit:true},include:['src','ui']},null,2)+'\n');
 function checked(label,args,{expected=0,unchanged=false,diagnostic,guard=true}={}){
  const before=snapshot(host),guardDir=fs.mkdtempSync(path.join(evidence,'textfield-npm-guard-')),trace=path.join(guardDir,'trace');fs.writeFileSync(trace,'');
  fs.writeFileSync(path.join(guardDir,'npm'),'#!/bin/sh\nprintf "npm invoked\\n" >> "$CORE04_NPM_TRACE"\nexit 93\n');fs.chmodSync(path.join(guardDir,'npm'),0o755);
  const env=guard?{...process.env,PATH:guardDir+path.delimiter+process.env.PATH,CORE04_NPM_TRACE:trace}:process.env;
  let r,after;try{r=run(label,bin,args,host,expected,env);}finally{
   after=snapshot(host);fs.writeFileSync(path.join(evidence,`installed-textfield-snapshot-${label}-${process.hrtime.bigint()}.json`),JSON.stringify({host,args,before,after,npmTrace:trace,npmCalls:fs.readFileSync(trace,'utf8'),guarded:guard},null,2));
  }
  if(guard)assert.equal(fs.readFileSync(trace,'utf8'),'','installer must not invoke npm for noops or preflight conflicts');
  if(unchanged)assert.deepEqual(after,before,'complete physical snapshot including package/lock/settings/node_modules/assets must remain unchanged');
  if(diagnostic)assert.match(r.stderr,diagnostic);return r;
 }
 const initDry=plan(checked('init-dry',['init','--dry-run'],{unchanged:true}));assert.deepEqual(initDry.dependencies.runtime.sort(),['clsx@2.1.1','tailwind-merge@3.7.0']);
 const initPlan=plan(checked('init',['init'],{guard:false}));const initialized=readJSON(path.join(host,'hangyeol.json')),pkgInit=readJSON(path.join(host,'package.json'));
 assert.deepEqual(initialized.components,[]);assert.deepEqual(initialized.integration.settings,Object.fromEntries(Object.keys(settings).filter(k=>k!=='schemaVersion').map(k=>[k,settings[k]])));assert.equal(initialized.integration.styleBody,body);
 const hostCSS=fs.readFileSync(path.join(host,settings.stylePath),'utf8');assert.ok(hostCSS.endsWith(body));assert.match(hostCSS,/@source "\.\.\/ui\/system"/);assert.match(hostCSS,/@import "tailwindcss\/theme.css"/);assert.match(hostCSS,/@import "tailwindcss\/utilities.css"/);assert.ok(!/preflight|@import "tailwindcss"/.test(hostCSS));
 assert.deepEqual(readJSON(path.join(host,'tsconfig.json')).compilerOptions.paths,{'@hangyeol/*':['./ui/system/*']});assert.match(fs.readFileSync(path.join(host,'vite.config.ts'),'utf8'),/ui\/system/);
 checked('init-repeat',['init'],{unchanged:true});
 const commonRecords=Object.fromEntries(manifest.common.map(name=>[settings.sourceRoot+'/'+name,initialized.installed[settings.sourceRoot+'/'+name]]));
 const theme=path.join(host,'ui/system/foundation/theme.css'),helper=path.join(host,'ui/system/lib/cn.ts');
 fs.writeFileSync(theme,fs.readFileSync(theme,'utf8').replace('--g-action: #465c36;','--g-action: #654321;'));fs.appendFileSync(helper,'\nexport const core04OwnerHelper = "owner keeps this helper";\n');
 const commonState=()=>({theme:snapshot(path.dirname(theme))['theme.css'],helper:snapshot(path.dirname(helper))['cn.ts']}),commonBefore=commonState();
 const buttonPlan=plan(checked('button-first',['add','button'])),button=path.join(host,'ui/system/primitives/button.tsx'),buttonBefore=snapshot(path.dirname(button))['button.tsx'];
 checked('textfield-dry',['add','text-field','--dry-run'],{unchanged:true});const addPlan=plan(checked('textfield',['add','text-field']));
 const expectedUI=['components/text-field.tsx','foundation/theme.css','lib/cn.ts','primitives/button.tsx','primitives/input.tsx'];
 assert.equal(new Set(addPlan.files.map(f=>f.path)).size,addPlan.files.length);assert.deepEqual(addPlan.files.map(f=>f.path).sort(),expectedUI.map(f=>'ui/system/'+f));assert.deepEqual(addPlan.dependencies,{runtime:[]});
 assert.deepEqual(addPlan.files.filter(f=>f.action!=='noop').map(f=>f.path).sort(),['ui/system/components/text-field.tsx','ui/system/primitives/input.tsx']);
 assert.equal(addPlan.files.find(f=>f.path.endsWith('/button.tsx')).action,'noop');assert.deepEqual(snapshot(path.dirname(button))['button.tsx'],buttonBefore);
 checked('textfield-repeat',['add','text-field'],{unchanged:true});const overlap=plan(checked('overlap',['add','text-field','input','button'],{unchanged:true}));assert.equal(new Set(overlap.files.map(f=>f.path)).size,5);assert.ok(overlap.files.every(f=>f.action==='noop'));
 const expectedSources=[...expectedUI,'foundation/fonts.css'].sort(),graph=snapshot(path.join(host,settings.sourceRoot));assert.deepEqual(Object.keys(graph).filter(k=>graph[k].sha256).sort(),expectedSources);
 const componentFiles=['primitives/input.tsx','primitives/button.tsx','components/text-field.tsx'];
 for(const name of componentFiles)assert.equal(sha(fs.readFileSync(path.join(host,settings.sourceRoot,name))),manifest.files[name].hash);
 const tf=path.join(host,settings.sourceRoot,'components/text-field.tsx'),tfText=fs.readFileSync(tf,'utf8');assert.match(tfText,/from '\.\.\/primitives\/input'/);assert.match(tfText,/from '\.\.\/primitives\/button'/);assert.match(tfText,/from '\.\.\/lib\/cn'/);
 for(const file of expectedSources)assert.ok(!/from\s*['"](?:@orderthan31\/hangyeol-core|@orderthan31\/hangyeol-core\/tools)/.test(fs.readFileSync(path.join(host,settings.sourceRoot,file),'utf8')));
 const fonts={};for(const [name,record] of Object.entries(manifest.assets)){
  const bytes=fs.readFileSync(path.join(host,'static/assets/type',name));assert.equal(sha(bytes),record.hash);assert.deepEqual(bytes,fs.readFileSync(path.join(installed,'payload/assets',name)));if(name.endsWith('.woff2'))assert.equal(bytes.subarray(0,4).toString(),'wOF2');fonts[name]={sha256:sha(bytes),bytes:bytes.length};
 }
 const urls=[...fs.readFileSync(path.join(host,'ui/system/foundation/fonts.css'),'utf8').matchAll(/url\("([^" ]+)"\)/g)].map(m=>new URL(m[1],'https://fixture.invalid/design/'));assert.equal(urls.length,4);for(const u of urls){assert.equal(u.origin,'https://fixture.invalid');assert.ok(u.pathname.startsWith('/design/assets/type/'));}
 fs.mkdirSync(path.join(host,'src'));fs.writeFileSync(path.join(host,'index.html'),'<div id="root"></div><script type="module" src="/src/main.tsx"></script>\n');
 fs.writeFileSync(path.join(host,'src/main.tsx'),"import {createRoot} from 'react-dom/client';import {TextField} from '../ui/system/components/text-field';import '../styles/theme.css';createRoot(document.getElementById('root')!).render(<main data-hangyeol><TextField label=\"이름\" defaultValue=\"문서\" name=\"owner\" clearable /><span className=\"native-sentinel\">Native</span></main>);\n");
 run('typecheck',path.join(host,'node_modules/.bin/tsc'),['--pretty','false'],host);run('build',path.join(host,'node_modules/.bin/vite'),['build'],host);
 const built=()=>fs.readdirSync(path.join(host,'dist/assets')).filter(f=>/\.(?:css|js)$/.test(f)).map(f=>fs.readFileSync(path.join(host,'dist/assets',f),'utf8')).join('\n');
 assert.ok(built().includes('.inline-flex'));assert.ok(built().includes('#654321'),'real compiler uses owner theme');assert.ok(built().includes('margin:17px'));const marker='CORE04_LOCAL_TEXTFIELD_VISIBLE';assert.ok(!built().includes(marker));
 const backups=[];
 for(const name of componentFiles){
  const file=path.join(host,settings.sourceRoot,name),original=fs.readFileSync(file,'utf8');
  const edited=name.endsWith('text-field.tsx')?original.replace('>{label}</label>',`>{label} ${marker}</label>`):original+'\n// CORE04 individual local component edit\n';assert.notEqual(edited,original);fs.writeFileSync(file,edited);
  if(name.endsWith('text-field.tsx')){run('typecheck-local-edit',path.join(host,'node_modules/.bin/tsc'),['--pretty','false'],host);run('build-local-edit',path.join(host,'node_modules/.bin/vite'),['build'],host);assert.ok(built().includes(marker),'visible local TextField label edit appears in real bundle');}
  checked('conflict-'+path.basename(name),['add','text-field'],{expected:1,unchanged:true,diagnostic:new RegExp('conflict.*'+path.basename(name).replaceAll('.','\\.'))});
  const overwrite=plan(checked('overwrite-'+path.basename(name),['add','text-field','--overwrite'])),changed=overwrite.files.filter(f=>f.action!=='noop');assert.deepEqual(changed.map(f=>f.path),['ui/system/'+name]);const backup=path.join(host,changed[0].backup);assert.equal(fs.readFileSync(backup,'utf8'),edited);assert.equal(sha(fs.readFileSync(file)),manifest.files[name].hash);assert.deepEqual(commonState(),commonBefore);
  backups.push({source:name,backup,editedHash:sha(Buffer.from(edited)),backupHash:sha(fs.readFileSync(backup)),plan:overwrite});
 }
 // --overwrite restores every edited component in the requested closure, not just TextField.
 const allEdited=Object.fromEntries(componentFiles.map(name=>{const f=path.join(host,settings.sourceRoot,name);fs.appendFileSync(f,'\n// CORE04 closure overwrite\n');return [name,fs.readFileSync(f)];}));
 const closureOverwrite=plan(checked('overwrite-closure',['add','text-field','--overwrite']));assert.deepEqual(closureOverwrite.files.filter(f=>f.action!=='noop').map(f=>f.path).sort(),componentFiles.map(f=>'ui/system/'+f).sort());
 for(const name of componentFiles){const f=closureOverwrite.files.find(f=>f.path==='ui/system/'+name);assert.deepEqual(fs.readFileSync(path.join(host,f.backup)),allEdited[name]);}
 checked('overwrite-repeat',['add','text-field','--overwrite'],{unchanged:true});assert.deepEqual(commonState(),commonBefore);
 const finalConfig=readJSON(path.join(host,'hangyeol.json'));for(const [name,record] of Object.entries(commonRecords))assert.deepEqual(finalConfig.installed[name],record);assert.deepEqual(finalConfig.integration,initialized.integration);assert.deepEqual(finalConfig.ownerSetting,initialConfig.ownerSetting);assert.deepEqual([...finalConfig.components].sort(),['button','input','text-field']);
 assert.equal(fs.readFileSync(path.join(host,'sentinel.txt'),'utf8'),'unrelated owner file\n');assert.equal(fs.readFileSync(path.join(host,settings.stylePath),'utf8'),hostCSS);
 const finalPkg=readJSON(path.join(host,'package.json')),finalLock=readJSON(path.join(host,'package-lock.json')),core=finalLock.packages['node_modules/@orderthan31/hangyeol-core'];
 assert.equal(core.version,artifact.version);assert.equal(core.integrity,integrity);assert.equal(core.resolved,coreBefore.resolved);assert.equal(core.dev,true);assert.notEqual(core.link,true);
 assert.equal(finalPkg.devDependencies['@orderthan31/hangyeol-core'],lockBefore.packages[''].devDependencies['@orderthan31/hangyeol-core']);assert.equal(finalLock.packages[''].devDependencies['@orderthan31/hangyeol-core'],finalPkg.devDependencies['@orderthan31/hangyeol-core']);assert.ok(!finalPkg.dependencies['@orderthan31/hangyeol-core']);
 assert.deepEqual(finalPkg.dependencies,{...pkgBefore.dependencies,...manifest.runtime});assert.deepEqual(finalPkg,pkgInit);assert.equal(finalPkg.description,pkgBefore.description);assert.ok(!Object.keys({...finalPkg.dependencies,...finalPkg.devDependencies}).some(name=>/radix|recharts|react-is/.test(name)));
 for(const [name,record] of Object.entries(fonts))assert.equal(sha(fs.readFileSync(path.join(host,'dist/assets/type',name))),record.sha256);
 const finalGraph=snapshot(path.join(host,settings.sourceRoot));for(const name of componentFiles)assert.equal(finalGraph[name].sha256,manifest.files[name].hash);
 fs.writeFileSync(path.join(evidence,'installed-textfield-evidence.json'),JSON.stringify({host,physicalPackage:installed,bin,binResolved:fs.realpathSync(bin),physicalLink:false,tarball:artifact.tarball,sha256:artifact.sha256,version:artifact.version,integrity,coreLock:core,coreDevPin:finalPkg.devDependencies['@orderthan31/hangyeol-core'],pkgBefore,pkgInit,finalPkg,initPlan,buttonPlan,addPlan,overlap,backups,closureOverwrite,commonRecords,commonBefore,sourceGraph:graph,finalGraph,fonts,fontURLs:urls.map(u=>u.href),localEditMarker:marker,toolTransitiveMatchingPackages:Object.keys(finalLock.packages).filter(p=>/radix|recharts|react-is/.test(p)),cache:'prepared Mac offline cache; no empty-cache/VPS/live registry proof',license:'guarded UNLICENSED first-party candidate; copied Pretendard SIL OFL 1.1 license/provenance unchanged',http:'NOT RUN',browserFontLoad:'NOT RUN',browserAT:'NOT RUN'},null,2));
});

test('fresh physical host init then text-field alone installs exactly its deduped closure',()=>{
 const host=fs.mkdtempSync(path.join(evidence,'textfield-direct-installed-')),manifest=readJSON(path.join(artifact.unpacked,'package/payload/manifest.json'));
 fs.writeFileSync(path.join(host,'package.json'),JSON.stringify({name:'core04-direct-host',private:true,type:'module',dependencies:{react:'19.2.0','react-dom':'19.2.0',...manifest.runtime},devDependencies:{vite:'7.3.6',...manifest.build,...manifest.types}},null,2)+'\n');
 run('direct-physical-install','npm',['install','--offline','--save-dev','--save-exact',artifact.tarball],host);
 const installed=path.join(host,'node_modules/@orderthan31/hangyeol-core'),bin=path.join(host,'node_modules/.bin/hangyeol');assert.equal(fs.lstatSync(installed).isSymbolicLink(),false);assert.equal(fs.realpathSync(bin),path.join(installed,'bin/hangyeol.mjs'));
 assert.equal(run('direct-version',bin,['--version'],host).stdout.trim(),artifact.version);assert.ok(!fs.existsSync(path.join(host,'src')),'physical tool installation has no UI postinstall');
 const guard=fs.mkdtempSync(path.join(evidence,'direct-npm-guard-')),trace=path.join(guard,'trace');fs.writeFileSync(trace,'');fs.writeFileSync(path.join(guard,'npm'),'#!/bin/sh\nprintf "npm invoked\\n" >> "$CORE04_NPM_TRACE"\nexit 93\n');fs.chmodSync(path.join(guard,'npm'),0o755);const env={...process.env,PATH:guard+path.delimiter+process.env.PATH,CORE04_NPM_TRACE:trace};
 const initPlan=plan(run('direct-init',bin,['init'],host,0,env));assert.deepEqual(readJSON(path.join(host,'hangyeol.json')).components,[]);assert.ok(!fs.existsSync(path.join(host,'src/hangyeol/primitives')));
 const addPlan=plan(run('direct-textfield',bin,['add','text-field'],host,0,env)),graph=snapshot(path.join(host,'src/hangyeol'));
 const expected=['components/text-field.tsx','foundation/fonts.css','foundation/theme.css','lib/cn.ts','primitives/button.tsx','primitives/input.tsx'];assert.deepEqual(Object.keys(graph).filter(k=>graph[k].sha256).sort(),expected);assert.equal(addPlan.files.length,5);assert.equal(new Set(addPlan.files.map(f=>f.path)).size,5);assert.deepEqual(addPlan.dependencies,{runtime:[]});
 for(const file of expected.filter(name=>name!=='foundation/fonts.css'))assert.equal(graph[file].sha256,manifest.files[file].hash);
 const before=snapshot(host);run('direct-overlap-repeat',bin,['add','text-field','input','button'],host,0,env);const after=snapshot(host);fs.writeFileSync(path.join(evidence,'installed-textfield-direct-snapshot.json'),JSON.stringify({host,args:['add','text-field','input','button'],before,after,npmTrace:trace,npmCalls:fs.readFileSync(trace,'utf8'),guarded:true},null,2));assert.deepEqual(after,before);assert.equal(fs.readFileSync(trace,'utf8'),'');
 const pkg=readJSON(path.join(host,'package.json')),lock=readJSON(path.join(host,'package-lock.json')),core=lock.packages['node_modules/@orderthan31/hangyeol-core'],integrity='sha512-'+crypto.createHash('sha512').update(fs.readFileSync(artifact.tarball)).digest('base64');
 assert.equal(core.version,artifact.version);assert.equal(core.integrity,integrity);assert.equal(core.dev,true);assert.notEqual(core.link,true);assert.equal(core.resolved,pkg.devDependencies['@orderthan31/hangyeol-core']);assert.equal(lock.packages[''].devDependencies['@orderthan31/hangyeol-core'],pkg.devDependencies['@orderthan31/hangyeol-core']);
 fs.writeFileSync(path.join(evidence,'installed-textfield-direct-evidence.json'),JSON.stringify({host,bin,binResolved:fs.realpathSync(bin),physicalPackage:installed,physicalLink:false,tarball:artifact.tarball,sha256:sha(fs.readFileSync(artifact.tarball)),version:artifact.version,integrity,coreLock:core,coreDevPin:pkg.devDependencies['@orderthan31/hangyeol-core'],package:pkg,initPlan,addPlan,sourceGraph:graph,npmTrace:trace,npmCalls:fs.readFileSync(trace,'utf8')},null,2));
});

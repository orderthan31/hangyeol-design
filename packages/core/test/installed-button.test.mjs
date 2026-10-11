import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import test from 'node:test';

const evidence=process.env.CORE03_EVIDENCE_DIR;
assert.ok(evidence,'Require designated CORE03 scratch');
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
 fs.writeFileSync(path.join(evidence,`installed-button-command-${label}-${process.hrtime.bigint()}.json`),JSON.stringify(record,null,2));
 assert.equal(r.status,expected,`${label}: ${r.stdout}\n${r.stderr}`);return r;
}
function plan(r){return JSON.parse(r.stdout.slice(0,r.stdout.indexOf('\n}')+2));}
function readJSON(p){return JSON.parse(fs.readFileSync(p));}

test('physical core installs only editable Button graph and preserves initialized commons throughout add',()=>{
 const host=fs.mkdtempSync(path.join(evidence,'button-installed-'));
 const manifest=readJSON(path.join(artifact.unpacked,'package/payload/manifest.json'));
 const settings={schemaVersion:1,sourceRoot:'ui/system',stylePath:'styles/theme.css',publicRoot:'static',fontPath:'assets/type',basePath:'/design/',alias:'@hangyeol'};
 const body='body { margin: 17px; color: chocolate; }\n.native-sentinel { padding: 13px; }\n';
 fs.writeFileSync(path.join(host,'package.json'),JSON.stringify({name:'core03-button-host',private:true,type:'module',dependencies:{react:'19.2.0','react-dom':'19.2.0'},devDependencies:{vite:'7.3.6',typescript:'5.9.3',...manifest.build,...manifest.types},scripts:{build:'vite build'}},null,2)+'\n');
 fs.writeFileSync(path.join(host,'sentinel.txt'),'unrelated owner file\n');
 const pkgBefore=readJSON(path.join(host,'package.json'));
 run('physical-install','npm',['install','--offline','--save-dev','--save-exact',artifact.tarball],host);
 const installed=path.join(host,'node_modules/@orderthan31/hangyeol-core'),bin=path.join(host,'node_modules/.bin/hangyeol');
 assert.equal(fs.lstatSync(installed).isSymbolicLink(),false);
 assert.equal(fs.realpathSync(bin),path.join(installed,'bin/hangyeol.mjs'));
 assert.equal(sha(fs.readFileSync(artifact.tarball)),artifact.sha256);
 assert.equal(run('version',bin,['--version'],host).stdout.trim(),artifact.version);
 assert.ok(!fs.existsSync(path.join(host,'hangyeol.json'))&&!fs.existsSync(path.join(host,'ui')),'no postinstall generation');
 const lockBefore=readJSON(path.join(host,'package-lock.json')),coreBefore=lockBefore.packages['node_modules/@orderthan31/hangyeol-core'];
 const integrity='sha512-'+crypto.createHash('sha512').update(fs.readFileSync(artifact.tarball)).digest('base64');
 assert.equal(coreBefore.integrity,integrity);
 assert.equal(sha(fs.readFileSync(path.join(installed,'dist/tools/installer.mjs'))),sha(fs.readFileSync(new URL('../src/tools/installer.mjs',import.meta.url))));
 const installedManifest=readJSON(path.join(installed,'payload/manifest.json'));assert.deepEqual(installedManifest,manifest);
 fs.mkdirSync(path.join(host,'styles'));fs.writeFileSync(path.join(host,settings.stylePath),body);
 fs.writeFileSync(path.join(host,'hangyeol.json'),JSON.stringify(settings,null,2)+'\n');
 fs.writeFileSync(path.join(host,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'ES2022',lib:['ES2022','DOM'],module:'ESNext',moduleResolution:'Bundler',jsx:'react-jsx',strict:true,skipLibCheck:true,noEmit:true},include:['src','ui']},null,2)+'\n');
 function checked(label,args,{expected=0,unchanged=false,diagnostic,guard=true}={}){
  const before=snapshot(host),guardDir=fs.mkdtempSync(path.join(evidence,'installed-npm-guard-')),trace=path.join(guardDir,'trace');fs.writeFileSync(trace,'');
  fs.writeFileSync(path.join(guardDir,'npm'),'#!/bin/sh\nprintf "npm invoked\\n" >> "$CORE03_NPM_TRACE"\nexit 93\n');fs.chmodSync(path.join(guardDir,'npm'),0o755);
  const env=guard?{...process.env,PATH:guardDir+path.delimiter+process.env.PATH,CORE03_NPM_TRACE:trace}:process.env;
  let r,after;try{r=run(label,bin,args,host,expected,env);}finally{
   after=snapshot(host);fs.writeFileSync(path.join(evidence,`installed-button-snapshot-${label}-${process.hrtime.bigint()}.json`),JSON.stringify({host,args,before,after,npmTrace:trace,npmCalls:fs.readFileSync(trace,'utf8'),guarded:guard},null,2));
  }
  if(guard)assert.equal(fs.readFileSync(trace,'utf8'),'','must plan conflicts/noops before npm');
  if(unchanged)assert.deepEqual(after,before,'complete physical host snapshot must remain unchanged');
  if(diagnostic)assert.match(r.stderr,diagnostic);return r;
 }
 const dryInit=plan(checked('init-dry',['init','--dry-run'],{unchanged:true}));
 assert.deepEqual(dryInit.dependencies.runtime.sort(),['clsx@2.1.1','tailwind-merge@3.7.0']);
 const initPlan=plan(checked('init',['init'],{guard:false}));
 const initialized=readJSON(path.join(host,'hangyeol.json')),pkgInit=readJSON(path.join(host,'package.json'));
 assert.deepEqual(initialized.components,[]);assert.ok(!fs.existsSync(path.join(host,'ui/system/primitives')));
 assert.deepEqual(initialized.integration.settings,Object.fromEntries(Object.keys(settings).filter(k=>k!=='schemaVersion').map(k=>[k,settings[k]])));
 assert.equal(initialized.integration.styleBody,body);
 const hostCSS=fs.readFileSync(path.join(host,settings.stylePath),'utf8');assert.ok(hostCSS.endsWith(body));
 assert.match(hostCSS,/@source "\.\.\/ui\/system"/);assert.match(hostCSS,/@import "tailwindcss\/theme.css"/);assert.match(hostCSS,/@import "tailwindcss\/utilities.css"/);assert.ok(!/preflight|@import "tailwindcss"/.test(hostCSS));
 checked('init-repeat',['init'],{unchanged:true});
 const commonRecords=Object.fromEntries(manifest.common.map(name=>[settings.sourceRoot+'/'+name,initialized.installed[settings.sourceRoot+'/'+name]]));
 const theme=path.join(host,'ui/system/foundation/theme.css'),helper=path.join(host,'ui/system/lib/cn.ts');
 fs.writeFileSync(theme,fs.readFileSync(theme,'utf8').replace('--g-action: #465c36;','--g-action: #654321;'));
 fs.appendFileSync(helper,'\nexport const core03OwnerHelper = "owner keeps this helper";\n');
 const commonBefore={theme:snapshot(path.dirname(theme))['theme.css'],helper:snapshot(path.dirname(helper))['cn.ts']};
 checked('add-dry',['add','button','--dry-run'],{unchanged:true});
 const addPlan=plan(checked('add',['add','button']));
 assert.deepEqual(addPlan.dependencies,{runtime:[]});
 assert.deepEqual(addPlan.files.filter(f=>f.action!=='noop').map(f=>f.path),['ui/system/primitives/button.tsx']);
 checked('add-repeat',['add','button'],{unchanged:true});
 const expectedSources=['foundation/fonts.css','foundation/theme.css','lib/cn.ts','primitives/button.tsx'];
 const graph=snapshot(path.join(host,settings.sourceRoot));
 assert.deepEqual(Object.keys(graph).filter(k=>graph[k].sha256).sort(),expectedSources);
 const button=path.join(host,'ui/system/primitives/button.tsx');
 assert.equal(sha(fs.readFileSync(button)),manifest.files['primitives/button.tsx'].hash);
 for(const file of expectedSources)assert.ok(!/from\s*['"](?:@orderthan31\/hangyeol-core|@orderthan31\/hangyeol-core\/tools)/.test(fs.readFileSync(path.join(host,settings.sourceRoot,file),'utf8')));
 const fonts={};for(const [name,record] of Object.entries(manifest.assets)){
  const bytes=fs.readFileSync(path.join(host,'static/assets/type',name));assert.equal(sha(bytes),record.hash);assert.deepEqual(bytes,fs.readFileSync(path.join(installed,'payload/assets',name)));
  if(name.endsWith('.woff2'))assert.equal(bytes.subarray(0,4).toString(),'wOF2');fonts[name]={sha256:sha(bytes),bytes:bytes.length};
 }
 const urls=[...fs.readFileSync(path.join(host,'ui/system/foundation/fonts.css'),'utf8').matchAll(/url\("([^" ]+)"\)/g)].map(m=>new URL(m[1],'https://fixture.invalid/design/'));
 assert.equal(urls.length,4);for(const u of urls){assert.equal(u.origin,'https://fixture.invalid');assert.ok(u.pathname.startsWith('/design/assets/type/'));}
 fs.mkdirSync(path.join(host,'src'));fs.writeFileSync(path.join(host,'index.html'),'<div id="root"></div><script type="module" src="/src/main.tsx"></script>\n');
 fs.writeFileSync(path.join(host,'src/main.tsx'),"import {createRoot} from 'react-dom/client';import {Button} from '../ui/system/primitives/button';import '../styles/theme.css';createRoot(document.getElementById('root')!).render(<main data-hangyeol><Button aria-label=\"local Button\">확인</Button><span className=\"native-sentinel\">Native</span></main>);\n");
 run('typecheck',path.join(host,'node_modules/.bin/tsc'),['--pretty','false'],host);
 run('build',path.join(host,'node_modules/.bin/vite'),['build'],host);
 const built=()=>fs.readdirSync(path.join(host,'dist/assets')).filter(f=>/\.(?:css|js)$/.test(f)).map(f=>fs.readFileSync(path.join(host,'dist/assets',f),'utf8')).join('\n');
 assert.ok(built().includes('.inline-flex'));assert.ok(built().includes('#654321'),'real compiled CSS uses owner theme edit');assert.ok(built().includes('margin:17px'),'original host body retained');
 const marker='CORE03_LOCAL_BUTTON_USED';assert.ok(!built().includes(marker));
 fs.writeFileSync(button,fs.readFileSync(button,'utf8').replace('return <button {...props}',`return <button data-core03-local="${marker}" {...props}`));const editedButton=fs.readFileSync(button);
 run('typecheck-local-edit',path.join(host,'node_modules/.bin/tsc'),['--pretty','false'],host);
 run('build-local-edit',path.join(host,'node_modules/.bin/vite'),['build'],host);
 assert.ok(built().includes(marker),'actual build consumes edited local Button rather than core runtime UI');
 checked('edited-button-conflict',['add','button'],{expected:1,unchanged:true,diagnostic:/conflict.*button/i});
 const overwrite=plan(checked('overwrite',['add','button','--overwrite']));
 const replacements=overwrite.files.filter(f=>f.action!=='noop');assert.deepEqual(replacements.map(f=>f.path),['ui/system/primitives/button.tsx']);
 assert.deepEqual(fs.readFileSync(path.join(host,replacements[0].backup)),editedButton);
 checked('overwrite-repeat',['add','button','--overwrite'],{unchanged:true});
 assert.deepEqual({theme:snapshot(path.dirname(theme))['theme.css'],helper:snapshot(path.dirname(helper))['cn.ts']},commonBefore);
 const finalConfig=readJSON(path.join(host,'hangyeol.json'));for(const [name,record] of Object.entries(commonRecords))assert.deepEqual(finalConfig.installed[name],record,'owner edits must not refresh installed template hashes');
 assert.deepEqual(finalConfig.integration,initialized.integration);assert.deepEqual(finalConfig.components,['button']);
 assert.equal(fs.readFileSync(path.join(host,'sentinel.txt'),'utf8'),'unrelated owner file\n');
 assert.equal(fs.readFileSync(path.join(host,settings.stylePath),'utf8'),hostCSS);
 const finalPkg=readJSON(path.join(host,'package.json')),finalLock=readJSON(path.join(host,'package-lock.json')),core=finalLock.packages['node_modules/@orderthan31/hangyeol-core'];
 assert.equal(core.version,artifact.version);assert.equal(core.integrity,integrity);assert.equal(core.resolved,coreBefore.resolved);assert.equal(core.dev,true);
 assert.equal(finalPkg.devDependencies['@orderthan31/hangyeol-core'],lockBefore.packages[''].devDependencies['@orderthan31/hangyeol-core']);assert.equal(finalLock.packages[''].devDependencies['@orderthan31/hangyeol-core'],finalPkg.devDependencies['@orderthan31/hangyeol-core']);assert.ok(!finalPkg.dependencies['@orderthan31/hangyeol-core']);
 assert.deepEqual(finalPkg.dependencies,{...pkgBefore.dependencies,...manifest.runtime});assert.deepEqual(finalPkg,pkgInit,'add and overwrite must not change package dependencies');
 assert.ok(!Object.keys({...finalPkg.dependencies,...finalPkg.devDependencies}).some(name=>/radix|recharts|react-is/.test(name)));
 for(const [name,record] of Object.entries(fonts))assert.equal(sha(fs.readFileSync(path.join(host,'dist/assets/type',name))),record.sha256,'production build copies real fonts/license/provenance');
 const lockPackages=Object.keys(finalLock.packages).filter(p=>/radix|recharts|react-is/.test(p));
 fs.writeFileSync(path.join(evidence,'installed-button-evidence.json'),JSON.stringify({host,physicalPackage:installed,bin,binResolved:fs.realpathSync(bin),tarball:artifact.tarball,sha256:artifact.sha256,version:artifact.version,integrity,coreLock:core,coreDevPin:finalPkg.devDependencies['@orderthan31/hangyeol-core'],pkgBefore,pkgInit,finalPkg,initPlan,addPlan,overwrite,commonRecords,commonBefore,sourceGraph:graph,fonts,fontURLs:urls.map(u=>u.href),localEditMarker:marker,localEditedButtonHash:sha(editedButton),backupHash:sha(fs.readFileSync(path.join(host,replacements[0].backup))),toolTransitiveMatchingPackages:lockPackages,license:'guarded UNLICENSED first-party candidate; copied Pretendard SIL OFL 1.1 license/provenance unchanged',cache:'prepared Mac offline cache; no empty-cache/VPS/live registry proof',browserFontLoad:'NOT RUN',http:'NOT RUN; no listener required for this Button contract'},null,2));
});

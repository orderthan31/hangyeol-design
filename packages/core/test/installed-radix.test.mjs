import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import test from 'node:test';

const evidence=process.env.CORE05_EVIDENCE_DIR;
assert.ok(evidence,'Require designated CORE05 scratch');
const repo=path.resolve(new URL('../../../',import.meta.url).pathname);
assert.ok(path.resolve(evidence)!==repo&&!path.resolve(evidence).startsWith(repo+path.sep),'Require outside-repository evidence before mutations');
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
 fs.writeFileSync(path.join(evidence,`installed-radix-command-${label}-${process.hrtime.bigint()}.json`),JSON.stringify(record,null,2));
 assert.equal(r.status,expected,`${label}: ${r.stdout}\n${r.stderr}`);return r;
}
function plan(r){return JSON.parse(r.stdout.slice(0,r.stdout.indexOf('\n}')+2));}
function readJSON(p){return JSON.parse(fs.readFileSync(p));}

const manifest=readJSON(path.join(artifact.unpacked,'package/payload/manifest.json'));
const graphFor={select:['foundation/theme.css','lib/cn.ts','foundation/theme.tsx','primitives/portal.tsx','primitives/select.tsx'],tabs:['foundation/theme.css','lib/cn.ts','primitives/tabs.tsx'],dialog:['foundation/theme.css','lib/cn.ts','foundation/theme.tsx','primitives/portal.tsx','primitives/dialog.tsx'],button:['foundation/theme.css','lib/cn.ts','primitives/button.tsx']};
const settings={schemaVersion:1,sourceRoot:'ui/system',stylePath:'styles/theme.css',publicRoot:'static',fontPath:'assets/type',basePath:'/design/',alias:'@hangyeol',ownerSetting:'preserved'};
function prepare(label){
 const host=fs.mkdtempSync(path.join(evidence,`radix-${label}-`));fs.writeFileSync(path.join(host,'package.json'),JSON.stringify({name:'core05-'+label,private:true,type:'module',description:'owner metadata',dependencies:{react:'19.2.0','react-dom':'19.2.0',postcss:'8.5.28',...manifest.runtime},devDependencies:{vite:'7.3.6',typescript:'5.9.3',...manifest.build,...manifest.types}},null,2)+'\n');
 run(label+'-install','npm',['install','--offline','--save-dev','--save-exact',artifact.tarball],host);const installed=path.join(host,'node_modules/@orderthan31/hangyeol-core'),bin=path.join(host,'node_modules/.bin/hangyeol');assert.equal(fs.lstatSync(installed).isSymbolicLink(),false);assert.equal(fs.realpathSync(bin),path.join(installed,'bin/hangyeol.mjs'));assert.ok(!fs.existsSync(path.join(host,'ui'))&&!fs.existsSync(path.join(host,'hangyeol.json')));assert.equal(run(label+'-version',bin,['--version'],host).stdout.trim(),artifact.version);
 fs.mkdirSync(path.join(host,'styles'));fs.writeFileSync(path.join(host,'styles/theme.css'),'body { margin: 17px; }\n');fs.writeFileSync(path.join(host,'sentinel.txt'),'owner sentinel\n');fs.writeFileSync(path.join(host,'hangyeol.json'),JSON.stringify(settings,null,2)+'\n');fs.writeFileSync(path.join(host,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'ES2022',lib:['ES2022','DOM'],module:'ESNext',moduleResolution:'Bundler',jsx:'react-jsx',strict:true,skipLibCheck:true,noEmit:true},include:['src','ui']},null,2)+'\n');
 function checked(step,args,{expected=0,unchanged=false,guard=true}={}){
  const before=snapshot(host),g=fs.mkdtempSync(path.join(evidence,'radix-npm-guard-')),trace=path.join(g,'trace');fs.writeFileSync(trace,'');fs.writeFileSync(path.join(g,'npm'),'#!/bin/sh\nprintf "npm invoked\\n" >> "$CORE05_NPM_TRACE"\nexit 93\n');fs.chmodSync(path.join(g,'npm'),0o755);const env=guard?{...process.env,PATH:g+path.delimiter+process.env.PATH,CORE05_NPM_TRACE:trace}:process.env;
  let r,after;try{r=run(label+'-'+step,bin,args,host,expected,env);}finally{after=snapshot(host);fs.writeFileSync(path.join(evidence,`installed-radix-snapshot-${label}-${step}-${process.hrtime.bigint()}.json`),JSON.stringify({host,args,before,after,npmTrace:trace,npmCalls:fs.readFileSync(trace,'utf8'),guarded:guard},null,2));}
  if(guard)assert.equal(fs.readFileSync(trace,'utf8'),'');if(unchanged)assert.deepEqual(after,before);return r;
 }
 checked('init',['init']);const config=readJSON(path.join(host,'hangyeol.json')),pkgInit=readJSON(path.join(host,'package.json')),lockInit=readJSON(path.join(host,'package-lock.json'));checked('init-repeat',['init'],{unchanged:true});
 const css=fs.readFileSync(path.join(host,'styles/theme.css'),'utf8');assert.match(css,/@source "\.\.\/ui\/system"/);assert.ok(!css.includes('preflight'));assert.ok(css.endsWith('body { margin: 17px; }\n'));
 const common={};for(const name of manifest.common){const file=path.join(host,'ui/system',name);fs.appendFileSync(file,'\n/* CORE05 owner common edit */\n');common[name]={hash:sha(fs.readFileSync(file)),mtime:String(fs.statSync(file,{bigint:true}).mtimeNs),record:config.installed['ui/system/'+name]};}
 function finish(items){
  const pkg=readJSON(path.join(host,'package.json')),lock=readJSON(path.join(host,'package-lock.json')),core=lock.packages['node_modules/@orderthan31/hangyeol-core'],integrity='sha512-'+crypto.createHash('sha512').update(fs.readFileSync(artifact.tarball)).digest('base64');assert.equal(core.version,artifact.version);assert.equal(core.integrity,integrity);assert.equal(core.resolved,lockInit.packages['node_modules/@orderthan31/hangyeol-core'].resolved);assert.equal(core.dev,true);assert.notEqual(core.link,true);assert.equal(pkg.devDependencies['@orderthan31/hangyeol-core'],lock.packages[''].devDependencies['@orderthan31/hangyeol-core']);assert.deepEqual(pkg.devDependencies,pkgInit.devDependencies);assert.deepEqual(pkg.dependencies,{...pkgInit.dependencies,...Object.assign({},...items.map(item=>manifest.items[item].runtime))});assert.equal(pkg.description,pkgInit.description);
  const current=readJSON(path.join(host,'hangyeol.json'));for(const [name,state] of Object.entries(common)){const file=path.join(host,'ui/system',name);assert.equal(sha(fs.readFileSync(file)),state.hash);assert.equal(String(fs.statSync(file,{bigint:true}).mtimeNs),state.mtime);assert.deepEqual(current.installed['ui/system/'+name],state.record);}assert.deepEqual(current.integration,config.integration);assert.equal(current.ownerSetting,settings.ownerSetting);assert.equal(fs.readFileSync(path.join(host,'sentinel.txt'),'utf8'),'owner sentinel\n');assert.equal(fs.readFileSync(path.join(host,'styles/theme.css'),'utf8'),css);
  return {host,installed,bin,binResolved:fs.realpathSync(bin),physicalLink:false,version:artifact.version,tarball:artifact.tarball,sha256:artifact.sha256,coreDevPin:pkg.devDependencies['@orderthan31/hangyeol-core'],integrity,coreLock:core,package:pkg,common,sourceGraph:snapshot(path.join(host,'ui/system')),fonts:Object.fromEntries(Object.keys(manifest.assets).map(name=>[name,sha(fs.readFileSync(path.join(host,'static/assets/type',name)))]))};
 }
 return {host,bin,checked,finish};
}
function files(host){return Object.keys(snapshot(path.join(host,'ui/system'))).filter(f=>/\.(?:css|tsx|ts)$/.test(f)).sort();}
function entry(host,item,marker=false){
 fs.mkdirSync(path.join(host,'src'),{recursive:true});fs.writeFileSync(path.join(host,'index.html'),'<div id="root"></div><script type="module" src="/src/main.tsx"></script>\n');
 const imports=item==='select'?"import {Select} from '@hangyeol/primitives/select';import {Theme} from '@hangyeol/foundation/theme';":item==='dialog'?"import {Dialog,DialogTrigger,DialogContent,DialogTitle,DialogDescription} from '@hangyeol/primitives/dialog';import {Theme} from '@hangyeol/foundation/theme';":"import {Tabs,TabsList,TabsTrigger,TabsContent} from '@hangyeol/primitives/tabs';";
 const jsx=item==='select'?'<Theme mode="dark"><Select label="Standalone Select" options={[{value:"a",label:"Alpha"},{value:"b",label:"Beta"}]} /></Theme>':item==='dialog'?'<Theme mode="dark"><Dialog><DialogTrigger>Open Dialog</DialogTrigger><DialogContent><DialogTitle>Title</DialogTitle><DialogDescription>Description</DialogDescription><input aria-label="Inside" /></DialogContent></Dialog></Theme>':'<main data-hangyeol><Tabs defaultValue="a"><TabsList><TabsTrigger value="a">Alpha</TabsTrigger><TabsTrigger value="b">Beta</TabsTrigger></TabsList><TabsContent value="a">Panel A</TabsContent><TabsContent value="b">Panel B</TabsContent></Tabs></main>';
 fs.writeFileSync(path.join(host,'src/main.tsx'),`import {createRoot} from 'react-dom/client';${imports}${marker?`import {core05LocalMarker} from '@hangyeol/primitives/${item}';`:''}import '../styles/theme.css';createRoot(document.getElementById('root')!).render(<>${jsx}${marker?'<p>{core05LocalMarker}</p>':''}</>);\n`);
}
const outcomes={};
for(const item of ['select','tabs','dialog'])test(`physical ${item} exact graph, npm dependency closure, local build/edit and conflict backup`,()=>{
 const h=prepare(item);h.checked('dry',['add',item,'--dry-run'],{unchanged:true});const addPlan=plan(h.checked('add',['add',item],{guard:false}));assert.deepEqual(addPlan.dependencies.runtime,Object.entries(manifest.items[item].runtime).map(([k,v])=>k+'@'+v));assert.deepEqual(files(h.host),[...graphFor[item],'foundation/fonts.css'].sort());
 for(const file of graphFor[item].filter(f=>!manifest.common.includes(f)))assert.equal(sha(fs.readFileSync(path.join(h.host,'ui/system',file))),manifest.files[file].hash);h.checked('repeat',['add',item],{unchanged:true});
 entry(h.host,item);run(item+'-types',path.join(h.host,'node_modules/.bin/tsc'),['--pretty','false'],h.host);run(item+'-build',path.join(h.host,'node_modules/.bin/vite'),['build'],h.host);
 const target=path.join(h.host,'ui/system/primitives',item+'.tsx'),marker='CORE05_LOCAL_'+item.toUpperCase();fs.appendFileSync(target,`\nexport const core05LocalMarker = '${marker}';\n`);const edited=fs.readFileSync(target);entry(h.host,item,true);run(item+'-edited-types',path.join(h.host,'node_modules/.bin/tsc'),['--pretty','false'],h.host);run(item+'-edited-build',path.join(h.host,'node_modules/.bin/vite'),['build'],h.host);assert.ok(fs.readdirSync(path.join(h.host,'dist/assets')).filter(f=>f.endsWith('.js')).some(f=>fs.readFileSync(path.join(h.host,'dist/assets',f),'utf8').includes(marker)));
 const rejected=h.checked('conflict',['add',item],{expected:1,unchanged:true});assert.match(rejected.stderr,/conflict.*edited/);const overwrite=plan(h.checked('overwrite',['add',item,'--overwrite']));const replacement=overwrite.files.filter(f=>f.action!=='noop');assert.deepEqual(replacement.map(f=>f.path),['ui/system/primitives/'+item+'.tsx']);assert.deepEqual(fs.readFileSync(path.join(h.host,replacement[0].backup)),edited);h.checked('overwrite-repeat',['add',item,'--overwrite'],{unchanged:true});
 entry(h.host,item);for(const targetName of item==='tabs'?[]:['primitives/portal.tsx','foundation/theme.tsx']){const file=path.join(h.host,'ui/system',targetName);fs.appendFileSync(file,'\n// owner closure edit\n');const previous=fs.readFileSync(file);h.checked('closure-conflict-'+path.basename(file),['add',item],{expected:1,unchanged:true});const overwrite=plan(h.checked('closure-overwrite-'+path.basename(file),['add',item,'--overwrite']));const backup=overwrite.files.find(f=>f.path==='ui/system/'+targetName).backup;assert.deepEqual(fs.readFileSync(path.join(h.host,backup)),previous);}
 outcomes[item]={...h.finish([item]),addPlan,overwrite,localMarker:marker,editedHash:sha(edited),backupHash:sha(fs.readFileSync(path.join(h.host,replacement[0].backup)))};fs.writeFileSync(path.join(evidence,'installed-radix-'+item+'-evidence.json'),JSON.stringify(outcomes[item],null,2));
});
test('physical Button-only has no new direct Radix dependencies or portal/theme component sources',()=>{
 const h=prepare('button');h.checked('add',['add','button']);assert.deepEqual(files(h.host),[...graphFor.button,'foundation/fonts.css'].sort());h.checked('repeat',['add','button'],{unchanged:true});const result=h.finish(['button']);assert.ok(!Object.keys(result.package.dependencies).some(name=>name.startsWith('@radix-ui/')));fs.writeFileSync(path.join(evidence,'installed-radix-button-evidence.json'),JSON.stringify(result,null,2));
});
test('physical Select/Dialog overlap dedupes shared targets and prepares actual installed browser host',()=>{
 const h=prepare('overlap');const addPlan=plan(h.checked('add',['add','select','dialog'],{guard:false}));const expected=[...new Set([...graphFor.select,...graphFor.dialog])];assert.equal(addPlan.files.length,expected.length);assert.equal(new Set(addPlan.files.map(f=>f.path)).size,expected.length);assert.deepEqual(files(h.host),[...expected,'foundation/fonts.css'].sort());h.checked('repeat',['add','select','dialog'],{unchanged:true});const overlap=h.finish(['select','dialog']);fs.writeFileSync(path.join(evidence,'installed-radix-overlap-evidence.json'),JSON.stringify({...overlap,addPlan},null,2));
 h.checked('browser-tabs',['add','tabs'],{guard:false});const browser=h.finish(['select','dialog','tabs']);fs.writeFileSync(path.join(evidence,'browser-host.json'),JSON.stringify(browser,null,2));
});

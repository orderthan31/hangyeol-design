import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';

const evidence=process.env.CORE06_EVIDENCE_DIR,repo=path.resolve(fileURLToPath(new URL('../../../',import.meta.url)));
assert.ok(evidence&&path.resolve(evidence)!==repo&&!path.resolve(evidence).startsWith(repo+path.sep),'external scratch required before fixture mutations');
const artifact=JSON.parse(fs.readFileSync(path.join(evidence,'artifact.json'))),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const json=p=>JSON.parse(fs.readFileSync(p));
function snapshot(dir,base=dir){
 const st=fs.lstatSync(dir,{bigint:true}),out=dir===base?{'.':{ino:String(st.ino),mtimeNs:String(st.mtimeNs),mode:String(st.mode)}}:{};
 for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
  const full=path.join(dir,ent.name),s=fs.lstatSync(full,{bigint:true});out[path.relative(base,full)]={ino:String(s.ino),mtimeNs:String(s.mtimeNs),mode:String(s.mode),...(ent.isFile()?{hash:sha(fs.readFileSync(full))}:{}),...(ent.isSymbolicLink()?{link:fs.readlinkSync(full)}:{})};
  if(ent.isDirectory())Object.assign(out,snapshot(full,base));
 }return out;
}
function command(label,bin,args,cwd,env=process.env){
 const before=snapshot(cwd),start=performance.now(),started=new Date().toISOString(),r=spawnSync(bin,args,{cwd,env,encoding:'utf8',maxBuffer:16e6}),after=snapshot(cwd);
 const row={label,command:[bin,...args],cwd,runtime:process.version,started,durationMs:performance.now()-start,exit:r.status,error:r.error?.message,stdout:r.stdout,stderr:r.stderr,before,after};
 fs.writeFileSync(path.join(evidence,`physical-transaction-${label}-${process.hrtime.bigint()}.json`),JSON.stringify(row,null,2));return {...r,before,after};
}
function guard(code='process.exit(93);'){
 const dir=fs.mkdtempSync(path.join(evidence,'transaction-npm-')),trace=path.join(dir,'trace');fs.writeFileSync(trace,'');
 fs.writeFileSync(path.join(dir,'npm'),`#!${process.execPath}\nconst fs=require('node:fs');fs.appendFileSync(${JSON.stringify(trace)},JSON.stringify(process.argv.slice(2))+'\\n');${code}\n`);fs.chmodSync(path.join(dir,'npm'),0o755);
 return {trace,env:{...process.env,PATH:dir+path.delimiter+process.env.PATH}};
}
function recovery(r){const line=r.stderr.split('\n').find(l=>l.startsWith('{"transactionRecovery"'));assert.ok(line,r.stderr);return JSON.parse(line);}
function preload(code){const p=path.join(evidence,`transaction-preload-${process.hrtime.bigint()}.mjs`);fs.writeFileSync(p,code);return `--import=${p}`;}
function backups(dir,target){const root=path.join(dir,'.hangyeol-backups');return fs.existsSync(root)?fs.readdirSync(root).map(s=>path.join(root,s,target)).filter(p=>fs.existsSync(p)):[];}

test('physical installed local bin preflights, noops, recovers writes/npm/metadata and reports concurrent recovery refusal',()=>{
 const host=fs.mkdtempSync(path.join(evidence,'transaction-installed-')),manifest=json(path.join(artifact.unpacked,'package/payload/manifest.json'));
 fs.writeFileSync(path.join(host,'package.json'),JSON.stringify({name:'core06-transaction-host',private:true,type:'module',description:'owner settings retained',dependencies:{react:'19.2.0','react-dom':'19.2.0',...manifest.runtime},devDependencies:{vite:'7.3.6',...manifest.build,...manifest.types}},null,2)+'\n');
 fs.writeFileSync(path.join(host,'sentinel'),'owner sentinel');
 const prep=command('offline-preparation','npm',['install','--offline','--ignore-scripts','--save-dev','--save-exact',artifact.tarball],host);assert.equal(prep.status,0,prep.stderr);
 const installed=path.join(host,'node_modules/@orderthan31/hangyeol-core'),bin=path.join(host,'node_modules/.bin/hangyeol');assert.equal(fs.lstatSync(installed).isSymbolicLink(),false);assert.equal(fs.realpathSync(bin),path.join(installed,'bin/hangyeol.mjs'));
 assert.equal(sha(fs.readFileSync(artifact.tarball)),artifact.sha256);for(const name of ['safety.mjs','installer.mjs'])assert.equal(sha(fs.readFileSync(path.join(installed,'dist/tools',name))),sha(fs.readFileSync(path.join(repo,'packages/core/src/tools',name))));
 assert.equal(command('version',bin,['--version'],host).stdout.trim(),artifact.version);assert.ok(!fs.existsSync(path.join(host,'hangyeol.json')),'no postinstall generation');
 const coreInitial=json(path.join(host,'package-lock.json')).packages['node_modules/@orderthan31/hangyeol-core'],pin=json(path.join(host,'package.json')).devDependencies['@orderthan31/hangyeol-core'];
 const npmGuard=guard();
 function checked(label,args,{exit=0,unchanged=false,diagnostic,env=npmGuard.env,npm0=true}={}){
  const traceBefore=fs.readFileSync(npmGuard.trace),r=command(label,bin,args,host,env);assert.equal(r.status,exit,r.stdout+'\n'+r.stderr);if(diagnostic)assert.match(r.stderr,diagnostic);if(unchanged)assert.deepEqual(r.after,r.before,label+' full snapshot');if(npm0)assert.deepEqual(fs.readFileSync(npmGuard.trace),traceBefore);return r;
 }
 const unsafe=['../escape','/absolute/escape','ui\\escape','.','','ui//escape'];
 for(const [i,value] of unsafe.entries())checked('unsafe-'+i,['init','--source-root',value],{exit:1,unchanged:true,diagnostic:/unsafe|missing value/i});
 checked('overlap',['init','--source-root','public/nested'],{exit:1,unchanged:true,diagnostic:/overlap/i});
 fs.symlinkSync(path.join(host,'missing'),path.join(host,'dangling'));
 checked('dangling',['init','--source-root','dangling/ui'],{exit:1,unchanged:true,diagnostic:/symlink/i});fs.unlinkSync(path.join(host,'dangling'));
 fs.symlinkSync(host,path.join(host,'linked'));checked('symlink',['init','--public-root','linked/assets'],{exit:1,unchanged:true,diagnostic:/symlink/i});fs.unlinkSync(path.join(host,'linked'));
 const payloadTheme=path.join(installed,'payload/source/foundation/theme.css'),originalPayload=fs.readFileSync(payloadTheme);fs.appendFileSync(payloadTheme,'\n/* injected payload corruption */\n');
 checked('payload-hash',['init'],{exit:1,unchanged:true,diagnostic:/Core packed integrity mismatch: payload\/source\/foundation\/theme.css/});fs.writeFileSync(payloadTheme,originalPayload);
 const settings=['--source-root','ui/system','--style-path','styles/theme.css','--public-root','static','--font-path','assets/type','--base-path','/design/','--alias','@hangyeol'];
 fs.mkdirSync(path.join(host,'styles'));fs.writeFileSync(path.join(host,'styles/theme.css'),'body { color: chocolate; }\n');
 checked('dry-init',['init',...settings,'--dry-run'],{unchanged:true});checked('init',['init',...settings]);checked('repeat-init',['init'],{unchanged:true});checked('button',['add','button']);checked('repeat-button',['add','button'],{unchanged:true});
 const button='ui/system/primitives/button.tsx',input='ui/system/primitives/input.tsx',textfield='ui/system/components/text-field.tsx',theme='ui/system/foundation/theme.css',helper='ui/system/lib/cn.ts';
 fs.appendFileSync(path.join(host,button),'\n// owner Button edit\n');fs.appendFileSync(path.join(host,theme),'\n/* owner theme */\n');fs.appendFileSync(path.join(host,helper),'\n// owner helper\n');
 const edited=fs.readFileSync(path.join(host,button)),commons=[theme,helper].map(p=>fs.readFileSync(path.join(host,p)));
 checked('edited-conflict',['add','text-field'],{exit:1,unchanged:true,diagnostic:/conflict.*button/});
 const editedPkg=json(path.join(host,'package.json'));delete editedPkg.dependencies.clsx;fs.writeFileSync(path.join(host,'package.json'),JSON.stringify(editedPkg,null,2)+'\n');
 const pkgBefore=fs.readFileSync(path.join(host,'package.json')),lockBefore=fs.readFileSync(path.join(host,'package-lock.json')),configBefore=fs.readFileSync(path.join(host,'hangyeol.json'));
 const failure=guard("fs.writeFileSync('package.json','{\"injected\":true}');fs.writeFileSync('package-lock.json','{\"injected\":true}');fs.writeFileSync('node_modules/transaction-residue','external npm effect');process.exit(42);");
 const npmFailure=checked('injected-npm-failure',['add','text-field','--overwrite'],{exit:1,diagnostic:/Dependency install failed \(42\)/,env:failure.env}),npmRecovery=recovery(npmFailure);
 assert.equal(npmRecovery.transactionRecovery.status,'recovered');assert.equal(npmRecovery.dependencyAttempted,true);assert.match(npmRecovery.nodeModules,/not rolled back/);assert.ok(fs.readFileSync(failure.trace,'utf8').includes('clsx@2.1.1'));
 for(const [name,bytes] of [['package.json',pkgBefore],['package-lock.json',lockBefore],['hangyeol.json',configBefore],[button,edited]])assert.deepEqual(fs.readFileSync(path.join(host,name)),bytes);
 assert.deepEqual(npmFailure.after[button],npmFailure.before[button],'managed hardlink recovery restores original inode/mtime/mode/hash');assert.ok(!fs.existsSync(path.join(host,input))&&!fs.existsSync(path.join(host,'ui/system/components')));assert.equal(fs.readFileSync(path.join(host,'node_modules/transaction-residue'),'utf8'),'external npm effect');assert.ok(backups(host,button).some(p=>fs.readFileSync(p).equals(edited)));assert.ok(!fs.existsSync(path.join(host,'.hangyeol-transactions')));
 // Fixture-owned preparation restores the declared dependency, not installer rollback.
 editedPkg.dependencies.clsx=manifest.runtime.clsx;fs.writeFileSync(path.join(host,'package.json'),JSON.stringify(editedPkg,null,2)+'\n');
 const metadataFault=preload(`import fs from 'node:fs';const rename=fs.renameSync;fs.renameSync=function(a,b){if(b===${JSON.stringify(path.join(host,'hangyeol.json'))})throw Error('injected metadata rename');return rename.call(this,a,b);};`);
 const meta=checked('injected-metadata-failure',['add','input'],{exit:1,diagnostic:/injected metadata rename/,env:{...npmGuard.env,NODE_OPTIONS:metadataFault}});assert.equal(recovery(meta).transactionRecovery.status,'recovered');assert.ok(!fs.existsSync(path.join(host,input)));assert.deepEqual(fs.readFileSync(path.join(host,'hangyeol.json')),configBefore);assert.ok(backups(host,'hangyeol.json').some(p=>fs.readFileSync(p).equals(configBefore)));assert.deepEqual(meta.after[button],meta.before[button]);
 const writeFault=preload(`import fs from 'node:fs';const rename=fs.renameSync;fs.renameSync=function(a,b){if(b===${JSON.stringify(path.join(host,textfield))})throw Error('injected later source rename');return rename.call(this,a,b);};`);
 const partial=checked('injected-source-failure',['add','text-field','--overwrite'],{exit:1,diagnostic:/injected later source rename/,env:{...npmGuard.env,NODE_OPTIONS:writeFault}});assert.equal(recovery(partial).transactionRecovery.status,'recovered');assert.deepEqual(partial.after[button],partial.before[button]);assert.ok(!fs.existsSync(path.join(host,input))&&!fs.existsSync(path.join(host,'ui/system/components')));
 const restoreFault=preload(`import fs from 'node:fs';const rename=fs.renameSync;let count=0;fs.renameSync=function(a,b){if(b===${JSON.stringify(path.join(host,button))}&&++count===2)throw Error('injected restore denied');if(b===${JSON.stringify(path.join(host,textfield))})throw Error('injected later source rename');return rename.call(this,a,b);};`);
 const denied=checked('injected-restore-denied',['add','text-field','--overwrite'],{exit:1,diagnostic:/injected restore denied/,env:{...npmGuard.env,NODE_OPTIONS:restoreFault}}),deniedRecovery=recovery(denied);assert.equal(deniedRecovery.transactionRecovery.status,'incomplete');assert.ok(fs.existsSync(path.join(host,deniedRecovery.transactionRecovery.journal)));assert.equal(sha(fs.readFileSync(path.join(host,button))),manifest.files['primitives/button.tsx'].hash);assert.ok(backups(host,button).some(p=>fs.readFileSync(p).equals(edited)));
 // Explicit fixture preparation after an intentionally incomplete recovery.
 fs.writeFileSync(path.join(host,button),edited);
 const raceFault=preload(`import fs from 'node:fs';const rename=fs.renameSync;fs.renameSync=function(a,b){if(b===${JSON.stringify(path.join(host,textfield))}){fs.writeFileSync(${JSON.stringify(path.join(host,button))},'concurrent owner edit');throw Error('injected concurrent write');}return rename.call(this,a,b);};`);
 const race=checked('injected-recovery-race',['add','text-field','--overwrite'],{exit:1,diagnostic:/injected concurrent write/,env:{...npmGuard.env,NODE_OPTIONS:raceFault}}),raceRecovery=recovery(race);assert.equal(raceRecovery.transactionRecovery.status,'incomplete');assert.equal(fs.readFileSync(path.join(host,button),'utf8'),'concurrent owner edit');assert.ok(fs.existsSync(path.join(host,raceRecovery.transactionRecovery.journal)));assert.ok(backups(host,button).some(p=>fs.readFileSync(p).equals(edited)));assert.ok(!fs.existsSync(path.join(host,input)));
 for(const [i,p] of [theme,helper].entries())assert.deepEqual(fs.readFileSync(path.join(host,p)),commons[i]);assert.equal(fs.readFileSync(path.join(host,'sentinel'),'utf8'),'owner sentinel');
 const pkg=json(path.join(host,'package.json')),lock=json(path.join(host,'package-lock.json')),core=lock.packages['node_modules/@orderthan31/hangyeol-core'],integrity='sha512-'+crypto.createHash('sha512').update(fs.readFileSync(artifact.tarball)).digest('base64');
 assert.equal(core.version,artifact.version);assert.equal(core.integrity,integrity);assert.equal(core.resolved,coreInitial.resolved);assert.equal(core.dev,true);assert.notEqual(core.link,true);assert.equal(pkg.devDependencies['@orderthan31/hangyeol-core'],pin);assert.equal(lock.packages[''].devDependencies['@orderthan31/hangyeol-core'],pin);
 fs.writeFileSync(path.join(evidence,'installed-transaction-evidence.json'),JSON.stringify({host,physicalPackage:installed,bin,binResolved:fs.realpathSync(bin),tarball:artifact.tarball,sha256:artifact.sha256,version:artifact.version,integrity,coreLock:core,coreDevPin:pin,guardTrace:npmGuard.trace,npmGuardCalls:fs.readFileSync(npmGuard.trace,'utf8'),injectedNpmTrace:failure.trace,injectedNpmCalls:fs.readFileSync(failure.trace,'utf8'),npmRecovery,metadataRecovery:recovery(meta),partialRecovery:recovery(partial),deniedRecovery,raceRecovery,backups:backups(host,button).map(p=>({path:p,hash:sha(fs.readFileSync(p))})),finalSnapshot:snapshot(host),license:'guarded UNLICENSED candidate unchanged; asset licenses unchanged',limitations:'prepared offline cache; injected npm failure is not registry installation proof. node_modules intentionally not rolled back; incomplete recovery journals retained.'},null,2));
});

test('physical installed safety API rejects batch collisions/overlap/root symlinks and changed-since-plan without mutation',async()=>{
 const previous=json(path.join(evidence,'installed-transaction-evidence.json')),safety=await import(pathToFileURL(path.join(previous.physicalPackage,'dist/tools/safety.mjs')));
 const host=fs.mkdtempSync(path.join(evidence,'installed-safety-api-'));fs.writeFileSync(path.join(host,'sentinel'),'owner');const before=snapshot(host),negativeInputs=[],guardSnapshots=[];
 for(const files of [[{path:'A',bytes:Buffer.from('x')},{path:'a',bytes:Buffer.from('x')}],[{path:'A',bytes:Buffer.from('x')},{path:'a/child',bytes:Buffer.from('x')}],[{path:'valid',bytes:Buffer.from('x')},{path:'file',bytes:Buffer.from('x'),hash:'bad'}]]){
  assert.throws(()=>safety.planFiles(host,files),/duplicate|overlap|hash/);negativeInputs.push(files.map(f=>({...f,bytes:f.bytes.toString()})));const after=snapshot(host);guardSnapshots.push(after);assert.deepEqual(after,before);
 }
 const parent=fs.mkdtempSync(path.join(evidence,'installed-root-link-')),link=path.join(parent,'project');fs.symlinkSync(host,link);assert.throws(()=>safety.planFiles(link,[{path:'file',bytes:Buffer.from('x')}]),/symlink project root/);const afterGuards=snapshot(host);assert.deepEqual(afterGuards,before);
 const planned=safety.planFiles(host,[{path:'sentinel',bytes:Buffer.from('tool')}],{overwrite:true});fs.writeFileSync(path.join(host,'replacement'),'owner');fs.renameSync(path.join(host,'replacement'),path.join(host,'sentinel'));const drift=snapshot(host);assert.throws(()=>safety.applyPlan(host,planned),/changed since planning/);assert.deepEqual(snapshot(host),drift);
 const driftCases=[];
 for(const drift of ['bytes','inode','deleted','noop']){
  const dir=fs.mkdtempSync(path.join(evidence,'installed-later-drift-'));for(const name of ['a','b'])fs.writeFileSync(path.join(dir,name),'owner');
  const plan=safety.planFiles(dir,[{path:'a',bytes:Buffer.from('tool')},{path:'b',bytes:Buffer.from(drift==='noop'?'owner':'tool')}],{overwrite:true}),before=snapshot(dir),rename=fs.renameSync;let error,changed=false;
  fs.renameSync=function(from,to){const result=rename.call(this,from,to);if(!changed&&to===path.join(dir,'a')){changed=true;if(drift==='deleted')fs.unlinkSync(path.join(dir,'b'));else if(drift==='inode'){fs.writeFileSync(path.join(dir,'replacement'),'owner');rename.call(this,path.join(dir,'replacement'),path.join(dir,'b'));}else fs.writeFileSync(path.join(dir,'b'),'concurrent owner edit');}return result;};
  try{safety.applyPlan(dir,plan);}catch(e){error=e;}finally{fs.renameSync=rename;}
  assert.match(error?.message??'',/changed since planning b/);assert.equal(error.recovery.status,'recovered');assert.equal(fs.readFileSync(path.join(dir,'a'),'utf8'),'owner');
  if(drift==='deleted')assert.ok(!fs.existsSync(path.join(dir,'b')));else assert.equal(fs.readFileSync(path.join(dir,'b'),'utf8'),drift==='inode'?'owner':'concurrent owner edit');
  driftCases.push({drift,host:dir,before,after:snapshot(dir),error:error.message,recovery:error.recovery});
 }
 const modeCases=[];
 for(const operation of ['managed replacement','external recovery']){
  const dir=fs.mkdtempSync(path.join(evidence,'installed-mode-')),file=path.join(dir,'existing');fs.writeFileSync(file,'owner');fs.chmodSync(file,0o666);const before=snapshot(dir),oldMask=process.umask(0o022);let recovery;
  try{if(operation==='managed replacement')safety.applyPlan(dir,safety.planFiles(dir,[{path:'existing',bytes:Buffer.from('tool')}],{overwrite:true}));else{const tx=safety.createTransaction(dir);tx.watch('existing');fs.writeFileSync(file,'npm effect');tx.observeExternal();recovery=tx.rollback();assert.equal(recovery.status,'recovered');assert.equal(fs.readFileSync(file,'utf8'),'owner');}assert.equal(fs.statSync(file).mode&0o7777,0o666);}finally{process.umask(oldMask);}
  modeCases.push({operation,host:dir,before,after:snapshot(dir),recovery});
 }
 const faultCases=[];
 for(const fault of ['close','mode','mtime']){
  const dir=fs.mkdtempSync(path.join(evidence,'installed-journal-fault-'));fs.writeFileSync(path.join(dir,'a'),'owner');const before=snapshot(dir),fd=fault==='close'?undefined:fs.openSync(path.join(dir,'a'),'r'),plan=safety.planFiles(dir,[{path:'a',bytes:Buffer.from('tool')},...(fault==='close'?[]:[{path:'b',bytes:Buffer.from('later')}])],{overwrite:true}),open=fs.openSync,close=fs.closeSync,rename=fs.renameSync;let staged,error;
  fs.openSync=function(file,...args){const descriptor=open.call(this,file,...args);if(String(file).includes('/.hangyeol-transactions/')&&args[0]==='wx')staged=descriptor;return descriptor;};
  fs.closeSync=function(descriptor){close.call(this,descriptor);if(fault==='close'&&descriptor===staged){staged=undefined;throw Error('injected physical stage close');}};
  fs.renameSync=function(from,to){if(fault!=='close'&&to===path.join(dir,'b')){if(fault==='mode')fs.fchmodSync(fd,0o600);else fs.futimesSync(fd,1,1);throw Error('injected physical original drift');}return rename.call(this,from,to);};
  try{safety.applyPlan(dir,plan);}catch(e){error=e;}finally{fs.openSync=open;fs.closeSync=close;fs.renameSync=rename;if(fd!==undefined)close.call(fs,fd);}
  assert.ok(error);if(fault==='close'){assert.equal(error.recovery.status,'recovered');assert.equal(error.recovery.journal,null);assert.ok(!fs.existsSync(path.join(dir,'.hangyeol-transactions')));assert.equal(fs.readFileSync(path.join(dir,'a'),'utf8'),'owner');}else{assert.equal(error.recovery.status,'incomplete');assert.ok(error.recovery.errors.some(e=>e.path==='a'&&/original recovery state changed/.test(e.error)));assert.ok(fs.existsSync(path.join(dir,error.recovery.journal)));assert.equal(fs.readFileSync(path.join(dir,'a'),'utf8'),'tool');assert.equal(fs.readFileSync(path.join(dir,plan[0].backup),'utf8'),'owner');}
  faultCases.push({fault,host:dir,before,after:snapshot(dir),error:error.message,recovery:error.recovery});
 }
 const reportCases=[];
 for(const flow of ['new-file drift','timestamp cleanup failure','journal check uncertain']){
  const dir=fs.mkdtempSync(path.join(evidence,'installed-material-report-')),rename=fs.renameSync,utimes=fs.utimesSync,lstat=fs.lstatSync;let result,phase=false;
  try{
   if(flow==='new-file drift'){
    const plan=safety.planFiles(dir,[{path:'a',bytes:Buffer.from('tool')},{path:'b',bytes:Buffer.from('later')}]);
    fs.renameSync=function(from,to){if(to===path.join(dir,'b')){fs.writeFileSync(path.join(dir,'a'),'concurrent owner edit');throw Error('injected physical b rename failure');}return rename.call(this,from,to);};
    try{safety.applyPlan(dir,plan);}catch(e){result=e.recovery;}
    assert.equal(fs.readFileSync(path.join(dir,'a'),'utf8'),'concurrent owner edit');assert.ok(!fs.existsSync(path.join(dir,'b')));assert.equal(result.status,'incomplete');
   }else{
    fs.writeFileSync(path.join(dir,'a'),'owner');const tx=safety.createTransaction(dir);tx.watch('a');
    fs.utimesSync=function(file,...args){if(file===dir){phase=true;throw Error('injected physical directory timestamp restore failure');}return utimes.call(this,file,...args);};
    if(flow==='journal check uncertain')fs.lstatSync=function(file,...args){if(phase&&String(file).includes('/.hangyeol-transactions/'))throw Object.assign(Error('injected physical journal inspection denied'),{code:'EACCES'});return lstat.call(this,file,...args);};
    result=tx.commit();assert.equal(result.status,'cleanup-incomplete');assert.equal(fs.readFileSync(path.join(dir,'a'),'utf8'),'owner');
   }
  }finally{fs.renameSync=rename;fs.utimesSync=utimes;fs.lstatSync=lstat;}
  assert.equal(result.journal,null);assert.equal(result.journalStatus,flow==='journal check uncertain'?'unknown':'absent');assert.ok(result.errors.length);assert.ok(!fs.existsSync(path.join(dir,'.hangyeol-transactions')));
  if(flow==='journal check uncertain'){assert.ok(result.journalCandidate.startsWith('.hangyeol-transactions/'));assert.ok(result.errors.some(e=>/journal inspection denied/.test(e.error)));}else assert.equal(result.journalCandidate,undefined);
  reportCases.push({flow,host:dir,after:snapshot(dir),recovery:result});
 }
 for(const row of faultCases.filter(row=>row.fault!=='close'))assert.equal(row.recovery.journalStatus,'present');
 fs.writeFileSync(path.join(evidence,'installed-safety-api-evidence.json'),JSON.stringify({reportCases,faultCases,driftCases,modeCases,physicalSafety:path.join(previous.physicalPackage,'dist/tools/safety.mjs'),host,negativeInputs,before,guardSnapshots,afterGuards,changedSincePlanBefore:drift,after:snapshot(host),boundary:'installed module API supplements actual local-bin fixtures for non-exposed custom batch and project-root ancestry inputs'},null,2));
});

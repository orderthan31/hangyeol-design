import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=fileURLToPath(new URL('../../',import.meta.url));
const scratch=path.resolve(process.env.HANGYEOL_TEST_EVIDENCE_DIR || fs.mkdtempSync(path.join(process.env.TMPDIR||os.tmpdir(),'hangyeol-core-tests-')));
fs.mkdirSync(scratch,{recursive:true});
if(fs.realpathSync(scratch).startsWith(fs.realpathSync(root)+path.sep)||fs.realpathSync(scratch)===fs.realpathSync(root))throw Error('Test evidence must be outside the repository');
const boundary=path.join(scratch,'boundary');fs.mkdirSync(boundary,{recursive:true});
const env={...process.env,npm_config_offline:'true',npm_config_ignore_scripts:'true',npm_config_audit:'false',npm_config_fund:'false',CORE01_EVIDENCE_DIR:boundary};
for(let n=2;n<=9;n++)env[`CORE${String(n).padStart(2,'0')}_EVIDENCE_DIR`]=scratch;
function run(label,command,args){const r=spawnSync(command,args,{cwd:root,env,encoding:'utf8',maxBuffer:32e6});fs.writeFileSync(path.join(scratch,label+'.log'),(r.stdout||'')+(r.stderr||''));process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');if(r.status!==0)process.exit(r.status||1);}
run('build',process.execPath,['packages/core/build.mjs']);
run('pack',process.execPath,['--test','packages/core/test/packed-artifact.test.mjs']);
const artifactFile=path.join(boundary,'artifact.json'),artifact=JSON.parse(fs.readFileSync(artifactFile));
artifact.integrity='sha512-'+crypto.createHash('sha512').update(fs.readFileSync(artifact.tarball)).digest('base64');
fs.writeFileSync(artifactFile,JSON.stringify(artifact,null,2)+'\n');
const integration=process.argv.includes('--integration');
if(integration){
 // Extended source fixtures require a prepared offline dependency cache.
 const host=path.join(scratch,'tool-host');fs.mkdirSync(host,{recursive:true});
 fs.writeFileSync(path.join(host,'package.json'),JSON.stringify({name:'hangyeol-source-test-tools',private:true,type:'module',devDependencies:{'@orderthan31/hangyeol-core':'file:'+artifact.tarball}}));
 run('install-tools','npm',['install','--prefix',host,'--offline','--ignore-scripts','--no-audit','--no-fund']);
 for(const n of ['08','09'])env[`CORE${n}_PACKAGE_ROOT`]=path.join(host,'node_modules/@orderthan31/hangyeol-core');
}
const externalFixtures=new Set(['doctor-source.test.mjs','tokens-source.test.mjs','lint-source.test.mjs']);
const tests=fs.readdirSync(path.join(root,'packages/core/test')).filter(n=>(n.endsWith('-source.test.mjs')||['package-boundary.test.mjs','init-contract.test.mjs','init-preflight.test.mjs','safety.test.mjs','safety-transaction.test.mjs','docs-consumer.test.mjs'].includes(n))&&(integration||!externalFixtures.has(n))).sort().map(n=>'packages/core/test/'+n);
tests.push(...fs.readdirSync(path.join(root,'packages/core/test/ui')).filter(n=>n.endsWith('.test.mjs')).map(n=>'packages/core/test/ui/'+n));
run('source',process.execPath,['--experimental-strip-types','--test','--test-concurrency=2',...tests]);
run('ui',path.join(root,'node_modules/.bin/vitest'),['run','--config','packages/core/vitest.config.ts']);
console.log(`Source/packed/UI evidence: ${scratch}`);

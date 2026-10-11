import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const yaml=createRequire(require.resolve('eslint/package.json'))('js-yaml');
import {validatePublishContext} from '../publish-guard.mjs';
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url)));
const repository='orderthan31/hangyeol-design',confirmation='@orderthan31/hangyeol-core@0.0.1';
const env={GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REPOSITORY:repository,GITHUB_REF:'refs/heads/main',GITHUB_WORKFLOW_REF:`${repository}/.github/workflows/publish-core.yml@refs/heads/main`,GITHUB_JOB:'publish',HANGYEOL_PUBLISH:'true',HANGYEOL_CONFIRM:confirmation,npm_config_registry:'https://npm.pkg.github.com',npm_config_ignore_scripts:'false'};
const event={inputs:{publish:'true',confirmation},repository:{full_name:repository},ref:'refs/heads/main'};
const reviewed={candidate:confirmation,uiAndCopyReviewComplete:true};
test('workflow YAML has manual-only triggers, least privilege and guarded publish conditions',()=>{
 const workflow=yaml.load(fs.readFileSync(new URL('../../../.github/workflows/publish-core.yml',import.meta.url),'utf8'));
 assert.deepEqual(Object.keys(workflow.on),['workflow_dispatch']);
 assert.deepEqual(workflow.permissions,{contents:'read'});
 assert.equal(workflow.on.workflow_dispatch.inputs.publish.type,'boolean');
 assert.equal(workflow.on.workflow_dispatch.inputs.publish.default,false);
 assert.equal(workflow.on.workflow_dispatch.inputs.confirmation.type,'string');
 const {validate,publish}=workflow.jobs;
 assert.deepEqual(validate.permissions,{contents:'read'});
 assert.deepEqual(publish.permissions,{contents:'read',packages:'write'});
 assert.equal(publish.needs,'validate');
 assert.deepEqual(publish.if.trim().split(/\s*&&\s*/),[
  "github.event_name == 'workflow_dispatch'", "github.repository == 'orderthan31/hangyeol-design'",
  "github.ref == 'refs/heads/main'", 'inputs.publish == true', "inputs.confirmation == '@orderthan31/hangyeol-core@0.0.1'",
 ]);
 const actions={checkout:'actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803',node:'actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1'};
 for(const job of [validate,publish]){
  assert.equal(job.steps[0].uses,actions.checkout);assert.equal(job.steps[0].with['persist-credentials'],false);
  assert.equal(job.steps[1].uses,actions.node);assert.equal(job.steps[1].with['node-version'],'22.22.2');
  for(const command of ['npm run build','npm test','npm run typecheck','npm run lint:slice'])assert.ok(job.steps.some(s=>s.run===command));
  assert.ok(!job['continue-on-error'] && !job.steps.some(s=>s['continue-on-error']));
 }
 assert.ok(validate.steps.some(s=>s.run?.startsWith('npm pack ')));
 assert.equal(validate.steps[1].with['registry-url'],undefined);
 assert.equal(publish.steps[1].with['registry-url'],'https://npm.pkg.github.com');
 assert.equal(publish.steps[1].with.scope,'@orderthan31');
 const step=publish.steps.at(-1);assert.equal(step['working-directory'],'packages/core');
 assert.equal(step.run,'npm publish --registry=https://npm.pkg.github.com --tag=latest --ignore-scripts=false');
 assert.deepEqual(step.env,{NODE_AUTH_TOKEN:'${{ secrets.GITHUB_TOKEN }}',HANGYEOL_PUBLISH:'${{ inputs.publish }}',HANGYEOL_CONFIRM:'${{ inputs.confirmation }}',npm_config_registry:'https://npm.pkg.github.com',npm_config_ignore_scripts:'false'});
 for(const job of [validate,publish])for(const s of job.steps)if(s!==step)assert.equal(s.env?.NODE_AUTH_TOKEN,undefined);
});

test('registry accepts only the exact configured URL and npm lifecycle trailing slash',()=>{
 for(const registry of ['https://npm.pkg.github.com','https://npm.pkg.github.com/'])assert.equal(validatePublishContext(pkg,{...env,npm_config_registry:registry},event,reviewed).registry,'https://npm.pkg.github.com');
 const rejected=[undefined,'','http://npm.pkg.github.com','https://registry.npmjs.org','https://npm.pkg.github.com.evil.test','https://NPM.PKG.GITHUB.COM','https://npm.pkg.github.com:443','https://npm.pkg.github.com:8443','https://npm.pkg.github.com/path','https://npm.pkg.github.com//','https://npm.pkg.github.com/%2f','https://npm.pkg.github.com/./','https://user@npm.pkg.github.com','https://user:pass@npm.pkg.github.com','https://npm.pkg.github.com?x=1','https://npm.pkg.github.com/?x=1','https://npm.pkg.github.com#fragment','https://npm.pkg.github.com/#fragment',' https://npm.pkg.github.com','https://npm.pkg.github.com/ '];
 for(const registry of rejected)assert.throws(()=>validatePublishContext(pkg,{...env,npm_config_registry:registry},event,reviewed),/blocked: registry/);
 // Package metadata is deliberately stricter than npm's runtime representation.
 for(const registry of [...rejected,'https://npm.pkg.github.com/'])assert.throws(()=>validatePublishContext({...pkg,publishConfig:{registry}},env,event,reviewed),/blocked: registry/);
 assert.throws(()=>validatePublishContext(pkg,{...env,npm_config_registry:undefined,NPM_CONFIG_REGISTRY:env.npm_config_registry},event,reviewed),/blocked: registry/);
});

test('real offline npm run lifecycle validates normalized registry but preserves token and lifecycle gates',t=>{
 const directory=fs.mkdtempSync(path.join(process.env.CORE01_EVIDENCE_DIR||process.env.TMPDIR||os.tmpdir(),'publish-npm-lifecycle-'));
 try {
  fs.copyFileSync(new URL('../publish-guard.mjs',import.meta.url),path.join(directory,'publish-guard.mjs'));
  fs.writeFileSync(path.join(directory,'package.json'),JSON.stringify({...pkg,scripts:{prepublishOnly:'node publish-guard.mjs',wrongLifecycle:'node publish-guard.mjs',probe:'node probe.mjs'}}));
  fs.writeFileSync(path.join(directory,'publication-readiness.json'),JSON.stringify(reviewed));
  fs.writeFileSync(path.join(directory,'event.json'),JSON.stringify(event));
  fs.writeFileSync(path.join(directory,'probe.mjs'),"console.log(JSON.stringify({node:process.version,npm_config_registry:process.env.npm_config_registry,NPM_CONFIG_REGISTRY:process.env.NPM_CONFIG_REGISTRY}));");
  for(const name of ['user-config','global-config'])fs.writeFileSync(path.join(directory,name),'');
  // Never inherit authentication or read the caller's npm config. These commands
  // run local scripts only; none invokes npm publish (including dry-run).
  const npmEnv={...env,PATH:`${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH}`,HOME:directory,GITHUB_EVENT_PATH:path.join(directory,'event.json'),npm_config_userconfig:path.join(directory,'user-config'),npm_config_globalconfig:path.join(directory,'global-config'),npm_config_cache:path.join(directory,'cache'),npm_config_offline:'true',npm_config_audit:'false',npm_config_fund:'false'};
  const run=(args,extra={})=>spawnSync('npm',args,{cwd:directory,env:{...npmEnv,...extra},encoding:'utf8',timeout:30000});
  const version=run(['--version']);assert.equal(version.status,0,version.stderr);
  t.diagnostic(`npm lifecycle runtime: ${process.version}, npm ${version.stdout.trim()}`);
  const probe=run(['run','--silent','probe','--registry=https://npm.pkg.github.com']);
  assert.equal(probe.status,0,probe.stderr);
  const runtime=JSON.parse(probe.stdout);
  assert.equal(runtime.node,process.version);
  assert.equal(runtime.npm_config_registry,'https://npm.pkg.github.com/');
  assert.equal(runtime.NPM_CONFIG_REGISTRY,undefined);
  const approved=run(['run','prepublishOnly','--registry=https://npm.pkg.github.com'],{NODE_AUTH_TOKEN:'synthetic-test-value'});
  assert.equal(approved.status,0,approved.stderr);
  assert.match(approved.stdout,/Manual publication intent validated/);
  for(const [script,extra] of [['prepublishOnly',{}],['wrongLifecycle',{NODE_AUTH_TOKEN:'synthetic-test-value'}]]){
   const blocked=run(['run',script,'--registry=https://npm.pkg.github.com'],extra);
   assert.equal(blocked.status,1,blocked.stdout);
   assert.match(blocked.stderr,/authenticated publish lifecycle required/);
  }
 } finally {fs.rmSync(directory,{recursive:true,force:true});}
});

test('approved intent can be validated in memory without authentication or network publication',()=>{
 assert.equal(validatePublishContext(pkg,env,event,reviewed).name,pkg.name);
});
test('actual approved source gate passes pure validation but local lifecycle stays blocked',()=>{
 const readiness=JSON.parse(fs.readFileSync(new URL('../publication-readiness.json',import.meta.url)));
 assert.equal(readiness.uiAndCopyReviewComplete,true);
 assert.equal(validatePublishContext(pkg,env,event,readiness).name,pkg.name);
 for(const bad of [undefined,{}, {...reviewed,uiAndCopyReviewComplete:false}, {...reviewed,uiAndCopyReviewComplete:"true"}, {...reviewed,candidate:"wrong"}])assert.throws(()=>validatePublishContext(pkg,env,event,bad),/pending/);
 const result=spawnSync(process.execPath,[new URL('../publish-guard.mjs',import.meta.url).pathname],{env:{PATH:process.env.PATH},encoding:'utf8'});
 assert.equal(result.status,1);assert.match(result.stderr,/blocked/);
});
for(const [key,value] of Object.entries({GITHUB_ACTIONS:'false',GITHUB_EVENT_NAME:'push',GITHUB_REPOSITORY:'other/repo',GITHUB_REF:'refs/heads/topic',GITHUB_WORKFLOW_REF:'other',GITHUB_JOB:'validate',HANGYEOL_PUBLISH:'false',HANGYEOL_CONFIRM:'hangyeol-core@0.0.1',npm_config_registry:'https://registry.npmjs.org',npm_config_ignore_scripts:'true'})){
 test(`rejects wrong ${key}`,()=>assert.throws(()=>validatePublishContext(pkg,{...env,[key]:value},event,reviewed),/blocked/));
}
for(const [key,value] of [['name','hangyeol-core'],['version','0.1.0'],['private',true],['license','MIT'],['publishConfig',{registry:'https://registry.npmjs.org'}],['repository',{url:'https://github.com/other/repo.git',directory:'packages/core'}],['scripts',{}]]){
 test(`rejects wrong package ${key}`,()=>assert.throws(()=>validatePublishContext({...pkg,[key]:value},env,event,reviewed),/blocked/));
}
test('approved Actions intent still rejects missing token or wrong npm lifecycle',()=>{
 const directory=fs.mkdtempSync(`${process.env.CORE01_EVIDENCE_DIR || process.env.TMPDIR}/publish-context-`);
 const eventPath=`${directory}/event.json`;fs.writeFileSync(eventPath,JSON.stringify(event));
 try {
  for(const extra of [{npm_lifecycle_event:'prepublishOnly'}, {npm_lifecycle_event:'pack',NODE_AUTH_TOKEN:'synthetic-test-value'}]) {
   const result=spawnSync(process.execPath,[new URL('../publish-guard.mjs',import.meta.url).pathname],{env:{PATH:process.env.PATH,...env,GITHUB_EVENT_PATH:eventPath,...extra},encoding:'utf8'});
   assert.equal(result.status,1);assert.match(result.stderr,/authenticated publish lifecycle required/);
  }
 } finally {fs.rmSync(directory,{recursive:true});}
});
test('missing local context, missing payload, boolean/string confusion and wrong dispatch payload fail closed',()=>{
 for(const value of [null,{}, {...event,inputs:{publish:true,confirmation}}, {...event,inputs:{publish:'false',confirmation}}, {...event,inputs:{publish:'true',confirmation:'wrong'}}, {...event,ref:'refs/heads/topic'},{...event,repository:{full_name:'other/repo'}}])assert.throws(()=>validatePublishContext(pkg,env,value,reviewed),/blocked/);
 assert.throws(()=>validatePublishContext(pkg,{},event,reviewed),/blocked/);
});

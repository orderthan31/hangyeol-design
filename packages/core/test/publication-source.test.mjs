import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
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
 assert.equal(step.run,'npm publish --registry=https://npm.pkg.github.com --ignore-scripts=false');
 assert.deepEqual(step.env,{NODE_AUTH_TOKEN:'${{ secrets.GITHUB_TOKEN }}',HANGYEOL_PUBLISH:'${{ inputs.publish }}',HANGYEOL_CONFIRM:'${{ inputs.confirmation }}',npm_config_registry:'https://npm.pkg.github.com',npm_config_ignore_scripts:'false'});
 for(const job of [validate,publish])for(const s of job.steps)if(s!==step)assert.equal(s.env?.NODE_AUTH_TOKEN,undefined);
});

test('approved intent can be validated in memory without authentication or network publication',()=>{
 assert.equal(validatePublishContext(pkg,env,event,reviewed).name,pkg.name);
});
test('actual candidate remains blocked pending later UI and copy review',()=>{
 const readiness=JSON.parse(fs.readFileSync(new URL('../publication-readiness.json',import.meta.url)));
 assert.equal(readiness.uiAndCopyReviewComplete,false);
 assert.throws(()=>validatePublishContext(pkg,env,event,readiness),/pending/);
 const result=spawnSync(process.execPath,[new URL('../publish-guard.mjs',import.meta.url).pathname],{env:{PATH:process.env.PATH},encoding:'utf8'});
 assert.equal(result.status,1);assert.match(result.stderr,/blocked/);
});
for(const [key,value] of Object.entries({GITHUB_ACTIONS:'false',GITHUB_EVENT_NAME:'push',GITHUB_REPOSITORY:'other/repo',GITHUB_REF:'refs/heads/topic',GITHUB_WORKFLOW_REF:'other',GITHUB_JOB:'validate',HANGYEOL_PUBLISH:'false',HANGYEOL_CONFIRM:'hangyeol-core@0.0.1',npm_config_registry:'https://registry.npmjs.org',npm_config_ignore_scripts:'true'})){
 test(`rejects wrong ${key}`,()=>assert.throws(()=>validatePublishContext(pkg,{...env,[key]:value},event,reviewed),/blocked/));
}
for(const [key,value] of [['name','hangyeol-core'],['version','0.1.0'],['private',true],['license','MIT'],['publishConfig',{registry:'https://registry.npmjs.org'}],['repository',{url:'https://github.com/other/repo.git',directory:'packages/core'}],['scripts',{}]]){
 test(`rejects wrong package ${key}`,()=>assert.throws(()=>validatePublishContext({...pkg,[key]:value},env,event,reviewed),/blocked/));
}
test('missing local context, missing payload, boolean/string confusion and wrong dispatch payload fail closed',()=>{
 for(const value of [null,{}, {...event,inputs:{publish:true,confirmation}}, {...event,inputs:{publish:'false',confirmation}}, {...event,inputs:{publish:'true',confirmation:'wrong'}}, {...event,ref:'refs/heads/topic'},{...event,repository:{full_name:'other/repo'}}])assert.throws(()=>validatePublishContext(pkg,env,value,reviewed),/blocked/);
 assert.throws(()=>validatePublishContext(pkg,{},event,reviewed),/blocked/);
});

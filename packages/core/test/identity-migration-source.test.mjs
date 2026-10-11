import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const repo=new URL('../../../',import.meta.url).pathname;
const bin=path.join(repo,'packages/core/bin/hangyeol.mjs');
const hash=b=>createHash('sha256').update(b).digest('hex');
function fixture(){
 const host=fs.mkdtempSync(path.join(process.env.TMPDIR||os.tmpdir(),'identity-migration-'));
 const config=JSON.parse(fs.readFileSync(path.join(repo,'apps/docs/hangyeol.json')));
 // Historical identity is an intentional migration fixture, not active metadata.
 config.version='0.1.0-s2.1';config.tool={package:'hangyeol-core',version:config.version};
 for(const [name,record] of Object.entries(config.installed)){
  record.version=config.version;
  const target=path.join(host,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(repo,'apps/docs',name),target);
 }
 for(const name of ['package.json','vite.config.ts','tsconfig.json'])fs.copyFileSync(path.join(repo,'apps/docs',name),path.join(host,name));
 fs.writeFileSync(path.join(host,'hangyeol.json'),JSON.stringify(config));
 return {host,config,run:args=>spawnSync(process.execPath,[bin,...args],{cwd:host,encoding:'utf8'})};
}
function snapshot(f){return Object.fromEntries(['hangyeol.json',...Object.keys(f.config.installed)].map(n=>[n,hash(fs.readFileSync(path.join(f.host,n)))]));}
test('bounded explicit migration uses actual init and add, changes only metadata and preserves all owners',()=>{
 const f=fixture(),before=snapshot(f);
 assert.equal(f.run(['init']).status,1);
 const dry=f.run(['init','--migrate-from-unscoped','--dry-run']);assert.equal(dry.status,0,dry.stderr);assert.deepEqual(snapshot(f),before);
 const migrated=f.run(['init','--migrate-from-unscoped']);assert.equal(migrated.status,0,migrated.stderr);
 const after=snapshot(f);delete before['hangyeol.json'];delete after['hangyeol.json'];assert.deepEqual(after,before);
 const config=JSON.parse(fs.readFileSync(path.join(f.host,'hangyeol.json')));
 assert.deepEqual(config.tool,{package:'@orderthan31/hangyeol-core',version:'0.0.1'});
 for(const [name,record] of Object.entries(config.installed)){assert.equal(record.version,'0.0.1');assert.equal(record.hash,hash(fs.readFileSync(path.join(f.host,name))));}
 assert.equal(f.run(['add','theme','text-field']).status,0);
 assert.equal(f.run(['init','--migrate-from-unscoped']).status,1);
});
for(const mode of ['edited-source','edited-style','wrong-hash','wrong-version','unknown-owner','missing-record','overwrite','add'])test(`migration refuses ${mode} with byte preservation`,()=>{
 const f=fixture(),config=f.config;
 if(mode==='edited-source')fs.appendFileSync(path.join(f.host,'src/hangyeol/primitives/button.tsx'),'\n// consumer edit\n');
 if(mode==='edited-style')fs.appendFileSync(path.join(f.host,config.stylePath),'\n/* consumer */\n');
 if(mode==='wrong-hash')config.installed['src/hangyeol/primitives/button.tsx'].hash='0'.repeat(64);
 if(mode==='wrong-version')config.tool.version='0.0.0';
 if(mode==='unknown-owner'){fs.writeFileSync(path.join(f.host,'unknown'),'owner');config.installed.unknown={version:config.version,hash:hash('owner')};}
 if(mode==='missing-record')delete config.installed['src/hangyeol/primitives/button.tsx'];
 fs.writeFileSync(path.join(f.host,'hangyeol.json'),JSON.stringify(config));
 const before=snapshot(f),args=mode==='add'?['add','button','--migrate-from-unscoped']:['init','--migrate-from-unscoped',...(mode==='overwrite'?['--overwrite']:[])];
 assert.equal(f.run(args).status,1);assert.deepEqual(snapshot(f),before);
});

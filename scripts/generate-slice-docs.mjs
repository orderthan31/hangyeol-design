import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const cwd=path.join(root,'apps/docs');
const require=createRequire(path.join(cwd,'package.json'));
const installed=path.dirname(require.resolve('@orderthan31/hangyeol-core/package.json'));
const cli=path.join(root,'node_modules/.bin/hangyeol');
const pkg=JSON.parse(fs.readFileSync(path.join(installed,'package.json')));
const docs=JSON.parse(fs.readFileSync(path.join(cwd,'package.json')));
if(docs.devDependencies['@orderthan31/hangyeol-core']!==pkg.version)throw Error('Docs must pin the installed core version exactly');
if(fs.realpathSync(cli)!==fs.realpathSync(path.join(installed,pkg.bin.hangyeol)))throw Error('Expected installed workspace-local hangyeol executable');
// Docs documents the complete current library; derive selection from its installed payload.
const manifest=JSON.parse(fs.readFileSync(path.join(installed,'payload/manifest.json')));
const migrate=process.argv.includes('--migrate-from-unscoped');
for(const args of [['init',...(migrate?['--migrate-from-unscoped']:[])],['add',...Object.keys(manifest.items).sort()]]){
 const result=spawnSync(process.execPath,[cli,...args],{cwd,stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
}

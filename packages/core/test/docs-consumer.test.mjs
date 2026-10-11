import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const docs=path.join(root,'apps/docs');
const json=p=>JSON.parse(fs.readFileSync(p));
const sha=b=>createHash('sha256').update(b).digest('hex');
const pkg=json(path.join(docs,'package.json'));
const require=createRequire(path.join(docs,'package.json'));
const installed=path.dirname(require.resolve('@orderthan31/hangyeol-core/package.json'));
const manifest=json(path.join(installed,'payload/manifest.json'));
const config=json(path.join(docs,'hangyeol.json'));
test('workspace contains only core and Docs, with an exact installed tool dependency',()=>{
 assert.deepEqual(json(path.join(root,'package.json')).workspaces,['packages/core','apps/docs']);
 assert.equal(pkg.name,'@hangyeol/docs');
 assert.equal(pkg.devDependencies['@orderthan31/hangyeol-core'],manifest.version);
 assert.equal(fs.realpathSync(path.join(root,'node_modules/.bin/hangyeol')),fs.realpathSync(path.join(installed,'bin/hangyeol.mjs')));
 assert.match(fs.readFileSync(path.join(docs,'src/main.tsx'),'utf8'),/from '\.\/docs-app'/);
});
test('Docs uses the full installed library with genuine hash/version ownership records',()=>{
 assert.equal(config.sourceRoot,'src/hangyeol');assert.equal(config.stylePath,'src/hangyeol.css');
 assert.deepEqual(config.tool,{package:'@orderthan31/hangyeol-core',version:manifest.version});
 assert.deepEqual([...config.components].sort(),Object.keys(manifest.items).sort());
 for(const [name,record] of Object.entries(manifest.files)){
  const target=config.sourceRoot+'/'+name;
  assert.equal(sha(fs.readFileSync(path.join(docs,target))),record.hash,target);
  assert.deepEqual(config.installed[target],{version:manifest.version,hash:record.hash},target);
  assert.equal(sha(fs.readFileSync(path.join(root,'packages/core/src/ui',name))),record.hash,name);
 }
 for(const [name,record] of Object.entries(config.installed))assert.equal(sha(fs.readFileSync(path.join(docs,name))),record.hash,name);
});
test('every selected runtime dependency belongs to Docs, not accidental root hoisting',()=>{
 const expected={...manifest.runtime},types={...manifest.types};for(const name of config.components){Object.assign(expected,manifest.items[name].runtime);Object.assign(types,manifest.items[name].types);}
 for(const [name,version] of Object.entries(types))assert.equal(pkg.devDependencies[name],version,name);
 for(const [name,version] of Object.entries(expected))assert.equal(pkg.dependencies[name],version,name);
 assert.equal(pkg.dependencies['react-is'],'19.2.0');
 for(const name of Object.keys(manifest.files).filter(name=>/\.tsx?$/.test(name))){
  const text=fs.readFileSync(path.join(docs,config.sourceRoot,name),'utf8');
  for(const match of text.matchAll(/from\s+['"]([^.'"][^'"]*)['"]/g)){
   const specifier=match[1],dependency=specifier.startsWith('@')?specifier.split('/').slice(0,2).join('/'):specifier.split('/')[0];
   assert.ok(pkg.dependencies[dependency],`${name} imports undeclared runtime ${dependency}`);
  }
 }
 for(const name of fs.readdirSync(path.join(docs,'src')).filter(n=>/\.(tsx?|css)$/.test(n))){
  const text=fs.readFileSync(path.join(docs,'src',name),'utf8');
  assert.doesNotMatch(text,/packages\/core\/src\/ui|packages\/core\/payload/,name);
 }
});

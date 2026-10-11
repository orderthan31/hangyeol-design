import test from 'node:test';
import assert from 'node:assert/strict';
import {ESLint} from 'eslint';
import {sliceConfig} from '../../../scripts/slice-eslint-policy.mjs';
const engine=new ESLint({overrideConfigFile:true,overrideConfig:sliceConfig});
const lint=async code=>(await engine.lintText(code,{filePath:'apps/docs/src/policy-probe.tsx'})).flatMap(x=>x.messages);
test('unstyled tab content supports scale spacing without opening styled controls',async()=>{
 assert.deepEqual(await lint(`import {TabsContent} from './hangyeol/primitives/tabs'; export const View=()=> <TabsContent value="a" className="pt-6"/>;`),[]);
 for(const [name,module] of [['Button','button'],['Input','input'],['TabsTrigger','tabs']])assert.ok((await lint(`import {${name}} from './hangyeol/primitives/${module}'; export const View=()=> <${name} className="p-8"/>;`)).some(x=>x.ruleId==='shadcn/no-restyle'));
});
test('authoring custom properties cannot bypass consumer semantic ownership',async()=>{
 assert.ok((await lint(`export const View=()=> <div style={{'--g-action':'var(--local)'}}/>;`)).some(x=>x.ruleId==='ds/no-unowned-custom-properties'));
});
test('layout gap contract is exact and all other guardrails stay active',async()=>{
 for(const name of ['Row','Stack']){
  assert.deepEqual(await lint(`import {${name}} from './hangyeol/primitives/layout'; export const View=()=> <${name} className="gap-2"/>;`),[]);
  assert.ok((await lint(`import {${name}} from './hangyeol/primitives/layout'; export const View=()=> <${name} className="p-8"/>;`)).some(x=>x.ruleId==='shadcn/no-restyle'));
 }
 for(const [code,rule] of [
  [`import {Button as TabsContent} from './hangyeol/primitives/button'; export const View=()=> <TabsContent className="p-8"/>;`,'shadcn/no-restyle'],
  [`import {TabsTrigger} from './hangyeol/primitives/tabs'; export const View=()=> <TabsTrigger className="pt-6"/>;`,'shadcn/no-restyle'],
  [`import {Row} from './hangyeol/primitives/layout'; export const View=()=> <Row className="gap-[13px]"/>;`,'shadcn/no-arbitrary-values'],
  [`export const View=()=> <input className="bg-red-600"/>;`,'shadcn/no-raw-colors'],
  [`export const View=()=> <input style={{padding:13}}/>;`,'shadcn/no-inline-styles'],
  [`import {Row} from './hangyeol/primitives/layout'; export const View=({gap})=> <Row className={gap}/>;`,'shadcn/require-static-classes'],
 ])assert.ok((await lint(code)).some(x=>x.ruleId===rule),code);
});

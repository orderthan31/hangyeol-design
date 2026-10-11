/// <reference types="node" />
import {it, expect, vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import DocsApp from '../src/docs-app';

it('keeps one useful introduction or usage alone across every live default route',()=>{
 // A server-render prerequisite, not viewport/computed-style acceptance.
 vi.stubGlobal('matchMedia',()=>({matches:false}));
 const originalHash=window.location.hash;
 const render=()=>{const template=document.createElement('template');template.innerHTML=renderToStaticMarkup(<DocsApp/>);return template.content;};
 try {
  window.location.hash='#Overview';
  const routes=[...render().querySelectorAll('.docs-navigation a[href]')].map(a=>a.getAttribute('href')!.slice(1));
  expect(new Set(routes).size).toBe(89);
  const rows: {name:string;component:boolean;introductions:number;notes:number;html:string}[]=[];
  for(const name of routes){
   window.location.hash='#'+name;
   const dom=render(),main=dom.querySelector('main')!;
   const component=main.querySelector('.docs-page-heading p')!.textContent==='컴포넌트';
   const introductions=main.querySelectorAll('.docs-lead,.docs-intro,.docs-component-context').length;
   const notes=main.querySelectorAll('.docs-example-purpose').length;
   if(component){expect(introductions,name).toBeLessThanOrEqual(1);expect(main.textContent,name).toContain('사용법');}
   if(name==='Overview'){
    expect(main.querySelector('.docs-lead')!.textContent).toBe('SIMPLE. BETTER. CONSISTENT.');
    for(const target of ['Foundations','Button','GettingStarted'])expect(main.querySelector(`a[href="#${target}"]`)).not.toBeNull();
    expect(main.textContent).not.toMatch(/소비|payload|canonical|worker|QA|PM/);
   }
   rows.push({name,component,introductions,notes,html:main.outerHTML});
  }
  const components=rows.filter(row=>row.component);
  expect(components).toHaveLength(77);
  expect(components.filter(row=>row.introductions===1)).toHaveLength(37);
  expect(components.filter(row=>row.introductions===0)).toHaveLength(40);
  expect(components.reduce((sum,row)=>sum+row.notes,0)).toBe(14);
  const evidence=process.env.HANGYEOL_GETTING_STARTED_EVIDENCE;
  if(evidence){expect(path.isAbsolute(evidence)).toBe(true);fs.writeFileSync(path.join(evidence,'default-route-ssr.json'),JSON.stringify(rows,null,2));}
 } finally {window.location.hash=originalHash;vi.unstubAllGlobals();}
},30000);

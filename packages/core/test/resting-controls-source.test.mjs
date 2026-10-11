import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// No preflight: reset only action buttons, not surfaces or state fills.
test('local action resets preserve conditional date fills and external ARIA error borders',()=>{
 const read=name=>fs.readFileSync(new URL('../src/ui/'+name,import.meta.url),'utf8');
 for(const name of ['primitives/accordion.tsx','primitives/collapse.tsx','components/list-row.tsx','components/progress-stepper.tsx']){
  const source=read(name);
  assert.match(source,/border-0 bg-transparent/);
  assert.match(source,/focus-visible:outline-3 focus-visible:outline-g-focus/);
 }
 assert.match(read('primitives/accordion.tsx'),/border border-solid border-g-line bg-g-surface/);
 assert.match(read('components/list-row.tsx'),/selected&&'bg-g-muted'/);
 assert.match(read('components/calendar-grid.tsx'),/current\?'bg-g-action text-g-on-action':within\?'bg-g-muted text-g-ink':'bg-transparent hover:bg-g-muted'/);
 assert.match(read('components/month-picker.tsx'),/current===candidate\?'bg-g-action text-g-on-action':'bg-transparent hover:bg-g-muted'/);
 for(const name of ['components/calendar-grid.tsx','components/month-picker.tsx'])assert.match(read(name),/cn\('border-0 min-h-11/);
 for(const name of ['primitives/input.tsx','primitives/textarea.tsx']){
  const source=read(name);
  assert.match(source,/aria-\[invalid=true\]:border-g-danger aria-\[invalid=true\]:enabled:hover:border-g-danger/);
  assert.match(source,/invalid && 'border-g-danger'/);
 }
});

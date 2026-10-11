import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../../../', import.meta.url));

test('the installed core owns an executable workspace boundary', () => {
  const corePath = `${root}packages/core/package.json`;
  assert.ok(fs.existsSync(corePath), 'CORE-01 requires a real installed @orderthan31/hangyeol-core package, not only the standalone CLI');
  const core = JSON.parse(fs.readFileSync(corePath, 'utf8'));
  const workspace = JSON.parse(fs.readFileSync(`${root}package.json`, 'utf8'));
  assert.equal(core.name, '@orderthan31/hangyeol-core');
  assert.ok(workspace.workspaces.includes('packages/core'));
  assert.ok(core.bin && Object.values(core.bin).length > 0, 'core must own the local executable');
  assert.ok(core.files?.length > 0, 'core must explicitly declare its packed artifact boundary');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {validateContext, validateRegistryMetadata, safeFile, name, version} from '../../../scripts/verify-published-core.mjs';
const require = createRequire(import.meta.url);
const yaml = createRequire(require.resolve('eslint/package.json'))('js-yaml');
const root = new URL('../../../', import.meta.url).pathname.replace(/\/$/, '');
const workflow = yaml.load(fs.readFileSync(path.join(root, '.github/workflows/publish-core.yml'), 'utf8'));

test('verification-only recovery never enters publish and all jobs keep least privilege', () => {
  const {validate, publish, verify} = workflow.jobs;
  assert.deepEqual(workflow.on.workflow_dispatch.inputs.verify_only, {description: 'Verify an already published immutable version without publishing', type: 'boolean', required: true, default: false});
  assert.equal(workflow.on.workflow_dispatch.inputs.publish.default, false);
  assert.deepEqual(verify.needs, ['validate', 'publish']);
  assert.deepEqual(validate.permissions, {contents: 'read'});
  assert.deepEqual(publish.permissions, {contents: 'read', packages: 'write'});
  assert.deepEqual(verify.permissions, {contents: 'read', packages: 'read'});
  const condition = verify.if.replace(/\s+/g, ' ').trim();
  assert.equal(condition, "always() && needs.validate.result == 'success' && (needs.publish.result == 'success' || (inputs.publish == false && inputs.verify_only == true))");
  // Evaluate the exact checked-in expression over the complete bounded truth table.
  const evaluate = new Function('needs', 'inputs', 'always', `return (${condition});`);
  for (const valid of ['success', 'failure', 'cancelled', 'skipped']) for (const published of ['success', 'failure', 'cancelled', 'skipped']) for (const wantsPublish of [true, false]) for (const recovery of [true, false]) {
    assert.equal(evaluate({validate: {result: valid}, publish: {result: published}}, {publish: wantsPublish, verify_only: recovery}, () => true), valid === 'success' && (published === 'success' || (!wantsPublish && recovery)));
  }
  const publishWhen = new Function('github', 'inputs', `return (${publish.if});`);
  const github = {event_name: 'workflow_dispatch', repository: 'orderthan31/hangyeol-design', ref: 'refs/heads/main'};
  assert.equal(publishWhen(github, {publish: false, verify_only: true, confirmation: `${name}@${version}`}), false);
  assert.equal(publishWhen(github, {publish: true, verify_only: false, confirmation: `${name}@${version}`}), true);
  for (const job of Object.values(workflow.jobs)) {
    assert.equal(job.steps[0].with.ref, '${{ github.sha }}');
    assert.equal(job.steps[0].with['persist-credentials'], false);
    assert.equal(job.steps[1].with['package-manager-cache'], false);
    assert.equal(job.steps[1].with['node-version'], '22.22.2');
    assert.ok(!job['continue-on-error']);
  }
  assert.equal(verify.steps.length, 3);
  assert.equal(verify.steps[0].uses, validate.steps[0].uses);
  assert.equal(verify.steps[1].uses, validate.steps[1].uses);
  assert.equal(verify.steps[1].with['registry-url'], 'https://npm.pkg.github.com');
  assert.equal(verify.steps[1].with.scope, '@orderthan31');
  assert.equal(verify.steps[2].run, 'node scripts/verify-published-core.mjs');
  assert.deepEqual(verify.steps[2].env, {NODE_AUTH_TOKEN: '${{ secrets.GITHUB_TOKEN }}'});
  assert.equal(workflow.concurrency['cancel-in-progress'], false);
});

test('verification rejects local invocation before filesystem writes or registry access', () => {
  assert.throws(() => validateContext({}), /Actions only/);
  const result = spawnSync(process.execPath, [path.join(root, 'scripts/verify-published-core.mjs')], {env: {PATH: process.env.PATH}, encoding: 'utf8'});
  assert.equal(result.status, 1); assert.match(result.stderr, /Actions only/);
  const base = {GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_REPOSITORY: 'orderthan31/hangyeol-design', GITHUB_REF: 'refs/heads/main', GITHUB_JOB: 'verify', GITHUB_WORKFLOW_REF: 'orderthan31/hangyeol-design/.github/workflows/publish-core.yml@refs/heads/main', GITHUB_SHA: 'a'.repeat(40)};
  assert.throws(() => validateContext(base), /read token required/);
  for (const change of [{GITHUB_JOB: 'publish'}, {GITHUB_REF: 'refs/heads/topic'}, {GITHUB_SHA: '../wrong'}, {RUNNER_TEMP: '../outside'}]) assert.throws(() => validateContext({...base, NODE_AUTH_TOKEN: 'synthetic-test-value', ...change}));
});

test('registry proof requires exact identity, remote tarball, integrity and physical lock', () => {
  const pkg = {name, version, license: 'UNLICENSED', private: false, bin: {hangyeol: 'bin/hangyeol.mjs'}, repository: {url: 'https://github.com/orderthan31/hangyeol-design.git', directory: 'packages/core'}};
  const dist = {integrity: 'sha512-YWJjZA==', shasum: 'b'.repeat(40), tarball: 'https://npm.pkg.github.com/download/proof/example'};
  const metadata = {...pkg, dist}; const lock = {version, integrity: dist.integrity, resolved: dist.tarball};
  validateRegistryMetadata(metadata, pkg, lock);
  for (const change of [{name: 'hangyeol-core'}, {version: '0.0.2'}, {license: 'MIT'}, {repository: {}}]) assert.throws(() => validateRegistryMetadata({...metadata, ...change}, pkg, lock));
  for (const change of [{link: true}, {version: '0.0.2'}, {integrity: 'different'}, {resolved: 'file:local.tgz'}]) assert.throws(() => validateRegistryMetadata(metadata, pkg, {...lock, ...change}));
  for (const url of ['https://registry.npmjs.org/core.tgz', 'https://user:password@npm.pkg.github.com/archive', 'https://npm.pkg.github.com/archive?token=value']) assert.throws(() => validateRegistryMetadata({...metadata, dist: {...dist, tarball: url}}, pkg, {...lock, resolved: url}));
  for (const relative of ['../package.json', '/package.json', 'a/../package.json', 'a\\b', 'a//b']) assert.throws(() => safeFile(root, relative));
});

test('README App preserves getting-started controls with lint-safe layout and entry CSS relocation', () => {
  const readme = fs.readFileSync(path.join(root, 'packages/core/README.md'), 'utf8');
  const example = readme.match(/<!-- registry-example -->\n```tsx\n([\s\S]*?)\n```/)[1];
  const visitor = fs.readFileSync(path.join(root, 'apps/docs/src/visitor-pages.tsx'), 'utf8');
  const original = visitor.match(/const example = `([\s\S]*?)`;/)[1];
  for (const line of original.split('\n').filter(line => /<TextField|<Button/.test(line))) assert.ok(example.includes(line.trim()));
  assert.match(example, /<Theme mode="light" palette="Indigo">/);
  assert.match(example, /<div className="grid gap-4 p-6">/);
  assert.doesNotMatch(example, /<Theme[^>]*className|import ['"][^'"]*\.css/);
  assert.doesNotMatch(readme, /CORE-\d|local candidate|Publication\s+is blocked/);
});

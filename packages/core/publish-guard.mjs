import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

// Intent gate, not an authentication boundary. Registry authorization is still required.
export function validatePublishContext(pkg, env, event, readiness) {
  if (readiness?.candidate !== '@orderthan31/hangyeol-core@0.0.1' || readiness.uiAndCopyReviewComplete !== true) throw Error('Publication blocked: pending all-component UI/copy review');
  const name = '@orderthan31/hangyeol-core', version = '0.0.1';
  const registry = 'https://npm.pkg.github.com';
  const repository = 'orderthan31/hangyeol-design';
  const reject = reason => { throw Error(`Publication blocked: ${reason}`); };
  if (pkg.name !== name || pkg.version !== version) reject('candidate identity');
  if (pkg.private !== false || pkg.license !== 'UNLICENSED' || pkg.scripts?.prepublishOnly !== 'node publish-guard.mjs') reject('package safety contract');
  if (pkg.repository?.url !== `https://github.com/${repository}.git` || pkg.repository?.directory !== 'packages/core') reject('repository metadata');
  if (pkg.publishConfig?.registry !== registry || env.npm_config_registry !== registry) reject('registry');
  if (env.npm_config_ignore_scripts && env.npm_config_ignore_scripts !== 'false') reject('scripts must remain enabled');
  if (env.GITHUB_ACTIONS !== 'true' || env.GITHUB_EVENT_NAME !== 'workflow_dispatch') reject('manual GitHub Actions only');
  if (env.GITHUB_REPOSITORY !== repository || env.GITHUB_REF !== 'refs/heads/main') reject('repository/ref');
  if (env.GITHUB_WORKFLOW_REF !== `${repository}/.github/workflows/publish-core.yml@refs/heads/main` || env.GITHUB_JOB !== 'publish') reject('workflow/job');
  if (env.HANGYEOL_PUBLISH !== 'true' || env.HANGYEOL_CONFIRM !== `${name}@${version}`) reject('explicit approval');
  if (!event || event.inputs?.publish !== 'true' || event.inputs?.confirmation !== `${name}@${version}` || event.repository?.full_name !== repository || event.ref !== 'refs/heads/main') reject('dispatch payload');
  return {name, version, registry};
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url)));
    const event = process.env.GITHUB_EVENT_PATH ? JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH)) : null;
    const readiness = JSON.parse(fs.readFileSync(new URL('./publication-readiness.json', import.meta.url)));
    validatePublishContext(pkg, process.env, event, readiness);
    if (process.env.npm_lifecycle_event !== 'prepublishOnly' || !process.env.NODE_AUTH_TOKEN) throw Error('Publication blocked: authenticated publish lifecycle required');
    console.log('Manual publication intent validated; registry authentication remains required.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

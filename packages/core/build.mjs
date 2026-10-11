import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { buildSlicePayload } from '../../scripts/build-slice-payload.mjs';
import { hash } from './src/tools/safety.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const target = fileURLToPath(new URL('./', import.meta.url));
const pkg = JSON.parse(fs.readFileSync(path.join(target, 'package.json')));
if (pkg.name !== '@orderthan31/hangyeol-core' || pkg.license !== 'UNLICENSED' || pkg.private !== false || pkg.version !== '0.0.1' || pkg.scripts?.prepublishOnly !== 'node publish-guard.mjs' || pkg.publishConfig?.registry !== 'https://npm.pkg.github.com') {
  throw Error('CORE-01 package/license boundary requires the guarded scoped UNLICENSED candidate');
}
const manifest = buildSlicePayload();
const provenance = JSON.parse(fs.readFileSync(path.join(target, 'payload/assets/provenance.json')));
if (provenance.license !== 'SIL OFL 1.1' || provenance.unmodified_originals !== true) {
  throw Error('Font license/provenance differs from the inspected unmodified upstream boundary');
}
for (const record of provenance.files) {
  const name = path.basename(record.file);
  if (manifest.assets[name]?.hash !== record.sha256) throw Error(`Font provenance hash mismatch: ${name}`);
}
if (!fs.readFileSync(path.join(target, 'payload/assets/LICENSE'), 'utf8').includes('SIL OPEN FONT LICENSE')) {
  throw Error('Actual font OFL license bytes are missing');
}

const copies = [
  ['packages/core/src/router.mjs', 'dist/router.mjs'],
  ['packages/core/src/doctor.mjs', 'dist/doctor.mjs'],
  ...['common', 'lint', 'lint-policy', 'lint-css', 'tokens', 'token-policy'].map(name => [`packages/core/src/tools/${name}.mjs`, `dist/tools/${name}.mjs`]),
  ['scripts/slice-eslint-policy.mjs', 'dist/policy/slice-eslint-policy.mjs'],
  ['scripts/design-jsx-policy.mjs', 'dist/policy/design-jsx-policy.mjs'],
  ['packages/core/src/tools/installer.mjs', 'dist/tools/installer.mjs'],
  ['packages/core/src/tools/safety.mjs', 'dist/tools/safety.mjs'],
  ['packages/core/src/tools/host-config.mjs', 'dist/tools/host-config.mjs'],
];
const files = {};
for (const [from, to] of copies) {
  const bytes = fs.readFileSync(path.join(root, from));
  fs.mkdirSync(path.dirname(path.join(target, to)), { recursive: true });
  fs.writeFileSync(path.join(target, to), bytes);
  files[to] = { hash: hash(bytes), bytes: bytes.length, source: from };
}
const bin = 'bin/hangyeol.mjs';
fs.chmodSync(path.join(target, bin), 0o755);
const bytes = fs.readFileSync(path.join(target, bin));
files[bin] = { hash: hash(bytes), bytes: bytes.length, source: 'packages/core/bin/hangyeol.mjs' };

const require = createRequire(path.join(root, 'package.json'));
const notices = [];
const policyDependencies=[];
for (const [name, version] of Object.entries(pkg.dependencies)) {
  const metadataPath=require.resolve(`${name}/package.json`),metadata = JSON.parse(fs.readFileSync(metadataPath));
  if (metadata.version !== version || !metadata.license) throw Error(`Unverified tool dependency/license: ${name}`);
  const licenseName=['LICENSE','LICENSE-MIT'].find(file=>fs.existsSync(path.join(path.dirname(metadataPath),file)));
  if(!licenseName)throw Error(`Missing actual dependency license: ${name}`);
  const license=fs.readFileSync(path.join(path.dirname(metadataPath),licenseName)),to=`dist/policy/licenses/${name.replaceAll('/','-').replaceAll('@','')}.txt`;
  fs.mkdirSync(path.dirname(path.join(target,to)),{recursive:true});fs.writeFileSync(path.join(target,to),license);files[to]={hash:hash(license),bytes:license.length,source:`npm:${name}@${version}/${licenseName}`};
  policyDependencies.push({name,version,license:metadata.license,licenseFile:to,licenseHash:hash(license)});
  notices.push(`- ${name} ${metadata.version}: ${metadata.license}. Installed as a dependency; its package retains its own license/notice files.`);
}
// Bound third-party project/theme discovery to installed, hashed policy inputs.
for(const [to,value] of Object.entries({'dist/policy/components.json':{aliases:{ui:'../../payload/source'},tailwind:{css:'../../payload/source/foundation/theme.css'}},'dist/policy/tsconfig.json':{compilerOptions:{}}})){
 const bytes=Buffer.from(JSON.stringify(value,null,2)+'\n');fs.writeFileSync(path.join(target,to),bytes);files[to]={hash:hash(bytes),bytes:bytes.length,source:'bounded installed policy discovery config'};
}
const classifierRequire=createRequire(require.resolve('@shadcn/lint/package.json')),classifierRoot=path.dirname(path.dirname(classifierRequire.resolve('cn/config'))),classifierMetadata=JSON.parse(fs.readFileSync(path.join(classifierRoot,'package.json')));
if(classifierMetadata.name!=='cn'||classifierMetadata.version!=='0.3.2'||!classifierMetadata.license)throw Error('Unverified pinned shadcn grammar dependency');
const classifierLicense=fs.readFileSync(path.join(classifierRoot,'LICENSE')),classifierLicenseFile='dist/policy/licenses/cn.txt';fs.writeFileSync(path.join(target,classifierLicenseFile),classifierLicense);files[classifierLicenseFile]={hash:hash(classifierLicense),bytes:classifierLicense.length,source:'npm:cn@0.3.2/LICENSE'};
const policy=Buffer.from(JSON.stringify({source:'scripts/slice-eslint-policy.mjs',sourceHash:files['dist/policy/slice-eslint-policy.mjs'].hash,supplement:{source:'scripts/design-jsx-policy.mjs',sourceHash:files['dist/policy/design-jsx-policy.mjs'].hash},firstPartyLicense:'UNLICENSED',dependencies:policyDependencies,classifier:{name:'cn',version:classifierMetadata.version,license:classifierMetadata.license,licenseFile:classifierLicenseFile,licenseHash:hash(classifierLicense)}},null,2)+'\n');
fs.writeFileSync(path.join(target,'dist/policy/manifest.json'),policy);files['dist/policy/manifest.json']={hash:hash(policy),bytes:policy.length,source:'verified build-time policy/license metadata'};
fs.writeFileSync(path.join(target, 'dist/tool-manifest.json'), JSON.stringify({ package: pkg.name, version: pkg.version, files }, null, 2) + '\n');
fs.writeFileSync(path.join(target, 'THIRD_PARTY_NOTICES.md'), '# Third-party boundaries\n\nUnmodified Pretendard v1.3.9: SIL OFL 1.1. Actual license and upstream provenance are bundled at payload/assets/LICENSE and payload/assets/provenance.json. Historical browser-load statements in that copied provenance are not new CORE-01 verification.\n\n' + notices.join('\n') + '\n\nFirst-party code/UI sources are UNLICENSED. No ownership or new license grant is asserted by this package.\n');
console.error(`Built ${pkg.name}@${pkg.version}: installed router/tools and canonical source/font payload`);

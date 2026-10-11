import fs from 'node:fs';
import path from 'node:path';
import { hash, safeTarget } from './safety.mjs';

export function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function openBoundary(root) {
  const pkg = readJSON(path.join(root, 'package.json'));
  const manifest = readJSON(path.join(root, 'payload/manifest.json'));
  const tools = readJSON(path.join(root, 'dist/tool-manifest.json'));
  if (pkg.name !== '@orderthan31/hangyeol-core' || manifest.package !== pkg.name || tools.package !== pkg.name) {
    throw Error('Core payload/tool package ownership mismatch');
  }
  if (manifest.version !== pkg.version || tools.version !== pkg.version) {
    throw Error('Core package/payload/tool version mismatch');
  }
  const records = [
    ...Object.entries(manifest.files).map(([name, record]) => [`payload/source/${name}`, record]),
    ...Object.entries(manifest.assets).map(([name, record]) => [`payload/assets/${name}`, record]),
    ...Object.entries(tools.files),
  ];
  if (!Object.keys(manifest.files).length || !Object.keys(manifest.assets).length || !Object.keys(tools.files).length) {
    throw Error('Empty core boundary is not valid');
  }
  for (const [name, record] of records) {
    const bytes = fs.readFileSync(safeTarget(root, name));
    if (hash(bytes) !== record.hash || bytes.length !== record.bytes) {
      throw Error(`Core packed integrity mismatch: ${name}`);
    }
  }
  return { root, pkg, manifest, tools, payloadRoot: path.join(root, 'payload') };
}

export function inspectBoundary({ pkg, manifest, tools }) {
  return {
    package: pkg.name,
    version: pkg.version,
    license: pkg.license,
    private: pkg.private,
    sources: Object.keys(manifest.files),
    assets: Object.keys(manifest.assets),
    toolFiles: Object.keys(tools.files),
    integrity: 'verified',
    consumerUI: 'Copied local source; no runtime core import',
  };
}

import { fileURLToPath } from 'node:url';
import { openBoundary, inspectBoundary } from './tools/common.mjs';

const packageRoot = fileURLToPath(new URL('../', import.meta.url));

export async function main(args) {
  try {
    const boundary = openBoundary(packageRoot);
    const [command, ...rest] = args;
    if (command === '--version' && !rest.length) {
      console.log(boundary.pkg.version);
      return 0;
    }
    if (command === '--help' && !rest.length) {
      console.log('@orderthan31/hangyeol-core: installed local tools\nUsage: hangyeol --version | inspect | doctor | init [--dry-run] | add <component> [--dry-run] | lint [inspect] | tokens [inspect|presets|validate|export]\nDoctor checks consumer installation read-only. Lint checks hangyeol.json sourceRoot read-only. Tokens validate configured consumer CSS/semantic data; export writes only with --output. Use the installed node_modules/.bin/hangyeol; no registry execution fallback or update engine.');
      return 0;
    }
    if (command === 'inspect' && !rest.length) {
      console.log(JSON.stringify(inspectBoundary(boundary), null, 2));
      return 0;
    }
    if (command === 'doctor') {
      const { runDoctor } = await import('./doctor.mjs');
      return await runDoctor(rest, boundary);
    }
    if (command === 'init' || command === 'add') {
      const { runInstaller } = await import('./tools/installer.mjs');
      return runInstaller(args, { payloadRoot: boundary.payloadRoot });
    }
    if (command === 'lint') {
      const { runLint } = await import('./tools/lint.mjs');
      return await runLint(rest, boundary);
    }
    if (command === 'tokens') {
      const { runTokens } = await import('./tools/tokens.mjs');
      return runTokens(rest, boundary);
    }
    throw Error('Unsupported command; use hangyeol --help. No registry fallback or update engine is provided.');
  } catch (error) {
    console.error(`HANGYEOL CORE ERROR: ${error.message}`);
    return 1;
  }
}

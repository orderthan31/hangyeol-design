/// <reference types="node" />
import { it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import { GettingStarted } from '../src/visitor-pages';

it('renders core installation, supported CLI commands and local-source usage without advertising a published package', () => {
  const template = document.createElement('template');
  template.innerHTML = renderToStaticMarkup(<GettingStarted />);
  const content = template.content.textContent ?? '';
  const examples = [...template.content.querySelectorAll('.hangyeol-code')].map(block => ({
    label: block.querySelector('.hangyeol-code-toolbar span')!.textContent!,
    source: block.querySelector('code')!.textContent!,
  }));
  const shell = examples.filter(example => example.label === 'Shell').map(example => example.source).join('\n');
  expect(shell).toContain('\nnpm exec --no -- hangyeol --version');
  expect(shell).not.toContain('\\n');
  expect(content).toContain('@orderthan31/hangyeol-core');
  expect(shell).toContain('./orderthan31-hangyeol-core-0.0.1.tgz');
  for (const command of ['--help', 'init --dry-run', 'add theme text-field --dry-run', 'add button dialog', 'doctor', 'lint inspect', 'tokens validate', 'tokens inspect', 'tokens presets', 'tokens export --format json']) {
    expect(shell).toContain('npm exec --no -- hangyeol ' + command);
  }
  expect(shell).not.toMatch(/(?:^|\n)\s*(?:npx|npm publish|npm login)\b/);
  expect(content).toContain('정적 Vite 설정');
  expect(content).toContain('자동 update·reset 명령은 제공하지 않습니다');
  expect(content).toContain('GitHub Packages의 공개 npm 패키지도 설치 인증이 필요');
  expect(examples.some(example => example.source.includes("import './hangyeol.css';") && example.source.includes("from './hangyeol/components/text-field'"))).toBe(true);
  const evidence = process.env.HANGYEOL_GETTING_STARTED_EVIDENCE;
  if (evidence) {
    expect(path.isAbsolute(evidence)).toBe(true);
    fs.writeFileSync(path.join(evidence, 'rendered-starting-examples.json'), JSON.stringify(examples, null, 2));
  }
});

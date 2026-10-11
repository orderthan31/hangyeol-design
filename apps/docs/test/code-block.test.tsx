import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act } from 'react';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CodeBlock } from '../src/hangyeol/components/code-block';
import * as formatting from '../src/hangyeol/lib/code-format';
import { Theme } from '../src/hangyeol/foundation/theme';
import fs from 'node:fs';
import path from 'node:path';

// Source-only census: expose existing code panels during SSR, without browser work.
vi.mock('../src/hangyeol/primitives/tabs', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../src/hangyeol/primitives/tabs')>();
  return {
    ...actual,
    TabsContent: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  };
});

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function ready(container: HTMLElement) {
  await waitFor(() =>
    expect(container.querySelector('pre')?.getAttribute('aria-busy')).toBe(
      'false',
    ),
  );
  return container.querySelector('code')!;
}

it('formats TSX, CSS and JSON with two spaces and keeps shell and unknown text untouched', async () => {
  expect(
    await formatting.formattedCode('const value={name:"한결",count:2};', 'tsx'),
  ).toBe("const value = { name: '한결', count: 2 };");
  expect(
    await formatting.formattedCode(
      '.page{color:var(--g-ink);background:var(--g-canvas)}',
      'css',
    ),
  ).toBe('.page {\n  color: var(--g-ink);\n  background: var(--g-canvas);\n}');
  expect(
    await formatting.formattedCode('{"enabled":true,"count":2}', 'json'),
  ).toBe('{ "enabled": true, "count": 2 }');
  for (const language of ['bash', 'text'] as const) {
    const source =
      'npm install --save-exact /path/to/package.tgz\n# 한글 안내\nprintf \'%s\\n\' "$HOME"\n';
    expect(await formatting.formattedCode(source, language)).toBe(source);
  }
});

it('formats adjacent JSX snippets without exposing the temporary wrapper', async () => {
  const result = await formatting.formattedCode(
    '<Button><Icon name="search" size="small"/>검색</Button>\n<Icon name="check" label="완료"/>',
    'tsx',
  );
  expect(result).toBe(
    '<Button>\n  <Icon name="search" size="small" />\n  검색\n</Button>\n<Icon name="check" label="완료" />',
  );
  expect(result).not.toContain('const example');
  expect(await formatting.formattedCode(result, 'tsx')).toBe(result);
});

it('renders inert token spans and copies exactly the formatted visible text', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  const { container } = render(
    <CodeBlock>
      {
        'export function Example(){return <Button disabled={false}>저장</Button>;}'
      }
    </CodeBlock>,
  );
  const code = await ready(container);
  expect(code.querySelector('.token.keyword')).not.toBeNull();
  expect(code.querySelector('.token.tag')).not.toBeNull();
  expect(code.querySelector('button')).toBeNull();
  expect(container.querySelector('pre')?.tabIndex).toBe(0);
  fireEvent.click(container.querySelector('button')!);
  await waitFor(() => expect(writeText).toHaveBeenCalledWith(code.textContent));
  expect(container.querySelector('[role="status"]')?.textContent).toBe(
    '코드를 복사했습니다.',
  );
  const inert = '<img src="x" onerror="alert(1)"><script>alert(1)</script>';
  cleanup();
  const safe = render(<CodeBlock language="text">{inert}</CodeBlock>);
  expect((await ready(safe.container)).textContent).toBe(inert);
  expect(safe.container.querySelector('img,script')).toBeNull();
});

it('ignores stale asynchronous formatting when live example settings change', async () => {
  let first!: (value: string) => void, second!: (value: string) => void;
  vi.spyOn(formatting, 'formattedCode').mockImplementation(
    (source) =>
      new Promise((resolve) => {
        if (source === 'old') first = resolve;
        else second = resolve;
      }),
  );
  const view = render(<CodeBlock>old</CodeBlock>);
  view.rerender(<CodeBlock>new</CodeBlock>);
  expect(view.container.querySelector('button')?.disabled).toBe(true);
  await act(async () => {
    second('new formatted');
  });
  await act(async () => {
    first('old formatted');
  });
  expect(view.container.querySelector('code')?.textContent).toBe(
    'new formatted',
  );
});

it('does not mark a newer example as copied when an older clipboard promise completes', async () => {
  let finish!: () => void;
  const writeText = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  const view = render(<CodeBlock>{'const old=1;'}</CodeBlock>);
  await ready(view.container);
  fireEvent.click(view.container.querySelector('button')!);
  view.rerender(<CodeBlock>{'const fresh=2;'}</CodeBlock>);
  await ready(view.container);
  await act(async () => {
    finish();
  });
  expect(view.container.querySelector('button')?.textContent).toBe('코드 복사');
});

it('preserves selectable original source on parser failure and explains clipboard failure', async () => {
  vi.stubGlobal('navigator', {
    clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
  });
  const source = 'const invalid = {';
  const { container } = render(<CodeBlock>{source}</CodeBlock>);
  expect((await ready(container)).textContent).toBe(source);
  expect(container.textContent).toContain('원본 코드를 표시합니다.');
  fireEvent.click(container.querySelector('button')!);
  await waitFor(() =>
    expect(container.querySelector('[role="status"]')?.textContent).toContain(
      '코드를 선택해서 복사하세요.',
    ),
  );
});

it('tokenizes CSS and Shell according to their language, under either scheme', async () => {
  for (const mode of ['light', 'dark'] as const) {
    const view = render(
      <Theme mode={mode}>
        <CodeBlock language="CSS">{'.page{color:var(--g-ink)}'}</CodeBlock>
        <CodeBlock language="Shell">
          {'npm install --save-dev "./package.tgz"'}
        </CodeBlock>
      </Theme>,
    );
    await waitFor(() =>
      expect(
        view.container.querySelectorAll('pre[aria-busy="false"]'),
      ).toHaveLength(2),
    );
    expect(
      view.container.querySelector('.language-css .token.property'),
    ).not.toBeNull();
    expect(
      view.container.querySelector('.language-bash .token.string'),
    ).not.toBeNull();
    expect(
      view.container.querySelector(`[data-theme="${mode}"]`),
    ).not.toBeNull();
    view.unmount();
  }
});

it('formats every current default component and Foundation code example without fallback', async () => {
  const modules = await Promise.all([
    import('../src/component-pages'),
    import('../src/control-pages'),
    import('../src/input-pages'),
    import('../src/selection-pages'),
    import('../src/native-pages'),
    import('../src/interaction-pages'),
    import('../src/date-data-pages'),
    import('../src/foundation-pages'),
    import('../src/visitor-pages'),
  ]);
  const [
    components,
    controls,
    inputs,
    selections,
    natives,
    interactions,
    dates,
    foundations,
    visitors,
  ] = modules;
  const pages = [
    ...Object.keys(components.componentDescriptions).map((name) => ({
      name,
      node: <components.ComponentPage name={name} />,
    })),
    ...controls.controlNames.map((name) => ({
      name,
      node: <controls.ControlPage name={name} initialPanel="code" />,
    })),
    ...inputs.inputNames.map((name) => ({
      name,
      node: <inputs.InputPage name={name} initialPanel="code" />,
    })),
    ...selections.selectionNames.map((name) => ({
      name,
      node: <selections.SelectionPage name={name} initialPanel="code" />,
    })),
    ...natives.nativeNames.map((name) => ({
      name,
      node: <natives.NativePage name={name} initialPanel="code" />,
    })),
    ...interactions.interactionNames.map((name) => ({
      name,
      node: <interactions.InteractionPage name={name} initialPanel="code" />,
    })),
    ...dates.dateDataNames.map((name) => ({
      name,
      node: <dates.DateDataPage name={name} initialPanel="code" />,
    })),
    ...foundations.foundationNames.map((name) => ({
      name,
      node: <foundations.FoundationPage name={name} />,
    })),
    { name: 'GettingStarted', node: <visitors.GettingStarted /> },
    { name: 'Customization', node: <visitors.Customization /> },
    { name: 'TaskExample', node: <components.CompositionExamples /> },
    { name: 'Overview', node: <visitors.Overview /> },
    { name: 'Foundations', node: <foundations.Foundations /> },
  ];
  const failures: string[] = [];
  let count = 0;
  const census: {name:string; examples:number}[]=[];
  for (const { name, node } of pages) {
    const template = document.createElement('template');
    template.innerHTML = renderToStaticMarkup(<Theme>{node}</Theme>);
    const blocks = template.content.querySelectorAll('.hangyeol-code');
    census.push({name,examples:blocks.length});
    if (!name.startsWith('Foundation') && name !== 'Overview')
      expect(blocks.length, name).toBeGreaterThan(0);
    for (const block of blocks) {
      const code = block.querySelector('code')!.textContent!;
      const label = block.querySelector(
        '.hangyeol-code-toolbar span',
      )!.textContent!;
      try {
        const formatted = await formatting.formattedCode(
          code,
          formatting.codeLanguage(label),
        );
        expect(formatted.length, name).toBeGreaterThan(0);
        count++;
      } catch (error) {
        failures.push(`${name}: ${String(error)}`);
      }
    }
  }
  console.log(
    JSON.stringify({
      sourcePages: pages.length,
      sourceExamples: count,
      formattingFailures: failures,
    }),
  );
  expect(failures).toEqual([]);
  expect(pages).toHaveLength(89);
  expect(count).toBeGreaterThan(70);
  const evidence=process.env.HANGYEOL_GETTING_STARTED_EVIDENCE;
  if(evidence)fs.writeFileSync(path.join(evidence,'formatted-example-census.json'),JSON.stringify({pages:census,examples:count,failures},null,2));
}, 30000);

# @orderthan31/hangyeol-core

Hangyeol installs editable React UI source into your project. The `hangyeol` CLI is a development tool, **not a React runtime library**. Import your local components, never this package, in application code.

## Requirements and installation

Use Node.js 22.22.2 (minimum 22.12), npm, and a React 19 / Vite / Tailwind 4 host. The supported pinned host uses React and React DOM 19.2.0, TypeScript 5.9.3, Vite 7.3.6, Tailwind and `@tailwindcss/vite` 4.3.3, `@types/react` and `@types/react-dom` 19.2.2. Other framework adapters are not supported.

Configure your npm client to route the `@orderthan31` scope to `https://npm.pkg.github.com` and authenticate with package read access. Keep the default registry as `https://registry.npmjs.org` for public dependencies. Use your organization's approved credential setup; never commit tokens or authentication configuration. GitHub Actions consumers need package read permission and repository access to the package. A public source repository alone does not grant package access or a software license.

In a supported host, install the exact tool version:

```sh
npm install --save-dev --save-exact @orderthan31/hangyeol-core@0.0.1
./node_modules/.bin/hangyeol --version
./node_modules/.bin/hangyeol init --dry-run
./node_modules/.bin/hangyeol init
./node_modules/.bin/hangyeol add theme text-field button --dry-run
./node_modules/.bin/hangyeol add theme text-field button
```

Installing the package alone does not create UI. `init` prepares the supported static host connections, fonts, styles and common helpers. `add` installs selected owners and their dependency closure. Review dependency and backup plans before changing an existing host. Edited or conflicting files are not silently overwritten.

Defaults are `hangyeol.json`, source root `src/hangyeol`, stylesheet `src/hangyeol.css` and fonts in `public/fonts/hangyeol`. Paths can be configured; adapt imports accordingly. The npm account scope is unrelated to your local source paths or aliases.

## Use local components

Save this example as `src/hangyeol/App.tsx`. Keeping authored examples inside the configured source root includes them in the static lint check.

<!-- registry-example -->
```tsx
import { Theme } from './foundation/theme';
import { TextField } from './components/text-field';
import { Button } from './primitives/button';

export function App() {
  return (
    <Theme mode="light" palette="Indigo">
      <div className="grid gap-4 p-6">
        <TextField label="이름" name="name" defaultValue="김한결" clearable />
        <Button type="button">확인</Button>
      </div>
    </Theme>
  );
}
```

Mount it from `src/main.tsx` and import the entry stylesheet there, outside the checked component source root:

```tsx
import { createRoot } from 'react-dom/client';
import { App } from './hangyeol/App';
import './hangyeol.css';

createRoot(document.getElementById('root')!).render(<App />);
```

Your host needs an `index.html` with a `root` element and module entry pointing to `/src/main.tsx`, plus a TypeScript configuration using `react-jsx`, bundler module resolution and `vite/client` types. The `Theme` owner is explicitly selected above; `text-field` also selects Input, Button and FormField.

## Check and build

```sh
./node_modules/.bin/hangyeol inspect
./node_modules/.bin/hangyeol doctor
./node_modules/.bin/hangyeol tokens validate
./node_modules/.bin/hangyeol lint
./node_modules/.bin/tsc -p tsconfig.json --pretty false
./node_modules/.bin/vite build
```

- `inspect` verifies installed payload/tool identities and hashes.
- `doctor` checks supported static installation, dependency, source and host connections. It does not repair files or run a compiler.
- `tokens validate` checks actual consumer CSS and typed semantic roles without resetting owner values. `tokens presets` and `tokens export --format json` inspect/export token data; explicit safe output requests can write new files.
- `lint` checks supported `.ts`/`.tsx` syntax under the configured `sourceRoot`, not every file in your application. It uses the pinned host Tailwind compiler; an unavailable compiler is not a passing result. `lint inspect` inspects tool policy only and is not consumer lint.

Edit installed components, helpers and theme source directly. Partial, replacement and additional palettes are consumer-owned; preset names are not a restriction on your palette. Keep native props, focus and accessibility behavior when editing. Existing ownership records are not automatically replaced to hide edits. General update plan/diff/apply and source reset are unsupported.

These checks do not certify dynamic class strings, arbitrary host CSS restyling, browser cascade, visual appearance, contrast, keyboard or assistive-technology behavior. Static build success is not end-to-end or accessibility acceptance. Installer file recovery is bounded and does not roll back dependency installation or guarantee hostile-race/crash atomicity.

## License

First-party code and UI source are **UNLICENSED**. Package availability does not grant external use, redistribution or other license rights. Font assets retain their SIL Open Font License 1.1 and upstream notices. Read `LICENSE` and `THIRD_PARTY_NOTICES.md` before use.

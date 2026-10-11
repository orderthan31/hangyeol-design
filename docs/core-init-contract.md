# Installed core init contract (CORE-02)

This local candidate supports a bounded React 19 / Vite / Tailwind 4 host. CORE-01's independent VPS offline installation remains unpassed. Prepared Mac-cache checks do not establish empty-cache portability, release availability or publication approval. First-party code is guarded and `UNLICENSED`; bundled unmodified Pretendard retains its actual SIL OFL 1.1 license and provenance. No new license grant is made.

## Local package and executable

Pack the workspace into an owner-designated directory outside the repository, then install that actual tarball:

```sh
npm pack --workspace=@orderthan31/hangyeol-core --pack-destination="$CORE02_EVIDENCE_DIR"
npm install --offline --save-dev --save-exact ./artifacts/orderthan31-hangyeol-core-0.0.1.tgz
./node_modules/.bin/hangyeol --version
./node_modules/.bin/hangyeol init --dry-run
```

The illustrative relative artifact location must point to the file actually packed. Use the installed local executable, without a registry fallback. Installation retains a physical `@orderthan31/hangyeol-core` devDependency and lock entry; it does not generate UI through postinstall. Tools live in node_modules; editable UI does not import core at runtime. The candidate version stays aligned with the package, tool manifest and source payload; there is no release/version change in CORE-02.

## Settings and generated files

`hangyeol.json` is the settings/installation record. `basePath` must be a same-origin root-relative path ending in `/`, such as `/` or `/design/`. Leading `//` (including `//cdn/`) is rejected rather than normalized, since URL interpretation treats it as an off-origin network path. The same guard validates merged defaults/flags/pre-authored settings before generation or writes, including add, dry-run and overwrite. A pre-authored configuration can specify `sourceRoot`, `stylePath`, `publicRoot`, `fontPath`, `basePath` and `alias`; omitted settings use the existing defaults. The equivalent init flags are:

```sh
./node_modules/.bin/hangyeol init \
  --source-root ui/system --style-path styles/theme.css \
  --public-root static --font-path assets/type \
  --base-path /design/ --alias @hangyeol
./node_modules/.bin/hangyeol add button
```

Init installs only the canonical theme/helper, generated font CSS, four original 400/500/600/700 WOFF2 binaries, LICENSE and provenance. Add separately collects the requested component graph. Sources are collected at package build time from canonical UI, not manually maintained copies.

The stylesheet imports Tailwind's theme and utilities separately, followed by relative theme/font imports and an explicit `@source` matching the actual configured source root. It preserves the existing host stylesheet body; it adds no Preflight, reset or global body rule. Hosts with reset imports, legacy Tailwind directives or detected global reset declarations must split those explicitly before init. Import the resulting stylesheet from the host entry yourself.

For the example above Vite uses `base: '/design/'` and `publicDir: 'static'`; font CSS URLs are `/design/assets/type/Pretendard-*.woff2`. Actual production files are copied to `dist/assets/type`. Vite resolves `@hangyeol` to `ui/system` using imported `fileURLToPath(new URL('./ui/system', import.meta.url))`; TS paths use `@hangyeol/*: ['./ui/system/*']`. Generated integration metadata preserves settings and the original host CSS body for conflict detection and explicit backed-up stylesheet replacement.

## Conservative host adapter

Existing Vite configuration is read statically and preserved. All six Vite default config filenames participate in discovery; multiple configs fail. The supported subset has imports followed by one `export default defineConfig({...})`, using the actual imported Vite binding. Base/publicDir must be matching literal strings (or the matching Vite defaults when omitted). The plugins array must contain one zero-argument call to the default imported Tailwind Vite adapter. Its pinned implementation is the reviewed plugin subset. Literal arguments do not make an arbitrary plugin safe: config/configResolved hooks can change effective base/publicDir/alias settings. Unknown/custom plugins and imports are rejected without loading their modules. React plugins are outside this subset; the installed TSX fixture builds through Vite's existing transform without requiring one. Permitted imports are Vite's `defineConfig`, Node's `fileURLToPath`, and the default Tailwind adapter.

The optional `build` value must be a static object. Only `copyPublicDir: true` and `write: true` are supported; either may be omitted to retain Vite's enabled defaults. False, null, numeric/string values and other nonboolean values are rejected before writes or npm. Disabling public asset copying would leave fonts/LICENSE/provenance absent from production output; disabling writes would produce no disk assets. Other build options, including library/SSR modes, output redirection and nested Rollup options, are outside this bounded adapter and require explicit host review. Init preserves the host configuration rather than inventing another asset strategy.

Configured aliases require the matching URL-based mapping above. String alias names use Vite's case-sensitive exact or slash-prefix matching. Intercepting ancestor/descendant mappings are rejected in either order; `@hangyeol/primitives` cannot shadow `@hangyeol`. Nonintercepting names and distinct case remain distinct. TS paths receive the same namespace checks; exact names or terminal `/*` are the supported patterns, and competing paths cannot override the generated mapping. Comments are never evidence of effective settings. String aliases that exactly match or slash-prefix-match the mandatory generated imports `tailwindcss/theme.css` or `tailwindcss/utilities.css` fail before writes/backups/metadata/npm. This rejects `tailwindcss` and either exact CSS name, while retaining unrelated names such as `tailwindcss-extra` and `tailwindcss/theme.css-extra`. Requested UI aliases still require a safe `@name` path, which cannot intercept either import through generated configuration; this restriction is not expanded.

Dynamic values, spreads, callbacks, duplicate keys, extra executable statements and unsupported options fail with an actionable diagnostic. Host scripts mentioning Vite are checked against a bounded token subset: direct `vite`, `vite build`, or `vite preview`; dev/preview can use literal `--host`, `--port`, and `--strictPort`. The exact `tsc -b &&` and `tsc -p tsconfig.json &&` prefixes are also supported for existing build compatibility. Other wrappers, shell expressions, config/base/root selectors, attached short flags and positional roots fail. This includes `-c custom.ts`, `-ccustom.ts`, `--config`, `--base`, and roots after dev/build/preview commands. Unreviewed short base forms are refused too; no general shell interpretation is claimed. Scripts and host JS are never executed during discovery. This is not an arbitrary framework/config migration engine. For alias integration, one plain JSON tsconfig is supported: no extends/references and baseUrl omitted or `.`. Existing conflicting mappings fail instead of being overwritten. Host compiler settings are preserved.

## Safety and ownership

Dry-run performs the same discovery and complete preflight, then writes nothing. Escape paths, symlinks (including root ancestry), file ancestors, reserved package/tool targets and unsafe root overlap fail before any file/dependency operation. Supported Vite config filenames and `tsconfig*.json` host targets are reserved in all user-controlled source/style/public/font path segments, including directory forms. A style path of `vite.config.js` is rejected before source/dependency writes; it cannot create CSS beside a generated `vite.config.ts`. Explicit Vite/TS files generated by init are the permitted host integration targets. Legitimate `ui/system`, `styles/theme.css`, and `static/assets/type` paths remain supported. Conflicts preserve the complete host snapshot, including package, lock and config. Unknown/duplicate/missing flags fail; flags contradicting existing settings are not silently ignored.

Repeat init is a strict byte/mtime no-op, including after add. Installed settings are bound to the recorded integration; init does not adopt changed managed roots/config. Edited canonical sources/fonts or managed stylesheets require explicit `--overwrite`, which plans backups preserving previous bytes. For stylesheet replacement, the originally recorded host body is restored and the edited stylesheet is backed up byte-for-byte; the installed regression verifies both and a subsequent strict no-op. Edited generated Vite/TS configuration requires explicit manual review/restoration, even with overwrite: init does not migrate host configuration. Existing useful host configuration is not broadly rewritten.

Dependency conflicts are diagnosed before writes. A later dependency-install failure can leave source/package/lock changes; the existing installer reports that partial state, does not destructively roll back, and records success only after installation succeeds.

## Verification boundary

Scoped source tests retain the owner's initial conflict assertion. Packed tests check executable/helper ownership and payload hashes. Installed tests use repo-external physical packages, the local bin, prepared offline cache, full byte/mtime snapshots, real alias typecheck and Vite/Tailwind build, final package/lock version/dev/resolved/integrity readback, exact font/license/provenance hashes and actual dist paths. They do not use workspace UI imports.

```sh
# Set both evidence variables to the same designated outside-repo directory.
CORE01_EVIDENCE_DIR="$CORE02_EVIDENCE_DIR" npm test --workspace=@orderthan31/hangyeol-core
# Separate actual HTTP assertion; requires permitted loopback listening.
npm run test:init:http --workspace=@orderthan31/hangyeol-core
```

The HTTP test remains a real assertion of URL/status/MIME/font bytes, separate from package/build verification. Historically, the implementation sandbox returned `EPERM` for both Vite preview and a minimal Node server. The owner subsequently reported independent prior-candidate and fix-cycle-1 runs passing all four production font URLs with status 200, MIME and byte/hash checks. Those results are distinct from the sandbox failure and do not establish correctness when public asset copying is disabled. The cycle-1 source re-review confirmed its four blockers fixed but found acceptance of `build.copyPublicDir: false`; cycle 2 records actual source and physically installed RED/GREEN regressions for that case and disabled disk writes. A subsequent independent source review found aliases able to intercept the mandatory Tailwind CSS imports. Cycle 3 records source and physical installed preflight RED/GREEN for all three alias names, full byte/mtime snapshots and zero npm calls; near-prefix and normal UI aliases remain compatible. The owner's source-only validator acceptance and separate Node 24 resolver-only probe are distinct evidence; neither is a substituted-stylesheet compiler/build result. Cycles 2 and 3 do not repeat prohibited listener attempts. Owner independent re-review, fresh-candidate runtime/HTTP and frozen verification remain pending. Browser FontFace loading is NOT RUN; copied historical font provenance is not new verification. Browser/AT/accessibility/design acceptance, independent VPS/empty-cache installation, GitHub Packages download and publication remain owner work or deferred scope. Consumer lint/token policy is unchanged and deferred beyond CORE-01 inspections.

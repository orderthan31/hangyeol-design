# @orderthan31/hangyeol-core — local candidate

This guarded installed development package owns the executable, tool router,
shared installer/safety implementation, and same-version canonical source/font
payload. It is not a runtime UI dependency. Generated UI imports local source.

First-party code and UI payload are `UNLICENSED`; no repository license grant was
found or invented. The font assets retain the copied SIL OFL 1.1 license and
original upstream provenance. See LICENSE and THIRD_PARTY_NOTICES.md. Publication
is blocked. This is not a Release download or registry quickstart.

## Candidate identity and publication safety

The current candidate is `@orderthan31/hangyeol-core@0.0.1`; npm pack emits
`orderthan31-hangyeol-core-0.0.1.tgz`. The bin remains `hangyeol`, and consumer
`src/hangyeol` / `@hangyeol` source aliases do not become npm account scopes.
Core has `private:false` only with an active fail-closed prepublish guard;
root and Docs remain private. This does not change registry visibility or licensing.
The manual-only GitHub Packages workflow defaults to validation, not publication.
Actual publication remains blocked by `publication-readiness.json` pending the
later all-component border/description and approved-brand introduction review,
and by the existing global lint failure. See the repository maintainer guide
`docs/github-packages-publishing.md`. Nothing here claims registry publication.

An unchanged previous unscoped 0.1.0-s2.1 installation can be explicitly reviewed
with `hangyeol init --migrate-from-unscoped --dry-run`, then the same command
without `--dry-run`. It only re-records fully verified byte-identical owners;
edited/missing/unknown owners fail before writes. No overwrite or general update
is supported. Metadata uses the normal backed-up installer transaction.

## Current installed-core quickstart (CORE-11)

Follow [the supported host and executable steps](../../docs/source-installation.md#core11-quickstart):
real locally packed core → exact file devDependency/physical lock/bin → local-only init/add
text-field → editable local TextField/cn/theme import and overrides → strict host tsc/Vite build.
The guide includes exact pinned dependencies and config/entry/owner-edit examples. No Release URL,
registry fallback, Packages PAT, or ephemeral CLI is an active prerequisite. Node22.22.2/npm10.9.7
and prepared offline cache/scripts-off are the bounded verification environment, not registry or
empty-cache portability proof. Installing core alone does not generate UI; UI must not import core
at runtime. Consumers own partial/replacement/added palettes and editable source; update plan/diff/
apply and source Reset remain unsupported/nonzero. Existing owner settings and input values are
not reset by read-only tools. Browser acceptance remains separate from the core/Docs build.

## Canonical ownership

`src/ui` owns reusable UI, `src/tools` owns installer/safety/host configuration and the other tools, `registry/items.json` owns the selected dependency graph, and `assets/fonts` owns unmodified fonts/licenses. There is no separate CLI/UI workspace or legacy registry output. Build/prepack copies only the declared tool/payload boundary.

```sh
npm run build -w @orderthan31/hangyeol-core
npm pack --workspace=@orderthan31/hangyeol-core --pack-destination=/your/external/artifacts
```

Install the actual emitted tarball as an exact devDependency in a supported React/Vite host. Installing core does not generate UI. Run that host's `node_modules/.bin/hangyeol init` and `add` explicitly. Defaults are `hangyeol.json`, `src/hangyeol`, `src/hangyeol.css`, and `public/fonts/hangyeol`. Editable source is never silently overwritten.



Every command first verifies package/payload/tool versions, ownership and hashes.
`inspect` checks the actual packed files. `lint inspect` retains its installed
tool inspection API and reports policy hashes, exact versions/licenses and the
grammar classifier. It does **not** run consumer lint. `tokens inspect` parses
the packed semantic CSS without writes. Plain `tokens` validates actual consumer CSS, independently of that inspection.

From the disposable host, use the physically installed bin:

```sh
./node_modules/.bin/hangyeol add text-field
./node_modules/.bin/hangyeol lint
./node_modules/.bin/hangyeol lint inspect
```

Lint reads `hangyeol.json` and recursively checks `.ts`/`.tsx` under its `sourceRoot`
(default `src/hangyeol`, configurable such as `ui/system`). Consumer examples to be
checked belong inside that root. It does not scan unrelated app `src` files,
load host ESLint/Vite/TypeScript executable configs, generate files or fix code.
Stdout is a JSON report; stderr findings use actual host-relative file, line,
column, rule and reason. Exit 0 is a complete supported check; exit 1 denotes
findings/invalid input; exit 2 denotes unsupported CLI usage or an unavailable
compiler with no policy findings. An unavailable compiler never produces a
certified unknown-class pass.

The package collects the unchanged repository slice ESLint policy and existing
custom-property supplement, plus their hashes and installed dependency LICENSE
bytes in `dist/policy`. Exact template owners alone can compose native control
styles; public variants/layout are the consumer contract. Other rules remain
enabled. Only the explicitly enumerated library owners receive composition exceptions.

Unknown utility checking calls the actual adapter-pinned host Tailwind 4.3.3
`compile/build` API with bounded CSS imports. Grammar classification by pinned
`@shadcn/lint`/`cn` is reported separately. No compiler install, grammar unknown
fallback, host `@plugin`/`@config` execution or palette override is performed.
Runtime class strings, indirect wrappers, arbitrary host CSS restyling and
browser/computed/AT behavior are outside the static check. See
`docs/core-lint-contract.md` in the authoring repository for the precise scope.
Token validation/export is described below; automatic synchronization/update and all-96 execution remain deferred.

Prepack collects canonical sources and fonts at build time and snapshots the
single shared installer; it does not maintain a second hand-authored UI copy.
Only the bin, dist tool modules/manifests, payload and licensing/docs boundary
ships. Build scripts/tests/repository sources are not needed by an installed bin.

Scoped package tests require `CORE01_EVIDENCE_DIR` to point to the authorized
external scratch directory; every temporary fixture uses that explicit parent.
CORE-07 source-built/installed lint tests separately require `CORE07_EVIDENCE_DIR`.
The installed test reads the packed artifact prerequisite from its explicit
`core01-boundary` evidence subdirectory. Prepared offline cache verification is
not empty-cache, VPS, live registry or Release-download proof. CORE-06's bounded
file recovery does not roll back node_modules or guarantee crash/hostile-race
atomicity; lint does not change those limitations.


CORE-08 uses actual consumer `hangyeol.json` sourceRoot/stylePath and optional
`tokens.source`/`tokens.palette` data. It checks typed semantic role/alias graphs
against real local CSS, preserving owner values. Use the installed local bin:

```sh
./node_modules/.bin/hangyeol tokens validate
./node_modules/.bin/hangyeol tokens presets
./node_modules/.bin/hangyeol tokens export --format json
./node_modules/.bin/hangyeol tokens export --preset Indigo --format css --output exports/indigo.css
```

Only explicit safe `--output` requests create a file; edited outputs/inputs are
never overwritten. Stdout exports are read-only and report content hashes.
Indigo/Silver/Forest/Amber/Rose are offered token designs with light/dark schemes;
New init defaults to Indigo; existing consumer values are not refreshed/reset by
the token tool. Runtime Theme accepts arbitrary palette names and explicit semantic
values, inheriting nested values and transporting scope variables to portals. Nonpreset/partial/replacement/added consumer palettes and explicit
semantic/status overrides are supported via typed data with actual CSS parity.
See `docs/core-tokens-contract.md` in the authoring repository for schema,
diagnostics, static grammar limits, P1 config no-op correction and the precise
historical failures, task-scoped generated limits, deferred update and browser Docs Reset acceptance. These are not browser/contrast/AT claims.
CORE-08 tests use `CORE08_EVIDENCE_DIR`, with a fresh packed-artifact prerequisite
in its `boundary` subdirectory; fixtures are outside the authoring repository.

CORE-08 correction: preset exports apply canonical palette-authored deltas to the
validated consumer schemes, first retaining linked authored semantic aliases/types/units
even where CSS has an equal-value literal, preserving neutral/status/custom roles and re-resolving
aliases. The preset catalog remains full standalone defaults. Nested semantic CSS
is explicitly refused with file/line diagnostics. Portal refs apply current scope
and native custom variables on actual first mount/reopen, as well as later updates;
JSDOM regression is not real browser computed-style acceptance. See the consumer
token contract for the deferred browser acceptance, bounded generated scope and ownership limits.

Portal ownership is tracked per actual DOM node across callback changes and
reattachment. Forwarded callback detach/attach or returned cleanup follows the
caller ref lifecycle; native style custom variables retain priority. The pinned
Radix regression observed missing ref notifications, while the static reviewed
stale-variable symptom did not reproduce. Browser acceptance remains pending.

Preset selection requires registered own catalog/delta entries. Unknown names
(including constructor and __proto__) fail without export writes; arbitrary
consumer-authored palettes remain editable through consumer data.

Current continuation preserves distinct authored scheme aliases in exported CSS:
shared inline expressions stay direct; differing expressions use typed scoped
export variables and dark-only selects dark. Actual compiler tests verify inline
utility references; browser acceptance is deferred, not implied. Semantic scope
selectors retain descendant/combinator structure and refuse unsupported contexts
with file/line diagnostics while allowing attribute-internal formatting.

DEC-01 defers update plan/diff/apply; unsupported preservation is not success.
DEC-02 defers browser/Playwright/computed-focus/host-isolation and six-control
Docs Reset to later design/demo, outside current implementation gates. Historical
EPERM/build failures remain evidence. Exact generated refresh is separately
content-guarded; no dependency/config/backup or generic generated-write authority.

Consumer token parsing collects typed utility namespaces in supported adjacent
semantic scopes as well as `@theme`; dark/palette overrides retain alias meaning.
Repeated theme/palette attributes fail with file/line diagnostics, including
empty palette registrations. Relative CSS imports are processed in source order
with each occurrence reported (`a,b,a` is preserved); active-stack cycles fail.
These are bounded static checks, not browser cascade validation. See
[the token contract](../../docs/core-tokens-contract.md).

Token grammar preflight checks every import ancestor before reading its target:
root and exclusively `@layer` ancestry remain supported; conditional, rule and
`@theme` imports fail with the importing file/line. `@theme` permits only empty
or literal `inline` parameters. Direct semantic declarations outside supported
scope rules/known typed `@theme` tokens fail with declaration locations; custom
`--g-*` roles stay editable in scoped rules. Host-only ordinary conditional,
nested and font CSS is preserved. No browser cascade interpretation is implied.

## Read-only installation doctor

Run `./node_modules/.bin/hangyeol doctor` in the initialized consumer. Stdout is
structured JSON with state/exit and checks containing code/status/path/cause/action;
source import findings also carry actual file lines. Exit 0 denotes supported
healthy connections (owner edits may be informational), 1 missing/invalid/unsafe
installation data or supported connection conflicts, 2 unsupported doctor/host
grammar or computed imports. Missing `hangyeol.json` is uninitialized / exit 1.
Packed boundary failures retain the router's existing error / exit 1.

Doctor checks actual configured sourceRoot/style/public/font/base/alias paths,
selected closure records, immutable font/LICENSE/provenance bytes, direct Tailwind
imports and source scan, static Vite/JSON TypeScript connections, physical core
dev pin/lock version identity and required runtime/build/type dependencies. Tool
deps/licenses remain separate from requested runtime UI. It never evaluates host
config/source modules, repairs, runs npm or writes consumer files/config/metadata.
It does not run a compiler or certify HTTP/fonts/browser/CSS cascade.

Static source checks distinguish runtime references from explicitly type-only
imports/exports, all-type named specifiers, `TSImportType` (including `typeof
import(...)`) and `import type X = require(...)`. Runtime import-equals,
side-effect imports and mixed type/value declarations still reject core/CLI
coupling with actual file/line. Reported references include `usage: "runtime"`
or `"type-only"`; both retain local path/target checks. Computed references are
unsupported, and syntax the pinned parser cannot accept is an error. This is
AST classification, not proof of type availability, type-checking or emitted
runtime code under arbitrary TypeScript/bundler settings.

Editable local `lib/cn.ts` still composes clsx/tailwind-merge and the existing
semantic utility conflict groups; generated UI has no core runtime import.
Changed helper/theme/source bytes are informational, not automatic corruption
or an excuse to reset values/adopt hashes. Owner config/token/palette fields and
serialization are preserved. Unsafe paths/symlinks and malformed version/record
data fail safely. See `docs/core-tools-contract.md` in the authoring repository
for diagnostics, bounded grammar, and deferred update/browser/generated gates.

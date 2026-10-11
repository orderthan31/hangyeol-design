# Installed tools and editable local runtime

CORE09 adds a read-only installation doctor. It does not repair, run npm, execute
host configuration/source modules, synchronize templates, or implement update.
Use the physically installed development package and its local executable:

```sh
npm install --offline --ignore-scripts --save-dev --save-exact ../scratch/orderthan31-hangyeol-core-0.0.1.tgz
./node_modules/.bin/hangyeol --version
./node_modules/.bin/hangyeol doctor
```

The filename must come from an actual local pack. This guarded `UNLICENSED`
candidate is not a registry/Release quickstart or a public license grant.
Installing the tool generates no UI; `init` and `add` remain explicit operations.
Prepared-cache installation evidence does not prove empty-cache/VPS portability.

## Doctor data and exit contract

`doctor` accepts no options. Every command first opens the existing core boundary:
package/payload/tool versions and packed source/asset/tool hashes must match.
A boundary failure remains the router's truthful `HANGYEOL CORE ERROR` / exit 1;
it is not converted into a successful structured consumer diagnosis.

After the boundary opens, stdout is JSON:

```json
{
  "operation": "doctor",
  "readOnly": true,
  "status": "ok",
  "exit": 0,
  "package": {"name": "@orderthan31/hangyeol-core", "version": "0.0.1", "integrity": "verified"},
  "config": {"sourceRoot": "ui/system", "stylePath": "styles/theme.css", "publicRoot": "static", "fontPath": "assets/type", "basePath": "/design/", "alias": "@hangyeol"},
  "capabilities": {"repair": false, "update": false},
  "checks": []
}
```

The illustrative empty checks array is replaced by actual checks with `code`,
`status`, host-relative `path`, `cause`, and `action`; import findings also carry
an actual source `line`. Stderr lists error/unsupported checks. `dependencies`
separates required UI runtime, build and type packages from installed core tool
versions/licenses. `coverage` reports the actual configured TS/TSX root and static
AST import count. Neither count is browser/bundler instrumentation.

| State | Exit | Meaning / example |
| --- | --- | --- |
| `ok` | 0 | Required supported records/files/connections exist. Local edits can have `info` checks. |
| `uninitialized` | 1 | `hangyeol.json: [config.missing] Consumer is not initialized.` Review prerequisites and explicitly run local-bin init. |
| `error` | 1 | Missing/malformed/unsafe data, incompatible versions, missing files/assets/dependencies, or conflicting supported connections. |
| `unsupported` | 2 | Unsupported doctor options, host script/Vite grammar, or computed source import cannot be certified. Errors take precedence when both occur. |

Example checks include `source.missing` at `ui/system/lib/cn.ts`, `asset.missing`
at `static/assets/type/Pretendard-Regular.woff2`, `record.missing` / `record.invalid`,
`version.config`, `core.dev-pin` / `core.identity`, `dependency.declared` /
`dependency.version` / `dependency.lock`, and `connection.stylesheet`,
`connection.source`, `connection.fonts`, `connection.vite`, `connection.typescript`.
A forbidden runtime import produces `source.core-runtime` with the actual
consumer file and line. Missing literal local imports produce
`source.import.missing`; escaping imports produce `source.import.outside`.

## Checked connections and supported input

Doctor reads `hangyeol.json` as JSON data: schema 1, configured source/style/public/
font paths, root-relative same-origin base, literal alias, component names and
installed version/hash records. Unknown owner/token/palette fields are retained,
not evaluated. Integration checks compare only the known path/alias settings;
extra owner settings do not invalidate a healthy installation.

Paths are checked before target reads. Traversal, absolute/backslash/dot/empty
segments, reserved generated roots and symlinks (including dangling links and
root ancestry) are rejected through the shared path guard. Unsafe configuration
values/unrecognized record targets are not echoed as outside paths and their
contents are not read. Only recognized managed targets are inspected. Root cwd
is the OS-provided current directory; this is not a hostile-race filesystem or
logical symlink-invocation authentication mechanism.

Required managed UI targets come from the existing selected component closure
and common `foundation/theme.css` / `lib/cn.ts`. Assets remain the four immutable
Pretendard 400/500/600/700 woff2 files plus existing LICENSE/provenance. Asset byte
hash checks and font CSS declaration checks are separate: a valid URL declaration
does not make a missing font file healthy. Font URLs must match actual configured
`basePath + fontPath`; public file paths must match `publicRoot + fontPath`.
This checks URL strings/file bytes, not HTTP serving, MIME, FontFace or rendering.

The configured stylesheet requires direct literal Tailwind theme/utilities and
relative local theme/fonts imports, plus a direct literal `@source` for the actual
configured sourceRoot. Legacy/preflight/reset imports are diagnosed. Existing
host stylesheet body is read and retained. Doctor does not promise a general
cascade/reset detector, load CSS plugins/config modules, or invoke a compiler.
Use `lint` / `tokens` for their separately documented static/compiler contracts.

One Vite config is read using the existing static adapter (literal base/publicDir,
reviewed zero-argument Tailwind plugin, explicit alias and bounded build options).
Unsupported/dynamic JS is reported without execution; unsupported does not mean
consumer source is corrupt. The current adapter does not inspect custom plugin
hooks. TypeScript alias connection requires the current plain JSON tsconfig
subset, with no extends/references; non-verifiable paths get an actionable
nonzero diagnosis. Host Vite scripts use the existing bounded direct command
validator; no script is run.

Core must be a pinned devDependency with physical package/version and lock
identity, not a runtime dependency/workspace link. Doctor checks declared,
physical metadata and lock versions for required runtime/build/type packages;
exact manifest pins and React 19 remain the adapter contract. Core tool deps are
reported separately with actual versions/licenses. No dependency install or
rollback is claimed. Lock SRI/package self-consistency is not signed archive
provenance or proof of a registry download.

Static `.ts`/`.tsx` scanning covers the configured editable root (1–1000 files,
regular inspected files at most 2 MB), including owner additions. Literal
import/re-export/import()/require() specifiers are inspected without running
source. Local TS/TSX/CSS targets must stay in the root. Core/legacy CLI imports are
forbidden for runtime references; computed module targets return unsupported. Indirect bundler rewrites,
custom resolver effects and every possible runtime code-generation technique are
not certified. Other commands retain their own independent checks.

`source.runtime-separation.imports` reports each accepted reference's file, line,
local/external `kind`, and `usage` (`runtime` or `type-only`). Declaration-level
`import type` / `export type`, nonempty lists of exclusively type-marked named
specifiers, `TSImportType` (also inside `typeof import(...)`), and type-only TS
import-equals do not establish runtime core/CLI coupling. A mixed type/value
list, side-effect/empty import, runtime export-star, runtime import-equals or
literal runtime `import()` / `require()` still rejects core/CLI references with
`source.core-runtime` / exit 1 at the actual consumer file/line.

Type-only references remain inspected: literal local paths must stay in the
configured sourceRoot and have supported targets; computed references return
`source.import.dynamic` / exit 2, including computed import types. The pinned
parser accepts only string literals in TS external import-equals; invalid
computed syntax there returns `source.parse` / exit 1. Accepted external type
references are not a guarantee that the package exposes those types. Doctor
does not resolve type declarations, type-check symbols or certify emitted JS
under arbitrary compiler flags. Run the consumer compiler/build separately.

## Editable cn and source ownership

`cn` is copied editable local `lib/cn.ts`, using `clsx@2.1.1` and
`tailwind-merge@3.7.0`. Existing semantic font-size/radius/padding conflict groups
and public `ClassValue` composition behavior remain unchanged. UI modules import
this local helper and the required React/Radix dependencies, never installed core
runtime code. `@orderthan31/hangyeol-core` owns development tools/installer/payload, not the
consumer UI implementation.

A changed source/helper/theme hash gives `source.edited` / `info`, not automatic
corruption. Doctor does not overwrite edits, refresh/adopt installed hashes,
reserialize config, touch package/lock/assets, create backups or call npm.
Healthy edited semantics/custom palettes remain owner values. Syntax/import/
connection errors may still need explicit review; editability is not a claim
that every edit is valid. Existing init/add conflicts, strict no-op, common-source
preservation, explicit overwrite backups and transaction recovery remain their
original contracts. Doctor offers no repair or update success path.

DEC01 update/diff/apply remains unimplemented. DEC02 browser/focus/computed/Docs
Reset remains deferred; Docs Reset means example state/props Live/current Code,
not source/token reinstall. DEC03 authoring generated docs/default-build guard
constraints remain separate; stale authoring docs do not by themselves make an
independent consumer unhealthy. No browser, preview, source Reset or deployment
operation is part of doctor.

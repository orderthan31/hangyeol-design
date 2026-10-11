# Installed consumer lint contract

CORE-07 activates `./node_modules/.bin/hangyeol lint` in an initialized physical
consumer. `lint inspect` remains inspection-only and keeps its dependency array
API. No consumer runtime imports core. The non-executing selector parser is a
pinned tooling dependency; core and first-party policy remain guarded/UNLICENSED.

## Scope and ownership

`hangyeol.json` schema 1 supplies `sourceRoot`, `stylePath`, optional `alias` and the
original install records. Lint recursively reads `.ts`/`.tsx` inside that root,
including consumer examples added there. It uses no repository authoring globs
and does not scan unrelated default app `src`. An empty source scan fails.
Traversal, absolute/backslash/dot/empty segments and symlinks (including dangling
children) are rejected. Dependency, Git, backup and transaction roots are reserved.
Nested real directories named `node_modules`, `.git`, `.hangyeol-backups` or
`.hangyeol-transactions` (case-insensitive) are excluded during recursion before
reading their contents. Symlinks remain rejected rather than silently followed.
Relative component imports must stay in sourceRoot; configured alias imports
must have canonical safe segments. The configured compiler stylesheet's relative
imports remain host-bounded. Module-imported CSS discovery is more restrictive:
every stylesheet must remain inside sourceRoot. Symlinks and outside-boundary
paths are refused. Host configuration files are not rewritten or executed.

Direct relative imports and the configured alias of canonical primitives,
components and foundation modules establish component identity, including named
aliases and namespace use. A component import count is wrapper AST recognition,
not plugin-internal visit instrumentation. Indirect wrappers/re-export chains,
other alias systems and runtime-generated class strings are not certified.

Only exact owner filenames enumerated by the existing slice policy, with matching
original payload version/template hash records in `hangyeol.json`, receive the
existing `no-restyle` composition exception. Those records identify the template,
not the current editable source hash or an authenticated authorization grant.
Edited native component owners stay editable. The remaining rules continue to
run, including raw colors, arbitrary values, inline styles and static classes.
No broad directory exception or consumer `customization.tsx` exception exists.
The copied custom-property supplement has one exact installed input contract:
`components/brand-mark.tsx` may supply `--hangyeol-brand-mask` only when both that
source and its imported `components/brand-mark.css` still match their canonical
payload bytes and original install version/hash records. Editing either file,
removing its record/import, or using the same property in another file loses that
contract. The source contract is separate from the editable composition-owner
exception above. CSS `var(--*)` references never create ownership; in particular,
referencing a semantic `--g-*` token never authorizes an inline override of it.
Theme values remain editable in the owning stylesheet; no palette whitelist,
Preflight/reset or consumer stylesheet rewrite is introduced by lint.

## Policy and compiler boundary

Build collects the unchanged `scripts/slice-eslint-policy.mjs` and
`scripts/design-jsx-policy.mjs` into `dist/policy`, records their hashes and includes
actual dependency LICENSE bytes. The normal packed integrity check covers these
files and all generated discovery metadata. Policy pins remain:

| Dependency | Version | Actual package license |
| --- | --- | --- |
| @shadcn/lint | 0.2.0 | MIT |
| @typescript-eslint/parser | 8.71.1 | MIT |
| eslint | 9.39.5 | MIT |
| postcss | 8.5.28 | MIT |
| postcss-selector-parser | 7.1.6 | MIT |
| cn, shadcn's grammar dependency | 0.3.2 | MIT |

Internal `dist/policy/components.json` and `tsconfig.json` are hashed read-only
discovery descriptors for the third-party grammar. They point only to the real
packed canonical UI/theme and prevent upward host project/theme discovery.
They are not consumer framework configuration or a claim of Tailwind compiler
execution. Core and shadcn must resolve the same pinned grammar dependency;
conflicting host grammar resolution fails closed. Host ESLint configuration,
Vite plugins and arbitrary TypeScript/config modules are not evaluated.

Actual unknown utility checking separately resolves the host's physical
`node_modules/tailwindcss` version 4.3.3 and calls its `compile`/`build` API against
the configured stylesheet and bounded relative CSS imports. Only the mandatory
`tailwindcss/theme.css` and `tailwindcss/utilities.css` package imports are supported;
there is no implicit Preflight import. Host CSS `@plugin`/`@config` module execution
is refused. The grammar's discovery policy uses the installed canonical theme.
Exact static color/type candidates declared in the consumer's own `@theme` CSS
are bridged to that policy using PostCSS declarations from the bounded compiler
inputs. Default package palette declarations are excluded from this bridge; no
fixed palette whitelist or broad class exception is added. The actual compiler
separately checks that those utilities generate. Component override rules remain
enabled and semantic variables still belong in the owning stylesheet.

The JSON report distinguishes `compiler.mode: "actual"` from `"unavailable"`,
includes the actual compiler package/version/license and CSS dependencies, and
reports `fallback: "none"`. Missing or mismatched compiler dependencies and
unsupported CSS module/config imports produce a nonzero incomplete result;
grammar classification is never presented as compiler validation. Lint installs
no dependency. A consumer must resolve setup explicitly using its owned package
settings rather than an automatic online fallback.

Static utility extraction covers literal className, literal/conditional/logical
`cn` arguments and the **values**, not property keys or TypeScript type literals,
of canonical `variants`/`sizes` tables. Logical expressions
conservatively inspect both literal operands (not runtime reachability), including
literal-left `||` and `??`; unused literal branches can therefore also be flagged.
Exact `group`/`peer` marker roles and named markers with ASCII word/hyphen names
are recognized separately because they do not emit standalone declarations;
variant-used marker utilities still require generated CSS. Prefix lookalikes are
not exempt. It reports unknown candidates
at their real consumer file/line. It does not prove opaque runtime strings,
arbitrary external class tables, plain CSS restyling, runtime CSSOM, computed theme,
browser keyboard/focus or AT conformance. Custom-property analysis retains the
existing static object/const/spread/computed-key limits.

## Imported CSS presence is not a policy exemption

Each TS/TSX module gets only selectors from its own static CSS imports and their
local CSS import graph; another module's imports do not populate a global class
allowlist. Imports may be relative or use the configured alias. PostCSS parses
stylesheets and postcss-selector-parser parses selectors, including escaped class
names, state selectors and media/supports/layer/container grouping rules. Strings,
comments, attribute values, keyframes and classes occurring only inside `:not()`
are not positive class evidence. Unknown candidates require either that real
module-local selector evidence or the actual compiler's generated utility.

CSS import discovery supports plain quoted strings and `url(...)` imports.
Conditional import suffixes are explicitly unsupported; put media/supports rules
in the imported stylesheet. Escaped or percent-encoded import paths, query/hash
suffixes, remote/data/package imports, type-only imports, missing files, reserved
directories, invalid import positions and symlinks are refused. `@plugin`,
`@config` and `@reference` are not executed or used for host discovery. Graphs are
bounded to 128 unique files, 32 import edges in depth, 1 MiB per stylesheet and
8 MiB per module; cycles are visited once. Unsupported syntax fails closed.

This only fixes class **presence** checking. It does not disable no-restyle,
no-raw-colors, no-arbitrary-values, no-inline-styles or the custom-property rule.
Misspellings, absent imports and unrelated consumer classes still fail. A missing
or mismatched actual Tailwind compiler remains incomplete even if every class has
CSS evidence. Reports expose `cssSources` per module and `inlinePropertyOwners`.

## Invocation and output

After locally packing and physically installing the actual emitted private
tarball as an exact devDependency, run only the consumer's local bin:

```sh
./node_modules/.bin/hangyeol init --source-root ui/system --style-path styles/theme.css
./node_modules/.bin/hangyeol add text-field
./node_modules/.bin/hangyeol lint
./node_modules/.bin/hangyeol lint inspect
```

Use the existing config on repeat; changed init flags are not adopted. Stdout is
JSON and stderr contains `file:line:column rule: reason`. For an example under
`ui/system/examples/case.tsx`, prohibited `p-[13px]` yields
`shadcn/no-arbitrary-values`, an invented `hangyeol-not-a-real-utility` yields
`core/unknown-class: Unknown Tailwind utility: hangyeol-not-a-real-utility`, and
`<Button className="p-8 rounded-full">` yields `shadcn/no-restyle`. Inline semantic
token overrides yield `ds/no-unowned-custom-properties`. The line and column are
taken from the actual file, not a replicated fixture path.

Exit 0 means no findings with an actual supported compiler; exit 1 means policy,
parse or unsafe-input findings; exit 2 means unsupported CLI usage or incomplete
compiler checking without policy findings. Read-only before/after snapshots cover
source/config/package/lock/node_modules bytes, inode, mode and modification time.
Expected negative CLI exit 1 is not a failing test suite.

## Verification boundary

`lint-source.test.mjs` tests canonical source-built modules after core build; it is
not physical installed proof. `installed-lint.test.mjs` uses a genuine offline
exact-dev tarball installation and that host's physical local bin. It checks custom
roots, normal Button/TextField, relative/alias/namespace overrides, arbitrary/unknown
classes, raw colors, inline/custom-property overrides, source/config safety,
read-only snapshots, blocked executable CSS imports, outside-host theme discovery,
policy tampering, policy/license payload hashes and final lock integrity.
`lint-css-source.test.mjs` additionally exercises real imported owner selectors,
variant keys, CSS graph/path/size boundaries, exact canonical mask ownership,
non-transferable semantic ownership and unchanged negative design policies.
`installed-css-discovery.test.mjs` repeats positive/negative fixtures through an
already physically installed selected-owner consumer, explicitly selected with
`HANGYEOL_CSS_INSTALLED_HOST`. The older source fixture defaults to its original
offline npm preparation; when registry metadata for the pinned compiler is
unavailable, `HANGYEOL_TEST_TAILWIND_ROOT` explicitly selects a physical prepared
Tailwind 4.3.3 directory to copy and exercise. This test-only mode records its
provenance, retains every assertion and is not an automatic compiler fallback or
an empty-cache/registry portability claim.

The original deferred-lint assertion in `installed-core.test.mjs` is replaced with
actual successful lint; token-deferred and all other prior assertions remain.
Prepared cache results do not establish empty-cache, registry, VPS or Release
portability. No browser/full-flow/sprint certification is claimed. CORE-06's
node_modules, external child effects, crash/power-loss and hostile-race recovery
limits remain. Owner independent review, frozen-SHA checks, Git sharing and PM
acceptance are separate.

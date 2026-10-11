# Installed consumer tokens (CORE-08)

Use the physically installed local `node_modules/.bin/hangyeol`. These commands
require `hangyeol.json`; they never execute host JavaScript configuration or install
anything. `tokens inspect` retains read-only inspection of the packed canonical
CSS. It is not consumer validation. Plain `tokens` and `tokens validate` inspect
actual consumer files using `sourceRoot` and `stylePath` from that configuration.

```sh
./node_modules/.bin/hangyeol tokens validate
./node_modules/.bin/hangyeol tokens presets
./node_modules/.bin/hangyeol tokens export --format json
./node_modules/.bin/hangyeol tokens export --format css
./node_modules/.bin/hangyeol tokens export --preset Indigo --format css --output exports/indigo.css
```

Stdout holds validation JSON or exported JSON/CSS. Stdout exports are read-only;
their SHA256/byte count appears on stderr. `--output` explicitly requests one new
file. Existing edited files conflict; identical bytes are a strict no-op. There
is no overwrite/reset switch. Inputs, configured source/public roots, host
package metadata/hangyeol.json, existing conflicting host files, traversal, absolute paths, backslashes and symlink paths
are refused before output writes. Output uses the shared bounded transaction
implementation. CORE-06's crash/power-loss, hostile race and external dependency
side-effect limitations remain. No npm child is invoked by tokens.

Validation/export never refresh install-record hashes or adopt consumer edits as
canonical templates. Consumer config/source/theme/helper/fonts and unrelated
host files remain owned by the consumer. Command errors are exit 1; unsupported
command syntax is exit 2. Successful supported validation/export is exit 0.
Diagnostics identify the actual stylesheet/semantic input and role/scheme, for
example `styles/theme.css (consumer/light): missing role --g-surface`,
`alias cycle --g-surface -> --g-ink -> --g-surface`, `type mismatch`,
`missing alias target` or `CSS/source parity mismatch`. Errors preserve bytes,
inodes, mtimes, modes and links (complete fixture snapshots include node_modules).

## Actual CSS input and typed semantic source

`stylePath` must import the local installed semantic theme. The static import
reader follows bounded relative CSS imports within the host, refuses symlinks,
cycles and external/unknown package imports, and recognizes only the two
mandatory `tailwindcss/theme.css` and `tailwindcss/utilities.css` package imports.
Repeated relative imports contribute declarations again at their position (`a,b,a`
retains the final `a`). The reported inputs list records each occurrence and hash;
only a path already on the active import stack is a cycle.
Import placement is validated across the full AST before targets are read, even
inside otherwise unrelated host subtrees. Only stylesheet-root imports or
imports with exclusively `@layer` ancestors are supported. Relative root imports,
`layer(name)` import annotations and enclosing/nested `@layer` arrangements retain
source order. Imports under `@media`, `@supports`, other non-layer at-rules,
ordinary rules or `@theme` are refused at the importing file/line, even when the
target is missing. A layer nested inside a conditional does not remove that
unsupported ancestor. This is the existing bounded layer arrangement, not
browser layer priority evaluation.
It does not load those package defaults as consumer-owned semantic values.
`@plugin`/`@config` are not executed. Font registration/ordinary host rules are
preserved and are not semantic validation targets.

The supported semantic selectors are a single adjacent compound `[data-hangyeol]` with optional literal
`data-theme="light"|"dark"` and `data-palette="Name"` attributes, in source order. Whitespace inside an attribute (for example `[ data-theme = "dark" ]`)
is formatting; whitespace between attributes, including tabs/newlines, is a
descendant combinator and is rejected with actual file/line/structure diagnostics.
Child/sibling combinators are also unsupported; ordinary unrelated host rules remain
outside semantic validation. Each theme/palette attribute may appear only once
per compound, even if repeated values match; repeats are file/line errors. Empty
palette registrations use the same structure/duplicate checks and permit the same
attribute-internal formatting.
Only empty `@theme` parameters and the single literal `inline` are supported,
including enclosing `@layer`. `reference`, `static`, `default`, combinations and
other params are explicit file/line errors; support for those Tailwind modes is
not claimed. Direct semantic declarations require a supported scope rule or a
known typed `@theme` token. Semantic declarations directly at stylesheet root,
in a layer body or another non-rule location are rejected at the declaration
line. Custom `--g-*` roles remain supported inside scoped rules; unknown custom
`--g-*` entries in `@theme` are refused rather than silently omitted. Ordinary
host-only conditional/nested rules and font registrations remain accepted. Nested semantic rules (including CSS nesting `&` inside a scope or a semantic
`@theme`) and conditional semantic `@media`/`@supports`, arbitrary selectors and
`!important` are rejected with actual file/line diagnostics:
this tool does not pretend to calculate browser cascade. Light and dark are
separate schemes. A selected CSS-only palette must actually be declared; unknown
names are errors, never silent default fallback.

Twelve required color roles are `--g-canvas`, `--g-surface`, `--g-muted`,
`--g-line`, `--g-ink`, `--g-soft`, `--g-action`, `--g-action-hover`,
`--g-on-action`, `--g-focus`, `--g-danger` and `--g-overlay`.
Other color/font/type/radius/spacing tokens use `--color-*`, `--font-*`,
`--text-*`, `--radius-*` and `--spacing-*` namespaces in `@theme` or supported
scoped semantic rules. Scoped namespace overrides contribute to that scheme,
including aliases from required roles to utility tokens. Namespace-only semantic
rules have the same selector/nesting checks; unsupported placement is an error
with file/line, not a silently ignored override. Required roles
and namespaces establish types; a complete `var(--name)` is a typed alias.
Missing targets, cycles, incompatible types and missing required roles fail.

An optional actual semantic source is selected by `hangyeol.json`:

```json
{"schemaVersion":1,"sourceRoot":"ui/system","stylePath":"styles/theme.css","tokens":{"source":"ui/system/foundation/tokens.json","palette":"Owner"}}
```

The source is consumer-authored JSON, not generated by init or an isolated JSON
validation pass. Both schemes of the selected palette must resolve to the same
exact values/types as the actual configured CSS. A JSON input that disagrees with
CSS fails. `--source`/`--palette` provide read-only per-command selection.

```json
{
  "schemaVersion": 1,
  "palettes": {
    "Owner": {
      "extends": "Forest",
      "light": {"--g-danger":{"$type":"color","$value":"rebeccapurple"},"--g-focus":{"$type":"color","$value":"{--g-danger}"}},
      "dark": {"--g-danger":{"$type":"color","$value":"oklch(80% 0.1 310)"},"--g-focus":{"$type":"color","$value":"{--g-danger}"}}
    }
  }
}
```

This example also requires corresponding consumer CSS declarations; the tool
will not write them. Additional palettes can extend offered or consumer palettes.
Omitted `extends` uses Indigo defaults **only for unspecified values**. Explicit
`replacement:true` disables inheritance/defaults and requires the full role set
in each scheme. It cannot also specify `extends`. Explicit semantic/status values
are allowed; no immutable danger/action palette or HEX-only value list is imposed.
Palette inheritance and token aliases have independent cycle checks. Child
overrides re-resolve inherited aliases against the child's values.

Supported `$type` values are `color`, `dimension`, `number`, `fontFamily` and
`string`. Extra typed tokens use the matching CSS namespaces for parity.
`{"$type":"dimension","$value":1.25,"unit":"rem"}` exports the exact numeric
source, unit, type and resolved `1.25rem`. Aliases preserve their source/target,
type and resolved value, and cannot append a new unit. CSS retains the source
literal; comparison is exact, not lossy color/unit normalization.

## Presets and consumption boundary

`tokens presets` offers newly designed Indigo (token catalog default), Silver,
Forest, Amber and Rose values with separate light/dark schemes. Their values are
read from hashed canonical CSS in the actual packed payload. Shared quiet neutral surfaces/status roles inherit the consumer scheme;
action/focus accents vary.
These are designs, not contrast/browser/AT evidence. The catalog retains full standalone schemes for inspection and semantic-source
defaults. A preset export first validates existing consumer CSS and any linked semantic source.
The validated authored semantic roles are layered onto CSS roles before applying only
the declarations authored in that palette/scheme patch to current consumer roles.
An equal-value CSS literal does not erase a linked authored alias: JSON retains its
sourceValue/alias and CSS exports var(--target) in each scheme. Editing the target
in a separate exported stylesheet therefore changes the alias resolution.
With the offered CSS these are accent/focus declarations; consumer neutral/status
values, aliases outside the patch and custom roles remain intact. Utility aliases
are re-resolved against the selected result. Indigo's empty patch preserves current
values; unspecified standalone defaults still come from the full Indigo catalog.
JSON/CSS exports do not silently reset neutral/status values or write input CSS. Consumer replacements/nonpreset palettes and
added palettes do not have to match the five named presets.

`--scheme light|dark` selects one exported scheme; omission exports both.
`--preset Name` selects a registered own catalog/delta entry; unknown names,
including `constructor` and `__proto__`, fail before writing an output. This is
not a restriction on consumer-authored palette names. `--palette Name` selects actual
consumer data. JSON exports re-resolve utility aliases after selection. CSS
exports preserve aliases using `var(...)`, emit real top-level `@theme inline`
and scoped variables only, and contain no reset/body/HTML rewrite. If a theme
utility has different light/dark expressions, an export-only typed
`--g-export-color-*` (or corresponding font/text/radius/spacing namespace) bridge
carries each scheme expression in its scope; the inline utility references that
bridge. Existing role names are checked to avoid bridge collisions. Shared
expressions remain direct, while a dark-only export selects the dark expression.
This retains authored target/edit meaning rather than flattening resolved color.
Source/physical regressions use actual Tailwind 4.3.3 compile/build to confirm the
utility references the scoped bridge; this is not computed browser acceptance. To consume an
explicit preset export, import that file in the consumer stylesheet/application
and mount `data-hangyeol`, `data-palette="Indigo"` and `data-theme="light"|"dark"`.
No runtime UI import from core is required. Physical fixtures build local
Button/TextField and exported preset CSS using actual pinned TypeScript/Vite.
This compilation is not a computed-style or focus/portal browser test.

P1/P2 continuation connects runtime consumption. New init's unspecified default is
Indigo/light from the same canonical CSS used by the token catalog. Theme accepts
`mode`, arbitrary `palette` strings and `values` (custom-property name/value map).
No palette-name or HEX whitelist applies to the runtime API. Missing mode/palette
inherit the nearest Theme, with Indigo/light at the root. Explicit values and
native custom-property styles override preset defaults and inherit through nested
Themes; a nested explicit value overrides its parent. Neutral/status roles remain
editable in the consumer's scheme CSS, while offered palettes override accent roles.
Entire replacement and extra palette selectors remain consumer-owned CSS/data.

```tsx
<Theme mode="dark" palette="Ocean" values={{'--g-surface':'#123456','--g-ink':'#fedcba','--g-danger':'rebeccapurple'}}>
  <Theme>{/* inherits the explicit semantic values and palette */}</Theme>
</Theme>
```

The original `useTheme()` still returns the mode string. The scope captures real
computed `--g-*` values after render/root attribute changes and transports them to
Select/Dialog body/in-modal portals through custom-property refs. The ref applies
the latest scope/native custom-property overrides when Radix actually mounts a node,
as well as on later scope renders. First open and close/reopen need no owner rerender. Variable ownership is tracked
per actual DOM node across ref reattachments. A changed forwarded callback receives
the previous detach and new attach (or its returned cleanup), including when Radix
stabilizes the DOM ref. Caller custom variables take priority; removed scope/own
variables are cleared while ordinary native style remains forwarded. It does not
modify an Input value/selection/focus, replace its node, add a competing focus engine
or rewrite global host CSS. Ordinary native style/ref props remain on their actual
elements. Inline dynamic ordinary-style merging was rejected by existing policy;
the implementation now transports only custom properties and leaves native style
forwarding unchanged. No lint rules/exceptions were changed. Arbitrary external
stylesheet/CSSOM mutations that cause no scope render/attribute change are not an
automatic global observation/update engine.

P1 preserves original config bytes when computed metadata is deeply equal to the
parsed previous config, including unknown fields/token settings and property order.
This is not an early return: source changes, dependencies, conflict/backup handling
and the managed transaction still run. True metadata changes still write and back up
prior config (source and physical Button-add fixtures verify exact minified backup
bytes and required new records); consumer edits are not adopted as new canonical hashes. Old physical
RED and new physical GREEN retain the exact snapshot no-op assertion. Missing
required dependencies still trigger npm and expose failure/recovery honestly.

The previous browser prerequisite attempt returned loopback `EPERM` before Chrome
launch; this failure remains recorded. Browser/E2E/Playwright/computed focus, portal
cascade, host isolation, fonts and six-control Docs Reset are deferred by DEC-02
to the later design/demo stage and are not current CORE-08 implementation gates.
No listener/browser attempt or permission change was made in this continuation.
JSDOM covers first open/reopen, callback refs/styles, custom variables and native
Input identity/value/observed selection; it is not browser proof. The reviewed
stale-variable symptom did not reproduce under pinned Radix Presence; missing
forwarded callback detach/attach was the actual observed RED and remains fixed.

Docs Reset means existing ExampleWorkbench example state/props and Live/current
Code correspondence, not source/token reinstall. Apps/docs App/generator source
remain read-only. The narrow existing Input/Code JSDOM regression is separate from
the deferred six-control browser acceptance.

A separately authorized exact generated-path refresh has a write-time content
guard and precomputed docs config/style/font diffs. Root build:slice's earlier
protected-manifest failure remains historical evidence. Any new run is reported
separately. Root/docs dependency metadata, host configs and runtime-stamped
backups/journals outside that exact scope are not authorized; a constrained
generator stage can remain deferred while core token/pack verification continues.
No general generated-output or overwrite/reset authority is implied.

### Read-only future update map (no update implementation)

Current installed records hold path, version and original template hash. Payload
source/manifest holds the currently installed package's canonical bytes. There is
no persisted old-base byte history in a consumer just from those hashes; backups
can contain edited consumer files rather than canonical base. The original locally
packed candidate preserves actual old bytes/version externally for this review.
Old and new candidates retain the same authorized version but have different
source hashes, so version alone cannot identify an unambiguous base.

| Input | Actual availability | Selection constraint |
| --- | --- | --- |
| Old base | archived actual old tarball/manifest, or explicitly supplied trusted bytes | path/hash/version must match the recorded original; missing or multiple candidates must stop |
| Current local | editable consumer source from safe configured roots | no unowned path/symlink adoption; preserve edits and settings |
| Requested new | explicitly supplied locally installed/packed canonical payload | identify exact payload/source hash, not merely equal version |
| Proposed diff/conflicts | not implemented | three hashes are not a three-way text diff/merge |

Current `update` remains an explicit unsupported, byte-preserving error. Old-base
common record mismatch causes current add to fail closed before writes/npm; it is
not update-success. DEC-01 defers that original acceptance; preserving an unsupported error is not
implemented update success. A later separately scoped **read-only** plan/diff/conflict tool
would need safe base selection, actual base/current/new text bytes, structured diffs,
conflict provenance and tests for missing/ambiguous bases. No apply/write engine,
auto-download, migration, hidden source refresh or update command was added here.

## Evidence and limitations

The implementation uses exact existing PostCSS 8.5.28 (MIT); package dependency
pins, license/guarded UNLICENSED boundary and legacy 107 identifiers are unchanged.
PostCSS parses consumer CSS; the token policy performs bounded static type/value
syntax and alias graph checks. It does **not** call a CSS/browser value evaluator
or Tailwind compiler. Color-function internals, all named color validity, unusual
units, relative-color computation, dynamic variables, selectors and runtime
cascade are not certified. A grammar pass is not an actual compiler pass.
Separate unchanged CORE-07 lint fixtures call actual host Tailwind compile/build
and label grammar classification/unavailable compiler honestly.

Tests use source-built tools and separate fresh tarball physical npm installation
with a prepared offline cache. Physical core/bin/version/dev pin/SHA512 lock and
SHA256 artifact, positive/custom/negative diagnostics, export content hashes,
read-only snapshots and npm guard traces are recorded externally. No empty-cache,
VPS, live registry or Release download/publication proof is claimed. Owner
independent review/frozen verification/PM approval and Git remain separate.

# Historical CORE-01 package checkpoint

Current identity: `@orderthan31/hangyeol-core@0.0.1`, guarded and UNLICENSED. The unscoped commands and private flag below are historical only; use the current core README and GitHub Packages maintainer guide.

This historical checkpoint describes the original introduction of core, not the current workspace topology or tool feature set. Current ownership, commands, and supported tools are documented in [the core README](../packages/core/README.md). The current collector has one core owner and no legacy CLI/registry output.

# S2 CORE-01: installed core package boundary

CORE-01 adds private `hangyeol-core@0.1.0-s2.1` to the existing workspace. It does
not rename the root repository/package or remove the legacy CLI. Hyena owns all
Git operations, task closure, external documentation and review messaging.
Canonical UI, prior dirty work and AGENTS remain untouched.

The actual executable is `bin/hangyeol.mjs`, installed as
`node_modules/.bin/hangyeol`. It routes to packed modules under `dist/`, not to
repository scripts. Build/prepack collects the canonical UI registry/font payload
for this package's own version. The collector still defaults to the legacy CLI
version/location and retains its existing registry/docs-generation behavior.
Only explicit core collection selects the core package/version; it does not
rewrite the legacy registry manifest.

`packages/core/src/tools/installer.mjs` is the single shared installer implementation.
The legacy `hangyeol` entry and new core router call it with their own payload roots.
Core snapshots that implementation and unchanged safety code during build. This
is not a folder rename or an installed module that reaches back into authoring
source. Successful core init/add metadata identifies `hangyeol-core` and its
payload version. Generated UI stays local source and imports no core runtime.

## Local installation and ownership

Build and inspect the candidate from the authoring workspace:

```sh
npm run build --workspace=hangyeol-core
npm pack --dry-run --json --workspace=hangyeol-core
npm pack --workspace=hangyeol-core --pack-destination=../scratch
```

Install the actual emitted tarball into an independent disposable host:

```sh
npm install --save-dev --save-exact ../scratch/hangyeol-core-0.1.0-s2.1.tgz
./node_modules/.bin/hangyeol --version
./node_modules/.bin/hangyeol inspect
./node_modules/.bin/hangyeol init --dry-run
./node_modules/.bin/hangyeol init
./node_modules/.bin/hangyeol add button --dry-run
```

This uses a retained, artifact-pinned development dependency and the actual
local bin. There is no npx registry fallback, postinstall generation, Release
download, publication, product-app integration or ingress change. Init/add retain
the existing React 19/Vite/Tailwind 4 adapter and protected-source installation
contract. Runtime/type/build dependencies stay distinct from the core's installed
tool dependencies. The installer preserves core's devDependency and lock records.

The packed boundary contains executable/router, installer, safety, common
integrity checks, lint/token inspection modules, tool manifest, source registry,
canonical sources, four font binaries, original font license/provenance, and
package documentation. There is no UI barrel, Chart engine or all-96 execution.
Package, source payload and tool manifest versions/ownership are checked; actual
file hashes/lengths are verified before routing. Missing, modified or mismatched
payloads fail instead of returning a version or installer success.

## Tool scope is explicit

Core has exact installed tool dependencies: `@shadcn/lint` 0.2.0, ESLint 9.39.5,
`@typescript-eslint/parser` 8.71.1 and PostCSS 8.5.28. Existing root pins are
preserved. `lint inspect` resolves and verifies the installed versions/licenses;
it does not claim consumer lint enforcement. `tokens inspect` parses actual
packed semantic CSS declarations and reports their owning selectors/@theme and
source hash without writes. Plain `lint`/`tokens` returns exit 2 and names the
missing scope. Consumer lint activation, token validation/generation/sync and
CORE-02 belong to later S2 tasks. These inspections are functional boundaries,
not fabricated passing checks for those tasks.

## License and provenance limits

No first-party repository license/grant was found. Core is therefore private and
`UNLICENSED`, with a notice granting no new rights or ownership. Both the private
package flag and prepublish guard block this candidate's publication. This local
pack/install proof is not a redistribution or release approval.

The unmodified Pretendard v1.3.9 fonts retain the existing SIL OFL 1.1 license.
Build compares actual asset hashes with the original provenance and copies that
license/provenance verbatim. Historical browser-load statements within copied
provenance are not new CORE-01 verification. Tool dependency license identifiers
are read from their actual package metadata; installed packages retain their own
license/notice files. No third-party sources or first-party UI are silently
relicensed.

## Verification boundary

The owner's original absent-package test is preserved and passed after a real
RED. A packed-artifact test fails before tools exist and then inspects actual
pack dry-run/output, tarball members/bin mode, canonical source hashes, license
files and same-version payload. Independent-host tests install the tarball via
npm, verify package/lock/dev ownership and physical modules, run local-bin
version/init/add/dry-run, no-op/conflict/backup behavior, package-version mismatch
and modified-payload failures, and honest lint/token inspection/deferred exits.

New temporary test directories use an explicit `CORE01_EVIDENCE_DIR` parent
outside the repository. Existing installer safety tests can be run with TMPDIR
set to that same authorized scratch parent without editing those tests. Actual
commands, exit/duration/stdout/stderr, artifact SHA256, dependency/license
findings and WIP comparisons belong to local evidence, not public repository
logs. Required slice build/typecheck/lint and existing design lint/fixtures remain
in place; no full-suite or Playwright gate is introduced. Final acceptance,
licensing/release, CORE-02 and real Release download remain unverified.

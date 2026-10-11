# Core transaction contract

CORE-06 applies to the shared installer and safety implementation in `packages/core/src/tools`. The core build collects those files into the packed tool boundary; there is no second installer implementation. First-party package licensing remains guarded/UNLICENSED; bundled font licensing and provenance are unchanged.

## Preflight and no-op

`init` and `add` finish path, source graph, payload hash, dependency version, host adapter, collision and metadata planning before writes or npm. Absolute, empty, backslash, dot/dotdot and empty path segments are rejected. Symlinks, including dangling targets and project-root ancestry, are refused. Case-folded duplicate targets and file/directory overlaps fail closed. `.hangyeol-transactions` is reserved alongside the existing dependency, config and backup targets.

Every planned file captures its hash, inode, mode and modification time. Apply rechecks the complete batch, including payload bytes, then rechecks each changed target immediately before replacement. Changed-since-plan targets are conflicts even if replacement bytes match. Identical files do not create a journal or backup, rewrite metadata, or invoke npm when dependencies are already declared. Dry-run finishes before transaction creation.

An edited requested component requires explicit `--overwrite`. Exact previous bytes are copied to a unique `.hangyeol-backups` path with exclusive creation. Existing common `foundation/theme.css` and `lib/cn.ts` consumer edits retain the earlier ownership contract on add, including overwrite; their original template records are not refreshed to adopt those edits.

## Managed file recovery

Changed files are staged in exclusive files beneath a unique `.hangyeol-transactions` directory and replaced by rename. Existing managed files also have a journal hardlink to their original inode. Synchronous write, dependency-child or metadata failure invokes recovery in reverse order. It restores managed originals, removes owned new targets and removes only newly created, still-identical empty directories. It never recursively deletes pre-existing directories or dependency trees. Explicit overwrite backups remain available after failure.

Recovery checks safe paths and expected current identity/hash before touching a target. An unexpected concurrent edit, unsafe path, changed original, restore denial or cleanup failure produces an `incomplete` result and preserves the conflicting state and available originals. Recovered and untouched paths, errors and material availability are emitted as JSON on stderr. Error status and material availability are independent: after cleanup, `journalStatus` is `present` only when the exact owned directory identity is verified, with its relative location in `journal`; `absent` means no journal remains and `journal` is null, even if recovery is incomplete. An inspection failure or unsafe/replaced journal yields `unknown`, `journal: null`, an explicit inspection error and `journalCandidate` as an unverified diagnostic location, not an available recovery artifact. These checks are observations at report time, not a guarantee against later filesystem changes. Explicit overwrite backups, if created, remain under their separately planned backup paths; no backup is implied for newly created files. A clean recovery still returns CLI exit 1 because the requested installation failed. Successful metadata is written only after the dependency steps succeed.

Commit cleanup failure is a distinct `cleanup-incomplete` result: files have already been committed, the command returns nonzero and reports remaining cleanup problems. It does not claim that the committed installation was rolled back. Recovery journals are diagnostic artifacts, not an automatic replay/update command.

## Dependency boundary

When npm is needed, the transaction snapshots `package.json` and `package-lock.json` before source changes. After each synchronous child it observes their current state. A failed managed transaction restores previous bytes or absence where those observed targets still match. External file recovery may change inode or timestamp precision; directory timestamp restoration is best effort. This is not a promise of full filesystem identity restoration after failure. Strict complete identity snapshots are verified for preflight rejection and identical no-op.

**`node_modules` and other external npm effects are not rolled back.** The CLI explicitly reports dependency installation as uncertified and asks the consumer to review and reinstall dependencies. Restoring a previous lockfile does not prove installed modules match that lock. The child can leave modules, logs or other effects, and its activity cannot be atomically attributed against unrelated concurrent writers. The installer neither deletes consumer dependency trees nor claims rollback of lifecycle processes, network/cache effects or arbitrary child writes. There is no durable crash/power-loss journal, fsync guarantee or protection against a hostile filesystem race in the remaining check-to-operation windows.

## Executable evidence

Run the narrow tests with `CORE06_EVIDENCE_DIR` pointing to the designated external scratch and `TMPDIR` set to its authorized scratch parent. Build core, then run `packages/core/test/packed-artifact.test.mjs` with `CORE01_EVIDENCE_DIR` set to that same evidence directory before the installed test:

```sh
node --test packages/cli/test/safety.test.mjs packages/core/test/safety-transaction.test.mjs
node packages/core/build.mjs
node --test packages/core/test/packed-artifact.test.mjs
node --test packages/core/test/installed-transaction.test.mjs
```

The installed test performs a genuine offline exact-dev tarball installation, uses only that physical host's local bin, checks canonical packed tool hashes and final package/lock integrity, and saves complete byte/inode/mtime/mode/link snapshots. It exercises unsafe paths, symlinks, payload corruption, no-op, edited conflict, exact backups, source/metadata failure, npm failure, concurrent edit refusal and restore denial. An installed safety-module API test supplements the CLI cases for non-exposed custom batch collisions, overlap and project-root ancestry.

The npm failure child is an explicitly injected local executable that mutates package/lock and leaves a module residue before exit 42. It proves recovery/reporting, not registry installation or complete dependency rollback. Source tests also inject partial stage writes, absent lock restoration, created-parent cleanup and plan integrity changes. The prepared offline cache is not empty-cache, VPS or Release-download proof. Owner review, frozen-SHA verification, Git sharing and PM acceptance are separate; no browser/AT workflow is part of CORE-06.

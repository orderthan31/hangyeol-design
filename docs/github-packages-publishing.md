# 한결 core — GitHub Packages 수동 배포 구성

## 현재 구성과 수동 게시 승인

- 후보는 **`@orderthan31/hangyeol-core@0.0.1`**, 실행 파일은 `hangyeol`입니다.
- `packages/core`만 npm 게시 대상입니다. core는 `private:false`이며 루트 `hangyeol`과 Docs `@hangyeol/docs`는 버전 `0.0.1`, `private:true`를 유지합니다.
- 라이선스는 **UNLICENSED**입니다. npm의 private 플래그와 GitHub 패키지 visibility, 외부 사용 권한은 별개입니다. visibility와 라이선스는 변경하지 않았습니다.
- repository는 `orderthan31/hangyeol-design`, directory는 `packages/core`, publishConfig.registry는 `https://npm.pkg.github.com`입니다.
- 모든 컴포넌트의 테두리와 설명/사용법 소스 검토 및 global design lint가 완료되었고, 사용자가 첫 수동 게시를 명시적으로 승인했습니다. `publication-readiness.json`의 `uiAndCopyReviewComplete:true`는 이 소스 검토와 승인만 기록합니다. 실제 게시 성공, 브라우저·최종 시각 수용 또는 권리 승인을 뜻하지 않습니다.
- workflow는 매 실행마다 전체 build/test/typecheck/lint를 다시 요구합니다. 실패를 무시하거나 baseline 면제로 처리하지 않습니다.

## 실행 경계

`.github/workflows/publish-core.yml`은 **workflow_dispatch만** 받습니다. push, pull_request, release 자동 게시 trigger가 없습니다. 기본 `publish:false`는 build/test/typecheck/pack/lint 검증만 요청합니다.

게시 job은 validation 성공, main ref, 정확한 저장소, `publish:true`, confirmation `@orderthan31/hangyeol-core@0.0.1`이 모두 있어야 진입합니다. 그 이후에도 package readiness와 실제 인증을 포함한 fail-closed guard가 적용됩니다.

checkout v6와 setup-node v7은 검증한 commit SHA로 고정합니다. Node는 22.22.2입니다. 모든 checkout은 dispatch의 `github.sha`로 고정하고 자격 증명을 저장하지 않습니다. validation은 contents:read, 게시 job만 packages:write, 검증 job은 contents:read/packages:read를 가집니다. scope routing은 게시 및 검증 job의 별도 runner에 설정합니다. `NODE_AUTH_TOKEN`은 각 job의 게시 또는 registry 검증 step에서만 해당 `secrets.GITHUB_TOKEN`으로 주입합니다. PAT나 새 secret은 요구하지 않습니다. 기존 Git push App 인증은 npm 인증이 아닙니다.

`npm ci --ignore-scripts`는 dependency 설치에만 적용됩니다. publish에는 `--ignore-scripts=false`를 명시하고 guard도 우회 여부를 거부합니다. guard는 정확한 package/version/license/repository/registry, workflow/job/event/ref, dispatch payload와 명시적 승인을 확인합니다. 이는 의도 확인 장치이며 GitHub의 실제 registry 인증·권한을 대신하지 않습니다. guard를 제거하거나 `--ignore-scripts`로 우회해서 게시하지 않습니다.

## 소비자와 scoped 경계

현재 소비 경로는 실제 로컬 `orderthan31-hangyeol-core-0.0.1.tgz` → exact devDependency → 물리적 `node_modules/@orderthan31/hangyeol-core` → 설치된 `hangyeol` CLI → init/add입니다. GitHub Packages scoped registry에서 게시 또는 설치 성공을 주장하지 않습니다. 공개 npm 의존성을 가져오는 것과 core를 GitHub Packages에서 설치하는 것은 다른 검증입니다.

GitHub Packages의 npm 패키지는 scope routing과 읽기 인증이 필요합니다. 최초 package visibility는 기본값을 변경하지 않으며, 게시 후 실제 package metadata로 확인합니다. repository Actions read access는 실제 검증 job의 설치 결과로 확인합니다. 이 작업은 visibility, 실제 사용자 인증 설정, checked-in `.npmrc`를 변경하지 않습니다. credentials·cache·환경 덤프를 저장소나 증거에 넣지 않습니다.

`src/hangyeol`과 소비자의 `@hangyeol` alias는 소스 경로 계약입니다. npm 계정 scope `@orderthan31`로 바꾸지 않습니다.

## 실제 registry 소비 검증과 재시도

게시 성공 뒤 별도 `verify` job은 빈 `RUNNER_TEMP` 소비자와 새 cache에서 exact `0.0.1`을 GitHub Packages로부터 설치합니다. 공개 의존성은 npmjs를 사용합니다. 실제 registry metadata와 lock의 URL/SRI, 물리 package identity, 모든 103 UI payload source와 고정 checkout, tool manifest hash, README/readiness/guard를 비교합니다. 설치된 bin으로 README App의 init/add/inspect/doctor/tokens/lint/tsc/Vite build를 실행합니다. 성공해야만 `HANGYEOL_REGISTRY_PROOF` JSON receipt를 로그에 출력합니다. 이 receipt는 browser/E2E나 visibility 검증을 주장하지 않습니다. metadata/API 확인은 별도 read-only 단계입니다.

첫 게시 입력은 `publish:true`, exact confirmation, `verify_only:false`입니다. 기본값은 두 boolean 모두 false이므로 validation만 실행합니다. immutable 버전 게시가 성공했으나 후속 검증이 실패했다면 **다시 게시하지 마세요**. 검증 코드를 수정한 후 `publish:false`, `verify_only:true`로 새 실행을 요청하면 전체 validation 성공 후 read-only registry 검증만 재실행합니다. publish guard 의미는 바뀌지 않으며 검증 job에는 write 권한이 없습니다. 소스/README/guard 등 이미 게시된 내용이 달라졌다면 byte 비교는 실패해야 하며, 이 재시도 경로로 immutable 버전을 덮어쓸 수 없습니다.

## 이전 로컬 후보의 명시적 이관

일반 init/add는 이전 tool/version을 거부합니다. 예외는 **unscoped `hangyeol-core@0.1.0-s2.1` → scoped `0.0.1`의 바이트 동일한 소유 파일**에 한정한 `init --migrate-from-unscoped`입니다. 이 이름/버전 언급은 역사적 migration input이며 현재 package identity가 아닙니다.

이관은 기존 record, 모든 선택 소스·공통 소스·스타일·글꼴의 현재 bytes와 새 payload bytes를 검사하고 실제 installer transaction으로 동일 파일을 noop 처리하며 metadata backup과 새 기록을 생성합니다. 편집·누락·모르는 owner·틀린 hash/version은 쓰기 전에 거부합니다. `--overwrite`와 결합할 수 없고 범용 update engine이 아닙니다. 소비자 편집이 있다면 먼저 별도로 보존·검토하고 이 명령을 강제로 적용하지 않습니다.

Docs 유지보수에서는 core workspace 설치/빌드 후 `node scripts/generate-slice-docs.mjs --migrate-from-unscoped`를 **한 번만 명시적으로** 사용합니다. 이후 일반 generate의 init/add가 exact pin과 실제 설치 bin을 검증합니다. hash나 version record를 손으로 고치지 않습니다.

## 검증과 남은 단계

- source/packed contract tests는 실제 npm pack의 filename, payload/tool identity와 source hashes를 확인합니다.
- guard 테스트는 network 없이 승인 context의 순수 validation과 잘못된 name/version/repository/ref/event/registry, 정상 로컬 실행의 거부를 확인합니다. 실제 readiness는 승인 context의 순수 validation을 통과하지만, 로컬·잘못된 context·인증 없는 lifecycle은 계속 차단됩니다.
- 로컬 tarball의 독립 물리 소비자에서는 렌더된 시작하기 App을 필수 `init`/`add theme text-field`만으로 검사합니다. default 경로와 별도 source/style/alias 경계를 구분합니다.
- 게시 이후의 실제 GitHub Packages exact scoped 설치, repository Actions access, registry 권한·visibility는 아직 검증하지 않았습니다.
- 브라우저/Playwright/E2E/AT와 전체 디자인 수용은 별도 단계입니다.

## 공식 참고

- GitHub Docs: Working with the npm registry — scoped naming, repository association, registry/authentication and visibility.
- GitHub Docs: Publishing Node.js packages — setup-node and GITHUB_TOKEN.
- GitHub Docs: Workflow syntax for GitHub Actions — workflow_dispatch inputs, conditions and job permissions.
- npm Docs: package.json and npm exec — private/publishConfig and installed local executable behavior.

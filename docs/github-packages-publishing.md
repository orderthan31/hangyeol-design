# 한결 core — GitHub Packages 수동 배포 구성

## 현재 구성과 게시 금지

- 후보는 **`@orderthan31/hangyeol-core@0.0.1`**, 실행 파일은 `hangyeol`입니다.
- `packages/core`만 npm 게시 대상입니다. core는 `private:false`이며 루트 `hangyeol`과 Docs `@hangyeol/docs`는 버전 `0.0.1`, `private:true`를 유지합니다.
- 라이선스는 **UNLICENSED**입니다. npm의 private 플래그와 GitHub 패키지 visibility, 외부 사용 권한은 별개입니다. visibility와 라이선스는 변경하지 않았습니다.
- repository는 `orderthan31/hangyeol-design`, directory는 `packages/core`, publishConfig.registry는 `https://npm.pkg.github.com`입니다.
- **아직 게시하지 않으며 게시 준비 완료도 아닙니다.** `publication-readiness.json`의 `uiAndCopyReviewComplete:false`가 승인 입력과 무관하게 실제 publish guard를 차단합니다. 패키지 구성 작업 이후 모든 컴포넌트의 두껍거나 어두운 테두리, 설명/사용법 중복, 승인된 브랜드 대표 문구와 사용자 친화적인 소개를 별도 검토해야 합니다. 현재 작업에서 UI/CSS/Overview는 변경하지 않습니다.
- 기존 global lint 실패도 그대로 release blocker입니다. workflow는 이를 무시하거나 baseline 면제로 처리하지 않습니다.

## 실행 경계

`.github/workflows/publish-core.yml`은 **workflow_dispatch만** 받습니다. push, pull_request, release 자동 게시 trigger가 없습니다. 기본 `publish:false`는 build/test/typecheck/pack/lint 검증만 요청합니다.

게시 job은 validation 성공, main ref, 정확한 저장소, `publish:true`, confirmation `@orderthan31/hangyeol-core@0.0.1`이 모두 있어야 진입합니다. 그 이후에도 위 readiness 차단이 적용됩니다. 후속 UI/카피 검토와 lint 해결을 별도 승인·검증하기 전 readiness를 변경하지 않습니다.

checkout v6와 setup-node v7은 검증한 commit SHA로 고정합니다. Node는 22.22.2입니다. validation은 contents:read, 게시 job만 packages:write를 가집니다. setup-node의 scope routing은 게시 job의 일회용 runner에만 설정합니다. `NODE_AUTH_TOKEN`은 publish step에서만 `secrets.GITHUB_TOKEN`으로 주입합니다. PAT나 새 secret은 요구하지 않습니다. 기존 Git push App 인증은 npm 인증이 아닙니다.

`npm ci --ignore-scripts`는 dependency 설치에만 적용됩니다. publish에는 `--ignore-scripts=false`를 명시하고 guard도 우회 여부를 거부합니다. guard는 정확한 package/version/license/repository/registry, workflow/job/event/ref, dispatch payload와 명시적 승인을 확인합니다. 이는 의도 확인 장치이며 GitHub의 실제 registry 인증·권한을 대신하지 않습니다. guard를 제거하거나 `--ignore-scripts`로 우회해서 게시하지 않습니다.

## 소비자와 scoped 경계

현재 소비 경로는 실제 로컬 `orderthan31-hangyeol-core-0.0.1.tgz` → exact devDependency → 물리적 `node_modules/@orderthan31/hangyeol-core` → 설치된 `hangyeol` CLI → init/add입니다. GitHub Packages scoped registry에서 게시 또는 설치 성공을 주장하지 않습니다. 공개 npm 의존성을 가져오는 것과 core를 GitHub Packages에서 설치하는 것은 다른 검증입니다.

GitHub Packages의 npm 패키지는 scope routing과 읽기 인증이 필요합니다. 최초 package visibility 및 repository Actions access도 게시 전에 확인해야 합니다. 이 작업은 visibility, 실제 사용자 인증 설정, checked-in `.npmrc`를 변경하지 않습니다. credentials·cache·환경 덤프를 저장소나 증거에 넣지 않습니다.

`src/hangyeol`과 소비자의 `@hangyeol` alias는 소스 경로 계약입니다. npm 계정 scope `@orderthan31`로 바꾸지 않습니다.

## 이전 로컬 후보의 명시적 이관

일반 init/add는 이전 tool/version을 거부합니다. 예외는 **unscoped `hangyeol-core@0.1.0-s2.1` → scoped `0.0.1`의 바이트 동일한 소유 파일**에 한정한 `init --migrate-from-unscoped`입니다. 이 이름/버전 언급은 역사적 migration input이며 현재 package identity가 아닙니다.

이관은 기존 record, 모든 선택 소스·공통 소스·스타일·글꼴의 현재 bytes와 새 payload bytes를 검사하고 실제 installer transaction으로 동일 파일을 noop 처리하며 metadata backup과 새 기록을 생성합니다. 편집·누락·모르는 owner·틀린 hash/version은 쓰기 전에 거부합니다. `--overwrite`와 결합할 수 없고 범용 update engine이 아닙니다. 소비자 편집이 있다면 먼저 별도로 보존·검토하고 이 명령을 강제로 적용하지 않습니다.

Docs 유지보수에서는 core workspace 설치/빌드 후 `node scripts/generate-slice-docs.mjs --migrate-from-unscoped`를 **한 번만 명시적으로** 사용합니다. 이후 일반 generate의 init/add가 exact pin과 실제 설치 bin을 검증합니다. hash나 version record를 손으로 고치지 않습니다.

## 검증과 남은 단계

- source/packed contract tests는 실제 npm pack의 filename, payload/tool identity와 source hashes를 확인합니다.
- guard 테스트는 network 없이 승인 context의 순수 validation과 잘못된 name/version/repository/ref/event/registry, 정상 로컬 실행의 거부를 확인합니다. 현재 readiness=false를 유지한 실제 guard는 항상 차단됩니다.
- 로컬 tarball의 독립 물리 소비자에서는 렌더된 시작하기 App을 필수 `init`/`add theme text-field`만으로 검사합니다. default 경로와 별도 source/style/alias 경계를 구분합니다.
- 게시 이후의 실제 GitHub Packages exact scoped 설치, repository Actions access, registry 권한·visibility는 아직 검증하지 않았습니다.
- 브라우저/Playwright/E2E/AT와 전체 디자인 수용은 별도 단계입니다.

## 공식 참고

- GitHub Docs: Working with the npm registry — scoped naming, repository association, registry/authentication and visibility.
- GitHub Docs: Publishing Node.js packages — setup-node and GITHUB_TOKEN.
- GitHub Docs: Workflow syntax for GitHub Actions — workflow_dispatch inputs, conditions and job permissions.
- npm Docs: package.json and npm exec — private/publishConfig and installed local executable behavior.

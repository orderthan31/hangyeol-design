# Radix source contract (CORE05)

CORE05는 Select/Tabs/Dialog의 editable local source closure 및 실제 키보드·포털 테마 검증 범위입니다. 기존 그래프를 재작성하거나 canonical UI/API/팔레트를 변경하지 않습니다. 아래 blocker 절은 **초기 offline 실패 이력**이며, 2026-10-08의 owner 독립 재검증 결과는 마지막 절에 분리해 기록했습니다. 기술 검증과 PM 수용은 별도입니다.

## Requested closure

모든 요청은 common `foundation/theme.css`와 `lib/cn.ts`를 사용합니다. `init`의 `foundation/fonts.css`, 네 Pretendard woff2 및 실제 OFL LICENSE/provenance, stylesheet/config integration은 별도입니다.

| 요청 | common 이외 소스 | 직접 추가하는 런타임 의존성 |
| --- | --- | --- |
| select | primitives/select.tsx, primitives/portal.tsx, foundation/theme.tsx | @radix-ui/react-select 2.3.8 |
| tabs | primitives/tabs.tsx | @radix-ui/react-tabs 1.1.22 |
| dialog | primitives/dialog.tsx, primitives/portal.tsx, foundation/theme.tsx | @radix-ui/react-dialog 1.2.0 |

Select+Dialog는 portal/theme을 한 번만 계획합니다. Tabs는 portal/theme.tsx를 요청하지 않습니다. Button-only는 추가 Radix 직접 의존성이나 portal/theme.tsx를 요청하지 않습니다. core tool 전이 의존성과 소비자 UI 직접 의존성은 구분합니다. Chart/Recharts/docs/full barrel을 소비자 UI에 복사하지 않습니다. Select의 public ref는 Trigger HTMLButtonElement이며 HTMLSelectElement가 아닙니다. 다른 public API/native contracts는 canonical source를 그대로 사용합니다.

`packages/core/test/radix-source.test.mjs`의 실제 installer subprocess 검사 9개가 변경되지 않은 production에서 첫 실행부터 통과했습니다. 결함 RED를 만들거나 올바른 구현을 수정하지 않았습니다. 물리적 설치 테스트는 실제 npm tarball devDependency와 local bin만 사용합니다. workspace 링크/hoisting/unpacked-bin 대체 실행은 허용하지 않습니다.

## Ownership and conflicts

common theme.css/cn.ts의 사용자 편집은 일반 추가와 overwrite에서도 보존하고 기존 템플릿 해시를 유지합니다. 반면 **foundation/theme.tsx와 primitives/portal.tsx는 요청된 component closure 파일**입니다. 해당 파일 또는 Select/Tabs/Dialog를 편집하면 기본 추가는 source 계획 단계에서 충돌로 중단해야 합니다. 명시적인 overwrite는 요청된 closure의 바뀐 파일을 정확한 편집 바이트로 백업하고 canonical 소스로 교체합니다. common 보존 면제를 portal/theme.tsx까지 확대하지 않습니다.

반복 추가는 package/lock/config/assets/node_modules를 포함하는 byte/hash/mtime/mode/link snapshot을 유지하고 installer npm 호출이 0이어야 합니다. custom roots/source scan/base/alias, no-Preflight 및 host body/무관한 설정·의존성은 [init contract](./core-init-contract.md)와 [common ownership contract](./core-button-contract.md)를 따릅니다. 이 작업에 broad transaction/update engine을 추가하지 않습니다.

## Observed blocker and rerun boundaries

실제 설치 테스트 한 번에서 5개 중 Button-only 1개가 통과하고 Select/Tabs/Dialog/overlap 4개가 실패했습니다. 준비된 캐시에서 Select 조회 또는 Radix react-context 조회가 `ENOTCACHED`로 실패했습니다. 설치기는 source가 쓰였고 package/lock이 부분 상태일 수 있으며 성공 metadata는 기록하지 않았다고 실제로 보고했습니다. disposable 실패 호스트와 원시 로그를 보존했습니다. 이는 source graph 결함의 RED나 성공적인 Radix 설치가 아닙니다. 온라인 retry, 캐시 다운로드, dependency/version 변경 또는 destructive rollback을 실행하지 않았습니다.

브라우저 fixture/harness는 지정된 외부 evidence에 준비했지만 Radix 설치 prerequisite이 막혀 실행하지 않았습니다. 기존 Chrome/Playwright 실행 파일의 존재만 확인했고 이번 invocation에서 sandbox bind/launch 성공 또는 EPERM을 관찰한 것으로 주장하지 않습니다. 현재 B는 **NOT RUN / dependency prerequisite blocked**입니다.

캐시/의존성 prerequisite을 owner가 별도 권한으로 해결한 후, 지정된 외부 scratch와 Node 환경에서 다음 순서로 실행할 수 있습니다. 물리적 설치 테스트가 성공하기 전 브라우저 fixture를 실행하지 않습니다.

1. CORE01_EVIDENCE_DIR와 CORE05_EVIDENCE_DIR를 같은 외부 scratch로 설정하고 packed-artifact 테스트로 실제 artifact.json을 생성합니다.
2. installed-radix.test.mjs를 실행하여 각 물리적 호스트 및 browser-host.json을 생성합니다.
3. 외부 scratch의 prepare-browser.mjs를 실행하고 생성된 browser host에서 local tsc/Vite bin으로 타입 검사와 production build를 실행합니다.
4. 같은 scratch의 browser-smoke.mjs를 실행합니다. 이 harness만 ephemeral loopback server와 headless Chrome을 시작하며 finally에서 자신이 시작한 리소스를 종료합니다. 기존 preview/app-server에는 접속하거나 재시작하지 않습니다.

브라우저 예정 검사는 Select Arrow/Enter 선택·focus return, Tabs ArrowRight panel/focus, Dialog Enter/Escape focus trap/return, in-modal nested Select portal과 실제 computed 배경/잉크입니다. 실제 소비자 theme.css의 `html[data-owner-palette="custom"] [data-hangyeol][data-theme="dark"]` semantic 변수 규칙을 사용합니다. fixture의 F8/F9는 React consumer palette/mode state를 바꾸는 실제 입력 shortcut이며 browser driver는 style을 수동 패치하지 않습니다. 이 전역 scoped 규칙은 body portal에도 적용됩니다. 현재 Theme context는 mode만 전달하므로 wrapper의 임의 inline CSS 변수 전파를 입증하거나 구현하지 않습니다.

초기 owner 재실행 전 판정에서 실제 keyboard/focus/computed theme 결과는 미검증이었습니다. 전체 Playwright/axe/AT/native form/IME/FontFace 및 최종 디자인·접근성 수용, VPS/빈 캐시/실제 Release 다운로드, PM 승인/commit 이후 frozen 검증은 별도입니다. guarded UNLICENSED core 후보이며 새로운 공개 라이선스나 출판 권한을 주장하지 않습니다.

## 2026-10-08 owner 독립 재검증 — 초기 실패와 분리

초기 ENOTCACHED/부분 상태/NOT RUN 원문은 그대로 보존합니다. 별도 승인 `1557583537085882402` 아래 지정 scratch의 격리 cache 준비 host에서 같은 Radix direct pins와 필요한 전이를 public registry로 준비했습니다. 준비 단계는 `--ignore-scripts --no-audit --no-fund`, React/DOM peer는 기존 19.2.0으로 고정했고 원 prepared cache와 실패 소비 호스트는 변경하지 않았습니다.

후속 검수 조건은 **온라인 사전 준비된 격리 캐시의 Mac Node22.22.2/npm10.9.7 offline 소비**입니다. standalone physical suite의 component `add`는 환경의 `npm_config_offline=true`를 상속하므로 실제 재실행에도 반드시 이를 설정하고, `npm_config_cache`는 준비된 격리 cache를 가리켜야 합니다. CORE01_EVIDENCE_DIR/CORE05_EVIDENCE_DIR는 같은 신규 외부 scratch로 지정합니다. 소비 설치에 online fallback을 허용하지 않습니다.

owner는 새 소비 호스트에서 physical Select/Tabs/Dialog/overlap4 및 별도 Button-only1, local 편집/typecheck/build·no-op/conflict/정확한 backup·common/host 보존을 실제 실행해 통과했습니다. 기존 production은 수정하지 않았습니다. 실제 Chrome harness에서 Select ArrowDown/Enter value=Beta와 trigger focus 복귀, Tabs ArrowRight의 Beta panel/focus, Dialog Enter opening·내부 focus·nested Select portal/selection·forward Tab trap·Escape closing/trigger focus 복귀를 확인했습니다. consumer stylesheet의 명시 dark-boundary override는 Select body portal·Dialog·nested Select에 computed background `rgb(18, 52, 86)`/color `rgb(254, 220, 186)`으로 반영됐으며 열린 Select의 light/dark 변경도 확인했습니다. wrapper-only inline 변수 자동 전파 증거는 아닙니다.

별도 독립 READ-ONLY source 리뷰는 security/logic blocker 없이 통과했으며 실행을 재수행한 리뷰가 아닙니다. Shift+Tab 경계 trap 별도 검증은 미수행 제안으로 유지합니다. owner 실행·독립 source 판정과 이후 exact-SHA frozen/Git 공유·PM 수락은 각각 분리합니다. 초기 실패를 성공으로 소급 변경하거나 FontFace/AT/빈 cache/VPS/Release/일반 portability 성공으로 확대하지 않습니다.

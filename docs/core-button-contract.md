# Button source contract (CORE-03)

`@orderthan31/hangyeol-core`는 설치 도구인 guarded `UNLICENSED` 후보 패키지입니다. 소비자 UI는 설치된 core 런타임 대신 로컬 소스를 가져옵니다. 공개 registry/Release 다운로드나 라이선스 부여를 주장하지 않습니다.

## Local installation and source graph

로컬에서 생성한 실제 tarball을 소비자 호스트에 설치합니다. tarball 경로는 생성 결과를 사용합니다. registry fallback이나 workspace 링크를 사용하지 않습니다.

```sh
npm pack --workspace=@orderthan31/hangyeol-core --pack-destination=<external-artifact-directory>
# React 19 / Vite / Tailwind 4 호스트에서:
npm install --offline --save-dev --save-exact <actual-tarball-path>
./node_modules/.bin/hangyeol init
./node_modules/.bin/hangyeol add button --dry-run
./node_modules/.bin/hangyeol add button
```

준비된 캐시가 없는 환경의 offline 설치 성공은 별도 검증 대상입니다. core의 실제 버전과 tarball integrity는 소비자의 package/lock에 남습니다. core 설치 자체는 UI 파일을 생성하지 않습니다.

기본 `sourceRoot`의 Button UI 그래프는 다음 세 파일입니다.

- `src/hangyeol/primitives/button.tsx`: 원본 native Button API와 ref/props를 가진 편집 가능한 소스
- `src/hangyeol/lib/cn.ts`: clsx / tailwind-merge와 semantic utility 충돌 그룹
- `src/hangyeol/foundation/theme.css`: scoped base와 semantic theme

`init`은 별도로 `foundation/fonts.css`, Pretendard 400/500/600/700 woff2, 실제 OFL LICENSE/provenance, 호스트 stylesheet integration/config를 설치합니다. `add button`은 이 초기화와 구분됩니다. Button 추가는 Chart, Recharts, react-is, 다른 컴포넌트, docs, index/full barrel 또는 Radix 런타임 의존성을 요청하지 않습니다. core tarball은 다른 선택적 컴포넌트 payload와 lint 도구도 보유하지만 소비자의 Button UI 그래프로 복사하지 않습니다. lint 도구의 전이 의존성과 UI의 직접 런타임 의존성은 구분합니다.

```tsx
import { Button } from './hangyeol/primitives/button';
import './hangyeol.css';
```

커스텀 경로는 `hangyeol.json`을 따릅니다. `sourceRoot`, `stylePath`, `publicRoot`, `fontPath`, `basePath`, alias/source scan과 호스트 body 보존 정책은 [CORE-02 init contract](./core-init-contract.md)를 그대로 적용합니다. 전체 Tailwind/Preflight reset은 추가하지 않습니다.

## Editing and add safety

초기화된 theme/helper는 소비자가 편집할 수 있습니다. `add`와 `add --overwrite`는 해당 로컬 바이트를 그대로 유지하며, `hangyeol.json`의 기존 템플릿 version/hash 기록을 편집된 바이트의 해시로 갱신하지 않습니다. 계획에는 보존 파일을 `noop`로 포함하므로 경로/심볼릭 링크와 실행 직전 변경 확인을 건너뛰지 않습니다. 계획 수집 중 내용이 달라져 replace가 필요한 경우에도 중단합니다.

보존에는 동일 payload 버전 및 원본 템플릿 해시의 공통 파일 설치 기록과 실제 일반 파일이 필요합니다. 기록이 없거나 호환되지 않거나 파일이 누락/디렉터리/심볼릭 링크이면 변경과 npm 실행 전에 실패합니다. 임의의 미소유 공통 파일을 자동 채택하지 않습니다. 설정 변경, init 충돌, payload 해시, 경로, mandatory Tailwind alias 및 basePath 가드도 유지합니다. 이 동작은 업데이트/병합 엔진이 아닙니다. `init`을 다시 실행해 편집된 공통 소스를 새 템플릿으로 채택하는 정책도 추가하지 않습니다.

Button 자체를 편집하면 기본 `add button`은 충돌로 실패하고 전체 호스트를 보존합니다. 명시적인 `--overwrite`는 정확한 편집 바이트를 백업한 뒤 Button만 원본으로 교체하며 theme/helper를 되돌리지 않습니다. 설치 상태가 바뀌는 경우 기존 정책에 따른 `hangyeol.json` 메타데이터 백업은 별도로 남을 수 있습니다. 동일한 추가와 dry-run은 파일/mtime를 변경하지 않습니다.

## Bounded verification

소스 동작은 `packages/core/test/button-source.test.mjs`, 실제 tarball을 물리적 devDependency로 설치한 외부 호스트는 `packages/core/test/installed-button.test.mjs`로 검사합니다. 두 테스트 모두 명시적인 외부 `CORE03_EVIDENCE_DIR`이 필요합니다. packed artifact 검증이 먼저 해당 evidence의 `artifact.json`을 생성합니다. 설치 테스트는 로컬 bin으로 init/add를 실행하고 커스텀 source graph, 전체 byte/mtime/mode/link snapshot, npm guard, core lock integrity, 공통 소스/설정 보존, 컴포넌트 충돌/정확한 백업, 실제 Vite 빌드/타입 검사 및 로컬 Button 편집의 번들 반영을 확인합니다.

준비된 Mac offline 캐시와 작업 트리 검증 범위입니다. 독립 VPS/빈 캐시/실제 Release 다운로드, HTTP/브라우저 FontFace 및 AT, 최종 디자인/접근성 수용, owner 독립 리뷰와 commit 이후 frozen SHA 검증은 별도입니다. 이전 CORE-02 sandbox listener 실패 및 owner의 이전 HTTP 결과를 새 CORE-03 실행 결과로 재사용하지 않습니다.

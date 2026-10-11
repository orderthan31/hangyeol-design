# TextField source contract (CORE-04)

TextField 요청은 기존 canonical registry의 `text-field → input, button` closure를 설치합니다. CORE-04는 이 그래프와 설치 동작의 소스/실제 설치 증거를 추가합니다. 이미 충족한 그래프를 다시 구현하거나 UI/API를 변경하지 않습니다.

## Local package and source closure

소비자는 실제 로컬 tarball을 정확한 devDependency로 설치하고 물리적 `node_modules/.bin/hangyeol`을 실행합니다. registry fallback, workspace 링크, unpacked bin 대체 실행을 사용하지 않습니다.

```sh
npm pack --workspace=@orderthan31/hangyeol-core --pack-destination=<external-artifact-directory>
# React 19 / Vite / Tailwind 4 소비자 호스트에서 실제 생성 경로 사용:
npm install --offline --save-dev --save-exact <actual-tarball-path>
./node_modules/.bin/hangyeol init
./node_modules/.bin/hangyeol add text-field --dry-run
./node_modules/.bin/hangyeol add text-field
```

초기화와 추가는 별도입니다. 설치 자체에 UI postinstall 생성은 없습니다. 실제 core 버전, resolved tarball 및 SHA512 integrity는 소비자의 package/lock에 남습니다. 준비된 offline 캐시 조건이며 빈 캐시 또는 독립 VPS 다운로드 성공을 의미하지 않습니다. guarded `UNLICENSED` 후보에 공개 다운로드/라이선스 부여를 주장하지 않습니다.

`sourceRoot` 아래 TextField UI 파일은 정확히 다음 다섯 개입니다.

- `components/text-field.tsx`
- `primitives/input.tsx`
- `primitives/button.tsx`
- `lib/cn.ts`
- `foundation/theme.css`

`init`의 `foundation/fonts.css`, Pretendard 400/500/600/700 woff2, 실제 OFL LICENSE/provenance, 호스트 stylesheet/config integration은 별도입니다. TextField는 로컬 Input/Button/cn을 상대 경로로 가져옵니다. 소비자 런타임이 core의 UI를 가져오지 않습니다. 전체 barrel/index, docs, Chart/Recharts, 다른 컴포넌트 또는 Radix 런타임을 설치하지 않습니다. core 도구/전체 선택적 payload 자체의 포함 범위와 소비자에 복사되는 UI closure는 구분합니다.

```tsx
import { TextField } from './hangyeol/components/text-field';
import './hangyeol.css';

<TextField label="이름" name="name" defaultValue="문서" clearable />
```

closure의 런타임 helper 의존성은 `clsx`, `tailwind-merge`이며 React/React DOM 호스트와 Tailwind 4/Vite/type 환경을 사용합니다. 실제 버전은 packed manifest와 호스트 package/lock을 따릅니다. 이미 있던 무관한 호스트 의존성을 삭제하지 않습니다. lint 도구의 전이 의존성을 UI의 요청 의존성과 혼동하지 않습니다.

## Dedupe, edit and overwrite

`add text-field`와 겹치는 `add text-field input button`은 같은 대상 집합을 한 번씩 계획합니다. Button을 먼저 설치한 뒤 TextField를 추가하면 동일 Button은 byte/mtime가 유지되는 noop입니다. 이미 설치된 동일 closure의 반복 추가와 dry-run은 설정·메타데이터·package·lock·fonts를 포함해 byte/mtime/mode/link snapshot을 유지하고 npm을 호출하지 않습니다.

개별 Input/Button/TextField 편집은 기본 `add text-field`에서 변경이나 npm 실행 전에 충돌로 중단됩니다. Button이 전이 의존성인 경우도 같습니다. 명시적인 `--overwrite`는 **요청된 전체 closure 중 바뀐 컴포넌트**를 각각 정확한 편집 바이트로 백업하고 canonical 소스로 교체합니다. 여러 컴포넌트를 편집한 경우 TextField만 교체하거나 다른 편집된 의존성을 보존한다고 주장하지 않습니다. 원래 동일한 파일은 noop입니다. 기존 계약에 따라 메타데이터가 바뀔 때는 별도 metadata backup이 있을 수 있습니다.

초기화된 theme/helper의 로컬 편집은 일반 추가와 overwrite 모두 보존합니다. 원래 템플릿 version/hash 기록도 유지하며 로컬 편집 해시를 새 canonical 기록으로 채택하지 않습니다. [CORE-03 공통 소스 소유권 계약](./core-button-contract.md)의 누락/해시/버전/심볼릭 링크/계획 변경 검사를 유지합니다. [CORE-02 init 계약](./core-init-contract.md)의 custom roots, source scan, alias, same-origin basePath, host body 및 no-Preflight 가드도 그대로 적용합니다.

## Bounded evidence

`packages/core/test/textfield-source.test.mjs`는 실제 shared installer subprocess로 단일/겹치는 요청, Button 선행 설치, 개별 편집 충돌과 백업을 검사합니다. `packages/core/test/installed-textfield.test.mjs`는 외부 물리적 npm 설치 호스트의 local bin으로 동일 동작을 검사합니다. 두 파일은 지정한 외부 `CORE04_EVIDENCE_DIR`이 필요하며 packed artifact 검사가 같은 evidence의 `artifact.json`을 먼저 생성합니다. 명시적인 테스트 실행을 사용하며 전체 core/Playwright suite를 반복 gate로 추가하지 않습니다.

물리적 호스트는 `ui/system`, `styles/theme.css`, `static/assets/type`, `/design/`, `@hangyeol` 설정으로 생성된 실제 source scan/import와 파일을 검사합니다. 원래 host body/설정/무관한 package 의존성과 편집된 theme/helper를 유지하고, 타입 검사와 Vite 빌드가 직접 로컬 TextField 및 Input/Button을 사용함을 확인합니다. 로컬 TextField label에 추가한 표시 문자열이 실제 번들에 포함되는 것과 수정한 theme 색상 `#654321`이 실제 CSS에 남는 것을 검사합니다. 이는 브라우저 동작 또는 native ref/IME/form/clear의 새 수용 증거를 의미하지 않습니다.

HTTP/브라우저 FontFace, screenshot/AT/시각적 접근성, 빈 캐시/VPS/실제 Release 다운로드, owner 독립 리뷰/PM 완료 및 commit 이후 frozen SHA 검증은 별도입니다. 기존 preview/app-server를 변경하지 않습니다. 과거 실행의 sandbox 실패나 owner의 HTTP 성공을 새 CORE-04 결과로 재사용하지 않습니다.

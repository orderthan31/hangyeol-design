# 한결디자인 · Hangyeol

React UI를 소비 프로젝트에 **편집 가능한 로컬 소스**로 설치하는 디자인 시스템입니다. 지원 adapter는 React 19 · Vite · Tailwind 4입니다. `@orderthan31/hangyeol-core`는 개발 도구이며 UI 런타임 import 대상이 아닙니다. 현재 후보는 guarded/UNLICENSED이고 발행하지 않습니다.

## 두 개의 workspace

- `packages/core/src/ui`: 재사용 UI·foundation·helper의 유일한 작성 원본.
- `packages/core/src/tools`: init/add, 안전한 파일 transaction, lint, tokens.
- `packages/core/registry/items.json`: 선택 설치 source/dependency graph.
- `packages/core/assets/fonts`: 원본 Pretendard 파일·라이선스·provenance.
- `packages/core/test`: 도구 계약과 `ui/` 컴포넌트 회귀 테스트.
- `apps/docs`: 실제 설치된 core CLI가 생성한 `src/hangyeol`을 소비하는 문서 앱.

루트 prototype 앱, 별도 UI/CLI workspace와 중복 registry는 제거했습니다. Docs는 `main.tsx → docs-app.tsx`로 시작합니다. `docs/`에는 라이브러리 계약과 역사 checkpoint 문서가 있습니다. 역사 checkpoint는 현행 디렉터리 구조나 현재 검증 결과를 대신하지 않습니다.

## 개발과 검사

Node 22.22.2/npm으로 실행합니다.

```sh
npm ci
npm run build
npm run typecheck
npm test
npm run lint:slice
npm run dev
```

`build`는 core를 빌드한 다음 **설치된** `node_modules/.bin/hangyeol`로 Docs init/add를 실행하고 Docs를 빌드합니다. 선택 목록은 설치된 payload의 전체 registry에서 도출합니다. Docs의 `@orderthan31/hangyeol-core` devDependency는 workspace 버전과 정확히 일치합니다. UI runtime은 core 원본이나 payload를 직접 import하지 않습니다.

생성된 source를 묵시적으로 덮어쓰지 않습니다. canonical UI 변경 후 기존 Docs 파일과 차이가 나면 generate가 conflict로 중단합니다. 변경 계획과 소유권을 검토한 뒤 명시적으로 마이그레이션하세요. `hangyeol.json`의 hash를 손으로 수정해 변경을 채택하지 마세요.

`npm test`는 source 계약·실제 pack 검사·JSDOM UI·Docs 코드 예제를 검사합니다. 임시 증거는 repo 밖 `TMPDIR` 또는 `HANGYEOL_TEST_EVIDENCE_DIR`에 생성됩니다. 추가 offline dependency fixtures는 다음 명령으로 실행하며 준비된 cache가 필요합니다.

```sh
npm run test:integration -w @orderthan31/hangyeol-core
```

브라우저/Playwright/E2E/AT 검증은 위 명령에 포함되지 않습니다. 디자인 lint의 기존 findings는 실패로 보고하며 rule을 끄지 않습니다.

## 독립 소비

[설치 안내](docs/source-installation.md#core11-quickstart)와 [core 계약](packages/core/README.md)을 참고하세요. 로컬 pack 결과를 소비 프로젝트의 exact devDependency로 설치한 뒤 **해당 프로젝트에 설치된 bin**만 사용합니다.

```sh
./node_modules/.bin/hangyeol init --dry-run
./node_modules/.bin/hangyeol init
./node_modules/.bin/hangyeol add text-field
./node_modules/.bin/hangyeol doctor
```

기본 설정은 `hangyeol.json`, source는 `src/hangyeol`, 스타일은 `src/hangyeol.css`, 글꼴은 `public/fonts/hangyeol`입니다. 테마 scope는 `data-hangyeol`이며 기존 `g-*` semantic token/utility 이름은 유지합니다. `init/add`는 필요한 runtime 의존성을 소비 앱에 직접 선언합니다. Chart 선택 시 Recharts와 react-is도 포함합니다.

소비자의 편집, theme, palette, helper를 자동 reset하지 않습니다. update/diff/apply engine은 지원하지 않습니다. tarball 검증이나 prepared dependency 소비 빌드는 공개 registry/빈 cache 이식성·배포·브라우저 시각 검증을 뜻하지 않습니다.

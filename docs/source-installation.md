# Hangyeol — 설치와 사용

<a id="core11-quickstart"></a>
## 현재 quickstart — installed core → editable source (CORE-11)

현재 소비 경로는 guarded/UNLICENSED `@orderthan31/hangyeol-core`를 devDependency로 설치한 뒤 로컬 bin으로 source를 생성하는 방식입니다. 공개 배포나 라이선스 부여를 뜻하지 않습니다.

### 1. 실제 tarball과 독립 host 준비

지원 adapter는 React 19/Vite/Tailwind 4이고, 재현 환경은 Node 22.22.2/npm 10.9.7입니다.
아래 exact 버전은 현재 packed manifest 및 검증 host 기준입니다. 새로운 framework,
Tailwind 3, registry의 최신 버전으로 임의 치환한 결과까지 보증하지 않습니다.

작성자에게서 **실제로 만든 동일 후보 tarball**과 SHA256/SRI·sourceRevision을 받으세요.
작성 repository의 `packages/core` build/pack이 후보 생성 경로이며, owner 검증에서는
canonical source를 별도 scratch build-root에 복사하여 동일 build.mjs로 pack합니다.
그때 build-only dependency link는 별개이고 아래 소비 host에는 workspace/link/hoisting을
쓰지 않습니다. Docs는 workspace에 설치된 core를 통해 전체 라이브러리를 소비합니다.
없는 Release 다운로드 주소나 미래 API를 실행 예제로 제공하지 않습니다.

repository 밖의 새 disposable 폴더를 만들고 그 안에서 진행합니다. `CORE_TGZ`에는
받은 실제 `.tgz`의 **절대 경로**를 지정하세요. `NPM_CACHE`도 준비된 cache의 절대 경로입니다.
두 값은 아래 명령 전에 shell 환경변수로 설정해야 합니다. 경로/파일명은 pack 결과로
확정하며 단순 문서상의 가상 파일을 설치하지 않습니다. `NODE_PATH`를 제거하세요.
Offline install은 해당 cache에 모든 pinned dependency가 있을 때만 성공합니다.
없는 cache/registry/Release/VPS 이식성은 미검증이며, 실패를 성공으로 바꾸지 않습니다.

빈 host에 다음 `package.json`을 만듭니다. npm install 자체는 UI를 생성하지 않습니다.

<!-- core11-replay: file package.json -->
```json
{
  "name": "hangyeol-core11-quickstart",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "clsx": "2.1.1",
    "tailwind-merge": "3.7.0"
  },
  "devDependencies": {
    "vite": "7.3.6",
    "typescript": "5.9.3",
    "tailwindcss": "4.3.3",
    "@tailwindcss/vite": "4.3.3",
    "@types/react": "19.2.2",
    "@types/react-dom": "19.2.2"
  }
}
```

아래 strict `tsconfig.json`을 만듭니다. `vite/client`는 CSS import 타입을 제공합니다.
`src` 폴더를 만들고, 아래 entry는 3단계에서 추가합니다. Vite/Tailwind 연결은 init이
정적 설정으로 준비합니다. 기존 host는 dry-run에서 계획과 backup을 먼저 확인하세요.

<!-- core11-replay: file tsconfig.json -->
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["vite/client"],
    "lib": ["ES2022", "DOM"]
  },
  "include": ["src"]
}
```

<!-- core11-replay: shell -->
```sh
: "${CORE_TGZ:?Set the absolute path of the real packed core tarball}"
: "${NPM_CACHE:?Set the absolute path of the prepared dependency cache}"
unset NODE_PATH
mkdir -p src
npm install --save-dev --save-exact "$CORE_TGZ" --cache "$NPM_CACHE" --offline --ignore-scripts --no-audit --no-fund
```

`package.json`의 core는 exact `file:` devDependency이며 package-lock의 version/resolved/SRI와
물리 `node_modules/@orderthan31/hangyeol-core`, local bin을 대응해 보관합니다. UI가 core를 runtime
import하는 모델이 아닙니다. 설치 명령 이후 `hangyeol.json`/생성 UI가 아직 없음을 확인합니다.

### 2. installed local bin으로만 init/add

<!-- core11-replay: shell -->
```sh
./node_modules/.bin/hangyeol --version
./node_modules/.bin/hangyeol init --dry-run
./node_modules/.bin/hangyeol init
./node_modules/.bin/hangyeol add text-field --dry-run
./node_modules/.bin/hangyeol add text-field
./node_modules/.bin/hangyeol lint
./node_modules/.bin/hangyeol tokens
./node_modules/.bin/hangyeol doctor
```

`hangyeol`이 실제 bin이고 현재 후보 version은 `0.0.1`입니다. 기본 sourceRoot는
`src/hangyeol`, entry CSS는 `src/hangyeol.css`, font binary/라이선스/provenance는
`public/fonts/hangyeol`입니다. `text-field`는 선택 closure인 Button/Input/FormField도 설치합니다.
별도 컴포넌트를 추가할 때는 지원 registry graph를 확인하며 과거 75개를 현재 core 지원
목록으로 간주하지 않습니다. 필요 runtime/build/type dependency를 미리 exact 설치한
위 host에서는 init/add가 npm을 추가 호출하지 않습니다. 기존 host에서 의존성이 없으면
installer의 dependency 계획을 먼저 확인하세요. 위 순서는 standalone npx가 아닙니다.

### 3. 로컬 소스를 import하고 직접 편집

다음 `index.html`과 `src/main.tsx`를 만듭니다. CSS는 한 번만 entry에서 import하며
core/CLI 또는 authoring docs CSS를 UI runtime에서 가져오지 않습니다.

<!-- core11-replay: file index.html -->
```html
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

<!-- core11-replay: file src/main.tsx -->
```tsx
import { createRoot } from 'react-dom/client';
import { TextField, quickstartFieldMarker } from './hangyeol/components/text-field';
import { cn, quickstartCnMarker } from './hangyeol/lib/cn';
import './hangyeol.css';

createRoot(document.getElementById('root')!).render(
  <main data-hangyeol data-theme="light" data-palette="Owner" className={cn('grid', 'gap-3')}>
    <TextField
      id="quickstart-name"
      label={quickstartCnMarker + quickstartFieldMarker}
      name="name"
      required
      clearable
      defaultValue="소비자가 정한 초기값"
    />
  </main>,
);
```

설치된 `src/hangyeol/lib/cn.ts`와 `src/hangyeol/components/text-field.tsx`의 끝에 각각 아래를
추가하세요. 단순 marker도 실제 편집→import→build 경로를 확인합니다. 원 코드와 native
props/이벤트/disabled/readOnly 계약을 유지한 채 소비자 필요에 맞게 직접 수정할 수 있습니다.

<!-- core11-replay: append src/hangyeol/lib/cn.ts -->
```ts
export const quickstartCnMarker = 'CORE11_README_CN';
```

<!-- core11-replay: append src/hangyeol/components/text-field.tsx -->
```ts
export const quickstartFieldMarker = 'CORE11_README_FIELD';
```

### 4. 색상/팔레트는 소비자가 소유

`src/hangyeol/foundation/theme.css` 끝에 다음을 추가하세요. 기존 theme/input 값을 강제로
reset하거나 core를 재설치해서 덮어쓰지 않습니다. 이 예제는 partial override와 새 Owner
palette이며, 소비자는 모든 색 수정·부분 override·전체 교체·추가 palette를 선택할 수
있습니다. Indigo/Silver/Forest/Amber/Rose는 editable preset이지 공식색 whitelist가 아닙니다.

<!-- core11-replay: append src/hangyeol/foundation/theme.css -->
```css
[data-hangyeol] { --g-surface: #654321; --g-danger: rebeccapurple; }
[data-hangyeol][data-palette="Owner"] { --g-action: #a16207; }
```

CSS `data-palette` selector가 위 Owner 색상을 적용합니다. token tool에서도 Owner palette를
선택하려면 아래 데이터를 기존 `hangyeol.json`에 **병합**합니다. `installed`/path/core identity와
기존 owner 필드는 유지하세요. 원 config 전체를 이 조각으로 교체하면 안 됩니다.

<!-- core11-replay: merge hangyeol.json -->
```json
{ "tokens": { "palette": "Owner" } }
```

### 5. 읽기 전용 검사와 실제 local build

<!-- core11-replay: shell -->
```sh
./node_modules/.bin/hangyeol lint
./node_modules/.bin/hangyeol tokens
./node_modules/.bin/hangyeol doctor
./node_modules/.bin/tsc -p tsconfig.json --pretty false
./node_modules/.bin/vite build
```

이 두 build bin도 host node_modules에서 resolve해야 합니다. 번들의 `CORE11_README_CN`,
`CORE11_README_FIELD`와 CSS의 `--g-surface:#654321`로 편집 결과가 실제 포함됐는지
확인합니다. UI bundle은 local cn/TextField 및 React dependency를 사용하고 core runtime을
요구하지 않습니다. 이 build는 disposable consumer build이지 canonical default build의
과거 FAIL을 소급 PASS로 바꾸는 명령이 아닙니다. font HTTP/FontFace·브라우저·AT·Docs Reset은
미실행이며 compiled CSS가 browser acceptance를 대신하지 않습니다.

`lint`는 설정된 sourceRoot의 지원 정적 문법을 읽기 전용 검사하며 app 전체를 무조건
검사하지 않습니다. `tokens`는 actual consumer CSS/typed roles를 검증하고 owner 색을
reset하지 않습니다. `doctor`는 설치 연결 검사이지 compiler 실행/자동 수리 기능이 아닙니다.
수정된 helper/theme/UI가 informational로 보고될 수 있으며 자동 hash adoption은 없습니다.
현재 pinned @shadcn/lint는 packed policy의 components.json 경로에 대해 grammar 관련 경고를
stderr에 출력할 수 있습니다. 이를 숨기거나 경고를 근거로 actual 검사라고 가정하지 않습니다.
이 host에서는 JSON report의 `compiler.mode: "actual"`, `fallback: "none"`과 actual
Tailwind4.3.3 compile/build·빈 diagnostics를 직접 확인했습니다. npm install의 pinned
ESLint deprecated 경고도 원 로그에 남으며 임의 tooling 버전 변경으로 덮지 않습니다.

### 6. 미지원/충돌/미설치 결과를 성공과 구분

편집한 TextField를 다시 기본 `add text-field`하면 conflict/nonzero이며 owner source를
덮어쓰지 않습니다. 필요할 때 dry-run과 명시 overwrite/backup 계획을 확인하세요.
`update`의 plan/diff/apply engine과 consumer source Reset은 미구현이며 unsupported/nonzero입니다.
CLI 오류를 무시하거나 command exit를 성공으로 재해석하지 않습니다. core가 없는 별도
host에서 `./node_modules/.bin/hangyeol --version`은 missing local bin으로 nonzero(현재
/bin/sh에서126, shell에따라127)이며 registry 다운로드/설치 prompt/fallback을 하지 않습니다.
일반 커널 network audit나 모든 비신뢰 입력 보안을 인증한 결과는 아닙니다.

기존 source/AGENTS/WIP/라이선스·font provenance와 원 실패 이력은 보존합니다. 공개 배포,
Release 다운로드, 제품 통합, S2 전체 demo/최종 수락은 이 quickstart 완료와 별개입니다.

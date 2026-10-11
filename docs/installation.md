# 설치하기

[처음으로](../README.md) · [컴포넌트](components.md) · [CLI](cli.md)

이 안내는 GitHub Packages의 **`@orderthan31/hangyeol-core@0.0.1`**을 설치하고, React UI 소스를 프로젝트 안에 생성하는 절차입니다. 패키지를 UI 런타임에서 import하지 않습니다.

> 자체 코드와 UI 소스는 [UNLICENSED](../packages/core/LICENSE)입니다. 공개 패키지라는 사실이 외부 사용·수정·재배포 권한을 부여하지 않습니다. 권한을 확인한 뒤 진행하세요.

## 지원 환경

| 도구 | 이 예제의 고정 버전 |
| --- | --- |
| Node.js / npm | 22.22.2 / 10.9.7 (Node.js 최소 22.12) |
| React / React DOM | 19.2.0 |
| TypeScript | 5.9.3 |
| Vite | 7.3.6 |
| Tailwind CSS / `@tailwindcss/vite` | 4.3.3 |
| `@types/react` / `@types/react-dom` | 19.2.2 |
| `clsx` / `tailwind-merge` | 2.1.1 / 3.7.0 |

지원 어댑터는 React 19 / Vite / Tailwind 4입니다. 아래 예제는 버전을 고정하며 최신 템플릿 생성기를 사용하지 않습니다. 다른 프레임워크와 임의의 Vite 설정 조합을 지원한다는 뜻은 아닙니다.

<a id="authentication"></a>
## 1. GitHub Packages 인증

**공개 npm 패키지도 인증이 필요합니다.** 로컬에서는 `read:packages` 권한이 있는 GitHub personal access token **(classic)**을 준비합니다. npm 9 이상에서는 다음 대화형 로그인을 사용합니다.

```sh
npm login --scope=@orderthan31 --auth-type=legacy --registry=https://npm.pkg.github.com
```

Username에는 GitHub 사용자 이름, Password 프롬프트에는 토큰을 입력합니다. 토큰을 명령 인수·소스·문서·로그에 넣거나 인증 설정을 커밋하지 마세요.

scope 연결이 없다면 다음을 실행합니다. 기본 레지스트리는 `https://registry.npmjs.org`로 유지하고, **`@orderthan31` 범위만** GitHub Packages로 보냅니다. 전체 레지스트리를 GitHub Packages로 변경하지 않습니다.

```sh
npm config set @orderthan31:registry https://npm.pkg.github.com
```

GitHub Actions에서는 `packages: read` 권한의 `GITHUB_TOKEN`을 사용할 수 있습니다. 워크플로 저장소에 해당 패키지의 읽기 접근 권한도 필요할 수 있습니다. 공개 여부와 인증·접근 권한은 별개입니다. 자세한 설정은 [GitHub 공식 npm 레지스트리 안내](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)를 참고하세요.

<a id="new-project"></a>
## 2. 새 프로젝트 준비

**새 빈 디렉터리에서만** 아래 파일을 만드세요. 기존 앱에 이 파일들을 통째로 덮어쓰지 않습니다. 기존 앱은 [기존 프로젝트 연결](#existing-project)을 따르세요.

```sh
mkdir hangyeol-app
cd hangyeol-app
mkdir src
```

### `package.json`

```json
{
  "name": "hangyeol-app",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "typecheck": "tsc -p tsconfig.json --pretty false",
    "build": "tsc -p tsconfig.json && vite build"
  },
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

### `tsconfig.json`

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

### `index.html`

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>한결 앱</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Vite 설정과 Tailwind 연결은 다음 `init` 단계에서 생성합니다. 이 예제에 별도 React Vite 플러그인 설정을 추가할 필요는 없습니다.

## 3. 도구 설치와 UI 생성

```sh
npm install --save-dev --save-exact @orderthan31/hangyeol-core@0.0.1
./node_modules/.bin/hangyeol --version
./node_modules/.bin/hangyeol init --dry-run
./node_modules/.bin/hangyeol init
./node_modules/.bin/hangyeol add theme text-field button --dry-run
./node_modules/.bin/hangyeol add theme text-field button
```

각 dry-run의 파일·의존성 계획을 확인한 뒤 실제 명령을 실행하세요. CLI 버전은 `0.0.1`이어야 합니다. 모든 CLI 명령은 **현재 프로젝트에 설치된 bin**을 사용합니다. 전역 CLI나 실행 시 패키지를 다시 내려받는 방식으로 대체하지 않습니다.

- `npm install`: 개발 도구를 설치합니다. 아직 UI를 생성하지 않습니다.
- `init`: `hangyeol.json`, 진입 CSS, 테마 CSS, 글꼴, 공통 헬퍼와 지원 호스트 연결을 준비합니다.
- `add`: 선택한 항목과 의존 관계를 따라 필요한 소스를 설치합니다. `text-field`에는 Input·Button·FormField가 필요합니다. 예제에서 사용하는 **Theme도 명시적으로 선택**합니다.
- 필요한 runtime/build/type 의존성은 소비 프로젝트에 직접 선언됩니다. 누락된 의존성 설치에 npm이 실행될 수 있으므로 네트워크와 설치 권한을 준비하세요.

기본 생성 경로:

| 경로 | 역할 |
| --- | --- |
| `hangyeol.json` | 설치 설정과 소유권 기록 |
| `src/hangyeol` | 편집 가능한 컴포넌트·테마·헬퍼 |
| `src/hangyeol.css` | 앱이 한 번 import할 진입 스타일 |
| `public/fonts/hangyeol` | Pretendard 글꼴과 라이선스·출처 고지 |

## 4. 로컬 컴포넌트 연결

### `src/hangyeol/App.tsx`

아래 예제는 린트 검사 범위인 `src/hangyeol` 안에 둡니다. Theme가 전체 범위를 감싸고, 내부 요소가 레이아웃을 담당합니다.

```tsx
import { Theme } from './foundation/theme';
import { TextField } from './components/text-field';
import { Button } from './primitives/button';

export function App() {
  return (
    <Theme mode="light" palette="Indigo">
      <div className="grid gap-4 p-6">
        <TextField label="이름" name="name" defaultValue="김한결" clearable />
        <Button type="button">확인</Button>
      </div>
    </Theme>
  );
}
```

### `src/main.tsx`

```tsx
import { createRoot } from 'react-dom/client';
import { App } from './hangyeol/App';
import './hangyeol.css';

createRoot(document.getElementById('root')!).render(<App />);
```

UI는 로컬 소스에서 가져옵니다. `@orderthan31/hangyeol-core`에서 React 컴포넌트를 가져오지 않습니다. sourceRoot나 stylePath를 변경했다면 import도 맞춰야 합니다.

## 5. 검사와 실행

```sh
./node_modules/.bin/hangyeol inspect
./node_modules/.bin/hangyeol doctor
./node_modules/.bin/hangyeol tokens validate
./node_modules/.bin/hangyeol lint
./node_modules/.bin/tsc -p tsconfig.json --pretty false
./node_modules/.bin/vite build
```

검사를 마친 뒤 로컬 개발 서버를 실행합니다.

```sh
npm run dev
```

검사는 설치 연결·지원 정적 문법·타입·번들을 각각 확인합니다. 브라우저 시각 품질이나 접근성을 자동 인증하지 않습니다. [각 명령의 검사 범위](cli.md)를 확인하세요. 생성된 lockfile은 보관하고 이후 의존성 복원에 `npm ci`를 사용합니다.

<a id="existing-project"></a>
## 기존 프로젝트 연결

1. 변경 사항을 먼저 보관하고 React 19 / Vite / Tailwind 4 및 Node 버전을 확인합니다.
2. 인증 후 정확한 패키지 버전을 devDependency로 설치합니다. 위의 `package.json`, `tsconfig.json`, 진입 파일을 기존 파일에 덮어쓰지 않습니다.
3. `./node_modules/.bin/hangyeol init --dry-run`으로 경로·스타일·호스트 설정·의존성 변경 계획을 검토합니다.
4. 지원되는 정적 설정인지 확인한 후에만 `init`을 실행합니다. 임의의 플러그인, 동적 설정, 관리 중인 설정의 변경은 거부될 수 있습니다. 검사를 우회하지 말고 호스트 설정을 별도로 검토하세요.
5. 필요한 항목을 `add … --dry-run`으로 확인한 뒤 설치합니다. 기존 UI와 진입 CSS 연결은 앱 구조에 맞게 병합합니다.
6. `doctor`, 토큰 검사, 린트, 프로젝트의 타입 검사·빌드를 실행합니다.

충돌이 나면 멈추고 대상 파일을 비교하세요. `hangyeol.json`의 hash를 수동 변경해 편집을 숨기거나, 설정 파일을 지워 재설치를 강제하지 않습니다. 설치 도구의 파일 복구는 의존성 설치 전체를 롤백하는 기능이 아닙니다.

## 테마·글꼴과 편집

설치된 `foundation/theme.tsx`와 `foundation/theme.css`를 기준으로 컴포넌트·의미 토큰을 직접 편집합니다. `Theme`은 `light` / `dark` 모드, 팔레트와 토큰 값을 다룹니다. Indigo·Silver·Forest·Amber·Rose 프리셋 외에도 사용자 팔레트를 추가할 수 있습니다. 일부 값만 수정하거나 팔레트를 교체할 때도 기존 소유권 기록을 유지하세요.

Pretendard는 프로젝트의 public 경로에서 제공됩니다. 배포 시 public 디렉터리와 글꼴의 [라이선스 고지](../packages/core/THIRD_PARTY_NOTICES.md)를 함께 보존하고, 경로·base 설정을 바꿨다면 실제 서비스에서 글꼴 요청을 확인하세요.

## 문제 해결

- **인증 오류:** scope 연결, classic 토큰의 `read:packages` 권한, 조직 접근 정책을 확인합니다. 토큰을 오류 보고에 붙이지 마세요.
- **로컬 bin 없음:** 해당 프로젝트에 패키지가 devDependency로 설치됐는지 확인합니다. 전역 실행으로 우회하지 않습니다.
- **호스트 설정 거부:** dry-run 메시지와 기존 Vite 설정을 검토합니다. 모든 Vite 플러그인 조합을 자동 병합하지 않습니다.
- **파일 충돌:** 편집 내용을 보관하고 변경 파일·설치 계획을 비교합니다. 자동 업데이트·reset 명령은 없습니다.
- **린트 컴파일러 사용 불가:** 지원하는 Tailwind 의존성과 버전을 확인합니다. 검사 미실행은 통과가 아닙니다.

[이전 오프라인 소스 설치 기록](source-installation.md)은 과거 재현용 문서입니다. 새 GitHub Packages 설치는 이 안내를 기준으로 진행하세요.

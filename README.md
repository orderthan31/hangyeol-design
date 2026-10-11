# 한결디자인 · Hangyeol

React UI를 프로젝트에 **편집 가능한 로컬 소스**로 설치하는 디자인 시스템입니다. 필요한 UI만 선택하고, 컴포넌트와 테마를 애플리케이션 코드처럼 직접 수정합니다.

`@orderthan31/hangyeol-core@0.0.1`은 GitHub Packages에 공개되어 있습니다. 이 패키지는 **소스 설치용 개발 도구**이며, 애플리케이션에서 import하는 UI 런타임 라이브러리가 아닙니다.

> **사용 전 확인:** 공개 패키지도 GitHub Packages 인증이 필요합니다. 자체 코드와 UI 소스는 **UNLICENSED**이며, 공개 열람·다운로드가 외부 사용이나 재배포 권한을 부여하지 않습니다. [라이선스](packages/core/LICENSE)를 먼저 확인하세요.

## 문서

- [설치하기](docs/installation.md) — 인증, 새 프로젝트 전체 설정, 기존 프로젝트 연결
- [컴포넌트 카탈로그](docs/components.md) — 선택 가능한 전체 항목, export 이름, 소스와 의존성
- [CLI 사용법](docs/cli.md) — 설치·검사·토큰·린트 명령과 한계
- [개발 가이드](docs/development.md) — 저장소 구조, 로컬 문서 앱, 테스트
- [패키지 도구 계약 (English)](packages/core/README.md)

## 빠르게 시작하기

지원 환경은 **React 19 · Vite · Tailwind CSS 4**입니다. Node.js **22.12 이상**이 필요하며, 재현 기준은 **Node.js 22.22.2 / npm 10.9.7**입니다. 새 프로젝트라면 [고정 버전으로 만드는 설치 안내](docs/installation.md#new-project)부터 진행하세요. 다른 프레임워크용 어댑터는 지원하지 않습니다.

아래는 지원 환경과 GitHub Packages 인증을 준비한 프로젝트에서 실행합니다. 기본 npm 레지스트리는 npmjs로 유지하고 `@orderthan31` 범위만 GitHub Packages에 연결합니다. [인증 안내](docs/installation.md#authentication)를 참고하세요.

```sh
npm install --save-dev --save-exact @orderthan31/hangyeol-core@0.0.1
./node_modules/.bin/hangyeol --version
./node_modules/.bin/hangyeol init --dry-run
./node_modules/.bin/hangyeol init
./node_modules/.bin/hangyeol add theme text-field button --dry-run
./node_modules/.bin/hangyeol add theme text-field button
```

패키지 설치만으로 UI 파일이 생기지는 않습니다. `init`이 설정·스타일·글꼴·공통 헬퍼를 준비하고, `add`가 선택한 항목과 필요한 하위 항목을 설치합니다. 기존 프로젝트는 dry-run 결과와 충돌·백업 계획을 먼저 검토하세요.

### 로컬 컴포넌트 사용

`src/hangyeol/App.tsx`에 작성합니다. 이 위치는 기본 린트 검사 범위에 포함됩니다.

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

`src/main.tsx`에서 앱을 연결하고 진입 스타일을 한 번 가져옵니다.

```tsx
import { createRoot } from 'react-dom/client';
import { App } from './hangyeol/App';
import './hangyeol.css';

createRoot(document.getElementById('root')!).render(<App />);
```

`index.html`과 TypeScript 설정은 [전체 설치 예제](docs/installation.md#new-project)에 있습니다. 경로를 바꿨다면 import 경로도 함께 조정하세요. UI 코드에서 `@orderthan31/hangyeol-core`를 import하지 않습니다.

```sh
./node_modules/.bin/hangyeol inspect
./node_modules/.bin/hangyeol doctor
./node_modules/.bin/hangyeol tokens validate
./node_modules/.bin/hangyeol lint
./node_modules/.bin/tsc -p tsconfig.json --pretty false
./node_modules/.bin/vite build
```

## 제공 항목

레지스트리의 **84개 선택 설치 항목**에는 테마, 기본 요소, 복합 UI, 문서용 보조 요소가 포함됩니다. 독립 위젯 84개라는 뜻은 아닙니다. 한 항목이 여러 컴포넌트나 헬퍼를 내보낼 수 있습니다.

| 분류 | 대표 항목 |
| --- | --- |
| 테마·레이아웃 | Theme, Stack, Row, Container, Grid, Shell |
| 기본 요소·동작 | Button, IconButton, Icon, Badge, Link |
| 입력·선택 | TextField, SearchField, PasswordInput, Select, Combobox, MultiSelect, AddressField |
| 날짜·시간 | DatePicker, MonthPicker, TimeInput, DateTimeInput, DateRangePicker |
| 탐색·목록 | Tabs, Breadcrumb, GNB, LNB, ListPanel, Pagination |
| 오버레이·피드백 | Dialog, Drawer, BottomSheet, Tooltip, Toast, Alert, Result |
| 데이터·문서 보조 | Table, DataTable, Chart, CodeBlock, PalettePicker, PreviewSurface, Specimen |

[전체 카탈로그에서 설치 이름과 실제 export를 확인하세요.](docs/components.md) Radix 기반 구성 요소와 Chart 등은 선택 시 필요한 런타임 의존성을 소비 프로젝트에 선언합니다.

## 테마와 소스 소유권

기본 경로는 설정 `hangyeol.json`, 소스 `src/hangyeol`, 진입 스타일 `src/hangyeol.css`, 글꼴 `public/fonts/hangyeol`입니다. Pretendard 글꼴과 라이선스 고지를 프로젝트 안에 설치합니다.

`Theme`은 밝은·어두운 모드와 팔레트 범위를 제공합니다. Indigo·Silver·Forest·Amber·Rose는 수정 가능한 프리셋이며 팔레트 이름을 제한하는 목록이 아닙니다. 설치된 컴포넌트·헬퍼·테마를 직접 편집할 수 있고, 재설치가 사용자 편집을 자동 초기화하지 않습니다. 일반적인 소스 업데이트·diff/apply·reset 엔진은 제공하지 않습니다.

정적 검사와 빌드 통과는 브라우저 모양, 키보드 동작, 색상 대비, 보조공학 접근성 검증을 대신하지 않습니다. 자세한 검사 범위는 [CLI 안내](docs/cli.md)에 있습니다.

## 라이선스

자체 코드와 UI 소스는 [UNLICENSED](packages/core/LICENSE)입니다. 외부 사용·수정·재배포 권한이 별도로 부여되지 않았습니다. 포함된 글꼴은 SIL Open Font License 1.1 및 원저작자 고지를 유지합니다. [서드파티 고지](packages/core/THIRD_PARTY_NOTICES.md)를 함께 확인하세요.

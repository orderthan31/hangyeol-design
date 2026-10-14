# CLI 사용법

[처음으로](../README.md) · [설치하기](installation.md) · [컴포넌트](components.md)

`hangyeol`은 `@orderthan31/hangyeol-core@0.0.1`에 포함된 **소스 설치·검사 도구**입니다. 모든 명령은 소비 프로젝트 루트에서 해당 프로젝트의 `./node_modules/.bin/hangyeol`로 실행합니다. UI 런타임에서는 설치된 로컬 컴포넌트를 사용합니다.

## 명령 요약

| 명령 | 역할 | 변경 여부 |
| --- | --- | --- |
| `--version` | 설치된 도구 버전 확인 | 읽기 전용 |
| `--help` | 지원 명령 확인 | 읽기 전용 |
| `inspect` | 패키지 payload·도구의 identity와 hash 검사 | 읽기 전용 |
| `doctor` | 소비 프로젝트의 설치·의존성·소스·호스트 연결 검사 | 읽기 전용 |
| `init --dry-run` | 초기 설정과 파일·의존성 계획 확인 | 계획만 출력 |
| `init` | 지원 호스트 설정·스타일·글꼴·헬퍼 준비 | 파일·의존성 변경 가능 |
| `add <이름…> --dry-run` | 선택 항목과 하위 의존성 설치 계획 확인 | 계획만 출력 |
| `add <이름…>` | 선택 항목과 필요한 소스 설치 | 파일·의존성 변경 가능 |
| `lint` | 설정된 sourceRoot의 정적 디자인 규칙 검사 | 읽기 전용 |
| `lint inspect` | 도구의 린트 정책 확인 | 읽기 전용, 소비 코드 검사는 아님 |
| `tokens` / `tokens validate` | 소비 프로젝트 CSS·의미 토큰 검증 | 읽기 전용 |
| `tokens inspect` | 토큰 도구 정책과 메타데이터 확인 | 읽기 전용 |
| `tokens presets` | 기본 팔레트 정보 확인 | 읽기 전용 |
| `tokens export` | 토큰 데이터 내보내기 | 기본 출력만; 명시적 `--output`은 파일 생성 가능 |

## 설치

[전체 설치 안내](installation.md)에 따라 인증과 지원 호스트를 준비한 뒤 실행합니다.

```sh
./node_modules/.bin/hangyeol init --dry-run
./node_modules/.bin/hangyeol init
./node_modules/.bin/hangyeol add theme text-field button --dry-run
./node_modules/.bin/hangyeol add theme text-field button
```

`add`의 이름은 [카탈로그](components.md)의 CLI 이름입니다. 컴포넌트 export 이름이나 모든 내부 파일명이 설치 이름인 것은 아닙니다. 파일·의존성 계획을 확인하고 충돌을 해결한 뒤 실행하세요. 누락 의존성 설치에 npm이 호출될 수 있습니다.

기본 설정은 `hangyeol.json`이며 `src/hangyeol`, `src/hangyeol.css`, `public/fonts/hangyeol`을 사용합니다. 경로·기존 정적 Vite 설정을 검사하므로 임의의 호스트 설정을 자동 변환해 주지는 않습니다.

동적 `mode/loadEnv` host 지원은 [별도 adapter 후보 안내](dynamic-vite-adapter.md)를 확인하세요. 미발행 후보의 기능이며 기존 registry `0.0.1`이 해당 문법을 지원한다는 뜻은 아닙니다.

## 검사

```sh
./node_modules/.bin/hangyeol inspect
./node_modules/.bin/hangyeol doctor
./node_modules/.bin/hangyeol tokens validate
./node_modules/.bin/hangyeol lint
```

### inspect와 doctor

`inspect`는 설치된 도구·payload 자체를 확인합니다. `doctor`는 소비 프로젝트의 설정, 설치 파일, 의존성과 지원되는 정적 호스트 연결을 확인합니다. **doctor는 컴파일러도 자동 수리 도구도 아닙니다.** 사용자 소스 편집은 정보로 보고될 수 있으며, 소유권 hash를 자동으로 갱신해 편집 사실을 숨기지 않습니다.

### lint

`lint`는 `hangyeol.json`의 `sourceRoot` 아래 지원되는 `.ts` / `.tsx` 정적 문법을 검사합니다. 앱 전체를 무조건 검사하지 않습니다. 예제 코드를 `src/hangyeol/App.tsx`에 두는 이유도 이 범위에 포함하기 위해서입니다.

지원 호스트의 Tailwind 컴파일러를 실제 사용합니다. 컴파일러가 없거나 실행되지 않았으면 통과가 아닙니다. `lint inspect`의 정책 출력은 소비 코드 검사를 대신하지 않습니다. 진단과 종료 코드를 함께 확인하고, 실패를 숨기기 위해 규칙을 끄지 마세요.

고정된 `@shadcn/lint`가 자체 정책 CSS 경로에 대해 bundled grammar 경고를 출력할 수 있습니다. 이 경고와 한결의 소비 CSS 컴파일러 결과는 구분해서 읽으세요. 실제 검사 여부는 JSON 보고서의 `compiler.mode`, `compiler.fallback`과 `diagnostics`를 확인하며, 경고를 숨기거나 정책 출력만으로 통과를 판단하지 않습니다.

### tokens

```sh
./node_modules/.bin/hangyeol tokens inspect
./node_modules/.bin/hangyeol tokens presets
./node_modules/.bin/hangyeol tokens validate
./node_modules/.bin/hangyeol tokens export --format json
```

토큰 검증은 실제 소비 CSS와 타입이 정의된 의미 역할을 확인합니다. 사용자 색상을 기본값으로 되돌리는 명령이 아닙니다. 기본 팔레트는 수정 가능한 시작점이며 사용자 팔레트를 제한하지 않습니다. 위 export 명령은 표준 출력으로 데이터를 내보냅니다. 파일 출력이 필요하다면 도구가 허용하는 새 경로를 명시적으로 지정하고 기존 파일 보존 여부를 확인하세요.

## 별도로 실행할 검사

```sh
./node_modules/.bin/tsc -p tsconfig.json --pretty false
./node_modules/.bin/vite build
```

타입 검사와 번들 생성은 별도 단계입니다. 이 명령들이 통과해도 다음을 인증하지 않습니다.

- 동적으로 만든 모든 class 문자열과 임의의 호스트 CSS 재정의
- 브라우저 CSS 우선순위·실제 렌더링·반응형 모양
- 키보드·포커스·색상 대비·스크린리더 등 보조공학 동작
- 모든 프레임워크·플러그인 조합이나 배포 환경

실제 서비스의 브라우저·접근성 검증은 별도로 수행하세요.

## 편집과 충돌 처리

설치된 컴포넌트·헬퍼·테마를 직접 수정할 수 있습니다. 기본 `add`가 편집 파일과 충돌하면 자동 덮어쓰기 대신 오류로 중단합니다. 변경 내용을 먼저 보관하고 dry-run과 파일별 계획을 검토하세요. 소유권 기록을 손으로 바꾸거나 삭제해 검사를 우회하지 않습니다.

일반적인 `list`, `update`, `reset`, `diff`, `apply` 명령은 제공하지 않습니다. 설치 항목 목록은 카탈로그 또는 레지스트리를 확인하세요. 새 패키지 버전을 설치하는 것과 이미 편집한 UI 소스를 마이그레이션하는 것은 별개입니다.

설치 도구의 파일 복구는 제한된 범위에서 동작합니다. npm 의존성 설치 전체 롤백, 충돌 경쟁·프로세스 중단 등 모든 상황의 원자적 복구를 보장하지 않습니다. 실패 시 파일과 의존성을 각각 점검하고 프로젝트의 백업·버전 관리 절차로 복구하세요.

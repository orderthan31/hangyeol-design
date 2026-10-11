# 개발 가이드

[처음으로](../README.md) · [설치하기](installation.md) · [컴포넌트](components.md) · [CLI](cli.md)

이 문서는 저장소에서 UI·도구·문서 앱을 개발하는 절차입니다. 다른 앱에 UI를 설치하려면 [소비 프로젝트 설치 안내](installation.md)를 따르세요. 자체 코드와 UI 소스는 [UNLICENSED](../packages/core/LICENSE)이며 공개 저장소만으로 외부 사용·재배포 권한을 부여하지 않습니다.

## 저장소 구조

루트는 npm workspace이며 두 패키지를 관리합니다.

| 경로 | 역할 |
| --- | --- |
| [packages/core](../packages/core) | `@orderthan31/hangyeol-core`: 배포하는 설치 도구와 UI 소스 |
| [packages/core/src/ui](../packages/core/src/ui) | 재사용 UI·foundation·헬퍼의 작성 원본 |
| [packages/core/src/tools](../packages/core/src/tools) | 설치·안전한 파일 처리·lint·tokens 구현 |
| [packages/core/registry/items.json](../packages/core/registry/items.json) | 선택 항목, 소스 파일, 의존 관계 |
| [packages/core/assets/fonts](../packages/core/assets/fonts) | 글꼴 원본과 라이선스·출처 |
| [packages/core/test](../packages/core/test) | 도구 계약·소스·UI 회귀 테스트 |
| [apps/docs](../apps/docs) | `@hangyeol/docs`: 설치된 CLI로 생성한 UI를 소비하는 로컬 문서 앱 |
| [scripts](../scripts) | 문서 소스 생성과 저장소 검사 스크립트 |

UI 작성 원본은 `packages/core/src/ui`입니다. 문서 앱의 `src/hangyeol`은 CLI가 생성하는 소비 소스이며, 원본 대신 수정할 개발 위치가 아닙니다. 문서 앱의 런타임이 core 패키지 원본을 직접 import하지 않도록 유지합니다.

## 환경과 첫 실행

Node.js 22.22.2 / npm 10.9.7을 기준으로 합니다. 최소 Node 버전은 22.12입니다. 루트 [package.json](../package.json)과 lockfile의 고정 의존성을 사용합니다.

```sh
npm ci
npm run build
npm run dev
```

`build`는 다음 순서로 실행됩니다.

1. core의 배포 파일과 payload를 빌드합니다.
2. workspace에 **설치된** `node_modules/.bin/hangyeol`로 문서 앱의 `init/add`를 실행합니다. 설치 목록은 해당 payload의 전체 레지스트리에서 가져옵니다.
3. 문서 앱의 타입 검사와 Vite 빌드를 실행합니다.

`dev`는 로컬 주소 `127.0.0.1`에 문서 앱을 실행합니다. 정적 빌드를 확인할 때는 `npm run preview`를 사용합니다. 서버가 출력하는 로컬 주소와 포트로 접속하세요.

## 변경과 생성 소스

1. UI는 `packages/core/src/ui`, 도구는 `packages/core/src/tools`에서 수정합니다.
2. 설치 파일이나 의존 관계가 바뀌면 registry와 해당 계약 테스트를 함께 검토합니다.
3. 변경 범위에 맞는 테스트를 실행하고, 문서 예제가 실제 컴포넌트 API와 일치하는지 확인합니다.
4. core 빌드 후 문서 앱 소비 경로를 확인합니다.

생성기는 기존 파일을 묵시적으로 덮어쓰지 않습니다. 원본 변경 뒤 문서 앱의 기존 설치 파일과 충돌하면 중단될 수 있습니다. 생성된 파일의 편집 여부와 마이그레이션 계획을 검토하고 명시적으로 처리하세요. `hangyeol.json`의 hash를 손으로 수정하거나 설정을 삭제해 충돌을 숨기지 않습니다.

## 검사 명령

| 명령 | 범위 |
| --- | --- |
| `npm run build` | core → 문서 소스 생성 → 문서 앱 타입 검사·번들 |
| `npm run typecheck` | core와 문서 앱 TypeScript 검사 |
| `npm test` | core 소스·패키징·UI 계약 및 문서 코드 예제 |
| `npm run lint:slice` | 저장소의 디자인 린트 스크립트 |
| `npm run test:code -w @hangyeol/docs` | 문서 앱 코드 예제 테스트 |
| `npm run test:integration -w @orderthan31/hangyeol-core` | 준비된 오프라인 의존성 cache를 사용하는 추가 설치 통합 테스트 |

기존 진단도 실패로 보고합니다. 실패를 통과로 바꾸기 위해 린트 정책이나 검사 범위를 축소하지 않습니다. 위 명령에 브라우저·Playwright·E2E·보조공학 검증이 포함된 것으로 간주하지 마세요.

테스트 임시 산출물은 저장소 밖의 `TMPDIR` 또는 `HANGYEOL_TEST_EVIDENCE_DIR`에 생성됩니다. 통합 테스트는 필요한 고정 의존성이 cache에 준비되어 있어야 합니다. cache 누락은 테스트 통과가 아닙니다.

## 문서 수정 원칙

- 새 사용자는 [설치 안내](installation.md)에서 시작할 수 있게 유지합니다.
- 카탈로그의 CLI 이름은 `registry/items.json`과 일치해야 합니다. 내부 헬퍼 파일을 독립 설치 항목으로 소개하지 않습니다.
- 값 export, 타입, 훅, Radix 별칭과 재export를 구분합니다. 이름 수를 독립 컴포넌트 수로 표현하지 않습니다.
- 예제는 설치한 로컬 소스를 import하고 Theme·스타일·의존 항목을 명시합니다.
- 과거 설치 기록의 재현용 코드·앵커는 현행 안내와 구분해서 보존합니다.
- 인증 토큰·개인 경로·내부 서비스 주소를 문서나 테스트 산출물에 포함하지 않습니다.

## 패키지와 라이선스

발행된 `0.0.1` 패키지는 고정된 배포물입니다. 저장소 문서 수정만으로 이미 발행된 패키지의 README나 코드를 교체할 수 없습니다. 릴리스·권한·발행 설정 변경은 일반 UI·문서 개발과 분리해서 검토합니다.

포함된 글꼴의 SIL Open Font License 1.1과 원저작자 고지를 유지합니다. 자체 코드의 사용 권한과 서드파티 의무는 [LICENSE](../packages/core/LICENSE), [THIRD_PARTY_NOTICES.md](../packages/core/THIRD_PARTY_NOTICES.md)를 기준으로 확인하세요.

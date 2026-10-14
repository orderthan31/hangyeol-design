# 동적 Vite 설정 연결 — adapter 후보

이 문서는 **미발행 `0.0.2-adapter.1` 후보**의 지원 범위를 설명합니다. GitHub Packages의 기존 `0.0.1`은 변경하지 않습니다. 기존 발행본으로 아래 callback 지원이 제공된다고 해석하지 마세요.

## 보존되는 설정

환경별 API proxy와 허용 호스트 목록을 정하는 `defineConfig(({ mode }) => …)` 구성을 그대로 사용할 수 있습니다. 설치 도구는 파일을 import하거나 실행하지 않고 AST를 읽습니다. `.env` 값을 읽거나 서버를 띄워 설정을 추측하지도 않습니다.

```ts
import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_');
  return {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: (env.VITE_ALLOWED_HOSTS || '')
        .split(',')
        .map((host) => host.trim())
        .filter(Boolean),
      proxy: { '/api': env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000' },
    },
  };
});
```

기존 설정에 필요한 Tailwind import와 `plugins: [tailwindcss()]`를 명시적으로 추가합니다. 환경 분기·proxy·allowedHosts를 고정값으로 바꾸지 않습니다. `init`과 `doctor`는 같은 host 검사를 사용하며 기존 Vite 파일을 자동으로 다시 쓰지 않습니다.

## 의도적으로 제한한 문법

- callback은 동기 arrow이며 `mode`만 구조 분해합니다. 이름을 바꾼 import나 `mode` binding도 실제 참조 관계를 검사합니다.
- callback 본문은 `const env = loadEnv(mode, '.', 'VITE_')`와 명시적인 object를 반환하는 `return`만 포함합니다.
- 환경 문자열은 `env.VITE_… || '기본값'` 또는 `??`로 표현합니다. `server`/`preview`의 proxy target 위치만 동적 문자열을 허용합니다.
- 동적 `allowedHosts`는 빈 기본값의 문자열을 쉼표로 나누고 각 항목을 `trim()`한 뒤 `filter(Boolean)`하는 형태만 지원합니다.
- `base`, `publicDir`, alias, plugin 및 build 효과는 기존의 정적 검사 기준을 그대로 따릅니다. dynamic base/publicDir, 임의 함수·plugin·외부 import·spread·getter·추가 실행문은 지원하지 않습니다.
- proxy 설정이나 목록 값을 설치 시점에 평가하지 않습니다. 실제 환경별 결과와 필요한 서비스 동작은 소비 프로젝트가 별도로 검증합니다.

더 넓은 JavaScript/TypeScript 문법이나 모든 Vite 구성 함수를 지원한다는 의미는 아닙니다. 지원하지 않는 문법은 파일·npm 변경 전에 거부합니다.

## 후보 artifact 설치와 재현

후보는 canonical 소스에서 다음 producer로 만들며 기존 registry 발행본이나 소비자 소유권 기록을 수정하지 않습니다.

```sh
node scripts/pack-core-adapter-candidate.mjs 0.0.2-adapter.1 /absolute/outside-repo/output
```

출력 tgz와 별도 provenance의 버전·SHA256·SRI·소스 revision을 확인합니다. 미발행 후보를 `0.0.1`로 표기하지 마세요. 소비 프로젝트의 고정 `vendor` 경로에 저장한 후 상대 `file:` devDependency와 lock으로 설치합니다.

```sh
npm install --save-dev --save-exact ./vendor/orderthan31-hangyeol-core-0.0.2-adapter.1.tgz
./node_modules/.bin/hangyeol --version
./node_modules/.bin/hangyeol inspect
./node_modules/.bin/hangyeol init --dry-run
./node_modules/.bin/hangyeol init
./node_modules/.bin/hangyeol add theme text-field button --dry-run
./node_modules/.bin/hangyeol add theme text-field button
./node_modules/.bin/hangyeol doctor
```

이 절차는 아직 UI를 초기화하지 않은 host의 실제 installer 사용입니다. 이미 다른 버전으로 초기화한 소비 프로젝트에 자동 update/migration을 제공하지 않습니다. 충돌이 나면 기록을 수동으로 고치거나 기존 설정을 숨기지 말고 소유권과 버전 경계를 먼저 확인합니다.

로컬 후보 설치는 Packages 인증이나 registry 발행 성공이 아닙니다. 후보에 기존 발행 guard를 유지하므로 신규 버전 발행은 별도 승인·검증이 필요합니다.

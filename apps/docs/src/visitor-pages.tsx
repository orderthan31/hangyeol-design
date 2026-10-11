import { NativeSelect } from './hangyeol/primitives/native-select';
import { ColorInput } from './hangyeol/primitives/color-input';
import { ControlGroup } from './hangyeol/primitives/control-label';
import { PreviewSurface } from './hangyeol/primitives/preview-surface';
import { Link } from './hangyeol/primitives/link';
import { useId, useState, type CSSProperties } from 'react';
import { Theme, useThemeScope } from './hangyeol/foundation/theme';
import { BrandCI } from './brand-ci';
import { Button } from './hangyeol/primitives/button';
import { TextField } from './hangyeol/components/text-field';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './hangyeol/primitives/tabs';
import { Row } from './hangyeol/primitives/layout';
import { CodeBlock } from './hangyeol/components/code-block';

export function Overview(){
 return <div className="docs-page docs-overview">
  <div className="docs-brand-intro"><BrandCI intro/><p className="docs-lead">SIMPLE. BETTER. CONSISTENT.</p></div>
  <section className="docs-section"><h2>hangyeol</h2><div className="docs-brand-copy"><p>hangyeol은 버튼, 입력, 목록을 같은 기준으로 조합해 화면을 만드는 React 디자인 시스템입니다.</p><p>필요한 컴포넌트를 골라 사용하고, 색상과 간격은 내 프로젝트에 맞게 바꿀 수 있습니다. 익숙한 요소를 함께 사용하면서 화면마다 일관된 흐름을 만들어 보세요.</p></div></section>
  <section className="docs-section"><h2>화면을 구성하는 공통 기준</h2><dl className="docs-brand-principles"><div><dt>필요한 요소부터</dt><dd>버튼과 입력부터 목록, 대화상자까지 용도에 맞는 컴포넌트를 조합합니다. 각 컴포넌트의 예제에서 사용법을 확인할 수 있습니다.</dd></div><div><dt>역할에 맞는 색상</dt><dd>본문, 주요 행동, 오류의 색상을 구분하고 밝은 화면과 어두운 화면을 선택합니다. 기본 팔레트의 색을 바꾸거나 새 팔레트를 추가할 수 있습니다.</dd></div><div><dt>일관된 배치</dt><dd>본문 너비와 요소 사이 간격을 공통 기준으로 맞춥니다. 가로와 세로 배치, 화면 너비에 맞는 열 구성을 함께 사용할 수 있습니다.</dd></div></dl></section>
  <section className="docs-section"><h2>둘러보기</h2><Row><Link variant="text" href="#Foundations">기본 스타일 살펴보기 →</Link><Link variant="text" href="#Button">컴포넌트 살펴보기 →</Link><Link variant="text" href="#GettingStarted">설치하고 시작하기 →</Link></Row></section>
 </div>;
}
export function GettingStarted() {
  const cli = 'npm exec --no -- hangyeol';
  const example = `import { Theme } from './hangyeol/foundation/theme';
import { TextField } from './hangyeol/components/text-field';
import { Button } from './hangyeol/primitives/button';
import './hangyeol.css';

export function App() {
  return (
    <Theme mode="light" palette="Indigo" className="grid gap-4 p-6">
      <TextField label="이름" name="name" defaultValue="김한결" clearable />
      <Button type="button">확인</Button>
    </Theme>
  );
}`;
  return (
    <div className="docs-page">
      <p className="docs-lead">
        hangyeol 설치 도구로 공통 설정을 준비하고, 필요한 컴포넌트만 프로젝트에 설치하세요.
      </p>
      <section className="docs-section">
        <h2>설치 방식 이해하기</h2>
        <p className="text-g-soft leading-7">
          <code>@orderthan31/hangyeol-core</code>는 컴포넌트 소스를 설치하고 검사하는 개발 도구입니다.
          패키지를 설치한 뒤 <code>init</code>으로 테마 CSS·글꼴·설정을 준비하고,{' '}
          <code>add</code>로 필요한 컴포넌트를 추가합니다. 화면에서는 core 자체가 아니라
          프로젝트에 설치된 로컬 소스를 import합니다.
        </p>
        <p className="text-g-small text-g-soft">
          아래 명령은 모두 컴포넌트를 사용할 프로젝트의 package.json이 있는 폴더에서 실행하세요. npm
          exec의 --no 옵션은 도구가 없을 때 다른 패키지를 자동 다운로드하지 않도록 합니다.
        </p>
      </section>
      <section className="docs-section">
        <h2>1. 프로젝트 준비하기</h2>
        <p className="text-g-soft leading-7">
          Node.js 22.12 이상, React 19, Vite, Tailwind CSS 4가 필요합니다. 아래는 현재
          문서 예제에서 사용하는 정확한 버전입니다. 기존 프로젝트에서 다른 버전을
          사용한다면 먼저 호환성을 확인하세요. 설치 도구는 버전 충돌을 자동으로 덮어쓰지
          않습니다.
        </p>
        <CodeBlock language="Shell">
          {
            'npm install --save-exact react@19.2.0 react-dom@19.2.0\nnpm install --save-dev --save-exact vite@7.3.6 typescript@5.9.3 tailwindcss@4.3.3 @tailwindcss/vite@4.3.3 @types/react@19.2.2 @types/react-dom@19.2.2'
          }
        </CodeBlock>
        <p className="text-g-soft leading-7">
          현재 초기화 도구는 아래와 같은 정적 Vite 설정을 지원합니다. 기존 설정이 있다면
          Tailwind 플러그인을 실제로 호출해야 합니다. React 플러그인·동적 설정 등 지원
          범위를 벗어나는 구성은 진단 후 중단되며, 도구가 임의로 삭제하거나 바꾸지
          않습니다.
        </p>
        <CodeBlock language="TypeScript">
          {
            "import { defineConfig } from 'vite';\nimport tailwindcss from '@tailwindcss/vite';\n\nexport default defineConfig({\n  plugins: [tailwindcss()],\n});"
          }
        </CodeBlock>
        <p className="text-g-small text-g-soft">
          기존 스타일의 Tailwind Preflight·reset은 분리한 뒤 초기화하세요. 기본값은 Vite의
          루트 경로와 public 폴더입니다. 패키지와 UI 소스의 이용 조건도 확인하세요. 별도로
          부여된 라이선스가 없다면 외부 제품에 사용하기 전에 권한을 확인해야 합니다.
        </p>
      </section>
      <section className="docs-section">
        <h2>2. 한결 core 설치하기</h2>
        <p className="text-g-soft leading-7">
          현재 안내는 전달받은 패키지 파일로 설치하는 방식입니다. 파일 경로는 실제로 받은
          파일의 위치로 바꿔 주세요. 설치만으로 UI 소스가 생성되지는 않습니다.
        </p>
        <CodeBlock language="Shell">{`npm install --save-dev --save-exact ./orderthan31-hangyeol-core-0.0.1.tgz\n${cli} --version\n${cli} --help`}</CodeBlock>
        <p className="text-g-small text-g-soft">
          GitHub Packages를 이용할 때는 별도로 안내된 배포 이름·버전·scope의 레지스트리
          설정과 인증이 필요합니다. GitHub Packages의 공개 npm 패키지도 설치 인증이
          필요하므로, 레지스트리 설치 안내가 제공된 경우에만 해당 명령을 사용하세요.
        </p>
        <Link
          variant="text"
          href="https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry"
          target="_blank"
          rel="noreferrer"
        >
          GitHub Packages 설치·인증 안내 →
        </Link>
      </section>
      <section className="docs-section">
        <h2>3. 공통 설정 초기화하기</h2>
        <p className="text-g-soft leading-7">
          먼저 dry-run(파일을 바꾸지 않고 실행 계획만 확인하는 방식)으로 생성 파일과 필요한 의존성을 확인하고, 문제가 없을 때 초기화를
          적용합니다. 적용 과정에서 누락된 의존성은 npm으로 정확한 버전을 설치합니다.
        </p>
        <CodeBlock language="Shell">{`${cli} init --dry-run\n${cli} init`}</CodeBlock>
        <ul className="text-g-soft leading-7">
          <li>
            <code>hangyeol.json</code>: 경로·설치 항목·원본 해시(파일 변경 여부를 확인하는 값) 기록
          </li>
          <li>
            <code>src/hangyeol</code>: 테마 CSS와 공통 소스, 이후 추가할 컴포넌트
          </li>
          <li>
            <code>src/hangyeol.css</code>: 앱에서 한 번 가져오는 공통 스타일 파일
          </li>
          <li>
            <code>public/fonts/hangyeol</code>: Pretendard 글꼴·라이선스·출처 정보
          </li>
        </ul>
      </section>
      <section className="docs-section">
        <h2>4. 필요한 컴포넌트 추가하기</h2>
        <p className="text-g-soft leading-7">
          컴포넌트의 설치 이름은 button, text-field처럼 소문자와 하이픈으로 작성합니다.
          여러 항목을 한 번에 추가할 수도 있습니다. 아래 화면 예제의 Theme도 사용할 수
          있도록 theme를 함께 설치합니다. 필요한 공통 소스와 연결된 컴포넌트와 실행·타입 검사에 필요한 추가 패키지(의존성)도 함께 준비됩니다.
        </p>
        <CodeBlock language="Shell">{`${cli} add theme text-field --dry-run\n${cli} add theme text-field\n\n# 다른 컴포넌트도 필요할 때 추가\n${cli} add button dialog --dry-run\n${cli} add button dialog`}</CodeBlock>
        <p className="text-g-small text-g-soft">
          text-field는 Input·Button·FormField도 추가합니다. 기존 파일과 내용이 충돌하면
          설치가 중단됩니다. 같은 원본 파일은 다시 복사하지 않습니다.
        </p>
      </section>
      <section className="docs-section">
        <h2>5. 화면에서 사용하기</h2>
        <p className="text-g-soft leading-7">
          앱 진입점에서 공통 스타일을 한 번 가져오고, Theme 안에 설치된 컴포넌트를
          배치하세요. 아래 예제는 src/App.tsx 기준입니다. core나 Radix를 페이지에서 직접
          조합할 필요는 없습니다.
        </p>
        <CodeBlock>{example}</CodeBlock>
        <Row>
          <Link variant="text" href="#Button">
            컴포넌트 사용법 보기 →
          </Link>
          <Link variant="text" href="#Customization">
            스타일 바꾸기 →
          </Link>
        </Row>
      </section>
      <section className="docs-section">
        <h2>설치 후 검사 명령어</h2>
        <CodeBlock language="Shell">{`# 설치된 core의 소스·도구 구성 확인\n${cli} inspect\n\n# 설치 기록·의존성·Vite 연결 검사\n${cli} doctor\n\n# 설정된 sourceRoot의 정적 코드 검사\n${cli} lint\n${cli} lint inspect\n\n# 실제 프로젝트 CSS의 의미 토큰 검사\n${cli} tokens validate\n${cli} tokens inspect`}</CodeBlock>
        <p className="text-g-small text-g-soft">
          doctor는 자동 수리 명령이 아닙니다. lint는 sourceRoot(컴포넌트 소스가 설치되는 폴더)의 TS/TSX를 검사하며
          앱 전체나 브라우저 동작을 검증하지 않습니다. lint inspect와 tokens inspect는
          도구·패키지 원본 확인이고, 실제 프로젝트 검사는 각각 lint와 tokens validate로
          실행합니다.
        </p>
      </section>
      <section className="docs-section">
        <h2>팔레트 확인과 토큰 내보내기</h2>
        <CodeBlock language="Shell">{`${cli} tokens presets\n${cli} tokens export --format json\n${cli} tokens export --preset Indigo --format css --output exports/indigo.css`}</CodeBlock>
        <p className="text-g-small text-g-soft">
          --output이 없으면 결과를 표준 출력으로 보여줍니다. 지정하면 별도 파일을 만들며,
          기존에 수정한 파일이나 프로젝트 입력 파일을 덮어쓰지 않습니다. preset 내보내기는
          앱 팔레트를 자동 변경하지 않습니다.
        </p>
      </section>
      <section className="docs-section">
        <h2>경로를 바꿔 초기화하기</h2>
        <p className="text-g-soft leading-7">
          기본 경로 대신 다른 위치나 alias(가져오기 경로에 붙이는 별칭)를 사용하려면 최초 init에 지정하세요. 다음
          예제는 기본 초기화 대신 사용하는 대안입니다. 기존 hangyeol.json의 설치 경로를
          바꾸는 명령은 아닙니다. 기존 Vite 설정이 있다면 먼저 같은 alias를 sourceRoot에
          연결해야 합니다. Vite 설정이 없을 때는 init이 연결 설정을 생성합니다. Alias를
          지정할 때는 extends·references 없는 단일 tsconfig.json과 정적 Vite 설정이
          필요합니다. 경로를 바꾼 경우 화면 코드의 import도 alias와 stylePath에 맞춰
          바꿔 주세요. 이 대안에서는 컴포넌트 경로가 @hangyeol/components/text-field,
          스타일 경로가 ./styles/hangyeol.css가 됩니다.
        </p>
        <CodeBlock language="Shell">{`${cli} init --source-root src/ui/hangyeol --style-path src/styles/hangyeol.css --alias "@hangyeol" --dry-run\n${cli} init --source-root src/ui/hangyeol --style-path src/styles/hangyeol.css --alias "@hangyeol"`}</CodeBlock>
      </section>
      <section className="docs-section">
        <h2>직접 편집한 소스 보호하기</h2>
        <p className="text-g-soft leading-7">
          설치된 컴포넌트와 테마는 프로젝트 안에 복사되는 로컬 파일입니다. 직접 수정할 수
          있고, add는 충돌한 파일을 기본적으로 덮어쓰지 않습니다. 원본으로 교체해야 할
          때만 버전 관리로 변경을 보관한 뒤, 선택 항목의 overwrite 계획을 확인하세요.
        </p>
        <CodeBlock language="Shell">{`${cli} add button --overwrite --dry-run`}</CodeBlock>
        <p className="text-g-small text-g-soft">
          --overwrite는 선택 항목과 연결된 설치 파일의 교체를 허용합니다. 계획을 검토하기
          전에는 dry-run을 빼지 마세요. 현재 자동 update·reset 명령은 제공하지 않습니다.
        </p>
      </section>
    </div>
  );
}
function StylePreview({fontSize=16,gap=16}:{fontSize?:number;gap?:number}){
 const [value,setValue]=useState('김한결'),[message,setMessage]=useState('');
 return <PreviewSurface asChild><div className="docs-style-preview" style={{'--docs-preview-gap':`${gap}px`,'--docs-preview-text-size':`${fontSize}px`} as CSSProperties}><h3 className="font-semibold">프로필 정보</h3><p className="text-g-soft">이름과 주요 행동의 색상, 글자 크기, 간격을 비교합니다.</p><TextField label="이름" value={value} onValueChange={setValue}/><Button onClick={()=>setMessage(value.trim()?'예제의 표시 이름을 변경했습니다.':'이름을 입력해 주세요.')}>저장</Button><p role="status" className="text-g-small text-g-soft">{message||'변경 내용은 예제 안에서만 유지됩니다.'}</p></div></PreviewSurface>;
}
export function Customization(){
 const {mode,palette}=useThemeScope(),id=useId();
 const [color,setColor]=useState('#166534'),[font,setFont]=useState('18'),[gap,setGap]=useState('24');
 const [panel,setPanel]=useState('preview');
 return <div className="docs-page"><p className="docs-lead">같은 화면을 두고 색상, 글자 크기와 간격을 내 프로젝트에 맞게 바꿔 보세요.</p><ControlGroup asChild><div className="docs-controls"><label className="grid gap-2 text-g-small font-medium" htmlFor={id+'-color'}>주요 행동 색상<ColorInput id={id+'-color'}  value={color} onChange={event=>setColor(event.target.value)}/></label><label className="grid gap-2 text-g-small font-medium" htmlFor={id+'-font'}>본문 크기<NativeSelect id={id+'-font'}  value={font} onChange={event=>setFont(event.target.value)}><option value="16">16px</option><option value="18">18px</option><option value="20">20px</option></NativeSelect></label><label className="grid gap-2 text-g-small font-medium" htmlFor={id+'-gap'}>요소 사이 간격<NativeSelect id={id+'-gap'}  value={gap} onChange={event=>setGap(event.target.value)}><option value="16">16px</option><option value="24">24px</option><option value="32">32px</option></NativeSelect></label><Button variant="quiet" size="small" onClick={()=>{setColor('#166534');setFont('18');setGap('24');}}>예제 설정 되돌리기</Button></div></ControlGroup><Tabs value={panel} onValueChange={setPanel}><TabsList aria-label="스타일 비교"><TabsTrigger value="preview">변경 전후</TabsTrigger><TabsTrigger value="code">적용 코드</TabsTrigger></TabsList><TabsContent value="preview" className="mt-6"><div className="docs-compare"><section className="grid gap-4"><h2 className="text-g-small font-medium">기본 스타일</h2><StylePreview/></section><section className="grid gap-4"><h2 className="text-g-small font-medium">바꾼 스타일</h2><Theme mode={mode} palette={palette} values={{'--g-action':color,'--g-action-hover':color,'--g-on-action':'#FFFFFF'}}><StylePreview fontSize={Number(font)} gap={Number(gap)}/></Theme></section></div></TabsContent><TabsContent value="code" className="mt-6"><CodeBlock>{`import { Theme } from './hangyeol/foundation/theme';\n\n<Theme values={{\n  '--g-action': '${color}',\n  '--g-action-hover': '${color}',\n  '--g-on-action': '#FFFFFF',\n}}>\n  {/* 이 영역에 사용할 컴포넌트를 배치하세요. */}\n</Theme>`}</CodeBlock><CodeBlock language="CSS">{`.my-screen { display: grid; gap: ${gap}px; }\n.my-screen > h3, .my-screen > p { font-size: ${font}px; }`}</CodeBlock></TabsContent></Tabs><p className="text-g-small text-g-soft">색을 바꾸면 글자와 바탕을 함께 확인하세요. 이 예제의 설정 되돌리기는 화면 안의 옵션만 바꾸며, 프로젝트의 파일이나 팔레트를 수정하지 않습니다. 저장한 소스의 값을 바꾸려면 <code>hangyeol/foundation/theme.css</code>에서 해당 역할을 편집하세요.</p></div>;
}

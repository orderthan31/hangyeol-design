import './docs.css';
import { Link } from './hangyeol/primitives/link';
import { PreviewSurface } from './hangyeol/primitives/preview-surface';
import { Specimen } from './hangyeol/primitives/specimen';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useThemeScope } from './hangyeol/foundation/theme';
import { Button } from './hangyeol/primitives/button';
import { Input } from './hangyeol/primitives/input';
import { Container } from './hangyeol/primitives/container';
import { Grid } from './hangyeol/primitives/grid';
import { Row, Stack } from './hangyeol/primitives/layout';
import { Icon, type IconName } from './hangyeol/primitives/icon';
import { CodeBlock } from './hangyeol/components/code-block';
import themeSource from './hangyeol/foundation/theme.css?raw';
import tailwindSource from 'tailwindcss/theme.css?raw';

export const foundationNames = ['FoundationColor', 'FoundationTypography', 'FoundationRadius', 'FoundationLayout', 'FoundationSpacing', 'FoundationLayers', 'FoundationIcons'] as const;
export type FoundationName = typeof foundationNames[number];
export const foundationLabels: Record<FoundationName, string> = {
  FoundationColor: '색상', FoundationTypography: '타이포그래피', FoundationRadius: '라디우스', FoundationLayout: '레이아웃', FoundationSpacing: '간격', FoundationLayers: '경계와 레이어', FoundationIcons: '아이콘',
};
export const foundationDescriptions: Record<FoundationName, string> = {
  FoundationColor: 'Color · 팔레트, 밝기와 역할별 색상',
  FoundationTypography: 'Typography · 글꼴, 크기, 굵기와 줄간격',
  FoundationRadius: 'Radius · 입력, 버튼과 패널의 모서리',
  FoundationLayout: 'Layout · 본문 너비, 그리드와 반응형 배치',
  FoundationSpacing: 'Spacing · 여백과 요소 사이의 간격',
  FoundationLayers: 'Border · Elevation · 경계, 초점과 겹치는 영역',
  FoundationIcons: 'Iconography · 크기, 선과 접근 가능한 이름',
};
function sourceValue(name: string, source = themeSource) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return source.match(new RegExp(escaped + '\\s*:\\s*([^;]+)'))?.[1].trim() ?? '정의 없음';
}
const colorRoles = [
  ['--g-canvas', '화면 바탕', '페이지 전체의 배경'], ['--g-surface', '내용 영역', '입력, 패널과 팝업의 배경'],
  ['--g-muted', '보조 바탕', '선택 상태와 보조 영역'], ['--g-ink', '본문', '제목과 주요 내용'],
  ['--g-soft', '보조 글자', '설명과 부가 정보'], ['--g-line', '기본 경계', '입력과 영역의 은은한 구분'],
  ['--g-line-hover', '경계 강조', '활성 입력과 선택 요소의 hover 경계'],
  ['--g-control-track', '조작 바탕', '선택 전 Switch와 Slider의 트랙'],
  ['--g-control-thumb', '조작 손잡이', 'Switch와 Slider의 움직이는 손잡이'],
  ['--g-action', '주요 행동', '기본 버튼의 배경'], ['--g-action-hover', '행동 강조', '기본 버튼의 hover 배경'],
  ['--g-on-action', '행동 위 글자', '주요 행동 배경 위의 내용'], ['--g-focus', '키보드 초점', '초점 외곽선'],
  ['--g-danger', '오류', '오류 안내와 잘못된 입력'], ['--g-overlay', '모달 배경', '대화상자 뒤의 반투명 덮개'],
] as const;
const iconNames: IconName[] = ['check', 'close', 'plus', 'minus', 'search', 'chevronDown', 'chevronRight', 'arrowLeft', 'arrowRight', 'trash', 'settings', 'star', 'eye', 'eyeOff'];

export function Foundations() {
  return <div className="docs-page">
    <p className="docs-lead">컴포넌트에 공통으로 적용되는 시각 기준과 배치 규칙입니다.</p>
    <dl className="docs-foundation-summary">
      {foundationNames.map(name => <div key={name}><dt>{foundationLabels[name]}</dt><dd>{foundationDescriptions[name].split(' · ').slice(1).join(' · ')}</dd></div>)}
    </dl>
  </div>;
}
function TypeSample({ label, token, className, text }: { label: string; token?: string; className: string; text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [values, setValues] = useState({ size: '', weight: '', line: '' });
  useEffect(() => {
    if (ref.current) { const css = getComputedStyle(ref.current); setValues({ size: css.fontSize, weight: css.fontWeight, line: css.lineHeight }); }
  }, [className]);
  return <div className="docs-type-sample">
    <div className="docs-type-meta"><span className="font-medium">{label}</span><code>{token ? `${token}: ${sourceValue(token)}` : 'text-xl'}</code><p className="text-g-caption text-g-soft">현재 크기 {values.size} · 굵기 {values.weight}<br/>줄간격 {values.line}</p></div>
    <p ref={ref} className={className}>{text}</p>
  </div>;
}
function SpacingSample({ multiple }: { multiple: number }) {
  const ref = useRef<HTMLSpanElement>(null), [width, setWidth] = useState('');
  useEffect(() => { if (ref.current) setWidth(getComputedStyle(ref.current).width); }, []);
  return <div className="docs-spacing-row"><code>spacing × {multiple}</code><Specimen asChild variant="spacing"><span ref={ref} aria-hidden="true" style={{ '--hangyeol-space-multiple': multiple } as CSSProperties}/></Specimen><span className="text-g-small text-g-soft">{width}</span></div>;
}
function Colors() {
  const { variables, palette, mode } = useThemeScope();
  return <>
    <p className="docs-lead">색상은 값보다 역할로 선택합니다. 팔레트와 밝기를 바꿔도 본문, 행동, 오류의 역할은 유지합니다.</p>
    <section className="docs-section"><div className="docs-section-title"><h2>역할별 색상</h2><span className="text-g-small text-g-soft">{palette} · {mode === 'light' ? '밝은 화면' : '어두운 화면'}</span></div>
      <div className="docs-swatches">{colorRoles.map(([token, label, usage]) => <Specimen key={token} asChild variant="swatch"><div  ><span aria-hidden="true" style={{ '--hangyeol-swatch-color': `var(${token})` } as CSSProperties}/><div><p className="text-g-small font-medium">{label}</p><code>{token}</code><span className="text-g-caption text-g-soft">{String((variables as Record<string, string>)[token] ?? '')}</span><p className="text-g-small text-g-soft">{usage}</p></div></div></Specimen>)}</div>
    </section>
    <section className="docs-section"><h2>색상 적용</h2><PreviewSurface asChild><div className="grid gap-4"><Row><Button>저장</Button><Button variant="secondary">취소</Button><Button disabled>사용 불가</Button></Row><div className="grid gap-2"><label htmlFor="foundation-color-input" className="text-g-small font-medium">이메일</label><Input id="foundation-color-input" type="email" defaultValue="user@" invalid aria-describedby="foundation-color-error"/><p id="foundation-color-error" className="text-g-small text-g-danger">이메일 주소를 확인해 주세요.</p></div></div></PreviewSurface>
      <p className="text-g-small text-g-soft">오류는 색상만으로 전달하지 않고 안내 문구를 함께 제공합니다. 색상을 수정할 때는 글자와 바탕, 입력 경계와 초점의 구분도 확인하세요.</p>
      <CodeBlock language="CSS">{'.page { background: var(--g-canvas); color: var(--g-ink); }\n.description { color: var(--g-soft); }\n.error { color: var(--g-danger); }'}</CodeBlock>
    </section>
    <section className="docs-section"><h2>팔레트와 밝기</h2><p className="text-g-soft leading-7">인디고, 실버, 포레스트, 앰버, 로즈는 편집 가능한 시작 팔레트입니다. 밝은 화면과 어두운 화면은 팔레트와 별도로 선택합니다. 색상값을 수정하거나 팔레트를 추가할 수 있으며, 오류색도 프로젝트에 맞게 관리할 수 있습니다.</p><Link variant="text"  href="#Customization">색상 수정 방법 →</Link></section>
  </>;
}
function Typography() {
  return <>
    <p className="docs-lead">Pretendard를 기본으로 사용합니다. 제목, 본문, 라벨과 보조 설명은 크기와 굵기로 구분합니다.</p>
    <section className="docs-section"><h2>글자 크기와 역할</h2><div>
      <TypeSample label="페이지 제목" token="--text-g-title" className="text-g-title font-semibold leading-g-title" text="입력 항목을 확인해 주세요"/>
      <TypeSample label="섹션 제목" className="text-xl font-semibold leading-g-heading" text="계정 정보"/>
      <TypeSample label="본문" token="--text-g-body" className="text-g-body leading-g-body" text="변경할 정보를 입력한 뒤 저장하세요."/>
      <TypeSample label="입력 라벨" token="--text-g-small" className="text-g-small font-medium leading-g-label" text="이메일 주소"/>
      <TypeSample label="보조 설명" token="--text-g-caption" className="text-g-caption leading-g-body text-g-soft" text="알림을 받을 이메일 주소를 입력하세요."/>
    </div></section>
    <section className="docs-section"><h2>굵기와 줄간격</h2><PreviewSurface asChild><div className="grid gap-4"><p className="font-normal">400 · 본문과 설명</p><p className="font-medium">500 · 라벨과 버튼</p><p className="font-semibold">600 · 제목과 강조</p></div></PreviewSurface><p className="text-g-soft leading-7">본문은 1.5배 줄간격을 기본으로 사용하고 제목은 1.3~1.4배로 조정합니다. 긴 본문은 <Link href="#Container">Container</Link>의 reading 너비 안에 배치하세요. 글자 크기를 줄여 내용을 억지로 한 줄에 넣지 않습니다.</p><CodeBlock>{'<h1 className="text-g-title font-semibold leading-g-title">계정 설정</h1>\n<p className="text-g-body leading-g-body">변경할 정보를 입력하세요.</p>\n<label className="text-g-small font-medium">이메일</label>'}</CodeBlock></section>
  </>;
}
function Radius() {
  return <>
    <p className="docs-lead">작은 조작 요소와 큰 내용 영역의 모서리를 구분합니다.</p>
    <section className="docs-section"><h2>모서리 기준</h2><div className="docs-foundation-grid">
      <article className="docs-foundation-spec"><Specimen asChild variant="radius"><div className="rounded-g-control" aria-hidden="true"/></Specimen><h3>입력과 버튼</h3><code>--radius-g-control: {sourceValue('--radius-g-control')}</code><p>Button, Input과 Tooltip에 사용합니다.</p><code>rounded-g-control</code><Row><Button>확인</Button><Button variant="secondary">취소</Button></Row></article>
      <article className="docs-foundation-spec"><Specimen asChild variant="radius"><div className="rounded-g-panel" aria-hidden="true"/></Specimen><h3>패널과 팝업</h3><code>--radius-g-panel: {sourceValue('--radius-g-panel')}</code><p>Dialog, Popover와 내용 패널에 사용합니다.</p><code>rounded-g-panel</code><Specimen variant="panel">패널 영역</Specimen></article>
    </div></section>
    <section className="docs-section"><h2>적용 원칙</h2><p className="text-g-soft leading-7">같은 역할에는 같은 모서리 값을 사용합니다. 개별 화면마다 별도의 값을 추가하기보다 공통 기준을 먼저 조정하세요. 원형 아이콘 버튼처럼 형태가 기능을 구분할 때만 별도 형태를 사용합니다.</p><CodeBlock language="CSS">{`/* hangyeol/foundation/theme.css */\n@theme inline {\n  --radius-g-control: ${sourceValue('--radius-g-control')};\n  --radius-g-panel: ${sourceValue('--radius-g-panel')};\n}`}</CodeBlock></section>
  </>;
}
const containerSpecs = [
  ['reading', '--container-2xl', 'max-w-2xl', '긴 본문과 안내'], ['content', '--container-5xl', 'max-w-5xl', '일반 화면의 본문'], ['wide', '--container-7xl', 'max-w-7xl', '넓은 목록과 대시보드'], ['full', '', 'max-w-none', '부모 영역 전체'],
] as const;
function Layout() {
  return <>
    <p className="docs-lead">본문 너비는 Container, 여러 열은 Grid, 읽는 순서는 Stack과 Row로 조합합니다.</p>
    <section className="docs-section"><h2>본문 너비</h2><div className="docs-token-list">{containerSpecs.map(([width, token, utility, usage]) => <article key={width} className="docs-foundation-spec"><h3>{width}</h3><code>{utility}{token ? ` · ${sourceValue(token, tailwindSource)}` : ''}</code><p>{usage}</p><Specimen asChild variant="container-track"><div ><Container width={width}><Specimen asChild variant="container"><div >{width}</div></Specimen></Container></div></Specimen></article>)}</div><p className="text-g-small text-g-soft">표시된 너비는 최대 너비이며 부모보다 넓어지지 않습니다. 기본은 content이고 좌우 여백은 px-4, sm부터 px-6입니다. gutter=false로 좌우 여백을 끌 수 있습니다.</p><CodeBlock>{'<Container width="reading">긴 본문</Container>\n<Container width="wide" gutter={false}>넓은 목록</Container>'}</CodeBlock></section>
    <section className="docs-section"><h2>그리드와 반응형</h2><PreviewSurface asChild><div ><Grid columns={3} gap="medium">{['제목', '내용', '보조 정보'].map(title => <Specimen key={title} asChild variant="grid"><div  >{title}</div></Specimen>)}</Grid></div></PreviewSurface><dl className="docs-specs"><div><dt>기본</dt><dd>모든 Grid는 1열에서 시작합니다.</dd></div><div><dt>sm · {sourceValue('--breakpoint-sm', tailwindSource)}</dt><dd>columns=2는 2열, columns=3과 4는 2열이 됩니다.</dd></div><div><dt>lg · {sourceValue('--breakpoint-lg', tailwindSource)}</dt><dd>columns=3은 3열, columns=4는 4열이 됩니다.</dd></div></dl><p className="text-g-small text-g-soft">columns=1은 항상 1열입니다. 별도의 12열 그리드가 아닌, 콘텐츠 수에 맞춘 1~4열 배치입니다.</p><CodeBlock>{'<Grid columns={3} gap="medium">\n  <article>첫 번째 항목</article>\n  <article>두 번째 항목</article>\n  <article>세 번째 항목</article>\n</Grid>'}</CodeBlock></section>
    <section className="docs-section"><h2>가로와 세로 배치</h2><div className="docs-foundation-grid"><PreviewSurface asChild><div ><Stack><strong>Stack</strong><p>요소를 세로로 배치합니다.</p><p className="text-g-small text-g-soft">기본 간격: gap-4</p></Stack></div></PreviewSurface><PreviewSurface asChild><div ><Row><strong>Row</strong><Button variant="secondary">취소</Button><Button>저장</Button></Row><p className="mt-4 text-g-small text-g-soft">기본 간격: gap-3. 너비가 부족하면 다음 줄로 넘어갑니다.</p></div></PreviewSurface></div><Row><Link variant="text"  href="#Container">Container 사용법 →</Link><Link variant="text"  href="#Grid">Grid 사용법 →</Link><Link variant="text"  href="#Layout">Layout 사용법 →</Link></Row></section>
  </>;
}
function Spacing() {
  return <>
    <p className="docs-lead">요소 사이의 간격은 부모 배치가, 조작 요소 안쪽 여백은 각 컴포넌트가 담당합니다.</p>
    <section className="docs-section"><h2>간격 단위</h2><p className="text-g-soft leading-7">Tailwind의 기본 간격 단위 <code>--spacing: {sourceValue('--spacing', tailwindSource)}</code>에 배수를 적용합니다.</p><div className="grid gap-3">{[1, 2, 3, 4, 6, 8, 12].map(multiple => <SpacingSample key={multiple} multiple={multiple}/>)}</div></section>
    <section className="docs-section"><h2>간격의 역할</h2><dl className="docs-specs"><div><dt>gap-2</dt><dd>아이콘과 글자, 가까운 보조 정보</dd></div><div><dt>gap-3</dt><dd>Row의 기본 가로 간격</dd></div><div><dt>gap-4</dt><dd>Stack과 기본 Grid의 항목 사이</dd></div><div><dt>gap-6</dt><dd>Grid의 large 간격, 큰 영역 안쪽 여백</dd></div></dl><div className="docs-foundation-grid"><PreviewSurface asChild><div ><Stack><label className="text-g-small font-medium" htmlFor="foundation-spacing-input">이름</label><Input id="foundation-spacing-input" defaultValue="김한결"/><Button>확인</Button></Stack></div></PreviewSurface><PreviewSurface asChild><div ><Grid columns={2} gap="large"><Specimen asChild variant="grid"><div >첫 번째 항목</div></Specimen><Specimen asChild variant="grid"><div >두 번째 항목</div></Specimen></Grid></div></PreviewSurface></div><CodeBlock>{'<Stack className="gap-6">…</Stack>\n<Row className="gap-2">…</Row>\n<Grid gap="large">…</Grid>'}</CodeBlock></section>
    <section className="docs-section"><h2>조작 요소의 여백</h2><p className="text-g-soft leading-7"><code>--spacing-g-control: {sourceValue('--spacing-g-control')}</code>은 기본 Button의 가로 여백(px-g-control)에 사용합니다. 높이와 세로 여백은 Button의 size로 선택합니다. 부모 gap을 바꾸어도 버튼 안쪽 여백은 바뀌지 않습니다.</p><Link variant="text"  href="#Button">버튼 크기와 여백 →</Link></section>
  </>;
}
function Layers() {
  return <>
    <p className="docs-lead">평면 영역은 은은한 회색 경계로, 겹치는 영역은 절제된 그림자와 배경 덮개로 구분합니다.</p>
    <section className="docs-section"><h2>경계와 키보드 초점</h2><div className="docs-foundation-grid"><PreviewSurface asChild><div className="grid gap-4"><p>기본 경계: 1px · 은은한 회색 g-line</p><label htmlFor="foundation-layer-input" className="text-g-small font-medium">입력 예제</label><Input id="foundation-layer-input" defaultValue="Tab 키로 초점 확인"/><Button variant="secondary">초점 확인</Button></div></PreviewSurface><PreviewSurface asChild><div className="grid gap-4"><p>오류 경계: 1px · g-danger</p><label htmlFor="foundation-layer-error" className="text-g-small font-medium">이메일</label><Input id="foundation-layer-error" invalid defaultValue="user@" aria-describedby="foundation-layer-error-message"/><p id="foundation-layer-error-message" className="text-g-small text-g-danger">이메일 주소를 확인해 주세요.</p></div></PreviewSurface></div><p className="text-g-soft leading-7">기본 경계는 가볍게 유지하고, hover는 g-line-hover로 구분합니다. Switch는 테두리 없이 트랙과 손잡이로 상태를 보여 줍니다. 오류는 g-danger로 안내 문구와 함께 표시합니다. Button과 Input의 키보드 초점은 3px 외곽선과 2px 간격으로 표시합니다. 경계색을 바꾸는 것만으로 초점을 대신하지 않습니다.</p><CodeBlock>{'<button type="button" className="border border-solid border-g-line focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-g-focus">초점 확인</button>'}</CodeBlock></section>
    <section className="docs-section"><h2>그림자</h2><div className="docs-foundation-grid"><Specimen asChild variant="elevation"><article className="border border-solid border-g-line"><h3>평면 영역</h3><code>그림자 없음</code><p>입력과 일반 내용 영역</p></article></Specimen><Specimen asChild variant="elevation"><article className="border border-solid border-g-line shadow-md"><h3>보조 팝업</h3><code>shadow-md</code><p>Popover와 Tooltip</p></article></Specimen><Specimen asChild variant="elevation"><article className="border border-solid border-g-line shadow-lg"><h3>대화상자</h3><code>shadow-lg</code><p>Dialog</p></article></Specimen></div><p className="text-g-small text-g-soft">그림자는 Tailwind 기본 값을 사용합니다. 일반 내용을 모두 띄워 보이게 하기보다, 현재 화면 위에 겹친 영역에 한정해 사용하세요.</p></section>
    <section className="docs-section"><h2>겹치는 영역</h2><Specimen asChild variant="layer"><div ><Specimen asChild variant="grid"><div >현재 화면</div></Specimen><Specimen asChild variant="overlay"><div ><Specimen variant="dialog-panel">대화상자</Specimen></div></Specimen></div></Specimen><dl className="docs-specs"><div><dt>모달 배경</dt><dd>g-overlay · z-40</dd></div><div><dt>팝업 콘텐츠</dt><dd>Dialog, Popover, Tooltip · z-50</dd></div></dl><p className="text-g-small text-g-soft">위 그림은 영역 관계를 보여 주는 정적 예시입니다. 실제 열기·닫기와 초점 동작은 각 컴포넌트에서 확인하세요.</p><Row><Link variant="text"  href="#Dialog">Dialog →</Link><Link variant="text"  href="#Popover">Popover →</Link><Link variant="text"  href="#Tooltip">Tooltip →</Link></Row></section>
  </>;
}
function Icons() {
  return <>
    <p className="docs-lead">Lucide 기반 선 아이콘을 사용합니다. 글자와 함께 놓는 아이콘과 단독 행동의 이름을 구분합니다.</p>
    <section className="docs-section"><h2>아이콘 목록</h2><div className="docs-icon-grid">{iconNames.map(name => <div key={name} className="docs-icon-sample"><Icon name={name}/><code>{name}</code></div>)}</div></section>
    <section className="docs-section"><h2>크기와 선</h2><PreviewSurface asChild><div ><div className="flex flex-wrap items-center gap-6">{(['small', 'medium', 'large'] as const).map(size => <div key={size} className="docs-icon-sample"><Icon name="search" size={size}/><code>{size}</code><span className="text-g-small text-g-soft">{size === 'small' ? '1rem' : size === 'medium' ? '1.25rem' : '1.5rem'}</span></div>)}</div></div></PreviewSurface><p className="text-g-soft leading-7">기본 크기는 medium, 기본 선 두께는 2입니다. 아이콘 색상은 currentColor로 주변 글자색을 따릅니다. 크기를 바꿀 때는 size를, 별도 선 두께가 필요할 때는 strokeWidth를 사용하세요.</p></section>
    <section className="docs-section"><h2>이름과 접근성</h2><PreviewSurface asChild><div ><Row><Button variant="secondary"><Icon name="search" size="small"/>검색</Button><Icon name="check" label="완료"/></Row></div></PreviewSurface><p className="text-g-soft leading-7">글자 옆의 장식 아이콘은 이름을 생략해 중복 낭독을 피합니다. 아이콘 자체가 정보를 전달하면 label을 제공합니다. 아이콘만 있는 행동에는 IconButton이나 IconAction의 label로 버튼 이름을 지정하세요.</p><CodeBlock>{'<Button><Icon name="search" size="small" />검색</Button>\n<Icon name="check" label="완료" />\n<IconButton icon="close" label="닫기" />'}</CodeBlock><Row><Link variant="text"  href="#Icon">Icon 사용법 →</Link><Link variant="text"  href="#IconButton">IconButton →</Link><Link variant="text"  href="#IconAction">IconAction →</Link></Row></section>
  </>;
}
export function FoundationPage({ name }: { name: FoundationName }) {
  const content = { FoundationColor: Colors, FoundationTypography: Typography, FoundationRadius: Radius, FoundationLayout: Layout, FoundationSpacing: Spacing, FoundationLayers: Layers, FoundationIcons: Icons }[name];
  const Content = content;
  return <div className="docs-page" data-foundation={name}><Content/></div>;
}

import { ControlGroup } from './hangyeol/primitives/control-label';
import { PreviewSurface } from './hangyeol/primitives/preview-surface';
import { ComponentIntroduction, ExamplePurpose } from './component-content';
import { useId, useState, type ReactNode } from 'react';
import { Button } from './hangyeol/primitives/button';

import { Checkbox } from './hangyeol/primitives/checkbox';
import { Switch } from './hangyeol/primitives/switch';
import { Textarea } from './hangyeol/primitives/textarea';
import { Slider } from './hangyeol/primitives/slider';
import { Progress } from './hangyeol/primitives/progress';
import { Separator } from './hangyeol/primitives/separator';
import { Skeleton } from './hangyeol/primitives/skeleton';
import { LoadingSpinner } from './hangyeol/primitives/loading-spinner';
import { Container } from './hangyeol/primitives/container';
import { Grid } from './hangyeol/primitives/grid';
import { Highlight } from './hangyeol/primitives/highlight';
import { Icon, type IconName } from './hangyeol/primitives/icon';
import { IconButton } from './hangyeol/primitives/icon-button';
import { FormField } from './hangyeol/components/form-field';
import { ActionGroup } from './hangyeol/components/action-group';
import { ListHeader } from './hangyeol/components/list-header';
import { ListFooter } from './hangyeol/components/list-footer';
import { EmptyState } from './hangyeol/components/empty-state';
import { Select } from './hangyeol/primitives/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './hangyeol/primitives/tabs';
import { CodeBlock } from './hangyeol/components/code-block';

export const controlNames = ['ActionGroup', 'Checkbox', 'Container', 'EmptyState', 'FormField', 'Grid', 'Highlight', 'Icon', 'IconButton', 'ListFooter', 'ListHeader', 'LoadingSpinner', 'Progress', 'Separator', 'Skeleton', 'Slider', 'Switch', 'Textarea'] as const;
export type ControlName = typeof controlNames[number];
export const controlDescriptions: Record<ControlName, string> = {
  ActionGroup: '저장과 취소처럼 관련된 행동을 함께 배치합니다.',
  Checkbox: '여러 항목을 선택하거나 선택 여부를 표시합니다.',
  Container: '본문의 최대 너비와 좌우 여백을 맞춥니다.',
  EmptyState: '아직 항목이 없거나 검색 결과가 없을 때 다음 행동을 안내합니다.',
  FormField: '입력과 라벨, 안내, 오류 문구를 연결합니다.',
  Grid: '관련된 내용을 화면 너비에 맞춰 여러 열로 배치합니다.',
  Highlight: '문장 안에서 검색어와 일치하는 부분을 표시합니다.',
  Icon: '검색, 닫기처럼 익숙한 동작을 작은 그림으로 표시합니다.',
  IconButton: '짧은 이름과 아이콘으로 하나의 행동을 실행합니다.',
  ListFooter: '목록 아래에 보조 정보와 다음 행동을 배치합니다.',
  ListHeader: '목록의 제목, 설명과 보조 행동을 함께 보여줍니다.',
  LoadingSpinner: '처리가 진행 중임을 표시합니다.',
  Progress: '작업의 진행 정도를 막대와 접근 가능한 값으로 표시합니다.',
  Separator: '관련된 내용 사이를 가로 또는 세로 선으로 구분합니다.',
  Skeleton: '내용이 도착하기 전, 들어갈 영역의 형태를 보여줍니다.',
  Slider: '정해진 범위에서 한 값이나 두 값의 구간을 고릅니다.',
  Switch: '설정을 켜거나 끕니다.',
  Textarea: '자기소개나 메모처럼 여러 줄의 글을 입력합니다.',
};
const usage: Record<ControlName, string[]> = {
  ActionGroup: ['align은 start, end, between을 지원합니다. 공간이 부족하면 행동이 다음 줄로 넘어갑니다.', '버튼의 종류, loading과 disabled는 각 Button에 지정합니다. 제출과 삭제는 사용하는 화면에서 처리합니다.'],
  Checkbox: ['checked는 true, false, indeterminate를 지원합니다. 초기 선택만 정하려면 defaultChecked를 사용하세요.', 'label의 htmlFor와 Checkbox의 id를 연결하세요. Space로 선택을 바꿀 수 있습니다.', 'name과 value는 선택했을 때 폼에 포함됩니다. disabled인 항목은 제출되지 않습니다. 직접 값을 관리한다면 폼 초기화도 화면에서 처리하세요.'],
  Container: ['width는 reading, content, wide, full을 지원합니다. gutter={false}는 좌우 여백을 생략합니다.', '배치만 담당합니다. 페이지의 body나 바깥 요소에 스타일을 적용하지 않습니다.'],
  EmptyState: ['heading에 현재 상황, description에 설명을 지정합니다. illustration과 actions는 필요한 경우에만 사용합니다.', '검색 결과가 없을 때와 데이터가 아직 없을 때의 문구를 구분하세요. 버튼 동작은 사용하는 화면에서 연결합니다.'],
  FormField: ['inputProps에 id, name, required, 기본값과 입력 속성을 지정합니다. 입력을 생략하면 Input을 사용합니다.', '다른 입력을 쓰려면 children에 함수를 넣고 받은 id, aria-describedby, aria-invalid를 실제 입력에 전달하세요. 일반 children을 넣은 경우에는 직접 연결해야 합니다.', 'hint와 error는 서로 다른 설명으로 연결됩니다. required는 필수 안내와 실제 입력 속성에 함께 반영됩니다.'],
  Grid: ['columns는 1, 2, 3, 4를 지원합니다. 좁은 화면에서는 한 열로, 충분히 넓은 화면에서는 지정한 열로 배치합니다.', 'gap은 small, medium, large입니다. className으로 자신의 배치를 이어서 조정할 수 있습니다.'],
  Highlight: ['children에는 문자열, query에는 그대로 찾을 검색어를 지정합니다. 빈 검색어는 원문만 표시합니다.', '기본적으로 대소문자를 구분하지 않습니다. 구분하려면 caseSensitive를 지정하세요. 특수문자도 일반 글자처럼 찾으며 HTML로 해석하지 않습니다.'],
  Icon: ['name으로 제공하는 아이콘을 지정합니다. size는 small, medium, large입니다. strokeWidth로 선 굵기를 조절할 수 있습니다.', '장식용 아이콘은 읽기 대상에서 제외됩니다. 아이콘 자체가 정보를 전달한다면 label을 지정하세요. 버튼 안의 아이콘은 버튼에 이름을 지정합니다.'],
  IconButton: ['label은 버튼의 접근 이름입니다. icon에 아이콘 이름을 지정하세요.', 'Button의 variant, loading, disabled와 native button 속성을 사용할 수 있습니다. loading과 disabled는 실행을 막습니다.'],
  ListFooter: ['children에 보조 정보나 페이지 안내를, actions에 필요한 버튼을 넣습니다.', '페이지 이동이나 추가 데이터 요청은 자동으로 실행하지 않습니다. 사용하는 화면에서 연결하세요.'],
  ListHeader: ['heading, description, count, leading, actions를 필요한 만큼 사용합니다. 항목 수는 화면에서 전달합니다.', 'headingId를 지정하면 목록이나 바깥 영역과 제목을 연결할 수 있습니다. 길어진 제목과 행동은 자연스럽게 줄을 바꿉니다.'],
  LoadingSpinner: ['label은 스크린 리더가 읽는 진행 안내입니다. size는 small, medium입니다.', '주변에서 이미 진행 상황을 설명한다면 decorative를 지정해 중복 안내를 줄일 수 있습니다. 동작을 줄이는 설정에서는 회전하지 않습니다.'],
  Progress: ['label은 작업 이름, value는 현재 값, max는 최댓값입니다. 완료 여부와 데이터는 사용하는 화면에서 관리합니다.', 'value={null}은 진행 정도를 아직 모르는 상태입니다. 실제 진행 숫자를 임의로 만들지 않습니다.'],
  Separator: ['orientation은 horizontal, vertical입니다. 세로 선은 부모의 높이가 있어야 보입니다.', '기본적으로 장식용입니다. 내용의 구분 자체에 의미가 있다면 decorative={false}를 지정합니다. 키보드로 조작하는 요소가 아닙니다.'],
  Skeleton: ['shape은 text, circle, block입니다. className으로 필요한 영역의 크기를 맞춥니다.', '읽기 대상에서 제외되는 장식입니다. 바깥 영역에 aria-busy와 읽을 수 있는 진행 안내를 두고, 준비되면 실제 내용으로 교체하세요.'],
  Slider: ['value와 defaultValue는 숫자 배열입니다. 한 값은 손잡이 하나, 두 값은 범위 선택에 사용합니다.', 'min, max, step으로 범위를 정합니다. label과 thumbLabels로 각 손잡이의 목적을 알려 주세요.', '방향키로 값을, Home과 End로 범위 끝을 선택합니다. name이 있으면 폼에 값이 포함됩니다. 직접 값을 관리할 때 초기화는 화면에서 처리합니다.'],
  Switch: ['checked와 onCheckedChange로 값을 관리하거나 defaultChecked로 초기 설정만 지정합니다.', 'label과 id를 연결합니다. Space로 켜고 끌 수 있으며 name과 value는 켜진 상태에서 폼에 포함됩니다. 설정의 실제 저장은 화면에서 처리합니다.'],
  Textarea: ['rows로 처음 보이는 줄 수를, resize로 vertical, none, both 중 크기 변경 방식을 지정합니다.', 'value와 onChange 또는 defaultValue를 사용합니다. readOnly, disabled, required와 native form reset을 지원합니다.', 'invalid는 오류 모양을 표시합니다. 오류 문구는 FormField의 error 등으로 입력과 함께 연결하세요.'],
};
function Option({ children, checked, onChange }: { children: ReactNode; checked: boolean; onChange: (checked: boolean) => void }) {
  const id = useId();
  return <label htmlFor={id} className="flex min-h-11 items-center gap-3 text-g-small"><Checkbox id={id} checked={checked} onCheckedChange={value => onChange(value === true)}/>{children}</label>;
}
export function ControlPage({ name, initialPanel = 'usage' }: { name: ControlName; initialPanel?: 'settings' | 'code' | 'usage' }) {
  const id = useId();
  const [panel, setPanel] = useState(initialPanel);
  const [disabled, setDisabled] = useState(false), [readOnly, setReadOnly] = useState(false), [error, setError] = useState(false);
  const [checked, setChecked] = useState<boolean | 'indeterminate'>(false);
  const [value, setValue] = useState(name === 'FormField' ? 'hangyeol@example.com' : '주말에는 책을 읽거나 가까운 동네를 산책해요.');
  const [volume, setVolume] = useState(45), [range, setRange] = useState([20, 80]);
  const [loading, setLoading] = useState(name === 'Skeleton' || name === 'LoadingSpinner');
  const [feedback, setFeedback] = useState(''), [query, setQuery] = useState('한결'), [caseSensitive, setCaseSensitive] = useState(false);
  const [columns, setColumns] = useState<1 | 2 | 3 | 4>(3), [width, setWidth] = useState<'reading' | 'content' | 'wide' | 'full'>('reading');
  const [icon, setIcon] = useState<IconName>('star'), [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  let live: ReactNode, settings: ReactNode = null, body = '', declarations = '', imports: string[] = [];
  const addImport = (symbols: string, path: string) => imports.push(`import { ${symbols} } from './hangyeol/${path}';`);
  const response = <p role="status" className="text-g-small text-g-soft">{feedback || '이 예제의 변경과 저장은 실제 서비스에 연결되지 않습니다.'}</p>;
  if (name === 'Checkbox' || name === 'Switch') {
    const label = name === 'Checkbox' ? '모든 알림 선택' : '새 소식을 이메일로 받기';
    const widget = name === 'Checkbox' ? <Checkbox id={id} name="notifications" value="yes" checked={checked} onCheckedChange={setChecked} disabled={disabled}/> : <Switch id={id} name="notifications" value="yes" checked={checked === true} onCheckedChange={setChecked} disabled={disabled}/>;
    live = <form className="grid gap-4" onReset={() => { setChecked(false); setFeedback('선택을 초기화했습니다.'); }} onSubmit={event => { event.preventDefault(); const selected = new FormData(event.currentTarget).has('notifications'); setFeedback(selected ? '이 예제에서 알림을 선택했습니다.' : '이 예제에서 알림을 선택하지 않았습니다.'); }}><label htmlFor={id} className="flex min-h-11 items-center gap-3">{widget}{label}</label><ActionGroup align="start"><Button type="submit">선택 확인</Button><Button variant="secondary" type="reset">초기화</Button></ActionGroup>{response}</form>;
    settings = <><Option checked={disabled} onChange={setDisabled}>사용할 수 없음</Option>{name === 'Checkbox' && <Select label="선택 상태" value={String(checked)} onValueChange={next => setChecked(next === 'indeterminate' ? next : next === 'true')} options={[{ value: 'false', label: '선택 안 함' }, { value: 'true', label: '모두 선택' }, { value: 'indeterminate', label: '일부 선택' }]}/>}</>;
    addImport(name, `primitives/${name.toLowerCase()}`); addImport('Button', 'primitives/button'); addImport('ActionGroup', 'components/action-group');
    declarations = `const id = useId();\n  const [checked, setChecked] = useState<${name === 'Checkbox' ? "boolean | 'indeterminate'" : 'boolean'}>(${JSON.stringify(checked === 'indeterminate' && name === 'Switch' ? false : checked)});\n  const [message, setMessage] = useState('');`;
    body = `<form className="grid gap-4" onReset={() => { setChecked(false); setMessage('선택을 초기화했습니다.'); }} onSubmit={event => { event.preventDefault(); setMessage(new FormData(event.currentTarget).has('notifications') ? '이 예제에서 알림을 선택했습니다.' : '이 예제에서 알림을 선택하지 않았습니다.'); }}>\n      <label htmlFor={id} className="flex min-h-11 items-center gap-3"><${name} id={id} name="notifications" value="yes" checked={checked} onCheckedChange={setChecked} disabled={${disabled}}/>${label}</label>\n      <ActionGroup align="start"><Button type="submit">선택 확인</Button><Button variant="secondary" type="reset">초기화</Button></ActionGroup>\n      <p role="status">{message || '이 예제의 변경과 저장은 실제 서비스에 연결되지 않습니다.'}</p>\n    </form>`;
  } else if (name === 'Textarea') {
    live = <form className="grid gap-4" onReset={() => { setValue('주말에는 책을 읽거나 가까운 동네를 산책해요.'); setFeedback('자기소개를 초기화했습니다.'); }} onSubmit={event => { event.preventDefault(); setFeedback('이 예제에 자기소개를 저장했습니다.'); }}><FormField label="자기소개" hint="좋아하는 일이나 관심사를 알려 주세요." error={error ? '자기소개를 10자 이상 입력해 주세요.' : undefined} inputProps={{ id, name: 'bio', required: true }}>{field => <Textarea id={field.id} aria-describedby={field['aria-describedby']} invalid={!!field.invalid} name="bio" required rows={4} value={value} onChange={event => setValue(event.target.value)} readOnly={readOnly} disabled={disabled}/>}</FormField><ActionGroup align="start"><Button type="submit" disabled={disabled}>저장</Button><Button variant="secondary" type="reset">초기화</Button></ActionGroup>{response}</form>;
    settings = <><Option checked={disabled} onChange={setDisabled}>사용할 수 없음</Option><Option checked={readOnly} onChange={setReadOnly}>읽기 전용</Option><Option checked={error} onChange={setError}>오류 안내 보기</Option></>;
    addImport('Textarea', 'primitives/textarea'); addImport('FormField', 'components/form-field'); addImport('ActionGroup', 'components/action-group'); addImport('Button', 'primitives/button');
    declarations = `const [bio, setBio] = useState(${JSON.stringify(value)});\n  const [message, setMessage] = useState('');`;
    body = `<form className="grid gap-4" onReset={() => { setBio('주말에는 책을 읽거나 가까운 동네를 산책해요.'); setMessage('자기소개를 초기화했습니다.'); }} onSubmit={event => { event.preventDefault(); setMessage('이 예제에 자기소개를 저장했습니다.'); }}>\n      <FormField label="자기소개" hint="좋아하는 일이나 관심사를 알려 주세요." error={${error ? JSON.stringify('자기소개를 10자 이상 입력해 주세요.') : 'undefined'}} inputProps={{ name: 'bio', required: true }}>{field => <Textarea id={field.id} aria-describedby={field['aria-describedby']} invalid={!!field.invalid} name="bio" required rows={4} value={bio} onChange={event => setBio(event.target.value)} readOnly={${readOnly}} disabled={${disabled}}/>}</FormField>\n      <ActionGroup align="start"><Button type="submit" disabled={${disabled}}>저장</Button><Button variant="secondary" type="reset">초기화</Button></ActionGroup><p role="status">{message || '이 예제의 변경과 저장은 실제 서비스에 연결되지 않습니다.'}</p>\n    </form>`;
  } else if (name === 'Slider') {
    live = <form className="grid gap-6" onReset={() => { setVolume(45); setRange([20, 80]); setFeedback('슬라이더 값을 초기화했습니다.'); }} onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); setFeedback(data.has('volume') ? `선택한 음량: ${data.get('volume')}%. 가격 범위: ${data.getAll('price[]').join('~')}만원.` : '사용할 수 없는 입력은 제출되지 않습니다.'); }}><div className="grid gap-2"><p>음량 {volume}%</p><Slider label="음량" name="volume" value={[volume]} onValueChange={next => setVolume(next[0])} disabled={disabled}/></div><div className="grid gap-2"><p>가격 범위 {range.join('~')}만원</p><Slider label="가격 범위" name="price" thumbLabels={['최소 가격', '최대 가격']} value={range} onValueChange={setRange} step={5} disabled={disabled}/></div><ActionGroup align="start"><Button type="submit">선택 확인</Button><Button type="reset" variant="secondary">초기화</Button></ActionGroup>{response}</form>;
    settings = <Option checked={disabled} onChange={setDisabled}>사용할 수 없음</Option>;
    addImport('Slider', 'primitives/slider'); addImport('ActionGroup', 'components/action-group'); addImport('Button', 'primitives/button');
    declarations = `const [volume, setVolume] = useState(${volume});\n  const [range, setRange] = useState(${JSON.stringify(range)});\n  const [message, setMessage] = useState('');`;
    body = `<form className="grid gap-6" onReset={() => { setVolume(45); setRange([20, 80]); setMessage('슬라이더 값을 초기화했습니다.'); }} onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); setMessage(data.has('volume') ? '선택한 음량: ' + data.get('volume') + '%. 가격 범위: ' + data.getAll('price[]').join('~') + '만원.' : '사용할 수 없는 입력은 제출되지 않습니다.'); }}>\n      <div className="grid gap-2"><p>음량 {volume}%</p><Slider label="음량" name="volume" value={[volume]} onValueChange={next => setVolume(next[0])} disabled={${disabled}}/></div>\n      <div className="grid gap-2"><p>가격 범위 {range.join('~')}만원</p><Slider label="가격 범위" name="price" thumbLabels={['최소 가격', '최대 가격']} value={range} onValueChange={setRange} step={5} disabled={${disabled}}/></div>\n      <ActionGroup align="start"><Button type="submit">선택 확인</Button><Button type="reset" variant="secondary">초기화</Button></ActionGroup><p role="status">{message || '이 예제의 변경과 저장은 실제 서비스에 연결되지 않습니다.'}</p>\n    </form>`;
  } else if (name === 'Progress') {
    live = <div className="grid gap-4"><p>{loading ? '사진을 업로드하고 있어요.' : `사진 업로드 ${volume}%`}</p><Progress label="사진 업로드" value={loading ? null : volume}/></div>;
    settings = <><Option checked={loading} onChange={setLoading}>진행 정도를 모르는 상태</Option><Slider label="예제 진행 정도" value={[volume]} onValueChange={next => setVolume(next[0])}/></>;
    addImport('Progress', 'primitives/progress'); body = `<div className="grid gap-4"><p>${loading ? '사진을 업로드하고 있어요.' : `사진 업로드 ${volume}%`}</p><Progress label="사진 업로드" value={${loading ? 'null' : volume}}/></div>`;
  } else if (name === 'Skeleton' || name === 'LoadingSpinner') {
    live = <div className="grid gap-4" aria-busy={loading}>{loading ? name === 'Skeleton' ? <><Skeleton shape="circle"/><Skeleton/><Skeleton shape="block"/><p role="status" className="text-g-small text-g-soft">프로필을 불러오는 중입니다.</p></> : <div className="flex items-center gap-3"><LoadingSpinner label="프로필을 불러오는 중입니다."/><span>프로필을 불러오는 중입니다.</span></div> : <div><h3 className="font-semibold">김한결</h3><p className="text-g-soft">주말에는 책을 읽거나 가까운 동네를 산책해요.</p></div>}</div>;
    settings = <Option checked={loading} onChange={setLoading}>불러오는 중</Option>;
    addImport(name, `primitives/${name === 'Skeleton' ? 'skeleton' : 'loading-spinner'}`);
    body = loading ? name === 'Skeleton' ? '<div className="grid gap-4" aria-busy><Skeleton shape="circle"/><Skeleton/><Skeleton shape="block"/><p role="status">프로필을 불러오는 중입니다.</p></div>' : '<div className="flex items-center gap-3" aria-busy><LoadingSpinner label="프로필을 불러오는 중입니다."/><span>프로필을 불러오는 중입니다.</span></div>' : '<div aria-busy={false}><h3>김한결</h3><p>주말에는 책을 읽거나 가까운 동네를 산책해요.</p></div>';
  } else if (name === 'Container') {
    live = <Container width={width}><h3 className="font-semibold">본문 너비와 좌우 여백</h3><p className="mt-3 leading-7 text-g-soft">Container는 본문의 최대 너비를 제한하고 가운데 정렬합니다. 너비 옵션을 바꾸어도 부모 영역을 넘지 않으며, 긴 본문은 reading 너비로 읽는 길이를 조절할 수 있습니다.</p></Container>;
    settings = <Select label="본문 너비" value={width} onValueChange={next => setWidth(next as typeof width)} options={[{ value: 'reading', label: '읽기 편한 너비' }, { value: 'content', label: '기본 본문 너비' }, { value: 'wide', label: '넓은 너비' }, { value: 'full', label: '전체 너비' }]}/>;
    addImport('Container', 'primitives/container'); body = `<Container width="${width}"><h3 className="font-semibold">본문 너비와 좌우 여백</h3><p className="mt-3 leading-7 text-g-soft">Container는 본문의 최대 너비를 제한하고 가운데 정렬합니다. 너비 옵션을 바꾸어도 부모 영역을 넘지 않으며, 긴 본문은 reading 너비로 읽는 길이를 조절할 수 있습니다.</p></Container>`;
  } else if (name === 'Grid') {
    live = <Grid columns={columns}>{['사진', '메모', '할 일'].map(title => <article key={title} className="grid gap-2 rounded-g-panel bg-g-muted p-4"><h3 className="font-medium">{title}</h3><p className="text-g-small text-g-soft">자주 사용하는 내용을 한곳에 모아 보세요.</p></article>)}</Grid>;
    settings = <Select label="넓은 화면의 열 수" value={String(columns)} onValueChange={next => setColumns(Number(next) as typeof columns)} options={[1, 2, 3, 4].map(count => ({ value: String(count), label: `${count}열` }))}/>;
    addImport('Grid', 'primitives/grid'); body = `<Grid columns={${columns}}>{['사진', '메모', '할 일'].map(title => <article key={title} className="grid gap-2 rounded-g-panel bg-g-muted p-4"><h3 className="font-medium">{title}</h3><p className="text-g-small text-g-soft">자주 사용하는 내용을 한곳에 모아 보세요.</p></article>)}</Grid>`;
  } else if (name === 'Highlight') {
    const sentence = '한결디자인으로 나만의 화면을 만들어 보세요. Hangyeol Design과 한결 (Design)을 함께 찾아보세요.';
    live = <div className="grid gap-4"><FormField label="찾을 문구" inputProps={{ value: query, onChange: event => setQuery(event.target.value) }}/><p className="leading-7"><Highlight query={query} caseSensitive={caseSensitive}>{sentence}</Highlight></p></div>;
    settings = <Option checked={caseSensitive} onChange={setCaseSensitive}>대소문자 구분</Option>;
    addImport('Highlight', 'primitives/highlight'); addImport('FormField', 'components/form-field'); declarations = `const [query, setQuery] = useState(${JSON.stringify(query)});`;
    body = `<div className="grid gap-4"><FormField label="찾을 문구" inputProps={{ value: query, onChange: event => setQuery(event.target.value) }}/><p className="leading-7"><Highlight query={query} caseSensitive={${caseSensitive}}>${sentence}</Highlight></p></div>`;
  } else if (name === 'Icon') {
    live = <div className="flex flex-wrap items-center gap-6">{(['search', 'close', 'plus', 'check', 'settings', 'star'] as const).map(item => <span key={item} className="grid justify-items-center gap-2"><Icon name={item} label={{ search: '검색', close: '닫기', plus: '추가', check: '확인', settings: '설정', star: '즐겨찾기' }[item]}/><span className="text-g-caption text-g-soft">{item}</span></span>)}</div>;
    addImport('Icon', 'primitives/icon'); declarations = "const names = ['search', 'close', 'plus', 'check', 'settings', 'star'] as const;\n  const labels = { search: '검색', close: '닫기', plus: '추가', check: '확인', settings: '설정', star: '즐겨찾기' };"; body = '<div className="flex flex-wrap items-center gap-6">{names.map(name => <span key={name} className="grid justify-items-center gap-2"><Icon name={name} label={labels[name]}/><span className="text-g-caption text-g-soft">{name}</span></span>)}</div>';
  } else if (name === 'IconButton') {
    live = <div className="grid gap-4"><IconButton icon={icon} label="즐겨찾기 선택" variant="secondary" aria-pressed={checked === true} disabled={disabled} loading={loading} onClick={() => { setChecked(current => current !== true); setFeedback(checked ? '즐겨찾기를 해제했습니다.' : '즐겨찾기에 추가했습니다.'); }}/>{response}</div>;
    settings = <><Select label="아이콘" value={icon} onValueChange={next => setIcon(next as IconName)} options={[{ value: 'star', label: '별' }, { value: 'check', label: '체크' }]}/><Option checked={disabled} onChange={setDisabled}>사용할 수 없음</Option><Option checked={loading} onChange={setLoading}>처리 중</Option></>;
    addImport('IconButton', 'primitives/icon-button'); declarations = `const [selected, setSelected] = useState(${checked === true});\n  const [message, setMessage] = useState('');`;
    body = `<div className="grid gap-4"><IconButton icon="${icon}" label="즐겨찾기 선택" variant="secondary" aria-pressed={selected} disabled={${disabled}} loading={${loading}} onClick={() => { setSelected(!selected); setMessage(selected ? '즐겨찾기를 해제했습니다.' : '즐겨찾기에 추가했습니다.'); }}/><p role="status">{message || '이 예제의 변경과 저장은 실제 서비스에 연결되지 않습니다.'}</p></div>`;
  } else if (name === 'Separator') {
    live = <div className={orientation === 'horizontal' ? 'grid gap-4' : 'flex min-h-16 items-stretch gap-4'}><p>제품 정보</p><Separator orientation={orientation} decorative={false}/><p>배송 안내</p></div>;
    settings = <Select label="선 방향" value={orientation} onValueChange={next => setOrientation(next as typeof orientation)} options={[{ value: 'horizontal', label: '가로' }, { value: 'vertical', label: '세로' }]}/>;
    addImport('Separator', 'primitives/separator'); body = `<div className="${orientation === 'horizontal' ? 'grid gap-4' : 'flex min-h-16 items-stretch gap-4'}"><p>제품 정보</p><Separator orientation="${orientation}" decorative={false}/><p>배송 안내</p></div>`;
  } else if (name === 'FormField') {
    live = <FormField label="이메일" hint="소식을 받을 이메일 주소를 입력하세요." error={error ? '이메일 주소에 @와 도메인을 포함해 주세요.' : undefined} inputProps={{ name: 'email', type: 'email', value, onChange: event => setValue(event.target.value), required: true, disabled }}/>;
    settings = <><Option checked={disabled} onChange={setDisabled}>사용할 수 없음</Option><Option checked={error} onChange={setError}>오류 안내 보기</Option></>;
    addImport('FormField', 'components/form-field'); declarations = `const [email, setEmail] = useState(${JSON.stringify(value)});`; body = `<FormField label="이메일" hint="소식을 받을 이메일 주소를 입력하세요." error={${error ? JSON.stringify('이메일 주소에 @와 도메인을 포함해 주세요.') : 'undefined'}} inputProps={{ name: 'email', type: 'email', value: email, onChange: event => setEmail(event.target.value), required: true, disabled: ${disabled} }}/>`;
  } else if (name === 'EmptyState') {
    live = <div className="grid gap-4"><EmptyState heading="아직 새 알림이 없어요" description="새 소식이 도착하면 이곳에서 확인할 수 있어요." actions={<Button onClick={() => setFeedback('이 예제에서 새 소식을 확인했습니다.')}>새 소식 확인</Button>}/>{response}</div>;
    addImport('EmptyState', 'components/empty-state'); addImport('Button', 'primitives/button'); declarations = "const [message, setMessage] = useState('');";
    body = '<div className="grid gap-4"><EmptyState heading="아직 새 알림이 없어요" description="새 소식이 도착하면 이곳에서 확인할 수 있어요." actions={<Button onClick={() => setMessage(\'이 예제에서 새 소식을 확인했습니다.\')}>새 소식 확인</Button>}/><p role="status">{message || \'이 예제의 변경과 저장은 실제 서비스에 연결되지 않습니다.\'}</p></div>';
  } else {
    const actions = <><Button disabled={disabled} onClick={() => setFeedback(name === 'ActionGroup' ? '이 예제에 내용을 저장했습니다.' : '이 예제에서 새 알림을 확인했습니다.')}>{name === 'ActionGroup' ? '저장' : '새 소식 확인'}</Button>{name === 'ActionGroup' && <Button variant="secondary" onClick={() => setFeedback('저장을 취소했습니다.')}>취소</Button>}</>;
    live = <div className="grid gap-4">{name === 'ActionGroup' ? <ActionGroup align="end">{actions}</ActionGroup> : name === 'ListHeader' ? <ListHeader heading="알림" description="최근 소식을 확인하세요." count={2} actions={actions}/> : <ListFooter actions={actions}>알림 2개를 모두 확인했습니다.</ListFooter>}{response}</div>;
    settings = <Option checked={disabled} onChange={setDisabled}>사용할 수 없음</Option>;
    addImport(name, `components/${name === 'ActionGroup' ? 'action-group' : name === 'ListHeader' ? 'list-header' : 'list-footer'}`); addImport('Button', 'primitives/button'); declarations = "const [message, setMessage] = useState('');";
    const button = `<Button disabled={${disabled}} onClick={() => setMessage('${name === 'ActionGroup' ? '이 예제에 내용을 저장했습니다.' : '이 예제에서 새 알림을 확인했습니다.'}')}>${name === 'ActionGroup' ? '저장' : '새 소식 확인'}</Button>`;
    body = `<div className="grid gap-4">${name === 'ActionGroup' ? `<ActionGroup align="end">${button}<Button variant="secondary" onClick={() => setMessage('저장을 취소했습니다.')}>취소</Button></ActionGroup>` : name === 'ListHeader' ? `<ListHeader heading="알림" description="최근 소식을 확인하세요." count={2} actions={${button}}/>` : `<ListFooter actions={${button}}>알림 2개를 모두 확인했습니다.</ListFooter>`}<p role="status">{message || '이 예제의 변경과 저장은 실제 서비스에 연결되지 않습니다.'}</p></div>`;
  }
  const reset = () => { setDisabled(false); setReadOnly(false); setError(false); setChecked(false); setValue(name === 'FormField' ? 'hangyeol@example.com' : '주말에는 책을 읽거나 가까운 동네를 산책해요.'); setVolume(45); setRange([20, 80]); setLoading(name === 'Skeleton' || name === 'LoadingSpinner'); setFeedback(''); setQuery('한결'); setCaseSensitive(false); setColumns(3); setWidth('reading'); setIcon('star'); setOrientation('horizontal'); };
  const code = (declarations ? "import { useId, useState } from 'react';\n" : '') + imports.join('\n') + `\n\nexport function ${name}Example() {\n  ${declarations}\n  return ${body};\n}`;
  return <div className="docs-page"><ComponentIntroduction name={name} description={controlDescriptions[name]} leadClassName="docs-lead"/><ExamplePurpose name={name}/><PreviewSurface asChild><section  aria-label={`${name} 예제`}>{live}</section></PreviewSurface><Tabs value={panel} onValueChange={next => setPanel(next as typeof panel)}><div className="flex flex-wrap items-center justify-between gap-3"><TabsList aria-label="예제 설명"><TabsTrigger value="usage">사용법</TabsTrigger><TabsTrigger value="settings">예제 설정</TabsTrigger><TabsTrigger value="code">코드</TabsTrigger></TabsList><Button variant="quiet" size="small" onClick={reset}>예제 되돌리기</Button></div><TabsContent value="settings" className="mt-6"><ControlGroup asChild><div className="docs-controls">{settings || <p className="text-g-small text-g-soft">위 예제를 살펴보세요.</p>}</div></ControlGroup></TabsContent><TabsContent value="code" className="mt-6"><CodeBlock>{code}</CodeBlock></TabsContent><TabsContent value="usage" className="mt-6"><ul className="docs-usage">{usage[name].map(text => <li key={text}>{text}</li>)}</ul><p className="mt-6 text-g-small text-g-soft">코드는 설치된 로컬 소스 경로를 사용합니다. 예제의 데이터와 저장·조회 동작은 컴포넌트 자체 기능이 아닙니다.</p></TabsContent></Tabs></div>;
}

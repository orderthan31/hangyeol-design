import { PreviewSurface } from './hangyeol/primitives/preview-surface';
import { ComponentIntroduction, ExamplePurpose } from './component-content';
import { useState } from 'react';
import { RadioGroup } from './hangyeol/primitives/radio-group';
import { SegmentedControl } from './hangyeol/components/segmented-control';
import { Combobox } from './hangyeol/components/combobox';
import { MultiSelect } from './hangyeol/components/multi-select';
import { IconAction } from './hangyeol/components/icon-action';
import { Popover, PopoverTrigger, PopoverContent, PopoverClose, PopoverTitle } from './hangyeol/primitives/popover';
import { Tooltip } from './hangyeol/primitives/tooltip';
import { Button } from './hangyeol/primitives/button';
import { Checkbox } from './hangyeol/primitives/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './hangyeol/primitives/tabs';
import { CodeBlock } from './hangyeol/components/code-block';

export const selectionNames = ['Combobox', 'IconAction', 'MultiSelect', 'Popover', 'RadioGroup', 'SegmentedControl', 'Tooltip'] as const;
export type SelectionName = typeof selectionNames[number];
export const selectionDescriptions: Record<SelectionName, string> = {
  Combobox: '선택지가 많을 때 검색해 한 항목을 고릅니다.',
  IconAction: '아이콘으로 행동을 간결하게 보여주고 이름과 설명을 함께 제공합니다.',
  MultiSelect: '접힌 목록에서 여러 항목을 고르고 선택한 항목을 정리합니다.',
  Popover: '화면을 벗어나지 않고 간단한 설정이나 추가 정보를 펼칩니다.',
  RadioGroup: '여러 선택지를 한눈에 비교하고 하나를 고릅니다.',
  SegmentedControl: '관련 있는 선택을 짧은 버튼 묶음으로 바꿉니다.',
  Tooltip: '아이콘이나 짧은 이름에 보조 설명을 덧붙입니다.',
};
const choices = [{ value: 'email', label: '이메일' }, { value: 'message', label: '문자 메시지' }, { value: 'push', label: '앱 알림' }, { value: 'phone', label: '전화 (예제에서 비활성)', disabled: true }];
const categories = [{ value: 'plan', label: '기획' }, { value: 'design', label: '디자인' }, { value: 'development', label: '개발' }, { value: 'operations', label: '운영 (예제에서 비활성)', disabled: true }];
const periods = [{ value: 'day', label: '일간' }, { value: 'week', label: '주간' }, { value: 'month', label: '한 달 보기 (예제에서 비활성)', disabled: true }];
const files: Record<SelectionName, string> = { Combobox: 'components/combobox', IconAction: 'components/icon-action', MultiSelect: 'components/multi-select', Popover: 'primitives/popover', RadioGroup: 'primitives/radio-group', SegmentedControl: 'components/segmented-control', Tooltip: 'primitives/tooltip' };
const tooltipText = '다시 찾기 쉽게 항목을 고정합니다. 중요한 안내는 이 설명뿐 아니라 화면에도 표시하세요.';
const usage: Record<SelectionName, string[]> = {
  RadioGroup: ['label로 묶음의 이름을 지정하고 options에 value, label, disabled를 넣습니다. value와 onValueChange로 선택을 관리하거나 defaultValue로 초기 선택만 정하세요.', '방향키로 선택지를 이동하고 Space로 고릅니다. 사용할 수 없는 선택지는 건너뜁니다. name과 form은 native 폼 제출에 연결되며 required는 선택을 필수로 만듭니다.', 'defaultValue를 사용하면 폼 초기화 때 초기 선택으로 돌아옵니다. value를 직접 관리하면 화면의 onReset에서 그 값도 바꾸세요. hint와 error는 묶음에 연결됩니다.'],
  SegmentedControl: ['label은 묶음의 접근 가능한 이름입니다. options의 value, label, disabled로 선택지를 구성합니다. 선택에 따라 다른 화면을 보여주는 탭과 달리, 이 컴포넌트는 값만 바꿉니다.', '기본적으로 이미 선택한 항목을 다시 눌러도 해제하지 않습니다. allowEmpty를 켜면 빈 문자열로 해제할 수 있습니다. 초기 선택은 value 또는 defaultValue로 지정하세요.', '방향키는 초점을 이동하고 Space로 선택합니다. name이 있으면 선택한 값을 제출합니다. disabled인 묶음이나 선택지는 제출에서 제외합니다. 폼 초기화의 값 소유는 RadioGroup와 같습니다.'],
  Combobox: ['options는 value, label, disabled를 받습니다. 입력에 보이는 검색어와 선택한 value는 별개입니다. onQueryChange는 검색어를, onValueChange는 고른 항목의 값을 전달합니다.', '입력하거나 선택지 버튼을 누르면 목록을 펼칩니다. 방향키로 사용할 수 있는 항목을 이동하고 Enter로 확정합니다. Escape와 목록 밖으로 이동은 검색을 취소하고 이전 선택을 보여줍니다. 글자 조합 중인 Enter는 선택하거나 폼을 제출하지 않습니다.', 'name으로 제출하는 값은 선택지의 value이며 입력에 보이는 이름이나 검색어가 아닙니다. required이면 검색어만 입력해서는 제출할 수 없습니다. ref는 실제 입력을 가리킵니다. readOnly는 값을 유지하고 변경을 막으며 disabled는 제출에서도 제외합니다.', 'clearable의 기본값은 true입니다. 선택 지우기 후 입력에 초점이 돌아옵니다. options에 없는 value는 폼 검증에서 알립니다. 이 예제의 검색은 전달한 목록 안에서만 이루어지며 서버를 호출하지 않습니다.'],
  MultiSelect: ['value와 defaultValue는 문자열 배열입니다. options의 value, label, disabled로 선택지를 구성합니다. 목록을 펼쳐 Tab으로 항목을 이동하고 Space로 선택하거나 해제합니다.', 'showTags는 기본 true이며 false로 선택 태그를 숨길 수 있습니다. 태그를 눌러 하나씩 해제하거나 선택 지우기로 변경할 수 있는 항목을 비웁니다. 비활성 선택은 변경하지 않습니다. CheckboxGroup의 showTags와는 다른 계약입니다.', 'maxSelections는 새로 고를 수 있는 항목 수를 제한합니다. 기본은 제한 없음이며 0이면 새 항목을 선택할 수 없습니다. 제한을 낮추더라도 기존 value를 몰래 잘라내지 않으며, 기존 선택은 해제할 수 있습니다.', 'name에는 사용할 수 있는 선택 값을 같은 이름으로 여러 개 제출합니다. FormData.getAll(name)을 사용하세요. disabled인 전체 입력과 비활성 선택지는 제외합니다. defaultValue는 native 초기화를 따르고 직접 관리한 value는 화면에서 초기화합니다.'],
  IconAction: ['icon에는 Icon의 이름, label에는 행동의 이름을 넣습니다. label은 툴팁 표시 여부와 관계없이 버튼의 접근 가능한 이름으로 남습니다. tooltip으로 보조 설명을 바꿀 수 있습니다.', 'showLabel은 버튼 옆에 이름을 함께 표시합니다. variant, size, disabled, loading과 onClick은 IconButton에 전달합니다. 이 조합은 type="button"으로 폼을 제출하지 않습니다.', '실제 행동과 저장은 onClick에 연결한 화면이 처리합니다. 이 예제는 클릭 횟수만 표시하며 항목을 저장하지 않습니다. disabled와 loading은 실행을 막습니다.'],
  Popover: ['Popover 안에 PopoverTrigger와 PopoverContent를 둡니다. asChild를 쓰면 Button 같은 기존 요소를 트리거로 사용합니다. 콘텐츠에는 aria-label이나 PopoverTitle로 이름을 제공하세요.', '기본은 비모달이며 화면의 다른 요소를 막지 않습니다. 목록 밖을 누르거나 Escape로 닫고, 닫기 버튼에는 PopoverClose를 사용합니다. open과 onOpenChange로 펼침 상태를 직접 관리할 수도 있습니다.', 'PopoverContent의 side, align, sideOffset, collisionPadding으로 위치를 조정합니다. 주변 공간에 따라 위치를 바꾸며 긴 내용은 내부에서 스크롤합니다. 중첩한 테마와 사용자 정의 색상은 콘텐츠에도 이어집니다.', '간단한 설정이나 버튼이 필요한 설명에는 Popover를, 짧은 비대화형 설명에는 Tooltip을 사용하세요. 전체 작업을 가로막아야 하는 경우는 Dialog가 적합합니다.'],
  Tooltip: ['기존 버튼을 Tooltip으로 감싸고 content에 보조 설명을 넣습니다. 마우스를 올리거나 키보드로 초점을 맞추면 표시하며 Escape로 닫습니다. 버튼 이름은 버튼 자체에도 남겨 두세요.', 'delayDuration은 표시 지연 시간입니다. side와 align으로 위치를 조정합니다. 여러 트리거의 표시 정책을 함께 관리하려면 TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent를 조합할 수 있습니다.', '툴팁에는 버튼이나 입력 같은 조작 요소를 넣지 마세요. 터치 화면과 비활성 버튼에서는 설명을 발견하기 어려우므로, 중요한 안내나 오류는 툴팁뿐 아니라 보이는 본문에도 제공합니다.'],
};
export function SelectionPage({ name, initialPanel = 'usage' }: { name: SelectionName; initialPanel?: 'settings' | 'code' | 'usage' }) {
  const [panel, setPanel] = useState(initialPanel), [disabled, setDisabled] = useState(false), [error, setError] = useState(false), [readOnly, setReadOnly] = useState(false), [required, setRequired] = useState(false);
  const [current, setCurrent] = useState(name === 'SegmentedControl' ? 'week' : name === 'Combobox' ? 'design' : 'email'), [selected, setSelected] = useState(['email']);
  const [showTags, setShowTags] = useState(true), [allowEmpty, setAllowEmpty] = useState(false), [limit, setLimit] = useState(2), [showLabel, setShowLabel] = useState(false), [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false), [help, setHelp] = useState(true), [delay, setDelay] = useState(700), [clicks, setClicks] = useState(0), [feedback, setFeedback] = useState('');
  const problem = error ? '선택한 내용을 다시 확인해 주세요.' : undefined;
  const inputLike = ['RadioGroup', 'SegmentedControl', 'Combobox', 'MultiSelect'].includes(name), supportsError = ['RadioGroup', 'Combobox', 'MultiSelect'].includes(name);
  const baseline = name === 'SegmentedControl' ? 'week' : name === 'Combobox' ? 'design' : 'email';
  const resetValues = () => { setCurrent(baseline); setSelected(['email']); setFeedback(''); setOpen(false); setClicks(0); setHelp(true); };
  let demo;
  if (name === 'RadioGroup') demo = <RadioGroup label="연락 받는 방법" options={choices} name="contact" value={current} onValueChange={setCurrent} disabled={disabled} required={required} error={problem}/>;
  else if (name === 'SegmentedControl') demo = <SegmentedControl label="표시 기간" options={periods} name="period" value={current} onValueChange={setCurrent} disabled={disabled} allowEmpty={allowEmpty}/>;
  else if (name === 'Combobox') demo = <Combobox label="업무 분류" options={categories} name="category" value={current} onValueChange={setCurrent} disabled={disabled} readOnly={readOnly} required={required} error={problem} placeholder="이름으로 찾기"/>;
  else if (name === 'MultiSelect') demo = <MultiSelect label="알림 받는 방법" options={choices} name="notifications" value={selected} onValueChange={setSelected} disabled={disabled} showTags={showTags} maxSelections={limit} error={problem}/>;
  else if (name === 'IconAction') demo = <IconAction icon="star" label="즐겨찾기에 추가" tooltip="목록에서 다시 찾기 쉽게 표시합니다." variant="secondary" disabled={disabled} loading={loading} showLabel={showLabel} onClick={() => { setClicks(count => count + 1); setFeedback('이 예제는 클릭 횟수만 표시하며 저장하지 않습니다.'); }}/>;
  else if (name === 'Popover') demo = <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button variant="secondary" disabled={disabled}>표시 옵션</Button></PopoverTrigger><PopoverContent aria-label="표시 옵션"><PopoverTitle>표시 옵션</PopoverTitle><label className="flex min-h-11 items-center gap-3"><Checkbox checked={help} onCheckedChange={next => setHelp(next === true)}/>보조 설명 표시</label>{help && <p className="text-g-small text-g-soft">이 예제의 설정에만 적용합니다.</p>}<PopoverClose asChild><Button variant="secondary">닫기</Button></PopoverClose></PopoverContent></Popover>;
  else demo = <Tooltip content={tooltipText} delayDuration={delay} open={open} onOpenChange={setOpen}><Button variant="secondary" disabled={disabled}>항목 고정</Button></Tooltip>;
  const state = `const [value, setValue] = useState(${JSON.stringify(current)});`, optionsJson = JSON.stringify(name === 'Combobox' ? categories : name === 'SegmentedControl' ? periods : choices);
  let extraImports = '', declarations = '', body = '', onReset = 'setResult("");';
  const disabledAttr = `disabled={${disabled}}`, errorAttr = problem ? ` error=${JSON.stringify(problem)}` : '';
  if (name === 'RadioGroup') { declarations = state; body = `<RadioGroup label="연락 받는 방법" options={${optionsJson}} name="contact" value={value} onValueChange={setValue} ${disabledAttr} required={${required}}${errorAttr}/>`; onReset += ' setValue("email");'; }
  else if (name === 'SegmentedControl') { declarations = state; body = `<SegmentedControl label="표시 기간" options={${optionsJson}} name="period" value={value} onValueChange={setValue} ${disabledAttr} allowEmpty={${allowEmpty}}/>`; onReset += ' setValue("week");'; }
  else if (name === 'Combobox') { declarations = state; body = `<Combobox label="업무 분류" options={${optionsJson}} name="category" value={value} onValueChange={setValue} ${disabledAttr} readOnly={${readOnly}} required={${required}}${errorAttr} placeholder="이름으로 찾기"/>`; onReset += ' setValue("design");'; }
  else if (name === 'MultiSelect') { declarations = `const [value, setValue] = useState<string[]>(${JSON.stringify(selected)});`; body = `<MultiSelect label="알림 받는 방법" options={${optionsJson}} name="notifications" value={value} onValueChange={setValue} ${disabledAttr} showTags={${showTags}} maxSelections={${limit}}${errorAttr}/>`; onReset += ' setValue(["email"]);'; }
  else if (name === 'IconAction') { declarations = `const [clicks, setClicks] = useState(${clicks});`; body = `<IconAction icon="star" label="즐겨찾기에 추가" tooltip="목록에서 다시 찾기 쉽게 표시합니다." variant="secondary" ${disabledAttr} loading={${loading}} showLabel={${showLabel}} onClick={() => setClicks(count => count + 1)}/><p role="status">{clicks}번 누름 · 저장하지 않는 예제</p>`; onReset += ' setClicks(0);'; }
  else if (name === 'Popover') { extraImports = ', PopoverTrigger, PopoverContent, PopoverClose, PopoverTitle'; declarations = `const [open, setOpen] = useState(${open});\n  const [help, setHelp] = useState(${help});`; body = '<Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button variant="secondary" ' + disabledAttr + '>표시 옵션</Button></PopoverTrigger><PopoverContent aria-label="표시 옵션"><PopoverTitle>표시 옵션</PopoverTitle><label><Checkbox checked={help} onCheckedChange={next => setHelp(next === true)}/>보조 설명 표시</label>{help && <p>이 예제의 설정에만 적용합니다.</p>}<PopoverClose asChild><Button variant="secondary">닫기</Button></PopoverClose></PopoverContent></Popover>'; onReset += ' setOpen(false); setHelp(true);'; }
  else { declarations = `const [open, setOpen] = useState(${open});`; body = `<Tooltip content=${JSON.stringify(tooltipText)} delayDuration={${delay}} open={open} onOpenChange={setOpen}><Button variant="secondary" ${disabledAttr}>항목 고정</Button></Tooltip>`; onReset += ' setOpen(false);'; }
  const code = `import { useState } from 'react';\nimport { ${name}${extraImports} } from './hangyeol/${files[name]}';\nimport { Button } from './hangyeol/primitives/button';\n${name === 'Popover' ? "import { Checkbox } from './hangyeol/primitives/checkbox';\n" : ''}\nexport function Example() {\n  ${declarations}\n  const [result, setResult] = useState("");\n  return <form onReset={() => { ${onReset} }} onSubmit={event => {\n    event.preventDefault();\n    setResult(JSON.stringify(Array.from(new FormData(event.currentTarget).entries())));\n  }}>\n    ${body}\n    <Button type="submit">제출 값 보기</Button>\n    <Button type="reset" variant="secondary">예제 값 초기화</Button>\n    <p role="status">{result}</p>\n  </form>;\n}`;
  return <div className="space-y-8"><ComponentIntroduction name={name} description={selectionDescriptions[name]} leadClassName="docs-intro"/>
    <ExamplePurpose name={name}/>
    <PreviewSurface asChild><section  aria-label={`${name} 사용 예제`}><form className="grid gap-4" onReset={resetValues} onSubmit={event => { event.preventDefault(); setFeedback(JSON.stringify(Array.from(new FormData(event.currentTarget).entries()))); }}>{demo}
      {name === 'IconAction' && <p role="status" className="text-g-small text-g-soft">{clicks}번 누름 · 저장하지 않는 예제</p>}
      {inputLike && <div className="flex flex-wrap gap-2"><Button type="submit">제출 값 보기</Button><Button type="reset" variant="secondary">입력 초기화</Button></div>}
      {inputLike && <p role="status" className="break-all text-g-small text-g-soft">{feedback || '선택한 값만 확인합니다. 서버에 저장하지 않습니다.'}</p>}
      {name === 'Tooltip' && <p className="text-g-small text-g-soft">중요한 안내는 화면에도 보이게 제공합니다. 터치 화면에서는 툴팁만으로 안내하지 않습니다.</p>}
    </form></section></PreviewSurface>
    <Tabs value={panel} onValueChange={next => setPanel(next as typeof panel)}><TabsList aria-label="예제 안내"><TabsTrigger value="usage">사용법</TabsTrigger><TabsTrigger value="settings">예제 설정</TabsTrigger><TabsTrigger value="code">코드</TabsTrigger></TabsList>
      <TabsContent value="settings"><div className="grid gap-3 py-4">
        <label className="flex min-h-11 items-center gap-3"><Checkbox checked={disabled} onCheckedChange={next => { setDisabled(next === true); if (next === true) setOpen(false); }}/>사용할 수 없는 상태</label>
        {supportsError && <label className="flex min-h-11 items-center gap-3"><Checkbox checked={error} onCheckedChange={next => setError(next === true)}/>오류 안내 표시</label>}
        {name === 'Combobox' && <label className="flex min-h-11 items-center gap-3"><Checkbox checked={readOnly} onCheckedChange={next => setReadOnly(next === true)}/>읽기 전용</label>}
        {(name === 'RadioGroup' || name === 'Combobox') && <label className="flex min-h-11 items-center gap-3"><Checkbox checked={required} onCheckedChange={next => setRequired(next === true)}/>선택 필수</label>}
        {name === 'SegmentedControl' && <label className="flex min-h-11 items-center gap-3"><Checkbox checked={allowEmpty} onCheckedChange={next => setAllowEmpty(next === true)}/>선택 해제 허용</label>}
        {name === 'MultiSelect' && <><label className="flex min-h-11 items-center gap-3"><Checkbox checked={showTags} onCheckedChange={next => setShowTags(next === true)}/>선택 태그 표시</label><SegmentedControl label="최대 선택 수" options={[{ value: '1', label: '1개' }, { value: '2', label: '2개' }, { value: '3', label: '3개' }]} value={String(limit)} onValueChange={next => setLimit(Number(next))}/></>}
        {name === 'IconAction' && <><label className="flex min-h-11 items-center gap-3"><Checkbox checked={showLabel} onCheckedChange={next => setShowLabel(next === true)}/>버튼 옆에 이름 표시</label><label className="flex min-h-11 items-center gap-3"><Checkbox checked={loading} onCheckedChange={next => setLoading(next === true)}/>처리 중</label></>}
        {name === 'Tooltip' && <SegmentedControl label="표시 지연" options={[{ value: '0', label: '바로 표시' }, { value: '700', label: '잠시 후 표시' }]} value={String(delay)} onValueChange={next => setDelay(Number(next))}/>}
        <div><Button variant="secondary" onClick={() => { resetValues(); setDisabled(false); setError(false); setReadOnly(false); setRequired(false); setShowTags(true); setAllowEmpty(false); setLimit(2); setShowLabel(false); setLoading(false); setDelay(700); }}>예제 초기화</Button></div>
      </div></TabsContent>
      <TabsContent value="code"><div className="space-y-3 py-4"><p className="text-g-small text-g-soft">현재 예제의 값과 설정을 반영합니다. 가져오는 경로는 내 프로젝트의 소스 위치에 맞추세요.</p><CodeBlock>{code}</CodeBlock></div></TabsContent>
      <TabsContent value="usage"><div className="space-y-4 py-4">{usage[name].map(line => <p key={line} className="text-g-body text-g-soft">{line}</p>)}</div></TabsContent>
    </Tabs>
  </div>;
}

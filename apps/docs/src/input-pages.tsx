import { PreviewSurface } from './hangyeol/primitives/preview-surface';
import { ComponentIntroduction, ExamplePurpose } from './component-content';
import { useRef, useState } from 'react';
import { Button } from './hangyeol/primitives/button';
import { Checkbox } from './hangyeol/primitives/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './hangyeol/primitives/tabs';
import { SearchField } from './hangyeol/components/search-field';
import { PasswordInput } from './hangyeol/components/password-input';
import { EmailInput } from './hangyeol/components/email-input';
import { PhoneInput } from './hangyeol/components/phone-input';
import { CurrencyInput } from './hangyeol/components/currency-input';
import { NumberInput } from './hangyeol/components/number-input';
import { CheckboxGroup } from './hangyeol/components/checkbox-group';
import { FileInput } from './hangyeol/components/file-input';
import { Rating } from './hangyeol/components/rating';
import { AddressField, type AddressValue } from './hangyeol/components/address-field';
import { CodeBlock } from './hangyeol/components/code-block';

export const inputNames = ['AddressField', 'CheckboxGroup', 'CurrencyInput', 'EmailInput', 'FileInput', 'NumberInput', 'PasswordInput', 'PhoneInput', 'Rating', 'SearchField'] as const;
export type InputName = typeof inputNames[number];
export const inputDescriptions: Record<InputName, string> = {
  AddressField: '우편번호, 기본 주소와 상세 주소를 한 묶음으로 입력합니다.',
  CheckboxGroup: '여러 선택지를 함께 보여주고 필요한 항목을 고릅니다.',
  CurrencyInput: '금액을 읽기 편하게 표시하면서 원래 숫자 값을 따로 관리합니다.',
  EmailInput: '이메일 주소에 맞는 키보드와 기본 입력 속성을 사용합니다.',
  FileInput: '파일을 선택하고 이름과 크기를 확인합니다.',
  NumberInput: '숫자를 직접 입력하거나 버튼으로 한 단계씩 바꿉니다.',
  PasswordInput: '비밀번호를 입력하고 필요할 때 잠시 표시합니다.',
  PhoneInput: '국내 전화번호의 표시 형식과 제출 값을 나눕니다.',
  Rating: '별을 선택해 만족도나 평가 점수를 입력합니다.',
  SearchField: '검색어를 입력하고 Enter로 검색 행동을 실행합니다.',
};
const filenames: Record<InputName, string> = { AddressField: 'address-field', CheckboxGroup: 'checkbox-group', CurrencyInput: 'currency-input', EmailInput: 'email-input', FileInput: 'file-input', NumberInput: 'number-input', PasswordInput: 'password-input', PhoneInput: 'phone-input', Rating: 'rating', SearchField: 'search-field' };
const labels: Record<InputName, string> = { AddressField: '배송 주소', CheckboxGroup: '알림 받는 방법', CurrencyInput: '예산', EmailInput: '이메일', FileInput: '첨부 파일', NumberInput: '수량', PasswordInput: '비밀번호', PhoneInput: '전화번호', Rating: '만족도', SearchField: '문서 검색' };
const defaults: Partial<Record<InputName, string>> = { SearchField: '', PasswordInput: 'example-only-123', EmailInput: 'user@example.com', PhoneInput: '01012345678', CurrencyInput: '120000', NumberInput: '2' };
const addressDefault: AddressValue = { postalCode: '', address: '', detail: '' };
const addressExample = { postalCode: '01234', address: '예시로 24' };
const options = [{ value: 'email', label: '이메일' }, { value: 'message', label: '문자 메시지' }, { value: 'push', label: '앱 알림', disabled: true }];
const usage: Record<InputName, string[]> = {
  AddressField: ['value는 postalCode, address, detail을 가진 객체입니다. onValueChange로 전체 주소를 받거나 defaultValue로 초기값만 지정하세요.', 'onSearch에는 사용하는 주소 검색 서비스를 연결합니다. 전달받은 select 함수에 우편번호와 기본 주소를 넣으면 상세 주소에 초점이 이동합니다. searchSlot으로 별도 검색 UI를 넣을 수도 있습니다.', 'name="address"이면 address.postalCode, address.address, address.detail로 제출합니다. 이 예제의 주소 검색은 예시 주소를 채우는 동작이며 실제 주소 서비스를 호출하지 않습니다.'],
  CheckboxGroup: ['options에 value, label과 선택지별 disabled를 지정합니다. value는 문자열 배열입니다. 같은 name으로 선택한 값을 여러 개 제출하므로 FormData.getAll(name)을 사용하세요.', 'selectAll은 사용할 수 있는 항목만 선택하거나 해제합니다. 일부 항목을 고르면 전체 선택은 중간 상태로 표시됩니다.', 'showTags는 false만 지원합니다. 선택 태그가 있는 접힌 입력과는 별개입니다. 직접 value를 관리하면 폼 초기화 때 그 값도 초기화하세요.'],
  CurrencyInput: ['value, defaultValue와 onValueChange에는 구분자 없는 문자열을 사용합니다. 화면에는 쉼표를 붙이고 name으로 제출하는 값에는 쉼표를 넣지 않습니다.', 'fractionDigits는 허용하는 소수 자리 수이며 기본값은 2입니다. min과 max로 범위를 제한합니다. 편집 중인 빈 값과 음수도 유지하며, 잘못된 금액은 오류와 native form validity로 알립니다.', 'currency는 안내에 표시하는 자유로운 문자열입니다. 통화 변환이나 환율 계산은 하지 않습니다. 아주 큰 금액의 정확한 연산은 사용하는 화면의 소수 연산 방식으로 처리하세요.'],
  EmailInput: ['TextField의 label, hint, error, clearable과 입력 속성을 사용합니다. type은 email이며 autoComplete, inputMode의 기본값이 이메일 입력에 맞춰져 있습니다.', '주소의 실제 존재 여부나 서비스별 허용 규칙은 확인하지 않습니다. native email validity와 사용하는 화면의 검증을 구분하세요.', 'readOnly는 내용을 유지하고 수정과 지우기를 막습니다. disabled는 폼 제출에서도 제외합니다.'],
  FileInput: ['accept와 multiple은 native 파일 선택기에 전달합니다. maxSize는 파일 하나의 최대 바이트 수입니다. 선택한 파일은 onFilesChange에서 배열로 받고 ref.current.files에는 실제 FileList가 남습니다.', '크기 오류가 있는 파일도 선택 목록에서 확인할 수 있으며 오류가 사라지기 전에는 native form validity가 제출을 막습니다. accept는 선택 안내이지 파일 내용의 보안 검증이 아닙니다.', '같은 입력에서 파일을 교체하거나 선택 지우기로 비울 수 있습니다. 파일을 서버에 올리거나 미리보기 URL을 생성하지 않습니다. 파일 내용 검증과 업로드는 사용하는 화면에서 처리하세요.'],
  NumberInput: ['value와 onValueChange는 문자열을 사용해 빈 값도 표현합니다. 숫자를 직접 입력하면 native number input의 min, max, step 규칙을 사용합니다.', '양쪽 버튼은 같은 native input의 stepUp으로 값을 바꿉니다. 기본 step은 1입니다. step="any"이면 직접 입력만 하고 단계 버튼은 사용할 수 없습니다.', '음수와 소수는 min, max, step에 맞게 지정합니다. readOnly와 disabled는 단계 버튼도 막습니다. name에는 현재 입력 문자열이 제출됩니다.'],
  PasswordInput: ['입력 안의 눈 모양 버튼은 비밀번호 표시 여부만 바꾸며 폼을 제출하지 않습니다. 값, 선택 구간과 입력 초점을 유지합니다.', 'disabled, readOnly와 글자 조합 중에는 표시 전환을 막습니다. autoComplete는 로그인에는 current-password, 새 비밀번호에는 new-password를 사용하세요.', 'native 입력의 value와 onChange 또는 defaultValue를 사용합니다. error로 오류 설명을 연결합니다. 폼 초기화는 표시 상태도 숨김으로 돌립니다.'],
  PhoneInput: ['value와 onValueChange에는 하이픈 없는 문자열을 사용합니다. name으로 제출하는 값도 표시용 하이픈이 없습니다.', '국내 번호의 길이와 0으로 시작하는 구조를 확인합니다. 국제번호, 국가 선택, 실제 가입 여부 확인은 지원하지 않습니다. 입력 중 잘못된 번호는 지우지 않고 오류로 알립니다.', '붙여넣은 공백, 괄호와 하이픈을 정리합니다. 표시가 바뀔 때 숫자 위치를 기준으로 커서를 이어가며 글자 조합 중에는 입력을 다시 포맷하지 않습니다.'],
  Rating: ['value와 defaultValue는 정수입니다. 기본 max는 5이며 1~10개 별을 지원합니다. 반별 입력은 지원하지 않습니다.', '별을 누르거나 방향키로 점수를 고릅니다. name이 있으면 선택한 점수 하나만 제출합니다. required는 점수 선택을 필수로 만듭니다.', 'readOnly는 별과 점수만 보여주며 조작하지 않습니다. disabled는 선택과 폼 제출을 막습니다. 직접 value를 관리할 때 초기화도 화면에서 처리하세요.'],
  SearchField: ['onSearch는 Enter를 눌렀을 때 양끝 공백을 뺀 검색어를 받습니다. 빈 검색어도 전달하므로 전체 결과로 돌아가는 정책은 사용하는 화면에서 정하세요.', '한글 등 글자 조합 중인 Enter는 검색이나 상위 폼 제출을 실행하지 않습니다. 검색 결과나 통신은 이 입력이 직접 처리하지 않습니다.', '기본 clearable은 true입니다. 지우기 후 입력으로 초점이 돌아오며 readOnly와 disabled일 때는 지우거나 검색할 수 없습니다.'],
};
export function InputPage({ name, initialPanel = 'usage' }: { name: InputName; initialPanel?: 'settings' | 'code' | 'usage' }) {
  const form = useRef<HTMLFormElement>(null);
  const [panel, setPanel] = useState(initialPanel), [disabled, setDisabled] = useState(false), [readOnly, setReadOnly] = useState(false), [error, setError] = useState(false);
  const [text, setText] = useState(defaults[name] ?? ''), [selected, setSelected] = useState(['email']), [rating, setRating] = useState(3), [address, setAddress] = useState(addressDefault), [feedback, setFeedback] = useState('');
  const label = labels[name], problem = error ? '입력 내용을 다시 확인해 주세요.' : undefined;
  const supportsReadOnly = name !== 'FileInput' && name !== 'CheckboxGroup', supportsError = name !== 'Rating';
  const inputProps = { label, name: filenames[name], disabled, readOnly, error: problem };
  let demo;
  if (name === 'SearchField') demo = <SearchField {...inputProps} value={text} onValueChange={setText} placeholder="찾을 문서 이름" onSearch={query => setFeedback(query ? `검색어: ${query}` : '검색어를 비웠습니다.')}/>;
  else if (name === 'PasswordInput') demo = <PasswordInput {...inputProps} value={text} onChange={event => setText(event.currentTarget.value)} autoComplete="new-password"/>;
  else if (name === 'EmailInput') demo = <EmailInput {...inputProps} value={text} onValueChange={setText} clearable hint="예: user@example.com"/>;
  else if (name === 'PhoneInput') demo = <PhoneInput {...inputProps} value={text} onValueChange={setText} hint="국내 번호만 지원합니다."/>;
  else if (name === 'CurrencyInput') demo = <CurrencyInput {...inputProps} value={text} onValueChange={setText} currency="원" fractionDigits={0} min={0}/>;
  else if (name === 'NumberInput') demo = <NumberInput {...inputProps} value={text} onValueChange={setText} min={0} max={20} step={1}/>;
  else if (name === 'CheckboxGroup') demo = <CheckboxGroup label={label} name="notifications" options={options} value={selected} onValueChange={setSelected} selectAll disabled={disabled} error={problem} hint="앱 알림은 현재 사용할 수 없습니다."/>;
  else if (name === 'FileInput') demo = <FileInput label={label} name="attachments" disabled={disabled} error={problem} accept="image/*,.pdf" multiple maxSize={1000000} hint="파일당 최대 1,000,000바이트. 이 예제는 업로드하지 않습니다."/>;
  else if (name === 'Rating') demo = <Rating label={label} name="rating" value={rating} onValueChange={setRating} disabled={disabled} readOnly={readOnly}/>;
  else demo = <AddressField label={label} name="address" value={address} onValueChange={setAddress} disabled={disabled} readOnly={readOnly} error={problem} onSearch={select => select(addressExample)}/>;
  const common = `label=${JSON.stringify(label)} name=${JSON.stringify(filenames[name])} disabled={${disabled}} readOnly={${readOnly}}${problem ? ` error=${JSON.stringify(problem)}` : ''}`;
  let state = `const [value, setValue] = useState(${JSON.stringify(text)});`, attrs = `${common} value={value} onValueChange={setValue}`;
  if (name === 'SearchField') attrs += ' placeholder="찾을 문서 이름" onSearch={query => setResult(query ? `검색어: ${query}` : "검색어를 비웠습니다.")}';
  if (name === 'PasswordInput') attrs = `${common} value={value} onChange={event => setValue(event.currentTarget.value)} autoComplete="new-password"`;
  if (name === 'EmailInput') attrs += ' clearable hint="예: user@example.com"';
  if (name === 'PhoneInput') attrs += ' hint="국내 번호만 지원합니다."';
  if (name === 'CurrencyInput') attrs += ' currency="원" fractionDigits={0} min={0}';
  if (name === 'NumberInput') attrs += ' min={0} max={20} step={1}';
  if (name === 'CheckboxGroup') { state = `const [value, setValue] = useState<string[]>(${JSON.stringify(selected)});`; attrs = `label=${JSON.stringify(label)} name="notifications" options={${JSON.stringify(options)}} value={value} onValueChange={setValue} selectAll disabled={${disabled}}${problem ? ` error=${JSON.stringify(problem)}` : ''} hint="앱 알림은 현재 사용할 수 없습니다."`; }
  if (name === 'FileInput') { state = ''; attrs = `label=${JSON.stringify(label)} name="attachments" disabled={${disabled}}${problem ? ` error=${JSON.stringify(problem)}` : ''} accept="image/*,.pdf" multiple maxSize={1000000} hint="파일당 최대 1,000,000바이트. 이 예제는 업로드하지 않습니다."`; }
  if (name === 'Rating') { state = `const [value, setValue] = useState(${rating});`; attrs = `label=${JSON.stringify(label)} name="rating" value={value} onValueChange={setValue} disabled={${disabled}} readOnly={${readOnly}}`; }
  if (name === 'AddressField') { state = `const [value, setValue] = useState(${JSON.stringify(address)});`; attrs = `label=${JSON.stringify(label)} name="address" value={value} onValueChange={setValue} disabled={${disabled}} readOnly={${readOnly}}${problem ? ` error=${JSON.stringify(problem)}` : ''} onSearch={select => select(${JSON.stringify(addressExample)})}`; }
  const resetValue = name === 'AddressField' ? JSON.stringify(addressDefault) : name === 'CheckboxGroup' ? '["email"]' : name === 'Rating' ? '3' : JSON.stringify(defaults[name] ?? '');
  const code = `import { useState } from 'react';\nimport { ${name} } from './hangyeol/components/${filenames[name]}';\nimport { Button } from './hangyeol/primitives/button';\n\nexport function Example() {\n  ${state}\n  const [result, setResult] = useState("");\n  return <form onReset={() => { ${name !== 'FileInput' ? `setValue(${resetValue}); ` : ''}setResult(""); }} onSubmit={event => {\n    event.preventDefault();\n    const data = new FormData(event.currentTarget);\n    setResult(JSON.stringify(Array.from(data.entries()).map(([key, value]) => [key, typeof value === "string" ? value : { name: value.name, size: value.size }])));\n  }}>\n    <${name} ${attrs}/>\n    <Button type="submit">제출 값 보기</Button>\n    <Button type="reset" variant="secondary">입력 초기화</Button>\n    <p role="status">{result}</p>\n  </form>;\n}`;
  const resetExample = () => { setDisabled(false); setReadOnly(false); setError(false); setText(defaults[name] ?? ''); setSelected(['email']); setRating(3); setAddress(addressDefault); setFeedback(''); form.current?.reset(); };
  return <div className="space-y-8">
    <ComponentIntroduction name={name} description={inputDescriptions[name]} leadClassName="docs-intro"/>
    <ExamplePurpose name={name}/>
    <PreviewSurface asChild><section  aria-label={`${name} 사용 예제`}>
      <form ref={form} className="grid gap-4" onReset={() => { setText(defaults[name] ?? ''); setSelected(['email']); setRating(3); setAddress(addressDefault); setFeedback(''); }} onSubmit={event => {
        event.preventDefault(); const data = new FormData(event.currentTarget);
        setFeedback(JSON.stringify(Array.from(data.entries()).map(([key, value]) => [key, typeof value === 'string' ? value : { name: value.name, size: value.size }])));
      }}>{demo}<div className="flex flex-wrap gap-2"><Button type="submit">제출 값 보기</Button><Button type="reset" variant="secondary">입력 초기화</Button></div><p role="status" className="break-all text-g-small text-g-soft">{feedback || '입력해 보고 제출 값을 확인하세요. 서버에 저장하지 않습니다.'}</p></form>
      {name === 'AddressField' && <p className="mt-4 text-g-small text-g-soft">주소 검색은 예시 주소를 채웁니다. 실제 주소 서비스는 연결하지 않았습니다.</p>}
    </section></PreviewSurface>
    <Tabs value={panel} onValueChange={next => setPanel(next as typeof panel)}>
      <TabsList aria-label="예제 안내"><TabsTrigger value="usage">사용법</TabsTrigger><TabsTrigger value="settings">예제 설정</TabsTrigger><TabsTrigger value="code">코드</TabsTrigger></TabsList>
      <TabsContent value="settings"><div className="grid gap-3 py-4">
        <label className="flex min-h-11 items-center gap-3"><Checkbox checked={disabled} onCheckedChange={next => setDisabled(next === true)}/>사용할 수 없는 상태</label>
        {supportsReadOnly && <label className="flex min-h-11 items-center gap-3"><Checkbox checked={readOnly} onCheckedChange={next => setReadOnly(next === true)}/>읽기 전용</label>}
        {supportsError && <label className="flex min-h-11 items-center gap-3"><Checkbox checked={error} onCheckedChange={next => setError(next === true)}/>오류 안내 표시</label>}
        <div><Button variant="secondary" onClick={resetExample}>예제 초기화</Button></div>
      </div></TabsContent>
      <TabsContent value="code"><div className="space-y-3 py-4"><p className="text-g-small text-g-soft">현재 예제의 입력값과 설정을 반영합니다. 가져오는 경로는 내 프로젝트의 소스 위치에 맞추세요.</p><CodeBlock>{code}</CodeBlock></div></TabsContent>
      <TabsContent value="usage"><div className="space-y-4 py-4">{usage[name].map(text => <p key={text} className="text-g-body text-g-soft">{text}</p>)}<p className="text-g-small text-g-soft">label은 입력 이름, hint는 보조 설명, error는 오류 안내입니다. value를 직접 관리할 때 폼 초기화의 값도 같은 화면에서 관리하세요.</p></div></TabsContent>
    </Tabs>
  </div>;
}

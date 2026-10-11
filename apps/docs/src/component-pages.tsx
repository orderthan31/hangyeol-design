import { Disclosure, DisclosureSummary } from './hangyeol/primitives/disclosure';
import { PreviewSurface } from './hangyeol/primitives/preview-surface';
import { ControlLabel, ControlGroup } from './hangyeol/primitives/control-label';
import { ComponentIntroduction, ExamplePurpose } from './component-content';
import { CodeBlock } from './hangyeol/components/code-block';
export { CodeBlock } from './hangyeol/components/code-block';
import { Checkbox } from './hangyeol/primitives/checkbox';
import { useId, useState, type ReactNode } from 'react';
import { Button, type ButtonProps } from './hangyeol/primitives/button';
import { Input } from './hangyeol/primitives/input';
import { TextField } from './hangyeol/components/text-field';
import { Select } from './hangyeol/primitives/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './hangyeol/primitives/tabs';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from './hangyeol/primitives/dialog';
import { Badge, type BadgeProps } from './hangyeol/primitives/badge';
import { Row, Stack, List, ListItem } from './hangyeol/primitives/layout';
import { FormSection, ListPanel } from './hangyeol/components/composition';
import { EmptyState } from './hangyeol/components/empty-state';
import { LoadingSpinner } from './hangyeol/primitives/loading-spinner';

export const componentDescriptions:Record<string,string>={
 Badge:'짧은 상태나 분류를 본문과 함께 표시합니다.', Button:'저장, 취소처럼 사용자가 실행할 행동을 표시합니다.', Dialog:'현재 화면을 유지한 채 확인이나 짧은 작업을 요청합니다.', FormSection:'제목과 설명으로 입력 항목을 묶습니다.', Input:'이메일이나 짧은 문장을 입력합니다.', Layout:'요소의 읽는 순서에 맞춰 가로와 세로 배치를 조합합니다.', List:'관련된 항목을 한 목록으로 보여줍니다.', ListItem:'목록 안에서 제목, 설명, 보조 행동을 조합합니다.', ListPanel:'제목과 목록을 하나의 영역으로 묶습니다.', Row:'관련된 요소를 가로로 배치하고 공간이 부족하면 줄을 바꿉니다.', Select:'여러 선택지 중 하나를 고릅니다.', Stack:'제목, 입력, 안내처럼 순서가 있는 요소를 세로로 배치합니다.', Tabs:'관련된 내용을 한 화면에서 나누어 보여줄 때 사용합니다.', TextField:'라벨, 입력, 안내와 오류를 함께 표시합니다.'
};
const usage:Record<string,string[]>={
 Badge:['tone은 neutral, info, danger를 지원합니다. 의미는 색뿐 아니라 보이는 문구로 전달하세요.','Badge는 클릭하는 버튼이나 값을 제출하는 입력이 아닙니다.'],
 Button:['variant는 primary, secondary, quiet, size는 small, medium을 지원합니다.','loading이나 disabled를 지정하면 클릭할 수 없습니다. 폼을 제출하려면 type="submit"을 지정하세요.'],
 Input:['label과 id를 연결하고, 제출할 입력에는 name을 지정하세요.','value와 onChange로 값을 관리하거나 defaultValue로 초기값만 지정합니다. invalid는 오류 표시, readOnly는 읽기 전용, disabled는 입력과 제출 제외에 사용합니다.'],
 TextField:['label을 지정하면 입력과 연결됩니다. hint는 안내, error는 오류 문구입니다.','value와 onValueChange로 값을 관리합니다. clearable은 지우기 버튼을 표시하며 읽기 전용이나 비활성화 상태에서는 지울 수 없습니다.','prefix와 suffix는 입력 앞뒤의 안내, trailing은 단위 안내 같은 보조 행동입니다. defaultValue로 초기값만 지정하면 컴포넌트가 입력값을 관리합니다.'],
 Select:['options의 value는 중복되지 않는 빈 문자열이 아닌 값으로 지정합니다. label은 선택창의 접근 이름입니다.','value와 onValueChange로 선택을 관리하거나 defaultValue로 초기값만 지정합니다. 항목의 disabled는 해당 선택지만, Select의 disabled는 전체 선택창을 사용할 수 없게 합니다.'],
 Tabs:['TabsList 안에 TabsTrigger를, 그 아래에 같은 value의 TabsContent를 연결합니다.','defaultValue는 처음 열릴 탭입니다. 선택을 직접 관리해야 할 때만 value와 onValueChange를 사용하세요.','가로 탭은 좌우 방향키, 세로 탭은 위아래 방향키로 이동합니다. activationMode="manual"은 Enter나 Space를 눌렀을 때 내용을 전환합니다.'],
 Dialog:['DialogTitle과 DialogDescription으로 목적과 결과를 알려 주세요. DialogTrigger와 DialogClose는 asChild로 Button과 연결할 수 있습니다.','기본적으로 닫으면 열었던 버튼으로 초점이 돌아갑니다. 이 예제처럼 열었던 버튼이 비활성화되면 returnFocusRef로 다른 복귀 위치를 지정합니다.'],
 Row:['className으로 간격과 정렬을 조정합니다. 기본적으로 가로 배치와 줄바꿈을 지원합니다.','행 전체를 자동으로 클릭 가능한 항목으로 만들지 않습니다. 행동은 안에 놓은 Button이 담당합니다.'],
 Stack:['className의 gap과 정렬 속성으로 요소 사이의 간격을 조절합니다.','입력의 내부 여백과 요소 사이의 간격은 별개입니다. Stack은 자식 요소의 값이나 상태를 관리하지 않습니다.'],
 Layout:['Row로 가로 배치를, Stack으로 세로 흐름을 만듭니다.','배치만 필요한 곳에 별도 카드나 테두리를 추가할 필요는 없습니다.'],
 List:['List는 ul, ListItem은 li로 렌더됩니다. List의 직접 자식에 ListItem을 사용하세요.','divider는 항목 사이 구분선을 표시하며 기본값은 true입니다. 항목의 데이터와 빈 목록 안내는 사용하는 화면에서 관리합니다.'],
 ListItem:['제목과 설명, 필요한 보조 버튼을 children으로 조합합니다.','목록 행 전체의 선택이나 삭제 기능을 자동으로 만들지 않습니다.'],
 FormSection:['heading, description, actions로 제목, 설명과 보조 행동을 지정합니다.','폼 제출과 입력값 저장은 바깥 form에서 처리합니다. FormSection 자체는 section입니다.'],
 ListPanel:['heading, description, actions로 목록 제목과 보조 행동을 지정합니다.','children에 ListItem을, footer에 목록 아래 안내를 넣습니다. 항목이 없으면 emptyState가 표시됩니다. 불러오는 중 안내와 데이터 요청은 화면에서 관리합니다.']
};

function Toggle({label,checked,onChange}:{label:string;checked:boolean;onChange:(value:boolean)=>void}){return <ControlLabel ><Checkbox checked={checked} aria-label={label} onCheckedChange={value=>onChange(value===true)}/>{label}</ControlLabel>;}
const notifications=[{id:'delivery',title:'배송이 시작됐어요',description:'주문한 무선 키보드가 오늘 출발했습니다.',date:'10월 10일'},{id:'notice',title:'새로운 소식을 확인해 보세요',description:'이번 달에 추가된 상품과 혜택을 모았습니다.',date:'10월 9일'}];
export function NotificationList({empty=false,divider=true}:{empty?:boolean;divider?:boolean}){
 return <div><List aria-label="알림 목록" divider={divider}>{!empty&&notifications.map(item=><ListItem key={item.id}><div className="grid gap-1 min-w-0 flex-1"><h3 className="font-medium">{item.title}</h3><p className="text-g-small text-g-soft">{item.description}</p></div><span className="text-g-caption text-g-soft">{item.date}</span></ListItem>)}</List>{empty&&<p className="text-g-soft py-4">새 알림이 없습니다.</p>}</div>;
}
export function ProfileForm(){
 const [name,setName]=useState('김한결'),[email,setEmail]=useState('hangyeol@example.com'),[message,setMessage]=useState('');
 return <form className="grid gap-6" onSubmit={event=>{event.preventDefault();setMessage(`${name}님의 샘플 프로필을 저장했습니다.`);}}><FormSection heading="프로필 정보" description="다른 사람에게 보여 줄 이름을 입력하세요."><TextField label="이름" name="displayName" value={name} onValueChange={setName} required clearable autoComplete="name"/></FormSection><FormSection heading="연락처 정보"><TextField label="이메일" name="email" type="email" value={email} onValueChange={setEmail} required hint="소식을 받을 이메일 주소입니다." autoComplete="email"/></FormSection><Row><Button type="submit">저장</Button><Button variant="secondary" onClick={()=>{setName('김한결');setEmail('hangyeol@example.com');setMessage('변경한 내용을 되돌렸습니다.');}}>취소</Button></Row><p role="status" className="text-g-small text-g-soft">{message||'이 화면은 샘플입니다. 변경한 내용은 실제 계정에 저장되지 않습니다.'}</p></form>;
}
export function ProductTabs({disabled=false,orientation='horizontal'}:{disabled?:boolean;orientation?:'horizontal'|'vertical'}){
 return <Tabs defaultValue="product" orientation={orientation} className={orientation==='vertical'?'docs-vertical-tabs':'min-w-0'}><TabsList aria-label="무선 키보드 안내"><TabsTrigger value="product">제품 정보</TabsTrigger><TabsTrigger value="delivery">배송 안내</TabsTrigger><TabsTrigger value="reviews" disabled={disabled}>리뷰</TabsTrigger></TabsList><TabsContent value="product" className="docs-tab-content"><h3 className="text-xl font-semibold">무선 키보드</h3><p className="text-g-soft">책상 위를 간결하게 만드는 가벼운 키보드입니다.</p><dl className="docs-specs"><div><dt>크기</dt><dd>가로 28cm · 세로 12cm</dd></div><div><dt>연결 방식</dt><dd>Bluetooth · USB-C</dd></div><div><dt>구성품</dt><dd>키보드, 충전 케이블, 사용 안내</dd></div></dl></TabsContent><TabsContent value="delivery" className="docs-tab-content"><h3 className="font-medium">택배로 받아보세요</h3><p>주문 후 영업일 기준 2~3일 안에 출발합니다.</p><p className="text-g-small text-g-soft">수령할 주소와 연락처를 주문 전에 확인해 주세요.</p></TabsContent><TabsContent value="reviews" className="docs-tab-content"><List aria-label="샘플 후기"><ListItem><div><p>키감이 부드럽고 책상에 잘 어울려요.</p><p className="text-g-caption text-g-soft">김한결 · 10월 10일</p></div></ListItem><ListItem><div><p>노트북과 연결하기 편해요.</p><p className="text-g-caption text-g-soft">이봄 · 10월 9일</p></div></ListItem></List></TabsContent></Tabs>;
}
function SettingsTabs(){
 const [notice,setNotice]=useState(true);
 return <Tabs defaultValue="profile" orientation="vertical" className="docs-vertical-tabs"><TabsList aria-label="계정 설정 예제"><TabsTrigger value="profile">프로필</TabsTrigger><TabsTrigger value="notifications">알림</TabsTrigger><TabsTrigger value="security">보안</TabsTrigger></TabsList><TabsContent value="profile" className="docs-tab-content"><TextField label="이름" defaultValue="김한결"/><TextField label="이메일" type="email" defaultValue="hangyeol@example.com"/></TabsContent><TabsContent value="notifications" className="docs-tab-content"><Toggle label="새 소식을 이메일로 받기" checked={notice} onChange={setNotice}/><p className="text-g-small text-g-soft">알림 설정은 이 예제에서만 바뀝니다.</p></TabsContent><TabsContent value="security" className="docs-tab-content"><h3 className="font-medium">계정을 안전하게 사용하세요</h3><p className="text-g-soft">다른 서비스와 같은 비밀번호를 사용하지 않는 것이 좋습니다.</p></TabsContent></Tabs>;
}
function DeleteExample(){
 const [open,setOpen]=useState(false),[deleted,setDeleted]=useState(false);
 const [fallback,setFallback]=useState<HTMLButtonElement|null>(null);
 return <div className="grid gap-4"><p role="status">{deleted?'샘플 항목을 삭제했습니다.':'즐겨찾기: 무선 키보드'}</p><Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="secondary" disabled={deleted}>항목 삭제</Button></DialogTrigger><DialogContent returnFocusRef={{current:fallback}}><DialogTitle>즐겨찾기에서 삭제할까요?</DialogTitle><DialogDescription>무선 키보드를 이 예제의 즐겨찾기에서 삭제합니다. 실제 계정에는 영향을 주지 않습니다.</DialogDescription><Row className="justify-end"><DialogClose asChild><Button variant="secondary">취소</Button></DialogClose><Button onClick={()=>{setDeleted(true);setOpen(false);}}>삭제</Button></Row></DialogContent></Dialog><Button ref={setFallback} variant="quiet" size="small" onClick={()=>setDeleted(false)}>샘플 되돌리기</Button></div>;
}
const profileCode=`import { useState } from 'react';
import { TextField } from './hangyeol/components/text-field';
import { FormSection } from './hangyeol/components/composition';
import { Button } from './hangyeol/primitives/button';
import { Row } from './hangyeol/primitives/layout';

export function ProfileExample() {
  const [name, setName] = useState('김한결');
  const [email, setEmail] = useState('hangyeol@example.com');
  const [message, setMessage] = useState('');
  return <form className="grid gap-6" onSubmit={event => {
    event.preventDefault();
    setMessage(name + '님의 샘플 프로필을 저장했습니다.');
  }}>
    <FormSection heading="프로필 정보" description="다른 사람에게 보여 줄 이름을 입력하세요.">
      <TextField label="이름" name="displayName" value={name} onValueChange={setName} required clearable autoComplete="name" />
    </FormSection>
    <FormSection heading="연락처 정보">
      <TextField label="이메일" name="email" type="email" value={email} onValueChange={setEmail} required hint="소식을 받을 이메일 주소입니다." autoComplete="email" />
    </FormSection>
    <Row>
      <Button type="submit">저장</Button>
      <Button variant="secondary" onClick={() => { setName('김한결'); setEmail('hangyeol@example.com'); setMessage('변경한 내용을 되돌렸습니다.'); }}>취소</Button>
    </Row>
    <p role="status">{message || '이 화면은 샘플입니다. 변경한 내용은 실제 계정에 저장되지 않습니다.'}</p>
  </form>;
}`;
const productCode=`import { Tabs, TabsList, TabsTrigger, TabsContent } from './hangyeol/primitives/tabs';
import { List, ListItem } from './hangyeol/primitives/layout';

export function ProductExample() {
  return <Tabs defaultValue="product">
    <TabsList aria-label="무선 키보드 안내">
      <TabsTrigger value="product">제품 정보</TabsTrigger>
      <TabsTrigger value="delivery">배송 안내</TabsTrigger>
      <TabsTrigger value="reviews">리뷰</TabsTrigger>
    </TabsList>
    <TabsContent value="product" className="grid gap-4 pt-6">
      <h3>무선 키보드</h3>
      <p>책상 위를 간결하게 만드는 가벼운 키보드입니다.</p>
      <dl><dt>크기</dt><dd>가로 28cm · 세로 12cm</dd><dt>연결 방식</dt><dd>Bluetooth · USB-C</dd><dt>구성품</dt><dd>키보드, 충전 케이블, 사용 안내</dd></dl>
    </TabsContent>
    <TabsContent value="delivery" className="grid gap-4 pt-6">
      <h3>택배로 받아보세요</h3>
      <p>주문 후 영업일 기준 2~3일 안에 출발합니다.</p>
      <p>수령할 주소와 연락처를 주문 전에 확인해 주세요.</p>
    </TabsContent>
    <TabsContent value="reviews" className="pt-6">
      <List aria-label="샘플 후기"><ListItem><div><p>키감이 부드럽고 책상에 잘 어울려요.</p><p>김한결 · 10월 10일</p></div></ListItem><ListItem><div><p>노트북과 연결하기 편해요.</p><p>이봄 · 10월 9일</p></div></ListItem></List>
    </TabsContent>
  </Tabs>;
}`;
export function ComponentPage({name}:{name:string}){
 const id=useId();
 const [panel,setPanel]=useState('usage'),[disabled,setDisabled]=useState(false),[loading,setLoading]=useState(false),[readOnly,setReadOnly]=useState(false),[error,setError]=useState(false),[empty,setEmpty]=useState(false),[divider,setDivider]=useState(true);
 const [variant,setVariant]=useState<NonNullable<ButtonProps['variant']>>('primary'),[size,setSize]=useState<NonNullable<ButtonProps['size']>>('medium'),[tone,setTone]=useState<NonNullable<BadgeProps['tone']>>('info');
 const [value,setValue]=useState('hangyeol@example.com'),[selected,setSelected]=useState('latest'),[feedback,setFeedback]=useState(''),[gap,setGap]=useState('gap-4'),[orientation,setOrientation]=useState<'horizontal'|'vertical'>('horizontal');
 const save=()=>setFeedback('샘플 내용을 저장했습니다.');
 let live:ReactNode,settings:ReactNode=null,code='';
 if(name==='Button'){
  live=<div className="grid gap-4"><Row><Button variant={variant} size={size} disabled={disabled} loading={loading} onClick={save}>{loading?'저장 중':'저장'}</Button><Button variant="secondary" size={size} onClick={()=>setFeedback('저장을 취소했습니다.')}>취소</Button><Button variant="quiet" size={size} onClick={()=>setFeedback('추가 내용: 변경한 내용은 이 예제 안에서만 유지됩니다.')}>더 보기</Button></Row><p role="status" className="text-g-small text-g-soft">{feedback||'버튼을 눌러 동작을 살펴보세요. 저장은 이 예제 안에서만 동작합니다.'}</p></div>;
  settings=<><Select label="중요도" value={variant} onValueChange={v=>setVariant(v as typeof variant)} options={[{value:'primary',label:'주요 행동'},{value:'secondary',label:'보조 행동'},{value:'quiet',label:'간단한 행동'}]}/><Select label="크기" value={size} onValueChange={v=>setSize(v as typeof size)} options={[{value:'small',label:'작게'},{value:'medium',label:'기본'}]}/><Toggle label="사용할 수 없음" checked={disabled} onChange={setDisabled}/><Toggle label="저장 중" checked={loading} onChange={setLoading}/></>;
  code=`import { useState } from 'react';\nimport { Button } from './hangyeol/primitives/button';\nimport { Row } from './hangyeol/primitives/layout';\n\nexport function ButtonExample() {\n  const [message, setMessage] = useState('');\n  return <div className="grid gap-4"><Row>\n    <Button variant="${variant}" size="${size}" disabled={${disabled}} loading={${loading}} onClick={() => setMessage('샘플 내용을 저장했습니다.')}>${loading?'저장 중':'저장'}</Button>\n    <Button variant="secondary" size="${size}" onClick={() => setMessage('저장을 취소했습니다.')}>취소</Button>\n    <Button variant="quiet" size="${size}" onClick={() => setMessage('추가 내용: 변경한 내용은 이 예제 안에서만 유지됩니다.')}>더 보기</Button>\n  </Row><p role="status">{message || '버튼을 눌러 동작을 살펴보세요. 저장은 이 예제 안에서만 동작합니다.'}</p></div>;\n}`;
 }else if(name==='Input'){
  live=<div className="grid gap-2"><label htmlFor={id} className="text-g-small font-medium">이메일</label><Input id={id} name="email" type="email" placeholder="name@example.com" value={value} onChange={event=>setValue(event.target.value)} disabled={disabled} readOnly={readOnly}/><p className="text-g-small text-g-soft">소식을 받을 이메일 주소를 입력하세요.</p></div>;
  settings=<><Toggle label="사용할 수 없음" checked={disabled} onChange={setDisabled}/><Toggle label="읽기 전용" checked={readOnly} onChange={setReadOnly}/></>;
  code=`import { useId, useState } from 'react';\nimport { Input } from './hangyeol/primitives/input';\n\nexport function EmailExample() {\n  const id = useId();\n  const [email, setEmail] = useState(${JSON.stringify(value)});\n  return <div className="grid gap-2">\n    <label htmlFor={id}>이메일</label>\n    <Input id={id} name="email" type="email" placeholder="name@example.com" value={email} onChange={event => setEmail(event.target.value)} disabled={${disabled}} readOnly={${readOnly}} />\n    <p>소식을 받을 이메일 주소를 입력하세요.</p>\n  </div>;\n}`;
 }else if(name==='TextField'){
  live=<div className="grid gap-4"><TextField label="이름" defaultValue="김한결" disabled={disabled} readOnly={readOnly} clearable hint="다른 사람에게 보여 줄 이름입니다."/><TextField label="이메일" type="email" value={value} onValueChange={setValue} disabled={disabled} readOnly={readOnly} clearable hint="소식을 받을 이메일 주소입니다." error={error?'이메일 주소에 @와 도메인을 포함해 주세요.':undefined}/></div>;
  settings=<><Toggle label="사용할 수 없음" checked={disabled} onChange={setDisabled}/><Toggle label="읽기 전용" checked={readOnly} onChange={setReadOnly}/><Toggle label="오류 안내 보기" checked={error} onChange={setError}/></>;
  code=`import { useState } from 'react';\nimport { TextField } from './hangyeol/components/text-field';\n\nexport function FieldsExample() {\n  const [email, setEmail] = useState(${JSON.stringify(value)});\n  return <div className="grid gap-4">\n    <TextField label="이름" defaultValue="김한결" clearable hint="다른 사람에게 보여 줄 이름입니다." disabled={${disabled}} readOnly={${readOnly}} />\n    <TextField label="이메일" type="email" value={email} onValueChange={setEmail} clearable hint="소식을 받을 이메일 주소입니다." error={${error?JSON.stringify('이메일 주소에 @와 도메인을 포함해 주세요.'):'undefined'}} disabled={${disabled}} readOnly={${readOnly}} />\n  </div>;\n}`;
 }else if(name==='Select'){
  const items=selected==='name'?[...notifications].sort((a,b)=>a.title.localeCompare(b.title,'ko')):notifications;
  live=<div className="grid gap-4"><div className="grid gap-2"><label htmlFor={id} className="text-g-small font-medium">정렬 기준</label><Select id={id} label="정렬 기준" value={selected} onValueChange={setSelected} disabled={disabled} options={[{value:'latest',label:'최신순'},{value:'name',label:'이름순'},{value:'popular',label:'인기순 · 준비 중',disabled:true}]}/></div><List aria-label="정렬된 알림">{items.map(item=><ListItem key={item.id}>{item.title}</ListItem>)}</List></div>;
  settings=<Toggle label="사용할 수 없음" checked={disabled} onChange={setDisabled}/>;
  code=`import { useId, useState } from 'react';\nimport { Select } from './hangyeol/primitives/select';\nimport { List, ListItem } from './hangyeol/primitives/layout';\nconst items = ${JSON.stringify(notifications)};\n\nexport function SortExample() {\n  const id = useId();\n  const [sort, setSort] = useState(${JSON.stringify(selected)});\n  const sorted = sort === 'name' ? [...items].sort((a,b) => a.title.localeCompare(b.title, 'ko')) : items;\n  return <div className="grid gap-4"><div className="grid gap-2">\n    <label htmlFor={id}>정렬 기준</label>\n    <Select id={id} label="정렬 기준" value={sort} onValueChange={setSort} disabled={${disabled}} options={[{value:'latest',label:'최신순'},{value:'name',label:'이름순'},{value:'popular',label:'인기순 · 준비 중',disabled:true}]} />\n  </div><List aria-label="정렬된 알림">{sorted.map(item => <ListItem key={item.id}>{item.title}</ListItem>)}</List></div>;\n}`;
 }else if(name==='Tabs'){
  live=<ProductTabs disabled={disabled} orientation={orientation}/>;
  settings=<><Select label="배치 방향" value={orientation} onValueChange={v=>setOrientation(v as typeof orientation)} options={[{value:'horizontal',label:'가로'},{value:'vertical',label:'세로'}]}/><Toggle label="리뷰를 사용할 수 없음" checked={disabled} onChange={setDisabled}/></>;
  code=productCode.replace('<Tabs defaultValue="product">',`<Tabs defaultValue="product" orientation="${orientation}"${orientation==='vertical'?' className="grid gap-6 sm:grid-cols-[auto_1fr]"':''}>`).replace('<TabsTrigger value="reviews">',`<TabsTrigger value="reviews" disabled={${disabled}}>`);
 }else if(name==='Dialog'){
  live=<DeleteExample/>;
  code=`import { useRef, useState } from 'react';\nimport { Button } from './hangyeol/primitives/button';\nimport { Row } from './hangyeol/primitives/layout';\nimport { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from './hangyeol/primitives/dialog';\n\nexport function DeleteExample() {\n  const [open, setOpen] = useState(false);\n  const [deleted, setDeleted] = useState(false);\n  const fallback = useRef<HTMLButtonElement>(null);\n  return <div className="grid gap-4">\n    <p role="status">{deleted ? '샘플 항목을 삭제했습니다.' : '즐겨찾기: 무선 키보드'}</p>\n    <Dialog open={open} onOpenChange={setOpen}>\n      <DialogTrigger asChild><Button variant="secondary" disabled={deleted}>항목 삭제</Button></DialogTrigger>\n      <DialogContent returnFocusRef={fallback}>\n        <DialogTitle>즐겨찾기에서 삭제할까요?</DialogTitle>\n        <DialogDescription>무선 키보드를 이 예제의 즐겨찾기에서 삭제합니다. 실제 계정에는 영향을 주지 않습니다.</DialogDescription>\n        <Row className="justify-end"><DialogClose asChild><Button variant="secondary">취소</Button></DialogClose>\n          <Button onClick={() => { setDeleted(true); setOpen(false); }}>삭제</Button>\n        </Row>\n      </DialogContent>\n    </Dialog>\n    <Button ref={fallback} variant="quiet" size="small" onClick={() => setDeleted(false)}>샘플 되돌리기</Button>\n  </div>;\n}`;
 }else if(name==='Badge'){
  live=<div className="grid gap-5"><Row><Badge tone="info">새 소식</Badge><Badge>처리 중</Badge><Badge tone="danger">확인 필요</Badge></Row><p className="leading-7">배송 상태는 <Badge tone={tone}>배송 준비</Badge>입니다. 출발하면 알림을 보내드려요.</p></div>;
  settings=<Select label="표현" value={tone} onValueChange={v=>setTone(v as typeof tone)} options={[{value:'neutral',label:'기본'},{value:'info',label:'안내'},{value:'danger',label:'주의'}]}/>;
  code=`import { Badge } from './hangyeol/primitives/badge';\nimport { Row } from './hangyeol/primitives/layout';\n\nexport function BadgeExample() {\n  return <div className="grid gap-5">\n    <Row><Badge tone="info">새 소식</Badge><Badge>처리 중</Badge><Badge tone="danger">확인 필요</Badge></Row>\n    <p>배송 상태는 <Badge tone="${tone}">배송 준비</Badge>입니다. 출발하면 알림을 보내드려요.</p>\n  </div>;\n}`;
 }else if(name==='List'||name==='ListPanel'){
  live=name==='List'?<NotificationList empty={empty} divider={divider}/>:<div className="grid gap-4"><ListPanel heading="알림" description="최근 소식을 확인하세요." aria-busy={loading} actions={<Button disabled={loading} onClick={()=>setFeedback('이 예제에서 새 소식을 확인했습니다.')}>새 소식 확인</Button>} emptyState={<EmptyState heading="아직 새 알림이 없어요" description="새 소식이 도착하면 이곳에서 확인할 수 있어요."/>} footer={!loading&&!empty?'알림 2개를 모두 확인했습니다.':undefined}>{loading?<ListItem><LoadingSpinner label="알림을 불러오는 중입니다."/><span>알림을 불러오는 중입니다.</span></ListItem>:!empty&&notifications.map(item=><ListItem key={item.id}><div><h3 className="font-medium">{item.title}</h3><p className="text-g-small text-g-soft">{item.description}</p></div></ListItem>)}</ListPanel><p role="status" className="text-g-small text-g-soft">{feedback||'이 예제는 실제 알림을 조회하지 않습니다.'}</p></div>;
  settings=<><Toggle label="빈 목록 보기" checked={empty} onChange={setEmpty}/>{name==='List'?<Toggle label="구분선 표시" checked={divider} onChange={setDivider}/>:<Toggle label="불러오는 중" checked={loading} onChange={setLoading}/>}</>;
  const tag=name==='List'?'List':'ListPanel';
  code=`import { List, ListItem } from './hangyeol/primitives/layout';\n${name==='ListPanel'?"import { ListPanel } from './hangyeol/components/composition';\n":''}const items = ${empty?'[]':JSON.stringify(notifications)};\n\nexport function NotificationExample() {\n  return <div>\n    <${tag} ${name==='List'?`aria-label="알림 목록" divider={${divider}}`:`heading="알림" description="${empty?'새 알림이 없습니다.':'최근 소식을 확인하세요.'}"`}>\n      {items.map((item: { id: string; title: string; description: string; date: string }) => <ListItem key={item.id}><div><h3>{item.title}</h3><p>{item.description}</p></div>${name==='List'?'<span>{item.date}</span>':''}</ListItem>)}\n    </${tag}>${empty&&name==='List'?'\n    <p>새 알림이 없습니다.</p>':''}\n  </div>;\n}`;
  if(name==='ListPanel') code=`import { useState } from 'react';\nimport { ListItem } from './hangyeol/primitives/layout';\nimport { ListPanel } from './hangyeol/components/composition';\nimport { EmptyState } from './hangyeol/components/empty-state';\nimport { LoadingSpinner } from './hangyeol/primitives/loading-spinner';\nimport { Button } from './hangyeol/primitives/button';\nconst items: { id: string; title: string; description: string; date: string }[] = ${empty?'[]':JSON.stringify(notifications)};\n\nexport function NotificationExample() {\n  const [message, setMessage] = useState('');\n  return <div className="grid gap-4"><ListPanel heading="알림" description="최근 소식을 확인하세요." aria-busy={${loading}} actions={<Button disabled={${loading}} onClick={() => setMessage('이 예제에서 새 소식을 확인했습니다.')}>새 소식 확인</Button>} emptyState={<EmptyState heading="아직 새 알림이 없어요" description="새 소식이 도착하면 이곳에서 확인할 수 있어요."/>} footer={${!loading&&!empty?"'알림 2개를 모두 확인했습니다.'":'undefined'}}>\n      ${loading?'<ListItem><LoadingSpinner label="알림을 불러오는 중입니다."/><span>알림을 불러오는 중입니다.</span></ListItem>':'{items.map(item => <ListItem key={item.id}><div><h3 className="font-medium">{item.title}</h3><p className="text-g-small text-g-soft">{item.description}</p></div></ListItem>)}'}\n    </ListPanel><p role="status">{message || '이 예제는 실제 알림을 조회하지 않습니다.'}</p></div>;\n}`;
 }else if(name==='ListItem'){
  live=<div className="grid gap-4"><List><ListItem><div className="min-w-0 flex-1"><h3 className="font-medium">배송이 시작됐어요</h3><p className="text-g-small text-g-soft">주문한 무선 키보드가 오늘 출발했습니다.</p></div><Button size="small" variant="secondary" onClick={()=>setFeedback('샘플 배송 안내: 주문한 상품은 영업일 기준 2~3일 안에 도착합니다.')}>배송 안내</Button></ListItem></List>{feedback&&<p role="status" className="text-g-small text-g-soft">{feedback}</p>}</div>;
  code=`import { useState } from 'react';\nimport { List, ListItem } from './hangyeol/primitives/layout';\nimport { Button } from './hangyeol/primitives/button';\n\nexport function ItemExample() {\n  const [message, setMessage] = useState('');\n  return <div className="grid gap-4"><List><ListItem>\n    <div className="min-w-0 flex-1"><h3>배송이 시작됐어요</h3><p>주문한 무선 키보드가 오늘 출발했습니다.</p></div>\n    <Button size="small" variant="secondary" onClick={() => setMessage('샘플 배송 안내: 주문한 상품은 영업일 기준 2~3일 안에 도착합니다.')}>배송 안내</Button>\n  </ListItem></List>{message && <p role="status">{message}</p>}</div>;\n}`;
 }else if(name==='FormSection'){
  live=<ProfileForm/>;code=profileCode;
 }else{
  live=<div className="grid gap-4">{name==='Row'?<Row className={gap}><Button onClick={save}>저장</Button><Button variant="secondary" onClick={()=>setFeedback('변경한 내용을 취소했습니다.')}>취소</Button></Row>:<Stack className={gap}><div className="grid gap-2"><label htmlFor={id} className="text-g-small font-medium">이메일</label><Input id={id} type="email" placeholder="name@example.com"/></div><p className="text-g-small text-g-soft">소식을 받을 이메일 주소를 입력하세요.</p>{name==='Layout'?<Row><Button onClick={save}>저장</Button><Button variant="secondary" onClick={()=>setFeedback('변경한 내용을 취소했습니다.')}>취소</Button></Row>:<Button onClick={save}>저장</Button>}</Stack>}<p role="status" className="text-g-small text-g-soft">{feedback||'이 예제의 저장은 실제 서비스에 연결되지 않습니다.'}</p></div>;
  settings=<Select label="요소 사이 간격" value={gap} onValueChange={setGap} options={[{value:'gap-2',label:'좁게'},{value:'gap-4',label:'기본'},{value:'gap-8',label:'넓게'}]}/>;
  const body=name==='Row'?`<Row className="${gap}"><Button onClick={save}>저장</Button><Button variant="secondary" onClick={cancel}>취소</Button></Row>`:`<Stack className="${gap}"><div className="grid gap-2"><label htmlFor={id}>이메일</label><Input id={id} type="email" placeholder="name@example.com" /></div><p>소식을 받을 이메일 주소를 입력하세요.</p>${name==='Layout'?'<Row><Button onClick={save}>저장</Button><Button variant="secondary" onClick={cancel}>취소</Button></Row>':'<Button onClick={save}>저장</Button>'}</Stack>`;
  code=`import { useId, useState } from 'react';\nimport { Row, Stack } from './hangyeol/primitives/layout';\nimport { Button } from './hangyeol/primitives/button';\nimport { Input } from './hangyeol/primitives/input';\n\nexport function LayoutExample() {\n  const id = useId();\n  const [message, setMessage] = useState('');\n  const save = () => setMessage('샘플 내용을 저장했습니다.');\n  const cancel = () => setMessage('변경한 내용을 취소했습니다.');\n  return <div className="grid gap-4">${body}<p role="status">{message || '이 예제의 저장은 실제 서비스에 연결되지 않습니다.'}</p></div>;\n}`;
 }
 return <div className="docs-page"><ComponentIntroduction name={name} description={componentDescriptions[name]} leadClassName="docs-lead"/><ExamplePurpose name={name}/><PreviewSurface asChild><section  aria-label={`${name} 예제`}>{live}</section></PreviewSurface><Tabs value={panel} onValueChange={setPanel}><TabsList aria-label="예제 설명"><TabsTrigger value="usage">사용법</TabsTrigger><TabsTrigger value="settings">예제 설정</TabsTrigger><TabsTrigger value="code">코드</TabsTrigger></TabsList><TabsContent value="settings" className="pt-6"><ControlGroup asChild><div className="docs-controls">{settings||<p className="text-g-small text-g-soft">위 예제를 직접 조작해 보세요.</p>}</div></ControlGroup></TabsContent><TabsContent value="code" className="pt-6"><CodeBlock>{code}</CodeBlock></TabsContent><TabsContent value="usage" className="pt-6"><ul className="docs-usage">{usage[name]?.map(text=><li key={text}>{text}</li>)}</ul><p className="mt-6 text-g-small text-g-soft">코드는 설치된 로컬 소스 경로를 사용합니다. 프로젝트에서 경로를 바꿨다면 import도 맞춰 주세요. 예제의 데이터와 저장·삭제 동작은 컴포넌트 자체 기능이 아닙니다.</p></TabsContent></Tabs>{name==='Tabs'&&<section className="docs-section"><h2>세로로 나누는 설정 화면</h2><SettingsTabs/></section>}</div>;
}
export function CompositionExamples(){
 const [tab,setTab]=useState('all'),[empty,setEmpty]=useState(false);
 return <div className="docs-page"><p className="docs-lead">입력과 버튼으로 프로필을 편집하고, 탭과 목록으로 알림을 나눠 보세요.</p><section className="docs-section"><h2>프로필 편집</h2><PreviewSurface asChild><div ><ProfileForm/></div></PreviewSurface><Disclosure ><DisclosureSummary>프로필 예제 코드</DisclosureSummary><CodeBlock>{profileCode}</CodeBlock></Disclosure></section><section className="docs-section"><h2>알림 목록</h2><PreviewSurface asChild><div ><Tabs value={tab} onValueChange={setTab}><TabsList aria-label="알림 종류"><TabsTrigger value="all">전체</TabsTrigger><TabsTrigger value="delivery">배송</TabsTrigger></TabsList><TabsContent value="all" className="pt-4"><NotificationList empty={empty}/></TabsContent><TabsContent value="delivery" className="pt-4"><List><ListItem><div><h3 className="font-medium">배송이 시작됐어요</h3><p className="text-g-small text-g-soft">주문한 무선 키보드가 오늘 출발했습니다.</p></div></ListItem></List></TabsContent></Tabs><Toggle label="전체 목록을 빈 상태로 보기" checked={empty} onChange={setEmpty}/><DeleteExample/></div></PreviewSurface><p className="text-g-small text-g-soft">이 화면의 알림과 즐겨찾기는 샘플입니다. 실제 계정의 데이터는 바뀌지 않습니다.</p></section></div>;
}

import { PreviewSurface } from './hangyeol/primitives/preview-surface';
import { useState, type ReactNode } from 'react';
import { Table, TableCaption, TableHeader, TableBody, TableRow, TableHead, TableCell } from './hangyeol/components/table';
import { Pagination } from './hangyeol/components/pagination';
import { Alert, type AlertTone } from './hangyeol/components/alert';
import { ErrorState } from './hangyeol/components/error-state';
import { Result } from './hangyeol/components/result';
import { ProgressStepper } from './hangyeol/components/progress-stepper';
import { Breadcrumb } from './hangyeol/components/breadcrumb';
import { Bubble } from './hangyeol/components/bubble';
import { Button } from './hangyeol/primitives/button';
import { Checkbox } from './hangyeol/primitives/checkbox';
import { SegmentedControl } from './hangyeol/components/segmented-control';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './hangyeol/primitives/tabs';
import { CodeBlock } from './hangyeol/components/code-block';
import { ComponentIntroduction, ExamplePurpose } from './component-content';
export const nativeNames=['Alert','Breadcrumb','Bubble','ErrorState','Pagination','ProgressStepper','Result','Table'] as const;
export type NativeName=typeof nativeNames[number];
export const nativeDescriptions:Record<NativeName,string>={Alert:'화면 안의 안내와 결과를 짧고 분명하게 전달합니다.',Breadcrumb:'현재 위치와 상위 화면으로 돌아가는 경로를 보여줍니다.',Bubble:'작성자·내용·시간·행동을 읽기 순서대로 묶습니다.',ErrorState:'오류 안내와 다시 시도할 행동을 함께 제공합니다.',Pagination:'목록의 페이지를 선택하고 이전·다음으로 이동합니다.',ProgressStepper:'여러 단계의 완료·현재·예정 상태를 보여줍니다.',Result:'완료나 오류 결과와 이어갈 행동을 보여줍니다.',Table:'행과 열이 있는 정보를 표의 의미 구조로 표시합니다.'};
const files:Record<NativeName,string>={Alert:'alert',Breadcrumb:'breadcrumb',Bubble:'bubble',ErrorState:'error-state',Pagination:'pagination',ProgressStepper:'progress-stepper',Result:'result',Table:'table'};
const usage:Record<NativeName,string[]>={
 Alert:['title과 children에 안내를 넣고 tone으로 info·success·warning·error 의미를 구분합니다. 아이콘과 내용으로도 상태를 전달합니다.','기본은 읽기 대상인 일반 안내입니다. 새로 발생한 안내를 알려야 할 때 announce를 지정하면 error는 alert, 나머지는 status로 알립니다. 페이지 전체를 반복해서 읽게 하지 마세요.','onDismiss는 닫기 요청을 전달합니다. 표시 여부는 화면에서 관리하고 dismissLabel에는 어떤 안내를 닫는지 알 수 있는 이름을 넣으세요. actions에는 실제 행동을 연결합니다.'],
 Breadcrumb:['items의 label과 href로 상위 경로를 구성합니다. 마지막 항목은 기본적으로 현재 페이지이며 링크로 만들지 않습니다.','current로 현재 항목을 명시할 수 있습니다. 현재 페이지는 aria-current=page로 알리고 구분 아이콘은 읽기에서 제외합니다. 긴 경로는 줄을 바꿉니다.','href는 실제 이동할 경로를 넣으세요. 이 예제의 상위 링크는 이 문서 안의 페이지로 이동합니다.'],
 Bubble:['author·time·dateTime과 children으로 내용을 전달합니다. dateTime에는 기계가 읽을 수 있는 시각을 넣습니다.','align은 start와 end입니다. 화면의 위치를 바꿔도 작성자·시각·내용의 읽기 순서는 유지됩니다. 텍스트 줄바꿈과 직접 넣은 링크를 보존합니다.','actions는 답장이나 추가 행동을 넣는 자리입니다. 전송·저장·사용자 상태는 화면이 관리하며 이 컴포넌트는 채팅 서버에 연결되지 않습니다.'],
 ErrorState:['title과 message에는 사용자가 이해할 수 있는 안내를 넣습니다. 서버 stack이나 비밀 값을 그대로 표시하지 마세요. details에는 안전한 추가 안내를 넣습니다.','onRetry에는 다시 시도할 함수를 연결합니다. Promise를 반환하면 끝날 때까지 버튼을 잠그고 같은 실행이 겹치지 않게 합니다. 실패하면 일반적인 다시 시도 안내를 표시합니다.','busy·disabled로 외부 작업 상태를 전달할 수 있습니다. 실제 오류 데이터와 성공 뒤 화면 전환은 사용하는 화면이 관리합니다.'],
 Pagination:['totalPages는 전체 페이지 수입니다. page와 onPageChange로 직접 관리하거나 defaultPage로 초기값만 지정합니다. 번호를 고르면 해당 숫자를 전달합니다.','현재 페이지는 aria-current=page로 알립니다. 경계의 이전·다음과 disabled 상태는 실행하지 않습니다. 긴 목록은 처음·끝·현재 주변 번호와 생략 표시로 줄입니다.','이 컴포넌트는 페이지 선택만 처리합니다. 데이터 요청·검색 결과·페이지 크기 변경은 화면이나 DataTable에서 관리하세요.'],
 ProgressStepper:['steps에 id·label·description을, currentStep에는 0부터 시작하는 현재 위치를 넣습니다. 이전은 완료, 현재는 진행 중, 이후는 예정으로 표시합니다.','특정 단계의 status로 complete·current·upcoming·error를 명시할 수 있습니다. 오류는 아이콘과 읽을 수 있는 상태 이름으로도 알립니다.','orientation은 horizontal·vertical입니다. onStepChange가 있으면 단계가 버튼이 되어 위치를 전달합니다. 어떤 단계로 이동할 수 있는지는 화면에서 판단하며 disabled로 막습니다.'],
 Result:['status는 success·error·info입니다. title·message와 actions로 결과와 다음 행동을 전달합니다.','error 결과는 ErrorState의 onRetry를 사용합니다. success·info에서는 onNext와 nextLabel로 다음 행동을 연결할 수 있습니다.','실제 완료·실패 여부를 추정하지 않습니다. busy·disabled와 결과는 화면이 전달하며 이 예제는 버튼 입력만 확인합니다.'],
 Table:['Table 안에 TableCaption·TableHeader·TableBody·TableRow·TableHead·TableCell을 조합합니다. 실제 table·caption·thead·tbody·tr·th·td 의미를 유지합니다.','TableHead는 기본 scope=col입니다. 행 제목은 scope=row로 바꾸세요. numeric을 지정한 제목·셀은 숫자를 오른쪽에 정렬합니다.','가로로 긴 표는 자기 영역 안에서 스크롤합니다. 정렬·검색·행 선택·페이지 처리는 이 컴포넌트가 아니라 DataTable의 책임입니다.'],
};
const uploads=[{name:'프로젝트 기획안',count:12},{name:'서비스 화면 설계',count:8},{name:'프로젝트를 함께 진행하며 확인할 운영 안내',count:3}];
const steps=[{id:'information',label:'정보 입력'},{id:'review',label:'내용 확인'},{id:'complete',label:'완료'}];
export function NativePage({name,initialPanel='usage'}:{name:NativeName;initialPanel?:'usage'|'settings'|'code'}){
 const [panel,setPanel]=useState(initialPanel),[page,setPage]=useState(3),[step,setStep]=useState(1),[tone,setTone]=useState<AlertTone>('info'),[status,setStatus]=useState<'success'|'error'|'info'>('success'),[align,setAlign]=useState<'start'|'end'>('start');
 const [disabled,setDisabled]=useState(false),[busy,setBusy]=useState(false),[visible,setVisible]=useState(true),[feedback,setFeedback]=useState('');
 const reset=()=>{setPage(3);setStep(1);setTone('info');setStatus('success');setAlign('start');setDisabled(false);setBusy(false);setVisible(true);setFeedback('');};
 let demo:ReactNode,body='',declarations='',symbols:string=name;
 const q=JSON.stringify;
 if(name==='Table'){
  demo=<Table><TableCaption>프로젝트 자료</TableCaption><TableHeader><TableRow><TableHead>자료 이름</TableHead><TableHead numeric>첨부 파일 수</TableHead></TableRow></TableHeader><TableBody>{uploads.map(row=><TableRow key={row.name}><TableCell>{row.name}</TableCell><TableCell numeric>{row.count}</TableCell></TableRow>)}</TableBody></Table>;
  symbols='Table, TableCaption, TableHeader, TableBody, TableRow, TableHead, TableCell';declarations=`const uploads = ${q(uploads)};`;body='<Table>\n    <TableCaption>프로젝트 자료</TableCaption>\n    <TableHeader><TableRow><TableHead>자료 이름</TableHead><TableHead numeric>첨부 파일 수</TableHead></TableRow></TableHeader>\n    <TableBody>{uploads.map(row => <TableRow key={row.name}><TableCell>{row.name}</TableCell><TableCell numeric>{row.count}</TableCell></TableRow>)}</TableBody>\n  </Table>';
 }else if(name==='Pagination'){
  demo=<div className="grid gap-4"><p>전체 20페이지 중 {page}페이지</p><Pagination page={page} totalPages={20} disabled={disabled} onPageChange={setPage}/></div>;
  declarations=`const [page, setPage] = useState(${page});`;body=`<div className="grid gap-4"><p>전체 20페이지 중 {page}페이지</p><Pagination page={page} totalPages={20} disabled={${disabled}} onPageChange={setPage}/></div>`;
 }else if(name==='Alert'){
  demo=visible?<Alert tone={tone} title="안내를 확인해 주세요." onDismiss={()=>setVisible(false)} dismissLabel="예제 안내 닫기">변경한 내용은 다음 화면에서도 이어집니다.</Alert>:<Button variant="secondary" onClick={()=>setVisible(true)}>안내 다시 보기</Button>;
  declarations=`const [visible, setVisible] = useState(${visible});`;body=`visible ? <Alert tone=${q(tone)} title="안내를 확인해 주세요." onDismiss={() => setVisible(false)} dismissLabel="예제 안내 닫기">변경한 내용은 다음 화면에서도 이어집니다.</Alert> : <Button variant="secondary" onClick={() => setVisible(true)}>안내 다시 보기</Button>`;
 }else if(name==='ErrorState'){
  demo=<ErrorState message="연결 상태를 확인하고 다시 시도해 주세요." details="입력한 내용은 그대로 남아 있습니다." busy={busy} disabled={disabled} onRetry={()=>setFeedback('다시 시도를 눌렀어요. 실제 서버 요청은 하지 않습니다.')}/>;
  declarations="const [feedback, setFeedback] = useState('');";body=`<div className="grid gap-4"><ErrorState message="연결 상태를 확인하고 다시 시도해 주세요." details="입력한 내용은 그대로 남아 있습니다." busy={${busy}} disabled={${disabled}} onRetry={() => setFeedback('다시 시도를 눌렀어요. 실제 서버 요청은 하지 않습니다.')}/><p role="status">{feedback}</p></div>`;
 }else if(name==='Result'){
  demo=<Result status={status} title={status==='error'?'다시 확인해 주세요.':'안내를 확인했어요.'} message="이어갈 행동을 선택해 주세요." busy={busy} disabled={disabled} onRetry={()=>setFeedback('다시 시도를 눌렀어요. 실제 서버 요청은 하지 않습니다.')} onNext={()=>setFeedback('다음으로를 눌렀어요. 이 예제는 화면을 이동하지 않습니다.')}/>;
  declarations="const [feedback, setFeedback] = useState('');";body=`<div className="grid gap-4"><Result status=${q(status)} title=${q(status==='error'?'다시 확인해 주세요.':'안내를 확인했어요.')} message="이어갈 행동을 선택해 주세요." busy={${busy}} disabled={${disabled}} onRetry={() => setFeedback('다시 시도를 눌렀어요. 실제 서버 요청은 하지 않습니다.')} onNext={() => setFeedback('다음으로를 눌렀어요. 이 예제는 화면을 이동하지 않습니다.')}/><p role="status">{feedback}</p></div>`;
 }else if(name==='ProgressStepper'){
  demo=<ProgressStepper steps={steps.map(item=>({...item,disabled}))} currentStep={step} onStepChange={setStep}/>;
  declarations=`const [step, setStep] = useState(${step});\n  const steps = ${q(steps.map(item=>({...item,disabled})))};`;body='<ProgressStepper steps={steps} currentStep={step} onStepChange={setStep}/>';
 }else if(name==='Breadcrumb'){
  const items=[{label:'문서',href:'#Overview'},{label:'컴포넌트',href:'#Button'},{label:'Breadcrumb'}];demo=<Breadcrumb items={items}/>;body=`<Breadcrumb items={${q(items)}}/>`;
 }else{
  demo=<Bubble author="김한결" time="오전 10:30" align={align} actions={<Button variant="quiet" onClick={()=>setFeedback('답장을 눌렀어요. 메시지는 전송하지 않습니다.')}>답장</Button>}>{'알림 설정을 확인했어요.\n다음 화면에서도 이어서 확인할 수 있습니다.'}</Bubble>;
  declarations="const [feedback, setFeedback] = useState('');";body=`<div className="grid gap-4"><Bubble author="김한결" time="오전 10:30" align=${q(align)} actions={<Button variant="quiet" onClick={() => setFeedback('답장을 눌렀어요. 메시지는 전송하지 않습니다.')}>답장</Button>}>{${q('알림 설정을 확인했어요.\n다음 화면에서도 이어서 확인할 수 있습니다.')}}</Bubble><p role="status">{feedback}</p></div>`;
 }
 const code=`import { useState } from 'react';\nimport { ${symbols} } from './hangyeol/components/${files[name]}';\nimport { Button } from './hangyeol/primitives/button';\n\nexport function Example() {\n  ${declarations}\n  return ${body};\n}`;
 return <div className="space-y-8"><ComponentIntroduction name={name} description={nativeDescriptions[name]} leadClassName="docs-intro"/><ExamplePurpose name={name}/><PreviewSurface asChild><section  aria-label={`${name} 사용 예제`}>{demo}{feedback&&<p role="status" className="mt-4 text-g-small text-g-soft">{feedback}</p>}</section></PreviewSurface>
 <Tabs value={panel} onValueChange={next=>setPanel(next as typeof panel)}><TabsList aria-label="예제 안내"><TabsTrigger value="usage">사용법</TabsTrigger><TabsTrigger value="settings">예제 설정</TabsTrigger><TabsTrigger value="code">코드</TabsTrigger></TabsList><TabsContent value="usage"><div className="grid gap-4 py-4">{usage[name].map(line=><p key={line} className="text-g-soft">{line}</p>)}</div></TabsContent><TabsContent value="settings"><div className="grid gap-4 py-4">
 {['Pagination','ErrorState','Result','ProgressStepper'].includes(name)&&<label className="flex min-h-11 items-center gap-3"><Checkbox checked={disabled} onCheckedChange={next=>setDisabled(next===true)}/>사용할 수 없는 상태</label>}
 {(name==='ErrorState'||name==='Result')&&<label className="flex min-h-11 items-center gap-3"><Checkbox checked={busy} onCheckedChange={next=>setBusy(next===true)}/>처리 중</label>}
 {name==='Alert'&&<SegmentedControl label="알림 종류" options={([{value:'info',label:'안내'},{value:'success',label:'완료'},{value:'warning',label:'주의'},{value:'error',label:'오류'}])} value={tone} onValueChange={next=>setTone(next as AlertTone)}/>}
 {name==='Result'&&<SegmentedControl label="결과 종류" options={[{value:'success',label:'완료'},{value:'info',label:'안내'},{value:'error',label:'오류'}]} value={status} onValueChange={next=>setStatus(next as typeof status)}/>}
 {name==='Bubble'&&<SegmentedControl label="내용 위치" options={[{value:'start',label:'왼쪽'},{value:'end',label:'오른쪽'}]} value={align} onValueChange={next=>setAlign(next as typeof align)}/>}
 <div><Button variant="secondary" onClick={reset}>예제 초기화</Button></div></div></TabsContent><TabsContent value="code"><div className="py-4"><p className="mb-4 text-g-small text-g-soft">현재 예제의 설정을 반영합니다. 소스 경로는 내 프로젝트에 맞게 바꾸세요.</p><CodeBlock>{code}</CodeBlock></div></TabsContent></Tabs></div>;
}

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, Dispatch, ReactNode, SetStateAction } from 'react'
import * as XLSX from 'xlsx'
import './App.css'

type Section='dashboard'|'employees'|'attendance'|'leaves'|'medical'|'missions'|'penalties'|'reports'|'settings'
type Employee={id:number;code:string;name:string;department:string;job:string;phone:string;status:string}
type Punch={id:number;code:string;name:string;date:string;time:string}
type Leave={id:number;employeeId:number;type:string;from:string;to:string;days:number;status:string;note:string}
type Mission={id:number;employeeId:number;from:string;to:string;destination:string;purpose:string;status:string}
type Penalty={id:number;employeeId:number;date:string;type:string;days:number;note:string}

const menu:{id:Section;label:string;icon:string}[]=[
{id:'dashboard',label:'الرئيسية',icon:'🏠'},{id:'employees',label:'الموظفين',icon:'👥'},
{id:'attendance',label:'الحضور والانصراف',icon:'🕘'},{id:'leaves',label:'الإجازات',icon:'🏖️'},
{id:'medical',label:'الخدمات الطبية',icon:'🏥'},{id:'missions',label:'المأموريات',icon:'📋'},
{id:'penalties',label:'الجزاءات',icon:'⚠️'},{id:'reports',label:'التقارير',icon:'📊'},{id:'settings',label:'الإعدادات',icon:'⚙️'}]

function read<T>(key:string,fallback:T):T{try{const x=localStorage.getItem(key);return x?JSON.parse(x) as T:fallback}catch{return fallback}}
function uid(){return Date.now()+Math.floor(Math.random()*1000)}
function daysBetween(a:string,b:string){if(!a||!b)return 0;const x=new Date(a+'T00:00:00'),y=new Date(b+'T00:00:00');return Math.max(1,Math.floor((y.getTime()-x.getTime())/86400000)+1)}
function dateNow(){return new Date().toISOString().slice(0,10)}
function normalDate(s:string){if(!s)return '';if(/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)){const p=s.split('-');return p[0]+'-'+p[1].padStart(2,'0')+'-'+p[2].padStart(2,'0')}const m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);return m?((m[3].length===2?'20':'')+m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0')):s}
function normalTime(s:string){const m=String(s||'').match(/(\d{1,2}):(\d{2})/);return m?m[1].padStart(2,'0')+':'+m[2]:'00:00'}
function downloadExcel(rows:unknown[],name:string){const ws=XLSX.utils.json_to_sheet(rows);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Report');XLSX.writeFile(wb,name)}

function App(){
 const [section,setSection]=useState<Section>('dashboard')
 const [employees,setEmployees]=useState<Employee[]>(()=>read('hr_employees',[]))
 const [punches,setPunches]=useState<Punch[]>(()=>read('hr_attendance',[]))
 const [leaves,setLeaves]=useState<Leave[]>(()=>read('hr_leaves',[]))
 const [missions,setMissions]=useState<Mission[]>(()=>read('hr_missions',[]))
 const [penalties,setPenalties]=useState<Penalty[]>(()=>read('hr_penalties',[]))
 const [settings,setSettings]=useState(()=>read('hr_settings',{start:'08:30',end:'14:30',grace:15,fridayOff:true,holidays:''}))
 useEffect(()=>localStorage.setItem('hr_employees',JSON.stringify(employees)),[employees])
 useEffect(()=>localStorage.setItem('hr_attendance',JSON.stringify(punches)),[punches])
 useEffect(()=>localStorage.setItem('hr_leaves',JSON.stringify(leaves)),[leaves])
 useEffect(()=>localStorage.setItem('hr_missions',JSON.stringify(missions)),[missions])
 useEffect(()=>localStorage.setItem('hr_penalties',JSON.stringify(penalties)),[penalties])
 useEffect(()=>localStorage.setItem('hr_settings',JSON.stringify(settings)),[settings])
 const current=menu.find(x=>x.id===section)
 return <div className="app" dir="rtl">
  <aside className="sidebar"><div className="brand"><div className="brand-icon">HR</div><div><h2>الشئون الإدارية</h2><span>نظام إدارة الشركة</span></div></div>
   <nav>{menu.map(x=><button key={x.id} className={section===x.id?'active':''} onClick={()=>setSection(x.id)}><span>{x.icon}</span>{x.label}</button>)}</nav>
   <div className="user-box"><div className="avatar">م</div><div><strong>مسؤول النظام</strong><span>Administrator</span></div></div>
  </aside>
  <main className="main"><header className="topbar"><div><h1>{current?.label}</h1><p>نظام مستقل يعمل محلياً ويحفظ البيانات على هذا الجهاز</p></div><div className="top-actions"><div className="date">{new Date().toLocaleDateString('ar-EG',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div></div></header>
   {section==='dashboard'&&<Dashboard employees={employees} punches={punches} leaves={leaves} go={setSection}/>}
   {section==='employees'&&<Employees employees={employees} setEmployees={setEmployees}/>}
   {section==='attendance'&&<Attendance employees={employees} punches={punches} setPunches={setPunches} settings={settings}/>}
   {section==='leaves'&&<Leaves employees={employees} rows={leaves} setRows={setLeaves}/>}
   {section==='missions'&&<Missions employees={employees} rows={missions} setRows={setMissions}/>}
   {section==='penalties'&&<Penalties employees={employees} rows={penalties} setRows={setPenalties}/>}
   {section==='medical'&&<Medical employees={employees}/>}
   {section==='reports'&&<Reports employees={employees} punches={punches} leaves={leaves} missions={missions} penalties={penalties}/>}
   {section==='settings'&&<Settings settings={settings} setSettings={setSettings}/>}
  </main>
 </div>
}

function Dashboard({employees,punches,leaves,go}:{employees:Employee[];punches:Punch[];leaves:Leave[];go:(s:Section)=>void}){
 const d=dateNow(),today=punches.filter(x=>x.date===d),present=new Set(today.map(x=>x.code)).size,late=new Set(today.filter(x=>x.time>'08:45').map(x=>x.code)).size
 return <><section className="stats"><Stat icon="👥" label="إجمالي الموظفين" value={employees.length}/><Stat icon="✓" label="الحضور اليوم" value={present}/><Stat icon="✕" label="الغياب اليوم" value={Math.max(0,employees.length-present)}/><Stat icon="⏰" label="المتأخرون" value={late}/></section>
 <section className="content-grid"><div className="panel"><div className="panel-header"><div><h2>الحضور والانصراف اليوم</h2><p>ملخص حركة الموظفين</p></div><button className="view-btn" onClick={()=>go('attendance')}>فتح الحضور</button></div><div className="empty-state"><div className="empty-icon">🕘</div><h3>{today.length?'تم تسجيل '+present+' موظف اليوم':'لا توجد بيانات حضور'}</h3><p>{today.length?'عدد حركات البصمة: '+today.length:'استورد ملف البصمة من قسم الحضور والانصراف.'}</p></div></div>
 <div className="panel"><div className="panel-header"><div><h2>الإجازات</h2><p>المسجلة في النظام</p></div></div><div className="medical-mini"><div><span>طلبات الإجازة</span><strong>{leaves.length}</strong></div><div><span>قيد المراجعة</span><strong>{leaves.filter(x=>x.status==='قيد المراجعة').length}</strong></div><div><span>الموظفون</span><strong>{employees.length}</strong></div></div><button className="primary-btn" onClick={()=>go('leaves')}>فتح الإجازات</button></div></section>
 <section className="quick-actions"><h2>إجراءات سريعة</h2><div className="actions"><button onClick={()=>go('employees')}><span>➕</span>إضافة موظف</button><button onClick={()=>go('attendance')}><span>📥</span>استيراد البصمة</button><button onClick={()=>go('leaves')}><span>🏖️</span>تسجيل إجازة</button><button onClick={()=>go('reports')}><span>📊</span>التقارير</button></div></section></>
}
function Stat({icon,label,value}:{icon:string;label:string;value:string|number}){return <div className="stat-card"><div className="stat-icon blue">{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>}

function Employees({employees,setEmployees}:{employees:Employee[];setEmployees:Dispatch<SetStateAction<Employee[]>>}){
 const [open,setOpen]=useState(false),[edit,setEdit]=useState<Employee|null>(null),[q,setQ]=useState('')
 const empty={code:'',name:'',department:'',job:'',phone:''};const [form,setForm]=useState(empty)
 const filtered=employees.filter(e=>(e.name+' '+e.code+' '+e.department+' '+e.job).toLowerCase().includes(q.toLowerCase()))
 function save(){if(!form.name.trim())return alert('اكتب اسم الموظف');if(edit)setEmployees(xs=>xs.map(x=>x.id===edit.id?{...edit,...form}:x));else setEmployees(xs=>[...xs,{...form,id:uid(),status:'على رأس العمل'}]);setForm(empty);setEdit(null);setOpen(false)}
 function openEdit(e:Employee){setEdit(e);setForm({code:e.code,name:e.name,department:e.department,job:e.job,phone:e.phone});setOpen(true)}
 return <><PageActions title="الموظفين" text="قاعدة بيانات الموظفين المحلية" action="＋ إضافة موظف" onClick={()=>{setEdit(null);setForm(empty);setOpen(true)}}/>
 <div className="toolbar"><input placeholder="بحث بالاسم أو الرقم أو القسم..." value={q} onChange={e=>setQ(e.target.value)}/><span>عدد الموظفين: <b>{employees.length}</b></span></div>
 <section className="panel table-panel"><TableWrap><table><thead><tr><th>الرقم</th><th>الاسم</th><th>القسم</th><th>الوظيفة</th><th>الهاتف</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>{filtered.length?filtered.map(e=><tr key={e.id}><td>{e.code}</td><td><b>{e.name}</b></td><td>{e.department}</td><td>{e.job}</td><td>{e.phone}</td><td><span className="badge">{e.status}</span></td><td><button className="view-btn" onClick={()=>openEdit(e)}>تعديل</button> <button className="danger-btn" onClick={()=>confirm('حذف الموظف؟')&&setEmployees(xs=>xs.filter(x=>x.id!==e.id))}>حذف</button></td></tr>):<EmptyRow col={7} text="لا توجد موظفين. ابدأ بإضافة أول موظف."/>}</tbody></table></TableWrap></section>
 {open&&<Modal title={edit?'تعديل موظف':'إضافة موظف'} close={()=>setOpen(false)}><FormEmployee form={form} setForm={setForm}/><button className="primary-btn" onClick={save}>حفظ</button></Modal>}</>
}
function FormEmployee({form,setForm}:{form:{code:string;name:string;department:string;job:string;phone:string};setForm:Dispatch<SetStateAction<{code:string;name:string;department:string;job:string;phone:string}>>}){return <div className="form-grid">{[['code','الرقم الوظيفي'],['name','اسم الموظف'],['department','القسم'],['job','الوظيفة'],['phone','رقم الهاتف']].map(([k,l])=><label key={k}>{l}<input value={form[k as keyof typeof form]} onChange={e=>setForm(x=>({...x,[k]:e.target.value}))}/></label>)}</div>}

function Attendance({employees,punches,setPunches,settings}:{employees:Employee[];punches:Punch[];setPunches:Dispatch<SetStateAction<Punch[]>>;settings:any}){
 const input=useRef<HTMLInputElement>(null),[date,setDate]=useState(dateNow()),[q,setQ]=useState(''),[month,setMonth]=useState(dateNow().slice(0,7))
 const dayRows=useMemo(()=>{const map=new Map<string,Punch[]>();punches.filter(x=>x.date===date).forEach(x=>map.set(x.code,[...(map.get(x.code)||[]),x]));return employees.map(e=>{const ps=(map.get(e.code)||[]).sort((a,b)=>a.time.localeCompare(b.time));return {e,first:ps[0]?.time||'',last:ps.length>1?ps[ps.length-1].time:'',count:ps.length,status:ps.length?'حاضر':'غياب',late:ps[0]?.time>addMinutes(settings.start,Number(settings.grace)||0)}})},[punches,employees,date,settings])
 const importFile=async(e:ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;try{const wb=XLSX.read(await f.arrayBuffer(),{type:'array',cellDates:true});const ws=wb.Sheets[wb.SheetNames[0]];const raw=XLSX.utils.sheet_to_json<any[]>(ws,{header:1,defval:''});const h=(raw[0]||[]).map(x=>String(x).trim().toLowerCase());const idx=(a:string[])=>h.findIndex(x=>a.some(y=>x.includes(y)));const ci=idx(['id','code','رقم','كود','employee','userid','رقم الموظف']),ni=idx(['name','اسم','employee name']),di=idx(['date','تاريخ','datetime','日期']),ti=idx(['time','وقت']);const out:Punch[]=[];for(let i=1;i<raw.length;i++){const r=raw[i];if(!r?.length)continue;let code=String(r[ci>=0?ci:0]??'').trim();let name=String(r[ni>=0?ni:1]??'').trim();let d='',t='';const dv=di>=0?r[di]:'';const tv=ti>=0?r[ti]:'';if(dv instanceof Date){d=dv.toISOString().slice(0,10);t=dv.toTimeString().slice(0,5)}else{const parts=String(dv||'').trim().split(/[ T]+/);d=normalDate(parts[0]);if(parts[1])t=normalTime(parts[1])}if(!t||t==='00:00')t=tv instanceof Date?tv.toTimeString().slice(0,5):normalTime(String(tv||''));if(!d)continue;const emp=employees.find(x=>x.code===code)||employees.find(x=>x.name===name);if(emp){code=emp.code;name=emp.name}out.push({id:uid()+i,code,name:name||'غير معروف',date:d,time:t})}setPunches(xs=>[...xs,...out]);alert('تم استيراد '+out.length+' حركة بصمة')}catch(err){console.error(err);alert('تعذر قراءة ملف Excel. تأكد أن الصف الأول يحتوي عناوين الأعمدة.')}e.target.value=''}
 const monthRows=employees.map(e=>{const ps=punches.filter(x=>x.code===e.code&&x.date.startsWith(month));const dates=new Set(ps.map(x=>x.date));return {الرقم:e.code,الاسم:e.name,حضور:dates.size,غياب:Math.max(0,new Date(month+'-01').getDate()===1?0:0),حركات:ps.length}})
 const exportDay=()=>downloadExcel(dayRows.map(x=>({الرقم:x.e.code,الاسم:x.e.name,التاريخ:date,أول_بصمة:x.first||'—',آخر_بصمة:x.last||'—',عدد_البصمات:x.count,الحالة:x.status,التأخير:x.late?'متأخر':''})),'attendance-'+date+'.xlsx')
 const exportMonth=()=>downloadExcel(monthRows,'attendance-'+month+'.xlsx')
 return <><PageActions title="الحضور والانصراف" text="استيراد البصمة وتحويل الحركات إلى حضور وغياب وأول وآخر بصمة" action="📥 استيراد Excel" onClick={()=>input.current?.click()}/><input ref={input} hidden type="file" accept=".xlsx,.xls,.csv" onChange={importFile}/>
 <div className="toolbar"><input placeholder="بحث بالاسم أو الكود..." value={q} onChange={e=>setQ(e.target.value)}/><label>اليوم <input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><button className="view-btn" onClick={exportDay}>تصدير اليوم</button><label>الشهر <input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></label><button className="view-btn" onClick={exportMonth}>تصدير الشهر</button></div>
 <section className="panel table-panel"><TableWrap><table><thead><tr><th>الكود</th><th>الاسم</th><th>أول بصمة</th><th>آخر بصمة</th><th>عدد البصمات</th><th>الحالة</th><th>التأخير</th></tr></thead><tbody>{dayRows.filter(x=>(x.e.name+' '+x.e.code).includes(q)).map(x=><tr key={x.e.id}><td>{x.e.code}</td><td>{x.e.name}</td><td>{x.first||'—'}</td><td>{x.last||'—'}</td><td>{x.count}</td><td><span className={x.status==='حاضر'?'badge':'badge absent'}>{x.status}</span></td><td>{x.late?'متأخر':''}</td></tr>)}{!dayRows.length&&<EmptyRow col={7} text="لا يوجد موظفون."/>}</tbody></table></TableWrap></section></>
}
function addMinutes(t:string,m:number){const [h,n]=t.split(':').map(Number);const z=h*60+n+m;return String(Math.floor(z/60)).padStart(2,'0')+':'+String(z%60).padStart(2,'0')}

function Leaves({employees,rows,setRows}:{employees:Employee[];rows:Leave[];setRows:Dispatch<SetStateAction<Leave[]>>}){
 const [open,setOpen]=useState(false),[q,setQ]=useState('');const empty={employeeId:employees[0]?.id||0,type:'اعتيادية',from:dateNow(),to:dateNow(),days:1,status:'قيد المراجعة',note:''};const [f,setF]=useState(empty)
 const save=()=>{if(!f.employeeId)return alert('أضف موظفاً أولاً');setRows(x=>[...x,{...f,id:uid(),days:daysBetween(f.from,f.to)}]);setOpen(false);setF({...empty,employeeId:employees[0]?.id||0})}
 const name=(id:number)=>employees.find(e=>e.id===id)?.name||'غير معروف'
 return <><PageActions title="الإجازات" text="تسجيل ومتابعة الإجازات واعتمادها" action="＋ إضافة إجازة" onClick={()=>setOpen(true)}/><div className="toolbar"><input placeholder="بحث..." value={q} onChange={e=>setQ(e.target.value)}/><span>الإجمالي: <b>{rows.length}</b></span></div><section className="panel table-panel"><TableWrap><table><thead><tr><th>الموظف</th><th>النوع</th><th>من</th><th>إلى</th><th>الأيام</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>{rows.filter(x=>name(x.employeeId).includes(q)).map(x=><tr key={x.id}><td>{name(x.employeeId)}</td><td>{x.type}</td><td>{x.from}</td><td>{x.to}</td><td>{x.days}</td><td><span className="badge">{x.status}</span></td><td><button className="view-btn" onClick={()=>setRows(xs=>xs.map(a=>a.id===x.id?{...a,status:a.status==='معتمدة'?'قيد المراجعة':'معتمدة'}:a))}>تغيير الحالة</button> <button className="danger-btn" onClick={()=>setRows(xs=>xs.filter(a=>a.id!==x.id))}>حذف</button></td></tr>)}{!rows.length&&<EmptyRow col={7} text="لا توجد إجازات مسجلة."/>}</tbody></table></TableWrap></section>{open&&<Modal title="إضافة إجازة" close={()=>setOpen(false)}><div className="form-grid"><label>الموظف<select value={f.employeeId} onChange={e=>setF({...f,employeeId:Number(e.target.value)})}>{employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label><label>النوع<select value={f.type} onChange={e=>setF({...f,type:e.target.value})}><option>اعتيادية</option><option>عارضة</option><option>مرضية</option><option>بدون مرتب</option></select></label><label>من<input type="date" value={f.from} onChange={e=>setF({...f,from:e.target.value})}/></label><label>إلى<input type="date" value={f.to} onChange={e=>setF({...f,to:e.target.value})}/></label><label className="full">ملاحظات<textarea value={f.note} onChange={e=>setF({...f,note:e.target.value})}/></label></div><button className="primary-btn" onClick={save}>حفظ الإجازة</button></Modal>}</>
}

function Missions({employees,rows,setRows}:{employees:Employee[];rows:Mission[];setRows:Dispatch<SetStateAction<Mission[]>>}){
 const [open,setOpen]=useState(false),empty={employeeId:employees[0]?.id||0,from:dateNow(),to:dateNow(),destination:'',purpose:'',status:'قيد المراجعة'},[f,setF]=useState(empty);const name=(id:number)=>employees.find(e=>e.id===id)?.name||'غير معروف';const save=()=>{if(!f.employeeId||!f.destination)return alert('اختر الموظف واكتب الجهة');setRows(x=>[...x,{...f,id:uid()}]);setOpen(false)}
 return <><PageActions title="المأموريات" text="تسجيل مأموريات الموظفين والجهات والتواريخ" action="＋ إضافة مأمورية" onClick={()=>setOpen(true)}/><section className="panel table-panel"><TableWrap><table><thead><tr><th>الموظف</th><th>من</th><th>إلى</th><th>الجهة</th><th>الغرض</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td>{name(x.employeeId)}</td><td>{x.from}</td><td>{x.to}</td><td>{x.destination}</td><td>{x.purpose}</td><td><span className="badge">{x.status}</span></td><td><button className="view-btn" onClick={()=>setRows(xs=>xs.map(a=>a.id===x.id?{...a,status:a.status==='معتمدة'?'قيد المراجعة':'معتمدة'}:a))}>اعتماد</button> <button className="danger-btn" onClick={()=>setRows(xs=>xs.filter(a=>a.id!==x.id))}>حذف</button></td></tr>)}{!rows.length&&<EmptyRow col={7} text="لا توجد مأموريات."/>}</tbody></table></TableWrap></section>{open&&<Modal title="إضافة مأمورية" close={()=>setOpen(false)}><div className="form-grid"><label>الموظف<select value={f.employeeId} onChange={e=>setF({...f,employeeId:Number(e.target.value)})}>{employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label><label>الجهة<input value={f.destination} onChange={e=>setF({...f,destination:e.target.value})}/></label><label>من<input type="date" value={f.from} onChange={e=>setF({...f,from:e.target.value})}/></label><label>إلى<input type="date" value={f.to} onChange={e=>setF({...f,to:e.target.value})}/></label><label className="full">الغرض<textarea value={f.purpose} onChange={e=>setF({...f,purpose:e.target.value})}/></label></div><button className="primary-btn" onClick={save}>حفظ</button></Modal>}</>
}

function Penalties({employees,rows,setRows}:{employees:Employee[];rows:Penalty[];setRows:Dispatch<SetStateAction<Penalty[]>>}){
 const [open,setOpen]=useState(false),empty={employeeId:employees[0]?.id||0,date:dateNow(),type:'إنذار',days:0,note:''},[f,setF]=useState(empty);const name=(id:number)=>employees.find(e=>e.id===id)?.name||'غير معروف';const save=()=>{if(!f.employeeId)return alert('أضف موظفاً أولاً');setRows(x=>[...x,{...f,id:uid()}]);setOpen(false)}
 return <><PageActions title="الجزاءات" text="تسجيل الجزاءات والقرارات الإدارية" action="＋ إضافة جزاء" onClick={()=>setOpen(true)}/><section className="panel table-panel"><TableWrap><table><thead><tr><th>الموظف</th><th>التاريخ</th><th>الجزاء</th><th>الأيام</th><th>الملاحظات</th><th>إجراء</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td>{name(x.employeeId)}</td><td>{x.date}</td><td>{x.type}</td><td>{x.days}</td><td>{x.note}</td><td><button className="danger-btn" onClick={()=>setRows(xs=>xs.filter(a=>a.id!==x.id))}>حذف</button></td></tr>)}{!rows.length&&<EmptyRow col={6} text="لا توجد جزاءات."/>}</tbody></table></TableWrap></section>{open&&<Modal title="إضافة جزاء" close={()=>setOpen(false)}><div className="form-grid"><label>الموظف<select value={f.employeeId} onChange={e=>setF({...f,employeeId:Number(e.target.value)})}>{employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label><label>نوع الجزاء<select value={f.type} onChange={e=>setF({...f,type:e.target.value})}><option>إنذار</option><option>خصم</option><option>لوم</option><option>جزاء إداري</option></select></label><label>التاريخ<input type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})}/></label><label>عدد الأيام<input type="number" min="0" value={f.days} onChange={e=>setF({...f,days:Number(e.target.value)})}/></label><label className="full">الملاحظات<textarea value={f.note} onChange={e=>setF({...f,note:e.target.value})}/></label></div><button className="primary-btn" onClick={save}>حفظ الجزاء</button></Modal>}</>
}

function Reports({employees,punches,leaves,missions,penalties}:{employees:Employee[];punches:Punch[];leaves:Leave[];missions:Mission[];penalties:Penalty[]}){
 const exportEmployees=()=>downloadExcel(employees,'employees.xlsx'),exportPunches=()=>downloadExcel(punches,'attendance-raw.xlsx'),exportLeaves=()=>downloadExcel(leaves.map(x=>({...x,employee:employees.find(e=>e.id===x.employeeId)?.name||''})),'leaves.xlsx')
 return <><PageActions title="التقارير" text="تصدير بيانات النظام إلى Excel" action="📥 تقرير الموظفين" onClick={exportEmployees}/><section className="stats"><Stat icon="👥" label="الموظفون" value={employees.length}/><Stat icon="🕘" label="حركات البصمة" value={punches.length}/><Stat icon="🏖️" label="الإجازات" value={leaves.length}/><Stat icon="📋" label="المأموريات" value={missions.length}/></section><section className="content-grid"><div className="panel"><h2>تصدير التقارير</h2><div className="actions report-actions"><button onClick={exportEmployees}>👥 الموظفين</button><button onClick={exportPunches}>🕘 الحضور الخام</button><button onClick={exportLeaves}>🏖️ الإجازات</button><button onClick={()=>downloadExcel(missions,'missions.xlsx')}>📋 المأموريات</button><button onClick={()=>downloadExcel(penalties,'penalties.xlsx')}>⚠️ الجزاءات</button></div></div><div className="panel"><h2>ملاحظات</h2><p className="muted">كل التقارير يتم إنشاؤها على جهازك مباشرة ولا تحتاج إلى قاعدة بيانات أو إنترنت.</p></div></section></>
}

function Settings({settings,setSettings}:{settings:any;setSettings:Dispatch<SetStateAction<any>>}){
 const [f,setF]=useState(settings);function save(){setSettings(f);alert('تم حفظ الإعدادات')}function backup(){const data={employees:read('hr_employees',[]),attendance:read('hr_attendance',[]),leaves:read('hr_leaves',[]),missions:read('hr_missions',[]),penalties:read('hr_penalties',[]),settings:f};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='hr-backup.json';a.click();URL.revokeObjectURL(a.href)}
 return <><PageActions title="الإعدادات" text="مواعيد العمل والنسخ الاحتياطي" action="💾 حفظ الإعدادات" onClick={save}/><section className="panel"><div className="form-grid"><label>بداية العمل<input type="time" value={f.start} onChange={e=>setF({...f,start:e.target.value})}/></label><label>نهاية العمل<input type="time" value={f.end} onChange={e=>setF({...f,end:e.target.value})}/></label><label>سماح التأخير بالدقائق<input type="number" min="0" value={f.grace} onChange={e=>setF({...f,grace:Number(e.target.value)})}/></label><label className="full">العطلات الرسمية (كل تاريخ في سطر)<textarea value={f.holidays} onChange={e=>setF({...f,holidays:e.target.value})}/></label></div><div className="settings-actions"><button className="primary-btn" onClick={save}>حفظ</button><button className="view-btn" onClick={backup}>📦 تنزيل نسخة احتياطية</button></div></section></>
}

function Medical({employees}:{employees:Employee[]}){const [tab,setTab]=useState('overview');const tabs=[['overview','نظرة عامة'],['files','الملفات الطبية'],['exams','الفحوصات'],['sick','الإجازات المرضية'],['treatment','طلبات العلاج'],['insurance','التأمين']];return <div className="medical-page"><section className="medical-hero"><div><div className="medical-title">🏥 الخدمات الطبية</div><h2>إدارة الرعاية الطبية للموظفين</h2><p>واجهة محلية جاهزة للتوسع.</p></div></section><div className="medical-tabs">{tabs.map(x=><button className={tab===x[0]?'active':''} onClick={()=>setTab(x[0])} key={x[0]}>{x[1]}</button>)}</div><section className="panel placeholder"><div className="empty-icon">🏥</div><h2>{tabs.find(x=>x[0]===tab)?.[1]}</h2><p>{tab==='overview'?'عدد الموظفين: '+employees.length:'يمكن إضافة بيانات هذا القسم في المرحلة التالية.'}</p></section></div>}

function PageActions({title,text,action,onClick}:{title:string;text:string;action:string;onClick:()=>void}){return <div className="page-actions"><div><h2>{title}</h2><p>{text}</p></div><button className="primary-btn" onClick={onClick}>{action}</button></div>}
function TableWrap({children}:{children:ReactNode}){return <div className="table-wrap">{children}</div>}
function EmptyRow({col,text}:{col:number;text:string}){return <tr><td colSpan={col}><div className="table-empty">{text}</div></td></tr>}
function Modal({title,close,children}:{title:string;close:()=>void;children:ReactNode}){return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&close()}><div className="modal"><div className="modal-head"><h2>{title}</h2><button onClick={close}>×</button></div>{children}</div></div>}
export default App

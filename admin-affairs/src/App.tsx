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
 const defaultEmployees:Employee[]=[
['8713','خالد محمد عبود احمد','مكتبى تجارى'],['8717','مصطفى رجب فهمى محمد','مكتبى تجارى'],['8720','مصطفى محمود احمد محم','مكتبى تجارى'],['8908','ناديه كمال عازر سليم','مكتبى تجارى'],['8996','سيد عبدالسلام سيد مح','مكتبى تجارى'],['8999','محمد محمود حسان رمضا','مكتبى تجارى'],['9002','محمد محمد امين ابوال','مكتبى تجارى'],['9163','محمد سيد حافظ قناوى','مكتبى تجارى'],['9270','عصام سيد محمود عيسى','مكتبى تجارى'],['9411','منال عبد اللاه حسن ض','مكتبى تجارى'],['9509','حارث معبد امين خضر','مكتبى تجارى'],['400000','سيد عبدالسلام عبدالر','مكتبى تجارى'],['400199','محمد سالم سليمان','مكتبى تجارى'],['400405','احمد طة عبدالجواد عل','مكتبى تجارى'],
['8623','احمد جمعه احمد عطوه','مكتبى فنى'],['9161','احمد عويس سعيد عبدال','مكتبى فنى'],['9356','سيد محمد حسان احمد','مكتبى فنى'],['9506','محمد محمد فخرى احمدع','مكتبى فنى'],['9563','عصام فتحى محمد عثمان','مكتبى فنى'],['400369','احمد محمد سيد احمد ع','مكتبى فنى'],['9002344','احمد محمد فتحى','مكتبى فنى'],
['8465','اشرف محمد عبدالله اب','تحصيل'],['8689','احمد على محمد الريدى','تحصيل'],['8714','صلاح سيد ذكى رجب','تحصيل'],['8721','شعبان حسين عبدالعظيم','تحصيل'],['9000','محمود حسان محمد حسن','تحصيل'],['9001','محمد عبدالعظيم عبدال','تحصيل'],['9016','حمدى عويس طه حسنين','تحصيل'],['9162','لطفى فتحى تمام جوده','تحصيل'],['9409','فؤاد سيد ابراهيم يوس','تحصيل'],['9421','وائل فتحى عبد الحميد','تحصيل'],['9422','حمدى جوده محمدمحمود','تحصيل'],['9578','محمد كامل عبدالفضيل','تحصيل'],['49003','منتصر غانم بكرى ابوا','تحصيل'],['400423','طارق حسنى صابر طلب','تحصيل'],['400521','يوسف رمضان على مهلهل','تحصيل'],['400566','محمد سيد محمود حسان','تحصيل'],['400567','احمد عبدالمنجى عبدال','تحصيل'],['400568','سعيد محمد سعيد محم','تحصيل'],['400599','حازم محمد عيسى محمد','تحصيل'],['400600','خالدمحمد محمود حسن ا','تحصيل'],
['8712','محمد حلمى طه عبد الم','ورادى الهندسة'],['8934','مختار محمد محمود احم','ورادى الهندسة'],['8998','محمد جمعه عبدالجيد م','ورادى الهندسة'],['9187','ربيع فهيم محمد مليجى','ورادى الهندسة'],['9564','يحيى عبدالحميد محمد','ورادى الهندسة'],['400115','سيد عبد الحليم صالح','ورادى الهندسة'],['400260','احمد محمد ابراهيم','ورادى الهندسة'],
['400650','محمد عبد القادر خليف','مكتبى ادارى'],['900334','زينب احمد حسن احمد','مكتبى ادارى'],['9002194','مصطفى عادل جابر احمد','مكتبى ادارى'],
['9088','حمادة عبدالله محمد ع','فرقه الصيانه'],['9352','سلامة سيد عبدالعزيز','فرقه الصيانه'],['9355','محمد حسن عبدالغفار ا','فرقه الصيانه'],['9446','عبد الحميد فهمى عبدا','فرقه الصيانه'],['9500','وليد درويش فهمى غيضا','فرقه الصيانه'],['900202','بهاء جمال انيس عاذر','فرقه الصيانه'],['900324','طه محمود عبد المنعم','فرقه الصيانه'],['9002246','احمد حسنى اسماعيل','فرقه الصيانه'],['9002247','جمعه معوض كامل','فرقه الصيانه'],['9002248','عماد خالد شعبان','فرقه الصيانه'],['9002249','محمد صالح عبد الحكيم','فرقه الصيانه'],['9002250','محمد عفت فتحى','فرقه الصيانه'],['9002251','محمود محمد عبد الباق','فرقه الصيانه'],['9002252','محمود محمد عبد الحسي','فرقه الصيانه'],['9002253','نادر محمد سيد','فرقه الصيانه'],
['9351','عرفه عاشور عبدالقوى','براوة'],['9447','يحيى حزين منيسى هندى','براوة'],['400198','ولاء صابرمشرف محمد','ننا'],['9289','عماد شعبان احمد عبدا','قاى'],['9565','احمد عبدالشكورحسين','قاى'],['9507','وليد سيد حسن مصطفى','النويرة'],['900327','على سيد صالح محمد','النويرة'],['9456','عادل عبدالرازق عبدال','الخرجين'],['8709','عبدالعزيز صوفى عبدال','العواونه'],['9043','جابر احمد عبدالفتاح','العواونه'],['9349','محمود سيد جنيدى محمد','العواونه'],['9340','نايف محمود عبدالفتاح','الشروق'],['9348','عماد عبدالعال سيد خل','الشروق'],['9591','احمد سيد محمد محمد','الشروق'],['9158','اشرف محمد الامير سعي','الانصار'],['400097','عيسى رجب سلطان سالم','الانصار'],['400348','امين محمد محمد شهاب','الانصار'],['8708','محروس سعد جاد السيد','المدينة'],['8710','مسلم حسن جمعه على','المدينة'],['9275','محمد عبدالحى خليفه غ','المدينة'],['400347','حمدى امام بدر محمد','المدينة'],['8997','هلال رشاد كمال عبدال','نقل مؤقت']
].map(([code,name,department],i)=>({id:i+1,code,name,department,job:'',phone:'',status:'على رأس العمل'}));
 const [employees,setEmployees]=useState<Employee[]>(()=>{const saved=read<Employee[]>('hr_employees',[]);return saved.length?saved:defaultEmployees})
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
  <aside className="sidebar"><div className="brand"><div className="brand-logo">ك</div><div className="brand-copy"><h2>قطاع كهرباء بني سويف</h2><span>هندسة كهرباء أهناسيا</span></div></div>
   <nav>{menu.map(x=><button key={x.id} className={section===x.id?'active':''} onClick={()=>setSection(x.id)}><span>{x.icon}</span>{x.label}</button>)}</nav>
   <div className="user-box"><div className="avatar">م</div><div><strong>مسؤول النظام</strong><span>Administrator</span></div></div>
  </aside>
  <main className="main"><header className="topbar"><div><h1>{current?.label}</h1><p>قطاع كهرباء بني سويف — هندسة كهرباء أهناسيا</p></div><div className="top-actions"><div className="date">{new Date().toLocaleDateString('ar-EG',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div></div></header>
   {section==='dashboard'&&<Dashboard employees={employees} punches={punches} leaves={leaves} go={setSection}/>}
   {section==='employees'&&<Employees employees={employees} setEmployees={setEmployees}/>}
   {section==='attendance'&&<Attendance employees={employees} punches={punches} setPunches={setPunches} settings={settings} leaves={leaves}/>} 
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

function Attendance({employees,punches,setPunches,settings,leaves}:{employees:Employee[];punches:Punch[];setPunches:Dispatch<SetStateAction<Punch[]>>;settings:any;leaves:Leave[]}){
 const input=useRef<HTMLInputElement>(null),[date,setDate]=useState(dateNow()),[q,setQ]=useState(''),[month,setMonth]=useState(dateNow().slice(0,7))
 const holidays=useMemo(()=>new Set(String(settings.holidays||'').split(/[\\n,;]+/).map((x:string)=>normalDate(x.trim())).filter(Boolean)),[settings.holidays])
 const approvedLeave=(employeeId:number,d:string)=>leaves.some(x=>x.employeeId===employeeId&&x.status==='معتمدة'&&d>=x.from&&d<=x.to)
 const isFriday=(d:string)=>new Date(d+'T00:00:00').getDay()===5
 const isOff=(d:string)=>isFriday(d)&&settings.fridayOff
 const dayRows=useMemo(()=>{
   const map=new Map<string,Punch[]>()
   punches.filter(x=>x.date===date).forEach(x=>map.set(x.code,[...(map.get(x.code)||[]),x]))
   return employees.map(e=>{
     const ps=(map.get(e.code)||[]).sort((a,b)=>a.time.localeCompare(b.time))
     const leave=approvedLeave(e.id,date)
     const off=isOff(date),holiday=holidays.has(date)
     const status=ps.length?'حاضر':(leave?'إجازة':(holiday?'عطلة رسمية':(off?'جمعة':'غياب')))
     return {e,first:ps[0]?.time||'',last:ps.length>1?ps[ps.length-1].time:'',count:ps.length,status,late:!!ps[0]&&ps[0].time>addMinutes(settings.start,Number(settings.grace)||0),single:ps.length===1}
   })
 },[punches,employees,date,settings,holidays,leaves])
 const monthDays=useMemo(()=>{
   const [y,m]=month.split('-').map(Number),n=new Date(y,m,0).getDate()
   return Array.from({length:n},(_,i)=>month+'-'+String(i+1).padStart(2,'0'))
 },[month])
 const monthMatrix=useMemo(()=>employees.map(e=>{
   let present=0,absent=0,single=0,leaveDays=0,offDays=0,holidayDays=0
   const cells=monthDays.map(d=>{
     const ps=punches.filter(x=>x.code===e.code&&x.date===d).sort((a,b)=>a.time.localeCompare(b.time))
     const friday=isFriday(d),holiday=holidays.has(d),leave=approvedLeave(e.id,d)
     let value='غياب'
     if(ps.length){present++;if(ps.length===1){single++;value='بصمة واحدة'}else value='حاضر'}
     else if(leave){leaveDays++;value='إجازة'}
     else if(holiday){holidayDays++;value='عطلة'}
     else if(isOff(d)){offDays++;value='جمعة'}
     else absent++
     return {date:d,value,first:ps[0]?.time||'',last:ps.length>1?ps[ps.length-1].time:''}
   })
   const workdays=monthDays.filter(d=>!isOff(d)&&!holidays.has(d)&&!approvedLeave(e.id,d)).length
   return {e,cells,present,absent,single,leaveDays,offDays,holidayDays,workdays}
 }),[employees,punches,monthDays,holidays,settings,leaves])
 const importFile=async(e:ChangeEvent<HTMLInputElement>)=>{
   const f=e.target.files?.[0];if(!f)return
   try{
     const wb=XLSX.read(await f.arrayBuffer(),{type:'array',cellDates:true})
     const ws=wb.Sheets[wb.SheetNames[0]]
     const raw=XLSX.utils.sheet_to_json<any[]>(ws,{header:1,defval:''})
     const h=(raw[0]||[]).map((x:any)=>String(x).trim().toLowerCase())
     const idx=(a:string[])=>h.findIndex((x:string)=>a.some(y=>x.includes(y)))
     const ci=idx(['id','code','رقم','كود','employee','userid','رقم الموظف','pin'])
     const ni=idx(['name','اسم','employee name','الاسم','الموظف'])
     const di=idx(['date','تاريخ','datetime','日期','التاريخ'])
     const ti=idx(['time','وقت','check time','وقت الحضور','الوقت'])
     const out:Punch[]=[]
     for(let i=1;i<raw.length;i++){
       const r=raw[i];if(!r?.length)continue
       let code=String(r[ci>=0?ci:0]??'').trim(),name=String(r[ni>=0?ni:1]??'').trim(),d='',t=''
       const dv=di>=0?r[di]:'',tv=ti>=0?r[ti]:''
       if(dv instanceof Date){d=dv.toISOString().slice(0,10);t=dv.toTimeString().slice(0,5)}
       else{
         const rawDate=String(dv||'').trim()
         const parts=rawDate.split(/[ T]+/)
         d=normalDate(parts[0])
         if(parts[1])t=normalTime(parts[1])
       }
       if(!t||t==='00:00')t=tv instanceof Date?tv.toTimeString().slice(0,5):normalTime(String(tv||''))
       if(!d||!/^\\d{4}-\\d{2}-\\d{2}$/.test(d)||!/^\\d{2}:\\d{2}$/.test(t))continue
       const emp=employees.find(x=>x.code===code)||employees.find(x=>x.name===name)
       if(emp){code=emp.code;name=emp.name}
       out.push({id:uid()+i,code,name:name||'غير معروف',date:d,time:t})
     }
     const unique=new Map<string,Punch>()
     ;[...punches,...out].forEach(x=>unique.set(x.code+'|'+x.date+'|'+x.time,x))
     setPunches(Array.from(unique.values()))
     alert('تم استيراد '+out.length+' حركة بصمة بدون تكرار')
   }catch(err){console.error(err);alert('تعذر قراءة ملف Excel. تأكد أن الصف الأول يحتوي عناوين الأعمدة.')}
   e.target.value=''
 }
 const filteredDay=dayRows.filter(x=>(x.e.name+' '+x.e.code).toLowerCase().includes(q.toLowerCase()))
 const exportDay=()=>downloadExcel(dayRows.map(x=>({الرقم:x.e.code,الاسم:x.e.name,التاريخ:date,أول_بصمة:x.first||'—',آخر_بصمة:x.last||'—',عدد_البصمات:x.count,الحالة:x.status,بصمة_واحدة:x.single?'نعم':'',التأخير:x.late?'متأخر':''})),'attendance-'+date+'.xlsx')
 const exportMonthSummary=()=>downloadExcel(monthMatrix.map(x=>({الرقم:x.e.code,الاسم:x.e.name,أيام_العمل:x.workdays,حضور:x.present,غياب:x.absent,'بصمة_واحدة':x.single,إجازات:x.leaveDays,جمع:x.offDays,عطلات_رسمية:x.holidayDays})),'attendance-summary-'+month+'.xlsx')
 const exportMatrix=()=>{
   const rows=monthMatrix.map(x=>{
     const row:any={الرقم:x.e.code,الاسم:x.e.name}
     x.cells.forEach(cell=>row[cell.date]=cell.value+(cell.first?(' '+cell.first+(cell.last?' - '+cell.last:'')):''));return row
   })
   downloadExcel(rows,'attendance-matrix-'+month+'.xlsx')
 }
 return <><PageActions title="الحضور والانصراف" text="استيراد البصمة وتحويل الحركات إلى حضور وغياب وأول وآخر بصمة" action="📥 استيراد Excel" onClick={()=>input.current?.click()}/><input ref={input} hidden type="file" accept=".xlsx,.xls,.csv" onChange={importFile}/>
 <div className="toolbar"><input placeholder="بحث بالاسم أو الكود..." value={q} onChange={e=>setQ(e.target.value)}/><label>اليوم <input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><button className="view-btn" onClick={exportDay}>تصدير اليوم</button><label>الشهر <input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></label><button className="view-btn" onClick={exportMonthSummary}>ملخص الشهر</button><button className="view-btn" onClick={exportMatrix}>مصفوفة الشهر</button></div>
 <section className="panel table-panel"><TableWrap><table><thead><tr><th>الكود</th><th>الاسم</th><th>أول بصمة</th><th>آخر بصمة</th><th>البصمات</th><th>الحالة</th><th>التأخير</th></tr></thead><tbody>{filteredDay.length?filteredDay.map(x=><tr key={x.e.id}><td>{x.e.code}</td><td>{x.e.name}</td><td>{x.first||'—'}</td><td>{x.last||'—'}</td><td>{x.count}</td><td><span className={x.status==='غياب'?'badge absent':'badge'}>{x.status}</span></td><td>{x.late?'متأخر':''}</td></tr>):<EmptyRow col={7} text="لا توجد بيانات لهذا اليوم."/>}</tbody></table></TableWrap></section>
 <section className="panel table-panel"><div className="panel-header"><div><h2>مصفوفة الحضور الشهرية</h2><p>كل موظف في صف، وكل يوم في عمود. تشمل الحضور والغياب والبصمة الواحدة والجمعة والعطلات والإجازات.</p></div></div><TableWrap><table className="monthly-matrix"><thead><tr><th>الرقم</th><th>الاسم</th>{monthDays.map(d=><th key={d}>{Number(d.slice(-2))}</th>)}</tr></thead><tbody>{monthMatrix.map(x=><tr key={x.e.id}><td>{x.e.code}</td><td><b>{x.e.name}</b></td>{x.cells.map(c=><td key={c.date} title={c.first?('أول: '+c.first+' | آخر: '+(c.last||'—')):c.value}>{c.value==='حاضر'?'✓':c.value==='بصمة واحدة'?'1':c.value==='غياب'?'غ':c.value==='إجازة'?'إ':c.value==='جمعة'?'ج':'ع'}</td>)}</tr>)}{!monthMatrix.length&&<EmptyRow col={monthDays.length+2} text="أضف الموظفين أولاً."/>}</tbody></table></TableWrap></section>
 <section className="stats"><Stat icon="✓" label="حضور الشهر" value={monthMatrix.reduce((a,x)=>a+x.present,0)}/><Stat icon="✕" label="غياب الشهر" value={monthMatrix.reduce((a,x)=>a+x.absent,0)}/><Stat icon="1" label="بصمة واحدة" value={monthMatrix.reduce((a,x)=>a+x.single,0)}/><Stat icon="🏖️" label="إجازات معتمدة" value={monthMatrix.reduce((a,x)=>a+x.leaveDays,0)}/></section>
 </>}

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

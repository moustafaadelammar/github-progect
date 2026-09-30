import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'

type Employee={id:number;code:string;name:string;department:string;job:string;grade?:string}
type Center={id:number;name:string}
type Week={id:number;centerId:number;start:string;groups:[string[],string[],string[],string[]];manual?:boolean}

const KEY='hr_shift_rosters_v1'
const CENTERS_KEY='hr_shift_centers_v1'
const DAYS=['السبت','الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة']
const pad=(n:number)=>String(n).padStart(2,'0')
const iso=(d:Date)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
const dateFrom=(s:string)=>new Date(s+'T00:00:00')
const saturdayOf=(s:string)=>{const d=dateFrom(s);const day=d.getDay();d.setDate(d.getDate()-((day+1)%7));return iso(d)}
const addDays=(s:string,n:number)=>{const d=dateFrom(s);d.setDate(d.getDate()+n);return iso(d)}
const addWeeks=(s:string,n:number)=>addDays(s,n*7)
const uid=()=>Date.now()+Math.floor(Math.random()*1000)
const read=<T,>(k:string,f:T):T=>{try{const x=localStorage.getItem(k);return x?JSON.parse(x) as T:f}catch{return f}}

function previewXlsx(rows:unknown[],name:string){
 const ws=XLSX.utils.json_to_sheet(rows);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Report')
 const html=XLSX.utils.sheet_to_html(ws)
 const bytes=XLSX.write(wb,{bookType:'xlsx',type:'array'});const blob=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});const url=URL.createObjectURL(blob)
 const w=window.open('','_blank','width=1200,height=800');if(!w){alert('المتصفح منع نافذة المعاينة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.');return}
 w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>معاينة ${name}</title><style>body{font-family:Tahoma,Arial;padding:20px;background:#f5f7fb;color:#172033}h2{margin-top:0}.bar{display:flex;gap:10px;align-items:center;justify-content:space-between;margin-bottom:16px}button{padding:10px 16px;border:0;border-radius:8px;background:#1769e0;color:#fff;cursor:pointer}table{border-collapse:collapse;background:#fff;width:100%;font-size:13px}td,th{border:1px solid #dbe2ea;padding:7px;white-space:nowrap}th{background:#eef4fb}</style></head><body><div class="bar"><h2>معاينة الملف: ${name}</h2><button id="download">⬇ تحميل Excel</button></div>${html}<script>document.getElementById('download').onclick=function(){const a=document.createElement('a');a.href='${url}';a.download='${name}';a.click()}</script></body></html>`);w.document.close()
}

function weekLabel(start:string){return `${start} → ${addDays(start,6)}`}
function monthWeeks(month:string){
 const [y,m]=month.split('-').map(Number);const first=new Date(y,m-1,1);const start=saturdayOf(iso(first));const out:string[]=[]
 for(let i=0;i<6;i++){const s=addWeeks(start,i);if(s<=`${y}-${pad(m)}-31`||i===0)out.push(s)}
 return out.filter(s=>dateFrom(s).getMonth()<=m-1||dateFrom(addDays(s,6)).getMonth()===m-1)
}

export default function Shifts({employees}:{employees:Employee[]}){
 const [centers,setCenters]=useState<Center[]>(()=>read(CENTERS_KEY,[]))
 const [weeks,setWeeks]=useState<Week[]>(()=>read(KEY,[]))
 const [centerId,setCenterId]=useState<number|null>(null)
 const [month,setMonth]=useState(new Date().toISOString().slice(0,7))
 const [weekStart,setWeekStart]=useState(saturdayOf(new Date().toISOString().slice(0,10)))
 const [activeWeek,setActiveWeek]=useState('')
 const [centerName,setCenterName]=useState('')
 const [group,setGroup]=useState<string[]>([])
 const [selectedGroup,setSelectedGroup]=useState(0)
 const [search,setSearch]=useState('')
 const [previewMonth,setPreviewMonth]=useState(month)
 const [manualAbsent,setManualAbsent]=useState<Record<string,string>>(()=>read('hr_shift_absence_notes',{}))
 useEffect(()=>localStorage.setItem(CENTERS_KEY,JSON.stringify(centers)),[centers])
 useEffect(()=>{localStorage.setItem(KEY,JSON.stringify(weeks));window.dispatchEvent(new Event('hr-shifts-updated'))},[weeks])
 useEffect(()=>localStorage.setItem('hr_shift_absence_notes',JSON.stringify(manualAbsent)),[manualAbsent])
 useEffect(()=>{if(centerId===null&&centers[0])setCenterId(centers[0].id)},[centers,centerId])
 const currentCenter=centers.find(x=>x.id===centerId)
 const currentWeeks=useMemo(()=>weeks.filter(x=>x.centerId===centerId).sort((a,b)=>a.start.localeCompare(b.start)),[weeks,centerId])
 const employeesBySearch=employees.filter(e=>(e.name+' '+e.code+' '+e.job+' '+e.department).toLowerCase().includes(search.toLowerCase()))
 const current=weeks.find(x=>x.centerId===centerId&&x.start===activeWeek)
 function createCenter(){const name=centerName.trim();if(!name)return alert('اكتب اسم المقر');const c={id:uid(),name};setCenters(x=>[...x,c]);setCenterId(c.id);setCenterName('')}
 function getBaseGroups():[string[],string[],string[],string[]]{return [[],[],[],[]]}
 function ensureWeek(start:string,source?:Week){if(centerId===null)return;const existing=weeks.find(x=>x.centerId===centerId&&x.start===start);if(existing){setActiveWeek(start);return}
   const groups=source?source.groups.map(g=>[...g]) as [string[],string[],string[],string[]]:getBaseGroups();const w={id:uid(),centerId,start,groups};setWeeks(x=>[...x,w]);setActiveWeek(start)
 }
 function saveWeek(){if(!centerId)return;const clean=group.filter(Boolean);setWeeks(xs=>xs.map(w=>w.id===activeWeekObj()?.id?{...w,groups:w.groups.map((g,i)=>i===selectedGroup?clean:g) as [string[],string[],string[],string[]],manual:true}:w));setGroup([])}
 function activeWeekObj(){return currentWeeks.find(w=>w.start===activeWeek)}
 function selectWeek(s:string){setActiveWeek(s);const w=currentWeeks.find(x=>x.start===s);setGroup(w?.groups[selectedGroup]||[])}
 function addEmployeeToGroup(code:string){setGroup(g=>g.includes(code)?g.filter(x=>x!==code):[...g,code])}
 function generateYear(){if(!centerId)return alert('اختر المقر');const seed=currentWeeks.find(x=>x.start===weekStart);if(!seed)return alert('اضبط الأسبوع الأول ثم أنشئه أولاً وحدد الموظفين في الورديات الأربعة.');const generated:Week[]=[];for(let i=1;i<=52;i++){const start=addWeeks(seed.start,i);const groups=[seed.groups[3],seed.groups[0],seed.groups[1],seed.groups[2]].map(g=>[...g]) as [string[],string[],string[],string[]];generated.push({id:uid(),centerId,start,groups})}setWeeks(xs=>{const keys=new Set(xs.filter(w=>w.centerId===centerId).map(w=>w.start));return [...xs,...generated.filter(w=>!keys.has(w.start))]});alert('تم تدوير الورديات للأسبوع التالي حتى 52 أسبوعًا. ويمكن تعديل أي أسبوع منفردًا.')}
 function buildMonth(){if(!centerId)return;const seed=currentWeeks.find(x=>x.start===weekStart);if(!seed)return alert('أنشئ الأسبوع الأول وحدد الموظفين أولاً.');const starts=monthWeeks(month);const generated:Week[]=[];for(let i=0;i<starts.length;i++){const start=starts[i];if(i===0){generated.push({...seed,id:uid(),start,manual:seed.manual})}else{const groups=[seed.groups[(4-(i%4))%4],seed.groups[(1-i+4)%4],seed.groups[(2-i+4)%4],seed.groups[(3-i+4)%4]].map(g=>[...g]) as [string[],string[],string[],string[]];generated.push({id:uid(),centerId,start,groups})}}
 setWeeks(xs=>{const map=new Map(xs.filter(w=>w.centerId!==centerId).map(w=>[w.id,w]));xs.filter(w=>w.centerId===centerId).forEach(w=>{if(!starts.includes(w.start))map.set(w.id,w)});generated.forEach(w=>{const old=xs.find(x=>x.centerId===centerId&&x.start===w.start);map.set(old?.id||w.id,old?{...old,groups:w.groups}:w)});return [...map.values()]});alert('تم بناء الشهر من الأسبوع الأول مع تدوير الورديات.')}
 function setManualNote(code:string,date:string){const key=code+'|'+date;const note=prompt('ملاحظة الغياب / التعديل',manualAbsent[key]||'');if(note===null)return;setManualAbsent(x=>{const n={...x};if(note.trim())n[key]=note.trim();else delete n[key];return n})}
 function statement(){const [y,m]=previewMonth.split('-').map(Number);const days=new Date(y,m,0).getDate();const out:any[]=[];for(const e of employees){for(let d=1;d<=days;d++){const date=`${previewMonth}-${pad(d)}`;const day=new Date(date+'T00:00:00').getDay();if(day===5)continue;const w=currentWeeks.find(x=>date>=x.start&&date<=addDays(x.start,6));let shift='';if(w){const idx=w.groups.findIndex(g=>g.includes(e.code));shift=idx===0?'الأولى':idx===1?'الثانية':idx===2?'الثالثة':idx===3?'راحة':''}const note=manualAbsent[e.code+'|'+date]||'';if(note||shift)out.push({التاريخ:date,اليوم:DAYS[day===0?1:day],الرقم:e.code,الاسم:e.name,الوظيفة:e.job,المقر:currentCenter?.name||'',الوردية:shift||'—',الملاحظة:note||'—'})}}
 return out}
 const exportStatement=()=>previewXlsx(statement(),'بيان-الورديات-'+previewMonth+'.xlsx')
 const weeksForCenter=currentWeeks
 return <><div className="page-actions"><div><h2>الورادى</h2><p>توزيع الورديات الأسبوعي — الأسبوع من السبت إلى الجمعة — مع تدوير تلقائي وتعديل يدوي.</p></div><button className="primary-btn" onClick={exportStatement}>📄 بيان الشهر</button></div>
 <section className="stats"><div className="stat-card"><div className="stat-icon blue">🏢</div><div><span>المقرات</span><strong>{centers.length}</strong></div></div><div className="stat-card"><div className="stat-icon blue">📅</div><div><span>أسابيع المقر</span><strong>{weeksForCenter.length}</strong></div></div><div className="stat-card"><div className="stat-icon blue">👥</div><div><span>الموظفون</span><strong>{employees.length}</strong></div></div><div className="stat-card"><div className="stat-icon blue">🔄</div><div><span>نظام التدوير</span><strong>4 حالات</strong></div></div></section>
 <section className="panel"><div className="panel-header"><div><h3>المقرات</h3><p>أضف كل مقر مرة واحدة ثم كوّن وردياته.</p></div></div><div className="toolbar"><input value={centerName} onChange={e=>setCenterName(e.target.value)} placeholder="اسم المقر"/><button className="primary-btn" onClick={createCenter}>＋ إضافة مقر</button><select value={centerId??''} onChange={e=>setCenterId(Number(e.target.value)||null)}><option value="">اختر المقر</option>{centers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div></section>
 {currentCenter&&<><section className="panel"><div className="panel-header"><div><h3>إعداد الأسبوع الأول</h3><p>الأسبوع يبدأ السبت وينتهي الجمعة. ضع الموظفين في الأولى والثانية والثالثة والراحة.</p></div></div><div className="toolbar"><label>بداية الأسبوع <input type="date" value={weekStart} onChange={e=>setWeekStart(saturdayOf(e.target.value))}/></label><button className="primary-btn" onClick={()=>ensureWeek(weekStart)}>＋ إنشاء الأسبوع</button><label>الشهر<input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></label><button className="view-btn" onClick={buildMonth}>⚙ بناء الشهر</button><button className="view-btn" onClick={generateYear}>🔄 تدوير 52 أسبوع</button></div></section>
 <section className="panel"><div className="panel-header"><div><h3>اختيار موظفي الأسبوع {activeWeek?weekLabel(activeWeek):''}</h3><p>المحددون في المجموعة الحالية يظهرون بعلامة ✓. الموظف يمكن وضعه في مجموعة واحدة فقط.</p></div></div><div className="tabs">{['الأولى','الثانية','الثالثة','راحة'].map((x,i)=><button key={x} className={selectedGroup===i?'active':''} onClick={()=>{setSelectedGroup(i);setGroup(activeWeekObj()?.groups[i]||[])}}>{x} ({activeWeekObj()?.groups[i].length||0})</button>)}</div><div className="toolbar"><input placeholder="بحث بالاسم أو الرقم أو الوظيفة" value={search} onChange={e=>setSearch(e.target.value)}/><button className="primary-btn" disabled={!activeWeek} onClick={saveWeek}>💾 حفظ المجموعة</button></div><TableWrap><table><thead><tr><th>اختيار</th><th>الرقم</th><th>الاسم</th><th>الوظيفة</th><th>القسم</th></tr></thead><tbody>{employeesBySearch.map(e=>{const checked=group.includes(e.code);return <tr key={e.id}><td><input type="checkbox" checked={checked} disabled={!activeWeek} onChange={()=>addEmployeeToGroup(e.code)}/></td><td>{e.code}</td><td>{e.name}</td><td>{e.job||'—'}</td><td>{e.department}</td></tr>})}</tbody></table></TableWrap></section>
 <section className="panel table-panel"><div className="panel-header"><div><h3>الأسابيع المسجلة</h3><p>يمكن فتح أي أسبوع وتعديل أي وردية دون إعادة بناء باقي الجدول.</p></div></div><TableWrap><table><thead><tr><th>الأسبوع</th><th>الأولى</th><th>الثانية</th><th>الثالثة</th><th>راحة</th><th>إجراء</th></tr></thead><tbody>{weeksForCenter.map(w=><tr key={w.id}><td>{weekLabel(w.start)}</td>{w.groups.map((g,i)=><td key={i}>{g.length?g.map(code=>employees.find(e=>e.code===code)?.name||code).join('، '):'—'}</td>)}<td><button className="view-btn" onClick={()=>selectWeek(w.start)}>تعديل</button></td></tr>)}</tbody></table></TableWrap></section>
 <section className="panel"><div className="panel-header"><div><h3>بيان الشهر والغياب</h3><p>يعرض التواريخ الفعلية والوردية والملاحظات، مع معاينة قبل تحميل Excel.</p></div></div><div className="toolbar"><input type="month" value={previewMonth} onChange={e=>setPreviewMonth(e.target.value)}/><button className="primary-btn" onClick={exportStatement}>👁 معاينة البيان ثم التحميل</button></div><TableWrap><table><thead><tr><th>التاريخ</th><th>اليوم</th><th>الرقم</th><th>الموظف</th><th>الوظيفة</th><th>الوردية</th><th>الملاحظة</th></tr></thead><tbody>{statement().slice(0,200).map((r,i)=><tr key={i}><td>{r.التاريخ}</td><td>{r.اليوم}</td><td>{r.الرقم}</td><td>{r.الاسم}</td><td>{r.الوظيفة||'—'}</td><td>{r.الوردية}</td><td>{r.الملاحظة}</td></tr>)}{!statement().length&&<tr><td colSpan={7}>لا توجد بيانات للبيان في الشهر المحدد.</td></tr>}</tbody></table></TableWrap></section></>}
 <section className="panel"><h3>قاعدة التدوير</h3><p>المجموعة الأولى تنتقل للثانية، والثانية للثالثة، والثالثة للراحة، والراحة للأولى كل أسبوع. أي أسبوع تم تعديله يدويًا يحتفظ بتعديله.</p></section></>}

import {useMemo,useState} from 'react'
type Employee={id:number;code:string;name:string;department:string;job:string;grade?:string}
type Leave={id:number;employeeId:number;type:string;from:string;to:string;days:number;status:string;note:string}
type LeaveBalance={employeeId:number;year:string;annual:number;casual:number}
type FormsProps={employees:Employee[];leaves:Leave[];balances:LeaveBalance[]}

const days=(a:string,b:string)=>{if(!a||!b)return 0;const x=new Date(a+'T00:00:00'),y=new Date(b+'T00:00:00');return Math.max(1,Math.floor((y.getTime()-x.getTime())/86400000)+1)}
const fmt=(s:string)=>s?new Date(s+'T00:00:00').toLocaleDateString('ar-EG'):''
const today=()=>new Date().toISOString().slice(0,10)

export default function Forms({employees,leaves,balances}:FormsProps){
 const [type,setType]=useState<'اعتيادية'|'عارضة'>('اعتيادية')
 const [employeeId,setEmployeeId]=useState(employees[0]?.id||0)
 const [from,setFrom]=useState(today()),[to,setTo]=useState(today()),[edit,setEdit]=useState(false)
 const [manager,setManager]=useState(''),[authorized,setAuthorized]=useState(''),[previous,setPrevious]=useState(0),[issued,setIssued]=useState(today())
 const emp=employees.find(e=>e.id===employeeId)
 const year=from.slice(0,4)
 const bal=balances.find(x=>x.employeeId===employeeId&&x.year===year)||{employeeId,year,annual:30,casual:7}
 const leaveType=type==='اعتيادية'?'اعتيادية':'عارضة'
 const granted=useMemo(()=>leaves.filter(x=>x.employeeId===employeeId&&x.status==='معتمدة'&&x.type===leaveType&&x.from<=year+'-12-31'&&x.to>=year+'-01-01').reduce((n,x)=>n+days(x.from,x.to),0),[leaves,employeeId,leaveType,year])
 const entitled=type==='اعتيادية'?bal.annual:bal.casual
 const remaining=Math.max(0,entitled-granted)
 const duration=days(from,to)
 return <section className="forms-page">
  <div className="panel">
   <div className="panel-header"><div><h2>النماذج الرسمية</h2><p>نماذج طلبات الإجازات طبقاً للنماذج الورقية المرفوعة من الإدارة.</p></div></div>
   <div className="form-grid">
    <label>نوع النموذج<select value={type} onChange={e=>setType(e.target.value as 'اعتيادية'|'عارضة')}><option value="اعتيادية">طلب إجازة اعتيادية</option><option value="عارضة">طلب إجازة عارضة</option></select></label>
    <label>الموظف<select value={employeeId} onChange={e=>setEmployeeId(Number(e.target.value))}>{employees.map(e=><option key={e.id} value={e.id}>{e.name} — {e.code}</option>)}</select></label>
    <label>من<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label>
    <label>إلى<input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label>
    <label>تحريراً في<input type="date" value={issued} onChange={e=>setIssued(e.target.value)}/></label>
    <label>رأي الرئيس المباشر<input value={manager} onChange={e=>setManager(e.target.value)} placeholder="يترك فارغاً للتوقيع اليدوي"/></label>
    <label>اعتماد المدير المختص<input value={authorized} onChange={e=>setAuthorized(e.target.value)} placeholder="يترك فارغاً للتوقيع اليدوي"/></label>
    {type==='اعتيادية'&&<label>رصيد سنوات سابقة<input type="number" min="0" value={previous} onChange={e=>setPrevious(Number(e.target.value)||0)}/></label>}
   </div>
   <div className="form-actions"><button className="primary-btn" onClick={()=>setEdit(true)}>👁️ معاينة النموذج</button><span className="muted">مدة الإجازة: {duration} يوم — الرصيد المتبقي: {remaining} يوم</span></div>
  </div>
  {edit&&<div className="modal-backdrop"><div className="modal forms-modal"><div className="modal-head"><h2>معاينة قبل الطباعة</h2><button onClick={()=>setEdit(false)}>×</button></div>
   <div className="print-toolbar"><button className="primary-btn" onClick={()=>window.print()}>🖨️ طباعة</button><button className="secondary-btn" onClick={()=>setEdit(false)}>إغلاق</button></div>
   <div className="print-area">
    <div className="print-header"><div className="print-logo">م</div><div><strong>شركة مصر الوسطى لتوزيع الكهرباء</strong><span>قطاع بني سويف</span><span>إدارة ____________</span></div></div>
    <h1>طلب إجازة {type}</h1>
    <div className="print-fields">
      <div><b>الاسم:</b><span>{emp?.name||''}</span></div><div><b>الوظيفة:</b><span>{emp?.job||emp?.department||''}</span></div>
      <div><b>جهة العمل:</b><span>شركة مصر الوسطى لتوزيع الكهرباء — قطاع بني سويف</span></div><div><b>مدة الإجازة:</b><span>{duration} يوم</span></div>
      <div><b>من:</b><span>{fmt(from)}</span></div><div><b>إلى:</b><span>{fmt(to)}</span></div>
      <div><b>تحريراً في:</b><span>{fmt(issued)}</span></div><div><b>توقيع طالب الإجازة:</b><span className="blank-sign"></span></div>
    </div>
    {type==='اعتيادية'&&<p className="pledge">أشهد بأنني ألتزم بتعليمات قسم الإجازات.</p>}
    <h3>بيانات تستوفى بمعرفة قسم الإجازات</h3>
    <table className="leave-form-table"><thead><tr>{type==='اعتيادية'&&<th>رصيد سنوات سابقة</th>}<th>الرصيد المتبقي من السنة الحالية</th><th>الإجازة السابق منحها في السنة الحالية</th><th>الإجازة المستحقة عن السنة الحالية</th></tr></thead>
     <tbody><tr>{type==='اعتيادية'&&<td>{previous}</td>}<td>{remaining}</td><td>{granted}</td><td>{entitled}</td></tr></tbody></table>
    <table className="approval-table"><tbody><tr><th>رأي الرئيس المباشر</th><th>اعتماد المدير المختص</th></tr><tr><td>{manager||'____________________________'}</td><td>{authorized||'____________________________'}</td></tr></tbody></table>
   </div>
  </div></div>}
 </section>
}

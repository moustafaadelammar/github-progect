import { useEffect, useState } from 'react'
import './App.css'

type Section = 'dashboard' | 'employees' | 'attendance' | 'leaves' | 'medical' | 'missions' | 'penalties' | 'reports' | 'settings'
type Employee = { id: number; code: string; name: string; department: string; job: string; phone: string; status: string }

const menu: { id: Section; label: string; icon: string }[] = [
  { id:'dashboard',label:'الرئيسية',icon:'🏠' },{ id:'employees',label:'الموظفين',icon:'👥' },
  { id:'attendance',label:'الحضور والانصراف',icon:'🕘' },{ id:'leaves',label:'الإجازات',icon:'🏖️' },
  { id:'medical',label:'الخدمات الطبية',icon:'🏥' },{ id:'missions',label:'المأموريات',icon:'📋' },
  { id:'penalties',label:'الجزاءات',icon:'⚠️' },{ id:'reports',label:'التقارير',icon:'📊' },
  { id:'settings',label:'الإعدادات',icon:'⚙️' },
]
const seed: Employee[] = []

function App() {
  const [section,setSection]=useState<Section>('dashboard')
  const [employees,setEmployees]=useState<Employee[]>(()=>JSON.parse(localStorage.getItem('hr_employees')||'[]'))
  useEffect(()=>localStorage.setItem('hr_employees',JSON.stringify(employees)),[employees])
  const current=menu.find(x=>x.id===section)
  return <div className="app" dir="rtl">
    <aside className="sidebar"><div className="brand"><div className="brand-icon">HR</div><div><h2>الشئون الإدارية</h2><span>نظام إدارة الشركة</span></div></div>
      <nav>{menu.map(x=><button key={x.id} className={section===x.id?'active':''} onClick={()=>setSection(x.id)}><span>{x.icon}</span>{x.label}</button>)}</nav>
      <div className="user-box"><div className="avatar">م</div><div><strong>مسؤول النظام</strong><span>Administrator</span></div></div>
    </aside>
    <main className="main"><header className="topbar"><div><h1>{current?.label}</h1><p>نظام مستقل يعمل محلياً ويحفظ البيانات على هذا الجهاز</p></div><div className="top-actions"><button className="notification">🔔</button><div className="date">السبت، 26 سبتمبر 2026</div></div></header>
      {section==='dashboard'&&<Dashboard employees={employees} go={setSection}/>}
      {section==='employees'&&<Employees employees={employees} setEmployees={setEmployees}/>}
      {section==='medical'&&<Medical employees={employees}/>}
      {section==='attendance'&&<Simple title="الحضور والانصراف" icon="🕘" text="هنا سيتم استيراد ملفات البصمة وإنشاء تقرير الحضور والغياب والتأخير."/>}
      {section==='leaves'&&<Simple title="الإجازات" icon="🏖️" text="إدارة طلبات الإجازات والأرصدة والاعتمادات."/>}
      {section==='missions'&&<Simple title="المأموريات" icon="📋" text="تسجيل المأموريات ومتابعة حالتها واعتمادها."/>}
      {section==='penalties'&&<Simple title="الجزاءات" icon="⚠️" text="تسجيل الجزاءات والتنبيهات والقرارات الإدارية."/>}
      {section==='reports'&&<Simple title="التقارير" icon="📊" text="مركز التقارير والتصدير إلى Excel وPDF."/>}
      {section==='settings'&&<Simple title="الإعدادات" icon="⚙️" text="إعدادات الشركة والأقسام والصلاحيات والنسخ الاحتياطي."/>}
    </main>
  </div>
}

function Dashboard({employees,go}:{employees:Employee[];go:(s:Section)=>void}){
 return <><section className="stats">
  <Stat icon="👥" label="إجمالي الموظفين" value={employees.length}/><Stat icon="✓" label="الحضور اليوم" value="0"/><Stat icon="✕" label="الغياب اليوم" value="0"/><Stat icon="⏰" label="المتأخرون" value="0"/>
 </section><section className="content-grid"><div className="panel"><div className="panel-header"><div><h2>الحضور والانصراف اليوم</h2><p>ملخص حركة الموظفين</p></div></div><div className="empty-state"><div className="empty-icon">🕘</div><h3>لا توجد بيانات حضور</h3><p>قسم الحضور جاهز لاستيراد ملفات البصمة.</p><button className="primary-btn" onClick={()=>go('attendance')}>فتح الحضور</button></div></div>
 <div className="panel"><div className="panel-header"><div><h2>الخدمات الطبية</h2><p>ملفات الموظفين والخدمات العلاجية</p></div></div><div className="medical-mini"><div><span>الموظفون</span><strong>{employees.length}</strong></div><div><span>طلبات العلاج</span><strong>0</strong></div><div><span>إجازات مرضية</span><strong>0</strong></div></div><button className="primary-btn" onClick={()=>go('medical')}>فتح الخدمات الطبية</button></div></section>
 <section className="quick-actions"><h2>إجراءات سريعة</h2><div className="actions"><button onClick={()=>go('employees')}><span>➕</span>إضافة موظف</button><button onClick={()=>go('attendance')}><span>📥</span>استيراد البصمة</button><button onClick={()=>go('leaves')}><span>🏖️</span>تسجيل إجازة</button><button onClick={()=>go('medical')}><span>🏥</span>خدمة طبية</button></div></section></>
}
function Stat({icon,label,value}:{icon:string;label:string;value:string|number}){return <div className="stat-card"><div className="stat-icon blue">{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>}

function Employees({employees,setEmployees}:{employees:Employee[];setEmployees:React.Dispatch<React.SetStateAction<Employee[]>>}){
 const [open,setOpen]=useState(false),[q,setQ]=useState(''),[form,setForm]=useState({code:'',name:'',department:'',job:'',phone:''})
 const filtered=employees.filter(e=>(e.name+e.code+e.department).includes(q))
 function save(){if(!form.name.trim())return;setEmployees(x=>[...x,{...form,id:Date.now(),status:'على رأس العمل'}]);setForm({code:'',name:'',department:'',job:'',phone:''});setOpen(false)}
 return <><div className="page-actions"><div><h2>الموظفين</h2><p>قاعدة بيانات الموظفين المحلية</p></div><button className="primary-btn" onClick={()=>setOpen(true)}>＋ إضافة موظف</button></div>
 <div className="toolbar"><input placeholder="بحث بالاسم أو الرقم أو القسم..." value={q} onChange={e=>setQ(e.target.value)}/><span>عدد الموظفين: <b>{employees.length}</b></span></div>
 <section className="panel table-panel"><table><thead><tr><th>الرقم الوظيفي</th><th>الاسم</th><th>القسم</th><th>الوظيفة</th><th>الهاتف</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>{filtered.length?filtered.map(e=><tr key={e.id}><td>{e.code}</td><td><b>{e.name}</b></td><td>{e.department}</td><td>{e.job}</td><td>{e.phone}</td><td><span className="badge">{e.status}</span></td><td><button className="danger-btn" onClick={()=>setEmployees(x=>x.filter(a=>a.id!==e.id))}>حذف</button></td></tr>):<tr><td colSpan={7}><div className="table-empty">لا توجد موظفين. ابدأ بإضافة أول موظف.</div></td></tr>}</tbody></table></section>
 {open&&<Modal title="إضافة موظف" close={()=>setOpen(false)}><div className="form-grid">{[['code','الرقم الوظيفي'],['name','اسم الموظف'],['department','القسم'],['job','الوظيفة'],['phone','رقم الهاتف']].map(([k,l])=><label key={k}>{l}<input value={form[k as keyof typeof form]} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}</div><button className="primary-btn" onClick={save}>حفظ الموظف</button></Modal>}</>
}

function Medical({employees}:{employees:Employee[]}){const [tab,setTab]=useState('overview');const tabs=[['overview','نظرة عامة'],['files','الملفات الطبية'],['exams','الفحوصات'],['sick','الإجازات المرضية'],['treatment','طلبات العلاج'],['insurance','التأمين']];return <div className="medical-page"><section className="medical-hero"><div><div className="medical-title">🏥 الخدمات الطبية</div><h2>إدارة الرعاية الطبية للموظفين</h2><p>كل البيانات محفوظة محلياً على جهازك.</p></div><button className="primary-btn">＋ إضافة طلب طبي</button></section><div className="medical-tabs">{tabs.map(x=><button className={tab===x[0]?'active':''} onClick={()=>setTab(x[0])} key={x[0]}>{x[1]}</button>)}</div>{tab==='overview'?<><section className="stats"><Stat icon="👤" label="الملفات الطبية" value={employees.length}/><Stat icon="🩺" label="الفحوصات المستحقة" value="0"/><Stat icon="📝" label="طلبات العلاج" value="0"/><Stat icon="🏖️" label="إجازات مرضية" value="0"/></section><section className="panel privacy-panel"><div className="privacy-icon">🔐</div><h2>خصوصية البيانات الطبية</h2><p>هذه البيانات حساسة، وسيتم لاحقاً إضافة مستخدمين وصلاحيات وتسجيل عمليات الوصول.</p></section></>:<section className="panel table-panel"><div className="panel-header"><div><h2>{tabs.find(x=>x[0]===tab)?.[1]}</h2><p>لا توجد بيانات مسجلة حالياً</p></div><button className="primary-btn">＋ إضافة جديد</button></div><table><thead><tr><th>الموظف</th><th>التاريخ</th><th>النوع</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody><tr><td colSpan={5}><div className="table-empty">لا توجد بيانات لعرضها</div></td></tr></tbody></table></section>}</div>}

function Modal({title,close,children}:{title:string;close:()=>void;children:React.ReactNode}){return <div className="modal-backdrop"><div className="modal"><div className="modal-head"><h2>{title}</h2><button onClick={close}>×</button></div>{children}</div></div>}
function Simple({title,icon,text}:{title:string;icon:string;text:string}){return <section className="panel placeholder"><div className="empty-icon">{icon}</div><h2>{title}</h2><p>{text}</p><span className="badge">يعمل محلياً — بدون قاعدة بيانات خارجية</span></section>}
export default App
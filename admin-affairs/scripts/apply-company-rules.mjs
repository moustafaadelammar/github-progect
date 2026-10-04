import fs from 'node:fs'
import path from 'node:path'

const appPath = path.resolve(process.cwd(), 'src', 'App.tsx')
if (!fs.existsSync(appPath)) {
  console.error('[RULES] App.tsx not found:', appPath)
  process.exit(1)
}

let source = fs.readFileSync(appPath, 'utf8')
const original = source
const changes = []

function replaceOnce(find, replacement, label) {
  if (!source.includes(find)) {
    if (source.includes(label)) return
    throw new Error(`[RULES] Expected code not found: ${label}`)
  }
  source = source.replace(find, replacement)
  changes.push(label)
}

function replaceAll(find, replacement, label) {
  const count = source.split(find).length - 1
  if (!count) throw new Error(`[RULES] Expected code not found: ${label}`)
  source = source.split(find).join(replacement)
  changes.push(`${label} (${count})`)
}

// Company rule: shift technicians (فني/عامل ورادى) have ledger/manual attendance.
// We reuse the existing "مجالس" attendance-exempt rule so all attendance/report views agree.
replaceAll(
  "/مجالس/.test(String(e.job||''))||/مجالس/.test(String(e.department||''))",
  "/مجالس/.test(String(e.job||''))||/مجالس/.test(String(e.department||''))||/ورادى|ورادي/.test(String(e.job||''))",
  'shift-technician attendance rule'
)

// Dashboard: fingerprint punches from shift technicians must not create lateness alerts.
replaceOnce(
  "!isCollector(employees.find(e=>e.code===x.code)||({} as Employee))&&x.time>lateAfter",
  "!isCollector(employees.find(e=>e.code===x.code)||({} as Employee))&&!isCouncilTech(employees.find(e=>e.code===x.code)||({} as Employee))&&x.time>lateAfter",
  'dashboard shift-tech late exclusion'
)

// Employee profile: ledger attendance is present even without a fingerprint; fingerprint timing is informational only.
replaceOnce(
  "lateFlag=!!first&&first>lateAfter&&!leave&&!holiday&&!off",
  "lateFlag=!/ورادى|ورادي/.test(String(e.job||''))&&!!first&&first>lateAfter&&!leave&&!holiday&&!off",
  'employee profile shift-tech late exclusion'
)
replaceOnce(
  "status=ps.length?'حاضر':leave?'إجازة':holiday?'عطلة رسمية':off?'جمعة':'غياب'",
  "status=/ورادى|ورادي/.test(String(e.job||''))?'حاضر':ps.length?'حاضر':leave?'إجازة':holiday?'عطلة رسمية':off?'جمعة':'غياب'",
  'employee profile shift-tech present status'
)

// Attendance monthly summary: a shift technician is present even when there is no punch.
replaceOnce(
  "else if(ps.length){present++;if(ps.length===1)single++;const first=Number(ps[0].time.slice(0,2))*60+Number(ps[0].time.slice(3,5));if(first>threshold){late++;minutes+=first-threshold}}else absent++",
  "else if(isCouncilTech(e)||ps.length){present++;if(ps.length===1)single++;if(ps.length){const first=Number(ps[0].time.slice(0,2))*60+Number(ps[0].time.slice(3,5));if(first>threshold){late++;minutes+=first-threshold}}}else absent++",
  'attendance monthly shift-tech presence'
)

// Attendance monthly matrix/export: mark shift technicians as حاضر instead of غياب.
replaceOnce(
  "row['يوم '+d]=ps.length?(ps.length===1?'1':'✓'):(leave?'إ':holiday?'ع':off?'ج':'غ')",
  "row['يوم '+d]=ps.length?(ps.length===1?'1':'✓'):(leave?'إ':holiday?'ع':off?'ج':isCouncilTech(e)?'ح':'غ')",
  'attendance monthly matrix shift-tech status'
)

// Leaves: split the screen into two clear business branches: balances and settlements.
replaceOnce(
  "function Leaves({employees,rows,setRows,balances,setBalances}:{employees:Employee[];rows:Leave[];setRows:Dispatch<SetStateAction<Leave[]>>;balances:LeaveBalance[];setBalances:Dispatch<SetStateAction<LeaveBalance[]>>}){const [open,setOpen]=useState(false),[editBalance,setEditBalance]=useState<number|null>(null),[detail,setDetail]=useState<number|null>(null),[year,setYear]=useState(String(new Date().getFullYear())),[q,setQ]=useState('');",
  "function Leaves({employees,rows,setRows,balances,setBalances}:{employees:Employee[];rows:Leave[];setRows:Dispatch<SetStateAction<Leave[]>>;balances:LeaveBalance[];setBalances:Dispatch<SetStateAction<LeaveBalance[]>>}){const [open,setOpen]=useState(false),[editBalance,setEditBalance]=useState<number|null>(null),[detail,setDetail]=useState<number|null>(null),[year,setYear]=useState(String(new Date().getFullYear())),[q,setQ]=useState(''),[tab,setTab]=useState<'balances'|'settlements'>('balances');",
  'leave tabs state'
)
replaceOnce(
  "return <><PageActions title=\"الإجازات\" text=\"سجل الإجازات + أرصدة سنوية قابلة للتعديل لكل موظف\" action=\"＋ إضافة إجازة\" onClick={()=>setOpen(true)}/>",
  "return <><PageActions title=\"الإجازات\" text=\"إدارة أرصدة الإجازات وتسويات الغياب والإجازات في مسارين منفصلين.\" action=\"＋ إضافة إجازة\" onClick={()=>setOpen(true)}/><div className=\"tabs\"><button className={tab==='balances'?'active':''} onClick={()=>setTab('balances')}>🏖️ الأرصدة</button><button className={tab==='settlements'?'active':''} onClick={()=>setTab('settlements')}>🧾 التسويات</button></div>",
  'leave balances/settlements tabs'
)
replaceOnce(
  "<section className=\"stats\"><Stat icon=\"🏖️\" label=\"الموظفون\"",
  "<section className=\"stats\" style={{display:tab==='balances'?'grid':'none'}}><Stat icon=\"🏖️\" label=\"الموظفون\"",
  'leave balance stats tab'
)
replaceOnce(
  "<section className=\"panel\"><div className=\"toolbar\"><label>بحث الموظف",
  "<section className=\"panel\" style={{display:tab==='balances'?'block':'none'}}><div className=\"toolbar\"><label>بحث الموظف",
  'leave balance table tab'
)
replaceOnce(
  "<section className=\"panel table-panel\"><div className=\"panel-header\"><div><h2>سجل الإجازات</h2>",
  "<section className=\"panel table-panel\" style={{display:tab==='settlements'?'block':'none'}}><div className=\"panel-header\"><div><h2>تسويات الإجازات والغياب</h2>",
  'leave settlements tab'
)

if (source !== original) {
  fs.writeFileSync(appPath, source, 'utf8')
  console.log('[RULES] Applied company HR rules:')
  for (const item of changes) console.log('  -', item)
} else {
  console.log('[RULES] No changes needed; company rules are already applied.')
}

import fs from 'node:fs'
import path from 'node:path'

const appPath = path.resolve(process.cwd(), 'src', 'App.tsx')
if (!fs.existsSync(appPath)) {
  console.error('[REPAIR] App.tsx not found:', appPath)
  process.exit(1)
}

let source = fs.readFileSync(appPath, 'utf8')
const original = source
const changes = []

// 1) Remove accidental unified-diff markers without touching normal arithmetic.
const beforeLines = source.split(/\r?\n/)
source = beforeLines.filter(line => {
  const t = line.trimStart()
  if (/^[+-]\s*(?:function|const|let|type|interface|export|import|return|if|for|while|switch|try|catch|class|<)/.test(t)) {
    changes.push(`removed diff marker line: ${t.slice(0, 100)}`)
    return false
  }
  return true
}).join('\n')

// Generated one-line patches can leave a marker in the middle of the file.
// Remove it only when the next token is clearly a JSX/declaration boundary.
source = source.replace(/(^|[;}])\s*[+-]\s*(?=(?:<|const\b|let\b|type\b|function\b|return\b|if\b|for\b|while\b|switch\b|try\b|catch\b))/g, '$1')
source = source.replace(/(^|[>\]])\s*[+-]\s*(?=<)/g, '$1')

// 2) Fix malformed generated newline regexes such as split(/[\\\n,;]+/).
const badSplit = /split\(\/\[[^\]]*[\r\n][^\]]*\]\+\//g
if (badSplit.test(source)) {
  source = source.replace(badSplit, 'split(/[\\n,;]+/')
  changes.push('fixed malformed newline delimiter regex')
}

const knownBroken = "split(/[\\\\\\n,;]+/"
if (source.includes(knownBroken)) {
  source = source.replaceAll(knownBroken, 'split(/[\\n,;]+/')
  changes.push('fixed known broken holiday regex')
}

// 3) Employee operational status: خدمة / إجازة / معاش.
source = source.replace(
  /type FormEmployee=\{code:string;name:string;department:string;job:string;grade:string;(?!status:string;)/,
  'type FormEmployee={code:string;name:string;department:string;job:string;grade:string;status:string;'
)
source = source.replace(
  /const empty=\{code:'',name:'',department:'فني',job:'',grade:'',phone:/,
  "const empty={code:'',name:'',department:'فني',job:'',grade:'',status:'في الخدمة',phone:"
)
source = source.replace(
  /setEmployees\(xs=>\[\.\.\.xs,\{\.\.\.fixed,id:uid\(\),status:'على رأس العمل'\}\]\)/,
  "setEmployees(xs=>[...xs,{...fixed,id:uid(),status:form.status||'في الخدمة'}])"
)
if (!source.includes("value={form.status||'في الخدمة'}")) {
  source = source.replace(
    /(<label>الدرجة<input value=\{form\.grade\} onChange=\{e=>set\('grade',e\.target\.value\)\}\/><\/label>)/,
    "$1<label>حالة الموظف<select value={form.status||'في الخدمة'} onChange={e=>set('status',e.target.value)}><option>في الخدمة</option><option>إجازة</option><option>معاش</option></select></label>"
  )
  changes.push('added employee status selector')
}

// 4) Company attendance rule: shift technicians are considered present by register
// unless an approved absence/leave/mission/medical exception is explicitly recorded.
const councilExpr = "const isCouncilTech=(e:Employee)=>/مجالس/.test(String(e.job||''))||/مجالس/.test(String(e.department||''))"
const companyExpr = "const isCouncilTech=(e:Employee)=>/مجالس/.test(String(e.job||''))||/مجالس/.test(String(e.department||''))||/فني\\s*ورادى|فنى\\s*ورادى|عامل\\s*ورادى|ورادى|وردي/.test(String(e.job||''))"
if (source.includes(councilExpr)) {
  source = source.replaceAll(councilExpr, companyExpr)
  changes.push('applied shift-technician register attendance rule')
}

// 5) Leave ledger split: balance-backed leave vs settlements.
source = source.replace(
  /type Leave=\{id:number;employeeId:number;type:string;from:string;to:string;days:number;status:string;note:string\}/,
  'type Leave={id:number;employeeId:number;type:string;from:string;to:string;days:number;status:string;note:string;category?:\'الرصيد\'|\'تسويات\'}'
)
source = source.replace(
  /const empty=\{employeeId:employees\[0\]\?\.id\|\|0,type:'اعتيادية',from:today\(\),to:today\(\),days:1,status:'قيد المراجعة',note:''\}/,
  "const empty={employeeId:employees[0]?.id||0,type:'اعتيادية',from:today(),to:today(),days:1,status:'قيد المراجعة',note:'',category:'الرصيد' as const}"
)
source = source.replace(
  /const used=\(id:number,type:string\)=>rows\.filter\(x=>x\.employeeId===id&&x\.status==='معتمدة'&&x\.type===type\)/g,
  "const used=(id:number,type:string)=>rows.filter(x=>x.employeeId===id&&x.status==='معتمدة'&&x.category!=='تسويات'&&x.type===type)"
)
source = source.replace(
  /if\(x\.type!=='اعتيادية'&&x\.type!=='عارضة'\)\{/g,
  "if(x.category==='تسويات'||(x.type!=='اعتيادية'&&x.type!=='عارضة')){"
)
source = source.replace(
  /const available=\(type==='اعتيادية'\?b\.annual:b\.casual\);/g,
  "const available=(type==='اعتيادية'?b.annual:b.casual)-rows.filter(x=>x.employeeId===e.id&&x.status==='معتمدة'&&x.category!=='تسويات'&&x.type===leaveType).reduce((n,x)=>n+daysBetween(x.from,x.to),0);"
)
source = source.replace(
  /setLeaves\(xs=>\[\.\.\.xs,\{id:uid\(\),employeeId:e\.id,type:leaveType,from:date,to:date,days:1,status:'معتمدة',note:'من الحضور والانصراف'\}\]\)/g,
  "setLeaves(xs=>[...xs,{id:uid(),employeeId:e.id,type:leaveType,from:date,to:date,days:1,status:'معتمدة',note:'من الحضور والانصراف',category:'الرصيد'}])"
)

// Add the category selector to the leave form if absent.
if (!source.includes('value={f.category}')) {
  source = source.replace(
    /(<label>النوع<select value=\{f\.type\}[\s\S]*?<\/select><\/label>)/,
    "$1<label>نوع السجل<select value={f.category||'الرصيد'} onChange={e=>setF({...f,category:e.target.value as 'الرصيد'|'تسويات'})}><option value=\"الرصيد\">الرصيد</option><option value=\"تسويات\">تسويات</option></select></label>"
  )
  changes.push('added leave category selector')
}

source = source.replaceAll("status:'فعال'", "status:'في الخدمة'")

if (source !== original) fs.writeFileSync(appPath, source, 'utf8')
console.log('[REPAIR] Source repair completed.')
for (const change of changes) console.log('[REPAIR] ' + change)

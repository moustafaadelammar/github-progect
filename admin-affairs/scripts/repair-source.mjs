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

// Previous automated edits accidentally left unified-diff markers in the TSX source.
// Remove only markers that occur at the beginning of a line immediately before a
// declaration. Never touch normal + or - operators inside application code.
source = source.replace(/^\+(?=(?:function|const|let|type|interface|export|import)\b)/gm, '')
source = source.replace(/^-(?=(?:function|const|let|type|interface|export|import)\b)/gm, '')

// The employee profile supports three operational states requested by the company.
// Add the field to the form type if an earlier version does not have it.
source = source.replace(
  /type FormEmployee=\{code:string;name:string;department:string;job:string;grade:string;/,
  "type FormEmployee={code:string;name:string;department:string;job:string;grade:string;status:string;"
)

// Add a safe status selector to the employee form if it is not already present.
if (!source.includes('حالة الموظف') && source.includes("set('grade',e.target.value)")) {
  source = source.replace(
    /(<label>الدرجة<input value=\{form\.grade\} onChange=\{e=>set\('grade',e\.target\.value\)\}\/><\/label>)/,
    "$1<label>حالة الموظف<select value={form.status||'في الخدمة'} onChange={e=>set('status',e.target.value)}><option>في الخدمة</option><option>إجازة</option><option>معاش</option></select></label>"
  )
}

if (source !== original) {
  fs.writeFileSync(appPath, source, 'utf8')
  if (original.includes('+function Dashboard')) changes.push('removed accidental diff marker before Dashboard')
  if (original.includes('-function Dashboard')) changes.push('removed obsolete diff marker before Dashboard')
  if (original.includes('type FormEmployee={') && !original.includes('status:string')) changes.push('added employee status field')
  if (original.includes("set('grade',e.target.value)") && !original.includes('حالة الموظف')) changes.push('added employee status selector')
}

console.log('[REPAIR] Source repair completed.')
for (const change of changes) console.log('[REPAIR] '+change)

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

// Generated edits have occasionally left unified-diff markers in TSX. Remove
// marker prefixes only when they are at the beginning of a source line. This
// intentionally does not touch normal + / - operators inside application code.
const beforeLines = source.split(/\r?\n/)
source = beforeLines.filter(line => {
  const t = line.trimStart()
  if (/^[+-]\s*(?:function|const|let|type|interface|export|import|return|if|for|while|switch|try|catch|class|<)/.test(t)) {
    changes.push(`removed diff marker: ${t.slice(0, 80)}`)
    return false
  }
  return true
}).join('\n')

// Also remove an isolated diff marker before a JSX/source line when an older
// generated patch did not include a declaration keyword.
source = source.replace(/^\s*[+-](?=\s*<)/gm, '')

// The employee profile supports three operational states requested by the company.
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
  changes.push('added employee status selector')
}

if (source !== original) fs.writeFileSync(appPath, source, 'utf8')
console.log('[REPAIR] Source repair completed.')
for (const change of changes) console.log('[REPAIR] ' + change)

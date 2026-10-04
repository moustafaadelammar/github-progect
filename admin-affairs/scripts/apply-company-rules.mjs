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
const skipped = []

function replaceOnce(find, replacement, label) {
  const index = source.search(find)
  if (index === -1) {
    skipped.push(label)
    return false
  }
  const before = source
  source = source.replace(find, replacement)
  if (source !== before) changes.push(label)
  return true
}

function addIfMissing(needle, find, replacement, label) {
  if (source.includes(needle)) return false
  return replaceOnce(find, replacement, label)
}

// The company rule is intentionally idempotent: the updater must never fail just
// because an earlier UI refactor changed the exact text of a block. It applies a
// rule when the matching code is present and otherwise leaves the current source intact.

// فني/عامل الورادى يعمل بنظام الدفتر ويُعتبر حاضرًا افتراضيًا عند غياب البصمة.
if (!source.includes("/ورادى|ورادي/.test(String(e.job||''))") && !source.includes('isLedgerEmployee')) {
  replaceOnce(
    /const isCouncilTech=\(e:Employee\)=>\/مجالس\/.test\(String\(e\.job\|\|''\)\)\|\|\/مجالس\/.test\(String\(e\.department\|\|''\)\)/,
    "const isCouncilTech=(e:Employee)=>/مجالس/.test(String(e.job||''))||/مجالس/.test(String(e.department||''))||/ورادى|ورادي/.test(String(e.job||''))||/ورادى|ورادي/.test(String(e.department||''))",
    'shift-ledger helper'
  )
} else {
  skipped.push('shift-ledger helper already present')
}

// Exclude ledger employees from lateness alerts when the old dashboard expression exists.
replaceOnce(
  /!isCollector\(employees\.find\(e=>e\.code===x\.code\)\|\|\(\{\} as Employee\)\)&&x\.time>lateAfter/,
  "!isCollector(employees.find(e=>e.code===x.code)||({} as Employee))&&!isCouncilTech(employees.find(e=>e.code===x.code)||({} as Employee))&&x.time>lateAfter",
  'dashboard shift-ledger late exclusion'
)

// Employee profile: no late flag for ledger attendance.
replaceOnce(
  /lateFlag=!!first&&first>lateAfter&&!leave&&!holiday&&!off/,
  "lateFlag=!\/ورادى|ورادي\/.test(String(e.job||''))&&!!first&&first>lateAfter&&!leave&&!holiday&&!off",
  'employee profile shift-ledger late exclusion'
)

// Employee profile: ledger attendance is present even without a punch.
replaceOnce(
  /status=ps\.length\?'حاضر':leave\?'إجازة':holiday\?'عطلة رسمية':off\?'جمعة':'غياب'/,
  "status=/ورادى|ورادي/.test(String(e.job||''))?'حاضر':ps.length?'حاضر':leave?'إجازة':holiday?'عطلة رسمية':off?'جمعة':'غياب'",
  'employee profile shift-ledger present status'
)

// Monthly attendance summary: use the ledger rule only if the previous summary block exists.
replaceOnce(
  /else if\(ps\.length\)\{present\+\+;if\(ps\.length===1\)single\+\+;const first=/,
  'else if(isCouncilTech(e)||ps.length){present++;if(ps.length===1)single++;if(ps.length){const first=',
  'attendance monthly shift-ledger presence'
)

// Monthly matrix. Support both the original compact expression and the common refactored form.
const matrixApplied = replaceOnce(
  /row\['يوم '\+d\]=ps\.length\?\(ps\.length===1\?'1':'✓'\):\(leave\?'إ':holiday\?'ع':off\?'ج':'غ'\)/,
  "row['يوم '+d]=ps.length?(ps.length===1?'1':'✓'):(leave?'إ':holiday?'ع':off?'ج':isCouncilTech(e)?'ح':'غ')",
  'attendance monthly matrix shift-ledger status'
)
if (!matrixApplied && source.includes("row['يوم '+d]")) {
  skipped.push('attendance monthly matrix already refactored; no exact legacy expression found')
}

// Leave logic: "تسوية" is a settlement record and must not consume annual/casual balance.
if (!source.includes('<option>تسوية</option>')) {
  replaceOnce(
    /<option>مرضية<\/option><option>بدون مرتب<\/option>/,
    '<option>مرضية</option><option>تسوية</option><option>بدون مرتب</option>',
    'leave settlement option'
  )
} else {
  skipped.push('leave settlement option already present')
}

if (source !== original) {
  fs.writeFileSync(appPath, source, 'utf8')
}

console.log('[RULES] Company rules check completed successfully.')
if (changes.length) {
  console.log('[RULES] Applied:')
  for (const item of changes) console.log('  -', item)
} else {
  console.log('[RULES] No source changes were required.')
}
if (skipped.length) {
  console.log('[RULES] Skipped safely:')
  for (const item of skipped) console.log('  -', item)
}

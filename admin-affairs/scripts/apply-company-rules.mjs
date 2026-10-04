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

function replaceAllRegex(regex, replacement, label) {
  const before = source
  source = source.replace(regex, replacement)
  if (source !== before) changes.push(label)
}

// Company rule: فني/عامل ورادى يعمل بنظام الدفتر، لذلك يعتبر حاضرًا افتراضيًا
// ولا يُحسب عليه تأخير أو انصراف مبكر بسبب عدم وجود بصمة.
replaceAllRegex(
  /const isCouncilTech=\(e:Employee\)=>\/مجالس\/.test\(String\(e\.job\|\|''\)\)\|\|\/مجالس\/.test\(String\(e\.department\|\|''\)\)/g,
  "const isCouncilTech=(e:Employee)=>/مجالس/.test(String(e.job||''))||/مجالس/.test(String(e.department||''))||/ورادى|ورادي/.test(String(e.job||''))||/ورادى|ورادي/.test(String(e.department||''))",
  'shift-ledger helper'
)
replaceAllRegex(
  /\/مجالس\/.test\(String\(e\.job\|\|''\)\)\|\|\/مجالس\/.test\(String\(e\.department\|\|''\)\)/g,
  "/مجالس/.test(String(e.job||''))||/مجالس/.test(String(e.department||''))||/ورادى|ورادي/.test(String(e.job||''))||/ورادى|ورادي/.test(String(e.department||''))",
  'shift-ledger rule extension'
)

// Dashboard: shift-ledger employees are excluded from lateness alerts.
replaceAllRegex(
  /!isCollector\(employees\.find\(e=>e\.code===x\.code\)\|\|\(\{\} as Employee\)\)&&x\.time>lateAfter/g,
  "!isCollector(employees.find(e=>e.code===x.code)||({} as Employee))&&!isCouncilTech(employees.find(e=>e.code===x.code)||({} as Employee))&&x.time>lateAfter",
  'dashboard shift-ledger late exclusion'
)

// Employee profile: ledger attendance is present without a punch and is informational only.
replaceAllRegex(
  /lateFlag=!!first&&first>lateAfter&&!leave&&!holiday&&!off/g,
  "lateFlag=!\/ورادى|ورادي\/.test(String(e.job||''))&&!!first&&first>lateAfter&&!leave&&!holiday&&!off",
  'employee profile shift-ledger late exclusion'
)
replaceAllRegex(
  /status=ps\.length\?'حاضر':leave\?'إجازة':holiday\?'عطلة رسمية':off\?'جمعة':'غياب'/g,
  "status=/ورادى|ورادي/.test(String(e.job||''))?'حاضر':ps.length?'حاضر':leave?'إجازة':holiday?'عطلة رسمية':off?'جمعة':'غياب'",
  'employee profile shift-ledger present status'
)

// Monthly attendance summary: ledger employees are present by default.
replaceAllRegex(
  /else if\(ps\.length\)\{present\+\+;if\(ps\.length===1\)single\+\+;const first=/g,
  'else if(isCouncilTech(e)||ps.length){present++;if(ps.length===1)single++;if(ps.length){const first=',
  'attendance monthly shift-ledger presence'
)

// Monthly matrix: ح = حضور دفتري for shift-ledger employees.
replaceAllRegex(
  /row\['يوم '\+d\]=ps\.length\?\(ps\.length===1\?'1':'✓'\):\(leave\?'إ':holiday\?'ع':off\?'ج':'غ'\)/g,
  "row['يوم '+d]=ps.length?(ps.length===1?'1':'✓'):(leave?'إ':holiday?'ع':off?'ج':isCouncilTech(e)?'ح':'غ')",
  'attendance monthly matrix shift-ledger status'
)

// Leave logic: "تسوية" is a settlement record and does not consume annual/casual balance.
replaceAllRegex(
  /<option>مرضية<\/option><option>بدون مرتب<\/option>/g,
  '<option>مرضية</option><option>تسوية</option><option>بدون مرتب</option>',
  'leave settlement option'
)

if (source !== original) {
  fs.writeFileSync(appPath, source, 'utf8')
  console.log('[RULES] Applied company HR rules:')
  for (const item of changes) console.log('  -', item)
} else {
  console.log('[RULES] Company HR rules already present; no source changes needed.')
}

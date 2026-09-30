import fs from 'node:fs'

const file = new URL('../src/App.tsx', import.meta.url)
let s = fs.readFileSync(file, 'utf8')

// Repair the holidays parser without parsing the malformed source itself.
const marker = "const holidays=String(settings.holidays||'')"
const start = s.indexOf(marker)
if (start >= 0) {
  const end = s.indexOf(';', start)
  if (end >= 0) {
    s = s.slice(0, start) + "const holidays=String(settings.holidays||'').split(/[\\n,;]+/).filter(Boolean)" + s.slice(end)
  }
}

fs.writeFileSync(file, s, 'utf8')
console.log('[FIX] App.tsx holidays parser repaired.')

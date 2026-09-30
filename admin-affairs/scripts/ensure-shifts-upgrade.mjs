import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const app=resolve('src','App.tsx')
const source=fs.readFileSync(app,'utf8')
if(source.includes('hr_attendance_overrides') && source.includes("'shifts'")) {
  console.log('[LOCAL] HR roster upgrade already applied.')
  process.exit(0)
}
execFileSync(process.execPath,['scripts/apply-shifts-upgrade.mjs'],{stdio:'inherit'})

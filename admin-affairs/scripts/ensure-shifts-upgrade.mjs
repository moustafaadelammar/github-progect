import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const app=resolve('src','App.tsx')
let source=fs.readFileSync(app,'utf8')
if(!(source.includes('hr_attendance_overrides') && source.includes("'shifts'"))) {
  execFileSync(process.execPath,['scripts/apply-shifts-upgrade.mjs'],{stdio:'inherit'})
  source=fs.readFileSync(app,'utf8')
}

const shifts=resolve('src','Shifts.tsx')
let sh=fs.readFileSync(shifts,'utf8')
sh=sh.replace("const [centers,setCenters]=useState<Center[]>(()=>read(CENTERS_KEY,[])),[weeks,setWeeks]=useState<Week[]>(()=>read(KEY,[])),[centerId,setCenterId]=useState<number|null>(null),[month,setMonth]=useState(new Date().toISOString().slice(0,7)),[weekStart,setWeekStart]=useState(saturdayOf(new Date().toISOString().slice(0,10))),[activeWeek,setActiveWeek]=useState(''),[centerName,setCenterName]=useState(''),[group,setGroup]=useState<string[]>([]),[selectedGroup,setSelectedGroup]=useState(0),[search,setSearch]=useState(''),[previewMonth,setPreviewMonth]=useState(month),[manualNotes,setManualNotes]=useState<Record<string,string>>(()=>read('hr_shift_absence_notes',{}))","const [centers,setCenters]=useState<Center[]>(()=>read(CENTERS_KEY,[])),[weeks,setWeeks]=useState<Week[]>(()=>read(KEY,[])),[centerId,setCenterId]=useState<number|null>(null),[month,setMonth]=useState(new Date().toISOString().slice(0,7)),[weekStart,setWeekStart]=useState(saturdayOf(new Date().toISOString().slice(0,10))),[activeWeek,setActiveWeek]=useState(''),[centerName,setCenterName]=useState(''),[group,setGroup]=useState<string[]>([]),[selectedGroup,setSelectedGroup]=useState(0),[search,setSearch]=useState(''),[previewMonth,setPreviewMonth]=useState(month),[manualNotes]=useState<Record<string,string>>(()=>read('hr_shift_absence_notes',{}))")
fs.writeFileSync(shifts,sh)

source=source.replace(/function Reports\(\{employees,punches,leaves,missions,balances,settings\}:\{employees:Employee\[\];punches:Punch\[\];leaves:Leave\[\];missions:Mission\[\];balances:LeaveBalance\[\];settings:any\}\)/,"function Reports({employees,punches,leaves,missions}:{employees:Employee[];punches:Punch[];leaves:Leave[];missions:Mission[]})")
source=source.replace(/<Reports employees=\{employees\} punches=\{punches\} leaves=\{leaves\} missions=\{missions\} balances=\{leaveBalances\} settings=\{settings\}\/>/,"<Reports employees={employees} punches={punches} leaves={leaves} missions={missions}/>")
fs.writeFileSync(app,source)
console.log('[LOCAL] HR roster upgrade normalization: OK')

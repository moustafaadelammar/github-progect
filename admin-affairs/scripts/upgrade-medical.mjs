import fs from 'node:fs'
import path from 'node:path'

const file=path.resolve('src/App.tsx')
let s=fs.readFileSync(file,'utf8')

if(!s.includes("from './Medical'")){
  s=s.replace("import * as XLSX from 'xlsx'\n", "import * as XLSX from 'xlsx'\nimport MedicalModule, { type MedicalRecord } from './Medical'\n")
}

if(!s.includes("'hr_medical'")){
  const marker="const [punches,setPunches]=useState<Punch[]>(()=>read('hr_attendance',[]));"
  s=s.replace(marker, marker+"const [medicalRecords,setMedicalRecords]=useState<MedicalRecord[]>(()=>read('hr_medical',[]));")
  const marker2="useEffect(()=>localStorage.setItem('hr_employees',JSON.stringify(employees)),[employees]);"
  s=s.replace(marker2, marker2+"useEffect(()=>localStorage.setItem('hr_medical',JSON.stringify(medicalRecords)),[medicalRecords]);")
}

s=s.replace("{section==='medical'&&<Medical employees={employees}/>}", "{section==='medical'&&<MedicalModule employees={employees} records={medicalRecords} setRecords={setMedicalRecords}/>}")
fs.writeFileSync(file,s)
console.log('Medical module wired successfully.')

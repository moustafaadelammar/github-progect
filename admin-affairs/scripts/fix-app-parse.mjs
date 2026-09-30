import fs from 'node:fs'

const file = new URL('../src/App.tsx', import.meta.url)
let s = fs.readFileSync(file, 'utf8')

// Repair regex literals that were accidentally split across a physical newline.
// The valid forms are /[\n,;]+/ and /[\n,]+/.
s = s.replace(/split\(\/\[\\\\\n,;\]\+\//g, "split(/[\\n,;]+/")
s = s.replace(/split\(\/\[\\\\\n,\]\+\//g, "split(/[\\n,]+/")

// Also handle the literal malformed sequence containing an actual newline.
s = s.replace("split(/[\\\\\\n,;]+/)", "split(/[\\n,;]+/)")
s = s.replace("split(/[\\\\\\n,]+/)", "split(/[\\n,]+/)")

// Deterministic fallback: replace any occurrence of a split regex that starts
// with '/[' and contains a backslash/newline before the separator list.
s = s.replace(/split\(\/\[[^\]]*\n[,;]+\]\+\//g, (m) => m.includes(',;') ? "split(/[\\n,;]+/" : "split(/[\\n,]+/")

fs.writeFileSync(file, s, 'utf8')
console.log('[FIX] App.tsx regex syntax repaired.')

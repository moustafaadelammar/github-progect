import net from 'node:net'
import { spawn } from 'node:child_process'
import { mkdirSync, createWriteStream } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const logs = resolve(root, 'logs')
mkdirSync(logs, { recursive: true })

function portOpen(port) {
  return new Promise(resolveResult => {
    const s = new net.Socket()
    const done = value => { s.destroy(); resolveResult(value) }
    s.setTimeout(400)
    s.once('connect', () => done(true))
    s.once('timeout', () => done(false))
    s.once('error', () => done(false))
    s.connect(port, '127.0.0.1')
  })
}

function start(command, args, logName) {
  const out = createWriteStream(resolve(logs, logName), { flags: 'a' })
  const child = spawn(command, args, {
    cwd: root,
    detached: true,
    windowsHide: true,
    stdio: ['ignore', out, out],
  })
  child.unref()
}

if (!(await portOpen(8787))) start(process.execPath, ['scripts/fingerprint-gateway.mjs'], 'fingerprint-gateway.log')
if (!(await portOpen(5173))) {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  start(npm, ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173'], 'vite.log')
}

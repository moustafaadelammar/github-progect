import net from 'node:net'
import { spawn } from 'node:child_process'
import { mkdirSync, openSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const logs = resolve(root, 'logs')
mkdirSync(logs, { recursive: true })

function portOpen(port) {
  return new Promise(resolveResult => {
    const s = new net.Socket()
    const done = value => { s.destroy(); resolveResult(value) }
    s.setTimeout(500)
    s.once('connect', () => done(true))
    s.once('timeout', () => done(false))
    s.once('error', () => done(false))
    s.connect(port, '127.0.0.1')
  })
}

function start(command, args, logName) {
  const logPath = resolve(logs, logName)
  const fd = openSync(logPath, 'a')
  const child = spawn(command, args, {
    cwd: root,
    detached: true,
    windowsHide: true,
    stdio: ['ignore', fd, fd],
  })
  child.unref()
  return child
}

if (!(await portOpen(8787))) {
  start(process.execPath, ['scripts/fingerprint-gateway.mjs'], 'fingerprint-gateway.log')
}

if (!(await portOpen(5173))) {
  const viteCli = resolve(root, 'node_modules', 'vite', 'bin', 'vite.js')
  start(process.execPath, [viteCli, '--host', '127.0.0.1', '--port', '5173'], 'vite.log')
}

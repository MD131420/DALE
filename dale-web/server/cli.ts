// Creates the admin account or sets a new password (also the way to recover a forgotten one).
// Run: Admin.bat (double-click) or `npm run admin`.
import path from 'node:path'
import { audit, openDb } from './db.ts'
import { hashPassword, passwordProblem } from './security.ts'

const root = path.resolve(import.meta.dirname, '..')
const db = openDb(path.resolve(process.env.DALE_DATA_DIR ?? path.join(root, 'data')))

/** Reads a line from the console without echoing it (input pasted or piped ahead is kept for the next question). */
let pending = ''
function ask(question: string, hidden = false) {
  return new Promise<string>((resolve) => {
    process.stdout.write(question)
    const stdin = process.stdin
    let value = ''
    let done = false
    const onData = (chunk: string) => {
      const chars = [...chunk]
      for (let i = 0; i < chars.length; i++) {
        const ch = chars[i]
        if (ch === '\u0003') {
          process.stdout.write('\n')
          process.exit(1)
        } else if (ch === '\r' || ch === '\n') {
          const rest = chars.slice(i + 1).join('')
          pending = ch === '\r' && rest.startsWith('\n') ? rest.slice(1) : rest
          done = true
          if (stdin.isTTY) stdin.setRawMode(false)
          stdin.pause()
          stdin.off('data', onData)
          process.stdout.write('\n')
          resolve(value)
          return
        } else if (ch === '\u0008' || ch === '\u007f') {
          if (value.length) {
            value = value.slice(0, -1)
            process.stdout.write('\b \b')
          }
        } else {
          value += ch
          process.stdout.write(hidden ? '*' : ch)
        }
      }
    }
    stdin.setEncoding('utf8')
    const queued = pending
    pending = ''
    if (queued) onData(queued)
    if (done) return
    if (stdin.isTTY) stdin.setRawMode(true)
    stdin.on('data', onData)
    stdin.resume()
  })
}

const users = db.prepare('SELECT id, username FROM users ORDER BY id').all() as { id: number; username: string }[]
console.log('\n  DALE — konto administratora\n')
if (users.length) console.log(`  Istniejące konta: ${users.map((u) => u.username).join(', ')}\n`)

const fallback = users[0]?.username ?? 'admin'
let username = (await ask(`  Login [${fallback}]: `)).trim() || fallback
username = username.slice(0, 64)
if (!/^[\p{L}\p{N}._@-]{3,64}$/u.test(username)) {
  console.log('  Login: 3–64 znaki, litery, cyfry, kropka, myślnik, @.')
  process.exit(1)
}

let password = ''
for (;;) {
  password = await ask('  Nowe hasło (min. 12 znaków): ', true)
  const problem = passwordProblem(password, username)
  if (problem) {
    console.log(`  ${problem}`)
    continue
  }
  if ((await ask('  Powtórz hasło: ', true)) !== password) {
    console.log('  Hasła się różnią.')
    continue
  }
  break
}

const hash = await hashPassword(password)
const now = Date.now()
const existing = users.find((u) => u.username.toLowerCase() === username.toLowerCase())
if (existing) {
  db.prepare('UPDATE users SET password_hash = ?, password_changed_at = ? WHERE id = ?').run(hash, now, existing.id)
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(existing.id)
  audit(db, 'password_set_cli', { userId: existing.id })
  console.log(`\n  Hasło dla „${existing.username}” zmienione. Wszystkie urządzenia zostały wylogowane.\n`)
} else {
  const res = db
    .prepare('INSERT INTO users (username, password_hash, created_at, password_changed_at) VALUES (?, ?, ?, ?)')
    .run(username, hash, now, now)
  audit(db, 'user_created_cli', { userId: Number(res.lastInsertRowid), detail: username })
  console.log(`\n  Konto „${username}” utworzone. Zaloguj się na /admin.\n`)
}
db.close()

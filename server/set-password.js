// Sets the dashboard password from the terminal: npm run admin:password
import { createInterface } from 'node:readline/promises'
import { destroyAllSessions, setPassword } from './auth.js'

const rl = createInterface({ input: process.stdin, output: process.stdout })
const password = (await rl.question('New dashboard password (8+ characters): ')).trim()
rl.close()

if (password.length < 8) {
  console.error('Not changed: the password needs at least 8 characters.')
  process.exit(1)
}

setPassword(password)
destroyAllSessions() // sign out everywhere
console.log('Password updated. Sign in again at /admin.')

import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isWindows = process.platform === 'win32'
const npmCmd = isWindows ? 'npm.cmd' : 'npm'

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { cwd, stdio: 'inherit', shell: isWindows })
    proc.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Process exited with code ${code}`))
    })
  })
}

async function ensureDeps(dirName) {
  const nodeModulesPath = path.join(__dirname, dirName, 'node_modules')
  if (!fs.existsSync(nodeModulesPath)) {
    console.log(`📦 Installing dependencies in ${dirName}...`)
    await runCommand(npmCmd, ['install'], path.join(__dirname, dirName))
  }
}

const mode = process.argv[2] || 'all'

async function start() {
  if (mode === 'backend') {
    await ensureDeps('backend')
    console.log('🚀 Starting Backend on http://localhost:5000...')
    spawn(npmCmd, ['run', 'dev'], { cwd: path.join(__dirname, 'backend'), stdio: 'inherit', shell: isWindows })
  } else if (mode === 'frontend') {
    await ensureDeps('frontend')
    console.log('🎛️ Starting Frontend on http://localhost:5173...')
    spawn(npmCmd, ['run', 'dev'], { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit', shell: isWindows })
  } else {
    await ensureDeps('backend')
    await ensureDeps('frontend')
    console.log('✨ Starting Dramatone Studio (Frontend + Backend)...')

    const be = spawn(npmCmd, ['run', 'dev'], { cwd: path.join(__dirname, 'backend'), stdio: 'inherit', shell: isWindows })
    const fe = spawn(npmCmd, ['run', 'dev'], { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit', shell: isWindows })

    const cleanExit = () => {
      console.log('\n🛑 Stopping servers...')
      try { be.kill() } catch {}
      try { fe.kill() } catch {}
      process.exit()
    }

    process.on('SIGINT', cleanExit)
    process.on('SIGTERM', cleanExit)
  }
}

start().catch((err) => {
  console.error('Failed to start:', err.message)
  process.exit(1)
})


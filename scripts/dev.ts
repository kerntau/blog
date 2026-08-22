import { spawn } from 'node:child_process'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

// 检查端口是否已有服务运行
function isPortInUse(port: number): Promise<boolean> {
	return new Promise((resolve) => {
		const req = http.request({
			hostname: 'localhost',
			port,
			path: '/api/health',
			method: 'GET',
			timeout: 1000,
		}, (res) => {
			resolve(res.statusCode !== undefined)
		})
		req.on('error', () => resolve(false))
		req.on('timeout', () => {
			req.destroy()
			resolve(false)
		})
		req.end()
	})
}

async function main() {
	// 1. 静态数据生成与 MDX 预编译
	console.log('📦 正在提取文章数据并进行 MDX 预编译与静态索引生成...')
	await new Promise<void>((resolve, reject) => {
		const buildStatic = spawn('npx', ['tsx', 'scripts/build-static.ts'], {
			cwd: rootDir,
			stdio: 'inherit',
			shell: true,
		})
		buildStatic.on('close', (code) => {
			if (code === 0) resolve()
			else reject(new Error(`build-static 退出码: ${code}`))
		})
	})

	// 2. 检查并伴生启动本地管理 API 服务 (3001 端口)
	const inUse = await isPortInUse(3001)
	let adminProcess: any = null

	if (!inUse) {
		console.log('⚡ 正在伴生启动本地管理 API 引擎 (http://localhost:3001)...')
		adminProcess = spawn('npx', ['tsx', 'watch', 'scripts/admin-server.ts'], {
			cwd: rootDir,
			shell: true,
			stdio: 'inherit',
		})
	}
	else {
		console.log('ℹ️ 检测到本地管理 API 服务已在运行 (3001)，无需重复启动')
	}

	// 3. 启动 Rsbuild 前端开发服务器 (3000 端口)
	const devProcess = spawn('npx', ['rsbuild', 'dev'], {
		cwd: rootDir,
		shell: true,
		stdio: 'inherit',
	})

	// 4. 退出信号监听与子进程协同销毁
	const cleanup = () => {
		if (adminProcess) {
			adminProcess.kill()
		}
		if (devProcess) {
			devProcess.kill()
		}
		process.exit(0)
	}

	process.on('SIGINT', cleanup)
	process.on('SIGTERM', cleanup)
	process.on('exit', cleanup)
}

main().catch((err) => {
	console.error('启动失败:', err)
	process.exit(1)
})

/* eslint-disable style/max-statements-per-line */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execute = promisify(execFile)
const allowedPrefixes = ['content/', 'public/']
let activePush: Promise<AtomicPushResult> | null = null

export interface AtomicPushResult { ok: boolean, message: string, log: string[] }

async function runGit(args: string[]) {
	const result = await execute('git', args, { cwd: process.cwd(), windowsHide: true, maxBuffer: 1024 * 1024 })
	return `${result.stdout}${result.stderr}`.trim()
}

async function changedPublishFiles() {
	const output = await runGit(['status', '--porcelain=v1', '-z', '--', 'content', 'public'])
	const entries = output.split('\0').filter(Boolean).map(entry => entry.slice(3).replaceAll('\\', '/'))
	return [...new Set(entries)].filter(path => allowedPrefixes.some(prefix => path.startsWith(prefix)))
}

export async function runAtomicGitPush(): Promise<AtomicPushResult> {
	if (activePush) return activePush
	activePush = (async () => {
		const log: string[] = []
		try {
			const branch = await runGit(['branch', '--show-current'])
			if (branch !== 'main') return { ok: false, message: '原子化发布仅允许在 main 分支执行。', log }
			const files = await changedPublishFiles()
			if (!files.length) return { ok: true, message: '没有待发布的内容或媒体变更。', log }
			await runGit(['add', '--', ...files]); log.push(`已暂存 ${files.length} 个内容或媒体文件。`)
			try { await runGit(['diff', '--cached', '--quiet']); return { ok: true, message: '暂存区没有可提交的发布变更。', log } } catch { /* git uses status 1 for differences */ }
			const message = `chore(content): publish ${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}`
			log.push(await runGit(['commit', '-m', message]))
			log.push(await runGit(['push', 'origin', 'main']))
			return { ok: true, message: '内容与媒体已原子化提交并推送到 origin/main。', log }
		} catch (error) { return { ok: false, message: error instanceof Error ? error.message : '原子化发布失败。', log } } finally { activePush = null }
	})()
	return activePush
}

export function canRunAtomicGitPush(request: Request) {
	const configuredToken = process.env.ADMIN_ACTION_TOKEN
	return process.env.ADMIN_GIT_PUSH_ENABLED === 'true' && Boolean(configuredToken) && request.headers.get('x-admin-action-token') === configuredToken
}

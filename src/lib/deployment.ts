/* eslint-disable style/max-statements-per-line */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export interface DeploymentStep { id: string, label: string, detail: string }
export const deploymentSteps: DeploymentStep[] = [
	{ id: 'remote-check', label: '检查远程', detail: '读取受控部署服务返回的远程版本信息。' },
	{ id: 'backup', label: '自动备份', detail: '在切换前创建可恢复的发布快照。' },
	{ id: 'fast-forward', label: '快进拉取', detail: '仅允许 Fast-forward，不重写当前历史。' },
	{ id: 'migrate', label: '数据库迁移', detail: '在隔离候选版本上运行声明式迁移。' },
	{ id: 'build', label: '依赖与构建', detail: '检查锁文件、安装依赖并构建候选版本。' },
	{ id: 'health-check', label: '健康检查', detail: '确认候选版本能够响应关键页面。' },
	{ id: 'switch', label: '切换版本', detail: '仅在全部检查通过后原子切换发布指针。' },
]

export async function getDeploymentStatus() {
	let current = 'unknown'
	try { current = (await readFile(join(process.cwd(), '.git', 'HEAD'), 'utf8')).trim() } catch { /* unavailable in managed runtimes */ }
	return { current, remote: null, changedCriticalFiles: [] as string[], canRun: false, gitPushConfigured: process.env.ADMIN_GIT_PUSH_ENABLED === 'true' && Boolean(process.env.ADMIN_ACTION_TOKEN) }
}

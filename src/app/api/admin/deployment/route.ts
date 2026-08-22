/* eslint-disable style/max-statements-per-line */
import { NextResponse } from 'next/server'
import { deploymentSteps, getDeploymentStatus } from '@/lib/deployment'
import { canRunAtomicGitPush, runAtomicGitPush } from '@/lib/atomic-git-push'

export async function GET() { return NextResponse.json({ ...(await getDeploymentStatus()), steps: deploymentSteps }) }

export async function POST() {
	return NextResponse.json({ error: '此应用不在运行目录执行部署命令。请配置独立的 DEPLOYMENT_CONTROL_URL，由受控发布服务执行更新。' }, { status: 409 })
}

export async function PUT(request: Request) {
	if (!canRunAtomicGitPush(request)) return NextResponse.json({ error: '原子化发布未授权。请在受控服务中配置 ADMIN_GIT_PUSH_ENABLED 与 ADMIN_ACTION_TOKEN。' }, { status: 403 })
	const result = await runAtomicGitPush()
	return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}

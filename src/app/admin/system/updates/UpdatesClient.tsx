'use client'
/* eslint-disable style/max-statements-per-line */

import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { Button, ConfirmButton, useToast } from '@/components/admin/AdminControls'

interface Status { current: string, remote: string | null, changedCriticalFiles: string[], canRun: boolean, gitPushConfigured: boolean, steps: Array<{ id: string, label: string, detail: string }> }
export default function UpdatesClient() {
	const [status, setStatus] = useState<Status | null>(null)
	const [logOpen, setLogOpen] = useState(false)
	const toast = useToast()
	useEffect(() => { fetch('/api/admin/deployment').then(response => response.json()).then(setStatus).catch(() => undefined) }, [])
	async function start() { const response = await fetch('/api/admin/deployment', { method: 'POST' }); const body = await response.json(); toast.show(body.error || '更新任务已提交') }
	async function publish() { const response = await fetch('/api/admin/deployment', { method: 'PUT' }); const body = await response.json(); toast.show(body.message || body.error); if (body.log?.length) setLogOpen(true) }
	return (
<><header className="admin-page-heading"><div><h1>系统更新</h1><p>每次更新都会在独立候选版本中验证，通过后才会切换。</p></div><Button type="button" variant="ghost" onClick={() => setLogOpen(true)}><Icon icon="tabler:terminal-2" />查看日志</Button></header>
		<section className="admin-update-summary admin-card"><div><Icon icon="tabler:git-compare" /><span>当前版本</span><strong>{status?.current || '正在读取…'}</strong></div><Icon icon="tabler:arrow-right" /><div><Icon icon="tabler:cloud-download" /><span>远程版本</span><strong>{status?.remote || '等待受控服务检查'}</strong></div><Button type="button" onClick={start} disabled={!status?.canRun}><Icon icon="tabler:search" />检查远程</Button></section>
		{status?.changedCriticalFiles.length ? <section className="admin-critical-change"><Icon icon="tabler:alert-triangle" /><div><strong>发现关键配置变更</strong><p>{status.changedCriticalFiles.join('、')}</p></div></section> : null}
		<section className="admin-section"><div className="admin-section-head"><h2>安全发布流水线</h2><span>不可跳过</span></div><ol className="admin-pipeline">{(status?.steps || []).map((step, index) => <li key={step.id}><span>{index + 1}</span><div><strong>{step.label}</strong><p>{step.detail}</p></div><Icon icon="tabler:lock" /></li>)}</ol></section>
		<section className="admin-card admin-rollback"><div><Icon icon="tabler:history" /><div><strong>容灾与回滚</strong><p>失败时保留正在运行的版本，待受控服务配置后可从备份快照恢复。</p></div></div><ConfirmButton label="回滚到上一版本" title="确认回滚" description="回滚由独立部署服务执行，当前运行目录不会执行 Shell 命令。" onConfirm={() => toast.show('回滚请求已记录，等待受控部署服务。')} /></section>
		<section className="admin-card admin-publish"><div><Icon icon="tabler:git-pull-request" /><div><strong>原子化内容发布</strong><p>仅提交 `content/` 与 `public/` 的改动，使用固定提交格式推送至 `origin/main`。</p></div></div><Button type="button" onClick={publish} disabled={!status?.gitPushConfigured}><Icon icon="tabler:cloud-upload" />提交并推送</Button></section>
		{logOpen && <div className="admin-media-drawer-layer" onClick={() => setLogOpen(false)}><aside className="admin-log-drawer" onClick={event => event.stopPropagation()}><Button type="button" variant="ghost" onClick={() => setLogOpen(false)}><Icon icon="tabler:x" />关闭</Button><h2>部署日志</h2><pre>尚无受控部署任务。\n配置 DEPLOYMENT_CONTROL_URL 后，运行日志会以只读方式出现在此处。</pre></aside></div>}
</>
)
}

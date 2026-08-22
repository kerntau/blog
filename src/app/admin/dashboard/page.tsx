/* eslint-disable style/max-statements-per-line */
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { execFileSync } from 'node:child_process'
import { getAdminOverview } from '@/lib/admin'
import { StatusBadge } from '@/components/admin/AdminControls'

function git(command: string[]) {
	try { return execFileSync('git', command, { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() } catch { return '不可用' }
}

export default function DashboardPage() {
	const { posts, drafts, health } = getAdminOverview()
	const latestDraft = drafts[0] ?? posts[0]
	const commit = git(['rev-parse', '--short', 'HEAD'])
	return (
<>
		<header className="admin-page-heading"><div><h1>工作台</h1><p>内容、发布与站点健康度都在这里。</p></div><Link className="admin-button admin-button-primary" href="/admin/editor"><Icon icon="tabler:plus" />新建文章</Link></header>
		<section className="admin-grid admin-stat-grid" aria-label="内容统计">
			<div className="admin-card admin-stat"><Icon icon="tabler:article" /><p>正式文章</p><strong>{posts.length - drafts.length}</strong></div>
			<div className="admin-card admin-stat"><Icon icon="tabler:file-pencil" /><p>草稿</p><strong>{drafts.length}</strong></div>
			<div className="admin-card admin-stat"><Icon icon="tabler:message-circle" /><p>待处理评论</p><strong>0</strong></div>
		</section>
		<section className="admin-section"><div className="admin-section-head"><h2>继续编辑</h2><Link href="/admin/articles">所有文章</Link></div>
			<div className="admin-card admin-list">{latestDraft ? <div className="admin-row"><div><strong>{latestDraft.title || '未命名文章'}</strong><small>最后更新：{String(latestDraft.updated || latestDraft.date || '未记录')}</small></div><div className="admin-row-actions"><StatusBadge status={latestDraft.draft ? 'draft' : 'published'} /><Link className="admin-button admin-button-ghost" href={`/admin/editor?path=${encodeURIComponent(`/${latestDraft._stem}`)}`}>继续编辑</Link></div></div> : <div className="admin-row"><span>还没有可编辑内容</span><Link href="/admin/editor">创建第一篇文章</Link></div>}</div>
		</section>
		<section className="admin-grid admin-dashboard-lower"><div className="admin-section"><div className="admin-section-head"><h2>内容健康度</h2><span className="admin-health-score">{Math.max(0, 100 - (health.missingCover + health.missingDescription + health.brokenImages) * 4)} 分</span></div><div className="admin-card admin-list">{[
				['缺少封面', health.missingCover, 'tabler:photo-off'], 
['缺少描述', health.missingDescription, 'tabler:text-caption'], 
['失效图片', health.brokenImages, 'tabler:photo-x'], 
['失效友链', health.brokenLinks, 'tabler:link-off'],
			].map(([label, count, icon]) => <div className="admin-row" key={String(label)}><span><Icon icon={String(icon)} /> {label}</span><strong>{count}</strong></div>)}
                                                                                                                                                                                                                                                                                             </div>
                                                        </div>
			<div className="admin-section"><div className="admin-section-head"><h2>系统版本</h2><Link href="/admin/system/updates">更新中心</Link></div><div className="admin-card admin-version"><Icon icon="tabler:git-commit" /><div><small>当前 Git 节点</small><strong>{commit}</strong><p>远程检查将在受控部署流水线中执行。</p></div></div></div>
  </section>
</>
)
}

'use client'

import { Icon } from '@iconify/react'
import { Button, EmptyState, StatusBadge, useToast } from '@/components/admin/AdminControls'

export default function LinksClient({ links }: { links: Array<{ title: string, url: string }> }) {
	const toast = useToast()
	return (
<><header className="admin-page-heading"><div><h1>友链</h1><p>保留前台随机分组与订阅源展示，统一管理可用性。</p></div><Button type="button" onClick={() => toast.show('新建友链将在受控内容编辑器中完成。')}><Icon icon="tabler:plus" />添加友链</Button></header>
		{links.length ? <div className="admin-card admin-list">{links.map(link => <div key={link.url} className="admin-row"><div><strong>{link.title}</strong><small>{link.url}</small></div><div className="admin-row-actions"><StatusBadge status="published" /><Button type="button" variant="ghost" onClick={() => toast.show('RSS/Atom 检查任务已进入队列')}>检查订阅</Button></div></div>)}</div> : <EmptyState title="还没有解析到友链" description="在 content/link.mdx 中添加友链后，它们会在这里按前台逻辑分组展示。" />}
		<section className="admin-card admin-task-note"><Icon icon="tabler:rss" /><div><strong>RSS / Atom 存活检查</strong><p>检查任务在后台队列运行，前端不会直接请求外部订阅源。</p></div></section>
</>
)
}

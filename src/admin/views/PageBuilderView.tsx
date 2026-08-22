import React, { useState } from 'react'
import { Icon } from '@iconify/react'
import { useToast } from '../components/Toast'

interface PageMetaItem {
	id: string
	path: string
	title: string
	subtitle: string
	description: string
	icon: string
	widgets: string[]
	enabled: boolean
}

export const PageBuilderView: React.FC = () => {
	const { showToast } = useToast()
	const [pages, setPages] = useState<PageMetaItem[]>([
		{
			id: 'home',
			path: '/',
			title: '博客首页',
			subtitle: '全栈探索者 · AI 极客',
			description: '在有序的世界里，寻一处生活的归栈。用理性梳理日常，用技术温柔时光。',
			icon: 'tabler:home',
			widgets: ['blog-stats', 'blog-tech', 'comm-group'],
			enabled: true,
		},
		{
			id: 'archive',
			path: '/archive',
			title: '时光归档',
			subtitle: '文章按年份与月份聚合一览',
			description: '记录过往写下的每一篇思考与探索。',
			icon: 'tabler:archive',
			widgets: ['blog-stats', 'blog-log'],
			enabled: true,
		},
		{
			id: 'link',
			path: '/link',
			title: '友链与邻居',
			subtitle: '志同道合的博友订阅站点矩阵',
			description: '与互联网上的优秀创造者们互相连接。',
			icon: 'tabler:link',
			widgets: ['blog-stats', 'comm-group'],
			enabled: true,
		},
		{
			id: 'preview',
			path: '/preview',
			title: '未发布预览页',
			subtitle: '勇敢的探索者，这里是一些尚未公开发布的草稿',
			description: '未发布的预热草稿文章列表',
			icon: 'tabler:eye',
			widgets: ['blog-log'],
			enabled: true,
		},
	])

	const [editingPage, setEditingPage] = useState<PageMetaItem | null>(null)

	const handleSavePage = () => {
		if (!editingPage) return
		const nextPages = pages.map(p => p.id === editingPage.id ? editingPage : p)
		setPages(nextPages)
		setEditingPage(null)
		showToast(`已更新页面《${editingPage.title}》配置`, 'success')
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
			{/* 顶栏 */}
			<div className="admin-card" style={{ padding: '14px 18px' }}>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
					<div>
						<div style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text-1)' }}>
							页面管理 (Page Builder)
						</div>
						<div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 2 }}>
							管理博客首页、归档、友链、自定义页面的元数据与挂件关系
						</div>
					</div>
				</div>
			</div>

			{/* 页面卡片列表 */}
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
				{pages.map((p) => (
					<div
						key={p.id}
						className="admin-card interactive"
						style={{
							padding: '16px',
							display: 'flex',
							flexDirection: 'column',
							gap: 12,
							justifyContent: 'space-between',
						}}
					>
						<div>
							<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
								<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
									<div
										style={{
											width: 36,
											height: 36,
											borderRadius: 8,
											background: 'var(--admin-accent-soft)',
											color: 'var(--admin-accent)',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontSize: 20,
										}}
									>
										<Icon icon={p.icon} />
									</div>
									<div>
										<div style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text-1)' }}>
											{p.title}
										</div>
										<div style={{ fontSize: 11, color: 'var(--admin-text-3)', fontFamily: 'var(--admin-font-mono)' }}>
											{p.path}
										</div>
									</div>
								</div>

								<span className="admin-badge badge-primary">
									已启用
								</span>
							</div>

							<div style={{ fontSize: 12, color: 'var(--admin-text-2)', lineHeight: 1.5, margin: '6px 0' }}>
								{p.description}
							</div>

							<div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
								<span style={{ fontSize: 10, color: 'var(--admin-text-3)', marginRight: 4 }}>页面挂件:</span>
								{p.widgets.map(w => (
									<span key={w} className="admin-badge badge-secondary" style={{ fontSize: 10 }}>
										{w}
									</span>
								))}
							</div>
						</div>

						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--admin-border)', paddingTop: 10 }}>
							<a
								href={p.path}
								target="_blank"
								rel="noreferrer"
								style={{ fontSize: 11, color: 'var(--admin-accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
							>
								<Icon icon="tabler:external-link" />
								<span>访问页面</span>
							</a>

							<button
								type="button"
								className="admin-btn btn-secondary btn-sm"
								onClick={() => setEditingPage({ ...p })}
							>
								<Icon icon="tabler:edit" />
								<span>配置元数据</span>
							</button>
						</div>
					</div>
				))}
			</div>

			{/* 页面编辑弹窗 */}
			{editingPage && (
				<div className="admin-modal-overlay">
					<div className="admin-modal-box" style={{ maxWidth: 480 }}>
						<div className="modal-header">
							<div className="modal-title">配置页面元数据: {editingPage.title}</div>
							<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => setEditingPage(null)}>
								<Icon icon="tabler:x" />
							</button>
						</div>

						<div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
							<div>
								<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
									页面标题 *
								</label>
								<input
									type="text"
									className="admin-input"
									value={editingPage.title}
									onChange={e => setEditingPage({ ...editingPage, title: e.target.value })}
								/>
							</div>

							<div>
								<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
									副标题 / Slogan
								</label>
								<input
									type="text"
									className="admin-input"
									value={editingPage.subtitle}
									onChange={e => setEditingPage({ ...editingPage, subtitle: e.target.value })}
								/>
							</div>

							<div>
								<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
									SEO 描述
								</label>
								<textarea
									className="admin-textarea"
									value={editingPage.description}
									onChange={e => setEditingPage({ ...editingPage, description: e.target.value })}
									style={{ height: 60 }}
								/>
							</div>
						</div>

						<div className="modal-footer">
							<button type="button" className="admin-btn btn-secondary btn-sm" onClick={() => setEditingPage(null)}>
								取消
							</button>
							<button type="button" className="admin-btn btn-primary btn-sm" onClick={handleSavePage}>
								保存设置
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default PageBuilderView

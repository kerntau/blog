import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import type { PostMeta } from '../types'
import { DevicePreviewFrame } from '../components/DevicePreviewFrame'

export const PreviewCenterView: React.FC = () => {
	const [activePage, setActivePage] = useState<'home' | 'post' | 'archive' | 'link' | 'theme'>('home')
	const [posts, setPosts] = useState<PostMeta[]>([])
	const [selectedPostPath, setSelectedPostPath] = useState<string>('')
	const [iframeKey, setIframeKey] = useState<number>(Date.now())

	useEffect(() => {
		adminApi.getPosts()
			.then((list) => {
				setPosts(list)
				if (list.length > 0) {
					setSelectedPostPath(list[0]?.path || '')
				}
			})
			.catch(() => {})
	}, [])

	const getPreviewUrl = () => {
		if (activePage === 'home') return '/'
		if (activePage === 'archive') return '/archive'
		if (activePage === 'link') return '/link'
		if (activePage === 'theme') return '/preview'
		if (activePage === 'post') {
			if (selectedPostPath) {
				const rel = selectedPostPath.replace(/^.*[\\/]content[\\/]posts[\\/]/, '').replace(/\.(md|mdx)$/i, '')
				return `/${rel}`
			}
			return '/'
		}
		return '/'
	}

	const currentUrl = getPreviewUrl()

	const handleRefresh = () => {
		setIframeKey(Date.now())
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: 'calc(100vh - 100px)', width: '100%' }}>
			{/* 顶栏操作 */}
			<div className="admin-card" style={{ padding: '10px 16px', flexShrink: 0 }}>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
						<div style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
							<Icon icon="tabler:device-laptop" style={{ color: 'var(--admin-accent)' }} />
							<span>全站独立多设备预览中心</span>
						</div>

						{/* 页面切换 */}
						<div style={{ display: 'flex', background: 'var(--admin-bg-subtle)', padding: 2, borderRadius: 6, border: '1px solid var(--admin-border)', gap: 2 }}>
							{[
								{ id: 'home', name: '博客主页' },
								{ id: 'post', name: '文章详情' },
								{ id: 'archive', name: '归档页面' },
								{ id: 'link', name: '友链页面' },
								{ id: 'theme', name: '未发布预览' },
							].map(p => (
								<button
									key={p.id}
									type="button"
									className={`admin-btn ${activePage === p.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}
									onClick={() => setActivePage(p.id as any)}
									style={{ height: 26, fontSize: 12 }}
								>
									<span>{p.name}</span>
								</button>
							))}
						</div>
					</div>

					{/* 若为文章详情，展示文章下拉列表 */}
					{activePage === 'post' && posts.length > 0 && (
						<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
							<span style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>挑选文章:</span>
							<select
								className="admin-select"
								value={selectedPostPath}
								onChange={e => setSelectedPostPath(e.target.value)}
								style={{ height: 28, fontSize: 12, maxWidth: 220 }}
							>
								{posts.map(p => (
									<option key={p.path} value={p.path}>
										{p.title}
									</option>
								))}
							</select>
						</div>
					)}
				</div>
			</div>

			{/* 视口舞台容器 */}
			<div style={{ flex: 1, minHeight: 0 }}>
				<DevicePreviewFrame
					title={`实时预览: ${currentUrl}`}
					externalUrl={currentUrl}
					onRefresh={handleRefresh}
				>
					<iframe
						key={iframeKey}
						src={currentUrl}
						title="Live Preview Iframe"
						style={{
							width: '100%',
							height: '100%',
							minHeight: '80vh',
							border: 'none',
							background: 'var(--admin-bg)',
						}}
					/>
				</DevicePreviewFrame>
			</div>
		</div>
	)
}

export default PreviewCenterView

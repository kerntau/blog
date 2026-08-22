import React, { useState } from 'react'
import { Icon } from '@iconify/react'
import { useTheme } from 'next-themes'
import './styles/admin.scss'

import { DashboardView } from './views/DashboardView'
import { PostListView } from './views/PostListView'
import { PostEditorView } from './views/PostEditorView'
import { FeedManagerView } from './views/FeedManagerView'
import { ConfigManagerView } from './views/ConfigManagerView'
import { AssetManagerView } from './views/AssetManagerView'
import { ConsoleView } from './views/ConsoleView'
import { ToastProvider } from './components/Toast'
import { useServiceHealth } from './hooks/useServiceHealth'

export const AdminAppContent: React.FC = () => {
	const [activeTab, setActiveTab] = useState<string>('dashboard')
	const [editingPostPath, setEditingPostPath] = useState<string | undefined>(undefined)
	const { theme, setTheme } = useTheme()
	const { status: serviceStatus, recheck } = useServiceHealth()

	const handleNavigate = (tab: string, params?: any) => {
		if (tab === 'posts-new') {
			setEditingPostPath(undefined)
			setActiveTab('editor')
		}
		else if (tab === 'posts-edit') {
			setEditingPostPath(params?.path)
			setActiveTab('editor')
		}
		else {
			setActiveTab(tab)
		}
	}

	const toggleTheme = () => {
		setTheme(theme === 'dark' ? 'light' : 'dark')
	}

	return (
		<div className="admin-layout">
			{/* 左侧固定侧边栏 */}
			<aside className="admin-sidebar">
				<div className="sidebar-brand">
					<div className="brand-logo">
						<img
							src="/avatar.png"
							alt="Avatar"
							onError={e => (e.currentTarget.style.display = 'none')}
						/>
					</div>
					<div className="brand-info">
						<span className="brand-title">后台管理系统</span>
						<span className="brand-badge">Local</span>
					</div>
				</div>

				<nav className="sidebar-nav">
					<div className="nav-group-title">内容与统计</div>
					<div
						className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
						onClick={() => handleNavigate('dashboard')}
					>
						<Icon icon="tabler:layout-dashboard" className="nav-icon" />
						<span>概览看板</span>
					</div>

					<div
						className={`nav-item ${activeTab === 'posts' || activeTab === 'editor' ? 'active' : ''}`}
						onClick={() => handleNavigate('posts')}
					>
						<Icon icon="tabler:file-text" className="nav-icon" />
						<span>文章工坊</span>
					</div>

					<div
						className={`nav-item ${activeTab === 'feeds' ? 'active' : ''}`}
						onClick={() => handleNavigate('feeds')}
					>
						<Icon icon="tabler:users-group" className="nav-icon" />
						<span>友链治理</span>
					</div>

					<div className="nav-group-title" style={{ marginTop: 8 }}>系统与资源</div>
					<div
						className={`nav-item ${activeTab === 'config' ? 'active' : ''}`}
						onClick={() => handleNavigate('config')}
					>
						<Icon icon="tabler:adjustments" className="nav-icon" />
						<span>站点配置</span>
					</div>

					<div
						className={`nav-item ${activeTab === 'assets' ? 'active' : ''}`}
						onClick={() => handleNavigate('assets')}
					>
						<Icon icon="tabler:photo" className="nav-icon" />
						<span>媒体资产</span>
					</div>

					<div
						className={`nav-item ${activeTab === 'console' ? 'active' : ''}`}
						onClick={() => handleNavigate('console')}
					>
						<Icon icon="tabler:terminal-2" className="nav-icon" />
						<span>构建运维</span>
					</div>
				</nav>

				<div className="sidebar-footer">
					<a href="/" target="_blank" rel="noreferrer" className="footer-btn" title="查看前台博客">
						<Icon icon="tabler:external-link" />
						<span>前台站点</span>
					</a>
					<button type="button" className="footer-btn" onClick={toggleTheme} title="切换明暗主题">
						<Icon icon={theme === 'dark' ? 'tabler:sun' : 'tabler:moon'} />
					</button>
				</div>
			</aside>

			{/* 主工作区 */}
			<main className="admin-main">
				{/* 顶栏 */}
				<header className="admin-topbar">
					<div className="topbar-left">
						<div className="page-title">
							{activeTab === 'dashboard' && '概览仪表盘'}
							{activeTab === 'posts' && '文章内容管理'}
							{activeTab === 'editor' && (editingPostPath ? '编辑文章' : '新建文章')}
							{activeTab === 'feeds' && '友链与订阅源治理'}
							{activeTab === 'config' && '站点与组件配置中心'}
							{activeTab === 'assets' && '媒体资产库'}
							{activeTab === 'console' && '构建与运维控制台'}
						</div>
					</div>

					<div className="topbar-right">
						{/* 极简服务状态指示 */}
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 6,
								padding: '4px 8px',
								borderRadius: 4,
								background: 'var(--admin-surface)',
								border: '1px solid var(--admin-border)',
								fontSize: 12,
								cursor: 'pointer',
								userSelect: 'none',
							}}
							onClick={recheck}
							title="点击重试探测本地 API 服务"
						>
							<span
								style={{
									width: 6,
									height: 6,
									borderRadius: '50%',
									background:
										serviceStatus === 'online'
											? 'var(--admin-success)'
											: serviceStatus === 'offline'
												? 'var(--admin-danger)'
												: 'var(--admin-warning)',
								}}
							/>
							<span style={{ color: 'var(--admin-text-2)', fontSize: 11 }}>
								{serviceStatus === 'online' ? 'API 在线' : serviceStatus === 'offline' ? 'API 离线' : '探测中'}
							</span>
						</div>

						<a
							href="/"
							className="admin-btn btn-secondary btn-sm"
							style={{ textDecoration: 'none' }}
						>
							<Icon icon="tabler:arrow-up-right" />
							<span>前台</span>
						</a>
					</div>
				</header>

				{/* 离线警示横条 */}
				{serviceStatus === 'offline' && (
					<div
						style={{
							padding: '8px 24px',
							background: 'var(--admin-danger-soft)',
							color: 'var(--admin-danger)',
							fontSize: 12,
							fontWeight: 500,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
							<Icon icon="tabler:alert-triangle" style={{ fontSize: 16 }} />
							<span>本地管理 API 引擎未响应（端口 3001）。系统已自动通过 <code>pnpm dev</code> 启动，正在等待端口就绪...</span>
						</div>
						<button type="button" className="admin-btn btn-secondary btn-sm" onClick={recheck}>
							重试
						</button>
					</div>
				)}

				{/* 视图分发视口 */}
				<div className="admin-content">
					{activeTab === 'dashboard' && (
						<DashboardView onNavigate={handleNavigate} />
					)}

					{activeTab === 'posts' && (
						<PostListView
							onEditPost={path => handleNavigate('posts-edit', { path })}
							onNewPost={() => handleNavigate('posts-new')}
						/>
					)}

					{activeTab === 'editor' && (
						<PostEditorView
							postPath={editingPostPath}
							onBack={() => handleNavigate('posts')}
							onSaved={() => {}}
						/>
					)}

					{activeTab === 'feeds' && <FeedManagerView />}

					{activeTab === 'config' && <ConfigManagerView />}

					{activeTab === 'assets' && (
						<AssetManagerView
							onNavigatePost={path => handleNavigate('posts-edit', { path })}
						/>
					)}

					{activeTab === 'console' && <ConsoleView />}
				</div>
			</main>
		</div>
	)
}

export const AdminApp: React.FC = () => {
	return (
		<ToastProvider>
			<AdminAppContent />
		</ToastProvider>
	)
}

export default AdminApp

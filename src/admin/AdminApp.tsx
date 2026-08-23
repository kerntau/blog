import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { useTheme } from 'next-themes'
import './styles/admin.scss'

import { DashboardView } from './views/DashboardView'
import { PostListView } from './views/PostListView'
import { PostEditorView } from './views/PostEditorView'
import { CategoryTagView } from './views/CategoryTagView'
import { FeedManagerView } from './views/FeedManagerView'
import { NavManagerView } from './views/NavManagerView'
import { WidgetManagerView } from './views/WidgetManagerView'
import { SettingsView } from './views/SettingsView'
import { BackupManagerView } from './views/BackupManagerView'
import { AssetManagerView } from './views/AssetManagerView'
import { CommandPalette } from './components/CommandPalette'
import { ShortcutHelpModal } from './components/ShortcutHelpModal'
import { ToastProvider } from './components/Toast'
import { useServiceHealth } from './hooks/useServiceHealth'

import { adminApi } from './api'
import appConfig from '../app.config'

export const AdminAppContent: React.FC = () => {
	const [activeTab, setActiveTab] = useState<string>('dashboard')
	const [editingPostPath, setEditingPostPath] = useState<string | undefined>(undefined)
	const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
	const [showCommandPalette, setShowCommandPalette] = useState(false)
	const [showShortcutHelp, setShowShortcutHelp] = useState(false)
	const { theme, setTheme } = useTheme()
	const { status: serviceStatus, recheck } = useServiceHealth()

	// 统一站点身份数据源
	const [siteProfile, setSiteProfile] = useState<{ authorName: string, authorAvatar: string, title: string }>({
		authorName: appConfig.author.name || 'kerntau',
		authorAvatar: appConfig.author.avatar || '/avatar.webp',
		title: appConfig.title || 'kerntau',
	})

	const loadSiteProfile = async () => {
		try {
			const info = await adminApi.getSiteInfo()
			if (info && info.authorAvatar) {
				setSiteProfile({
					authorName: info.authorName || appConfig.author.name,
					authorAvatar: info.authorAvatar || appConfig.author.avatar,
					title: info.title || appConfig.title,
				})
			}
		}
		catch {}
	}

	useEffect(() => {
		loadSiteProfile()

		const handleSiteInfoUpdated = (e: any) => {
			if (e.detail) {
				setSiteProfile({
					authorName: e.detail.authorName || appConfig.author.name,
					authorAvatar: e.detail.authorAvatar || appConfig.author.avatar,
					title: e.detail.title || appConfig.title,
				})
			}
		}
		window.addEventListener('site-info-updated', handleSiteInfoUpdated)
		return () => window.removeEventListener('site-info-updated', handleSiteInfoUpdated)
	}, [])

	const handleNavigate = (tab: string, params?: any) => {
		setMobileSidebarOpen(false)
		if (tab === 'posts-new') {
			setEditingPostPath(undefined)
			setActiveTab('editor')
		}
		else if (tab === 'posts-edit') {
			setEditingPostPath(params?.path)
			setActiveTab('editor')
		}
		else if (tab === 'seo' || tab === 'themes') {
			// 旧路由平滑重定向至统一设置中心
			setActiveTab('settings')
		}
		else {
			setActiveTab(tab)
		}
	}

	const [mounted, setMounted] = useState(false)
	useEffect(() => {
		setMounted(true)
	}, [])

	const toggleTheme = () => {
		const isCurrentDark = theme === 'dark' || (theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)
		setTheme(isCurrentDark ? 'light' : 'dark')
	}

	// 快捷键监听 (Ctrl+K 命令面板, ? 帮助)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const activeTag = (document.activeElement?.tagName || '').toLowerCase()
			const isInputActive = activeTag === 'input' || activeTag === 'textarea'

			if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
				e.preventDefault()
				setShowCommandPalette(prev => !prev)
			}
			else if (e.key === '?' && !isInputActive && !e.ctrlKey && !e.metaKey) {
				e.preventDefault()
				setShowShortcutHelp(prev => !prev)
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [])

	return (
		<div className="admin-layout">
			{/* 移动端遮罩层 */}
			{mobileSidebarOpen && (
				<div
					style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90 }}
					onClick={() => setMobileSidebarOpen(false)}
				/>
			)}

			{/* 左侧固定侧边栏 */}
			<aside className={`admin-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
				<div className="sidebar-brand">
					<div className="brand-logo">
						<img
							src={siteProfile.authorAvatar}
							alt={siteProfile.authorName}
							onError={e => (e.currentTarget.src = '/favicon.ico')}
						/>
					</div>
					<div className="brand-info">
						<span className="brand-title">{siteProfile.title} 控制台</span>
						<span className="brand-badge">Native Admin</span>
					</div>
				</div>

				<nav className="sidebar-nav">
					{/* 1. 总览 */}
					<div className="nav-group-title">总览</div>
					<div
						className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
						onClick={() => handleNavigate('dashboard')}
					>
						<Icon icon="tabler:layout-dashboard" className="nav-icon" />
						<span>概览仪表盘</span>
					</div>

					{/* 2. 内容 */}
					<div className="nav-group-title" style={{ marginTop: 10 }}>内容管理</div>
					<div
						className={`nav-item ${activeTab === 'posts' || activeTab === 'editor' ? 'active' : ''}`}
						onClick={() => handleNavigate('posts')}
					>
						<Icon icon="tabler:file-text" className="nav-icon" />
						<span>文章管理</span>
					</div>

					<div
						className={`nav-item ${activeTab === 'categories' ? 'active' : ''}`}
						onClick={() => handleNavigate('categories')}
					>
						<Icon icon="tabler:category" className="nav-icon" />
						<span>分类与标签</span>
					</div>

					<div
						className={`nav-item ${activeTab === 'feeds' ? 'active' : ''}`}
						onClick={() => handleNavigate('feeds')}
					>
						<Icon icon="tabler:users-group" className="nav-icon" />
						<span>友链管理</span>
					</div>

					<div
						className={`nav-item ${activeTab === 'assets' ? 'active' : ''}`}
						onClick={() => handleNavigate('assets')}
					>
						<Icon icon="tabler:photo" className="nav-icon" />
						<span>媒体资源</span>
					</div>

					{/* 3. 展示 */}
					<div className="nav-group-title" style={{ marginTop: 10 }}>展示管理</div>
					<div
						className={`nav-item ${activeTab === 'navigation' ? 'active' : ''}`}
						onClick={() => handleNavigate('navigation')}
					>
						<Icon icon="tabler:compass" className="nav-icon" />
						<span>导航管理</span>
					</div>

					<div
						className={`nav-item ${activeTab === 'widgets' ? 'active' : ''}`}
						onClick={() => handleNavigate('widgets')}
					>
						<Icon icon="tabler:layout-sidebar" className="nav-icon" />
						<span>侧栏挂件</span>
					</div>

					{/* 4. 设置 */}
					<div className="nav-group-title" style={{ marginTop: 10 }}>全局配置</div>
					<div
						className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
						onClick={() => handleNavigate('settings')}
					>
						<Icon icon="tabler:settings" className="nav-icon" />
						<span>站点设置</span>
					</div>

					{/* 5. 系统 */}
					<div className="nav-group-title" style={{ marginTop: 10 }}>系统运维</div>
					<div
						className={`nav-item ${activeTab === 'backup' ? 'active' : ''}`}
						onClick={() => handleNavigate('backup')}
					>
						<Icon icon="tabler:database-export" className="nav-icon" />
						<span>数据备份</span>
					</div>
				</nav>

				<div className="sidebar-footer">
					<a href="/" target="_blank" rel="noreferrer" className="footer-btn" title="在新标签页查看前台站点">
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
						{/* 移动端菜单按钮 */}
						<button
							type="button"
							className="admin-btn btn-ghost btn-sm mobile-only"
							onClick={() => setMobileSidebarOpen(true)}
							style={{ marginRight: 6 }}
						>
							<Icon icon="tabler:menu-2" style={{ fontSize: 18 }} />
						</button>

						<div className="page-title">
							{activeTab === 'dashboard' && '概览仪表盘'}
							{activeTab === 'posts' && '文章管理'}
							{activeTab === 'editor' && (editingPostPath ? '编辑文章' : '新建文章')}
							{activeTab === 'categories' && '分类与标签'}
							{activeTab === 'feeds' && '友链管理'}
							{activeTab === 'assets' && '媒体资源'}
							{activeTab === 'navigation' && '导航管理'}
							{activeTab === 'widgets' && '侧栏挂件'}
							{activeTab === 'settings' && '站点设置'}
							{activeTab === 'backup' && '数据备份与快照'}
						</div>
					</div>

					<div className="topbar-right">
						{/* 全局快捷搜索条 (Ctrl+K) */}
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 6,
								padding: '4px 10px',
								borderRadius: 6,
								background: 'var(--admin-surface)',
								border: '1px solid var(--admin-border)',
								fontSize: 12,
								cursor: 'pointer',
								color: 'var(--admin-text-3)',
								userSelect: 'none',
							}}
							onClick={() => setShowCommandPalette(true)}
							title="全局功能搜索与快捷命令 (Ctrl+K / ⌘K)"
						>
							<Icon icon="tabler:search" />
							<span>搜索功能 / 文章...</span>
							<span className="admin-badge badge-secondary" style={{ fontSize: 10, padding: '1px 4px' }}>⌘K</span>
						</div>

						{/* API 服务状态指示 */}
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

						{/* 快捷键帮助按钮 */}
						<button
							type="button"
							className="admin-btn btn-secondary btn-sm"
							onClick={() => setShowShortcutHelp(true)}
							title="快捷键操作指南 (?)"
							style={{ padding: '0 8px' }}
						>
							<Icon icon="tabler:help" style={{ fontSize: 15 }} />
						</button>

						{/* 明暗模式切换 */}
						<button
							type="button"
							className="admin-btn btn-secondary btn-sm"
							onClick={toggleTheme}
							title="切换明暗主题 (深色 / 浅色)"
							style={{ padding: '0 8px' }}
						>
							<Icon icon={mounted && (theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)) ? 'tabler:sun' : 'tabler:moon'} style={{ fontSize: 15 }} />
						</button>

						<a
							href="/"
							target="_blank"
							rel="noreferrer"
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

					{activeTab === 'categories' && <CategoryTagView />}

					{activeTab === 'feeds' && <FeedManagerView />}

					{activeTab === 'assets' && (
						<AssetManagerView
							onNavigatePost={path => handleNavigate('posts-edit', { path })}
						/>
					)}

					{activeTab === 'navigation' && <NavManagerView />}

					{activeTab === 'widgets' && <WidgetManagerView />}

					{activeTab === 'settings' && <SettingsView />}

					{activeTab === 'backup' && <BackupManagerView />}
				</div>
			</main>

			{/* 全局命令面板 */}
			<CommandPalette
				isOpen={showCommandPalette}
				onClose={() => setShowCommandPalette(false)}
				onNavigate={handleNavigate}
			/>

			{/* 快捷键帮助弹窗 */}
			<ShortcutHelpModal
				isOpen={showShortcutHelp}
				onClose={() => setShowShortcutHelp(false)}
			/>
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

import React, { useState, useEffect, useMemo } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import type { CategoryItem, FeedGroup, PostMeta } from '../types'

interface CommandPaletteProps {
	isOpen: boolean
	onClose: () => void
	onNavigate: (tab: string, params?: any) => void
}

interface CommandOption {
	id: string
	title: string
	subtitle?: string
	icon: string
	category: 'action' | 'post' | 'category' | 'feed' | 'nav' | 'setting'
	action: () => void
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
	const [query, setQuery] = useState('')
	const [selectedIndex, setSelectedIndex] = useState(0)
	const [posts, setPosts] = useState<PostMeta[]>([])
	const [categories, setCategories] = useState<CategoryItem[]>([])
	const [feeds, setFeeds] = useState<FeedGroup[]>([])

	useEffect(() => {
		if (isOpen) {
			setQuery('')
			setSelectedIndex(0)
			adminApi.getPosts().then(setPosts).catch(() => {})
			adminApi.getCategories().then(setCategories).catch(() => {})
			adminApi.getFeeds().then(setFeeds).catch(() => {})
		}
	}, [isOpen])

	const staticActions: CommandOption[] = useMemo(() => [
		{
			id: 'action-dashboard',
			title: '概览仪表盘 (Dashboard)',
			subtitle: '总览 · 网站指标、最近内容与系统状态',
			icon: 'tabler:layout-dashboard',
			category: 'action',
			action: () => {
				onNavigate('dashboard')
				onClose()
			},
		},
		{
			id: 'action-new-post',
			title: '新建文章 (New Post)',
			subtitle: '内容 · 进入 MDX 编辑器开始创作',
			icon: 'tabler:file-plus',
			category: 'action',
			action: () => {
				onNavigate('posts-new')
				onClose()
			},
		},
		{
			id: 'action-posts',
			title: '文章管理 (Posts)',
			subtitle: '内容 · 文章列表、筛选、批量操作与历史版本',
			icon: 'tabler:file-text',
			category: 'action',
			action: () => {
				onNavigate('posts')
				onClose()
			},
		},
		{
			id: 'action-categories',
			title: '分类与标签 (Categories & Tags)',
			subtitle: '内容 · 管理分类图标、主题色与标签矩阵',
			icon: 'tabler:category',
			category: 'action',
			action: () => {
				onNavigate('categories')
				onClose()
			},
		},
		{
			id: 'action-feeds',
			title: '友链管理 (Feeds & Friends)',
			subtitle: '内容 · 友链分组、FeedCard 实时预览与智能嗅探',
			icon: 'tabler:users-group',
			category: 'action',
			action: () => {
				onNavigate('feeds')
				onClose()
			},
		},
		{
			id: 'action-assets',
			title: '媒体资源 (Media & Assets)',
			subtitle: '内容 · 静态图片与文件上传、反向引用安全扫描',
			icon: 'tabler:photo',
			category: 'action',
			action: () => {
				onNavigate('assets')
				onClose()
			},
		},
		{
			id: 'action-nav',
			title: '导航管理 (Navigation)',
			subtitle: '展示 · 主侧栏导航、底部图标与页脚站点地图',
			icon: 'tabler:compass',
			category: 'action',
			action: () => {
				onNavigate('navigation')
				onClose()
			},
		},
		{
			id: 'action-widgets',
			title: '侧栏挂件 (Aside Widgets)',
			subtitle: '展示 · 博客统计、技术栈、社区群、更新日志卡片内容维护',
			icon: 'tabler:layout-sidebar',
			category: 'action',
			action: () => {
				onNavigate('widgets')
				onClose()
			},
		},
		{
			id: 'action-settings',
			title: '站点设置 (Site Settings)',
			subtitle: '设置 · 基础信息、作者、SEO、展示策略与内容渲染',
			icon: 'tabler:settings',
			category: 'setting',
			action: () => {
				onNavigate('settings')
				onClose()
			},
		},
		{
			id: 'action-backup',
			title: '数据备份与体检 (Backup & Integrity)',
			subtitle: '系统 · 全量数据导出备份、JSON一键还原与体检修复',
			icon: 'tabler:database',
			category: 'action',
			action: () => {
				onNavigate('backup')
				onClose()
			},
		},
		{
			id: 'action-console',
			title: '构建与运行 (Build & DevOps)',
			subtitle: '系统 · 触发全站静态索引与 Atom XML 构建刷新',
			icon: 'tabler:terminal-2',
			category: 'action',
			action: () => {
				onNavigate('console')
				onClose()
			},
		},
	], [onNavigate, onClose])

	const filteredOptions: CommandOption[] = useMemo(() => {
		const q = query.toLowerCase().trim()
		if (!q) return staticActions

		const matchedActions = staticActions.filter(a =>
			a.title.toLowerCase().includes(q) || (a.subtitle || '').toLowerCase().includes(q),
		)

		const matchedPosts: CommandOption[] = posts
			.filter(p => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
			.slice(0, 5)
			.map(p => ({
				id: `post-${p.slug}`,
				title: p.title,
				subtitle: `文章 · ${p.date || '无日期'} · ${p.categories?.[0] || '默认分类'}`,
				icon: 'tabler:file-text',
				category: 'post',
				action: () => {
					onNavigate('posts-edit', { path: p.path })
					onClose()
				},
			}))

		const matchedCategories: CommandOption[] = categories
			.filter(c => c.name.toLowerCase().includes(q))
			.slice(0, 4)
			.map(c => ({
				id: `cat-${c.name}`,
				title: `分类: ${c.name}`,
				subtitle: `包含 ${c.count} 篇文章`,
				icon: c.icon || 'tabler:folder',
				category: 'category',
				action: () => {
					onNavigate('categories')
					onClose()
				},
			}))

		const matchedFeeds: CommandOption[] = feeds
			.flatMap(g => g.entries)
			.filter(e => e.author.toLowerCase().includes(q) || e.link.toLowerCase().includes(q) || (e.desc || '').toLowerCase().includes(q))
			.slice(0, 4)
			.map(e => ({
				id: `feed-${e.author}`,
				title: `友链: ${e.author}`,
				subtitle: e.link,
				icon: 'tabler:link',
				category: 'feed',
				action: () => {
					onNavigate('feeds')
					onClose()
				},
			}))

		return [...matchedActions, ...matchedPosts, ...matchedCategories, ...matchedFeeds]
	}, [query, staticActions, posts, categories, feeds, onNavigate, onClose])

	useEffect(() => {
		setSelectedIndex(0)
	}, [filteredOptions])

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'ArrowDown') {
			e.preventDefault()
			setSelectedIndex(prev => (prev + 1) % filteredOptions.length)
		}
		else if (e.key === 'ArrowUp') {
			e.preventDefault()
			setSelectedIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length)
		}
		else if (e.key === 'Enter') {
			e.preventDefault()
			const target = filteredOptions[selectedIndex]
			if (target) target.action()
		}
		else if (e.key === 'Escape') {
			e.preventDefault()
			onClose()
		}
	}

	if (!isOpen) return null

	return (
		<div className="admin-modal-overlay" onClick={onClose}>
			<div
				className="admin-modal-box"
				style={{ maxWidth: 580, padding: 0, overflow: 'hidden' }}
				onClick={e => e.stopPropagation()}
			>
				{/* 搜索输入栏 */}
				<div
					style={{
						padding: '14px 18px',
						display: 'flex',
						alignItems: 'center',
						gap: 10,
						borderBottom: '1px solid var(--admin-border)',
					}}
				>
					<Icon icon="tabler:search" style={{ fontSize: 18, color: 'var(--admin-accent)' }} />
					<input
						type="text"
						className="admin-input"
						placeholder="搜索功能、文章、分类、友链、设置... (↑↓ 选择，Enter 执行，Esc 退出)"
						value={query}
						onChange={e => setQuery(e.target.value)}
						onKeyDown={handleKeyDown}
						style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, padding: 0 }}
						autoFocus
					/>
					<span className="admin-badge badge-secondary" style={{ fontSize: 10 }}>ESC</span>
				</div>

				{/* 结果列表 */}
				<div style={{ maxHeight: 360, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
					{filteredOptions.length === 0 ? (
						<div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--admin-text-3)', fontSize: 12 }}>
							未找到相关命令或资源
						</div>
					) : (
						filteredOptions.map((opt, idx) => {
							const isSelected = selectedIndex === idx
							return (
								<div
									key={opt.id}
									onClick={opt.action}
									onMouseEnter={() => setSelectedIndex(idx)}
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										padding: '8px 12px',
										borderRadius: 6,
										background: isSelected ? 'var(--admin-surface-hover)' : 'transparent',
										cursor: 'pointer',
										border: isSelected ? '1px solid var(--admin-border)' : '1px solid transparent',
										transition: 'background 0.1s ease',
									}}
								>
									<div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
										<div
											style={{
												width: 28,
												height: 28,
												borderRadius: 6,
												background: isSelected ? 'var(--admin-accent-soft)' : 'var(--admin-bg-subtle)',
												color: isSelected ? 'var(--admin-accent)' : 'var(--admin-text-2)',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												fontSize: 16,
												flexShrink: 0,
											}}
										>
											<Icon icon={opt.icon} />
										</div>
										<div style={{ minWidth: 0 }}>
											<div style={{ fontSize: 13, fontWeight: 500, color: 'var(--admin-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
												{opt.title}
											</div>
											{opt.subtitle && (
												<div style={{ fontSize: 11, color: 'var(--admin-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
													{opt.subtitle}
												</div>
											)}
										</div>
									</div>

									{isSelected && (
										<Icon icon="tabler:corner-down-left" style={{ fontSize: 14, color: 'var(--admin-text-3)' }} />
									)}
								</div>
							)
						})
					)}
				</div>

				{/* 底部提示栏 */}
				<div
					style={{
						padding: '6px 14px',
						borderTop: '1px solid var(--admin-border)',
						background: 'var(--admin-bg-subtle)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						fontSize: 11,
						color: 'var(--admin-text-3)',
					}}
				>
					<span>全局快捷键 <code>Ctrl + K</code> 随时呼出</span>
					<div style={{ display: 'flex', gap: 8 }}>
						<span><code>↑↓</code> 导航</span>
						<span><code>↵</code> 打开</span>
					</div>
				</div>
			</div>
		</div>
	)
}

export default CommandPalette

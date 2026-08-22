import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import type { WidgetConfigData, TechServiceItem, TechStackItem, WidgetLogItem } from '../types'
import { useToast } from '../components/Toast'
import { IconPickerModal } from '../components/IconPickerModal'
import BlogStats from '../../components/widget/BlogStats'
import BlogTech from '../../components/widget/BlogTech'
import CommGroup from '../../components/widget/CommGroup'
import BlogLog from '../../components/widget/BlogLog'

const PRESET_ICONS = [
	{ name: 'React', icon: 'logos:react' },
	{ name: 'Vue', icon: 'logos:vue' },
	{ name: 'Next.js', icon: 'logos:nextjs-icon' },
	{ name: 'Rsbuild', icon: 'tabler:bolt', color: '#F85D00' },
	{ name: 'TypeScript', icon: 'logos:typescript-icon' },
	{ name: 'MDX', icon: 'simple-icons:mdx', color: '#FCB32C' },
	{ name: 'Node.js', icon: 'logos:nodejs-icon' },
	{ name: 'pnpm', icon: 'logos:pnpm' },
	{ name: 'Motion', icon: 'simple-icons:framer', color: '#0055FF' },
	{ name: 'Sass', icon: 'logos:sass' },
	{ name: 'Tailwind', icon: 'logos:tailwindcss-icon' },
	{ name: 'Cloudflare', icon: 'devicon:cloudflare' },
	{ name: 'Docker', icon: 'logos:docker-icon' },
	{ name: 'Rust', icon: 'logos:rust' },
	{ name: 'Python', icon: 'logos:python' },
	{ name: 'Go', icon: 'logos:go' },
]

export const WidgetManagerView: React.FC = () => {
	const { showToast } = useToast()
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [activeSection, setActiveSection] = useState<'layout' | 'tech' | 'commGroup' | 'log' | 'stats'>('layout')
	const [activePage, setActivePage] = useState<'home' | 'archive' | 'post' | 'link'>('home')

	const [iconPickerOpen, setIconPickerOpen] = useState(false)
	const [iconPickerTarget, setIconPickerTarget] = useState<{
		type: 'techService' | 'techStack' | 'commGroup'
		index?: number
		currentIcon?: string
	} | null>(null)

	const [widgetData, setWidgetData] = useState<WidgetConfigData>({
		availableWidgets: [],
		pageAsideMappings: {
			home: ['blog-stats', 'blog-tech', 'comm-group'],
			archive: ['blog-stats', 'blog-log'],
			post: ['toc'],
			link: ['blog-stats', 'comm-group'],
		},
		statsConfig: {
			birthYear: 2006,
			wordCount: '约12万',
		},
		tech: {
			title: '技术信息',
			services: [
				{ label: '部署平台', value: 'EdgeOne', icon: 'ri:tencent-cloud-fill', iconColor: '#0052D9' },
				{ label: '图片存储', value: 'Cloudflare R2', icon: 'devicon:cloudflare', iconColor: '' },
				{ label: '开源协议', value: 'MIT', icon: 'tabler:license', iconColor: '#F59E0B' },
				{ label: '文章许可', value: 'CC BY-NC-SA 4.0', icon: '', iconColor: '' },
				{ label: '规范域名', value: 'cot.wiki', icon: '', iconColor: '' },
			],
			techstack: [
				{ name: 'React', version: '^19.0.0', icon: 'logos:react', iconColor: '' },
				{ name: 'Rsbuild', version: '^2.1.13', icon: 'tabler:bolt', iconColor: '#F85D00' },
				{ name: 'TS', version: '^5.8.0', icon: 'logos:typescript-icon', iconColor: '' },
				{ name: 'MDX', version: '^3.1.0', icon: 'simple-icons:mdx', iconColor: '#FCB32C' },
				{ name: 'Node', version: '^22.0.0', icon: 'logos:nodejs-icon', iconColor: '' },
				{ name: 'pnpm', version: '11.0.4', icon: 'logos:pnpm', iconColor: '' },
				{ name: 'Motion', version: '^12.4.7', icon: 'simple-icons:framer', iconColor: '#0055FF' },
				{ name: 'Sass', version: '^1.99.0', icon: 'logos:sass', iconColor: '' },
			],
		},
		commGroup: {
			title: '博客/技术社区',
			groupName: '纸网接入点',
			account: '169994096',
			icon: 'ri:qq-fill',
			bgImg: '',
		},
		log: {
			title: '更新日志',
			items: [
				{ date: '2025-07-26', content: '重构至 React 19 + Rsbuild，迁移架构' },
				{ date: '2024-08-11', content: '重构至 Next.js / Content 架构' },
				{ date: '2023-05-24', content: '迁移为 Hexo，使用 Butterfly 主题' },
				{ date: '2020-08-24', content: '使用 blog 独立域名' },
			],
		},
	})

	const loadWidgets = async () => {
		setLoading(true)
		try {
			const data = await adminApi.getWidgets()
			setWidgetData(prev => ({
				...prev,
				...data,
				tech: data.tech || prev.tech,
				commGroup: data.commGroup || prev.commGroup,
				log: data.log || prev.log,
				statsConfig: data.statsConfig || prev.statsConfig,
			}))
		}
		catch (err: any) {
			showToast(`加载挂件配置失败: ${err.message}`, 'error')
		}
		finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadWidgets()
	}, [])

	const currentAsideList = widgetData.pageAsideMappings[activePage] || []

	const handleToggleWidget = (widgetId: string) => {
		const nextMappings = { ...widgetData.pageAsideMappings }
		const list = [...(nextMappings[activePage] || [])]
		if (list.includes(widgetId)) {
			nextMappings[activePage] = list.filter(id => id !== widgetId)
		}
		else {
			nextMappings[activePage] = [...list, widgetId]
		}
		setWidgetData({ ...widgetData, pageAsideMappings: nextMappings })
	}

	const handleMoveWidgetOrder = (index: number, dir: 'up' | 'down') => {
		const list = [...currentAsideList]
		const target = dir === 'up' ? index - 1 : index + 1
		if (target < 0 || target >= list.length) return
		const temp = list[index]!
		list[index] = list[target]!
		list[target] = temp
		setWidgetData({
			...widgetData,
			pageAsideMappings: {
				...widgetData.pageAsideMappings,
				[activePage]: list,
			},
		})
	}

	const handleUpdateTechService = (index: number, field: keyof TechServiceItem, val: string) => {
		const nextServices = [...(widgetData.tech?.services || [])]
		if (!nextServices[index]) return
		nextServices[index] = { ...nextServices[index], [field]: val }
		setWidgetData({
			...widgetData,
			tech: { ...widgetData.tech!, services: nextServices },
		})
	}

	const handleAddTechService = () => {
		const nextServices = [...(widgetData.tech?.services || []), { label: '新指标项', value: '参数内容', icon: 'tabler:box', iconColor: '' }]
		setWidgetData({
			...widgetData,
			tech: { ...widgetData.tech!, services: nextServices },
		})
	}

	const handleDeleteTechService = (index: number) => {
		const nextServices = (widgetData.tech?.services || []).filter((_, i) => i !== index)
		setWidgetData({
			...widgetData,
			tech: { ...widgetData.tech!, services: nextServices },
		})
	}

	const handleMoveTechService = (index: number, dir: 'up' | 'down') => {
		const list = [...(widgetData.tech?.services || [])]
		const target = dir === 'up' ? index - 1 : index + 1
		if (target < 0 || target >= list.length) return
		const temp = list[index]!
		list[index] = list[target]!
		list[target] = temp
		setWidgetData({
			...widgetData,
			tech: { ...widgetData.tech!, services: list },
		})
	}

	const handleUpdateTechStack = (index: number, field: keyof TechStackItem, val: string) => {
		const nextStack = [...(widgetData.tech?.techstack || [])]
		if (!nextStack[index]) return
		nextStack[index] = { ...nextStack[index], [field]: val }
		setWidgetData({
			...widgetData,
			tech: { ...widgetData.tech!, techstack: nextStack },
		})
	}

	const handleAddTechStack = () => {
		const nextStack = [...(widgetData.tech?.techstack || []), { name: '新组件/库', version: '^1.0.0', icon: 'tabler:package', iconColor: '' }]
		setWidgetData({
			...widgetData,
			tech: { ...widgetData.tech!, techstack: nextStack },
		})
	}

	const handleDeleteTechStack = (index: number) => {
		const nextStack = (widgetData.tech?.techstack || []).filter((_, i) => i !== index)
		setWidgetData({
			...widgetData,
			tech: { ...widgetData.tech!, techstack: nextStack },
		})
	}

	const handleMoveTechStack = (index: number, dir: 'up' | 'down') => {
		const list = [...(widgetData.tech?.techstack || [])]
		const target = dir === 'up' ? index - 1 : index + 1
		if (target < 0 || target >= list.length) return
		const temp = list[index]!
		list[index] = list[target]!
		list[target] = temp
		setWidgetData({
			...widgetData,
			tech: { ...widgetData.tech!, techstack: list },
		})
	}

	const handleUpdateCommGroup = (field: string, val: string) => {
		setWidgetData({
			...widgetData,
			commGroup: { ...widgetData.commGroup!, [field]: val },
		})
	}

	const handleUpdateLogItem = (index: number, field: keyof WidgetLogItem, val: string) => {
		const nextItems = [...(widgetData.log?.items || [])]
		if (!nextItems[index]) return
		nextItems[index] = { ...nextItems[index], [field]: val }
		setWidgetData({
			...widgetData,
			log: { ...widgetData.log!, items: nextItems },
		})
	}

	const handleAddLogItem = () => {
		const today = new Date().toISOString().slice(0, 10)
		const nextItems = [{ date: today, content: '记录一次重要更新...' }, ...(widgetData.log?.items || [])]
		setWidgetData({
			...widgetData,
			log: { ...widgetData.log!, items: nextItems },
		})
	}

	const handleDeleteLogItem = (index: number) => {
		const nextItems = (widgetData.log?.items || []).filter((_, i) => i !== index)
		setWidgetData({
			...widgetData,
			log: { ...widgetData.log!, items: nextItems },
		})
	}

	const handleMoveLogItem = (index: number, dir: 'up' | 'down') => {
		const list = [...(widgetData.log?.items || [])]
		const target = dir === 'up' ? index - 1 : index + 1
		if (target < 0 || target >= list.length) return
		const temp = list[index]!
		list[index] = list[target]!
		list[target] = temp
		setWidgetData({
			...widgetData,
			log: { ...widgetData.log!, items: list },
		})
	}

	const openIconPicker = (type: 'techService' | 'techStack' | 'commGroup', index?: number, currentIcon?: string) => {
		setIconPickerTarget({ type, index, currentIcon })
		setIconPickerOpen(true)
	}

	const handleIconSelected = (iconName: string) => {
		if (!iconPickerTarget) return
		if (iconPickerTarget.type === 'techService' && typeof iconPickerTarget.index === 'number') {
			handleUpdateTechService(iconPickerTarget.index, 'icon', iconName)
		}
		else if (iconPickerTarget.type === 'techStack' && typeof iconPickerTarget.index === 'number') {
			handleUpdateTechStack(iconPickerTarget.index, 'icon', iconName)
		}
		else if (iconPickerTarget.type === 'commGroup') {
			handleUpdateCommGroup('icon', iconName)
		}
	}

	const handleSave = async () => {
		setSaving(true)
		try {
			await adminApi.saveWidgets({
				pageAsideMappings: widgetData.pageAsideMappings,
				tech: widgetData.tech,
				commGroup: widgetData.commGroup,
				log: widgetData.log,
				statsConfig: widgetData.statsConfig,
			})
			showToast('🎉 挂件卡片内容与页面排布已成功保存生效！', 'success')
		}
		catch (err: any) {
			showToast(`保存失败: ${err.message}`, 'error')
		}
		finally {
			setSaving(false)
		}
	}

	// 快捷键支持 (Ctrl+S / Cmd+S 触发保存)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === 's') {
				e.preventDefault()
				handleSave()
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [widgetData])

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
			{/* 常驻吸顶顶栏控制卡片 */}
			<div
				className="admin-card"
				style={{
					padding: '14px 18px',
					position: 'sticky',
					top: 0,
					zIndex: 30,
					backdropFilter: 'blur(12px)',
					boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
					<div>
						<div style={{ fontSize: 15, fontWeight: 700, color: 'var(--admin-text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
							<Icon icon="tabler:layout-sidebar" style={{ color: 'var(--admin-accent)', fontSize: 18 }} />
							<span>侧边栏挂件深度定制工坊 (Widget Studio)</span>
						</div>
						<div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 2 }}>
							自由定制技术信息、交流群、更新动态等右侧挂件卡片内容（支持快捷键 Ctrl+S / ⌘S 随时保存）
						</div>
					</div>

					<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
						<button
							type="button"
							className="admin-btn btn-secondary btn-sm"
							onClick={loadWidgets}
							disabled={loading || saving}
						>
							<Icon icon="tabler:refresh" />
							<span>重置读取</span>
						</button>
						<button
							type="button"
							className="admin-btn btn-primary btn-sm"
							onClick={handleSave}
							disabled={saving}
							style={{ padding: '6px 16px', fontWeight: 600 }}
						>
							<Icon icon={saving ? 'tabler:loader-2' : 'tabler:device-floppy'} />
							<span>{saving ? '保存中...' : '💾 保存全部挂件与内容'}</span>
						</button>
					</div>
				</div>
			</div>

			<div className="admin-card" style={{ padding: '8px 12px' }}>
				<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
					{[
						{ id: 'layout', name: '页面排布与开关', icon: 'tabler:layout-grid' },
						{ id: 'tech', name: '技术信息卡片 (BlogTech)', icon: 'tabler:stack-2' },
						{ id: 'commGroup', name: '交流群卡片 (CommGroup)', icon: 'tabler:users' },
						{ id: 'log', name: '更新动态卡片 (BlogLog)', icon: 'tabler:notes' },
						{ id: 'stats', name: '统计参数 (BlogStats)', icon: 'tabler:chart-bar' },
					].map(tab => (
						<button
							key={tab.id}
							type="button"
							className={`admin-btn ${activeSection === tab.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}
							onClick={() => setActiveSection(tab.id as any)}
						>
							<Icon icon={tab.icon} />
							<span>{tab.name}</span>
						</button>
					))}
				</div>
			</div>

			{loading ? (
				<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
					<Icon icon="tabler:loader-2" style={{ fontSize: 24, color: 'var(--admin-text-3)', animation: 'spin 1s linear infinite' }} />
				</div>
			) : (
				<div style={{ display: 'grid', gridTemplateColumns: 'minmax(440px, 1.35fr) minmax(320px, 1fr)', gap: 14 }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
						{activeSection === 'layout' && (
							<>
								<div className="admin-card" style={{ padding: '12px 14px' }}>
									<div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
										<span style={{ fontSize: 12, color: 'var(--admin-text-3)', marginRight: 4 }}>配置目标页面:</span>
										{[
											{ id: 'home', name: '博客首页' },
											{ id: 'archive', name: '归档页面' },
											{ id: 'post', name: '文章详情' },
											{ id: 'link', name: '友链页面' },
										].map(p => (
											<button
												key={p.id}
												type="button"
												className={`admin-btn ${activePage === p.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}
												onClick={() => setActivePage(p.id as any)}
											>
												<span>{p.name}</span>
											</button>
										))}
									</div>
								</div>

								<div className="admin-card" style={{ padding: '16px' }}>
									<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)', marginBottom: 12 }}>
										当前页面已启用挂件与上下排列 (共 {currentAsideList.length} 个)
									</div>

									{currentAsideList.length === 0 ? (
										<div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--admin-text-3)', fontSize: 12 }}>
											当前页面未启用任何挂件
										</div>
									) : (
										<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
											{currentAsideList.map((widgetId, idx) => {
												const wInfo = widgetData.availableWidgets.find(w => w.id === widgetId)
												return (
													<div
														key={widgetId}
														style={{
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'space-between',
															padding: '8px 12px',
															background: 'var(--admin-surface)',
															border: '1px solid var(--admin-border)',
															borderRadius: 6,
														}}
													>
														<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
															<span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-accent)', width: 16 }}>
																{idx + 1}.
															</span>
															<Icon icon={wInfo?.icon || 'tabler:box'} style={{ fontSize: 18, color: 'var(--admin-accent)' }} />
															<div>
																<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)' }}>
																	{wInfo?.name || widgetId}
																</div>
																<div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>
																	{wInfo?.description}
																</div>
															</div>
														</div>

														<div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
															<button
																type="button"
																className="admin-btn btn-ghost btn-sm"
																onClick={() => handleMoveWidgetOrder(idx, 'up')}
																disabled={idx === 0}
																style={{ padding: '0 4px', height: 24 }}
																title="上移"
															>
																<Icon icon="tabler:chevron-up" />
															</button>
															<button
																type="button"
																className="admin-btn btn-ghost btn-sm"
																onClick={() => handleMoveWidgetOrder(idx, 'down')}
																disabled={idx === currentAsideList.length - 1}
																style={{ padding: '0 4px', height: 24 }}
																title="下移"
															>
																<Icon icon="tabler:chevron-down" />
															</button>
															<button
																type="button"
																className="admin-btn btn-danger btn-sm"
																onClick={() => handleToggleWidget(widgetId)}
																style={{ padding: '0 4px', height: 24 }}
																title="移除挂件"
															>
																<Icon icon="tabler:x" />
															</button>
														</div>
													</div>
												)
											})}
										</div>
									)}
								</div>

								<div className="admin-card" style={{ padding: '16px' }}>
									<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)', marginBottom: 12 }}>
										挂件库开关 (点击直接启闭当前目标页面的挂件)
									</div>

									<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
										{widgetData.availableWidgets.map((w) => {
											const isEnabled = currentAsideList.includes(w.id)
											return (
												<div
													key={w.id}
													onClick={() => handleToggleWidget(w.id)}
													style={{
														padding: '10px 12px',
														borderRadius: 6,
														background: isEnabled ? 'var(--admin-accent-soft)' : 'var(--admin-surface)',
														border: isEnabled ? '1px solid var(--admin-accent)' : '1px solid var(--admin-border)',
														cursor: 'pointer',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'space-between',
														transition: 'all 0.15s ease',
													}}
												>
													<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
														<Icon icon={w.icon} style={{ fontSize: 16, color: isEnabled ? 'var(--admin-accent)' : 'var(--admin-text-2)' }} />
														<div>
															<div style={{ fontSize: 12, fontWeight: 600, color: isEnabled ? 'var(--admin-accent)' : 'var(--admin-text-1)' }}>
																{w.name.split(' ')[0]}
															</div>
															<div style={{ fontSize: 10, color: 'var(--admin-text-3)' }}>
																{w.id}
															</div>
														</div>
													</div>

													<label className="admin-switch" style={{ pointerEvents: 'none' }}>
														<input type="checkbox" checked={isEnabled} readOnly />
														<span className="switch-slider" />
													</label>
												</div>
											)
										})}
									</div>
								</div>
							</>
						)}

						{activeSection === 'tech' && (
							<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
								<div className="admin-card" style={{ padding: '16px' }}>
									<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
										<label style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-3)' }}>
											卡片展示标题
										</label>
										<button
											type="button"
											className="admin-btn btn-primary btn-sm"
											onClick={handleSave}
											disabled={saving}
											style={{ height: 26, fontSize: 11 }}
										>
											<Icon icon={saving ? 'tabler:loader-2' : 'tabler:device-floppy'} />
											<span>{saving ? '保存中...' : '保存技术信息'}</span>
										</button>
									</div>
									<input
										type="text"
										className="admin-input"
										value={widgetData.tech?.title || '技术信息'}
										onChange={e => setWidgetData({
											...widgetData,
											tech: { ...widgetData.tech!, title: e.target.value },
										})}
										placeholder="如: 技术信息 / 架构矩阵"
									/>
								</div>

								<div className="admin-card" style={{ padding: '16px' }}>
									<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
										<div>
											<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)' }}>
												服务与基础设施指标 (Services)
											</div>
											<div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>
												展示在卡片顶部的部署平台、图片存储、规范域名等运行指标，支持点击图标选择器挑选
											</div>
										</div>
										<button
											type="button"
											className="admin-btn btn-secondary btn-sm"
											onClick={handleAddTechService}
										>
											<Icon icon="tabler:plus" />
											<span>添加指标</span>
										</button>
									</div>

									<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
										{(widgetData.tech?.services || []).map((srv, idx) => (
											<div
												key={idx}
												style={{
													display: 'grid',
													gridTemplateColumns: '110px 1fr 180px 60px',
													gap: 8,
													alignItems: 'center',
													padding: '8px 10px',
													background: 'var(--admin-bg-subtle)',
													borderRadius: 6,
													border: '1px solid var(--admin-border)',
												}}
											>
												<input
													type="text"
													className="admin-input"
													placeholder="标签 (如: 部署平台)"
													value={srv.label}
													onChange={e => handleUpdateTechService(idx, 'label', e.target.value)}
													style={{ fontSize: 12 }}
												/>
												<input
													type="text"
													className="admin-input"
													placeholder="内容值 (如: EdgeOne)"
													value={srv.value}
													onChange={e => handleUpdateTechService(idx, 'value', e.target.value)}
													style={{ fontSize: 12 }}
												/>

												<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
													<button
														type="button"
														className="admin-btn btn-secondary btn-sm"
														style={{ width: 30, height: 30, padding: 0, flexShrink: 0 }}
														onClick={() => openIconPicker('techService', idx, srv.icon)}
														title="点击打开图标选择器"
													>
														{srv.icon ? (
															<Icon icon={srv.icon} style={{ fontSize: 16, color: srv.iconColor || 'inherit' }} />
														) : (
															<Icon icon="tabler:photo-plus" style={{ fontSize: 14, opacity: 0.5 }} />
														)}
													</button>

													<input
														type="text"
														className="admin-input"
														placeholder="图标或选择"
														value={srv.icon || ''}
														onChange={e => handleUpdateTechService(idx, 'icon', e.target.value)}
														style={{ fontSize: 11, fontFamily: 'var(--admin-font-mono)', flex: 1, minWidth: 0 }}
													/>

													<input
														type="color"
														value={srv.iconColor || '#0052D9'}
														onChange={e => handleUpdateTechService(idx, 'iconColor', e.target.value)}
														style={{
															width: 24,
															height: 26,
															padding: 0,
															border: '1px solid var(--admin-border)',
															borderRadius: 4,
															cursor: 'pointer',
															background: 'transparent',
														}}
														title="设置图标自定义颜色"
													/>
												</div>

												<div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
													<button
														type="button"
														className="admin-btn btn-ghost btn-sm"
														onClick={() => handleMoveTechService(idx, 'up')}
														disabled={idx === 0}
														style={{ padding: '0 3px', height: 26 }}
														title="上移"
													>
														<Icon icon="tabler:chevron-up" />
													</button>
													<button
														type="button"
														className="admin-btn btn-danger btn-sm"
														onClick={() => handleDeleteTechService(idx)}
														style={{ padding: '0 3px', height: 26 }}
														title="删除此项"
													>
														<Icon icon="tabler:trash" />
													</button>
												</div>
											</div>
										))}
									</div>
								</div>

								<div className="admin-card" style={{ padding: '16px' }}>
									<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
										<div>
											<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)' }}>
												构建技术栈矩阵 (Tech Stack Matrix)
											</div>
											<div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>
												展示技术徽标列表，点击图标选择器可快速挑选 Logo
											</div>
										</div>
										<button
											type="button"
											className="admin-btn btn-secondary btn-sm"
											onClick={handleAddTechStack}
										>
											<Icon icon="tabler:plus" />
											<span>添加技术栈</span>
										</button>
									</div>

									<div style={{ marginBottom: 12, padding: '8px 10px', background: 'var(--admin-surface)', borderRadius: 6, border: '1px solid var(--admin-border)' }}>
										<span style={{ fontSize: 11, color: 'var(--admin-text-3)', display: 'block', marginBottom: 6 }}>
											快速追加常用技术栈预设:
										</span>
										<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
											{PRESET_ICONS.map(p => (
												<button
													key={p.name}
													type="button"
													className="admin-btn btn-ghost btn-sm"
													style={{ height: 22, fontSize: 11, padding: '0 6px' }}
													onClick={() => {
														const nextStack = [...(widgetData.tech?.techstack || []), { name: p.name, version: '^1.0.0', icon: p.icon, iconColor: p.color || '' }]
														setWidgetData({
															...widgetData,
															tech: { ...widgetData.tech!, techstack: nextStack },
														})
													}}
												>
													<Icon icon={p.icon} style={p.color ? { color: p.color } : undefined} />
													<span>{p.name}</span>
												</button>
											))}
										</div>
									</div>

									<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
										{(widgetData.tech?.techstack || []).map((tech, idx) => (
											<div
												key={idx}
												style={{
													display: 'grid',
													gridTemplateColumns: '110px 90px 1fr 60px',
													gap: 8,
													alignItems: 'center',
													padding: '8px 10px',
													background: 'var(--admin-bg-subtle)',
													borderRadius: 6,
													border: '1px solid var(--admin-border)',
												}}
											>
												<input
													type="text"
													className="admin-input"
													placeholder="名称 (如: React)"
													value={tech.name}
													onChange={e => handleUpdateTechStack(idx, 'name', e.target.value)}
													style={{ fontSize: 12, fontWeight: 600 }}
												/>
												<input
													type="text"
													className="admin-input"
													placeholder="版本号"
													value={tech.version}
													onChange={e => handleUpdateTechStack(idx, 'version', e.target.value)}
													style={{ fontSize: 12, fontFamily: 'var(--admin-font-mono)' }}
												/>

												<div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
													<button
														type="button"
														className="admin-btn btn-secondary btn-sm"
														style={{ width: 30, height: 30, padding: 0, flexShrink: 0 }}
														onClick={() => openIconPicker('techStack', idx, tech.icon)}
														title="点击打开图标选择器"
													>
														<Icon icon={tech.icon || 'tabler:code'} style={{ fontSize: 18, color: tech.iconColor || 'inherit' }} />
													</button>
													<input
														type="text"
														className="admin-input"
														placeholder="Iconify 图标名称"
														value={tech.icon}
														onChange={e => handleUpdateTechStack(idx, 'icon', e.target.value)}
														style={{ fontSize: 11, fontFamily: 'var(--admin-font-mono)', flex: 1, minWidth: 0 }}
													/>
													<input
														type="color"
														value={tech.iconColor || '#0055FF'}
														onChange={e => handleUpdateTechStack(idx, 'iconColor', e.target.value)}
														style={{
															width: 24,
															height: 26,
															padding: 0,
															border: '1px solid var(--admin-border)',
															borderRadius: 4,
															cursor: 'pointer',
															background: 'transparent',
														}}
														title="自定义图标颜色"
													/>
												</div>

												<div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
													<button
														type="button"
														className="admin-btn btn-ghost btn-sm"
														onClick={() => handleMoveTechStack(idx, 'up')}
														disabled={idx === 0}
														style={{ padding: '0 3px', height: 26 }}
													>
														<Icon icon="tabler:chevron-up" />
													</button>
													<button
														type="button"
														className="admin-btn btn-danger btn-sm"
														onClick={() => handleDeleteTechStack(idx)}
														style={{ padding: '0 3px', height: 26 }}
													>
														<Icon icon="tabler:trash" />
													</button>
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						)}

						{activeSection === 'commGroup' && (
							<div className="admin-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
									<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
										<Icon icon="tabler:users" style={{ color: 'var(--admin-accent)' }} />
										<span>社区交流群卡片详细配置</span>
									</div>
									<button
										type="button"
										className="admin-btn btn-primary btn-sm"
										onClick={handleSave}
										disabled={saving}
										style={{ height: 26, fontSize: 11 }}
									>
										<Icon icon={saving ? 'tabler:loader-2' : 'tabler:device-floppy'} />
										<span>{saving ? '保存中...' : '保存社群配置'}</span>
									</button>
								</div>

								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
									<div>
										<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
											卡片顶部小标题
										</label>
										<input
											type="text"
											className="admin-input"
											value={widgetData.commGroup?.title || '博客/技术社区'}
											onChange={e => handleUpdateCommGroup('title', e.target.value)}
											placeholder="如: 博客/技术社区"
										/>
									</div>

									<div>
										<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
											交流群/社群名称
										</label>
										<input
											type="text"
											className="admin-input"
											value={widgetData.commGroup?.groupName || '纸网接入点'}
											onChange={e => handleUpdateCommGroup('groupName', e.target.value)}
											placeholder="如: 纸网接入点 / 全栈开发者社区"
										/>
									</div>

									<div>
										<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
											群号码 / 账号 / 加入链接
										</label>
										<input
											type="text"
											className="admin-input"
											value={widgetData.commGroup?.account || '169994096'}
											onChange={e => handleUpdateCommGroup('account', e.target.value)}
											placeholder="如: 169994096"
										/>
									</div>

									<div>
										<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
											群图标 (点击选择或输入)
										</label>
										<div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
											<button
												type="button"
												className="admin-btn btn-secondary btn-sm"
												style={{ width: 32, height: 32, padding: 0 }}
												onClick={() => openIconPicker('commGroup', undefined, widgetData.commGroup?.icon)}
												title="点击打开图标选择器"
											>
												<Icon icon={widgetData.commGroup?.icon || 'ri:qq-fill'} style={{ fontSize: 20, color: 'var(--admin-accent)' }} />
											</button>
											<input
												type="text"
												className="admin-input"
												value={widgetData.commGroup?.icon || 'ri:qq-fill'}
												onChange={e => handleUpdateCommGroup('icon', e.target.value)}
												placeholder="如: ri:qq-fill / ri:wechat-fill / tabler:brand-telegram"
												style={{ flex: 1 }}
											/>
										</div>
									</div>

									<div style={{ gridColumn: '1 / -1' }}>
										<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
											自定义背景图 URL (若留空则自动根据 QQ 群号生成头像水印背景)
										</label>
										<input
											type="text"
											className="admin-input"
											value={widgetData.commGroup?.bgImg || ''}
											onChange={e => handleUpdateCommGroup('bgImg', e.target.value)}
											placeholder="如: /uploads/comm-bg.jpg 或网络图片 URL"
										/>
									</div>
								</div>
							</div>
						)}

						{activeSection === 'log' && (
							<div className="admin-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
									<div>
										<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
											<Icon icon="tabler:notes" style={{ color: 'var(--admin-accent)' }} />
											<span>更新动态与大事记详细配置</span>
										</div>
										<div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>
											展示博客版本更迭、重构大事记等历史时间轴
										</div>
									</div>
									<div style={{ display: 'flex', gap: 6 }}>
										<button
											type="button"
											className="admin-btn btn-secondary btn-sm"
											onClick={handleAddLogItem}
										>
											<Icon icon="tabler:plus" />
											<span>添加日志</span>
										</button>
										<button
											type="button"
											className="admin-btn btn-primary btn-sm"
											onClick={handleSave}
											disabled={saving}
											style={{ height: 28, fontSize: 11 }}
										>
											<Icon icon={saving ? 'tabler:loader-2' : 'tabler:device-floppy'} />
											<span>{saving ? '保存中...' : '保存日志'}</span>
										</button>
									</div>
								</div>

								<div>
									<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
										卡片标题
									</label>
									<input
										type="text"
										className="admin-input"
										value={widgetData.log?.title || '更新日志'}
										onChange={e => setWidgetData({ ...widgetData, log: { ...widgetData.log!, title: e.target.value } })}
										placeholder="如: 更新日志 / 博客大事记"
									/>
								</div>

								<div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
									{(widgetData.log?.items || []).map((item, idx) => (
										<div
											key={idx}
											style={{
												display: 'grid',
												gridTemplateColumns: '130px 1fr 60px',
												gap: 8,
												alignItems: 'center',
												padding: '8px 10px',
												background: 'var(--admin-bg-subtle)',
												borderRadius: 6,
												border: '1px solid var(--admin-border)',
											}}
										>
											<input
												type="date"
												className="admin-input"
												value={item.date}
												onChange={e => handleUpdateLogItem(idx, 'date', e.target.value)}
												style={{ fontSize: 12 }}
											/>
											<input
												type="text"
												className="admin-input"
												placeholder="更新内容摘要..."
												value={item.content}
												onChange={e => handleUpdateLogItem(idx, 'content', e.target.value)}
												style={{ fontSize: 12 }}
											/>
											<div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
												<button
													type="button"
													className="admin-btn btn-ghost btn-sm"
													onClick={() => handleMoveLogItem(idx, 'up')}
													disabled={idx === 0}
													style={{ padding: '0 3px', height: 26 }}
												>
													<Icon icon="tabler:chevron-up" />
												</button>
												<button
													type="button"
													className="admin-btn btn-danger btn-sm"
													onClick={() => handleDeleteLogItem(idx)}
													style={{ padding: '0 3px', height: 26 }}
												>
													<Icon icon="tabler:trash" />
												</button>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{activeSection === 'stats' && (
							<div className="admin-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
									<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
										<Icon icon="tabler:chart-bar" style={{ color: 'var(--admin-accent)' }} />
										<span>博客统计挂件 (BlogStats) 全局参数</span>
									</div>
									<button
										type="button"
										className="admin-btn btn-primary btn-sm"
										onClick={handleSave}
										disabled={saving}
										style={{ height: 26, fontSize: 11 }}
									>
										<Icon icon={saving ? 'tabler:loader-2' : 'tabler:device-floppy'} />
										<span>{saving ? '保存中...' : '保存统计参数'}</span>
									</button>
								</div>

								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
									<div>
										<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
											作者出生/建站年份 (Birth Year)
										</label>
										<input
											type="number"
											className="admin-input"
											value={widgetData.statsConfig?.birthYear || 2006}
											onChange={e => setWidgetData({
												...widgetData,
												statsConfig: { ...widgetData.statsConfig, birthYear: Number(e.target.value) },
											})}
										/>
									</div>

									<div>
										<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
											自定义全站总字数显示 (Word Count)
										</label>
										<input
											type="text"
											className="admin-input"
											value={widgetData.statsConfig?.wordCount || '约12万'}
											onChange={e => setWidgetData({
												...widgetData,
												statsConfig: { ...widgetData.statsConfig, wordCount: e.target.value },
											})}
										/>
									</div>
								</div>
							</div>
						)}
					</div>

					{/* 右侧：同源挂件即时全景渲染 */}
					<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
						<div className="admin-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
							<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
								<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
									<Icon icon="tabler:eye" style={{ color: 'var(--admin-accent)' }} />
									<span>前台同源实时渲染效果</span>
								</div>
								<span className="admin-badge badge-primary">所见即所得</span>
							</div>

							<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
								{/* 1. 技术信息卡片 */}
								{(activeSection === 'tech' || (activeSection === 'layout' && currentAsideList.includes('blog-tech'))) && (
									<div>
										<div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginBottom: 6 }}>技术栈矩阵卡片 (BlogTech):</div>
										<BlogTech customData={widgetData.tech} />
									</div>
								)}

								{/* 2. 社区交流群卡片 */}
								{(activeSection === 'commGroup' || (activeSection === 'layout' && currentAsideList.includes('comm-group'))) && (
									<div>
										<div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginBottom: 6 }}>社区交流群卡片 (CommGroup):</div>
										<CommGroup customData={widgetData.commGroup} />
									</div>
								)}

								{/* 3. 博客更新动态卡片 */}
								{(activeSection === 'log' || (activeSection === 'layout' && currentAsideList.includes('blog-log'))) && (
									<div>
										<div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginBottom: 6 }}>更新动态卡片 (BlogLog):</div>
										<BlogLog customData={widgetData.log} />
									</div>
								)}

								{/* 4. 博客统计挂件 */}
								{(activeSection === 'stats' || (activeSection === 'layout' && currentAsideList.includes('blog-stats'))) && (
									<div>
										<div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginBottom: 6 }}>博客统计卡片 (BlogStats):</div>
										<BlogStats
											customData={{
												birthYear: widgetData.statsConfig?.birthYear,
												wordCount: widgetData.statsConfig?.wordCount,
											}}
										/>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* 图标选择器弹窗 */}
			{iconPickerOpen && (
				<IconPickerModal
					currentIcon={iconPickerTarget?.currentIcon || 'tabler:box'}
					onSelect={handleIconSelected}
					onClose={() => setIconPickerOpen(false)}
				/>
			)}
		</div>
	)
}

export default WidgetManagerView

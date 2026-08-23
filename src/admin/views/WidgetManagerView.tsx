import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import type { WidgetConfigData, TechServiceItem, TechStackItem, WidgetLogItem } from '../types'
import { useToast } from '../components/Toast'
import { IconPickerModal } from '../components/IconPickerModal'
import BlogStats from '../../components/widget/BlogStats'
import BlogTech from '../../components/widget/BlogTech'
import BlogWeather from '../../components/widget/BlogWeather'
import CommGroup from '../../components/widget/CommGroup'
import BlogLog from '../../components/widget/BlogLog'

const DEFAULT_WIDGET_CONFIG: WidgetConfigData = {
	availableWidgets: [
		{ id: 'blog-weather', name: '心知天气 (BlogWeather)', icon: 'tabler:cloud-sun', description: '展示实时天气现象、气温与未来3天逐日预报' },
		{ id: 'blog-stats', name: '博客统计 (BlogStats)', icon: 'tabler:chart-bar', description: '展示博文篇数、字数及建站年份' },
		{ id: 'blog-tech', name: '技术信息 (BlogTech)', icon: 'tabler:stack-2', description: '前台技术体系与架构徽标展示' },
		{ id: 'comm-group', name: '社区交流 (CommGroup)', icon: 'tabler:users', description: 'QQ/微信交流群与社区入口' },
		{ id: 'blog-log', name: '更新动态 (BlogLog)', icon: 'tabler:notes', description: '博客更新日志与大事记' },
		{ id: 'toc', name: '文章目录 (Toc)', icon: 'tabler:list-tree', description: '文章详情页 H1-H6 目录大纲' },
	],
	pageAsideMappings: {
		home: ['blog-weather', 'blog-stats', 'blog-tech', 'comm-group'],
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
			{ label: '文章许可', value: 'CC BY-NC-SA 4.0', icon: 'tabler:creative-commons', iconColor: '#10B981' },
			{ label: '规范域名', value: 'cot.wiki', icon: 'tabler:link', iconColor: '#6366F1' },
		],
		techstack: [
			{ name: 'React', version: '^19.1.0', icon: 'logos:react', iconColor: '' },
			{ name: 'Rsbuild', version: '^2.1.13', icon: 'tabler:bolt', iconColor: '#F85D00' },
			{ name: 'TS', version: '^6.0.3', icon: 'logos:typescript-icon', iconColor: '' },
			{ name: 'MDX', version: '^3.1.1', icon: 'simple-icons:mdx', iconColor: '#FCB32C' },
			{ name: 'Node', version: '^22.17', icon: 'logos:nodejs-icon', iconColor: '' },
			{ name: 'pnpm', version: '11.0.4', icon: 'logos:pnpm', iconColor: '' },
			{ name: 'Motion', version: '^12.38.0', icon: 'simple-icons:framer', iconColor: '#0055FF' },
			{ name: 'Sass', version: '^1.99.0', icon: 'logos:sass', iconColor: '' },
		],
	},
	commGroup: {
		title: '博客/技术社区',
		groupName: '序栈接入点',
		account: '1722288011',
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
}

export const WidgetManagerView: React.FC = () => {
	const { showToast } = useToast()
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [isDirty, setIsDirty] = useState(false)
	const [activeSection, setActiveSection] = useState<'layout' | 'weather' | 'tech' | 'commGroup' | 'log' | 'stats'>('layout')
	const [activePage, setActivePage] = useState<'home' | 'archive' | 'post' | 'link'>('home')
	const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light')
	const [testingWeather, setTestingWeather] = useState(false)
	const [showApiKey, setShowApiKey] = useState(false)

	const [iconPickerOpen, setIconPickerOpen] = useState(false)
	const [iconPickerTarget, setIconPickerTarget] = useState<{
		type: 'techService' | 'techStack' | 'commGroup'
		index?: number
		currentIcon?: string
	} | null>(null)

	const [widgetData, setWidgetData] = useState<WidgetConfigData>(DEFAULT_WIDGET_CONFIG)

	const loadWidgets = async () => {
		setLoading(true)
		try {
			const data = await adminApi.getWidgets()
			setWidgetData(prev => ({
				availableWidgets: data.availableWidgets || prev.availableWidgets,
				pageAsideMappings: data.pageAsideMappings || prev.pageAsideMappings,
				statsConfig: data.statsConfig || prev.statsConfig,
				weather: data.weather || prev.weather || {
					title: '实时天气',
					apiKey: 'SvyX4Wvh0a',
					defaultCity: 'beijing',
					unit: 'c',
				},
				tech: data.tech || prev.tech,
				commGroup: data.commGroup || prev.commGroup,
				log: data.log || prev.log,
			}))
			setIsDirty(false)
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

	// 挂件启用与禁用
	const handleToggleWidget = (widgetId: string) => {
		const nextMappings = { ...widgetData.pageAsideMappings }
		const list = [...(nextMappings[activePage] || [])]
		if (list.includes(widgetId)) {
			nextMappings[activePage] = list.filter(id => id !== widgetId)
		}
		else {
			nextMappings[activePage] = [...list, widgetId]
		}
		setWidgetData(prev => ({ ...prev, pageAsideMappings: nextMappings }))
		setIsDirty(true)
	}

	// 挂件上下排序
	const handleMoveWidgetOrder = (index: number, dir: 'up' | 'down') => {
		const list = [...currentAsideList]
		const target = dir === 'up' ? index - 1 : index + 1
		if (target < 0 || target >= list.length) return
		const temp = list[index]!
		list[index] = list[target]!
		list[target] = temp
		setWidgetData(prev => ({
			...prev,
			pageAsideMappings: {
				...prev.pageAsideMappings,
				[activePage]: list,
			},
		}))
		setIsDirty(true)
	}

	// 技术服务项更新
	const handleUpdateTechService = (index: number, field: keyof TechServiceItem, val: string) => {
		const nextServices = [...(widgetData.tech?.services || [])]
		if (!nextServices[index]) return
		nextServices[index] = { ...nextServices[index], [field]: val }
		setWidgetData(prev => ({
			...prev,
			tech: { ...prev.tech!, services: nextServices },
		}))
		setIsDirty(true)
	}

	const handleAddTechService = () => {
		const nextServices = [
			...(widgetData.tech?.services || []),
			{ label: '自定义服务', value: '服务名称', icon: 'tabler:circle-check', iconColor: '#33aaff' },
		]
		setWidgetData(prev => ({
			...prev,
			tech: { ...prev.tech!, services: nextServices },
		}))
		setIsDirty(true)
	}

	const handleDeleteTechService = (index: number) => {
		const nextServices = [...(widgetData.tech?.services || [])]
		nextServices.splice(index, 1)
		setWidgetData(prev => ({
			...prev,
			tech: { ...prev.tech!, services: nextServices },
		}))
		setIsDirty(true)
	}

	// 技术栈更新
	const handleUpdateTechStack = (index: number, field: keyof TechStackItem, val: string) => {
		const nextStack = [...(widgetData.tech?.techstack || [])]
		if (!nextStack[index]) return
		nextStack[index] = { ...nextStack[index], [field]: val }
		setWidgetData(prev => ({
			...prev,
			tech: { ...prev.tech!, techstack: nextStack },
		}))
		setIsDirty(true)
	}

	const handleAddTechStack = () => {
		const nextStack = [
			...(widgetData.tech?.techstack || []),
			{ name: '新框架', version: '^1.0.0', icon: 'tabler:code', iconColor: '#33aaff' },
		]
		setWidgetData(prev => ({
			...prev,
			tech: { ...prev.tech!, techstack: nextStack },
		}))
		setIsDirty(true)
	}

	const handleDeleteTechStack = (index: number) => {
		const nextStack = [...(widgetData.tech?.techstack || [])]
		nextStack.splice(index, 1)
		setWidgetData(prev => ({
			...prev,
			tech: { ...prev.tech!, techstack: nextStack },
		}))
		setIsDirty(true)
	}

	// 更新日志项
	const handleAddLogItem = () => {
		const nextItems = [
			{ date: new Date().toISOString().slice(0, 10), content: '新更新记录' },
			...(widgetData.log?.items || []),
		]
		setWidgetData(prev => ({
			...prev,
			log: { ...prev.log!, items: nextItems },
		}))
		setIsDirty(true)
	}

	const handleUpdateLogItem = (index: number, field: keyof WidgetLogItem, val: string) => {
		const nextItems = [...(widgetData.log?.items || [])]
		if (!nextItems[index]) return
		nextItems[index] = { ...nextItems[index], [field]: val }
		setWidgetData(prev => ({
			...prev,
			log: { ...prev.log!, items: nextItems },
		}))
		setIsDirty(true)
	}

	const handleDeleteLogItem = (index: number) => {
		const nextItems = [...(widgetData.log?.items || [])]
		nextItems.splice(index, 1)
		setWidgetData(prev => ({
			...prev,
			log: { ...prev.log!, items: nextItems },
		}))
		setIsDirty(true)
	}

	// 心知天气配置修改
	const handleUpdateWeatherField = (field: string, val: string) => {
		setWidgetData(prev => ({
			...prev,
			weather: {
				...prev.weather,
				[field]: val,
			},
		}))
		setIsDirty(true)
	}

	// 心知天气联通测试
	const handleTestWeatherApi = async () => {
		const targetCity = widgetData.weather?.defaultCity || 'beijing'
		const key = widgetData.weather?.apiKey || 'SvyX4Wvh0a'
		setTestingWeather(true)
		try {
			const res = await fetch(`https://api.seniverse.com/v3/weather/now.json?key=${key}&location=${encodeURIComponent(targetCity)}&language=zh-Hans&unit=c`)
			const json = await res.json()
			if (res.ok && json.results?.[0]?.now) {
				const now = json.results[0].now
				const loc = json.results[0].location
				showToast(`心知天气连接成功！${loc.name}: ${now.text}，气温 ${now.temperature}°C`, 'success')
			}
			else {
				showToast(`心知天气测试失败: ${json.status || '密钥或城市错误'}`, 'error')
			}
		}
		catch (err: any) {
			showToast(`心知天气连接超时或网络异常: ${err.message}`, 'error')
		}
		finally {
			setTestingWeather(false)
		}
	}

	// 图标选择回调
	const handleIconSelected = (iconName: string) => {
		if (!iconPickerTarget) return
		if (iconPickerTarget.type === 'techService' && iconPickerTarget.index !== undefined) {
			handleUpdateTechService(iconPickerTarget.index, 'icon', iconName)
		}
		else if (iconPickerTarget.type === 'techStack' && iconPickerTarget.index !== undefined) {
			handleUpdateTechStack(iconPickerTarget.index, 'icon', iconName)
		}
		else if (iconPickerTarget.type === 'commGroup') {
			setWidgetData(prev => ({
				...prev,
				commGroup: { ...prev.commGroup!, icon: iconName },
			}))
			setIsDirty(true)
		}
		setIconPickerOpen(false)
		setIconPickerTarget(null)
	}

	const handleSave = async () => {
		setSaving(true)
		try {
			await adminApi.saveWidgets(widgetData)
			setIsDirty(false)
			showToast('侧栏挂件配置与卡片内容已成功保存并实时生效！', 'success')
		}
		catch (err: any) {
			showToast(`保存失败: ${err.message}`, 'error')
		}
		finally {
			setSaving(false)
		}
	}

	// 快捷键保存 (Ctrl+S / Cmd+S)
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

	if (loading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
				<Icon icon="tabler:loader-2" style={{ fontSize: 24, color: 'var(--admin-text-3)', animation: 'spin 1s linear infinite' }} />
			</div>
		)
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
			{/* 顶栏操作卡片 */}
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
							<span>侧栏挂件 (Aside Widgets)</span>
							{isDirty && (
								<span className="admin-badge badge-warning" style={{ fontSize: 11 }}>未保存修改</span>
							)}
						</div>
						<div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 2 }}>
							直接维护挂件卡片内部内容（技术栈、社区群、更新日志）与各页面挂载显示顺序
						</div>
					</div>

					<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
						<button
							type="button"
							className="admin-btn btn-secondary btn-sm"
							onClick={loadWidgets}
							disabled={saving}
						>
							<Icon icon="tabler:refresh" />
							<span>重置读取</span>
						</button>
						<button
							type="button"
							className="admin-btn btn-primary btn-sm"
							onClick={handleSave}
							disabled={saving}
							style={{ padding: '6px 18px', fontWeight: 600 }}
						>
							<Icon icon={saving ? 'tabler:loader-2' : 'tabler:device-floppy'} />
							<span>{saving ? '保存中...' : '保存挂件配置 (Ctrl+S)'}</span>
						</button>
					</div>
				</div>
			</div>

			{/* 模块分类 Tabs */}
			<div className="admin-card" style={{ padding: '8px 12px' }}>
				<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
					{[
						{ id: 'layout', name: '1. 页面挂载与排序', icon: 'tabler:layout-grid' },
						{ id: 'weather', name: '2. 心知天气 (BlogWeather)', icon: 'tabler:cloud-sun' },
						{ id: 'tech', name: '3. 技术信息 (BlogTech)', icon: 'tabler:stack-2' },
						{ id: 'commGroup', name: '4. 社区群卡片 (CommGroup)', icon: 'tabler:users' },
						{ id: 'log', name: '5. 更新日志 (BlogLog)', icon: 'tabler:notes' },
						{ id: 'stats', name: '6. 博客统计 (BlogStats)', icon: 'tabler:chart-bar' },
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

			{/* 主编辑区：左侧表单 + 右侧真实挂件实时预览 */}
			<div style={{ display: 'grid', gridTemplateColumns: 'minmax(460px, 1.2fr) minmax(340px, 1fr)', gap: 14 }}>
				{/* 左侧：表单配置区 */}
				<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
					{/* 1. 页面挂载排布 */}
					{activeSection === 'layout' && (
						<div className="admin-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
							<div className="admin-section-title">
								<Icon icon="tabler:device-desktop" />
								<span>不同页面侧栏挂件显示策略</span>
							</div>

							{/* 目标页面选择 */}
							<div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--admin-border)', paddingBottom: 10, flexWrap: 'wrap' }}>
								{[
									{ id: 'home', name: '首页 (Home)', desc: '首页右侧' },
									{ id: 'categories', name: '分类 (Categories)', desc: '分类矩阵页' },
									{ id: 'archive', name: '归档 (Archive)', desc: '归档年份页' },
									{ id: 'post', name: '文章详情 (Post)', desc: '文章目录TOC' },
									{ id: 'link', name: '友链 (Link)', desc: '博友圈页' },
								].map(page => (
									<button
										key={page.id}
										type="button"
										className={`admin-btn ${activePage === page.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
										onClick={() => setActivePage(page.id as any)}
									>
										<span>{page.name}</span>
									</button>
								))}
							</div>

							<div style={{ fontSize: 12, color: 'var(--admin-text-3)' }}>
								当前正在配置 <strong>{activePage}</strong> 页面的侧栏挂载挂件，勾选以启用，上下按钮调整前台渲染顺序：
							</div>

							<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
								{(widgetData.availableWidgets || []).map((w) => {
									const isEnabled = currentAsideList.includes(w.id)
									const orderIdx = currentAsideList.indexOf(w.id)

									return (
										<div
											key={w.id}
											style={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												padding: '12px 14px',
												borderRadius: 6,
												background: isEnabled ? 'var(--admin-surface)' : 'var(--admin-bg-subtle)',
												border: isEnabled ? '1.5px solid var(--admin-accent)' : '1px solid var(--admin-border)',
												opacity: isEnabled ? 1 : 0.65,
												transition: 'all 0.15s ease',
											}}
										>
											<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
												<input
													type="checkbox"
													checked={isEnabled}
													onChange={() => handleToggleWidget(w.id)}
													style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
												/>
												<Icon icon={w.icon} style={{ fontSize: 20, color: isEnabled ? 'var(--admin-accent)' : 'var(--admin-text-3)' }} />
												<div>
													<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)' }}>
														{w.name}
													</div>
													<div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>
														{w.description}
													</div>
												</div>
											</div>

											{isEnabled && (
												<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
													<button
														type="button"
														className="admin-btn btn-ghost btn-sm"
														disabled={orderIdx === 0}
														onClick={() => handleMoveWidgetOrder(orderIdx, 'up')}
														title="上移"
													>
														<Icon icon="tabler:arrow-up" />
													</button>
													<button
														type="button"
														className="admin-btn btn-ghost btn-sm"
														disabled={orderIdx === currentAsideList.length - 1}
														onClick={() => handleMoveWidgetOrder(orderIdx, 'down')}
														title="下移"
													>
														<Icon icon="tabler:arrow-down" />
													</button>
													<span className="admin-badge badge-primary" style={{ fontSize: 10 }}>
														第 {orderIdx + 1} 位
													</span>
												</div>
											)}
										</div>
									)
								})}
							</div>
						</div>
					)}

					{/* 2. 心知天气配置 (BlogWeather) */}
					{activeSection === 'weather' && (
						<div className="admin-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
							<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
								<div className="admin-section-title">
									<Icon icon="tabler:cloud-sun" style={{ color: '#f59e0b' }} />
									<span>心知天气 (Seniverse) 挂件参数配置</span>
								</div>

								<button
									type="button"
									className="admin-btn btn-secondary btn-sm"
									onClick={handleTestWeatherApi}
									disabled={testingWeather}
									title="使用当前配置测试请求心知天气 API"
								>
									<Icon icon={testingWeather ? 'tabler:loader-2' : 'tabler:broadcast'} style={{ animation: testingWeather ? 'spin 1s linear infinite' : 'none' }} />
									<span>{testingWeather ? '正在探测中...' : '测试心知 API 连通性'}</span>
								</button>
							</div>

							{/* 提示信息 */}
							<div style={{ padding: '10px 14px', background: 'var(--admin-bg-subtle)', borderRadius: 8, border: '1px solid var(--admin-border)', fontSize: 12, lineHeight: 1.6, color: 'var(--admin-text-2)' }}>
								<div style={{ fontWeight: 600, color: 'var(--admin-text-1)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
									<Icon icon="tabler:info-circle" style={{ color: 'var(--admin-accent)' }} />
									<span>关于心知天气 V3 接口集成：</span>
								</div>
								<div>
									本博客已完整接入心知天气实况接口与 3 天逐日气象预报，支持城市中文、拼音或 <code>ip</code> 自动探测。
									若无自定义 Key 可使用默认公共演示 Key，也可前往 <a href="https://www.seniverse.com" target="_blank" rel="noreferrer" style={{ color: 'var(--admin-accent)', textDecoration: 'underline' }}>心知天气官网</a> 免费申请私有 API Key。
								</div>
							</div>

							{/* 卡片标题 */}
							<div className="admin-form-group">
								<label className="admin-form-label">挂件标题 (Widget Title)</label>
								<input
									type="text"
									className="admin-input"
									value={widgetData.weather?.title || '实时天气'}
									onChange={e => handleUpdateWeatherField('title', e.target.value)}
									placeholder="如：实时天气 / 今日气象"
								/>
							</div>

							{/* 默认城市与快捷填入 */}
							<div className="admin-form-group">
								<label className="admin-form-label">定位策略 (City / Location)</label>
								<input
									type="text"
									className="admin-input"
									value={widgetData.weather?.defaultCity || 'ip'}
									onChange={e => handleUpdateWeatherField('defaultCity', e.target.value)}
									placeholder="留空或输入 ip 为访问者自动定位，也可指定城市如：beijing / 上海"
								/>
								<div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
									<span>快捷选项：</span>
									{['ip', 'beijing', 'shanghai', 'guangzhou', 'shenzhen', 'hangzhou', 'chengdu', 'wuhan', 'nanjing'].map(city => (
										<button
											key={city}
											type="button"
											className={`admin-btn ${widgetData.weather?.defaultCity === city ? 'btn-primary' : 'btn-ghost'} btn-sm`}
											style={{ padding: '1px 8px', fontSize: 11, height: 22 }}
											onClick={() => handleUpdateWeatherField('defaultCity', city)}
										>
											{city === 'ip' ? '🌐 访客自动IP定位 (推荐)' : city}
										</button>
									))}
								</div>
							</div>

							{/* API Key */}
							<div className="admin-form-group">
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
									<label className="admin-form-label" style={{ marginBottom: 0 }}>心知天气 API Key (私钥 / 公钥)</label>
									<button
										type="button"
										className="admin-btn btn-ghost btn-sm"
										style={{ padding: '0 6px', fontSize: 11, height: 20 }}
										onClick={() => setShowApiKey(!showApiKey)}
									>
										<Icon icon={showApiKey ? 'tabler:eye-off' : 'tabler:eye'} />
										<span>{showApiKey ? '隐藏' : '查看'}</span>
									</button>
								</div>
								<input
									type={showApiKey ? 'text' : 'password'}
									className="admin-input"
									value={widgetData.weather?.apiKey || ''}
									onChange={e => handleUpdateWeatherField('apiKey', e.target.value)}
									placeholder="请输入心知天气 API Key (如 SvyX4Wvh0a)"
								/>
								<div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginTop: 4 }}>
									留空时将自动使用本站内置的免鉴权实况代理通道
								</div>
							</div>

							{/* 温度单位 */}
							<div className="admin-form-group">
								<label className="admin-form-label">气温单位 (Temperature Unit)</label>
								<div style={{ display: 'flex', gap: 12 }}>
									<label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
										<input
											type="radio"
											name="weatherUnit"
											value="c"
											checked={(widgetData.weather?.unit || 'c') === 'c'}
											onChange={() => handleUpdateWeatherField('unit', 'c')}
										/>
										<span>摄氏度 (°C)</span>
									</label>
									<label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
										<input
											type="radio"
											name="weatherUnit"
											value="f"
											checked={widgetData.weather?.unit === 'f'}
											onChange={() => handleUpdateWeatherField('unit', 'f')}
										/>
										<span>华氏度 (°F)</span>
									</label>
								</div>
							</div>
						</div>
					)}

					{/* 3. 技术信息配置 (BlogTech) */}
					{activeSection === 'tech' && (
						<div className="admin-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
							<div className="admin-section-title">
								<Icon icon="tabler:stack-2" />
								<span>技术信息卡片 (BlogTech) 参数</span>
							</div>

							<div className="admin-form-group">
								<label className="admin-form-label required">卡片标题</label>
								<input
									type="text"
									className="admin-input"
									value={widgetData.tech?.title || ''}
									onChange={e => {
										setWidgetData(prev => ({
											...prev,
											tech: { ...prev.tech!, title: e.target.value },
										}))
										setIsDirty(true)
									}}
								/>
							</div>

							{/* 服务提供商列表 */}
							<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
									<label className="admin-form-label" style={{ margin: 0 }}>
										服务提供商 (Services) - 当前共 {(widgetData.tech?.services || []).length} 项
									</label>
									<button type="button" className="admin-btn btn-primary btn-sm" onClick={handleAddTechService}>
										<Icon icon="tabler:plus" />
										<span>新增服务商</span>
									</button>
								</div>

								{(widgetData.tech?.services || []).map((srv, idx) => (
									<div
										key={idx}
										style={{
											display: 'grid',
											gridTemplateColumns: 'auto 1fr 1fr auto',
											gap: 8,
											alignItems: 'center',
											padding: '8px 10px',
											borderRadius: 6,
											background: 'var(--admin-bg-subtle)',
											border: '1px solid var(--admin-border)',
										}}
									>
										<div
											style={{
												width: 32,
												height: 32,
												borderRadius: 6,
												background: 'var(--admin-surface)',
												border: '1px solid var(--admin-border)',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												cursor: 'pointer',
												color: srv.iconColor || 'var(--admin-accent)',
											}}
											onClick={() => {
												setIconPickerTarget({ type: 'techService', index: idx, currentIcon: srv.icon })
												setIconPickerOpen(true)
											}}
											title="点击挑选图标"
										>
											<Icon icon={srv.icon || 'tabler:circle'} style={{ fontSize: 18 }} />
										</div>

										<input
											type="text"
											className="admin-input"
											placeholder="服务类型 (如: 部署平台)"
											value={srv.label}
											onChange={e => handleUpdateTechService(idx, 'label', e.target.value)}
										/>

										<input
											type="text"
											className="admin-input"
											placeholder="名称 (如: EdgeOne)"
											value={srv.value}
											onChange={e => handleUpdateTechService(idx, 'value', e.target.value)}
										/>

										<button
											type="button"
											className="admin-btn btn-ghost btn-sm"
											onClick={() => handleDeleteTechService(idx)}
											style={{ color: 'var(--admin-danger)' }}
											title="删除"
										>
											<Icon icon="tabler:trash" />
										</button>
									</div>
								))}
							</div>

							{/* 技术栈网格列表 */}
							<div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
									<label className="admin-form-label" style={{ margin: 0 }}>
										技术栈体系 (Tech Stack) - 当前共 {(widgetData.tech?.techstack || []).length} 项
									</label>
									<button type="button" className="admin-btn btn-primary btn-sm" onClick={handleAddTechStack}>
										<Icon icon="tabler:plus" />
										<span>新增技术栈</span>
									</button>
								</div>

								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
									{(widgetData.tech?.techstack || []).map((stk, idx) => (
										<div
											key={idx}
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: 6,
												padding: '8px 10px',
												borderRadius: 6,
												background: 'var(--admin-bg-subtle)',
												border: '1px solid var(--admin-border)',
											}}
										>
											<div
												style={{
													width: 32,
													height: 32,
													borderRadius: 6,
													background: 'var(--admin-surface)',
													border: '1px solid var(--admin-border)',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													cursor: 'pointer',
													color: stk.iconColor || 'var(--admin-accent)',
													flexShrink: 0,
												}}
												onClick={() => {
													setIconPickerTarget({ type: 'techStack', index: idx, currentIcon: stk.icon })
													setIconPickerOpen(true)
												}}
												title="点击挑选图标"
											>
												<Icon icon={stk.icon || 'tabler:code'} style={{ fontSize: 18 }} />
											</div>

											<div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
												<input
													type="text"
													className="admin-input"
													placeholder="名称 (如 React)"
													value={stk.name}
													onChange={e => handleUpdateTechStack(idx, 'name', e.target.value)}
													style={{ height: 26, fontSize: 12 }}
												/>
												<input
													type="text"
													className="admin-input"
													placeholder="版本 (如 ^19.0.0)"
													value={stk.version}
													onChange={e => handleUpdateTechStack(idx, 'version', e.target.value)}
													style={{ height: 24, fontSize: 11, fontFamily: 'var(--admin-font-mono)' }}
												/>
											</div>

											<button
												type="button"
												className="admin-btn btn-ghost btn-sm"
												onClick={() => handleDeleteTechStack(idx)}
												style={{ color: 'var(--admin-danger)', padding: '0 4px' }}
												title="删除"
											>
												<Icon icon="tabler:trash" />
											</button>
										</div>
									))}
								</div>
							</div>
						</div>
					)}

					{/* 3. 社区群配置 (CommGroup) */}
					{activeSection === 'commGroup' && (
						<div className="admin-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
							<div className="admin-section-title">
								<Icon icon="tabler:users" />
								<span>社区交流卡片 (CommGroup) 参数</span>
							</div>

							<div className="admin-form-group">
								<label className="admin-form-label required">卡片标题</label>
								<input
									type="text"
									className="admin-input"
									value={widgetData.commGroup?.title || ''}
									onChange={e => {
										setWidgetData(prev => ({
											...prev,
											commGroup: { ...prev.commGroup!, title: e.target.value },
										}))
										setIsDirty(true)
									}}
								/>
							</div>

							<div className="admin-form-group">
								<label className="admin-form-label required">群组/频道名称</label>
								<input
									type="text"
									className="admin-input"
									value={widgetData.commGroup?.groupName || ''}
									onChange={e => {
										setWidgetData(prev => ({
											...prev,
											commGroup: { ...prev.commGroup!, groupName: e.target.value },
										}))
										setIsDirty(true)
									}}
								/>
							</div>

							<div className="admin-form-group">
								<label className="admin-form-label required">群号 / 联系账号</label>
								<input
									type="text"
									className="admin-input"
									value={widgetData.commGroup?.account || ''}
									onChange={e => {
										setWidgetData(prev => ({
											...prev,
											commGroup: { ...prev.commGroup!, account: e.target.value },
										}))
										setIsDirty(true)
									}}
								/>
							</div>

							<div className="admin-form-group">
								<label className="admin-form-label">展示图标</label>
								<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
									<div
										style={{
											width: 36,
											height: 36,
											borderRadius: 6,
											background: 'var(--admin-surface-hover)',
											border: '1px solid var(--admin-border)',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											cursor: 'pointer',
											color: 'var(--admin-accent)',
											fontSize: 20,
										}}
										onClick={() => {
											setIconPickerTarget({ type: 'commGroup', currentIcon: widgetData.commGroup?.icon })
											setIconPickerOpen(true)
										}}
									>
										<Icon icon={widgetData.commGroup?.icon || 'ri:qq-fill'} />
									</div>
									<input
										type="text"
										className="admin-input"
										value={widgetData.commGroup?.icon || ''}
										onChange={e => {
											setWidgetData(prev => ({
												...prev,
												commGroup: { ...prev.commGroup!, icon: e.target.value },
											}))
											setIsDirty(true)
										}}
										style={{ flex: 1 }}
									/>
								</div>
							</div>
						</div>
					)}

					{/* 4. 更新日志配置 (BlogLog) */}
					{activeSection === 'log' && (
						<div className="admin-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
							<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
								<div className="admin-section-title">
									<Icon icon="tabler:notes" />
									<span>更新日志卡片 (BlogLog)</span>
								</div>
								<button type="button" className="admin-btn btn-primary btn-sm" onClick={handleAddLogItem}>
									<Icon icon="tabler:plus" />
									<span>新增日志记录</span>
								</button>
							</div>

							<div className="admin-form-group">
								<label className="admin-form-label required">卡片标题</label>
								<input
									type="text"
									className="admin-input"
									value={widgetData.log?.title || ''}
									onChange={e => {
										setWidgetData(prev => ({
											...prev,
											log: { ...prev.log!, title: e.target.value },
										}))
										setIsDirty(true)
									}}
								/>
							</div>

							<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
								{(widgetData.log?.items || []).map((item, idx) => (
									<div
										key={idx}
										style={{
											display: 'grid',
											gridTemplateColumns: '130px 1fr auto',
											gap: 8,
											alignItems: 'center',
											padding: '8px 10px',
											borderRadius: 6,
											background: 'var(--admin-bg-subtle)',
											border: '1px solid var(--admin-border)',
										}}
									>
										<input
											type="date"
											className="admin-input"
											value={item.date}
											onChange={e => handleUpdateLogItem(idx, 'date', e.target.value)}
										/>
										<input
											type="text"
											className="admin-input"
											placeholder="更新内容说明..."
											value={item.content}
											onChange={e => handleUpdateLogItem(idx, 'content', e.target.value)}
										/>
										<button
											type="button"
											className="admin-btn btn-ghost btn-sm"
											onClick={() => handleDeleteLogItem(idx)}
											style={{ color: 'var(--admin-danger)' }}
											title="删除"
										>
											<Icon icon="tabler:trash" />
										</button>
									</div>
								))}
							</div>
						</div>
					)}

					{/* 5. 博客统计卡片 (BlogStats) */}
					{activeSection === 'stats' && (
						<div className="admin-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
							<div className="admin-section-title">
								<Icon icon="tabler:chart-bar" />
								<span>博客统计卡片参数</span>
							</div>

							<div className="admin-form-group">
								<label className="admin-form-label">归档页面出生基准年份 (Birth Year)</label>
								<input
									type="number"
									className="admin-input"
									value={widgetData.statsConfig?.birthYear || 2006}
									onChange={e => {
										setWidgetData(prev => ({
											...prev,
											statsConfig: { ...prev.statsConfig, birthYear: Number(e.target.value) || 2006 },
										}))
										setIsDirty(true)
									}}
								/>
								<div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginTop: 4 }}>
									用于归档页面计算每年对应的博主年龄
								</div>
							</div>
						</div>
					)}
				</div>

				{/* 右侧：前台高保真 Aside 侧栏实时舞台 */}
				<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
					<div
						className="admin-card"
						style={{
							padding: '16px',
							position: 'sticky',
							top: 80,
							display: 'flex',
							flexDirection: 'column',
							gap: 14,
						}}
					>
						{/* 舞台顶栏：主题切换与指示 */}
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--admin-border)', paddingBottom: 10 }}>
							<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
								<Icon icon="tabler:eye" style={{ color: 'var(--admin-accent)' }} />
								<span>前台 Aside 实时视口舞台</span>
							</div>

							<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
								<button
									type="button"
									className="admin-btn btn-ghost btn-sm"
									onClick={() => setPreviewTheme(previewTheme === 'dark' ? 'light' : 'dark')}
									title={`切换预览主题模式 (当前: ${previewTheme === 'dark' ? '深色' : '浅色'})`}
									style={{ height: 24, padding: '0 8px', fontSize: 11 }}
								>
									<Icon icon={previewTheme === 'dark' ? 'tabler:sun' : 'tabler:moon'} />
									<span>{previewTheme === 'dark' ? '深色' : '浅色'}</span>
								</button>
								<span className="admin-badge badge-primary" style={{ fontSize: 10 }}>0ms Live Sync</span>
							</div>
						</div>

						{/* 前台真实环境包装舞台容器 */}
						<div
							data-theme={previewTheme}
							style={{
								padding: '16px 12px',
								borderRadius: 8,
								background: previewTheme === 'dark' ? '#090a0f' : '#f8fafc',
								border: '1px solid var(--admin-border)',
								transition: 'background 0.2s ease',
							}}
						>
							<div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 340, margin: '0 auto' }}>
								{activeSection === 'weather' && (
									<BlogWeather
										customData={{
											title: widgetData.weather?.title,
											apiKey: widgetData.weather?.apiKey,
											defaultCity: widgetData.weather?.defaultCity,
											unit: widgetData.weather?.unit,
										}}
									/>
								)}

								{activeSection === 'tech' && (
									<BlogTech
										customData={{
											title: widgetData.tech?.title,
											services: widgetData.tech?.services,
											techstack: widgetData.tech?.techstack,
										}}
									/>
								)}

								{activeSection === 'commGroup' && (
									<CommGroup
										customData={{
											title: widgetData.commGroup?.title,
											groupName: widgetData.commGroup?.groupName,
											account: widgetData.commGroup?.account,
											icon: widgetData.commGroup?.icon,
											bgImg: widgetData.commGroup?.bgImg,
										}}
									/>
								)}

								{activeSection === 'log' && (
									<BlogLog
										customData={{
											title: widgetData.log?.title,
											items: widgetData.log?.items,
										}}
									/>
								)}

								{activeSection === 'stats' && (
									<BlogStats />
								)}

								{activeSection === 'layout' && (
									<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
										<div style={{ fontSize: 12, color: 'var(--admin-text-3)', fontWeight: 600 }}>
											【{activePage}】页面实时排布：
										</div>
										{currentAsideList.length === 0 ? (
											<div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--admin-text-3)', fontSize: 12 }}>
												当前页面未挂载任何挂件
											</div>
										) : (
											currentAsideList.map((wid) => {
												if (wid === 'blog-weather' || wid === 'weather') {
													return (
														<BlogWeather
															key={wid}
															customData={{
																title: widgetData.weather?.title,
																apiKey: widgetData.weather?.apiKey,
																defaultCity: widgetData.weather?.defaultCity,
																unit: widgetData.weather?.unit,
															}}
														/>
													)
												}
												if (wid === 'blog-stats') return <BlogStats key={wid} />
												if (wid === 'blog-tech') {
													return (
														<BlogTech
															key={wid}
															customData={{
																title: widgetData.tech?.title,
																services: widgetData.tech?.services,
																techstack: widgetData.tech?.techstack,
															}}
														/>
													)
												}
												if (wid === 'comm-group') {
													return (
														<CommGroup
															key={wid}
															customData={{
																title: widgetData.commGroup?.title,
																groupName: widgetData.commGroup?.groupName,
																account: widgetData.commGroup?.account,
																icon: widgetData.commGroup?.icon,
																bgImg: widgetData.commGroup?.bgImg,
															}}
														/>
													)
												}
												if (wid === 'blog-log') {
													return (
														<BlogLog
															key={wid}
															customData={{
																title: widgetData.log?.title,
																items: widgetData.log?.items,
															}}
														/>
													)
												}
												if (wid === 'toc') {
													return (
														<div
															key={wid}
															style={{
																padding: '14px',
																borderRadius: 8,
																background: 'var(--admin-surface)',
																border: '1px solid var(--admin-border)',
																fontSize: 12,
																color: 'var(--admin-text-3)',
															}}
														>
															<div style={{ fontWeight: 600, color: 'var(--admin-text-1)', marginBottom: 4 }}>
																文章大纲目录 (TOC)
															</div>
															<div>由博文详情页 Markdown 标题自动生成</div>
														</div>
													)
												}
												return null
											})
										)}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* 全站统一图标选择器 */}
			{iconPickerOpen && (
				<IconPickerModal
					currentIcon={iconPickerTarget?.currentIcon || 'tabler:circle'}
					onSelect={handleIconSelected}
					onClose={() => {
						setIconPickerOpen(false)
						setIconPickerTarget(null)
					}}
				/>
			)}
		</div>
	)
}

export default WidgetManagerView

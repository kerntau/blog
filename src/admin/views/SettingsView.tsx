import React, { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import { useToast } from '../components/Toast'
import { getGithubAvatar, getOicqAvatar } from '../../utils/img'
import type { SiteInfoData, AppearanceConfigData } from '../types'

// OG 卡片微光背景预设
const OG_GRADIENT_PRESETS = [
	{ name: '暮光极光', bg: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)', textColor: '#ffffff' },
	{ name: '科技深海', bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0284c7 100%)', textColor: '#ffffff' },
	{ name: '翡翠极光', bg: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #10b981 100%)', textColor: '#ffffff' },
	{ name: '日落余晖', bg: 'linear-gradient(135deg, #831843 0%, #db2777 50%, #f97316 100%)', textColor: '#ffffff' },
	{ name: '深邃暗夜', bg: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #3f3f46 100%)', textColor: '#ffffff' },
	{ name: '清新晨曦', bg: 'linear-gradient(135deg, #e0e7ff 0%, #fae8ff 50%, #fce7f3 100%)', textColor: '#1e1b4b' },
]

const QUICK_EMOJIS = [
	'🌈',
	'☕',
	'💡',
	'🦄',
	'🎯',
	'💻',
	'⚡',
	'🚀',
	'🎨',
	'🔮',
	'✨',
	'🌟',
	'🎮',
	'🔥',
	'💎',
	'🪐',
	'🐱',
	'📖',
	'🍵',
	'🎈',
	'⚙️',
	'🛡️',
	'🤖',
	'🏖️',
]

type SettingsTab = 'basic' | 'author' | 'seo' | 'social' | 'display' | 'render'

export const SettingsView: React.FC = () => {
	const { showToast } = useToast()
	const fileInputRef = useRef<HTMLInputElement>(null)

	const [activeTab, setActiveTab] = useState<SettingsTab>('basic')
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [isDirty, setIsDirty] = useState(false)
	const [uploadingAvatar, setUploadingAvatar] = useState(false)

	// 站点基础与身份数据 (对应 blog.config.ts)
	const [siteInfo, setSiteInfo] = useState<SiteInfoData>({
		title: '序栈',
		subtitle: '心中有景,花香满径',
		description: '在有序的世界里，寻一处生活的归栈。用理性梳理日常，用技术温柔时光，不慌不忙，自在生长。',
		authorName: 'kerntau',
		authorAvatar: '/avatar.webp',
		authorEmail: '1722288011@qq.com',
		authorHomepage: 'https://keru.in/',
		url: 'https://keru.in/',
		favicon: '/favicon.ico',
		timeEstablished: '2025-11-10',
		timeZone: 'Asia/Shanghai',
		defaultCategory: '前端开发',
		copyrightAbbr: 'CC BY-NC-SA 4.0',
		emojiTail: ['🌈', '☕', '💡', '🦄', '🎯'],
		logo: '/avatar.webp',
	})

	// 外观与渲染数据 (对应 src/app.config.ts)
	const [appearance, setAppearance] = useState<AppearanceConfigData>({
		alert: { defaultStyle: 'card' },
		codeblock: { triggerRows: 32, collapsedRows: 16, enableIndentGuide: true, indent: 4, tabSize: 3 },
		excerpt: { animation: true, caret: '_' },
		slide: { showTitle: true },
		pagination: { perPage: 10, sortOrder: 'date', allowAscending: false },
	})

	// 社交卡片与快捷抓取状态
	const [selectedOgPreset, setSelectedOgPreset] = useState(0)
	const [avatarInputType, setAvatarInputType] = useState<'url' | 'github' | 'qq'>('url')
	const [githubUsername, setGithubUsername] = useState('')
	const [qqNumber, setQqNumber] = useState('')
	const [customEmojiInput, setCustomEmojiInput] = useState('')

	// 代码块预览折叠状态
	const [previewCodeCollapsed, setPreviewCodeCollapsed] = useState(false)

	const loadAllSettings = async () => {
		setLoading(true)
		try {
			const [siteData, appData] = await Promise.all([
				adminApi.getSiteInfo(),
				adminApi.getAppearance().catch(() => null),
			])

			setSiteInfo(prev => ({
				...prev,
				...siteData,
				emojiTail: siteData.emojiTail && siteData.emojiTail.length > 0 ? siteData.emojiTail : prev.emojiTail,
			}))

			if (appData) {
				setAppearance(prev => ({
					...prev,
					...appData,
					alert: appData.alert || prev.alert,
					codeblock: appData.codeblock || prev.codeblock,
					excerpt: appData.excerpt || prev.excerpt,
					slide: appData.slide || prev.slide,
					pagination: appData.pagination || prev.pagination,
				}))
			}

			setIsDirty(false)
		}
		catch (err: any) {
			showToast(`加载全局设置失败: ${err.message}`, 'error')
		}
		finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadAllSettings()
	}, [])

	// 保存全部修改
	const handleSave = async () => {
		setSaving(true)
		try {
			await Promise.all([
				adminApi.saveSiteInfo(siteInfo),
				adminApi.saveAppearance(appearance),
			])

			window.dispatchEvent(new CustomEvent('site-info-updated', { detail: siteInfo }))
			setIsDirty(false)
			showToast('全站配置已成功更新保存并实时生效！', 'success')
		}
		catch (err: any) {
			showToast(`保存配置失败: ${err.message}`, 'error')
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
	}, [siteInfo, appearance])

	// 本地头像上传
	const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		if (!file.type.startsWith('image/')) {
			showToast('请选择有效的图片文件', 'warning')
			return
		}
		if (file.size > 5 * 1024 * 1024) {
			showToast('头像文件过大，建议小于 5MB', 'warning')
			return
		}

		setUploadingAvatar(true)
		try {
			const reader = new FileReader()
			reader.onload = async () => {
				const base64 = reader.result as string
				const ext = file.name.split('.').pop() || 'png'
				const fileName = `avatar-${Date.now()}.${ext}`

				const res = await adminApi.uploadAsset(fileName, base64)
				setSiteInfo(prev => ({ ...prev, authorAvatar: res.path, logo: res.path }))
				setIsDirty(true)
				showToast('新头像已成功上传，保存后全站生效', 'success')
			}
			reader.readAsDataURL(file)
		}
		catch (err: any) {
			showToast(`上传头像失败: ${err.message}`, 'error')
		}
		finally {
			setUploadingAvatar(false)
			if (fileInputRef.current) fileInputRef.current.value = ''
		}
	}

	// 抓取 GitHub 头像
	const applyGithubAvatar = () => {
		if (!githubUsername.trim()) {
			showToast('请输入 GitHub 用户名', 'warning')
			return
		}
		const avatarUrl = getGithubAvatar(githubUsername.trim(), { size: 300 })
		setSiteInfo(prev => ({ ...prev, authorAvatar: avatarUrl, logo: avatarUrl }))
		setIsDirty(true)
		showToast(`已提取 GitHub (@${githubUsername}) 头像`, 'success')
	}

	// 抓取 QQ 头像
	const applyQqAvatar = () => {
		if (!qqNumber.trim() || !/^\d+$/.test(qqNumber.trim())) {
			showToast('请输入有效的 QQ 号码', 'warning')
			return
		}
		const avatarUrl = getOicqAvatar(qqNumber.trim(), 640)
		setSiteInfo(prev => ({ ...prev, authorAvatar: avatarUrl, logo: avatarUrl }))
		setIsDirty(true)
		showToast(`已提取 QQ (${qqNumber}) 头像`, 'success')
	}

	// Emoji 增删
	const handleAddEmoji = (emoji: string) => {
		if (!emoji.trim()) return
		setSiteInfo(prev => ({
			...prev,
			emojiTail: [...(prev.emojiTail || []), emoji.trim()],
		}))
		setCustomEmojiInput('')
		setIsDirty(true)
	}

	const handleRemoveEmoji = (index: number) => {
		setSiteInfo(prev => ({
			...prev,
			emojiTail: (prev.emojiTail || []).filter((_, i) => i !== index),
		}))
		setIsDirty(true)
	}

	const handleMoveEmoji = (index: number, dir: 'left' | 'right') => {
		const list = [...(siteInfo.emojiTail || [])]
		const target = dir === 'left' ? index - 1 : index + 1
		if (target < 0 || target >= list.length) return
		const temp = list[index]!
		list[index] = list[target]!
		list[target] = temp
		setSiteInfo(prev => ({ ...prev, emojiTail: list }))
		setIsDirty(true)
	}

	const handleResetDefaultAppearance = () => {
		setAppearance({
			alert: { defaultStyle: 'card' },
			codeblock: { triggerRows: 32, collapsedRows: 16, enableIndentGuide: true, indent: 4, tabSize: 3 },
			excerpt: { animation: true, caret: '_' },
			slide: { showTitle: true },
			pagination: { perPage: 10, sortOrder: 'date', allowAscending: false },
		})
		setIsDirty(true)
		showToast('展示与渲染参数已恢复系统默认推荐值', 'info')
	}

	if (loading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
				<Icon icon="tabler:loader-2" style={{ fontSize: 24, color: 'var(--admin-text-3)', animation: 'spin 1s linear infinite' }} />
			</div>
		)
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
			{/* 顶栏控制栏 */}
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
							<Icon icon="tabler:settings" style={{ color: 'var(--admin-accent)', fontSize: 18 }} />
							<span>站点设置中心 (Site Settings)</span>
							{isDirty && (
								<span className="admin-badge badge-warning" style={{ fontSize: 11 }}>未保存修改</span>
							)}
						</div>
						<div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 2 }}>
							统一管理基础元数据、博主身份、SEO社交卡片、前台展示策略与内容渲染参数（支持 Ctrl+S 快速保存）
						</div>
					</div>

					<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
						<button
							type="button"
							className="admin-btn btn-secondary btn-sm"
							onClick={loadAllSettings}
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
							<span>{saving ? '保存中...' : '保存全站配置'}</span>
						</button>
					</div>
				</div>
			</div>

			{/* 统一分类 Tabs */}
			<div className="admin-card" style={{ padding: '8px 12px' }}>
				<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
					{[
						{ id: 'basic', name: '1. 基础信息', icon: 'tabler:info-circle' },
						{ id: 'author', name: '2. 作者与身份', icon: 'tabler:user-circle' },
						{ id: 'seo', name: '3. SEO 与元数据', icon: 'tabler:sparkles' },
						{ id: 'social', name: '4. 社交信息', icon: 'tabler:brand-github' },
						{ id: 'display', name: '5. 展示设置', icon: 'tabler:layout-list' },
						{ id: 'render', name: '6. 内容渲染', icon: 'tabler:code' },
					].map(tab => (
						<button
							key={tab.id}
							type="button"
							className={`admin-btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}
							onClick={() => setActiveTab(tab.id as SettingsTab)}
						>
							<Icon icon={tab.icon} />
							<span>{tab.name}</span>
						</button>
					))}
				</div>
			</div>

			{/* 主编辑视口：左侧表单 + 右侧实时预览 */}
			<div style={{ display: 'grid', gridTemplateColumns: 'minmax(460px, 1.25fr) minmax(360px, 1fr)', gap: 14 }}>
				{/* 左侧：表单配置区 */}
				<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
					{/* 1. 基础信息 (Basic) */}
					{activeTab === 'basic' && (
						<div className="admin-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
							<div className="admin-section-title">
								<Icon icon="tabler:world" />
								<span>站点基础信息 (Site Metadata)</span>
							</div>

							<div className="admin-form-group">
								<label className="admin-form-label required">网站名称 (Site Title)</label>
								<input
									type="text"
									className="admin-input"
									value={siteInfo.title}
									onChange={e => {
										setSiteInfo({ ...siteInfo, title: e.target.value })
										setIsDirty(true)
									}}
									placeholder="如: 序栈"
								/>
							</div>

							<div className="admin-form-group">
								<label className="admin-form-label">副标题 (Subtitle / Slogan)</label>
								<input
									type="text"
									className="admin-input"
									value={siteInfo.subtitle}
									onChange={e => {
										setSiteInfo({ ...siteInfo, subtitle: e.target.value })
										setIsDirty(true)
									}}
									placeholder="如: 心中有景,花香满径"
								/>
							</div>

							<div className="admin-form-group">
								<label className="admin-form-label">网站简介 (Description)</label>
								<textarea
									className="admin-input"
									rows={3}
									value={siteInfo.description}
									onChange={e => {
										setSiteInfo({ ...siteInfo, description: e.target.value })
										setIsDirty(true)
									}}
									placeholder="用于全站 Meta Description 与 SEO 爬虫抓取"
								/>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
								<div className="admin-form-group">
									<label className="admin-form-label required">规范域名 (Site URL)</label>
									<input
										type="text"
										className="admin-input"
										value={siteInfo.url}
										onChange={e => {
											setSiteInfo({ ...siteInfo, url: e.target.value })
											setIsDirty(true)
										}}
										placeholder="https://keru.in/"
									/>
								</div>

								<div className="admin-form-group">
									<label className="admin-form-label">建站时间 (Time Established)</label>
									<input
										type="date"
										className="admin-input"
										value={siteInfo.timeEstablished || '2025-11-10'}
										onChange={e => {
											setSiteInfo({ ...siteInfo, timeEstablished: e.target.value })
											setIsDirty(true)
										}}
									/>
								</div>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
								<div className="admin-form-group">
									<label className="admin-form-label">默认分类 (Default Category)</label>
									<input
										type="text"
										className="admin-input"
										value={siteInfo.defaultCategory || '前端开发'}
										onChange={e => {
											setSiteInfo({ ...siteInfo, defaultCategory: e.target.value })
											setIsDirty(true)
										}}
									/>
								</div>

								<div className="admin-form-group">
									<label className="admin-form-label">时区 (Timezone)</label>
									<input
										type="text"
										className="admin-input"
										value={siteInfo.timeZone || 'Asia/Shanghai'}
										onChange={e => {
											setSiteInfo({ ...siteInfo, timeZone: e.target.value })
											setIsDirty(true)
										}}
									/>
								</div>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
								<div className="admin-form-group">
									<label className="admin-form-label">网站 Favicon 图标路径</label>
									<input
										type="text"
										className="admin-input"
										value={siteInfo.favicon || '/favicon.ico'}
										onChange={e => {
											setSiteInfo({ ...siteInfo, favicon: e.target.value })
											setIsDirty(true)
										}}
									/>
								</div>

								<div className="admin-form-group">
									<label className="admin-form-label">默认版权协议 (License)</label>
									<input
										type="text"
										className="admin-input"
										value={siteInfo.copyrightAbbr || 'CC BY-NC-SA 4.0'}
										onChange={e => {
											setSiteInfo({ ...siteInfo, copyrightAbbr: e.target.value })
											setIsDirty(true)
										}}
									/>
								</div>
							</div>
						</div>
					)}

					{/* 2. 作者与身份 (Author) */}
					{activeTab === 'author' && (
						<div className="admin-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
							<div className="admin-section-title">
								<Icon icon="tabler:user-circle" />
								<span>博主身份与头像矩阵</span>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
								<div className="admin-form-group">
									<label className="admin-form-label required">博主昵称 (Author Name)</label>
									<input
										type="text"
										className="admin-input"
										value={siteInfo.authorName}
										onChange={e => {
											setSiteInfo({ ...siteInfo, authorName: e.target.value })
											setIsDirty(true)
										}}
										placeholder="如: kerntau"
									/>
								</div>

								<div className="admin-form-group">
									<label className="admin-form-label">博主联系邮箱 (Email)</label>
									<input
										type="email"
										className="admin-input"
										value={siteInfo.authorEmail || ''}
										onChange={e => {
											setSiteInfo({ ...siteInfo, authorEmail: e.target.value })
											setIsDirty(true)
										}}
										placeholder="your-email@domain.com"
									/>
								</div>
							</div>

							<div className="admin-form-group">
								<label className="admin-form-label">个人主页 (Homepage)</label>
								<input
									type="text"
									className="admin-input"
									value={siteInfo.authorHomepage || ''}
									onChange={e => {
										setSiteInfo({ ...siteInfo, authorHomepage: e.target.value })
										setIsDirty(true)
									}}
									placeholder="https://keru.in/"
								/>
							</div>

							{/* 头像配置 */}
							<div className="admin-form-group">
								<label className="admin-form-label required">博主头像 (Author Avatar & Logo)</label>
								<div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
									{[
										{ id: 'url', name: '网络/本地路径' },
										{ id: 'github', name: '从 GitHub 提取' },
										{ id: 'qq', name: '从 QQ 提取' },
									].map(t => (
										<button
											key={t.id}
											type="button"
											className={`admin-btn ${avatarInputType === t.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
											onClick={() => setAvatarInputType(t.id as any)}
										>
											{t.name}
										</button>
									))}
								</div>

								{avatarInputType === 'url' && (
									<div style={{ display: 'flex', gap: 8 }}>
										<input
											type="text"
											className="admin-input"
											value={siteInfo.authorAvatar}
											onChange={e => {
												setSiteInfo({ ...siteInfo, authorAvatar: e.target.value, logo: e.target.value })
												setIsDirty(true)
											}}
											placeholder="/avatar.webp 或 https://..."
										/>
										<button
											type="button"
											className="admin-btn btn-secondary btn-sm"
											onClick={() => fileInputRef.current?.click()}
											disabled={uploadingAvatar}
										>
											<Icon icon="tabler:upload" />
											<span>{uploadingAvatar ? '上传中...' : '上传本地图片'}</span>
										</button>
										<input
											ref={fileInputRef}
											type="file"
											accept="image/*"
											style={{ display: 'none' }}
											onChange={handleAvatarFileUpload}
										/>
									</div>
								)}

								{avatarInputType === 'github' && (
									<div style={{ display: 'flex', gap: 8 }}>
										<input
											type="text"
											className="admin-input"
											placeholder="输入 GitHub 用户名 (如 kerntau)"
											value={githubUsername}
											onChange={e => setGithubUsername(e.target.value)}
										/>
										<button type="button" className="admin-btn btn-primary btn-sm" onClick={applyGithubAvatar}>
											抓取头像
										</button>
									</div>
								)}

								{avatarInputType === 'qq' && (
									<div style={{ display: 'flex', gap: 8 }}>
										<input
											type="text"
											className="admin-input"
											placeholder="输入 QQ 号码 (如 1722288011)"
											value={qqNumber}
											onChange={e => setQqNumber(e.target.value)}
										/>
										<button type="button" className="admin-btn btn-primary btn-sm" onClick={applyQqAvatar}>
											抓取头像
										</button>
									</div>
								)}
							</div>

							{/* 头像悬浮 Emoji 动态阵列 */}
							<div className="admin-form-group">
								<label className="admin-form-label">
									头像悬浮 Emoji 动态阵列 (Emoji Tail)
								</label>
								<div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginBottom: 8 }}>
									前台鼠标悬浮在左上角头像时，动态飞出的趣味 Emoji 列表
								</div>

								<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
									{(siteInfo.emojiTail || []).map((emoji, idx) => (
										<div
											key={idx}
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: 4,
												padding: '4px 8px',
												borderRadius: 6,
												background: 'var(--admin-surface-hover)',
												border: '1px solid var(--admin-border)',
												fontSize: 14,
											}}
										>
											<span>{emoji}</span>
											<Icon
												icon="tabler:arrow-left"
												style={{ fontSize: 11, cursor: 'pointer', color: 'var(--admin-text-3)' }}
												onClick={() => handleMoveEmoji(idx, 'left')}
											/>
											<Icon
												icon="tabler:arrow-right"
												style={{ fontSize: 11, cursor: 'pointer', color: 'var(--admin-text-3)' }}
												onClick={() => handleMoveEmoji(idx, 'right')}
											/>
											<Icon
												icon="tabler:x"
												style={{ fontSize: 12, cursor: 'pointer', color: 'var(--admin-danger)' }}
												onClick={() => handleRemoveEmoji(idx)}
											/>
										</div>
									))}
								</div>

								{/* 快捷添加预置 Emoji */}
								<div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
									<span style={{ fontSize: 11, color: 'var(--admin-text-3)', marginRight: 4 }}>快捷添加:</span>
									{QUICK_EMOJIS.map(e => (
										<button
											key={e}
											type="button"
											className="admin-btn btn-ghost btn-sm"
											style={{ padding: '2px 6px', fontSize: 13 }}
											onClick={() => handleAddEmoji(e)}
										>
											{e}
										</button>
									))}
									<div style={{ display: 'flex', gap: 4, marginLeft: 6 }}>
										<input
											type="text"
											className="admin-input"
											placeholder="自定义Emoji"
											value={customEmojiInput}
											onChange={e => setCustomEmojiInput(e.target.value)}
											style={{ width: 90, padding: '2px 6px', fontSize: 12 }}
										/>
										<button
											type="button"
											className="admin-btn btn-secondary btn-sm"
											onClick={() => handleAddEmoji(customEmojiInput)}
										>
											添加
										</button>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* 3. SEO 与元数据 (SEO) */}
					{activeTab === 'seo' && (
						<div className="admin-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
							<div className="admin-section-title">
								<Icon icon="tabler:sparkles" />
								<span>搜索引擎与社交分享卡片 (SEO & OpenGraph)</span>
							</div>

							<div className="admin-form-group">
								<label className="admin-form-label">SEO 标题模版</label>
								<input
									type="text"
									className="admin-input"
									value={siteInfo.title}
									onChange={e => {
										setSiteInfo({ ...siteInfo, title: e.target.value })
										setIsDirty(true)
									}}
								/>
							</div>

							<div className="admin-form-group">
								<label className="admin-form-label">SEO 描述 (长描述利好收录)</label>
								<textarea
									className="admin-input"
									rows={3}
									value={siteInfo.description}
									onChange={e => {
										setSiteInfo({ ...siteInfo, description: e.target.value })
										setIsDirty(true)
									}}
								/>
								<div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginTop: 4 }}>
									当前字符数: {siteInfo.description.length} 字符 (建议在 80-160 字之间)
								</div>
							</div>

							<div className="admin-form-group">
								<label className="admin-form-label">社交卡片 (OpenGraph) 微光主题选择</label>
								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
									{OG_GRADIENT_PRESETS.map((preset, idx) => (
										<div
											key={preset.name}
											onClick={() => setSelectedOgPreset(idx)}
											style={{
												padding: '8px 10px',
												borderRadius: 6,
												background: preset.bg,
												color: preset.textColor,
												fontSize: 11,
												fontWeight: 600,
												textAlign: 'center',
												cursor: 'pointer',
												border: selectedOgPreset === idx ? '2px solid var(--admin-accent)' : '1px solid rgba(255,255,255,0.2)',
												boxShadow: selectedOgPreset === idx ? '0 0 10px rgba(0,0,0,0.3)' : 'none',
											}}
										>
											{preset.name}
										</div>
									))}
								</div>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
								<div style={{ padding: '10px 12px', background: 'var(--admin-surface-hover)', borderRadius: 6, fontSize: 12 }}>
									<div style={{ fontWeight: 600, color: 'var(--admin-text-1)', marginBottom: 2 }}>Sitemap 地图</div>
									<div style={{ color: 'var(--admin-text-3)' }}>{siteInfo.url.replace(/\/$/, '')}/sitemap.xml</div>
								</div>
								<div style={{ padding: '10px 12px', background: 'var(--admin-surface-hover)', borderRadius: 6, fontSize: 12 }}>
									<div style={{ fontWeight: 600, color: 'var(--admin-text-1)', marginBottom: 2 }}>Atom 订阅源</div>
									<div style={{ color: 'var(--admin-text-3)' }}>{siteInfo.url.replace(/\/$/, '')}/atom.xml</div>
								</div>
							</div>
						</div>
					)}

					{/* 4. 社交信息 (Social) */}
					{activeTab === 'social' && (
						<div className="admin-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
							<div className="admin-section-title">
								<Icon icon="tabler:brand-github" />
								<span>全站社交平台与外链</span>
							</div>

							<div className="admin-form-group">
								<label className="admin-form-label">GitHub 主页</label>
								<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
									<Icon icon="tabler:brand-github" style={{ fontSize: 18, color: 'var(--admin-text-2)' }} />
									<input
										type="text"
										className="admin-input"
										value="https://github.com/kerntau"
										readOnly
									/>
								</div>
							</div>

							<div className="admin-form-group">
								<label className="admin-form-label">Bilibili 个人空间</label>
								<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
									<Icon icon="ri:bilibili-fill" style={{ fontSize: 18, color: '#00a1d6' }} />
									<input
										type="text"
										className="admin-input"
										value="https://space.bilibili.com/9655855"
										readOnly
									/>
								</div>
							</div>

							<div className="admin-form-group">
								<label className="admin-form-label">X (Twitter) 账号</label>
								<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
									<Icon icon="tabler:brand-x" style={{ fontSize: 18, color: 'var(--admin-text-2)' }} />
									<input
										type="text"
										className="admin-input"
										value="https://x.com/Kerntao"
										readOnly
									/>
								</div>
							</div>

							<div style={{ fontSize: 12, color: 'var(--admin-text-3)', padding: '8px 12px', background: 'var(--admin-surface-hover)', borderRadius: 6 }}>
								提示：侧边栏与页脚显示的具体社交图标条目，可在 <strong>展示 → 导航管理</strong> 中随时自由增删与排序。
							</div>
						</div>
					)}

					{/* 5. 展示设置 (Display) */}
					{activeTab === 'display' && (
						<div className="admin-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
							<div className="admin-section-title">
								<Icon icon="tabler:layout-list" />
								<span>前台文章列表与页面展示策略</span>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
								<div className="admin-form-group">
									<label className="admin-form-label">每页文章数量 (Per Page)</label>
									<input
										type="number"
										min={1}
										max={50}
										className="admin-input"
										value={appearance.pagination?.perPage || 10}
										onChange={e => {
											setAppearance({
												...appearance,
												pagination: { ...appearance.pagination, perPage: Number(e.target.value) || 10 },
											})
											setIsDirty(true)
										}}
									/>
								</div>

								<div className="admin-form-group">
									<label className="admin-form-label">默认文章排序依据</label>
									<select
										className="admin-select"
										value={appearance.pagination?.sortOrder || 'date'}
										onChange={e => {
											setAppearance({
												...appearance,
												pagination: { ...appearance.pagination, sortOrder: e.target.value },
											})
											setIsDirty(true)
										}}
									>
										<option value="date">创建日期 (Date)</option>
										<option value="updated">最后更新日期 (Updated)</option>
									</select>
								</div>
							</div>

							<div className="admin-form-group">
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
									<div>
										<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)' }}>
											允许前台用户切换正序 (Ascending Order)
										</div>
										<div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>
											开启后排序方式左侧将显示正反序切换图标
										</div>
									</div>
									<input
										type="checkbox"
										checked={Boolean(appearance.pagination?.allowAscending)}
										onChange={e => {
											setAppearance({
												...appearance,
												pagination: { ...appearance.pagination, allowAscending: e.target.checked },
											})
											setIsDirty(true)
										}}
										style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
									/>
								</div>
							</div>

							<div className="admin-form-group">
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
									<div>
										<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)' }}>
											精选文章轮播显示标题 (Slide Show Title)
										</div>
										<div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>
											适合文章封面图无字时启用，在轮播底部居中显示标题
										</div>
									</div>
									<input
										type="checkbox"
										checked={Boolean(appearance.slide?.showTitle)}
										onChange={e => {
											setAppearance({
												...appearance,
												slide: { ...appearance.slide, showTitle: e.target.checked },
											})
											setIsDirty(true)
										}}
										style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
									/>
								</div>
							</div>

							<div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
								<button
									type="button"
									className="admin-btn btn-ghost btn-sm"
									onClick={handleResetDefaultAppearance}
								>
									<Icon icon="tabler:rotate" />
									<span>恢复默认展示参数</span>
								</button>
							</div>
						</div>
					)}

					{/* 6. 内容渲染 (Render) */}
					{activeTab === 'render' && (
						<div className="admin-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
							<div className="admin-section-title">
								<Icon icon="tabler:code" />
								<span>文章内容与排版渲染设置</span>
							</div>

							{/* 提示框风格 */}
							<div className="admin-form-group">
								<label className="admin-form-label">提示框外观风格 (Alert Style)</label>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
									{[
										{ id: 'card', name: '现代立体卡片 (Card)', desc: '带背景微光半透色块与全包裹边框' },
										{ id: 'flat', name: '极简扁平 (Flat)', desc: '仅左侧单条强调色线，浅底纯净' },
									].map(item => {
										const isSelected = appearance.alert?.defaultStyle === item.id
										return (
											<div
												key={item.id}
												onClick={() => {
													setAppearance({ ...appearance, alert: { defaultStyle: item.id as any } })
													setIsDirty(true)
												}}
												style={{
													padding: '10px 12px',
													borderRadius: 6,
													background: isSelected ? 'var(--admin-accent-soft)' : 'var(--admin-surface-hover)',
													border: isSelected ? '1.5px solid var(--admin-accent)' : '1px solid var(--admin-border)',
													cursor: 'pointer',
												}}
											>
												<div style={{ fontWeight: 600, fontSize: 13, color: isSelected ? 'var(--admin-accent)' : 'var(--admin-text-1)' }}>
													{item.name}
												</div>
												<div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginTop: 2 }}>{item.desc}</div>
											</div>
										)
									})}
								</div>
							</div>

							{/* 代码块参数 */}
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
								<div className="admin-form-group">
									<label className="admin-form-label">触发折叠行数 (Trigger Rows)</label>
									<input
										type="number"
										min={10}
										max={100}
										className="admin-input"
										value={appearance.codeblock?.triggerRows || 32}
										onChange={e => {
											setAppearance({
												...appearance,
												codeblock: { ...appearance.codeblock, triggerRows: Number(e.target.value) || 32 },
											})
											setIsDirty(true)
										}}
									/>
								</div>

								<div className="admin-form-group">
									<label className="admin-form-label">折叠后保留行数 (Collapsed Rows)</label>
									<input
										type="number"
										min={5}
										max={50}
										className="admin-input"
										value={appearance.codeblock?.collapsedRows || 16}
										onChange={e => {
											setAppearance({
												...appearance,
												codeblock: { ...appearance.codeblock, collapsedRows: Number(e.target.value) || 16 },
											})
											setIsDirty(true)
										}}
									/>
								</div>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
								<div className="admin-form-group">
									<label className="admin-form-label">缩进空格竖线匹配 (Indent)</label>
									<input
										type="number"
										min={2}
										max={8}
										className="admin-input"
										value={appearance.codeblock?.indent || 4}
										onChange={e => {
											setAppearance({
												...appearance,
												codeblock: { ...appearance.codeblock, indent: Number(e.target.value) || 4 },
											})
											setIsDirty(true)
										}}
									/>
								</div>

								<div className="admin-form-group">
									<label className="admin-form-label">Tab 渲染宽度 (Tab Size)</label>
									<input
										type="number"
										min={2}
										max={8}
										className="admin-input"
										value={appearance.codeblock?.tabSize || 3}
										onChange={e => {
											setAppearance({
												...appearance,
												codeblock: { ...appearance.codeblock, tabSize: Number(e.target.value) || 3 },
											})
											setIsDirty(true)
										}}
									/>
								</div>
							</div>

							<div className="admin-form-group">
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
									<div>
										<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)' }}>
											启用代码块缩进参考线 (Indent Guide)
										</div>
										<div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>
											在多层级代码块中显示垂直虚线辅助阅读
										</div>
									</div>
									<input
										type="checkbox"
										checked={Boolean(appearance.codeblock?.enableIndentGuide)}
										onChange={e => {
											setAppearance({
												...appearance,
												codeblock: { ...appearance.codeblock, enableIndentGuide: e.target.checked },
											})
											setIsDirty(true)
										}}
										style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
									/>
								</div>
							</div>

							{/* 摘要打字动画 */}
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
								<div className="admin-form-group">
									<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
										<div>
											<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)' }}>
												摘要打字机动效 (Excerpt Typing)
											</div>
											<div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>
												博文开头摘要打字机渐进动画
											</div>
										</div>
										<input
											type="checkbox"
											checked={Boolean(appearance.excerpt?.animation)}
											onChange={e => {
												setAppearance({
													...appearance,
													excerpt: { ...appearance.excerpt, animation: e.target.checked },
												})
												setIsDirty(true)
											}}
											style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
										/>
									</div>
								</div>

								<div className="admin-form-group">
									<label className="admin-form-label">打字机光标字符 (Caret)</label>
									<input
										type="text"
										className="admin-input"
										value={appearance.excerpt?.caret || '_'}
										onChange={e => {
											setAppearance({
												...appearance,
												excerpt: { ...appearance.excerpt, caret: e.target.value },
											})
											setIsDirty(true)
										}}
										placeholder="_"
									/>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* 右侧：高保真实时预览区 */}
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
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
							<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
								<Icon icon="tabler:eye" style={{ color: 'var(--admin-accent)' }} />
								<span>前台实时预览 (Live Preview)</span>
							</div>
							<span className="admin-badge badge-primary" style={{ fontSize: 10 }}>同源像素级</span>
						</div>

						{/* 预览分发 */}
						{(activeTab === 'basic' || activeTab === 'author') && (
							<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
								<div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>左侧栏博主顶部身份名片:</div>
								<div
									style={{
										padding: '16px',
										borderRadius: 8,
										background: 'var(--admin-bg-subtle)',
										border: '1px solid var(--admin-border)',
										display: 'flex',
										alignItems: 'center',
										gap: 14,
									}}
								>
									<img
										src={siteInfo.authorAvatar}
										alt={siteInfo.authorName}
										style={{
											width: 52,
											height: 52,
											borderRadius: '50%',
											objectFit: 'cover',
											border: '2px solid var(--admin-accent)',
										}}
										onError={e => (e.currentTarget.src = '/favicon.ico')}
									/>
									<div>
										<div style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-text-1)' }}>
											{siteInfo.title}
										</div>
										<div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 2 }}>
											{siteInfo.subtitle || siteInfo.description}
										</div>
									</div>
								</div>

								{/* Emoji 动效演示 */}
								<div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>头像悬浮 Emoji 飞出模拟:</div>
								<div
									style={{
										padding: '12px',
										borderRadius: 8,
										background: 'var(--admin-bg-subtle)',
										border: '1px solid var(--admin-border)',
										display: 'flex',
										gap: 8,
										alignItems: 'center',
										flexWrap: 'wrap',
									}}
								>
									{(siteInfo.emojiTail || []).map((emoji, idx) => (
										<span
											key={idx}
											style={{
												fontSize: 20,
												animation: `bounce 2s infinite ease-in-out ${idx * 0.15}s`,
												display: 'inline-block',
											}}
										>
											{emoji}
										</span>
									))}
								</div>
							</div>
						)}

						{activeTab === 'seo' && (
							<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
								<div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>社交分享卡片 (OpenGraph) 模拟:</div>
								<div
									style={{
										width: '100%',
										aspectRatio: '1200 / 630',
										borderRadius: 8,
										background: OG_GRADIENT_PRESETS[selectedOgPreset]?.bg,
										color: OG_GRADIENT_PRESETS[selectedOgPreset]?.textColor,
										padding: '24px',
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'space-between',
										boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
										overflow: 'hidden',
									}}
								>
									<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
										<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
											<img
												src={siteInfo.authorAvatar}
												alt=""
												style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.6)' }}
												onError={e => (e.currentTarget.src = '/favicon.ico')}
											/>
											<span style={{ fontSize: 16, fontWeight: 700 }}>{siteInfo.title}</span>
										</div>
										<span style={{ fontSize: 12, opacity: 0.85 }}>{siteInfo.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
									</div>

									<div>
										<div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.3, textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
											{siteInfo.subtitle || siteInfo.title}
										</div>
										<div style={{ fontSize: 12, opacity: 0.85, marginTop: 6, lineHeight: 1.4 }}>
											{siteInfo.description.slice(0, 75)}...
										</div>
									</div>

									<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.8 }}>
										<span>By @{siteInfo.authorName}</span>
										<span>{new Date().toISOString().slice(0, 10)}</span>
									</div>
								</div>
							</div>
						)}

						{activeTab === 'display' && (
							<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
								<div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>列表分页与排序模拟:</div>
								<div
									style={{
										padding: '14px',
										borderRadius: 8,
										background: 'var(--admin-bg-subtle)',
										border: '1px solid var(--admin-border)',
										display: 'flex',
										flexDirection: 'column',
										gap: 10,
									}}
								>
									<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
										<span style={{ color: 'var(--admin-text-2)' }}>
											排序方式: {appearance.pagination?.sortOrder === 'date' ? '按创建日期' : '按更新日期'}
											{appearance.pagination?.allowAscending ? ' (可逆序)' : ' (倒序)'}
										</span>
										<span className="admin-badge badge-secondary">每页 {appearance.pagination?.perPage || 10} 篇</span>
									</div>
									<div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8 }}>
										<button type="button" className="admin-btn btn-secondary btn-sm" disabled style={{ padding: '2px 8px' }}>«</button>
										<button type="button" className="admin-btn btn-primary btn-sm" style={{ padding: '2px 10px' }}>1</button>
										<button type="button" className="admin-btn btn-ghost btn-sm" style={{ padding: '2px 10px' }}>2</button>
										<button type="button" className="admin-btn btn-ghost btn-sm" style={{ padding: '2px 10px' }}>3</button>
										<button type="button" className="admin-btn btn-secondary btn-sm" style={{ padding: '2px 8px' }}>»</button>
									</div>
								</div>
							</div>
						)}

						{activeTab === 'render' && (
							<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
								<div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>Alert 提示框渲染预览:</div>
								<div
									style={{
										padding: appearance.alert?.defaultStyle === 'card' ? '12px 14px' : '10px 14px',
										borderRadius: 8,
										background: appearance.alert?.defaultStyle === 'card' ? 'rgba(59, 130, 246, 0.08)' : 'var(--admin-surface)',
										border: appearance.alert?.defaultStyle === 'card' ? '1px solid rgba(59, 130, 246, 0.25)' : 'none',
										borderLeft: appearance.alert?.defaultStyle === 'flat' ? '4px solid #3b82f6' : undefined,
										display: 'flex',
										gap: 10,
										alignItems: 'flex-start',
									}}
								>
									<Icon icon="tabler:info-circle" style={{ color: '#3b82f6', fontSize: 18, marginTop: 1, flexShrink: 0 }} />
									<div>
										<div style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6' }}>注意与提示</div>
										<div style={{ fontSize: 12, color: 'var(--admin-text-2)', marginTop: 2 }}>
											这是 ::alert 提示框组件在当前 ({appearance.alert?.defaultStyle}) 风格下的真实渲染效果。
										</div>
									</div>
								</div>

								<div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>代码块折叠与缩进预览:</div>
								<div
									style={{
										borderRadius: 8,
										background: '#1e1e2e',
										border: '1px solid rgba(255,255,255,0.1)',
										color: '#cdd6f4',
										fontFamily: 'monospace',
										fontSize: 11,
										overflow: 'hidden',
									}}
								>
									<div style={{ padding: '6px 12px', background: '#181825', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
										<span>example.tsx</span>
										<button
											type="button"
											onClick={() => setPreviewCodeCollapsed(!previewCodeCollapsed)}
											style={{ background: 'transparent', border: 'none', color: '#89b4fa', cursor: 'pointer', fontSize: 10 }}
										>
											{previewCodeCollapsed ? '展开代码' : '折叠代码'}
										</button>
									</div>
									<div style={{ padding: '10px 12px', maxHeight: previewCodeCollapsed ? 70 : 160, overflowY: 'hidden', position: 'relative' }}>
										<div>1 | const app = createServer()</div>
										<div style={{ display: 'flex' }}>
											<span>2 |&nbsp;</span>
											{appearance.codeblock?.enableIndentGuide && <span style={{ color: '#585b70' }}>|&nbsp;</span>}
											<span>app.use(logger())</span>
										</div>
										<div style={{ display: 'flex' }}>
											<span>3 |&nbsp;</span>
											{appearance.codeblock?.enableIndentGuide && <span style={{ color: '#585b70' }}>|&nbsp;</span>}
											<span>app.listen(3000)</span>
										</div>
										{previewCodeCollapsed && (
											<div style={{ position: 'absolute', inset: 'auto 0 0 0', height: 40, background: 'linear-gradient(transparent, #1e1e2e)' }} />
										)}
									</div>
								</div>

								{/* 摘要打字动效 */}
								<div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>摘要打字机光标演示:</div>
								<div style={{ padding: '10px 12px', background: 'var(--admin-bg-subtle)', borderRadius: 6, fontSize: 12, color: 'var(--admin-text-1)' }}>
									<span>在有序的世界里，寻一处生活的归栈</span>
									{appearance.excerpt?.animation && (
										<span style={{ color: 'var(--admin-accent)', fontWeight: 700, animation: 'blink 1s infinite' }}>
											{appearance.excerpt?.caret || '_'}
										</span>
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export default SettingsView

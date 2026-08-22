import React, { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import { useToast } from '../components/Toast'
import { getGithubAvatar, getOicqAvatar } from '../../utils/img'
import { getFixedDelay } from '../../utils/anim'
import type { SiteInfoData } from '../types'

const OG_GRADIENT_PRESETS = [
	{ name: '暮光极光', bg: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)', textColor: '#ffffff' },
	{ name: '科技深海', bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0284c7 100%)', textColor: '#ffffff' },
	{ name: '翡翠极光', bg: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #10b981 100%)', textColor: '#ffffff' },
	{ name: '日落余晖', bg: 'linear-gradient(135deg, #831843 0%, #db2777 50%, #f97316 100%)', textColor: '#ffffff' },
	{ name: '深邃暗夜', bg: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #3f3f46 100%)', textColor: '#ffffff' },
	{ name: '清新晨曦', bg: 'linear-gradient(135deg, #e0e7ff 0%, #fae8ff 50%, #fce7f3 100%)', textColor: '#1e1b4b' },
]

const QUICK_EMOJIS = [
	'💻',
	'⚡',
	'☕',
	'🚀',
	'🎨',
	'🔮',
	'✨',
	'🌟',
	'💡',
	'🎮',
	'🦄',
	'🔥',
	'🎯',
	'💎',
	'🌈',
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

export const SeoManagerView: React.FC = () => {
	const { showToast } = useToast()
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [uploadingAvatar, setUploadingAvatar] = useState(false)

	// 站点核心数据
	const [siteInfo, setSiteInfo] = useState<SiteInfoData>({
		title: 'kerntau',
		subtitle: '心中有景,花香满径',
		description: '在有序的世界里，寻一处生活的归栈。用理性梳理日常，用技术温柔时光，不慌不忙，自在生长。',
		authorName: 'kerntau',
		authorAvatar: '/avatar.webp',
		authorEmail: '1722288011@qq.com',
		authorHomepage: 'https://blog.cot.wiki/',
		url: 'https://blog.cot.wiki/',
		favicon: '/favicon.ico',
		timeEstablished: '2025-11-10',
		timeZone: 'Asia/Shanghai',
		defaultCategory: '前端开发',
		copyrightAbbr: 'CC BY-NC-SA 4.0',
		emojiTail: ['💻', '⚡', '☕', '🚀'],
		logo: '/og-image.jpg',
	})

	// 社交卡片设计器状态
	const [selectedOgPreset, setSelectedOgPreset] = useState(0)
	const [avatarInputType, setAvatarInputType] = useState<'url' | 'github' | 'qq'>('url')
	const [githubUsername, setGithubUsername] = useState('')
	const [qqNumber, setQqNumber] = useState('')
	const [customEmojiInput, setCustomEmojiInput] = useState('')

	const loadData = async () => {
		setLoading(true)
		try {
			const data = await adminApi.getSiteInfo()
			setSiteInfo(data)
		}
		catch (err: any) {
			showToast(`加载站点信息失败: ${err.message}`, 'error')
		}
		finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadData()
	}, [])

	// 本地头像上传处理
	const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		if (!file.type.startsWith('image/')) {
			showToast('请选择图片文件', 'warning')
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
				setSiteInfo(prev => ({ ...prev, authorAvatar: res.path }))
				showToast('头像已成功上传，保存配置后全站生效', 'success')
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

	// 快捷抓取 Github 头像
	const applyGithubAvatar = () => {
		if (!githubUsername.trim()) {
			showToast('请输入 GitHub 用户名', 'warning')
			return
		}
		const avatarUrl = getGithubAvatar(githubUsername.trim(), { size: 300 })
		setSiteInfo(prev => ({ ...prev, authorAvatar: avatarUrl }))
		showToast(`已提取 GitHub (@${githubUsername}) 头像`, 'success')
	}

	// 快捷抓取 QQ 头像
	const applyQqAvatar = () => {
		if (!qqNumber.trim() || !/^\d+$/.test(qqNumber.trim())) {
			showToast('请输入正确的 QQ 号码', 'warning')
			return
		}
		const avatarUrl = getOicqAvatar(qqNumber.trim(), 640)
		setSiteInfo(prev => ({ ...prev, authorAvatar: avatarUrl }))
		showToast(`已提取 QQ (${qqNumber}) 头像`, 'success')
	}

	// Emoji 增删操作
	const handleAddEmoji = (emoji: string) => {
		if (!emoji.trim()) return
		setSiteInfo(prev => ({
			...prev,
			emojiTail: [...(prev.emojiTail || []), emoji.trim()],
		}))
		setCustomEmojiInput('')
	}

	const handleRemoveEmoji = (index: number) => {
		setSiteInfo(prev => ({
			...prev,
			emojiTail: (prev.emojiTail || []).filter((_, i) => i !== index),
		}))
	}

	const handleMoveEmoji = (index: number, dir: 'left' | 'right') => {
		const list = [...(siteInfo.emojiTail || [])]
		const target = dir === 'left' ? index - 1 : index + 1
		if (target < 0 || target >= list.length) return
		const temp = list[index]!
		list[index] = list[target]!
		list[target] = temp
		setSiteInfo(prev => ({ ...prev, emojiTail: list }))
	}

	const handleSave = async () => {
		setSaving(true)
		try {
			await adminApi.saveSiteInfo(siteInfo)
			window.dispatchEvent(new CustomEvent('site-info-updated', { detail: siteInfo }))
			showToast('全站信息、博主身份与头像 Emoji 配置已成功更新保存！', 'success')
		}
		catch (err: any) {
			showToast(`保存失败: ${err.message}`, 'error')
		}
		finally {
			setSaving(false)
		}
	}

	const activePreset = OG_GRADIENT_PRESETS[selectedOgPreset] || OG_GRADIENT_PRESETS[0]!

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
			{/* 顶栏 */}
			<div className="admin-card" style={{ padding: '14px 18px' }}>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
					<div>
						<div style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
							<Icon icon="tabler:world-cog" style={{ color: 'var(--admin-accent)', fontSize: 18 }} />
							<span>站点身份、头像 Emoji 与品牌工坊 (Site & Brand Studio)</span>
						</div>
						<div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 2 }}>
							管理博客全站信息、博主身份、头像背景飘动 Emoji 动画与 OpenGraph 社交卡片
						</div>
					</div>

					<button
						type="button"
						className="admin-btn btn-primary btn-sm"
						onClick={handleSave}
						disabled={saving}
					>
						<Icon icon={saving ? 'tabler:loader-2' : 'tabler:device-floppy'} />
						<span>{saving ? '保存中...' : '保存站点配置'}</span>
					</button>
				</div>
			</div>

			{loading ? (
				<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
					<Icon icon="tabler:loader-2" style={{ fontSize: 24, color: 'var(--admin-text-3)', animation: 'spin 1s linear infinite' }} />
				</div>
			) : (
				<div style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 1.25fr) minmax(340px, 1fr)', gap: 14 }}>
					{/* 左侧：表单配置区 */}
					<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
						{/* 1. 站点基础信息 */}
						<div className="admin-card" style={{ padding: '16px' }}>
							<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
								<Icon icon="tabler:info-circle" style={{ color: 'var(--admin-accent)' }} />
								<span>站点基础信息 (Site Information)</span>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
								<div>
									<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
										网站主标题 (Title) *
									</label>
									<input
										type="text"
										className="admin-input"
										placeholder="如: kerntau"
										value={siteInfo.title}
										onChange={e => setSiteInfo({ ...siteInfo, title: e.target.value })}
									/>
								</div>

								<div>
									<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
										副标题 / Slogan
									</label>
									<input
										type="text"
										className="admin-input"
										placeholder="如: 心中有景,花香满径"
										value={siteInfo.subtitle}
										onChange={e => setSiteInfo({ ...siteInfo, subtitle: e.target.value })}
									/>
								</div>

								<div style={{ gridColumn: '1 / -1' }}>
									<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
										站点主页 URL *
									</label>
									<input
										type="text"
										className="admin-input"
										placeholder="如: https://blog.cot.wiki/"
										value={siteInfo.url}
										onChange={e => setSiteInfo({ ...siteInfo, url: e.target.value })}
									/>
								</div>

								<div style={{ gridColumn: '1 / -1' }}>
									<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
										SEO 详细描述 (Description)
									</label>
									<textarea
										className="admin-textarea"
										placeholder="一段吸引人的博客介绍文字，利好 SEO..."
										value={siteInfo.description}
										onChange={e => setSiteInfo({ ...siteInfo, description: e.target.value })}
										style={{ height: 60 }}
									/>
								</div>
							</div>
						</div>

						{/* 2. 博主身份与头像工坊 */}
						<div className="admin-card" style={{ padding: '16px' }}>
							<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
								<Icon icon="tabler:user-circle" style={{ color: 'var(--admin-accent)' }} />
								<span>博主身份与头像工坊 (Avatar Studio)</span>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
								<div>
									<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
										博主昵称 (Author Name) *
									</label>
									<input
										type="text"
										className="admin-input"
										value={siteInfo.authorName}
										onChange={e => setSiteInfo({ ...siteInfo, authorName: e.target.value })}
									/>
								</div>

								<div>
									<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
										博主邮箱 (Email)
									</label>
									<input
										type="text"
										className="admin-input"
										value={siteInfo.authorEmail}
										onChange={e => setSiteInfo({ ...siteInfo, authorEmail: e.target.value })}
									/>
								</div>

								<div style={{ gridColumn: '1 / -1' }}>
									<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
										个人主页 URL
									</label>
									<input
										type="text"
										className="admin-input"
										value={siteInfo.authorHomepage}
										onChange={e => setSiteInfo({ ...siteInfo, authorHomepage: e.target.value })}
									/>
								</div>
							</div>

							{/* 头像来源设置 */}
							<div style={{ background: 'var(--admin-bg-subtle)', padding: 12, borderRadius: 8, border: '1px solid var(--admin-border)', marginBottom: 12 }}>
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
									<label style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-2)' }}>
										博主头像 (Avatar Source)
									</label>
									<div style={{ display: 'flex', gap: 4 }}>
										<button
											type="button"
											className={`admin-btn ${avatarInputType === 'url' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
											style={{ height: 22, fontSize: 11, padding: '0 6px' }}
											onClick={() => setAvatarInputType('url')}
										>
											URL / 上传
										</button>
										<button
											type="button"
											className={`admin-btn ${avatarInputType === 'github' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
											style={{ height: 22, fontSize: 11, padding: '0 6px' }}
											onClick={() => setAvatarInputType('github')}
										>
											<Icon icon="tabler:brand-github" />
											<span>GitHub</span>
										</button>
										<button
											type="button"
											className={`admin-btn ${avatarInputType === 'qq' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
											style={{ height: 22, fontSize: 11, padding: '0 6px' }}
											onClick={() => setAvatarInputType('qq')}
										>
											<Icon icon="tabler:brand-qq" />
											<span>QQ</span>
										</button>
									</div>
								</div>

								{avatarInputType === 'url' && (
									<div style={{ display: 'flex', gap: 8 }}>
										<input
											type="text"
											className="admin-input"
											placeholder="如: /avatar.webp 或 https://..."
											value={siteInfo.authorAvatar}
											onChange={e => setSiteInfo({ ...siteInfo, authorAvatar: e.target.value })}
											style={{ flex: 1, fontFamily: 'var(--admin-font-mono)' }}
										/>
										<input
											type="file"
											ref={fileInputRef}
											accept="image/*"
											style={{ display: 'none' }}
											onChange={handleAvatarFileUpload}
										/>
										<button
											type="button"
											className="admin-btn btn-secondary btn-sm"
											onClick={() => fileInputRef.current?.click()}
											disabled={uploadingAvatar}
										>
											<Icon icon={uploadingAvatar ? 'tabler:loader-2' : 'tabler:upload'} />
											<span>{uploadingAvatar ? '上传中...' : '本地上传'}</span>
										</button>
									</div>
								)}

								{avatarInputType === 'github' && (
									<div style={{ display: 'flex', gap: 8 }}>
										<input
											type="text"
											className="admin-input"
											placeholder="输入 GitHub 用户名 (如: torvalds)"
											value={githubUsername}
											onChange={e => setGithubUsername(e.target.value)}
											style={{ flex: 1 }}
										/>
										<button
											type="button"
											className="admin-btn btn-primary btn-sm"
											onClick={applyGithubAvatar}
										>
											<span>提取并应用</span>
										</button>
									</div>
								)}

								{avatarInputType === 'qq' && (
									<div style={{ display: 'flex', gap: 8 }}>
										<input
											type="text"
											className="admin-input"
											placeholder="输入 QQ 号码 (如: 10001)"
											value={qqNumber}
											onChange={e => setQqNumber(e.target.value)}
											style={{ flex: 1 }}
										/>
										<button
											type="button"
											className="admin-btn btn-primary btn-sm"
											onClick={applyQqAvatar}
										>
											<span>提取并应用</span>
										</button>
									</div>
								)}
							</div>

							{/* 核心亮点：头像背景飘动 Emoji (header.emojiTail) 设计器 */}
							<div style={{ background: 'var(--admin-surface)', padding: 12, borderRadius: 8, border: '1px solid var(--admin-border)' }}>
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
									<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
										<Icon icon="tabler:sparkles" style={{ color: '#F59E0B' }} />
										<span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-1)' }}>
											头像背景飘动 Emoji 序列 (Emoji Tail)
										</span>
									</div>
									<span style={{ fontSize: 10, color: 'var(--admin-text-3)' }}>
										前台头像背后浮出的动态表情
									</span>
								</div>

								{/* 当前已选中的 Emoji 序列 */}
								<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', margin: '8px 0', minHeight: 36, padding: '6px 8px', background: 'var(--admin-bg-subtle)', borderRadius: 6 }}>
									{(siteInfo.emojiTail || []).length === 0 ? (
										<span style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>暂未添加任何 Emoji</span>
									) : (
										(siteInfo.emojiTail || []).map((em, idx) => (
											<div
												key={idx}
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: 4,
													padding: '2px 6px',
													borderRadius: 99,
													background: 'var(--admin-surface)',
													border: '1px solid var(--admin-border)',
													fontSize: 14,
												}}
											>
												<span>{em}</span>
												<div style={{ display: 'flex', gap: 2 }}>
													{idx > 0 && (
														<span
															onClick={() => handleMoveEmoji(idx, 'left')}
															style={{ cursor: 'pointer', fontSize: 10, opacity: 0.6 }}
															title="前移"
														>
															◀
														</span>
													)}
													{idx < (siteInfo.emojiTail || []).length - 1 && (
														<span
															onClick={() => handleMoveEmoji(idx, 'right')}
															style={{ cursor: 'pointer', fontSize: 10, opacity: 0.6 }}
															title="后移"
														>
															▶
														</span>
													)}
													<span
														onClick={() => handleRemoveEmoji(idx)}
														style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
														title="删除"
													>
														<Icon
															icon="tabler:x"
															style={{ fontSize: 12, color: 'var(--admin-danger)' }}
														/>
													</span>
												</div>
											</div>
										))
									)}
								</div>

								{/* 快捷点击添加 Emoji */}
								<div style={{ marginTop: 8 }}>
									<span style={{ fontSize: 11, color: 'var(--admin-text-3)', display: 'block', marginBottom: 4 }}>
										点击快捷追加 Emoji:
									</span>
									<div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
										{QUICK_EMOJIS.map(em => (
											<button
												key={em}
												type="button"
												className="admin-btn btn-ghost btn-sm"
												style={{ width: 28, height: 28, padding: 0, fontSize: 15 }}
												onClick={() => handleAddEmoji(em)}
												title={`添加 ${em}`}
											>
												{em}
											</button>
										))}
									</div>
								</div>

								{/* 自定义 Emoji 输入 */}
								<div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
									<input
										type="text"
										className="admin-input"
										placeholder="输入其他任意 Emoji..."
										value={customEmojiInput}
										onChange={e => setCustomEmojiInput(e.target.value)}
										style={{ flex: 1, fontSize: 12 }}
									/>
									<button
										type="button"
										className="admin-btn btn-secondary btn-sm"
										onClick={() => handleAddEmoji(customEmojiInput)}
										disabled={!customEmojiInput.trim()}
									>
										<span>添加</span>
									</button>
								</div>
							</div>
						</div>

						{/* 3. 版权协议与时区 */}
						<div className="admin-card" style={{ padding: '16px' }}>
							<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
								<Icon icon="tabler:license" style={{ color: 'var(--admin-accent)' }} />
								<span>版权、时区与高级元数据</span>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
								<div>
									<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
										建站起始日期 (Time Established)
									</label>
									<input
										type="date"
										className="admin-input"
										value={siteInfo.timeEstablished}
										onChange={e => setSiteInfo({ ...siteInfo, timeEstablished: e.target.value })}
									/>
								</div>

								<div>
									<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
										时区 (Time Zone)
									</label>
									<select
										className="admin-select"
										value={siteInfo.timeZone}
										onChange={e => setSiteInfo({ ...siteInfo, timeZone: e.target.value })}
									>
										<option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
										<option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
										<option value="America/New_York">America/New_York (EST)</option>
										<option value="UTC">UTC (格林尼治时间)</option>
									</select>
								</div>

								<div>
									<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
										知识共享协议 (Copyright)
									</label>
									<select
										className="admin-select"
										value={siteInfo.copyrightAbbr}
										onChange={e => setSiteInfo({ ...siteInfo, copyrightAbbr: e.target.value })}
									>
										<option value="CC BY-NC-SA 4.0">CC BY-NC-SA 4.0 (推荐)</option>
										<option value="CC BY 4.0">CC BY 4.0 (署名)</option>
										<option value="CC BY-SA 4.0">CC BY-SA 4.0 (相同方式共享)</option>
										<option value="All Rights Reserved">保留所有权利 (All Rights Reserved)</option>
									</select>
								</div>

								<div>
									<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
										默认文章分类
									</label>
									<input
										type="text"
										className="admin-input"
										value={siteInfo.defaultCategory}
										onChange={e => setSiteInfo({ ...siteInfo, defaultCategory: e.target.value })}
									/>
								</div>
							</div>
						</div>
					</div>

					{/* 右侧：多维度高保真同源实时全景预览 */}
					<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
						{/* 1. 前台 BlogHeader 完整同源实时效果 (头像 + 背景飘动 Emoji 动画) */}
						<div className="admin-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
							<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
								<div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--admin-text-1)', display: 'flex', alignItems: 'center', gap: 7 }}>
									<div style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--admin-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
										<Icon icon="tabler:sparkles" style={{ color: 'var(--admin-accent)', fontSize: 15 }} />
									</div>
									<span>前台 Header 与 Emoji 预览</span>
								</div>
								<span className="admin-badge badge-primary">同源渲染</span>
							</div>

							{/* 模拟前台 Header 高质感展示台 */}
							<div
								style={{
									padding: '22px 20px',
									borderRadius: 10,
									background: 'var(--admin-bg)',
									border: '1px solid var(--admin-border)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									position: 'relative',
									overflow: 'hidden',
									boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)',
								}}
							>
								{/* 模拟 Header 主内容 */}
								<div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16, zIndex: 1, minWidth: 0 }}>
									{/* 头像 + 背后 Emoji 粒子群 */}
									<div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
										{/* 飘动 Emoji 序列 */}
										<div
											style={{
												position: 'absolute',
												inset: -12,
												pointerEvents: 'none',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
											}}
										>
											{(siteInfo.emojiTail || []).map((emoji, idx) => (
												<span
													key={idx}
													style={{
														position: 'absolute',
														fontSize: 19,
														transform: `translate(${(idx % 2 === 0 ? -1 : 1) * (18 + idx * 7)}px, ${-14 - (idx % 3) * 6}px) scale(${0.9 + (idx % 2) * 0.15})`,
														animation: `floatEmoji 3s ease-in-out infinite alternate`,
														animationDelay: `${idx * 0.35}s`,
														opacity: 0.85,
														filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
													}}
												>
													{emoji}
												</span>
											))}
										</div>

										{/* 头像本体 */}
										<img
											src={siteInfo.authorAvatar}
											alt="Header Avatar"
											style={{
												width: 52,
												height: 52,
												borderRadius: '50%',
												objectFit: 'cover',
												border: '2px solid var(--admin-accent)',
												position: 'relative',
												zIndex: 2,
												boxShadow: '0 4px 14px var(--admin-accent-soft)',
											}}
											onError={e => (e.currentTarget.src = '/favicon.ico')}
										/>
									</div>

									{/* 站点主标题与 Slogan */}
									<div style={{ position: 'relative', zIndex: 2, minWidth: 0 }}>
										<div
											style={{
												fontSize: 16.5,
												fontWeight: 800,
												color: 'var(--admin-text-1)',
												letterSpacing: '-0.02em',
												display: 'flex',
												lineHeight: 1.25,
												whiteSpace: 'nowrap',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
											}}
										>
											{siteInfo.title.split('').map((char, idx) => (
												<span key={idx} style={getFixedDelay((idx + 1) * 0.1)}>
													{char}
												</span>
											))}
										</div>
										<div
											style={{
												fontSize: 12,
												color: 'var(--admin-text-3)',
												marginTop: 3,
												whiteSpace: 'nowrap',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												maxWidth: 240,
											}}
											title={siteInfo.subtitle}
										>
											{siteInfo.subtitle || '暂无副标题'}
										</div>
									</div>
								</div>

								{/* 右侧微型标识 */}
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'flex-end',
										gap: 4,
										opacity: 0.6,
										flexShrink: 0,
									}}
								>
									<Icon icon="tabler:device-desktop" style={{ fontSize: 18, color: 'var(--admin-text-3)' }} />
									<span style={{ fontSize: 10, fontFamily: 'var(--admin-font-mono)', color: 'var(--admin-text-3)' }}>LIVE</span>
								</div>
							</div>
						</div>

						{/* 2. OpenGraph / 社交分享卡片设计器 (1200×630) */}
						<div className="admin-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
							<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
								<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
									<Icon icon="tabler:share" style={{ color: 'var(--admin-accent)' }} />
									<span>OpenGraph / 社交分享卡片设计器</span>
								</div>
								<span className="admin-badge badge-primary">1200 × 630</span>
							</div>

							{/* 预设渐变主题挑选 */}
							<div>
								<span style={{ fontSize: 11, color: 'var(--admin-text-3)', display: 'block', marginBottom: 6 }}>
									选择卡片视觉渐变主题:
								</span>
								<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
									{OG_GRADIENT_PRESETS.map((preset, idx) => (
										<div
											key={preset.name}
											className={`color-preset-dot ${selectedOgPreset === idx ? 'active' : ''}`}
											style={{
												background: preset.bg,
												width: 22,
												height: 22,
												borderRadius: 6,
												cursor: 'pointer',
												outline: selectedOgPreset === idx ? '2px solid var(--admin-accent)' : 'none',
												outlineOffset: 1,
											}}
											onClick={() => setSelectedOgPreset(idx)}
											title={preset.name}
										/>
									))}
								</div>
							</div>

							{/* 动态社交分享大图卡片呈现 */}
							<div
								style={{
									borderRadius: 12,
									overflow: 'hidden',
									background: activePreset.bg,
									color: activePreset.textColor,
									padding: '24px 20px',
									position: 'relative',
									boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
									minHeight: 180,
									display: 'flex',
									flexDirection: 'column',
									justifyContent: 'space-between',
								}}
							>
								{/* 装饰水印 */}
								<div
									style={{
										position: 'absolute',
										right: -10,
										bottom: -20,
										fontSize: 100,
										opacity: 0.08,
										pointerEvents: 'none',
										fontWeight: 900,
										lineHeight: 1,
									}}
								>
									{siteInfo.title.toUpperCase()}
								</div>

								{/* 卡片头部 */}
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
									<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
										<img
											src={siteInfo.authorAvatar}
											alt="Avatar"
											style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.8)' }}
											onError={e => (e.currentTarget.src = '/favicon.ico')}
										/>
										<div>
											<div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{siteInfo.authorName}</div>
											<div style={{ fontSize: 10, opacity: 0.8 }}>{new URL(siteInfo.url || 'https://blog.cot.wiki').hostname}</div>
										</div>
									</div>
									<span
										style={{
											fontSize: 10,
											padding: '2px 8px',
											borderRadius: 99,
											background: 'rgba(255,255,255,0.2)',
											backdropFilter: 'blur(4px)',
										}}
									>
										{siteInfo.defaultCategory}
									</span>
								</div>

								{/* 卡片核心标语 */}
								<div style={{ margin: '14px 0 10px' }}>
									<div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: 4 }}>
										{siteInfo.title}
									</div>
									<div style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.4, maxWidth: '90%' }}>
										{siteInfo.subtitle || siteInfo.description}
									</div>
								</div>

								{/* 卡片底部 */}
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, opacity: 0.75 }}>
									<span>{siteInfo.copyrightAbbr}</span>
									<span>⚡ {new Date().getFullYear()}</span>
								</div>
							</div>
						</div>

						{/* 3. Google 搜索结果真实卡片预览 */}
						<div className="admin-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
							<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
								<Icon icon="tabler:brand-google" style={{ color: 'var(--admin-accent)' }} />
								<span>Google 搜索引擎结果实时效果</span>
							</div>

							<div style={{ padding: 14, background: 'var(--admin-bg)', borderRadius: 8, border: '1px solid var(--admin-border)' }}>
								<div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
									<img src="/favicon.ico" alt="Favicon" style={{ width: 14, height: 14 }} onError={e => (e.currentTarget.style.display = 'none')} />
									<span style={{ fontSize: 11, color: 'var(--admin-text-3)', fontFamily: 'var(--admin-font-mono)' }}>{siteInfo.url}</span>
								</div>
								<div style={{ fontSize: 15, color: '#1a0dab', fontWeight: 600, lineHeight: 1.3, marginBottom: 4, cursor: 'pointer' }}>
									{siteInfo.title} - {siteInfo.subtitle || '技术博客'}
								</div>
								<div style={{ fontSize: 12, color: 'var(--admin-text-2)', lineHeight: 1.5 }}>
									{siteInfo.description || '暂未配置网站长描述...'}
								</div>
							</div>
						</div>

						{/* 4. 前台博主名片实时同源渲染 */}
						<div className="admin-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
							<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
								<Icon icon="tabler:id-badge-2" style={{ color: 'var(--admin-accent)' }} />
								<span>前台博主卡片实时效果 (Author Card)</span>
							</div>

							<div
								style={{
									padding: 16,
									borderRadius: 12,
									background: 'var(--admin-bg-subtle)',
									border: '1px solid var(--admin-border)',
									display: 'flex',
									alignItems: 'center',
									gap: 14,
								}}
							>
								<img
									src={siteInfo.authorAvatar}
									alt="Author Avatar"
									style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--admin-accent)' }}
									onError={e => (e.currentTarget.src = '/favicon.ico')}
								/>
								<div style={{ flex: 1, minWidth: 0 }}>
									<div style={{ fontSize: 15, fontWeight: 700, color: 'var(--admin-text-1)' }}>
										{siteInfo.authorName}
									</div>
									<div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
										{siteInfo.subtitle || siteInfo.description}
									</div>
									<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, fontSize: 13, color: 'var(--admin-accent)' }}>
										<Icon icon="tabler:brand-github" style={{ cursor: 'pointer' }} />
										<Icon icon="tabler:mail" style={{ cursor: 'pointer' }} />
										<Icon icon="tabler:rss" style={{ cursor: 'pointer' }} />
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default SeoManagerView

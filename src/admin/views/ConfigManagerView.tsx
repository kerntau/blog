import React, { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import { useToast } from '../components/Toast'

export const ConfigManagerView: React.FC = () => {
	const { showToast } = useToast()
	const [viewMode, setViewMode] = useState<'form' | 'code'>('form')
	const [activeCodeTab, setActiveCodeTab] = useState<'blog' | 'app'>('blog')
	const [blogConfigRaw, setBlogConfigRaw] = useState('')
	const [appConfigRaw, setAppConfigRaw] = useState('')
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)

	// 表单字段
	const [siteTitle, setSiteTitle] = useState('')
	const [siteSubtitle, setSiteSubtitle] = useState('')
	const [siteDesc, setSiteDesc] = useState('')
	const [authorName, setAuthorName] = useState('')
	const [authorEmail, setAuthorEmail] = useState('')
	const [authorHomepage, setAuthorHomepage] = useState('')
	const [siteUrl, setSiteUrl] = useState('')
	const [defaultCategory, setDefaultCategory] = useState('')
	const [feedLimit, setFeedLimit] = useState(50)
	const [twikooEnvId, setTwikooEnvId] = useState('')

	const loadConfig = async () => {
		setLoading(true)
		try {
			const data = await adminApi.getConfig()
			setBlogConfigRaw(data.blogConfigRaw)
			setAppConfigRaw(data.appConfigRaw)

			const bRaw = data.blogConfigRaw
			const extractField = (key: string) => {
				const m = bRaw.match(new RegExp(`${key}:\\s*['"\`](.*?)['"\`]`))
				return m ? m[1] : ''
			}

			setSiteTitle(extractField('title'))
			setSiteSubtitle(extractField('subtitle'))
			setSiteDesc(extractField('description'))
			setAuthorName(extractField('name'))
			setAuthorEmail(extractField('email'))
			setAuthorHomepage(extractField('homepage'))
			setSiteUrl(extractField('url'))
			setDefaultCategory(extractField('defaultCategory'))

			const limitMatch = bRaw.match(/limit:\s*(\d+)/)
			if (limitMatch) setFeedLimit(Number(limitMatch[1]))

			const twikooMatch = bRaw.match(/envId:\s*['"`](.*?)['"`]/)
			if (twikooMatch) setTwikooEnvId(twikooMatch[1])
		}
		catch (err: any) {
			showToast(`加载配置失败: ${err.message}`, 'error')
		}
		finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadConfig()
	}, [])

	const handleSaveForm = async () => {
		setSaving(true)
		try {
			let updatedBlogConfig = blogConfigRaw
			const replaceField = (key: string, val: string) => {
				updatedBlogConfig = updatedBlogConfig.replace(
					new RegExp(`(${key}:\\s*)['"\`].*?['"\`]`),
					`$1'${val.replace(/'/g, '\\\'')}'`,
				)
			}

			if (siteTitle) replaceField('title', siteTitle)
			if (siteSubtitle !== undefined) replaceField('subtitle', siteSubtitle)
			if (siteDesc) replaceField('description', siteDesc)
			if (authorName) replaceField('name', authorName)
			if (authorEmail) replaceField('email', authorEmail)
			if (authorHomepage) replaceField('homepage', authorHomepage)
			if (siteUrl) replaceField('url', siteUrl)
			if (defaultCategory) replaceField('defaultCategory', defaultCategory)

			updatedBlogConfig = updatedBlogConfig.replace(/limit:\s*\d+/, `limit: ${feedLimit}`)
			if (twikooEnvId !== undefined) replaceField('envId', twikooEnvId)

			setBlogConfigRaw(updatedBlogConfig)
			await adminApi.saveConfig({
				blogConfigRaw: updatedBlogConfig,
				appConfigRaw,
			})
			showToast('站点表单配置已更新保存', 'success')
		}
		catch (err: any) {
			showToast(`保存失败: ${err.message}`, 'error')
		}
		finally {
			setSaving(false)
		}
	}

	const handleSaveCode = async () => {
		setSaving(true)
		try {
			await adminApi.saveConfig({
				blogConfigRaw,
				appConfigRaw,
			})
			showToast('配置源码已保存生效', 'success')
		}
		catch (err: any) {
			showToast(`保存失败: ${err.message}`, 'error')
		}
		finally {
			setSaving(false)
		}
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: 'calc(100vh - 96px)', width: '100%' }}>
			{/* 顶部操作条 */}
			<div className="admin-card" style={{ padding: '12px 18px', flexShrink: 0 }}>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
					<div>
						<div style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text-1)' }}>
							站点与组件配置中心
						</div>
						<div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 2 }}>
							支持可视化表单模式与源码编辑模式
						</div>
					</div>

					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<div style={{ display: 'flex', background: 'var(--admin-bg-subtle)', padding: 2, borderRadius: 6, border: '1px solid var(--admin-border)' }}>
							<button
								type="button"
								className={`admin-btn ${viewMode === 'form' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
								onClick={() => setViewMode('form')}
							>
								<span>表单模式</span>
							</button>
							<button
								type="button"
								className={`admin-btn ${viewMode === 'code' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
								onClick={() => setViewMode('code')}
							>
								<span>源码模式</span>
							</button>
						</div>

						<button
							type="button"
							className="admin-btn btn-primary btn-sm"
							onClick={viewMode === 'form' ? handleSaveForm : handleSaveCode}
							disabled={saving}
						>
							<Icon icon={saving ? 'tabler:loader-2' : 'tabler:device-floppy'} />
							<span>{saving ? '保存中...' : '保存配置'}</span>
						</button>
					</div>
				</div>
			</div>

			{loading ? (
				<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
					<Icon icon="tabler:loader-2" style={{ fontSize: 24, color: 'var(--admin-text-3)', animation: 'spin 1s linear infinite' }} />
				</div>
			) : viewMode === 'form' ? (
				<div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
					{/* 站点基本信息 */}
					<div className="admin-card" style={{ padding: '16px 18px' }}>
						<div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--admin-text-1)' }}>
							站点基本信息
						</div>

						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
							<div>
								<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
									博客标题 (Title) *
								</label>
								<input
									type="text"
									className="admin-input"
									value={siteTitle}
									onChange={e => setSiteTitle(e.target.value)}
								/>
							</div>

							<div>
								<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
									副标题 / Slogan
								</label>
								<input
									type="text"
									className="admin-input"
									value={siteSubtitle}
									onChange={e => setSiteSubtitle(e.target.value)}
								/>
							</div>

							<div>
								<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
									站点主页 URL *
								</label>
								<input
									type="text"
									className="admin-input"
									value={siteUrl}
									onChange={e => setSiteUrl(e.target.value)}
								/>
							</div>

							<div>
								<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
									默认分类
								</label>
								<input
									type="text"
									className="admin-input"
									value={defaultCategory}
									onChange={e => setDefaultCategory(e.target.value)}
								/>
							</div>

							<div style={{ gridColumn: '1 / -1' }}>
								<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
									SEO 长描述 (Description)
								</label>
								<textarea
									className="admin-textarea"
									value={siteDesc}
									onChange={e => setSiteDesc(e.target.value)}
									style={{ height: 60 }}
								/>
							</div>
						</div>
					</div>

					{/* 博主与作者信息 */}
					<div className="admin-card" style={{ padding: '16px 18px' }}>
						<div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--admin-text-1)' }}>
							博主与作者信息
						</div>

						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
							<div>
								<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
									作者名称
								</label>
								<input
									type="text"
									className="admin-input"
									value={authorName}
									onChange={e => setAuthorName(e.target.value)}
								/>
							</div>

							<div>
								<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
									联系邮箱
								</label>
								<input
									type="text"
									className="admin-input"
									value={authorEmail}
									onChange={e => setAuthorEmail(e.target.value)}
								/>
							</div>

							<div style={{ gridColumn: '1 / -1' }}>
								<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
									个人主页 URL
								</label>
								<input
									type="text"
									className="admin-input"
									value={authorHomepage}
									onChange={e => setAuthorHomepage(e.target.value)}
								/>
							</div>
						</div>
					</div>

					{/* 订阅与评论 */}
					<div className="admin-card" style={{ padding: '16px 18px' }}>
						<div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--admin-text-1)' }}>
							订阅源与评论参数
						</div>

						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
							<div>
								<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
									Atom 订阅文章上限
								</label>
								<input
									type="number"
									className="admin-input"
									value={feedLimit}
									onChange={e => setFeedLimit(Number(e.target.value))}
								/>
							</div>

							<div>
								<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
									Twikoo 评论 EnvId
								</label>
								<input
									type="text"
									className="admin-input"
									placeholder="https://..."
									value={twikooEnvId}
									onChange={e => setTwikooEnvId(e.target.value)}
								/>
							</div>
						</div>
					</div>
				</div>
			) : (
				<div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
					<div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
						<button
							type="button"
							className={`admin-btn ${activeCodeTab === 'blog' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
							onClick={() => setActiveCodeTab('blog')}
						>
							<span>blog.config.ts</span>
						</button>
						<button
							type="button"
							className={`admin-btn ${activeCodeTab === 'app' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
							onClick={() => setActiveCodeTab('app')}
						>
							<span>src/app.config.ts</span>
						</button>
					</div>

					<div
						className="admin-card"
						style={{
							flex: 1,
							display: 'flex',
							flexDirection: 'column',
							padding: 0,
							overflow: 'hidden',
							minHeight: 0,
						}}
					>
						<textarea
							value={activeCodeTab === 'blog' ? blogConfigRaw : appConfigRaw}
							onChange={e =>
								activeCodeTab === 'blog'
									? setBlogConfigRaw(e.target.value)
									: setAppConfigRaw(e.target.value)}
							style={{
								flex: 1,
								width: '100%',
								border: 'none',
								outline: 'none',
								padding: '16px',
								background: 'var(--admin-surface)',
								color: 'var(--admin-text-1)',
								fontFamily: 'var(--admin-font-mono)',
								fontSize: 13,
								lineHeight: 1.6,
								resize: 'none',
							}}
						/>
					</div>
				</div>
			)}
		</div>
	)
}

export default ConfigManagerView

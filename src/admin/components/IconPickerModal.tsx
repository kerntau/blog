import React, { useState, useEffect, useMemo } from 'react'
import { Icon } from '@iconify/react'

interface IconPickerModalProps {
	currentIcon?: string
	onSelect: (iconName: string) => void
	onClose: () => void
}

// 精选预置图标库与语义分类
const ICON_CATEGORIES = [
	{ id: 'all', name: '全部图标' },
	{ id: 'cloud', name: '云服务与部署' },
	{ id: 'dev', name: '编程与技术栈' },
	{ id: 'brand', name: '社交与社群' },
	{ id: 'license', name: '协议与安全' },
	{ id: 'nav', name: '导航与页面' },
	{ id: 'media', name: '媒体与内容' },
	{ id: 'system', name: '系统与状态' },
]

const PRESET_ICONS: Array<{ name: string, category: string, tags: string[] }> = [
	// 云服务与部署
	{ name: 'ri:tencent-cloud-fill', category: 'cloud', tags: ['腾讯云', 'edgeone', 'cdn', 'tencent', '部署平台'] },
	{ name: 'devicon:cloudflare', category: 'cloud', tags: ['cloudflare', 'r2', 'workers', 'pages', '图片存储'] },
	{ name: 'logos:aws', category: 'cloud', tags: ['aws', 'amazon', 's3', 'ec2', '云服务'] },
	{ name: 'logos:vercel-icon', category: 'cloud', tags: ['vercel', 'nextjs', '部署'] },
	{ name: 'logos:netlify-icon', category: 'cloud', tags: ['netlify', '静态托管'] },
	{ name: 'logos:aliyun', category: 'cloud', tags: ['阿里云', 'oss', 'aliyun', 'ecs'] },
	{ name: 'logos:docker-icon', category: 'cloud', tags: ['docker', '容器', 'k8s', '镜像'] },
	{ name: 'logos:kubernetes', category: 'cloud', tags: ['kubernetes', 'k8s', '集群'] },
	{ name: 'logos:nginx', category: 'cloud', tags: ['nginx', '网关', '反代'] },
	{ name: 'tabler:server', category: 'cloud', tags: ['服务器', 'server', 'vps', '主机'] },
	{ name: 'tabler:cloud', category: 'cloud', tags: ['云原生', 'cloud', '云计算'] },
	{ name: 'tabler:world', category: 'cloud', tags: ['域名', 'domain', 'dns', '网络'] },

	// 编程与技术栈
	{ name: 'logos:react', category: 'dev', tags: ['react', '前端', 'ui'] },
	{ name: 'logos:vue', category: 'dev', tags: ['vue', 'vue3', '前端'] },
	{ name: 'logos:nextjs-icon', category: 'dev', tags: ['nextjs', 'react', '全栈'] },
	{ name: 'tabler:bolt', category: 'dev', tags: ['rsbuild', 'rspack', '极速构建', 'lightning'] },
	{ name: 'logos:typescript-icon', category: 'dev', tags: ['typescript', 'ts', 'javascript'] },
	{ name: 'simple-icons:mdx', category: 'dev', tags: ['mdx', 'markdown', '内容'] },
	{ name: 'logos:nodejs-icon', category: 'dev', tags: ['nodejs', 'node', 'javascript'] },
	{ name: 'logos:pnpm', category: 'dev', tags: ['pnpm', '包管理器', 'npm'] },
	{ name: 'simple-icons:framer', category: 'dev', tags: ['motion', 'framer', '动画'] },
	{ name: 'logos:sass', category: 'dev', tags: ['sass', 'scss', 'css'] },
	{ name: 'logos:tailwindcss-icon', category: 'dev', tags: ['tailwind', 'css', '样式'] },
	{ name: 'logos:vitejs', category: 'dev', tags: ['vite', '构建工具'] },
	{ name: 'logos:astro-icon', category: 'dev', tags: ['astro', '博客', '静态生成'] },
	{ name: 'logos:rust', category: 'dev', tags: ['rust', '系统编程'] },
	{ name: 'logos:python', category: 'dev', tags: ['python', 'ai', '脚本'] },
	{ name: 'logos:go', category: 'dev', tags: ['go', 'golang', '后端'] },
	{ name: 'logos:java', category: 'dev', tags: ['java', 'spring'] },
	{ name: 'tabler:code', category: 'dev', tags: ['代码', 'code', '开发'] },
	{ name: 'tabler:terminal-2', category: 'dev', tags: ['终端', 'terminal', 'shell'] },
	{ name: 'tabler:database', category: 'dev', tags: ['数据库', 'db', 'sql'] },
	{ name: 'tabler:cpu', category: 'dev', tags: ['架构', 'cpu', '核心'] },

	// 社交与社群
	{ name: 'ri:qq-fill', category: 'brand', tags: ['qq', 'qq群', '交流群', '腾讯qq'] },
	{ name: 'ri:wechat-fill', category: 'brand', tags: ['微信', 'wechat', '公众号', '微信群'] },
	{ name: 'tabler:brand-wechat', category: 'brand', tags: ['微信', 'wechat'] },
	{ name: 'tabler:brand-telegram', category: 'brand', tags: ['telegram', 'tg', '电报', '交流群'] },
	{ name: 'tabler:brand-discord', category: 'brand', tags: ['discord', '社区', 'dc'] },
	{ name: 'tabler:brand-github', category: 'brand', tags: ['github', '开源', '代码'] },
	{ name: 'ri:bilibili-fill', category: 'brand', tags: ['bilibili', '哔哩哔哩', 'b站', '视频'] },
	{ name: 'ri:bilibili-line', category: 'brand', tags: ['bilibili', 'b站'] },
	{ name: 'simple-icons:tiktok', category: 'brand', tags: ['抖音', 'tiktok', '短视频'] },
	{ name: 'tabler:brand-zhihu', category: 'brand', tags: ['知乎', 'zhihu'] },
	{ name: 'tabler:brand-twitter', category: 'brand', tags: ['twitter', '推特', 'x'] },
	{ name: 'tabler:mail', category: 'brand', tags: ['邮箱', 'email', 'mail', '联系'] },
	{ name: 'tabler:users', category: 'brand', tags: ['群组', '社区', '用户', '社区交流'] },

	// 协议与安全
	{ name: 'tabler:license', category: 'license', tags: ['开源协议', 'license', 'mit', 'apache'] },
	{ name: 'tabler:copyright', category: 'license', tags: ['版权', 'copyright', 'cc by', '许可'] },
	{ name: 'tabler:shield-check', category: 'license', tags: ['安全', 'shield', '公安备案', '认证'] },
	{ name: 'tabler:certificate', category: 'license', tags: ['备案', 'icp', '证书', '工信部'] },
	{ name: 'tabler:scale', category: 'license', tags: ['规范', '法务', '协议', '条款'] },
	{ name: 'tabler:lock', category: 'license', tags: ['加密', 'https', 'ssl', '安全'] },
	{ name: 'tabler:file-text', category: 'license', tags: ['条款', '文章许可', '文档'] },

	// 导航与页面
	{ name: 'tabler:home', category: 'nav', tags: ['主页', 'home', '首页'] },
	{ name: 'tabler:files', category: 'nav', tags: ['文章', 'files', '博客'] },
	{ name: 'tabler:archive', category: 'nav', tags: ['归档', 'archive', '历史'] },
	{ name: 'tabler:link', category: 'nav', tags: ['友链', 'link', '朋友'] },
	{ name: 'tabler:rss', category: 'nav', tags: ['订阅', 'rss', 'feed', 'atom'] },
	{ name: 'tabler:compass', category: 'nav', tags: ['探索', 'compass', '开往'] },
	{ name: 'tabler:category', category: 'nav', tags: ['分类', 'category'] },
	{ name: 'tabler:tags', category: 'nav', tags: ['标签', 'tags'] },
	{ name: 'tabler:search', category: 'nav', tags: ['搜索', 'search'] },

	// 媒体与内容
	{ name: 'tabler:photo', category: 'media', tags: ['图片', 'photo', '图床'] },
	{ name: 'tabler:video', category: 'media', tags: ['视频', 'video'] },
	{ name: 'tabler:music', category: 'media', tags: ['音乐', 'music'] },
	{ name: 'tabler:book', category: 'media', tags: ['书籍', 'book', '阅读'] },
	{ name: 'tabler:message', category: 'media', tags: ['消息', '评论', '留言'] },
	{ name: 'tabler:sparkles', category: 'media', tags: ['亮点', 'sparkles', '新动态'] },
	{ name: 'tabler:notes', category: 'media', tags: ['日志', 'notes', '更新记录'] },

	// 系统与状态
	{ name: 'tabler:chart-bar', category: 'system', tags: ['统计', 'chart', '数据'] },
	{ name: 'tabler:stack-2', category: 'system', tags: ['矩阵', 'stack', '技术栈'] },
	{ name: 'tabler:sun', category: 'system', tags: ['浅色模式', 'sun'] },
	{ name: 'tabler:moon', category: 'system', tags: ['深色模式', 'moon'] },
	{ name: 'tabler:device-desktop', category: 'system', tags: ['桌面', 'pc', '电脑'] },
	{ name: 'tabler:device-mobile', category: 'system', tags: ['手机', '移动端'] },
	{ name: 'tabler:refresh', category: 'system', tags: ['刷新', 'refresh'] },
]

const RECENT_ICONS_KEY = 'blog_admin_recent_icons'

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
	currentIcon = 'tabler:circle',
	onSelect,
	onClose,
}) => {
	const [activeCategory, setActiveCategory] = useState('all')
	const [searchQuery, setSearchQuery] = useState('')
	const [customInput, setCustomInput] = useState(currentIcon)
	const [previewColor, setPreviewColor] = useState('var(--admin-accent)')
	const [recentIcons, setRecentIcons] = useState<string[]>([])

	useEffect(() => {
		try {
			const saved = localStorage.getItem(RECENT_ICONS_KEY)
			if (saved) {
				setRecentIcons(JSON.parse(saved))
			}
		}
		catch {}
	}, [])

	const handleChoose = (iconName: string) => {
		try {
			const updated = [iconName, ...recentIcons.filter(x => x !== iconName)].slice(0, 16)
			setRecentIcons(updated)
			localStorage.setItem(RECENT_ICONS_KEY, JSON.stringify(updated))
		}
		catch {}
		onSelect(iconName)
		onClose()
	}

	const filteredIcons = useMemo(() => {
		let list = PRESET_ICONS
		if (activeCategory !== 'all') {
			list = list.filter(item => item.category === activeCategory)
		}
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase().trim()
			list = list.filter(item =>
				item.name.toLowerCase().includes(q)
				|| item.tags.some(t => t.toLowerCase().includes(q)),
			)
		}
		return list
	}, [activeCategory, searchQuery])

	return (
		<div className="admin-modal-overlay">
			<div className="admin-modal-box" style={{ maxWidth: 640, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
				{/* 模态框头部 */}
				<div className="modal-header">
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<div className="modal-title">图标选择器 (Icon Picker)</div>
						<span style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>支持 Tabler, Remix, Lucide, SimpleIcons</span>
					</div>
					<button type="button" className="admin-btn btn-ghost btn-sm" onClick={onClose}>
						<Icon icon="tabler:x" />
					</button>
				</div>

				{/* 搜索与自定义输入 */}
				<div style={{ padding: '12px 18px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
					<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
						<div style={{ position: 'relative', flex: 1 }}>
							<input
								type="text"
								className="admin-input"
								placeholder="输入中文或英文关键词搜索图标（如: 主页, github, code, settings...）"
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
								style={{ paddingLeft: 32 }}
								autoFocus
							/>
							<Icon
								icon="tabler:search"
								style={{ position: 'absolute', left: 10, top: 9, color: 'var(--admin-text-3)', fontSize: 14 }}
							/>
							{searchQuery && (
								<Icon
									icon="tabler:circle-x"
									style={{ position: 'absolute', right: 10, top: 9, color: 'var(--admin-text-3)', fontSize: 14, cursor: 'pointer' }}
									onClick={() => setSearchQuery('')}
								/>
							)}
						</div>

						{/* 自定义图标名输入 */}
						<div style={{ display: 'flex', gap: 4, width: 220 }}>
							<input
								type="text"
								className="admin-input"
								placeholder="自定义图标ID"
								value={customInput}
								onChange={e => setCustomInput(e.target.value)}
								style={{ fontSize: 12 }}
							/>
							<button
								type="button"
								className="admin-btn btn-primary btn-sm"
								onClick={() => customInput.trim() && handleChoose(customInput.trim())}
								title="使用自定义图标ID"
							>
								确认
							</button>
						</div>
					</div>

					{/* 分类切换条 */}
					<div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
						{ICON_CATEGORIES.map(cat => (
							<button
								key={cat.id}
								type="button"
								className={`admin-btn ${activeCategory === cat.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}
								onClick={() => setActiveCategory(cat.id)}
								style={{ padding: '0 10px', height: 26, fontSize: 11, flexShrink: 0 }}
							>
								{cat.name}
							</button>
						))}
					</div>

					{/* 最近使用历史 */}
					{recentIcons.length > 0 && !searchQuery && activeCategory === 'all' && (
						<div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: 'var(--admin-bg-subtle)', borderRadius: 6, border: '1px solid var(--admin-border)' }}>
							<span style={{ fontSize: 11, color: 'var(--admin-text-3)', flexShrink: 0 }}>最近使用:</span>
							<div style={{ display: 'flex', gap: 4, overflowX: 'auto', flex: 1 }}>
								{recentIcons.map(ic => (
									<div
										key={ic}
										onClick={() => handleChoose(ic)}
										style={{
											padding: '4px 6px',
											borderRadius: 4,
											cursor: 'pointer',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											background: currentIcon === ic ? 'var(--admin-accent-soft)' : 'transparent',
											border: currentIcon === ic ? '1px solid var(--admin-accent)' : '1px solid transparent',
										}}
										title={ic}
									>
										<Icon icon={ic} style={{ fontSize: 16 }} />
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{/* 图标网格列表 */}
				<div
					style={{
						flex: 1,
						overflowY: 'auto',
						padding: '12px 18px',
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
						gap: 8,
						minHeight: 240,
					}}
				>
					{filteredIcons.length === 0 ? (
						<div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--admin-text-3)', padding: '40px 0', fontSize: 12 }}>
							未找到匹配的预设图标，可直接在上方右侧输入任意 Iconify 图标名称
						</div>
					) : (
						filteredIcons.map((item) => {
							const isSelected = currentIcon === item.name
							return (
								<div
									key={item.name}
									onClick={() => handleChoose(item.name)}
									style={{
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
										justifyContent: 'center',
										padding: '10px 6px',
										borderRadius: 6,
										background: isSelected ? 'var(--admin-accent-soft)' : 'var(--admin-surface)',
										border: isSelected ? '1.5px solid var(--admin-accent)' : '1px solid var(--admin-border)',
										cursor: 'pointer',
										transition: 'all 0.15s ease',
										gap: 6,
										userSelect: 'none',
									}}
									onMouseEnter={e => !isSelected && (e.currentTarget.style.background = 'var(--admin-surface-hover)')}
									onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'var(--admin-surface)')}
									title={`${item.name}\n${item.tags.join(', ')}`}
								>
									<Icon icon={item.name} style={{ fontSize: 22, color: isSelected ? 'var(--admin-accent)' : 'var(--admin-text-1)' }} />
									<span
										style={{
											fontSize: 10,
											color: 'var(--admin-text-3)',
											textAlign: 'center',
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap',
											width: '100%',
										}}
									>
										{item.name.replace(/^(tabler|ri|simple-icons):/, '')}
									</span>
								</div>
							)
						})
					)}
				</div>

				{/* 底部当前预览与多尺寸展示 */}
				<div
					style={{
						padding: '10px 18px',
						borderTop: '1px solid var(--admin-border)',
						background: 'var(--admin-bg-subtle)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						flexWrap: 'wrap',
						gap: 10,
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							<span style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>多尺寸预览:</span>
							<Icon icon={customInput || currentIcon} style={{ fontSize: 16 }} />
							<Icon icon={customInput || currentIcon} style={{ fontSize: 20 }} />
							<Icon icon={customInput || currentIcon} style={{ fontSize: 24, color: previewColor }} />
							<Icon icon={customInput || currentIcon} style={{ fontSize: 32, color: previewColor }} />
						</div>

						<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
							<span style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>颜色:</span>
							{['#33aaff', '#7777ff', '#ffaa33', '#33bbaa', '#ff5577', '#888888'].map(c => (
								<div
									key={c}
									onClick={() => setPreviewColor(c)}
									style={{
										width: 14,
										height: 14,
										borderRadius: '50%',
										background: c,
										cursor: 'pointer',
										border: previewColor === c ? '2px solid var(--admin-text-1)' : '1px solid transparent',
									}}
								/>
							))}
						</div>
					</div>

					<div style={{ display: 'flex', gap: 6 }}>
						<button
							type="button"
							className="admin-btn btn-ghost btn-sm"
							onClick={() => handleChoose('tabler:circle')}
						>
							清空图标
						</button>
						<button
							type="button"
							className="admin-btn btn-secondary btn-sm"
							onClick={onClose}
						>
							取消
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

export default IconPickerModal

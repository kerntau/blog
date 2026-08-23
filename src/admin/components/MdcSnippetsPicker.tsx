import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'

// 导入前台真实富文本组件进行高保真预览
import Alert from '../../components/content/Alert'
import Badge from '../../components/content/Badge'
import Blur from '../../components/content/Blur'
import Chat from '../../components/content/Chat'
import Copy from '../../components/content/Copy'
import EmojiClock from '../../components/content/EmojiClock'
import Folding from '../../components/content/Folding'
import Key from '../../components/content/Key'
import LinkBanner from '../../components/content/LinkBanner'
import LinkCard from '../../components/content/LinkCard'
import MdTitle from '../../components/content/MdTitle'
import MusicScore from '../../components/content/MusicScore'
import Pic from '../../components/content/Pic'
import Poetry from '../../components/content/Poetry'
import Quote from '../../components/content/Quote'
import Tab from '../../components/content/Tab'
import Timeline from '../../components/content/Timeline'
import Tip from '../../components/content/Tip'
import VideoEmbed from '../../components/content/VideoEmbed'

export interface MdcSnippet {
	name: string
	label: string
	icon: string
	desc: string
	template: string
	category: 'container' | 'inline' | 'media' | 'layout'
	isBlock?: boolean
}

export const SNIPPETS: MdcSnippet[] = [
	// 1. 容器与提示
	{
		name: 'alert',
		label: '警告提示卡 (Alert)',
		icon: 'tabler:alert-circle',
		desc: '支持 info, tip, success, warning, error 多种状态提示框',
		template: `::alert{type="info"}\n这里是提示信息正文\n::\n`,
		category: 'container',
		isBlock: true,
	},
	{
		name: 'folding',
		label: '折叠手风琴 (Folding)',
		icon: 'tabler:chevron-down',
		desc: '可点击折叠/展开的隐藏区块，适合收纳长代码或参考细节',
		template: `::folding{title="点击展开详细内容"}\n这里是被折叠的深层内容与代码...\n::\n`,
		category: 'container',
		isBlock: true,
	},
	{
		name: 'tab',
		label: '多标签选项卡 (Tab)',
		icon: 'tabler:layout-navbar',
		desc: '多标签容器，支持多个分栏内容平滑切换',
		template: `::tab\n#tab1 选项卡1\n这是选项卡1的内容\n\n#tab2 选项卡2\n这是选项卡2的内容\n::\n`,
		category: 'container',
		isBlock: true,
	},
	{
		name: 'chat',
		label: '对话气泡 (Chat)',
		icon: 'tabler:message-2',
		desc: '模拟聊天对话界面左右气泡与身份头像',
		template: `::chat{name="AI Assistant" avatar="/avatar.webp" role="left"}\n你好！有什么我可以协助你的吗？\n::\n`,
		category: 'container',
		isBlock: true,
	},
	{
		name: 'quote',
		label: '名合格言 (Quote)',
		icon: 'tabler:quote',
		desc: '格言名句特殊引言卡片，带作者落款',
		template: `::quote{author="Linus Torvalds"}\nTalk is cheap. Show me the code.\n::\n`,
		category: 'container',
		isBlock: true,
	},

	// 2. 行内增强
	{
		name: 'tip',
		label: '悬停浮窗 (Tip)',
		icon: 'tabler:bulb',
		desc: '鼠标悬停词条时展示浮动气泡解释',
		template: `:tip[触发词]{tip="这里是浮窗解释内容"}`,
		category: 'inline',
		isBlock: false,
	},
	{
		name: 'badge',
		label: '彩色徽标 (Badge)',
		icon: 'tabler:badge',
		desc: '自定义色彩与文字的精美小徽章',
		template: `:badge[标签内容]{color="#33aaff"}`,
		category: 'inline',
		isBlock: false,
	},
	{
		name: 'blur',
		label: '模糊文字 (Blur)',
		icon: 'tabler:eye-off',
		desc: '鼠标悬停或点击后解除模糊显示敏感内容',
		template: `:blur[这里是被模糊隐藏的剧透或敏感内容]`,
		category: 'inline',
		isBlock: false,
	},
	{
		name: 'key',
		label: '键盘按键 (Key)',
		icon: 'tabler:keyboard',
		desc: '渲染实体键盘键位风格标签',
		template: `:key[Ctrl] + :key[Shift] + :key[P]`,
		category: 'inline',
		isBlock: false,
	},
	{
		name: 'copy',
		label: '一键复制 (Copy)',
		icon: 'tabler:copy',
		desc: '带快速复制交互的行内代码/文本',
		template: `:copy[pnpm install]`,
		category: 'inline',
		isBlock: false,
	},
	{
		name: 'emoji-clock',
		label: 'Emoji 时钟 (EmojiClock)',
		icon: 'tabler:clock',
		desc: '根据时间动态渲染 Emoji 时钟表盘',
		template: `:emoji-clock{time="14:30"}`,
		category: 'inline',
		isBlock: false,
	},

	// 3. 多媒体与音视频
	{
		name: 'pic',
		label: '高级图片画廊 (Pic)',
		icon: 'tabler:photo',
		desc: '支持阴影、圆角、说明字幕与响应式画廊',
		template: `::pic{src="/avatar.webp" caption="图片说明文字" width="100%"}\n`,
		category: 'media',
		isBlock: true,
	},
	{
		name: 'video-embed',
		label: '视频嵌入 (Video)',
		icon: 'tabler:video',
		desc: 'Bilibili / YouTube 高清流式播放器',
		template: `::video-embed{bvid="BV1xx411c7mD"}\n`,
		category: 'media',
		isBlock: true,
	},
	{
		name: 'music-score',
		label: '五线谱/简谱 (Music)',
		icon: 'tabler:music',
		desc: '渲染 abcjs 音乐简谱与五线谱',
		template: `::music-score\nX: 1\nT: 欢快小调\nM: 4/4\nK: C\nC D E F | G A B c |\n::\n`,
		category: 'media',
		isBlock: true,
	},

	// 4. 外链与卡片排版
	{
		name: 'link-card',
		label: '链接卡片 (LinkCard)',
		icon: 'tabler:external-link',
		desc: '质感外链卡片，带图标、标题与简介',
		template: `::link-card{title="示例网站" link="https://example.com" desc="这是一个很有价值的技术站点" icon="tabler:world"}\n`,
		category: 'layout',
		isBlock: true,
	},
	{
		name: 'link-banner',
		label: '大型外链横幅 (LinkBanner)',
		icon: 'tabler:layout-bottombar',
		desc: '带大图封面的文章外链推荐 Banner',
		template: `::link-banner{title="推荐阅读" link="https://example.com" desc="深入解析现代前端架构" image="/avatar.webp"}\n`,
		category: 'layout',
		isBlock: true,
	},
	{
		name: 'timeline',
		label: '时间轴 (Timeline)',
		icon: 'tabler:timeline',
		desc: '事件与里程碑时间线排版',
		template: `::timeline\n- 2026-01-01: 起步探索阶段\n- 2026-06-01: 项目架构重构\n- 2026-08-01: 全面接入现代化后台\n::\n`,
		category: 'layout',
		isBlock: true,
	},
	{
		name: 'card-list',
		label: '卡片网格列表 (CardList)',
		icon: 'tabler:grid-dots',
		desc: '多列自适应卡片网格列',
		template: `::card-list\n- [核心功能](/link): 支持实时预览与快速发布\n- [智能嗅探](/link): 自动抓取站点元数据\n- [本地安全](/link): 文件系统原子级写入\n::\n`,
		category: 'layout',
		isBlock: true,
	},
	{
		name: 'poetry',
		label: '诗词排版 (Poetry)',
		icon: 'tabler:feather',
		desc: '优雅居中的诗歌版式',
		template: `::poetry{author="苏轼" title="定风波"}\n莫听穿林打叶声，何妨吟啸且徐行。\n竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。\n::\n`,
		category: 'layout',
		isBlock: true,
	},
	{
		name: 'md-title',
		label: '带图标大标题 (MdTitle)',
		icon: 'tabler:heading',
		desc: '带自定义彩色图标的分节标题',
		template: `::md-title{title="架构设计" icon="tabler:stack-2" level="2"}\n`,
		category: 'layout',
		isBlock: true,
	},
]

const CATEGORY_TABS = [
	{ id: 'all', name: '全部组件' },
	{ id: 'container', name: '容器提示' },
	{ id: 'inline', name: '行内组件' },
	{ id: 'media', name: '媒体嵌入' },
	{ id: 'layout', name: '外链排版' },
] as const

/** 渲染组件的实时真实视觉效果 */
function renderLivePreview(name: string) {
	switch (name) {
		case 'alert':
			return (
				<Alert type="info" title="信息提示">
					这是警告提示卡在文章中的真实渲染效果，支持多种主题风格与图标。
				</Alert>
			)
		case 'folding':
			return (
				<Folding title="点击展开详细内容">
					<div style={{ padding: '8px 4px', fontSize: 13, color: 'var(--admin-text-2)' }}>
						这里是被折叠收起的详细代码与补充背景说明，用户点击上方栏目即可自由收合。
					</div>
				</Folding>
			)
		case 'tab':
			return (
				<Tab tabs={['TypeScript', 'Rust', 'Go']}>
					<div style={{ padding: '8px', fontSize: 13 }}>
						<code>const message: string = &apos;Hello TypeScript!&apos;;</code>
					</div>
					<div style={{ padding: '8px', fontSize: 13 }}>
						<code>let message = String::from(&quot;Hello Rust!&quot;);</code>
					</div>
					<div style={{ padding: '8px', fontSize: 13 }}>
						<code>message := &quot;Hello Go!&quot;</code>
					</div>
				</Tab>
			)
		case 'chat':
			return (
				<Chat>
					{'{.博主}你好！这是对话气泡组件的真实呈现。'}
					{'{:AI 助手}支持任意头像与身份角色的气泡排版。'}
				</Chat>
			)
		case 'quote':
			return (
				<Quote icon="tabler:quote">
					Talk is cheap. Show me the code. —— Linus Torvalds
				</Quote>
			)
		case 'tip':
			return (
				<div style={{ fontSize: 13, lineHeight: 1.8, padding: 8 }}>
					鼠标悬停在 <Tip tip="这里是浮动解释气泡的内容说明">【悬停词条】</Tip> 上即可体验即时释义交互。
				</div>
			)
		case 'badge':
			return (
				<div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: 8 }}>
					<Badge text="技术架构" link="https://github.com" />
					<Badge text="已验证" round />
					<Badge text="实验特性" square />
				</div>
			)
		case 'blur':
			return (
				<div style={{ fontSize: 13, padding: 8 }}>
					剧透警告：故事的结局是 <Blur>所有人都在星空下重逢了</Blur>（鼠标悬停即可解密文字）。
				</div>
			)
		case 'key':
			return (
				<div style={{ fontSize: 13, padding: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
					<span>快捷操作：</span>
					<Key code="Ctrl" />
					<span>+</span>
					<Key code="Shift" />
					<span>+</span>
					<Key code="P" />
				</div>
			)
		case 'copy':
			return (
				<div style={{ fontSize: 13, padding: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
					<span>点击复制命令：</span>
					<Copy code="pnpm add @mdx-js/mdx">pnpm add @mdx-js/mdx</Copy>
				</div>
			)
		case 'emoji-clock':
			return (
				<div style={{ fontSize: 13, padding: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
					<span>根据指定时间渲染时钟：</span>
					<EmojiClock datetime="14:30" />
					<strong>14:30 (下午两点半)</strong>
				</div>
			)
		case 'pic':
			return (
				<Pic src="/avatar.webp" caption="高级画廊：支持阴影、圆角、说明字幕与弹窗大图预览" />
			)
		case 'video-embed':
			return (
				<VideoEmbed type="bilibili" id="BV1xx411c7mD" />
			)
		case 'music-score':
			return (
				<MusicScore>
					{`X: 1\nT: 欢快小调\nM: 4/4\nK: C\nC D E F | G A B c |`}
				</MusicScore>
			)
		case 'link-card':
			return (
				<LinkCard title="示例网站" link="https://example.com" description="这是一个很有价值的技术站点与参考资源" icon="tabler:world" />
			)
		case 'link-banner':
			return (
				<LinkBanner title="推荐精选阅读" link="https://example.com" description="深入剖析下一代 Web 架构与并发模型" image="/avatar.webp" />
			)
		case 'timeline':
			return (
				<Timeline>
					<ul style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>
						<li>2026-01-01: 起步探索阶段</li>
						<li>2026-06-01: 项目架构重构</li>
						<li>2026-08-01: 全面接入现代化后台</li>
					</ul>
				</Timeline>
			)
		case 'card-list':
			return (
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
					<div style={{ padding: '8px 12px', background: 'var(--admin-bg-subtle)', borderRadius: 6, border: '1px solid var(--admin-border)', fontSize: 12 }}>
						<strong>⚡ 极速构建</strong>: 毫秒级 HMR 与极小产物
					</div>
					<div style={{ padding: '8px 12px', background: 'var(--admin-bg-subtle)', borderRadius: 6, border: '1px solid var(--admin-border)', fontSize: 12 }}>
						<strong>🛡️ 本地安全</strong>: 文件系统原子级安全写入
					</div>
				</div>
			)
		case 'poetry':
			return (
				<Poetry author="苏轼" title="定风波">
					莫听穿林打叶声，何妨吟啸且徐行。<br />
					竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。
				</Poetry>
			)
		case 'md-title':
			return (
				<MdTitle>
					<span style={{ fontSize: 16, fontWeight: 700 }}>🚀 架构设计与演进</span>
				</MdTitle>
			)
		default:
			return <div style={{ fontSize: 12, color: 'var(--admin-text-3)' }}>暂无该组件预览</div>
	}
}

interface MdcSnippetsPickerProps {
	onInsert: (snippetText: string) => void
}

export const MdcSnippetsPicker: React.FC<MdcSnippetsPickerProps> = ({ onInsert }) => {
	const [isOpen, setIsOpen] = useState(false)
	const [search, setSearch] = useState('')
	const [activeCategory, setActiveCategory] = useState<string>('all')
	const [selectedSnippet, setSelectedSnippet] = useState<MdcSnippet>(SNIPPETS[0]!)
	const [customCode, setCustomCode] = useState<string>(SNIPPETS[0]!.template)

	useEffect(() => {
		if (selectedSnippet) {
			setCustomCode(selectedSnippet.template)
		}
	}, [selectedSnippet])

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				setIsOpen(false)
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isOpen])

	const filtered = SNIPPETS.filter((s) => {
		if (activeCategory !== 'all' && s.category !== activeCategory) {
			return false
		}
		if (search) {
			const q = search.toLowerCase()
			return s.label.toLowerCase().includes(q)
				|| s.name.toLowerCase().includes(q)
				|| s.desc.toLowerCase().includes(q)
		}
		return true
	})

	const handleConfirmInsert = (templateText?: string) => {
		onInsert(templateText || customCode)
		setIsOpen(false)
	}

	return (
		<>
			<button
				type="button"
				className="admin-btn btn-secondary btn-sm"
				onClick={() => setIsOpen(true)}
				style={{ gap: 6, fontWeight: 550 }}
				title="打开 Markdown/MDX 富文本组件库"
			>
				<Icon icon="tabler:components" style={{ color: 'var(--admin-accent)', fontSize: 16 }} />
				<span>插入 MDX 富文本组件 ({SNIPPETS.length})</span>
			</button>

			{isOpen && (
				<div className="admin-modal-overlay" style={{ zIndex: 10000 }}>
					<div
						className="admin-modal-container"
						style={{
							maxWidth: 860,
							width: '94vw',
							maxHeight: '88vh',
							display: 'flex',
							flexDirection: 'column',
							padding: 0,
							overflow: 'hidden',
						}}
					>
						{/* 模态框顶栏 */}
						<div
							style={{
								padding: '14px 20px',
								borderBottom: '1px solid var(--admin-border)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								background: 'var(--admin-surface)',
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
								<div
									style={{
										width: 32,
										height: 32,
										borderRadius: 8,
										background: 'var(--admin-accent-soft)',
										color: 'var(--admin-accent)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: 18,
									}}
								>
									<Icon icon="tabler:components" />
								</div>
								<div>
									<div style={{ fontSize: 15, fontWeight: 700, color: 'var(--admin-text-1)' }}>
										MDX 富文本组件库
									</div>
									<div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginTop: 2 }}>
										支持容器卡片、行内徽章、音视频嵌入与排版组件，选择后直接插入当前文章光标位置
									</div>
								</div>
							</div>

							<button
								type="button"
								className="admin-btn btn-ghost btn-sm"
								onClick={() => setIsOpen(false)}
								style={{ borderRadius: '50%', width: 28, height: 28, padding: 0 }}
							>
								<Icon icon="tabler:x" style={{ fontSize: 18 }} />
							</button>
						</div>

						{/* 模态框主体：左右双栏布局 */}
						<div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', flex: 1, minHeight: 440, overflow: 'hidden' }}>
							{/* 左侧：搜索、分类与组件列表 */}
							<div
								style={{
									borderRight: '1px solid var(--admin-border)',
									display: 'flex',
									flexDirection: 'column',
									gap: 10,
									padding: 14,
									background: 'var(--admin-bg-subtle)',
									overflow: 'hidden',
								}}
							>
								{/* 搜索框 */}
								<div style={{ position: 'relative' }}>
									<input
										type="text"
										className="admin-input"
										placeholder="搜索组件 (如 alert, pic, tab, chat)..."
										value={search}
										onChange={e => setSearch(e.target.value)}
										style={{ paddingLeft: 32, fontSize: 12, height: 34 }}
										autoFocus
									/>
									<Icon
										icon="tabler:search"
										style={{ position: 'absolute', left: 10, top: 10, color: 'var(--admin-text-3)', fontSize: 15 }}
									/>
								</div>

								{/* 分类切换 Tab */}
								<div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
									{CATEGORY_TABS.map(tab => (
										<button
											key={tab.id}
											type="button"
											className={`admin-btn btn-sm ${activeCategory === tab.id ? 'btn-primary' : 'btn-ghost'}`}
											onClick={() => setActiveCategory(tab.id)}
											style={{ fontSize: 11, padding: '2px 8px', height: 24, borderRadius: 4, whiteSpace: 'nowrap' }}
										>
											{tab.name}
										</button>
									))}
								</div>

								{/* 组件列表 */}
								<div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 4, paddingRight: 4 }}>
									{filtered.length === 0 ? (
										<div style={{ textAlign: 'center', padding: '36px 0', fontSize: 12, color: 'var(--admin-text-3)' }}>
											未找到匹配的组件
										</div>
									) : (
										filtered.map((s) => {
											const isSelected = selectedSnippet.name === s.name
											return (
												<div
													key={s.name}
													onClick={() => setSelectedSnippet(s)}
													onDoubleClick={() => handleConfirmInsert(s.template)}
													style={{
														padding: '8px 10px',
														borderRadius: 6,
														cursor: 'pointer',
														display: 'flex',
														alignItems: 'flex-start',
														gap: 10,
														transition: 'all 0.15s ease',
														background: isSelected ? 'var(--admin-surface)' : 'transparent',
														border: isSelected ? '1.5px solid var(--admin-accent)' : '1px solid transparent',
														boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
													}}
												>
													<div
														style={{
															width: 28,
															height: 28,
															borderRadius: 6,
															background: isSelected ? 'var(--admin-accent)' : 'var(--admin-accent-soft)',
															color: isSelected ? '#ffffff' : 'var(--admin-accent)',
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'center',
															fontSize: 16,
															flexShrink: 0,
															marginTop: 2,
														}}
													>
														<Icon icon={s.icon} />
													</div>
													<div style={{ flex: 1, minWidth: 0 }}>
														<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
															<span style={{ fontSize: 12, fontWeight: 650, color: 'var(--admin-text-1)' }}>
																{s.label}
															</span>
															<span
																style={{
																	fontSize: 10,
																	padding: '1px 5px',
																	borderRadius: 3,
																	background: isSelected ? 'var(--admin-accent-soft)' : 'var(--admin-surface)',
																	color: isSelected ? 'var(--admin-accent)' : 'var(--admin-text-3)',
																}}
															>
																{s.isBlock ? '块级' : '行内'}
															</span>
														</div>
														<div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginTop: 2, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
															{s.desc}
														</div>
													</div>
												</div>
											)
										})
									)}
								</div>
							</div>

							{/* 右侧：高保真预览与参数详情面板 */}
							<div style={{ display: 'flex', flexDirection: 'column', padding: 18, gap: 14, background: 'var(--admin-surface)', overflowY: 'auto' }}>
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
									<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
										<div
											style={{
												width: 36,
												height: 36,
												borderRadius: 8,
												background: 'var(--admin-accent-soft)',
												color: 'var(--admin-accent)',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												fontSize: 20,
											}}
										>
											<Icon icon={selectedSnippet.icon} />
										</div>
										<div>
											<div style={{ fontSize: 15, fontWeight: 700, color: 'var(--admin-text-1)' }}>
												{selectedSnippet.label}
											</div>
											<div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 2 }}>
												{selectedSnippet.desc}
											</div>
										</div>
									</div>

									<span className="admin-badge badge-primary" style={{ fontSize: 11 }}>
										{selectedSnippet.isBlock ? '块级容器' : '行内组件'}
									</span>
								</div>

								{/* 1. 真实效果实时预览舞台 (Live Preview) */}
								<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
									<div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
										<Icon icon="tabler:eye" style={{ color: 'var(--admin-accent)' }} />
										<span>真实渲染效果预览 (Live Preview)</span>
									</div>
									<div
										style={{
											padding: '16px',
											borderRadius: 8,
											background: 'var(--admin-bg-subtle)',
											border: '1px solid var(--admin-border)',
											minHeight: 80,
											display: 'flex',
											flexDirection: 'column',
											justifyContent: 'center',
										}}
									>
										{renderLivePreview(selectedSnippet.name)}
									</div>
								</div>

								{/* 2. 模板内容与可编辑预览 */}
								<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
									<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
										<label style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
											<Icon icon="tabler:code" style={{ color: 'var(--admin-text-3)' }} />
											<span>插入代码模板 (可自由编辑参数或文案)</span>
										</label>
										<button
											type="button"
											className="admin-btn btn-ghost btn-sm"
											onClick={() => setCustomCode(selectedSnippet.template)}
											style={{ fontSize: 11, padding: '2px 6px' }}
										>
											<Icon icon="tabler:rotate" />
											<span>重置模板</span>
										</button>
									</div>

									<textarea
										className="admin-textarea"
										value={customCode}
										onChange={e => setCustomCode(e.target.value)}
										style={{
											minHeight: 110,
											maxHeight: 180,
											fontFamily: 'var(--admin-font-mono)',
											fontSize: 12.5,
											lineHeight: 1.5,
											padding: '10px 12px',
											background: 'var(--admin-bg-subtle)',
											border: '1px solid var(--admin-border)',
											borderRadius: 6,
										}}
									/>
								</div>

								{/* 快捷提示卡片 */}
								<div style={{ padding: '8px 12px', background: 'var(--admin-accent-soft)', borderRadius: 6, fontSize: 11, color: 'var(--admin-accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
									<Icon icon="tabler:info-circle" style={{ fontSize: 16, flexShrink: 0 }} />
									<span>提示：双击左侧列表条目或点击“插入到文章”，组件代码将精准写入编辑器当前光标所在位置。</span>
								</div>

								{/* 底部按钮栏 */}
								<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 6, borderTop: '1px solid var(--admin-border)' }}>
									<button
										type="button"
										className="admin-btn btn-secondary"
										onClick={() => setIsOpen(false)}
									>
										取消
									</button>
									<button
										type="button"
										className="admin-btn btn-primary"
										onClick={() => handleConfirmInsert()}
										style={{ padding: '6px 20px', fontWeight: 600 }}
									>
										<Icon icon="tabler:plus" />
										<span>插入到文章</span>
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	)
}

export default MdcSnippetsPicker

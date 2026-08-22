import React, { useState } from 'react'
import { Icon } from '@iconify/react'

interface MdcSnippet {
	name: string
	label: string
	icon: string
	desc: string
	template: string
}

const SNIPPETS: MdcSnippet[] = [
	{
		name: 'alert',
		label: '警告提示卡 (Alert)',
		icon: 'tabler:alert-circle',
		desc: '支持 info, tip, success, warning, error',
		template: `::alert{type="info"}\n这里是提示信息正文\n::\n`,
	},
	{
		name: 'tip',
		label: '悬停浮窗 (Tip)',
		icon: 'tabler:bulb',
		desc: '鼠标悬停显示解释气泡',
		template: `:tip[触发词]{tip="这里是浮窗解释内容"}`,
	},
	{
		name: 'badge',
		label: '彩色徽章 (Badge)',
		icon: 'tabler:badge',
		desc: '自定义颜色小徽标',
		template: `:badge[标签内容]{color="#33aaff"}`,
	},
	{
		name: 'blur',
		label: '模糊文字 (Blur)',
		icon: 'tabler:eye-off',
		desc: '鼠标悬停或点击后解除模糊',
		template: `::blur\n这里是被模糊隐藏的剧透或敏感内容\n::\n`,
	},
	{
		name: 'folding',
		label: '折叠内容 (Folding)',
		icon: 'tabler:chevron-down',
		desc: '可点击折叠/展开的区块',
		template: `::folding{title="点击展开详细内容"}\n这里是被折叠的深层内容与代码...\n::\n`,
	},
	{
		name: 'tab',
		label: '标签页容器 (Tab)',
		icon: 'tabler:layout-navbar',
		desc: '多标签选项卡切换',
		template: `::tab\n#tab1 选项卡1\n这是选项卡1的内容\n\n#tab2 选项卡2\n这是选项卡2的内容\n::\n`,
	},
	{
		name: 'timeline',
		label: '时间线 (Timeline)',
		icon: 'tabler:timeline',
		desc: '事件发展时间轴',
		template: `::timeline\n- 2026-01-01: 起步探索阶段\n- 2026-06-01: 项目架构重构\n- 2026-08-01: 全面接入现代化后台\n::\n`,
	},
	{
		name: 'chat',
		label: '对话气泡 (Chat)',
		icon: 'tabler:message-2',
		desc: '仿聊天界面对话气泡',
		template: `::chat{name="AI Assistant" avatar="/avatar.png" role="left"}\n你好！有什么我可以协助你的吗？\n::\n`,
	},
	{
		name: 'pic',
		label: '高级图片画廊 (Pic)',
		icon: 'tabler:photo',
		desc: '支持阴影、圆角、标题与并排画廊',
		template: `::pic{src="/og-image.jpg" caption="图片说明文字" width="100%"}\n`,
	},
	{
		name: 'music-score',
		label: '简谱/五线谱 (Music)',
		icon: 'tabler:music',
		desc: '渲染 abcjs 音乐简谱',
		template: `::music-score\nX: 1\nT: 欢快小调\nM: 4/4\nK: C\nC D E F | G A B c |\n::\n`,
	},
	{
		name: 'link-card',
		label: '链接卡片 (LinkCard)',
		icon: 'tabler:external-link',
		desc: '高质感外链卡片',
		template: `::link-card{title="示例网站" link="https://example.com" desc="这是一个很有价值的技术站点" icon="tabler:world"}\n`,
	},
	{
		name: 'link-banner',
		label: '大型外链横幅 (LinkBanner)',
		icon: 'tabler:layout-bottombar',
		desc: '带大图封面的推荐外链 Banner',
		template: `::link-banner{title="推荐阅读" link="https://example.com" desc="深入解析现代前端架构" image="/og-image.jpg"}\n`,
	},
	{
		name: 'poetry',
		label: '诗歌排版 (Poetry)',
		icon: 'tabler:feather',
		desc: '优雅居中的诗词版式',
		template: `::poetry{author="苏轼" title="定风波"}\n莫听穿林打叶声，何妨吟啸且徐行。\n竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。\n::\n`,
	},
	{
		name: 'video-embed',
		label: '视频嵌入 (Video)',
		icon: 'tabler:video',
		desc: 'Bilibili / YouTube 视频流',
		template: `::video-embed{bvid="BV1xx411c7mD"}\n`,
	},
	{
		name: 'key',
		label: '键盘按键 (Key)',
		icon: 'tabler:keyboard',
		desc: '渲染实体键盘键位风格',
		template: `:key[Ctrl] + :key[Shift] + :key[P]`,
	},
	{
		name: 'copy',
		label: '一键复制 (Copy)',
		icon: 'tabler:copy',
		desc: '带复制按钮的互动文本',
		template: `:copy[pnpm install]`,
	},
	{
		name: 'emoji-clock',
		label: 'Emoji 时钟 (EmojiClock)',
		icon: 'tabler:clock',
		desc: '根据时间动态渲染 Emoji 表盘',
		template: `:emoji-clock{time="14:30"}`,
	},
	{
		name: 'quote',
		label: '名人金句 (Quote)',
		icon: 'tabler:quote',
		desc: '格言名句特殊引言',
		template: `::quote{author="Linus Torvalds"}\nTalk is cheap. Show me the code.\n::\n`,
	},
	{
		name: 'card-list',
		label: '网格卡片列 (CardList)',
		icon: 'tabler:grid-dots',
		desc: '多列响应式卡片网格',
		template: `::card-list\n- [核心功能](/link): 支持实时预览与快速发布\n- [智能嗅探](/link): 自动抓取站点元数据\n- [本地安全](/link): 文件系统原子级写入\n::\n`,
	},
	{
		name: 'md-title',
		label: '带图标大标题 (MdTitle)',
		icon: 'tabler:heading',
		desc: '带自定义图标的文章分节标题',
		template: `::md-title{title="架构设计" icon="tabler:stack-2" level="2"}\n`,
	},
]

interface MdcSnippetsPickerProps {
	onInsert: (snippetText: string) => void
}

export const MdcSnippetsPicker: React.FC<MdcSnippetsPickerProps> = ({ onInsert }) => {
	const [isOpen, setIsOpen] = useState(false)
	const [search, setSearch] = useState('')

	const filtered = SNIPPETS.filter(
		s =>
			s.label.toLowerCase().includes(search.toLowerCase())
			|| s.name.toLowerCase().includes(search.toLowerCase())
			|| s.desc.toLowerCase().includes(search.toLowerCase()),
	)

	return (
		<div style={{ position: 'relative', display: 'inline-block' }}>
			<button
				type="button"
				className="admin-btn btn-secondary btn-sm"
				onClick={() => setIsOpen(!isOpen)}
				style={{ gap: 6 }}
			>
				<Icon icon="tabler:components" style={{ color: 'var(--admin-accent)' }} />
				<span>插入 MDX 富文本组件 ({SNIPPETS.length})</span>
				<Icon icon={isOpen ? 'tabler:chevron-up' : 'tabler:chevron-down'} style={{ fontSize: 12 }} />
			</button>

			{isOpen && (
				<>
					<div
						style={{ position: 'fixed', inset: 0, zIndex: 90 }}
						onClick={() => setIsOpen(false)}
					/>
					<div
						className="admin-card"
						style={{
							position: 'absolute',
							top: '100%',
							left: 0,
							marginTop: 6,
							width: 380,
							maxHeight: 460,
							zIndex: 95,
							padding: 10,
							display: 'flex',
							flexDirection: 'column',
							gap: 8,
							boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
						}}
					>
						<div style={{ position: 'relative' }}>
							<input
								type="text"
								className="admin-input"
								placeholder="搜索组件 (如 alert, pic, tab, chat, timeline)..."
								value={search}
								onChange={e => setSearch(e.target.value)}
								style={{ paddingLeft: 30, fontSize: 12, height: 32 }}
								autoFocus
							/>
							<Icon
								icon="tabler:search"
								style={{ position: 'absolute', left: 9, top: 8, color: 'var(--admin-text-3)', fontSize: 14 }}
							/>
						</div>

						<div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 360 }}>
							{filtered.map(s => (
								<div
									key={s.name}
									onClick={() => {
										onInsert(s.template)
										setIsOpen(false)
									}}
									style={{
										padding: '6px 8px',
										borderRadius: 6,
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										gap: 10,
										transition: 'background 0.15s ease',
									}}
									onMouseEnter={e => e.currentTarget.style.background = 'var(--admin-surface-hover)'}
									onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
								>
									<div
										style={{
											width: 28,
											height: 28,
											borderRadius: 6,
											background: 'var(--admin-accent-soft)',
											color: 'var(--admin-accent)',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontSize: 16,
											flexShrink: 0,
										}}
									>
										<Icon icon={s.icon} />
									</div>
									<div style={{ flex: 1, minWidth: 0 }}>
										<div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-1)' }}>{s.label}</div>
										<div style={{ fontSize: 11, color: 'var(--admin-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
											{s.desc}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</>
			)}
		</div>
	)
}

export default MdcSnippetsPicker

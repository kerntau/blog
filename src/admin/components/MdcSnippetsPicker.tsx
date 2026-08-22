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
		label: '一键复制 Copy',
		icon: 'tabler:copy',
		desc: '互动',
		template: `:copy[pnpm install]`,
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
				style={{ gap: 6, borderColor: 'var(--c-primary-soft)' }}
			>
				<Icon icon="tabler:components" style={{ color: 'var(--c-primary)' }} />
				<span>插入 MDC 短代码 / 特色组件</span>
				<Icon icon={isOpen ? 'tabler:chevron-up' : 'tabler:chevron-down'} style={{ fontSize: 12 }} />
			</button>

			{isOpen && (
				<>
					<div
						style={{ position: 'fixed', inset: 0, zIndex: 90 }}
						onClick={() => setIsOpen(false)}
					/>
					<div
						className="glass-card"
						style={{
							position: 'absolute',
							top: '100%',
							left: 0,
							marginTop: 8,
							width: 360,
							maxHeight: 460,
							zIndex: 95,
							padding: 12,
							display: 'flex',
							flexDirection: 'column',
							gap: 8,
							boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
						}}
					>
						<div style={{ position: 'relative' }}>
							<input
								type="text"
								className="admin-input"
								placeholder="搜索 MDC 组件 (如 alert, tab, chat)..."
								value={search}
								onChange={e => setSearch(e.target.value)}
								style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
								autoFocus
							/>
							<Icon
								icon="tabler:search"
								style={{ position: 'absolute', left: 10, top: 10, color: 'var(--c-text-3)' }}
							/>
						</div>

						<div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 380 }}>
							{filtered.map(s => (
								<div
									key={s.name}
									onClick={() => {
										onInsert(s.template)
										setIsOpen(false)
									}}
									style={{
										padding: '8px 10px',
										borderRadius: 8,
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										gap: 10,
										transition: 'background 0.2s',
									}}
									onMouseEnter={e => e.currentTarget.style.background = 'var(--c-bg-soft)'}
									onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
								>
									<div
										style={{
											width: 32,
											height: 32,
											borderRadius: 8,
											background: 'var(--c-primary-soft)',
											color: 'var(--c-primary)',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontSize: 18,
											flexShrink: 0,
										}}
									>
										<Icon icon={s.icon} />
									</div>
									<div style={{ flex: 1, minWidth: 0 }}>
										<div style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</div>
										<div style={{ fontSize: 11, color: 'var(--c-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

import React from 'react'
import { Icon } from '@iconify/react'

interface ShortcutHelpModalProps {
	isOpen: boolean
	onClose: () => void
}

interface ShortcutItem {
	keys: string[]
	description: string
	category: string
}

export const ShortcutHelpModal: React.FC<ShortcutHelpModalProps> = ({ isOpen, onClose }) => {
	if (!isOpen) return null

	const shortcuts: ShortcutItem[] = [
		{ category: '全局导航', keys: ['Ctrl', 'K'], description: '呼出命令面板 / 全局即时搜索' },
		{ category: '全局导航', keys: ['?'], description: '显示快捷键帮助清单' },
		{ category: '文章工坊', keys: ['Ctrl', 'S'], description: '保存当前文章草稿或修改' },
		{ category: '文章工坊', keys: ['Ctrl', 'Enter'], description: '一键发布文章上线' },
		{ category: '文章工坊', keys: ['Ctrl', 'P'], description: '切换双栏 / 纯预览排版' },
		{ category: '文章工坊', keys: ['Ctrl', 'B'], description: '插入粗体 **文本**' },
		{ category: '文章工坊', keys: ['Ctrl', 'I'], description: '插入斜体 *文本*' },
	]

	const categories = Array.from(new Set(shortcuts.map(s => s.category)))

	return (
		<div className="admin-modal-overlay" onClick={onClose}>
			<div
				className="admin-modal-box"
				style={{ maxWidth: 480 }}
				onClick={e => e.stopPropagation()}
			>
				<div className="modal-header">
					<div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
						<Icon icon="tabler:keyboard" style={{ color: 'var(--admin-accent)', fontSize: 16 }} />
						<span>快捷键操作指南</span>
					</div>
					<button type="button" className="admin-btn btn-ghost btn-sm" onClick={onClose}>
						<Icon icon="tabler:x" />
					</button>
				</div>

				<div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
					{categories.map(cat => (
						<div key={cat}>
							<div style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-3)', marginBottom: 6, textTransform: 'uppercase' }}>
								{cat}
							</div>
							<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
								{shortcuts.filter(s => s.category === cat).map((s, idx) => (
									<div
										key={idx}
										style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											padding: '6px 8px',
											borderRadius: 5,
											background: 'var(--admin-bg-subtle)',
											fontSize: 12,
										}}
									>
										<span style={{ color: 'var(--admin-text-1)' }}>{s.description}</span>
										<div style={{ display: 'flex', gap: 4 }}>
											{s.keys.map((k, ki) => (
												<kbd key={ki} className="admin-kbd">
													{k}
												</kbd>
											))}
										</div>
									</div>
								))}
							</div>
						</div>
					))}
				</div>

				<div className="modal-footer" style={{ justifyContent: 'space-between' }}>
					<span style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>
						提示：在任何页面直接按下键盘 <kbd className="admin-kbd">?</kbd> 即可随时打开此面板
					</span>
					<button type="button" className="admin-btn btn-primary btn-sm" onClick={onClose}>
						知道了
					</button>
				</div>
			</div>
		</div>
	)
}

export default ShortcutHelpModal

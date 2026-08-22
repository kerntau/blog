import React from 'react'
import { Icon } from '@iconify/react'

interface DiffViewerModalProps {
	title?: string
	oldText: string
	newText: string
	onClose: () => void
	onConfirmSave?: () => void
}

export const DiffViewerModal: React.FC<DiffViewerModalProps> = ({
	title = '修改差异比对',
	oldText,
	newText,
	onClose,
	onConfirmSave,
}) => {
	const oldLines = oldText.split('\n')
	const newLines = newText.split('\n')

	const diffLines: Array<{ type: 'added' | 'removed' | 'same', content: string }> = []

	let i = 0
	let j = 0
	while (i < oldLines.length || j < newLines.length) {
		const ol = oldLines[i]
		const nl = newLines[j]

		if (ol === nl) {
			if (ol !== undefined) {
				diffLines.push({ type: 'same', content: `  ${ol}` })
			}
			i++
			j++
		}
		else if (ol !== undefined && (nl === undefined || !newLines.slice(j).includes(ol))) {
			diffLines.push({ type: 'removed', content: `- ${ol}` })
			i++
		}
		else if (nl !== undefined) {
			diffLines.push({ type: 'added', content: `+ ${nl}` })
			j++
		}
		else {
			break
		}

		if (diffLines.length > 2000) {
			diffLines.push({ type: 'same', content: '... (差异内容过长，仅展示前 2000 行)' })
			break
		}
	}

	const addedCount = diffLines.filter(l => l.type === 'added').length
	const removedCount = diffLines.filter(l => l.type === 'removed').length

	return (
		<div className="admin-modal-overlay">
			<div className="admin-modal-box" style={{ maxWidth: 840, height: '85vh' }}>
				<div className="modal-header">
					<div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<Icon icon="tabler:git-compare" style={{ color: 'var(--admin-accent)', fontSize: 18 }} />
						<span>{title}</span>
						<span style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)' }}>
							(+{addedCount} / -{removedCount})
						</span>
					</div>
					<button type="button" className="admin-btn btn-ghost btn-sm" onClick={onClose}>
						<Icon icon="tabler:x" style={{ fontSize: 16 }} />
					</button>
				</div>

				<div className="modal-body" style={{ padding: 0, overflowY: 'auto', background: '#0d1117' }}>
					<div style={{ fontFamily: 'var(--admin-font-mono)', fontSize: 12, lineHeight: 1.6, padding: 14 }}>
						{diffLines.length === 0 || (addedCount === 0 && removedCount === 0) ? (
							<div style={{ color: '#8b949e', textAlign: 'center', padding: 40 }}>
								内容与磁盘文件完全一致，暂无改动
							</div>
						) : (
							diffLines.map((line, idx) => (
								<div
									key={idx}
									style={{
										whiteSpace: 'pre-wrap',
										wordBreak: 'break-all',
										color:
											line.type === 'added'
												? '#7ee787'
												: line.type === 'removed'
													? '#ff7b72'
													: '#c9d1d9',
										background:
											line.type === 'added'
												? 'rgba(46, 160, 67, 0.15)'
												: line.type === 'removed'
													? 'rgba(248, 81, 73, 0.15)'
													: 'transparent',
										padding: '1px 6px',
										borderRadius: 2,
									}}
								>
									{line.content}
								</div>
							))
						)}
					</div>
				</div>

				<div className="modal-footer">
					<button type="button" className="admin-btn btn-secondary btn-sm" onClick={onClose}>
						关闭
					</button>
					{onConfirmSave && (
						<button
							type="button"
							className="admin-btn btn-primary btn-sm"
							onClick={() => {
								onConfirmSave()
								onClose()
							}}
						>
							<Icon icon="tabler:device-floppy" />
							<span>保存修改</span>
						</button>
					)}
				</div>
			</div>
		</div>
	)
}

export default DiffViewerModal

import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import type { PostSnapshot } from '../types'
import { DiffViewerModal } from './DiffViewerModal'

interface HistoryVersionModalProps {
	slug: string
	currentContent: string
	onClose: () => void
	onRestore: (snapshot: PostSnapshot) => void
}

export const HistoryVersionModal: React.FC<HistoryVersionModalProps> = ({
	slug,
	currentContent,
	onClose,
	onRestore,
}) => {
	const [snapshots, setSnapshots] = useState<PostSnapshot[]>([])
	const [loading, setLoading] = useState(true)
	const [selectedSnapshot, setSelectedSnapshot] = useState<PostSnapshot | null>(null)
	const [showDiff, setShowDiff] = useState(false)

	useEffect(() => {
		setLoading(true)
		adminApi.getPostHistory(slug)
			.then((data) => {
				setSnapshots(data)
				if (data.length > 0) {
					setSelectedSnapshot(data[0] || null)
				}
			})
			.catch(() => {})
			.finally(() => setLoading(false))
	}, [slug])

	return (
		<div className="admin-modal-overlay">
			<div className="admin-modal-box" style={{ maxWidth: 840, height: '75vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
				{/* 头部 */}
				<div className="modal-header" style={{ padding: '14px 18px', borderBottom: '1px solid var(--admin-border)' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<div className="modal-title">文章历史版本快照 ({snapshots.length})</div>
						<span style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>文章: {slug}</span>
					</div>
					<button type="button" className="admin-btn btn-ghost btn-sm" onClick={onClose}>
						<Icon icon="tabler:x" />
					</button>
				</div>

				{/* 主体双栏 */}
				<div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
					{/* 左侧版本列表 */}
					<div
						style={{
							width: 260,
							borderRight: '1px solid var(--admin-border)',
							background: 'var(--admin-surface)',
							overflowY: 'auto',
							padding: 8,
							display: 'flex',
							flexDirection: 'column',
							gap: 4,
						}}
					>
						{loading ? (
							<div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--admin-text-3)' }}>
								<Icon icon="tabler:loader-2" style={{ animation: 'spin 1s linear infinite' }} />
							</div>
						) : snapshots.length === 0 ? (
							<div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--admin-text-3)', fontSize: 12 }}>
								暂无历史版本快照（保存文章后将自动记录）
							</div>
						) : (
							snapshots.map((item, idx) => {
								const isSelected = selectedSnapshot?.fileName === item.fileName
								return (
									<div
										key={item.fileName || idx}
										onClick={() => setSelectedSnapshot(item)}
										style={{
											padding: '8px 10px',
											borderRadius: 6,
											background: isSelected ? 'var(--admin-accent-soft)' : 'transparent',
											border: isSelected ? '1px solid var(--admin-accent)' : '1px solid transparent',
											cursor: 'pointer',
										}}
									>
										<div style={{ fontSize: 12, fontWeight: 600, color: isSelected ? 'var(--admin-accent)' : 'var(--admin-text-1)' }}>
											{item.timestamp}
										</div>
										<div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
											<span>{item.remark || '自动保存快照'}</span>
											<span>{item.content.length} 字符</span>
										</div>
									</div>
								)
							})
						)}
					</div>

					{/* 右侧快照详情与预览 */}
					<div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--admin-bg)' }}>
						{selectedSnapshot ? (
							<div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
								<div
									style={{
										padding: '10px 16px',
										borderBottom: '1px solid var(--admin-border)',
										background: 'var(--admin-surface)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
									}}
								>
									<div>
										<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)' }}>
											快照: {selectedSnapshot.frontmatter?.title || slug}
										</div>
										<div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>
											创建于 {selectedSnapshot.timestamp} · 备注: {selectedSnapshot.remark}
										</div>
									</div>

									<div style={{ display: 'flex', gap: 6 }}>
										<button
											type="button"
											className="admin-btn btn-secondary btn-sm"
											onClick={() => setShowDiff(true)}
										>
											<Icon icon="tabler:git-compare" />
											<span>对比当前差异</span>
										</button>
										<button
											type="button"
											className="admin-btn btn-primary btn-sm"
											onClick={() => onRestore(selectedSnapshot)}
										>
											<Icon icon="tabler:history" />
											<span>恢复此版本</span>
										</button>
									</div>
								</div>

								{/* 正文源码查看 */}
								<div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
									<pre
										style={{
											margin: 0,
											fontSize: 12,
											lineHeight: 1.6,
											fontFamily: 'var(--admin-font-mono)',
											color: 'var(--admin-text-1)',
											whiteSpace: 'pre-wrap',
											wordBreak: 'break-all',
										}}
									>
										{selectedSnapshot.content}
									</pre>
								</div>
							</div>
						) : (
							<div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-3)', fontSize: 12 }}>
								请在左侧选择要查看的历史快照
							</div>
						)}
					</div>
				</div>

				{/* 差异比对弹窗 */}
				{showDiff && selectedSnapshot && (
					<DiffViewerModal
						oldText={selectedSnapshot.content}
						newText={currentContent}
						onClose={() => setShowDiff(false)}
						onConfirmSave={() => onRestore(selectedSnapshot)}
					/>
				)}
			</div>
		</div>
	)
}

export default HistoryVersionModal

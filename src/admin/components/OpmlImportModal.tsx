import React, { useState } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import type { FeedItem } from '../types'
import { useToast } from './Toast'

interface OpmlImportModalProps {
	targetGroupName: string
	onImportSuccess: (entries: FeedItem[]) => void
	onClose: () => void
}

export const OpmlImportModal: React.FC<OpmlImportModalProps> = ({
	targetGroupName,
	onImportSuccess,
	onClose,
}) => {
	const { showToast } = useToast()
	const [opmlText, setOpmlText] = useState('')
	const [parsing, setParsing] = useState(false)

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		const reader = new FileReader()
		reader.onload = () => {
			setOpmlText(reader.result as string)
		}
		reader.readAsText(file)
	}

	const handleDoImport = async () => {
		if (!opmlText.trim()) {
			showToast('请粘贴或上传 OPML 内容', 'warning')
			return
		}
		setParsing(true)
		try {
			const res = await adminApi.importOpml(opmlText)
			if (res.entries && res.entries.length > 0) {
				showToast(`成功解析导入 ${res.entries.length} 条博友订阅`, 'success')
				onImportSuccess(res.entries)
				onClose()
			}
			else {
				showToast('未提取到有效订阅条目', 'warning')
			}
		}
		catch (err: any) {
			showToast(`导入失败: ${err.message}`, 'error')
		}
		finally {
			setParsing(false)
		}
	}

	return (
		<div className="admin-modal-overlay">
			<div className="admin-modal-box" style={{ maxWidth: 560 }}>
				<div className="modal-header">
					<div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
						<Icon icon="tabler:file-import" style={{ fontSize: 16 }} />
						<span>导入 OPML 友链 (目标组: {targetGroupName})</span>
					</div>
					<button type="button" className="admin-btn btn-ghost btn-sm" onClick={onClose}>
						<Icon icon="tabler:x" style={{ fontSize: 16 }} />
					</button>
				</div>

				<div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<span style={{ fontSize: 12, color: 'var(--admin-text-3)' }}>
							选择本地 <code>.opml</code> 文件或直接粘贴 XML 源码：
						</span>

						<label className="admin-btn btn-secondary btn-sm" style={{ cursor: 'pointer', height: 24, fontSize: 11 }}>
							<Icon icon="tabler:upload" />
							<span>选择文件</span>
							<input
								type="file"
								accept=".opml,.xml"
								onChange={handleFileUpload}
								style={{ display: 'none' }}
							/>
						</label>
					</div>

					<textarea
						className="admin-textarea"
						placeholder="在此直接粘贴 OPML 源码..."
						value={opmlText}
						onChange={e => setOpmlText(e.target.value)}
						style={{ height: 180, fontFamily: 'var(--admin-font-mono)', fontSize: 11 }}
					/>
				</div>

				<div className="modal-footer">
					<button type="button" className="admin-btn btn-secondary btn-sm" onClick={onClose}>
						取消
					</button>
					<button
						type="button"
						className="admin-btn btn-primary btn-sm"
						onClick={handleDoImport}
						disabled={parsing || !opmlText.trim()}
					>
						<Icon icon={parsing ? 'tabler:loader-2' : 'tabler:check'} />
						<span>{parsing ? '解析中...' : '确认导入'}</span>
					</button>
				</div>
			</div>
		</div>
	)
}

export default OpmlImportModal

import React, { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import type { AuditLogItem, BackupSnapshotItem } from '../types'
import { useToast } from '../components/Toast'

export const BackupManagerView: React.FC = () => {
	const { showToast } = useToast()
	const [snapshots, setSnapshots] = useState<BackupSnapshotItem[]>([])
	const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([])
	const [loading, setLoading] = useState(false)
	const [creating, setCreating] = useState(false)
	const [restoring, setRestoring] = useState(false)
	const [snapshotNote, setSnapshotNote] = useState('')
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [confirmRestoreTarget, setConfirmRestoreTarget] = useState<string | null>(null)
	const [dragOver, setDragOver] = useState(false)
	const fileInputRef = useRef<HTMLInputElement | null>(null)

	// 加载快照与审计日志
	const loadData = async () => {
		setLoading(true)
		try {
			const [snapshotsList, logs] = await Promise.all([
				adminApi.getBackups().catch(() => []),
				adminApi.getAuditLogs().catch(() => []),
			])
			setSnapshots(snapshotsList)
			setAuditLogs(logs)
		}
		catch (err: any) {
			showToast(`加载备份列表失败: ${err.message}`, 'error')
		}
		finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadData()
	}, [])

	// 1. 一键创建本地安全快照
	const handleCreateSnapshot = async () => {
		setCreating(true)
		try {
			const res = await adminApi.createSnapshot(snapshotNote.trim() || undefined)
			showToast(res.message || '快照创建成功', 'success')
			setSnapshotNote('')
			setShowCreateModal(false)
			loadData()
		}
		catch (err: any) {
			showToast(`创建快照失败: ${err.message}`, 'error')
		}
		finally {
			setCreating(false)
		}
	}

	// 2. 导出全量备份 JSON 到本地电脑
	const handleExportBackup = async () => {
		try {
			const data = await adminApi.getBackup()
			const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = `blog-backup-${new Date().toISOString().slice(0, 10)}.json`
			a.click()
			URL.revokeObjectURL(url)
			showToast('全量数据备份已生成并开始下载', 'success')
			loadData()
		}
		catch (err: any) {
			showToast(`导出备份失败: ${err.message}`, 'error')
		}
	}

	// 3. 从快照执行还原
	const handleRestoreSnapshot = async (fileName: string) => {
		setRestoring(true)
		try {
			const res = await adminApi.restoreSnapshot(fileName)
			showToast(res.message || '全站数据已成功从快照还原', 'success')
			setConfirmRestoreTarget(null)
			loadData()
		}
		catch (err: any) {
			showToast(`还原失败: ${err.message}`, 'error')
		}
		finally {
			setRestoring(false)
		}
	}

	const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<string | null>(null)
	const [pendingUploadBackup, setPendingUploadBackup] = useState<any | null>(null)

	// 4. 删除指定快照
	const handleDeleteSnapshot = async (fileName: string) => {
		try {
			await adminApi.deleteSnapshot(fileName)
			showToast('快照已删除', 'info')
			setConfirmDeleteTarget(null)
			loadData()
		}
		catch (err: any) {
			showToast(`删除快照失败: ${err.message}`, 'error')
		}
	}

	// 5. 上传备份文件一键还原
	const handleFileSelect = (file: File) => {
		if (!file.name.endsWith('.json')) {
			showToast('仅支持导入 .json 格式的备份文件', 'warning')
			return
		}
		const reader = new FileReader()
		reader.onload = async () => {
			try {
				const content = reader.result as string
				const backupObj = JSON.parse(content)
				if (!backupObj.posts) {
					showToast('导入文件不是有效的博客备份格式', 'error')
					return
				}
				setPendingUploadBackup(backupObj)
			}
			catch (err: any) {
				showToast(`解析失败: ${err.message}`, 'error')
			}
		}
		reader.readAsText(file)
	}

	const handleExecuteUploadRestore = async () => {
		if (!pendingUploadBackup) return
		setRestoring(true)
		try {
			const res = await adminApi.restoreBackup(pendingUploadBackup)
			showToast(res.message || '已成功从外部备份文件完成全量还原', 'success')
			setPendingUploadBackup(null)
			loadData()
		}
		catch (err: any) {
			showToast(`还原失败: ${err.message}`, 'error')
		}
		finally {
			setRestoring(false)
		}
	}

	const formatSize = (bytes: number) => {
		if (!bytes) return '0 B'
		if (bytes < 1024) return `${bytes} B`
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
		return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 1080, margin: '0 auto' }}>
			{/* 顶栏卡片 */}
			<div className="admin-card" style={{ padding: '20px 24px' }}>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
					<div>
						<div style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-text-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
							<Icon icon="tabler:database-export" style={{ color: 'var(--admin-accent)', fontSize: 20 }} />
							<span>全站数据备份与快照中心</span>
						</div>
						<div style={{ fontSize: 12.5, color: 'var(--admin-text-3)', marginTop: 4 }}>
							全量备份博客所有文章 Markdown、分类标签、全站配置与全局数据，支持一键创建本地快照与秒级安全回滚。
						</div>
					</div>

					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<button
							type="button"
							className="admin-btn btn-primary"
							onClick={() => setShowCreateModal(true)}
							disabled={creating}
						>
							<Icon icon="tabler:plus" />
							<span>创建本地快照</span>
						</button>

						<button
							type="button"
							className="admin-btn btn-secondary"
							onClick={handleExportBackup}
							title="将全站数据打包导出为 JSON 文件下载到电脑本地"
						>
							<Icon icon="tabler:download" />
							<span>导出备份 (JSON)</span>
						</button>

						<button
							type="button"
							className="admin-btn btn-secondary"
							onClick={() => fileInputRef.current?.click()}
							title="从本地上传备份文件执行恢复"
						>
							<Icon icon="tabler:upload" />
							<span>导入外部备份</span>
						</button>
						<input
							ref={fileInputRef}
							type="file"
							accept=".json"
							style={{ display: 'none' }}
							onChange={(e) => {
								const file = e.target.files?.[0]
								if (file) handleFileSelect(file)
								e.target.value = ''
							}}
						/>
					</div>
				</div>

				{/* 统计指标卡 */}
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 18 }}>
					<div style={{ background: 'var(--admin-bg-subtle)', padding: '12px 16px', borderRadius: 'var(--admin-radius-md)', border: '1px solid var(--admin-border)' }}>
						<div style={{ fontSize: 11.5, color: 'var(--admin-text-3)' }}>快照归档总数</div>
						<div style={{ fontSize: 20, fontWeight: 700, color: 'var(--admin-text-1)', marginTop: 2 }}>{snapshots.length} 份</div>
					</div>

					<div style={{ background: 'var(--admin-bg-subtle)', padding: '12px 16px', borderRadius: 'var(--admin-radius-md)', border: '1px solid var(--admin-border)' }}>
						<div style={{ fontSize: 11.5, color: 'var(--admin-text-3)' }}>最近快照生成时间</div>
						<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)', marginTop: 4 }}>
							{snapshots[0]?.createdAt ? new Date(snapshots[0].createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '暂无快照'}
						</div>
					</div>

					<div style={{ background: 'var(--admin-bg-subtle)', padding: '12px 16px', borderRadius: 'var(--admin-radius-md)', border: '1px solid var(--admin-border)' }}>
						<div style={{ fontSize: 11.5, color: 'var(--admin-text-3)' }}>本地归档状态</div>
						<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-success)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
							<span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--admin-success)', display: 'inline-block' }} />
							<span>实时持久化生效中</span>
						</div>
					</div>
				</div>
			</div>

			{/* 本地快照历史列表 */}
			<div className="admin-card" style={{ padding: '18px 20px' }}>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
					<div style={{ fontSize: 14, fontWeight: 650, color: 'var(--admin-text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
						<Icon icon="tabler:history" style={{ color: 'var(--admin-accent)' }} />
						<span>历史备份快照库 (Snapshot Archives)</span>
					</div>

					<button
						type="button"
						className="admin-btn btn-ghost btn-sm"
						onClick={loadData}
						disabled={loading}
					>
						<Icon icon="tabler:rotate" style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
						<span>刷新列表</span>
					</button>
				</div>

				{snapshots.length === 0 ? (
					<div
						style={{
							padding: '48px 20px',
							textAlign: 'center',
							background: 'var(--admin-bg-subtle)',
							borderRadius: 'var(--admin-radius-md)',
							border: '1px dashed var(--admin-border)',
							color: 'var(--admin-text-3)',
						}}
					>
						<Icon icon="tabler:database-off" style={{ fontSize: 36, opacity: 0.5, marginBottom: 8 }} />
						<div style={{ fontSize: 13, fontWeight: 600 }}>暂无本地快照归档</div>
						<div style={{ fontSize: 11.5, marginTop: 4 }}>点击上方「创建本地快照」即可即刻保存当前博客完整状态</div>
					</div>
				) : (
					<div className="admin-table-container">
						<table className="admin-table">
							<thead>
								<tr>
									<th>快照名称 / 备注</th>
									<th>包含文章</th>
									<th>文件体积</th>
									<th>创建时间</th>
									<th style={{ textAlign: 'right' }}>操作</th>
								</tr>
							</thead>
							<tbody>
								{snapshots.map((snap) => (
									<tr key={snap.fileName}>
										<td>
											<div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
												<span style={{ fontWeight: 600, color: 'var(--admin-text-1)', fontSize: 13 }}>
													{snap.note || '手动全量快照'}
												</span>
												<code style={{ fontSize: 10.5, color: 'var(--admin-text-3)', fontFamily: 'var(--admin-font-mono)' }}>
													{snap.fileName}
												</code>
											</div>
										</td>
										<td>
											<span className="admin-badge badge-primary">{snap.postCount} 篇文章</span>
										</td>
										<td>
											<span style={{ fontSize: 12, color: 'var(--admin-text-2)', fontFamily: 'var(--admin-font-mono)' }}>
												{formatSize(snap.size)}
											</span>
										</td>
										<td>
											<span style={{ fontSize: 12, color: 'var(--admin-text-3)' }}>
												{new Date(snap.createdAt).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
											</span>
										</td>
										<td style={{ textAlign: 'right' }}>
											<div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
												<button
													type="button"
													className="admin-btn btn-primary btn-sm"
													onClick={() => setConfirmRestoreTarget(snap.fileName)}
													disabled={restoring}
													title="将全站数据立即回滚还原至此快照"
												>
													<Icon icon="tabler:restore" />
													<span>还原</span>
												</button>

												<button
													type="button"
													className="admin-btn btn-ghost btn-sm"
													onClick={() => handleDeleteSnapshot(snap.fileName)}
													title="删除此快照"
													style={{ color: 'var(--admin-danger)' }}
												>
													<Icon icon="tabler:trash" />
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* 外部备份拖拽上传区域 */}
			<div
				onDragOver={(e) => {
					e.preventDefault()
					setDragOver(true)
				}}
				onDragLeave={() => setDragOver(false)}
				onDrop={(e) => {
					e.preventDefault()
					setDragOver(false)
					const file = e.dataTransfer.files?.[0]
					if (file) handleFileSelect(file)
				}}
				style={{
					padding: '24px 20px',
					textAlign: 'center',
					borderRadius: 'var(--admin-radius-lg)',
					border: `2px dashed ${dragOver ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
					background: dragOver ? 'var(--admin-accent-soft)' : 'var(--admin-surface)',
					transition: 'all 0.15s ease',
					cursor: 'pointer',
				}}
				onClick={() => fileInputRef.current?.click()}
			>
				<Icon icon="tabler:cloud-upload" style={{ fontSize: 32, color: dragOver ? 'var(--admin-accent)' : 'var(--admin-text-3)', marginBottom: 6 }} />
				<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)' }}>
					拖拽本地备份文件 (.json) 到此处，或点击选择文件
				</div>
				<div style={{ fontSize: 11.5, color: 'var(--admin-text-3)', marginTop: 4 }}>
					支持快速恢复他人分享或先前导出的全量备份数据
				</div>
			</div>

			{/* 审计日志列表 */}
			{auditLogs.length > 0 && (
				<div className="admin-card" style={{ padding: '16px 20px' }}>
					<div style={{ fontSize: 13.5, fontWeight: 650, color: 'var(--admin-text-1)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
						<Icon icon="tabler:shield-check" style={{ color: 'var(--admin-success)' }} />
						<span>备份与操作审计记录 (Audit Trail)</span>
					</div>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
						{auditLogs.slice(0, 15).map((log) => (
							<div
								key={log.id}
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									padding: '6px 10px',
									background: 'var(--admin-bg-subtle)',
									borderRadius: 'var(--admin-radius-sm)',
									fontSize: 11.5,
								}}
							>
								<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
									<span className="admin-badge badge-default">{log.action}</span>
									<span style={{ color: 'var(--admin-text-1)', fontWeight: 500 }}>{log.target}</span>
									<span style={{ color: 'var(--admin-text-3)' }}>{log.details}</span>
								</div>
								<span style={{ color: 'var(--admin-text-4)', fontSize: 10.5, fontFamily: 'var(--admin-font-mono)' }}>
									{new Date(log.timestamp).toLocaleTimeString('zh-CN')}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* 创建快照模态弹窗 */}
			{showCreateModal && (
				<div
					style={{
						position: 'fixed',
						inset: 0,
						background: 'rgba(0,0,0,0.45)',
						backdropFilter: 'blur(6px)',
						zIndex: 100000,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						padding: 20,
					}}
				>
					<div
						className="admin-card"
						style={{
							width: '100%',
							maxWidth: 440,
							padding: '22px 24px',
							boxShadow: 'var(--admin-shadow-lg)',
						}}
					>
						<div style={{ fontSize: 15, fontWeight: 700, color: 'var(--admin-text-1)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
							<Icon icon="tabler:camera" style={{ color: 'var(--admin-accent)' }} />
							<span>创建本地全量安全快照</span>
						</div>
						<div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginBottom: 16 }}>
							系统将完整打包当前所有文章内容、分类、友链及站点配置并存入本地历史快照库。
						</div>

						<div className="admin-form-group">
							<label className="admin-form-label">快照备注说明 (可选)</label>
							<input
								type="text"
								className="admin-input"
								placeholder="如：重大文章发布前备份 / 主题升级前快照"
								value={snapshotNote}
								onChange={e => setSnapshotNote(e.target.value)}
								autoFocus
							/>
						</div>

						<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
							<button
								type="button"
								className="admin-btn btn-secondary"
								onClick={() => setShowCreateModal(false)}
								disabled={creating}
							>
								取消
							</button>
							<button
								type="button"
								className="admin-btn btn-primary"
								onClick={handleCreateSnapshot}
								disabled={creating}
							>
								<Icon icon="tabler:check" />
								<span>{creating ? '正在创建...' : '立即创建快照'}</span>
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 确认删除快照模态弹窗 */}
			{confirmDeleteTarget && (
				<div
					style={{
						position: 'fixed',
						inset: 0,
						background: 'rgba(0,0,0,0.45)',
						backdropFilter: 'blur(6px)',
						zIndex: 100000,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						padding: 20,
					}}
				>
					<div
						className="admin-card"
						style={{
							width: '100%',
							maxWidth: 420,
							padding: '22px 24px',
							boxShadow: 'var(--admin-shadow-lg)',
						}}
					>
						<div style={{ fontSize: 15, fontWeight: 700, color: 'var(--admin-danger)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
							<Icon icon="tabler:trash" />
							<span>确认删除此历史快照？</span>
						</div>
						<div style={{ fontSize: 12.5, color: 'var(--admin-text-2)', lineHeight: 1.5, marginBottom: 16 }}>
							确定要彻底删除快照 <code>{confirmDeleteTarget}</code> 吗？删除后将无法通过此快照进行还原。
						</div>

						<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
							<button
								type="button"
								className="admin-btn btn-secondary"
								onClick={() => setConfirmDeleteTarget(null)}
							>
								取消
							</button>
							<button
								type="button"
								className="admin-btn btn-danger"
								onClick={() => handleDeleteSnapshot(confirmDeleteTarget)}
							>
								<Icon icon="tabler:trash" />
								<span>确认删除</span>
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 确认还原快照模态弹窗 */}
			{confirmRestoreTarget && (
				<div
					style={{
						position: 'fixed',
						inset: 0,
						background: 'rgba(0,0,0,0.45)',
						backdropFilter: 'blur(6px)',
						zIndex: 100000,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						padding: 20,
					}}
				>
					<div
						className="admin-card"
						style={{
							width: '100%',
							maxWidth: 440,
							padding: '22px 24px',
							boxShadow: 'var(--admin-shadow-lg)',
						}}
					>
						<div style={{ fontSize: 15, fontWeight: 700, color: 'var(--admin-danger)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
							<Icon icon="tabler:alert-triangle" />
							<span>确认回滚还原系统数据？</span>
						</div>
						<div style={{ fontSize: 12.5, color: 'var(--admin-text-2)', lineHeight: 1.5, marginBottom: 16 }}>
							即将从快照 <code>{confirmRestoreTarget}</code> 执行全量还原，当前所有文章与全局配置将被快照内的数据覆盖。确定要继续吗？
						</div>

						<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
							<button
								type="button"
								className="admin-btn btn-secondary"
								onClick={() => setConfirmRestoreTarget(null)}
								disabled={restoring}
							>
								取消
							</button>
							<button
								type="button"
								className="admin-btn btn-danger"
								onClick={() => handleRestoreSnapshot(confirmRestoreTarget)}
								disabled={restoring}
							>
								<Icon icon="tabler:restore" />
								<span>{restoring ? '正在还原中...' : '确认立即还原'}</span>
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 确认外部导入还原模态弹窗 */}
			{pendingUploadBackup && (
				<div
					style={{
						position: 'fixed',
						inset: 0,
						background: 'rgba(0,0,0,0.45)',
						backdropFilter: 'blur(6px)',
						zIndex: 100000,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						padding: 20,
					}}
				>
					<div
						className="admin-card"
						style={{
							width: '100%',
							maxWidth: 440,
							padding: '22px 24px',
							boxShadow: 'var(--admin-shadow-lg)',
						}}
					>
						<div style={{ fontSize: 15, fontWeight: 700, color: 'var(--admin-warning)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
							<Icon icon="tabler:upload" />
							<span>确认导入并还原全站数据？</span>
						</div>
						<div style={{ fontSize: 12.5, color: 'var(--admin-text-2)', lineHeight: 1.5, marginBottom: 16 }}>
							检测到有效备份文件（包含 <strong>{Object.keys(pendingUploadBackup.posts || {}).length}</strong> 篇文章），确定要立即执行全量还原吗？当前数据将被覆盖。
						</div>

						<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
							<button
								type="button"
								className="admin-btn btn-secondary"
								onClick={() => setPendingUploadBackup(null)}
								disabled={restoring}
							>
								取消
							</button>
							<button
								type="button"
								className="admin-btn btn-primary"
								onClick={handleExecuteUploadRestore}
								disabled={restoring}
							>
								<Icon icon="tabler:restore" />
								<span>{restoring ? '正在还原中...' : '确认执行还原'}</span>
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

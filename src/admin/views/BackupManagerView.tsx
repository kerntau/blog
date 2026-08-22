import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import type { AuditLogItem, IntegrityCheckResult } from '../types'
import { useToast } from '../components/Toast'

export const BackupManagerView: React.FC = () => {
	const { showToast } = useToast()
	const [activeSubTab, setActiveSubTab] = useState<'backup' | 'integrity' | 'audit'>('backup')
	const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([])
	const [integrityResult, setIntegrityResult] = useState<IntegrityCheckResult | null>(null)
	const [loading, setLoading] = useState(false)
	const [restoring, setRestoring] = useState(false)
	const [restoreJsonInput, setRestoreJsonInput] = useState('')

	const loadAuditLogs = async () => {
		try {
			const logs = await adminApi.getAuditLogs()
			setAuditLogs(logs)
		}
		catch {}
	}

	const runIntegrityCheck = async () => {
		setLoading(true)
		try {
			const res = await adminApi.checkIntegrity()
			setIntegrityResult(res)
			showToast('数据完整性体检完成', 'success')
		}
		catch (err: any) {
			showToast(`体检失败: ${err.message}`, 'error')
		}
		finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadAuditLogs()
		runIntegrityCheck()
	}, [])

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
			showToast('系统全量数据备份包已生成并下载', 'success')
			loadAuditLogs()
		}
		catch (err: any) {
			showToast(`备份失败: ${err.message}`, 'error')
		}
	}

	const handleRestore = async () => {
		if (!restoreJsonInput.trim()) {
			showToast('请先粘贴备份 JSON 内容', 'warning')
			return
		}

		let backupObj: any
		try {
			backupObj = JSON.parse(restoreJsonInput.trim())
		}
		catch (err: any) {
			showToast(`JSON 解析错误: ${err.message}`, 'error')
			return
		}

		setRestoring(true)
		try {
			const res = await adminApi.restoreBackup(backupObj)
			showToast(res.message, 'success')
			setRestoreJsonInput('')
			loadAuditLogs()
			runIntegrityCheck()
		}
		catch (err: any) {
			showToast(`还原失败: ${err.message}`, 'error')
		}
		finally {
			setRestoring(false)
		}
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
			{/* 顶栏 */}
			<div className="admin-card" style={{ padding: '14px 18px' }}>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
					<div>
						<div style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text-1)' }}>
							本地数据管理与备份 (Backup & Audit)
						</div>
						<div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 2 }}>
							全量本地快照导出、灾难一键恢复、数据完整性体检与操作审计流水
						</div>
					</div>

					<div style={{ display: 'flex', background: 'var(--admin-bg-subtle)', padding: 2, borderRadius: 6, border: '1px solid var(--admin-border)' }}>
						<button
							type="button"
							className={`admin-btn ${activeSubTab === 'backup' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
							onClick={() => setActiveSubTab('backup')}
						>
							<Icon icon="tabler:database-export" />
							<span>备份与还原</span>
						</button>
						<button
							type="button"
							className={`admin-btn ${activeSubTab === 'integrity' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
							onClick={() => setActiveSubTab('integrity')}
						>
							<Icon icon="tabler:shield-check" />
							<span>完整性体检</span>
						</button>
						<button
							type="button"
							className={`admin-btn ${activeSubTab === 'audit' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
							onClick={() => setActiveSubTab('audit')}
						>
							<Icon icon="tabler:list-details" />
							<span>操作审计流水 ({auditLogs.length})</span>
						</button>
					</div>
				</div>
			</div>

			{activeSubTab === 'backup' && (
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
					{/* 导出全量快照 */}
					<div className="admin-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							<div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--admin-accent-soft)', color: 'var(--admin-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
								<Icon icon="tabler:download" />
							</div>
							<div>
								<div style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text-1)' }}>
									导出全量系统备份
								</div>
								<div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>
									打包全部 Markdown/MDX 文章、友链列表、blog.config 与 app.config
								</div>
							</div>
						</div>

						<p style={{ fontSize: 12, color: 'var(--admin-text-2)', lineHeight: 1.6 }}>
							备份文件为原子 JSON 格式，包含了系统所有核心数据源的完整内容与时间戳快照。建议在执行大批量重构或重要修改前导出留档。
						</p>

						<button
							type="button"
							className="admin-btn btn-primary btn-sm"
							onClick={handleExportBackup}
							style={{ alignSelf: 'flex-start', marginTop: 8 }}
						>
							<Icon icon="tabler:file-download" />
							<span>生成并下载备份 JSON</span>
						</button>
					</div>

					{/* 恢复系统快照 */}
					<div className="admin-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							<div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--admin-warning-soft)', color: 'var(--admin-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
								<Icon icon="tabler:history" />
							</div>
							<div>
								<div style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text-1)' }}>
									从备份包还原系统
								</div>
								<div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>
									将备份 JSON 中的文章与配置文件原子写回文件系统
								</div>
							</div>
						</div>

						<textarea
							className="admin-textarea"
							placeholder="在此粘贴备份 JSON 文本内容..."
							value={restoreJsonInput}
							onChange={e => setRestoreJsonInput(e.target.value)}
							style={{ height: 100, fontSize: 11, fontFamily: 'var(--admin-font-mono)' }}
						/>

						<button
							type="button"
							className="admin-btn btn-danger btn-sm"
							onClick={handleRestore}
							disabled={restoring}
							style={{ alignSelf: 'flex-start' }}
						>
							<Icon icon={restoring ? 'tabler:loader-2' : 'tabler:rotate'} />
							<span>{restoring ? '正在还原...' : '确认执行数据还原'}</span>
						</button>
					</div>
				</div>
			)}

			{activeSubTab === 'integrity' && (
				<div className="admin-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							<Icon icon="tabler:shield-check" style={{ fontSize: 20, color: integrityResult?.healthy ? 'var(--admin-success)' : 'var(--admin-warning)' }} />
							<span style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text-1)' }}>
								全站数据完整性诊断报告
							</span>
						</div>
						<button type="button" className="admin-btn btn-secondary btn-sm" onClick={runIntegrityCheck} disabled={loading}>
							<Icon icon={loading ? 'tabler:loader-2' : 'tabler:refresh'} />
							<span>重新诊断</span>
						</button>
					</div>

					{integrityResult && (
						<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
							<div style={{ display: 'flex', gap: 12 }}>
								<div style={{ padding: '8px 14px', background: 'var(--admin-bg-subtle)', borderRadius: 6, fontSize: 12 }}>
									检查文章总数: <strong>{integrityResult.totalPosts}</strong>
								</div>
								<div style={{ padding: '8px 14px', background: 'var(--admin-bg-subtle)', borderRadius: 6, fontSize: 12 }}>
									发现问题数: <strong>{integrityResult.issueCount}</strong>
								</div>
								<div style={{ padding: '8px 14px', background: integrityResult.healthy ? 'var(--admin-success-soft)' : 'var(--admin-warning-soft)', borderRadius: 6, fontSize: 12, color: integrityResult.healthy ? 'var(--admin-success)' : 'var(--admin-warning)', fontWeight: 600 }}>
									{integrityResult.healthy ? '系统健康度良好' : '检测到潜在异常'}
								</div>
							</div>

							<div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
								{integrityResult.issues.length === 0 ? (
									<div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--admin-success)', fontSize: 13 }}>
										未发现任何 slug 冲突或 frontmatter 缺失问题，数据结构完整！
									</div>
								) : (
									integrityResult.issues.map((iss, idx) => (
										<div
											key={idx}
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: 10,
												padding: '8px 12px',
												borderRadius: 6,
												background: iss.type === 'error' ? 'var(--admin-danger-soft)' : iss.type === 'warning' ? 'var(--admin-warning-soft)' : 'var(--admin-bg-subtle)',
												border: '1px solid var(--admin-border)',
												fontSize: 12,
											}}
										>
											<Icon
												icon={iss.type === 'error' ? 'tabler:alert-octagon' : iss.type === 'warning' ? 'tabler:alert-triangle' : 'tabler:info-circle'}
												style={{ color: iss.type === 'error' ? 'var(--admin-danger)' : iss.type === 'warning' ? 'var(--admin-warning)' : 'var(--admin-text-2)' }}
											/>
											<span style={{ fontWeight: 500, color: 'var(--admin-text-1)' }}>{iss.message}</span>
											<span style={{ fontSize: 11, color: 'var(--admin-text-3)', fontFamily: 'var(--admin-font-mono)' }}>({iss.target})</span>
										</div>
									))
								)}
							</div>
						</div>
					)}
				</div>
			)}

			{activeSubTab === 'audit' && (
				<div className="admin-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
					<div style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text-1)', marginBottom: 4 }}>
						系统操作审计日志流水 (最近 {auditLogs.length} 条)
					</div>

					{auditLogs.length === 0 ? (
						<div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--admin-text-3)', fontSize: 12 }}>
							暂无操作日志记录
						</div>
					) : (
						<div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '60vh', overflowY: 'auto' }}>
							{auditLogs.map((log) => (
								<div
									key={log.id}
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										padding: '8px 12px',
										background: 'var(--admin-surface)',
										border: '1px solid var(--admin-border)',
										borderRadius: 6,
										fontSize: 12,
									}}
								>
									<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
										<span className="admin-badge badge-primary" style={{ fontSize: 10 }}>
											{log.action}
										</span>
										<span style={{ fontWeight: 500, color: 'var(--admin-text-1)' }}>
											{log.details}
										</span>
									</div>

									<div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--admin-text-3)', fontSize: 11 }}>
										<span>操作人: {log.operator}</span>
										<span style={{ fontFamily: 'var(--admin-font-mono)' }}>{log.timestamp}</span>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	)
}

export default BackupManagerView

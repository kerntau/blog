import React, { useState } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import type { FeedCheckResult } from '../types'

interface FeedCheckModalProps {
	links: string[]
	onClose: () => void
}

export const FeedCheckModal: React.FC<FeedCheckModalProps> = ({ links, onClose }) => {
	const [loading, setLoading] = useState(false)
	const [results, setResults] = useState<FeedCheckResult[]>([])
	const [hasRun, setHasRun] = useState(false)
	const [errorMsg, setErrorMsg] = useState('')

	const runCheck = async () => {
		setLoading(true)
		setHasRun(true)
		setErrorMsg('')
		try {
			const res = await adminApi.checkFeeds(links)
			setResults(res)
		}
		catch (err: any) {
			setErrorMsg(`检测失败: ${err.message}`)
		}
		finally {
			setLoading(false)
		}
	}

	const okCount = results.filter(r => r.ok).length
	const failCount = results.length - okCount

	return (
		<div className="admin-modal-overlay">
			<div className="admin-modal-box" style={{ maxWidth: 640 }}>
				<div className="modal-header">
					<div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
						<Icon icon="tabler:activity-heartbeat" style={{ fontSize: 16 }} />
						<span>友链连通性检测 ({links.length} 个站点)</span>
					</div>
					<button type="button" className="admin-btn btn-ghost btn-sm" onClick={onClose}>
						<Icon icon="tabler:x" style={{ fontSize: 16 }} />
					</button>
				</div>

				<div className="modal-body">
					{errorMsg && (
						<div style={{ padding: '6px 10px', background: 'var(--admin-danger-soft)', color: 'var(--admin-danger)', borderRadius: 4, marginBottom: 10, fontSize: 12 }}>
							{errorMsg}
						</div>
					)}

					{!hasRun ? (
						<div style={{ textAlign: 'center', padding: '24px 0' }}>
							<div style={{ fontSize: 32, color: 'var(--admin-accent)', marginBottom: 8 }}>
								<Icon icon="tabler:world-bolt" />
							</div>
							<div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
								准备批量检测当前 {links.length} 个友链
							</div>
							<div style={{ fontSize: 12, color: 'var(--admin-text-3)', maxWidth: 360, margin: '0 auto 16px' }}>
								并发发送 HTTP 探测包，检测目标站点连通性与响应状态。
							</div>
							<button
								type="button"
								className="admin-btn btn-primary btn-sm"
								onClick={runCheck}
								disabled={loading}
							>
								<Icon icon="tabler:player-play" />
								<span>开始检测</span>
							</button>
						</div>
					) : loading ? (
						<div style={{ textAlign: 'center', padding: '30px 0' }}>
							<Icon icon="tabler:loader-2" style={{ fontSize: 28, color: 'var(--admin-accent)', animation: 'spin 1s linear infinite' }} />
							<div style={{ marginTop: 10, fontSize: 13, fontWeight: 500, color: 'var(--admin-text-2)' }}>
								正在并发测试友链连通性...
							</div>
						</div>
					) : (
						<div>
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
								<div className="admin-card" style={{ padding: 10, textAlign: 'center' }}>
									<div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>总检测数</div>
									<div style={{ fontSize: 16, fontWeight: 700 }}>{results.length}</div>
								</div>
								<div className="admin-card" style={{ padding: 10, textAlign: 'center' }}>
									<div style={{ fontSize: 11, color: 'var(--admin-success)' }}>正常连通</div>
									<div style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-success)' }}>{okCount}</div>
								</div>
								<div className="admin-card" style={{ padding: 10, textAlign: 'center' }}>
									<div style={{ fontSize: 11, color: 'var(--admin-danger)' }}>异常/超时</div>
									<div style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-danger)' }}>{failCount}</div>
								</div>
							</div>

							<div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
								{results.map((r, idx) => (
									<div
										key={idx}
										style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											padding: '6px 10px',
											borderRadius: 4,
											background: 'var(--admin-bg-subtle)',
											fontSize: 12,
										}}
									>
										<div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
											<span
												style={{
													width: 6,
													height: 6,
													borderRadius: '50%',
													background: r.ok ? 'var(--admin-success)' : 'var(--admin-danger)',
													flexShrink: 0,
												}}
											/>
											<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--admin-font-mono)' }}>
												{r.link}
											</span>
										</div>
										<div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
											{r.timeMs !== undefined && (
												<span style={{ fontSize: 10, color: 'var(--admin-text-3)' }}>{r.timeMs}ms</span>
											)}
											<span className={`admin-badge ${r.ok ? 'badge-success' : 'badge-danger'}`}>
												{r.status > 0 ? `HTTP ${r.status}` : (r.error || '连接失败')}
											</span>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				<div className="modal-footer">
					{hasRun && !loading && (
						<button type="button" className="admin-btn btn-secondary btn-sm" onClick={runCheck}>
							<Icon icon="tabler:refresh" />
							<span>重新测试</span>
						</button>
					)}
					<button type="button" className="admin-btn btn-secondary btn-sm" onClick={onClose}>
						关闭
					</button>
				</div>
			</div>
		</div>
	)
}

export default FeedCheckModal

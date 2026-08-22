import React, { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import type { AssetFile, AssetReferenceData } from '../types'

interface AssetRefModalProps {
	asset: AssetFile
	onClose: () => void
	onNavigatePost?: (path: string) => void
}

export const AssetRefModal: React.FC<AssetRefModalProps> = ({ asset, onClose, onNavigatePost }) => {
	const [loading, setLoading] = useState(true)
	const [refData, setRefData] = useState<AssetReferenceData | null>(null)

	useEffect(() => {
		adminApi.getAssetReferences(asset.path)
			.then(data => setRefData(data))
			.finally(() => setLoading(false))
	}, [asset.path])

	return (
		<div className="admin-modal-overlay">
			<div className="admin-modal-box" style={{ maxWidth: 520 }}>
				<div className="modal-header">
					<div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
						<Icon icon="tabler:file-search" style={{ fontSize: 16 }} />
						<span>图片反向引用分析</span>
					</div>
					<button type="button" className="admin-btn btn-ghost btn-sm" onClick={onClose}>
						<Icon icon="tabler:x" style={{ fontSize: 16 }} />
					</button>
				</div>

				<div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--admin-bg-subtle)', padding: 10, borderRadius: 6, border: '1px solid var(--admin-border)' }}>
						<img
							src={asset.path}
							alt={asset.name}
							style={{ width: 40, height: 40, objectFit: 'contain', background: 'var(--admin-surface)', borderRadius: 4 }}
						/>
						<div style={{ flex: 1, minWidth: 0 }}>
							<div style={{ fontSize: 13, fontWeight: 600 }}>{asset.name}</div>
							<div style={{ fontSize: 11, color: 'var(--admin-text-3)', fontFamily: 'var(--admin-font-mono)' }}>{asset.path}</div>
						</div>
					</div>

					{loading ? (
						<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '20vh' }}>
							<Icon icon="tabler:loader-2" style={{ fontSize: 24, color: 'var(--admin-text-3)', animation: 'spin 1s linear infinite' }} />
						</div>
					) : (
						<div>
							<div style={{ fontSize: 12, fontWeight: 500, color: 'var(--admin-text-2)', marginBottom: 6 }}>
								全站共在 <strong>{refData?.count || 0}</strong> 篇博文中引用了该资产：
							</div>

							{refData && refData.posts.length > 0 ? (
								<div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 260, overflowY: 'auto' }}>
									{refData.posts.map(p => (
										<div
											key={p.path}
											style={{
												padding: '6px 10px',
												borderRadius: 4,
												background: 'var(--admin-bg-subtle)',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												fontSize: 12,
											}}
										>
											<div style={{ flex: 1, minWidth: 0 }}>
												<div style={{ fontWeight: 500 }}>{p.title}</div>
												<div style={{ fontSize: 10, color: 'var(--admin-text-3)', fontFamily: 'var(--admin-font-mono)' }}>{p.relativePath}</div>
											</div>
											{onNavigatePost && (
												<button
													type="button"
													className="admin-btn btn-primary btn-sm"
													style={{ height: 24, padding: '0 6px', fontSize: 11 }}
													onClick={() => {
														onNavigatePost(p.path)
														onClose()
													}}
												>
													<span>编辑</span>
												</button>
											)}
										</div>
									))}
								</div>
							) : (
								<div style={{ textAlign: 'center', color: 'var(--admin-text-3)', padding: '20px 0', fontSize: 12 }}>
									暂无博文引用此图片
								</div>
							)}
						</div>
					)}
				</div>

				<div className="modal-footer">
					<button type="button" className="admin-btn btn-secondary btn-sm" onClick={onClose}>
						关闭
					</button>
				</div>
			</div>
		</div>
	)
}

export default AssetRefModal

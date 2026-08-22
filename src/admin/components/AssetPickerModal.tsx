import React, { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import type { AssetFile } from '../types'

interface AssetPickerModalProps {
	onSelect: (imageMarkdown: string, rawPath: string) => void
	onClose: () => void
}

export const AssetPickerModal: React.FC<AssetPickerModalProps> = ({ onSelect, onClose }) => {
	const [assets, setAssets] = useState<AssetFile[]>([])
	const [loading, setLoading] = useState(true)
	const [search, setSearch] = useState('')

	useEffect(() => {
		adminApi.getAssets()
			.then(data => setAssets(data))
			.finally(() => setLoading(false))
	}, [])

	const isImage = (p: string) => /\.(?:png|jpe?g|gif|webp|svg|ico)$/i.test(p)

	const filtered = assets
		.filter(a => isImage(a.name))
		.filter(a =>
			a.name.toLowerCase().includes(search.toLowerCase())
			|| a.path.toLowerCase().includes(search.toLowerCase()),
		)

	return (
		<div className="admin-modal-overlay">
			<div className="admin-modal-box" style={{ maxWidth: 720, height: '75vh' }}>
				<div className="modal-header">
					<div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
						<Icon icon="tabler:photo" style={{ fontSize: 16 }} />
						<span>从媒体资产库挑选插图</span>
					</div>
					<button type="button" className="admin-btn btn-ghost btn-sm" onClick={onClose}>
						<Icon icon="tabler:x" style={{ fontSize: 16 }} />
					</button>
				</div>

				<div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
					<div style={{ position: 'relative' }}>
						<input
							type="text"
							className="admin-input"
							placeholder="搜索图片文件名..."
							value={search}
							onChange={e => setSearch(e.target.value)}
							style={{ paddingLeft: 30, height: 30 }}
							autoFocus
						/>
						<Icon
							icon="tabler:search"
							style={{ position: 'absolute', left: 9, top: 8, color: 'var(--admin-text-3)', fontSize: 14 }}
						/>
					</div>

					{loading ? (
						<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
							<Icon icon="tabler:loader-2" style={{ fontSize: 24, color: 'var(--admin-text-3)', animation: 'spin 1s linear infinite' }} />
						</div>
					) : (
						<div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
							{filtered.map(asset => (
								<div
									key={asset.path}
									className="admin-card interactive"
									style={{
										padding: 8,
										cursor: 'pointer',
										display: 'flex',
										flexDirection: 'column',
										gap: 6,
										alignItems: 'center',
									}}
									onClick={() => {
										onSelect(`![${asset.name}](${asset.path})`, asset.path)
										onClose()
									}}
								>
									<div
										style={{
											width: '100%',
											height: 80,
											background: 'var(--admin-bg-subtle)',
											borderRadius: 4,
											overflow: 'hidden',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											border: '1px solid var(--admin-border)',
										}}
									>
										<img
											src={asset.path}
											alt={asset.name}
											style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
										/>
									</div>
									<div
										style={{
											fontSize: 11,
											fontWeight: 500,
											textAlign: 'center',
											width: '100%',
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap',
										}}
										title={asset.name}
									>
										{asset.name}
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				<div className="modal-footer">
					<button type="button" className="admin-btn btn-secondary btn-sm" onClick={onClose}>
						取消
					</button>
				</div>
			</div>
		</div>
	)
}

export default AssetPickerModal

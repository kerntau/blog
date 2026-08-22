import React, { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import type { AssetFile } from '../types'
import { AssetRefModal } from '../components/AssetRefModal'
import { useToast } from '../components/Toast'

interface AssetManagerViewProps {
	onNavigatePost?: (path: string) => void
}

export const AssetManagerView: React.FC<AssetManagerViewProps> = ({ onNavigatePost }) => {
	const { showToast } = useToast()
	const [assets, setAssets] = useState<AssetFile[]>([])
	const [loading, setLoading] = useState(true)
	const [search, setSearch] = useState('')
	const [filterType, setFilterType] = useState<'all' | 'image' | 'svg' | 'font' | 'doc'>('all')

	const [deleteTarget, setDeleteTarget] = useState<AssetFile | null>(null)
	const [refTarget, setRefTarget] = useState<AssetFile | null>(null)
	const [previewTarget, setPreviewTarget] = useState<AssetFile | null>(null)

	const loadAssets = async () => {
		setLoading(true)
		try {
			const data = await adminApi.getAssets()
			setAssets(data)
		}
		catch (err: any) {
			showToast(`加载资产失败: ${err.message}`, 'error')
		}
		finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadAssets()
	}, [])

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files
		if (!files || files.length === 0) return

		const fileArray = Array.from(files)
		let uploadedCount = 0

		fileArray.forEach((file) => {
			const reader = new FileReader()
			reader.onload = async () => {
				const base64 = reader.result as string
				try {
					await adminApi.uploadAsset(file.name, base64)
					uploadedCount++
					if (uploadedCount === fileArray.length) {
						await loadAssets()
						showToast(`成功上传 ${uploadedCount} 个文件`, 'success')
					}
				}
				catch (err: any) {
					showToast(`上传 ${file.name} 失败: ${err.message}`, 'error')
				}
			}
			reader.readAsDataURL(file)
		})
	}

	const confirmDelete = async () => {
		if (!deleteTarget) return
		try {
			await adminApi.deleteAsset(deleteTarget.path)
			setAssets(assets.filter(a => a.path !== deleteTarget.path))
			showToast('文件已删除', 'success')
		}
		catch (err: any) {
			showToast(`删除失败: ${err.message}`, 'error')
		}
		finally {
			setDeleteTarget(null)
		}
	}

	const handleCopy = (text: string, label: string) => {
		navigator.clipboard.writeText(text)
		showToast(`已复制 ${label}`, 'success')
	}

	const formatSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
		return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
	}

	const isImage = (p: string) => /\.(?:png|jpe?g|gif|webp|svg|ico)$/i.test(p)

	const filtered = assets
		.filter((a) => {
			if (filterType === 'image') return /\.(?:png|jpe?g|gif|webp|ico)$/i.test(a.name)
			if (filterType === 'svg') return /\.svg$/i.test(a.name)
			if (filterType === 'font') return /\.(?:woff2?|ttf|otf|eot)$/i.test(a.name)
			if (filterType === 'doc') return /\.(?:md|json|xml|txt|pdf)$/i.test(a.name)
			return true
		})
		.filter(a =>
			a.name.toLowerCase().includes(search.toLowerCase())
			|| a.path.toLowerCase().includes(search.toLowerCase()),
		)

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
			{/* 顶部工具栏 */}
			<div className="admin-card" style={{ padding: '14px 18px' }}>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
					<div>
						<div style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text-1)' }}>
							媒体与静态资产库
						</div>
						<div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 2 }}>
							管理 public/ 目录下的静态资源，支持多格式筛选与文章引用扫描
						</div>
					</div>

					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<label className="admin-btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
							<Icon icon="tabler:upload" />
							<span>上传文件</span>
							<input
								type="file"
								multiple
								onChange={handleFileUpload}
								style={{ display: 'none' }}
							/>
						</label>
					</div>
				</div>
			</div>

			{/* 搜索与格式分类 */}
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
				<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
					<div style={{ position: 'relative', width: 220 }}>
						<input
							type="text"
							className="admin-input"
							placeholder="搜索文件名..."
							value={search}
							onChange={e => setSearch(e.target.value)}
							style={{ paddingLeft: 30, height: 28, fontSize: 12 }}
						/>
						<Icon
							icon="tabler:search"
							style={{ position: 'absolute', left: 9, top: 7, color: 'var(--admin-text-3)', fontSize: 13 }}
						/>
					</div>

					<div style={{ display: 'flex', background: 'var(--admin-bg-subtle)', padding: 2, borderRadius: 6, border: '1px solid var(--admin-border)' }}>
						<button
							type="button"
							className={`admin-btn ${filterType === 'all' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
							onClick={() => setFilterType('all')}
							style={{ height: 24, padding: '0 8px', fontSize: 11 }}
						>
							全部
						</button>
						<button
							type="button"
							className={`admin-btn ${filterType === 'image' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
							onClick={() => setFilterType('image')}
							style={{ height: 24, padding: '0 8px', fontSize: 11 }}
						>
							图片
						</button>
						<button
							type="button"
							className={`admin-btn ${filterType === 'svg' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
							onClick={() => setFilterType('svg')}
							style={{ height: 24, padding: '0 8px', fontSize: 11 }}
						>
							SVG
						</button>
						<button
							type="button"
							className={`admin-btn ${filterType === 'font' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
							onClick={() => setFilterType('font')}
							style={{ height: 24, padding: '0 8px', fontSize: 11 }}
						>
							字体
						</button>
						<button
							type="button"
							className={`admin-btn ${filterType === 'doc' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
							onClick={() => setFilterType('doc')}
							style={{ height: 24, padding: '0 8px', fontSize: 11 }}
						>
							文档
						</button>
					</div>
				</div>

				<div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>
					共 {filtered.length} 个文件
				</div>
			</div>

			{/* 资产网格 */}
			{loading ? (
				<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
					<Icon icon="tabler:loader-2" style={{ fontSize: 24, color: 'var(--admin-text-3)', animation: 'spin 1s linear infinite' }} />
				</div>
			) : filtered.length === 0 ? (
				<div className="admin-card" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--admin-text-3)' }}>
					暂无匹配的资产文件
				</div>
			) : (
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
					{filtered.map(asset => (
						<div
							key={asset.path}
							className="admin-card interactive"
							style={{
								padding: 10,
								display: 'flex',
								flexDirection: 'column',
								gap: 8,
								justifyContent: 'space-between',
							}}
						>
							<div
								style={{
									height: 110,
									borderRadius: 6,
									background: 'var(--admin-bg-subtle)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									overflow: 'hidden',
									border: '1px solid var(--admin-border)',
									cursor: isImage(asset.name) ? 'pointer' : 'default',
								}}
								onClick={() => isImage(asset.name) && setPreviewTarget(asset)}
								title={isImage(asset.name) ? '点击放大预览' : ''}
							>
								{isImage(asset.name) ? (
									<img
										src={asset.path}
										alt={asset.name}
										style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
									/>
								) : (
									<Icon icon="tabler:file" style={{ fontSize: 36, color: 'var(--admin-text-3)' }} />
								)}
							</div>

							<div>
								<div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={asset.name}>
									{asset.name}
								</div>
								<div style={{ fontSize: 10, color: 'var(--admin-text-3)', marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
									<span>{formatSize(asset.size)}</span>
									<span>{asset.path}</span>
								</div>
							</div>

							<div style={{ display: 'flex', gap: 2, borderTop: '1px solid var(--admin-border)', paddingTop: 6 }}>
								<button
									type="button"
									className="admin-btn btn-ghost btn-sm"
									style={{ flex: 1, height: 24, padding: '0 4px', fontSize: 11 }}
									onClick={() => handleCopy(asset.path, '路径')}
									title="复制路径"
								>
									<span>路径</span>
								</button>
								<button
									type="button"
									className="admin-btn btn-ghost btn-sm"
									style={{ flex: 1, height: 24, padding: '0 4px', fontSize: 11 }}
									onClick={() => handleCopy(`![](${asset.path})`, 'Markdown 语法')}
									title="复制 Markdown"
								>
									<span>MD</span>
								</button>
								<button
									type="button"
									className="admin-btn btn-ghost btn-sm"
									onClick={() => setRefTarget(asset)}
									title="查看博文引用"
									style={{ height: 24, padding: '0 6px' }}
								>
									<Icon icon="tabler:file-search" />
								</button>
								<button
									type="button"
									className="admin-btn btn-danger btn-sm"
									onClick={() => setDeleteTarget(asset)}
									title="删除"
									style={{ height: 24, padding: '0 6px' }}
								>
									<Icon icon="tabler:trash" />
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* 删除确认弹窗 */}
			{deleteTarget && (
				<div className="admin-modal-overlay">
					<div className="admin-modal-box" style={{ maxWidth: 380 }}>
						<div className="modal-header">
							<div className="modal-title">删除确认</div>
						</div>
						<div className="modal-body">
							确定要删除资产文件 <strong>{deleteTarget.name}</strong> 吗？
						</div>
						<div className="modal-footer">
							<button type="button" className="admin-btn btn-secondary btn-sm" onClick={() => setDeleteTarget(null)}>
								取消
							</button>
							<button type="button" className="admin-btn btn-danger btn-sm" onClick={confirmDelete}>
								确认删除
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 反向引用扫描弹窗 */}
			{refTarget && (
				<AssetRefModal
					asset={refTarget}
					onClose={() => setRefTarget(null)}
					onNavigatePost={onNavigatePost}
				/>
			)}

			{/* 大图预览画廊 */}
			{previewTarget && (
				<div className="admin-modal-overlay" onClick={() => setPreviewTarget(null)}>
					<div
						className="admin-modal-box"
						style={{ maxWidth: 800, background: 'var(--admin-surface)' }}
						onClick={e => e.stopPropagation()}
					>
						<div className="modal-header">
							<div className="modal-title">{previewTarget.name}</div>
							<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => setPreviewTarget(null)}>
								<Icon icon="tabler:x" />
							</button>
						</div>
						<div className="modal-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
							<img
								src={previewTarget.path}
								alt={previewTarget.name}
								style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: 4 }}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default AssetManagerView

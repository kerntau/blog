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
	const [filterType, setFilterType] = useState<'all' | 'image' | 'svg' | 'media' | 'font' | 'doc'>('all')
	const [sortBy, setSortBy] = useState<'time' | 'size' | 'name'>('time')

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
			showToast(`加载媒体资源失败: ${err.message}`, 'error')
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
						showToast(`成功上传 ${uploadedCount} 个媒体文件`, 'success')
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
			showToast('媒体文件已删除', 'success')
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

	const isImage = (p: string) => /\.(?:png|jpe?g|gif|webp|ico)$/i.test(p)
	const isSvg = (p: string) => /\.svg$/i.test(p)
	const isMedia = (p: string) => /\.(?:mp4|webm|mp3|wav|ogg|flac)$/i.test(p)

	const filtered = assets
		.filter((a) => {
			if (filterType === 'image') return isImage(a.name)
			if (filterType === 'svg') return isSvg(a.name)
			if (filterType === 'media') return isMedia(a.name)
			if (filterType === 'font') return /\.(?:woff2?|ttf|otf|eot)$/i.test(a.name)
			if (filterType === 'doc') return /\.(?:md|json|xml|txt|pdf)$/i.test(a.name)
			return true
		})
		.filter(a =>
			a.name.toLowerCase().includes(search.toLowerCase())
			|| a.path.toLowerCase().includes(search.toLowerCase()),
		)
		.sort((a, b) => {
			if (sortBy === 'size') return (b.size || 0) - (a.size || 0)
			if (sortBy === 'name') return a.name.localeCompare(b.name)
			return (b.mtime || '').localeCompare(a.mtime || '')
		})

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
			{/* 顶部工具卡片 */}
			<div className="admin-card" style={{ padding: '14px 18px' }}>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
					<div>
						<div style={{ fontSize: 15, fontWeight: 700, color: 'var(--admin-text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
							<Icon icon="tabler:photo" style={{ color: 'var(--admin-accent)', fontSize: 18 }} />
							<span>媒体资源 (Media & Assets)</span>
						</div>
						<div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 2 }}>
							管理 public/ 目录下的静态图片与媒体文件，支持类型筛选与博文反向引用安全扫描
						</div>
					</div>

					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<button
							type="button"
							className="admin-btn btn-secondary btn-sm"
							onClick={loadAssets}
							disabled={loading}
						>
							<Icon icon="tabler:refresh" />
							<span>刷新</span>
						</button>
						<label className="admin-btn btn-primary btn-sm" style={{ cursor: 'pointer', padding: '6px 14px' }}>
							<Icon icon="tabler:upload" />
							<span>上传媒体文件</span>
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

			{/* 搜索、格式分类与排序 */}
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
				<div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
					<div style={{ position: 'relative', width: 220 }}>
						<input
							type="text"
							className="admin-input"
							placeholder="搜索文件名 / 路径..."
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
						{[
							{ id: 'all', name: '全部' },
							{ id: 'image', name: '图片' },
							{ id: 'svg', name: 'SVG' },
							{ id: 'media', name: '音视频' },
							{ id: 'font', name: '字体' },
							{ id: 'doc', name: '文档' },
						].map(tab => (
							<button
								key={tab.id}
								type="button"
								className={`admin-btn ${filterType === tab.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}
								onClick={() => setFilterType(tab.id as any)}
								style={{ height: 24, padding: '0 8px', fontSize: 11 }}
							>
								{tab.name}
							</button>
						))}
					</div>
				</div>

				<div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--admin-text-3)' }}>
					<span>排序:</span>
					<select
						className="admin-select"
						value={sortBy}
						onChange={e => setSortBy(e.target.value as any)}
						style={{ height: 26, fontSize: 11, padding: '0 6px' }}
					>
						<option value="time">按修改时间</option>
						<option value="size">按文件大小</option>
						<option value="name">按文件名</option>
					</select>
					<span style={{ marginLeft: 6 }}>共 {filtered.length} 个资源</span>
				</div>
			</div>

			{/* 媒体卡片网格 */}
			{loading ? (
				<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
					<Icon icon="tabler:loader-2" style={{ fontSize: 24, color: 'var(--admin-text-3)', animation: 'spin 1s linear infinite' }} />
				</div>
			) : filtered.length === 0 ? (
				<div className="admin-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--admin-text-3)' }}>
					暂无匹配的媒体文件
				</div>
			) : (
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12 }}>
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
									height: 120,
									borderRadius: 6,
									background: 'var(--admin-bg-subtle)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									overflow: 'hidden',
									border: '1px solid var(--admin-border)',
									cursor: (isImage(asset.name) || isSvg(asset.name)) ? 'pointer' : 'default',
								}}
								onClick={() => (isImage(asset.name) || isSvg(asset.name)) && setPreviewTarget(asset)}
								title="点击放大预览"
							>
								{isImage(asset.name) || isSvg(asset.name) ? (
									<img
										src={asset.path}
										alt={asset.name}
										style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
									/>
								) : isMedia(asset.name) ? (
									<Icon icon="tabler:video" style={{ fontSize: 40, color: 'var(--admin-accent)' }} />
								) : (
									<Icon icon="tabler:file" style={{ fontSize: 40, color: 'var(--admin-text-3)' }} />
								)}
							</div>

							<div>
								<div
									style={{
										fontSize: 12,
										fontWeight: 600,
										color: 'var(--admin-text-1)',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap',
									}}
									title={asset.name}
								>
									{asset.name}
								</div>
								<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--admin-text-3)', marginTop: 4 }}>
									<span>{formatSize(asset.size)}</span>
									<span>{asset.mtime ? new Date(asset.mtime).toLocaleDateString() : ''}</span>
								</div>
							</div>

							<div style={{ display: 'flex', gap: 4, borderTop: '1px solid var(--admin-border)', paddingTop: 6 }}>
								<button
									type="button"
									className="admin-btn btn-ghost btn-sm"
									style={{ flex: 1, padding: '2px 4px', fontSize: 11 }}
									onClick={() => handleCopy(asset.path, '路径')}
									title="复制相对路径"
								>
									<Icon icon="tabler:link" />
									<span>路径</span>
								</button>
								<button
									type="button"
									className="admin-btn btn-ghost btn-sm"
									style={{ flex: 1, padding: '2px 4px', fontSize: 11 }}
									onClick={() => handleCopy(`![${asset.name}](${asset.path})`, 'Markdown 引用')}
									title="复制 Markdown 图片语法"
								>
									<Icon icon="tabler:markdown" />
									<span>MD</span>
								</button>
								<button
									type="button"
									className="admin-btn btn-ghost btn-sm"
									style={{ padding: '2px 6px' }}
									onClick={() => setRefTarget(asset)}
									title="反向扫描哪些博文引用了此资源"
								>
									<Icon icon="tabler:scan" />
								</button>
								<button
									type="button"
									className="admin-btn btn-ghost btn-sm"
									style={{ color: 'var(--admin-danger)', padding: '2px 6px' }}
									onClick={() => setDeleteTarget(asset)}
									title="删除资源"
								>
									<Icon icon="tabler:trash" />
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* 图片大图预览弹窗 */}
			{previewTarget && (
				<div className="admin-modal-overlay" onClick={() => setPreviewTarget(null)}>
					<div
						className="admin-modal-box"
						style={{ maxWidth: '85vw', maxHeight: '85vh', padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
						onClick={e => e.stopPropagation()}
					>
						<div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 10 }}>
							<div style={{ fontWeight: 600, fontSize: 14 }}>{previewTarget.name}</div>
							<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => setPreviewTarget(null)}>
								<Icon icon="tabler:x" />
							</button>
						</div>
						<div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
							<img
								src={previewTarget.path}
								alt={previewTarget.name}
								style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 6 }}
							/>
						</div>
					</div>
				</div>
			)}

			{/* 删除确认弹窗 */}
			{deleteTarget && (
				<div className="admin-modal-overlay">
					<div className="admin-modal-box" style={{ maxWidth: 400 }}>
						<div className="modal-header">
							<div className="modal-title" style={{ color: 'var(--admin-danger)' }}>确认删除媒体资源</div>
							<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => setDeleteTarget(null)}>
								<Icon icon="tabler:x" />
							</button>
						</div>
						<div style={{ padding: '16px 20px', fontSize: 13, color: 'var(--admin-text-2)' }}>
							确定要删除 <code>{deleteTarget.name}</code> 吗？此操作不可逆。
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

			{/* 博文反向引用扫描弹窗 */}
			{refTarget && (
				<AssetRefModal
					asset={refTarget}
					onClose={() => setRefTarget(null)}
					onNavigatePost={onNavigatePost}
				/>
			)}
		</div>
	)
}

export default AssetManagerView

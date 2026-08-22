import React, { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import type { PostMeta } from '../types'
import { useToast } from '../components/Toast'

interface PostListViewProps {
	onEditPost: (path: string) => void
	onNewPost: () => void
}

export const PostListView: React.FC<PostListViewProps> = ({ onEditPost, onNewPost }) => {
	const { showToast } = useToast()
	const [posts, setPosts] = useState<PostMeta[]>([])
	const [loading, setLoading] = useState(true)
	const [search, setSearch] = useState('')
	const [selectedCategory, setSelectedCategory] = useState('')
	const [selectedYear, setSelectedYear] = useState('')
	const [sortBy, setSortBy] = useState<'date' | 'updated' | 'title' | 'wordCount'>('date')
	const [deleteTarget, setDeleteTarget] = useState<PostMeta | null>(null)

	// 批量选择
	const [selectedPaths, setSelectedPaths] = useState<string[]>([])
	const [batchCategory, setBatchCategory] = useState('')
	const [showBatchCategoryModal, setShowBatchCategoryModal] = useState(false)
	const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false)
	const [batchProcessing, setBatchProcessing] = useState(false)

	const loadPosts = async () => {
		setLoading(true)
		try {
			const data = await adminApi.getPosts()
			setPosts(data)
			setSelectedPaths([])
		}
		catch (err: any) {
			showToast(`加载文章列表失败: ${err.message}`, 'error')
		}
		finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadPosts()
	}, [])

	const confirmDelete = async () => {
		if (!deleteTarget) return
		try {
			await adminApi.deletePost(deleteTarget.path)
			setPosts(posts.filter(p => p.path !== deleteTarget.path))
			setSelectedPaths(selectedPaths.filter(p => p !== deleteTarget.path))
			showToast(`文章《${deleteTarget.title}》已删除`, 'success')
		}
		catch (err: any) {
			showToast(`删除失败: ${err.message}`, 'error')
		}
		finally {
			setDeleteTarget(null)
		}
	}

	const handleBatchChangeCategory = async () => {
		if (!batchCategory) return
		setBatchProcessing(true)
		try {
			await adminApi.batchPosts({
				action: 'category',
				paths: selectedPaths,
				category: batchCategory,
			})
			showToast(`已批量更新 ${selectedPaths.length} 篇文章分类`, 'success')
			setShowBatchCategoryModal(false)
			await loadPosts()
		}
		catch (err: any) {
			showToast(`批量修改分类失败: ${err.message}`, 'error')
		}
		finally {
			setBatchProcessing(false)
		}
	}

	const handleBatchToggleDraft = async (draftState: boolean) => {
		setBatchProcessing(true)
		try {
			await adminApi.batchPosts({
				action: 'draft',
				paths: selectedPaths,
				draft: draftState,
			})
			showToast(`已批量更新状态为【${draftState ? '草稿' : '已发布'}】`, 'success')
			await loadPosts()
		}
		catch (err: any) {
			showToast(`批量更新失败: ${err.message}`, 'error')
		}
		finally {
			setBatchProcessing(false)
		}
	}

	const handleBatchDelete = async () => {
		setBatchProcessing(true)
		try {
			await adminApi.batchPosts({
				action: 'delete',
				paths: selectedPaths,
			})
			showToast(`已批量删除 ${selectedPaths.length} 篇文章`, 'success')
			setShowBatchDeleteModal(false)
			await loadPosts()
		}
		catch (err: any) {
			showToast(`批量删除失败: ${err.message}`, 'error')
		}
		finally {
			setBatchProcessing(false)
		}
	}

	const handleOpenVsCode = async (post: PostMeta) => {
		try {
			await adminApi.openVsCode(post.path)
			showToast('已在 VS Code 中打开', 'success')
		}
		catch (err: any) {
			showToast(err.message, 'error')
		}
	}

	const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')

	const categories = Array.from(new Set(posts.flatMap(p => p.categories || []))).filter(Boolean)
	const years = Array.from(new Set(posts.map(p => p.date?.slice(0, 4)).filter(Boolean))).sort().reverse()

	const filteredPosts = posts
		.filter((p) => {
			if (statusFilter === 'published' && p.draft) return false
			if (statusFilter === 'draft' && !p.draft) return false
			if (search) {
				const q = search.toLowerCase()
				const matchTitle = p.title.toLowerCase().includes(q)
				const matchSlug = p.slug.toLowerCase().includes(q)
				const matchDesc = (p.description || '').toLowerCase().includes(q)
				const matchTag = (p.tags || []).some(t => t.toLowerCase().includes(q))
				if (!matchTitle && !matchSlug && !matchDesc && !matchTag) return false
			}
			if (selectedCategory && !(p.categories || []).includes(selectedCategory)) {
				return false
			}
			if (selectedYear && !p.date?.startsWith(selectedYear)) {
				return false
			}
			return true
		})
		.sort((a, b) => {
			if (sortBy === 'date') return (b.date || '').localeCompare(a.date || '')
			if (sortBy === 'updated') return (b.updated || '').localeCompare(a.updated || '')
			if (sortBy === 'title') return a.title.localeCompare(b.title)
			if (sortBy === 'wordCount') return b.wordCount - a.wordCount
			return 0
		})

	const handleCopyPath = (relPath: string) => {
		navigator.clipboard.writeText(relPath)
		showToast(`已复制路径: ${relPath}`, 'info')
	}

	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			setSelectedPaths(filteredPosts.map(p => p.path))
		}
		else {
			setSelectedPaths([])
		}
	}

	const handleToggleSelect = (path: string) => {
		if (selectedPaths.includes(path)) {
			setSelectedPaths(selectedPaths.filter(p => p !== path))
		}
		else {
			setSelectedPaths([...selectedPaths, path])
		}
	}

	const isAllSelected = filteredPosts.length > 0 && selectedPaths.length === filteredPosts.length

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
			{/* 顶部搜索与过滤条 */}
			<div className="admin-card" style={{ padding: '12px 16px' }}>
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
					{/* 搜索框 */}
					<div style={{ position: 'relative', minWidth: 240, flex: 1 }}>
						<input
							type="text"
							className="admin-input"
							placeholder="搜索标题、Slug、摘要、标签..."
							value={search}
							onChange={e => setSearch(e.target.value)}
							style={{ paddingLeft: 32 }}
						/>
						<Icon
							icon="tabler:search"
							style={{ position: 'absolute', left: 10, top: 9, color: 'var(--admin-text-3)', fontSize: 14 }}
						/>
					</div>

					{/* 筛选与排序 */}
					<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
						{/* 状态快捷胶囊 */}
						<div style={{ display: 'flex', background: 'var(--admin-bg-subtle)', padding: 2, borderRadius: 6, border: '1px solid var(--admin-border)', gap: 2 }}>
							<button
								type="button"
								className={`admin-btn ${statusFilter === 'all' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
								onClick={() => setStatusFilter('all')}
								style={{ height: 24, fontSize: 11, padding: '0 8px' }}
							>
								全部 ({posts.length})
							</button>
							<button
								type="button"
								className={`admin-btn ${statusFilter === 'published' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
								onClick={() => setStatusFilter('published')}
								style={{ height: 24, fontSize: 11, padding: '0 8px' }}
							>
								已发布 ({posts.filter(p => !p.draft).length})
							</button>
							<button
								type="button"
								className={`admin-btn ${statusFilter === 'draft' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
								onClick={() => setStatusFilter('draft')}
								style={{ height: 24, fontSize: 11, padding: '0 8px' }}
							>
								草稿 ({posts.filter(p => p.draft).length})
							</button>
						</div>

						<select
							className="admin-select"
							value={selectedCategory}
							onChange={e => setSelectedCategory(e.target.value)}
							style={{ width: 'auto', minWidth: 110 }}
						>
							<option value="">全部分类 ({categories.length})</option>
							{categories.map(c => (
								<option key={c} value={c}>{c}</option>
							))}
						</select>

						<select
							className="admin-select"
							value={selectedYear}
							onChange={e => setSelectedYear(e.target.value)}
							style={{ width: 'auto', minWidth: 90 }}
						>
							<option value="">全部年份</option>
							{years.map(y => (
								<option key={y} value={y}>{y} 年</option>
							))}
						</select>

						<select
							className="admin-select"
							value={sortBy}
							onChange={e => setSortBy(e.target.value as any)}
							style={{ width: 'auto', minWidth: 120 }}
						>
							<option value="date">按发布日期</option>
							<option value="updated">按更新日期</option>
							<option value="wordCount">按文章字数</option>
							<option value="title">按标题排序</option>
						</select>

						<button type="button" className="admin-btn btn-primary btn-sm" onClick={onNewPost}>
							<Icon icon="tabler:plus" />
							<span>新建文章</span>
						</button>
					</div>
				</div>
			</div>

			{/* 批量操作浮动栏 */}
			{selectedPaths.length > 0 && (
				<div
					className="admin-card"
					style={{
						padding: '8px 16px',
						background: 'var(--admin-accent-soft)',
						borderColor: 'var(--admin-accent)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						flexWrap: 'wrap',
						gap: 8,
					}}
				>
					<div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-accent)' }}>
						已选择 {selectedPaths.length} 篇文章
					</div>

					<div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
						<button
							type="button"
							className="admin-btn btn-secondary btn-sm"
							onClick={() => setShowBatchCategoryModal(true)}
							disabled={batchProcessing}
						>
							<span>修改分类</span>
						</button>
						<button
							type="button"
							className="admin-btn btn-secondary btn-sm"
							onClick={() => handleBatchToggleDraft(false)}
							disabled={batchProcessing}
						>
							<span>发布</span>
						</button>
						<button
							type="button"
							className="admin-btn btn-secondary btn-sm"
							onClick={() => handleBatchToggleDraft(true)}
							disabled={batchProcessing}
						>
							<span>设为草稿</span>
						</button>
						<button
							type="button"
							className="admin-btn btn-danger btn-sm"
							onClick={() => setShowBatchDeleteModal(true)}
							disabled={batchProcessing}
						>
							<span>批量删除</span>
						</button>
						<button
							type="button"
							className="admin-btn btn-ghost btn-sm"
							onClick={() => setSelectedPaths([])}
						>
							<span>取消</span>
						</button>
					</div>
				</div>
			)}

			{/* 列表头部 */}
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', fontSize: 12, color: 'var(--admin-text-3)' }}>
				<label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
					<input
						type="checkbox"
						checked={isAllSelected}
						onChange={e => handleSelectAll(e.target.checked)}
						style={{ cursor: 'pointer' }}
					/>
					<span>全选当前 ({filteredPosts.length})</span>
				</label>
				<button type="button" className="admin-btn btn-ghost btn-sm" onClick={loadPosts} style={{ height: 24 }}>
					<Icon icon="tabler:refresh" />
					<span>刷新</span>
				</button>
			</div>

			{/* 文章数据列表 */}
			{loading ? (
				<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
					<Icon icon="tabler:loader-2" style={{ fontSize: 24, color: 'var(--admin-text-3)', animation: 'spin 1s linear infinite' }} />
				</div>
			) : filteredPosts.length === 0 ? (
				<div className="admin-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--admin-text-3)' }}>
					未找到匹配的文章
				</div>
			) : (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
					{filteredPosts.map(post => (
						<div
							key={post.path}
							className="admin-card interactive"
							style={{
								padding: '14px 16px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: 12,
								borderColor: selectedPaths.includes(post.path) ? 'var(--admin-accent)' : undefined,
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
								<input
									type="checkbox"
									checked={selectedPaths.includes(post.path)}
									onChange={() => handleToggleSelect(post.path)}
									style={{ cursor: 'pointer', width: 15, height: 15, flexShrink: 0 }}
								/>

								<div style={{ flex: 1, minWidth: 0 }}>
									<div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
										{post.draft ? (
											<span className="admin-badge badge-warning">草稿</span>
										) : (
											<span className="admin-badge badge-success">已发布</span>
										)}
										{post.categories?.map(c => (
											<span key={c} className="admin-badge badge-primary">{c}</span>
										))}
										<span style={{ fontSize: 11, color: 'var(--admin-text-3)', fontFamily: 'var(--admin-font-mono)' }}>
											{post.relativePath}
										</span>
									</div>

									<div
										style={{
											fontSize: 14,
											fontWeight: 600,
											color: 'var(--admin-text-1)',
											cursor: 'pointer',
											lineHeight: 1.4,
										}}
										onClick={() => onEditPost(post.path)}
									>
										{post.title}
									</div>

									{post.description && (
										<div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
											{post.description}
										</div>
									)}

									<div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, color: 'var(--admin-text-3)', marginTop: 6 }}>
										<span>{post.date || '未设置日期'}</span>
										<span>{post.wordCount.toLocaleString()} 字</span>
										<span>约 {post.readingMinutes} 分钟</span>
									</div>
								</div>
							</div>

							<div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
								<button
									type="button"
									className="admin-btn btn-ghost btn-sm"
									title="复制相对路径"
									onClick={() => handleCopyPath(post.relativePath)}
								>
									<Icon icon="tabler:copy" style={{ fontSize: 14 }} />
								</button>

								<button
									type="button"
									className="admin-btn btn-secondary btn-sm"
									title="在 VS Code 中打开"
									onClick={() => handleOpenVsCode(post)}
								>
									<Icon icon="tabler:brand-vscode" style={{ fontSize: 15 }} />
								</button>

								<button
									type="button"
									className="admin-btn btn-primary btn-sm"
									onClick={() => onEditPost(post.path)}
								>
									<span>编辑</span>
								</button>

								<button
									type="button"
									className="admin-btn btn-danger btn-sm"
									onClick={() => setDeleteTarget(post)}
									title="删除"
								>
									<Icon icon="tabler:trash" />
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* 删除确认模态框 */}
			{deleteTarget && (
				<div className="admin-modal-overlay">
					<div className="admin-modal-box" style={{ maxWidth: 400 }}>
						<div className="modal-header">
							<div className="modal-title">删除确认</div>
						</div>
						<div className="modal-body">
							确定要删除文章 <strong>《{deleteTarget.title}》</strong> 吗？
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

			{/* 批量修改分类模态框 */}
			{showBatchCategoryModal && (
				<div className="admin-modal-overlay">
					<div className="admin-modal-box" style={{ maxWidth: 420 }}>
						<div className="modal-header">
							<div className="modal-title">批量修改分类 ({selectedPaths.length} 篇)</div>
						</div>
						<div className="modal-body">
							<label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 6 }}>
								选择目标分类：
							</label>
							<select
								className="admin-select"
								value={batchCategory}
								onChange={e => setBatchCategory(e.target.value)}
							>
								<option value="">-- 请选择 --</option>
								<option value="前端开发">前端开发</option>
								<option value="后端开发">后端开发</option>
								<option value="数据库系统">数据库系统</option>
								<option value="云原生与运维">云原生与运维</option>
								<option value="网络安全">网络安全</option>
								<option value="人工智能">人工智能</option>
								<option value="技术">技术</option>
								<option value="杂谈">杂谈</option>
								<option value="生活">生活</option>
							</select>
						</div>
						<div className="modal-footer">
							<button type="button" className="admin-btn btn-secondary btn-sm" onClick={() => setShowBatchCategoryModal(false)}>
								取消
							</button>
							<button type="button" className="admin-btn btn-primary btn-sm" onClick={handleBatchChangeCategory} disabled={batchProcessing || !batchCategory}>
								确认修改
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 批量删除模态框 */}
			{showBatchDeleteModal && (
				<div className="admin-modal-overlay">
					<div className="admin-modal-box" style={{ maxWidth: 400 }}>
						<div className="modal-header">
							<div className="modal-title">批量删除确认</div>
						</div>
						<div className="modal-body">
							确定要删除已选中的 <strong>{selectedPaths.length}</strong> 篇文章吗？此操作不可恢复。
						</div>
						<div className="modal-footer">
							<button type="button" className="admin-btn btn-secondary btn-sm" onClick={() => setShowBatchDeleteModal(false)}>
								取消
							</button>
							<button type="button" className="admin-btn btn-danger btn-sm" onClick={handleBatchDelete} disabled={batchProcessing}>
								确认全部删除
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default PostListView

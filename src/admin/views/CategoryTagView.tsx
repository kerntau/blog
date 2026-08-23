import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import type { CategoryItem, TagItem } from '../types'
import { IconPickerModal } from '../components/IconPickerModal'
import { useToast } from '../components/Toast'

export const CategoryTagView: React.FC = () => {
	const { showToast } = useToast()
	const [activeTab, setActiveTab] = useState<'categories' | 'tags'>('categories')
	const [categories, setCategories] = useState<CategoryItem[]>([])
	const [tags, setTags] = useState<TagItem[]>([])
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)

	// 分类编辑/新增状态
	const [showCategoryModal, setShowCategoryModal] = useState(false)
	const [editingCategoryIdx, setEditingCategoryIdx] = useState<number | null>(null)
	const [catName, setCatName] = useState('')
	const [catIcon, setCatIcon] = useState('tabler:folder')
	const [catColor, setCatColor] = useState('#33aaff')

	// 标签重命名状态
	const [showTagModal, setShowTagModal] = useState(false)
	const [renamingTag, setRenamingTag] = useState('')
	const [newTagName, setNewTagName] = useState('')

	// 图标选择弹窗
	const [showIconPicker, setShowIconPicker] = useState(false)

	const loadData = async () => {
		setLoading(true)
		try {
			const [cats, tagList] = await Promise.all([
				adminApi.getCategories(),
				adminApi.getTags(),
			])
			setCategories(cats)
			setTags(tagList)
		}
		catch (err: any) {
			showToast(`加载分类与标签失败: ${err.message}`, 'error')
		}
		finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadData()
	}, [])

	const handleOpenAddCategory = () => {
		setEditingCategoryIdx(null)
		setCatName('')
		setCatIcon('tabler:folder')
		setCatColor('#33aaff')
		setShowCategoryModal(true)
	}

	const handleOpenEditCategory = (idx: number) => {
		const target = categories[idx]
		if (!target) return
		setEditingCategoryIdx(idx)
		setCatName(target.name)
		setCatIcon(target.icon || 'tabler:folder')
		setCatColor(target.color || '#33aaff')
		setShowCategoryModal(true)
	}

	const handleSaveCategoryModal = async () => {
		if (!catName.trim()) {
			showToast('分类名称不能为空', 'warning')
			return
		}

		const nextList = [...categories]
		if (editingCategoryIdx !== null) {
			const old = nextList[editingCategoryIdx]!
			nextList[editingCategoryIdx] = {
				...old,
				name: catName.trim(),
				icon: catIcon,
				color: catColor,
			}
		}
		else {
			nextList.push({
				name: catName.trim(),
				icon: catIcon,
				color: catColor,
				count: 0,
				posts: [],
			})
		}

		setSaving(true)
		try {
			await adminApi.saveCategories(nextList.map(c => ({
				name: c.name,
				icon: c.icon,
				color: c.color,
			})))
			setCategories(nextList)
			setShowCategoryModal(false)
			showToast('分类配置已保存生效', 'success')
		}
		catch (err: any) {
			showToast(`保存失败: ${err.message}`, 'error')
		}
		finally {
			setSaving(false)
		}
	}

	const handleDeleteCategory = async (idx: number) => {
		const target = categories[idx]
		if (!target) return
		if (target.count > 0) {
			showToast(`分类《${target.name}》下仍有 ${target.count} 篇文章，请先调整文章分类后再删除`, 'warning')
			return
		}

		const nextList = categories.filter((_, i) => i !== idx)
		setSaving(true)
		try {
			await adminApi.saveCategories(nextList.map(c => ({
				name: c.name,
				icon: c.icon,
				color: c.color,
			})))
			setCategories(nextList)
			showToast(`已删除分类《${target.name}》`, 'success')
		}
		catch (err: any) {
			showToast(`删除失败: ${err.message}`, 'error')
		}
		finally {
			setSaving(false)
		}
	}

	const handleOpenRenameTag = (tagName: string) => {
		setRenamingTag(tagName)
		setNewTagName(tagName)
		setShowTagModal(true)
	}

	const handleSaveTagRename = async () => {
		if (!newTagName.trim() || newTagName.trim() === renamingTag) {
			setShowTagModal(false)
			return
		}
		setSaving(true)
		try {
			const res = await adminApi.renameTag(renamingTag, newTagName.trim())
			showToast(res.message, 'success')
			setShowTagModal(false)
			loadData()
		}
		catch (err: any) {
			showToast(`重命名失败: ${err.message}`, 'error')
		}
		finally {
			setSaving(false)
		}
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
			{/* 顶栏 */}
			<div className="admin-card" style={{ padding: '14px 18px' }}>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
					<div>
						<div style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text-1)' }}>
							分类与标签治理 (Category & Tag)
						</div>
						<div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 2 }}>
							管理前台分类色彩、专属图标以及文章标签关联
						</div>
					</div>

					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<div style={{ display: 'flex', background: 'var(--admin-bg-subtle)', padding: 2, borderRadius: 6, border: '1px solid var(--admin-border)' }}>
							<button
								type="button"
								className={`admin-btn ${activeTab === 'categories' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
								onClick={() => setActiveTab('categories')}
							>
								<span>分类管理 ({categories.length})</span>
							</button>
							<button
								type="button"
								className={`admin-btn ${activeTab === 'tags' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
								onClick={() => setActiveTab('tags')}
							>
								<span>标签管理 ({tags.length})</span>
							</button>
						</div>

						{activeTab === 'categories' && (
							<button
								type="button"
								className="admin-btn btn-primary btn-sm"
								onClick={handleOpenAddCategory}
							>
								<Icon icon="tabler:plus" />
								<span>新增分类</span>
							</button>
						)}
					</div>
				</div>
			</div>

			{loading ? (
				<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
					<Icon icon="tabler:loader-2" style={{ fontSize: 24, color: 'var(--admin-text-3)', animation: 'spin 1s linear infinite' }} />
				</div>
			) : activeTab === 'categories' ? (
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
					{categories.map((cat, idx) => (
						<div
							key={cat.name}
							className="admin-card interactive"
							style={{
								padding: '16px',
								display: 'flex',
								flexDirection: 'column',
								gap: 12,
								justifyContent: 'space-between',
							}}
						>
							<div>
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
									<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
										<div
											style={{
												width: 36,
												height: 36,
												borderRadius: 8,
												background: `${cat.color}15`,
												color: cat.color,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												fontSize: 20,
												border: `1px solid ${cat.color}30`,
											}}
										>
											<Icon icon={cat.icon || 'tabler:folder'} />
										</div>
										<div>
											<div style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text-1)' }}>
												{cat.name}
											</div>
											<div style={{ fontSize: 11, color: 'var(--admin-text-3)', fontFamily: 'var(--admin-font-mono)' }}>
												{cat.icon} · {cat.color}
											</div>
										</div>
									</div>

									<span className="admin-badge badge-primary">
										{cat.count} 篇文章
									</span>
								</div>

								{/* 前台胶囊效果实时预览 */}
								<div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--admin-bg-subtle)', borderRadius: 6, border: '1px solid var(--admin-border)' }}>
									<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
										<span style={{ fontSize: 10, color: 'var(--admin-text-3)' }}>前台胶囊与导航预览:</span>
										<a
											href={`/categories?category=${encodeURIComponent(cat.name)}`}
											target="_blank"
											rel="noreferrer"
											style={{ fontSize: 10, color: 'var(--admin-accent)', display: 'inline-flex', alignItems: 'center', gap: 2, textDecoration: 'none' }}
										>
											<span>前台查看</span>
											<Icon icon="tabler:arrow-up-right" />
										</a>
									</div>
									<div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
										<a
											href={`/categories?category=${encodeURIComponent(cat.name)}`}
											target="_blank"
											rel="noreferrer"
											style={{
												display: 'inline-flex',
												alignItems: 'center',
												gap: 4,
												padding: '3px 10px',
												borderRadius: 12,
												background: `${cat.color}15`,
												color: cat.color,
												fontSize: 12,
												fontWeight: 500,
												border: `1px solid ${cat.color}40`,
												textDecoration: 'none',
												cursor: 'pointer',
											}}
											title={`点击前往前台《${cat.name}》分类聚合页`}
										>
											<Icon icon={cat.icon || 'tabler:folder'} />
											<span>{cat.name}</span>
										</a>
									</div>
								</div>
							</div>

							<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--admin-border)', paddingTop: 10 }}>
								<span style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>
									{cat.posts.length > 0 ? `最近: ${cat.posts[0]?.title.slice(0, 12)}...` : '暂无博文'}
								</span>

								<div style={{ display: 'flex', gap: 4 }}>
									<a
										href={`/categories?category=${encodeURIComponent(cat.name)}`}
										target="_blank"
										rel="noreferrer"
										className="admin-btn btn-ghost btn-sm"
										title="在新标签页预览此前台分类"
										style={{ textDecoration: 'none', padding: '0 6px' }}
									>
										<Icon icon="tabler:external-link" />
									</a>
									<button
										type="button"
										className="admin-btn btn-secondary btn-sm"
										onClick={() => handleOpenEditCategory(idx)}
									>
										<Icon icon="tabler:edit" />
										<span>编辑</span>
									</button>
									<button
										type="button"
										className="admin-btn btn-danger btn-sm"
										onClick={() => handleDeleteCategory(idx)}
										disabled={cat.count > 0}
										title={cat.count > 0 ? '包含博文时不可删除' : '删除分类'}
									>
										<Icon icon="tabler:trash" />
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			) : (
				/* 标签管理视图 */
				<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
					<div className="admin-card" style={{ padding: '16px 18px' }}>
						<div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--admin-text-1)' }}>
							全站标签矩阵 (共 {tags.length} 个标签)
						</div>
						<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
							{tags.map(t => (
								<div
									key={t.name}
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: 6,
										padding: '6px 12px',
										background: 'var(--admin-surface)',
										border: '1px solid var(--admin-border)',
										borderRadius: 6,
										fontSize: 12,
									}}
								>
									<span style={{ fontWeight: 500, color: 'var(--admin-text-1)' }}>{t.name}</span>
									<span style={{ fontSize: 10, color: 'var(--admin-text-3)', background: 'var(--admin-bg-subtle)', padding: '1px 5px', borderRadius: 4 }}>
										{t.count}
									</span>
									<span
										title="重命名 / 合并标签"
										style={{ display: 'inline-flex', cursor: 'pointer' }}
										onClick={() => handleOpenRenameTag(t.name)}
									>
										<Icon
											icon="tabler:edit"
											style={{ fontSize: 13, color: 'var(--admin-text-3)' }}
										/>
									</span>
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			{/* 新增/编辑分类弹窗 */}
			{showCategoryModal && (
				<div className="admin-modal-overlay">
					<div className="admin-modal-box" style={{ maxWidth: 440 }}>
						<div className="modal-header">
							<div className="modal-title">
								{editingCategoryIdx !== null ? '编辑分类配置' : '新增分类'}
							</div>
							<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => setShowCategoryModal(false)}>
								<Icon icon="tabler:x" />
							</button>
						</div>

						<div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
							<div>
								<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
									分类名称 *
								</label>
								<input
									type="text"
									className="admin-input"
									placeholder="如: 前端开发"
									value={catName}
									onChange={e => setCatName(e.target.value)}
								/>
							</div>

							<div>
								<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
									专属图标
								</label>
								<div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
									<div
										style={{
											width: 32,
											height: 32,
											borderRadius: 6,
											background: 'var(--admin-bg-subtle)',
											border: '1px solid var(--admin-border)',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontSize: 18,
											color: catColor,
										}}
									>
										<Icon icon={catIcon} />
									</div>
									<input
										type="text"
										className="admin-input"
										value={catIcon}
										onChange={e => setCatIcon(e.target.value)}
										style={{ flex: 1 }}
									/>
									<button
										type="button"
										className="admin-btn btn-secondary btn-sm"
										onClick={() => setShowIconPicker(true)}
									>
										<Icon icon="tabler:search" />
										<span>选择图标</span>
									</button>
								</div>
							</div>

							<div>
								<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
									专属主题色
								</label>
								<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
									<input
										type="color"
										value={catColor}
										onChange={e => setCatColor(e.target.value)}
										style={{ width: 36, height: 32, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer', background: 'transparent' }}
									/>
									<input
										type="text"
										className="admin-input"
										value={catColor}
										onChange={e => setCatColor(e.target.value)}
										style={{ flex: 1, fontFamily: 'var(--admin-font-mono)' }}
									/>
								</div>

								{/* 预设设计师色盘 */}
								<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
									{[
										'#33aaff',
										'#10b981',
										'#f59e0b',
										'#ec4899',
										'#8b5cf6',
										'#06b6d4',
										'#6366f1',
										'#14b8a6',
										'#f97316',
										'#e11d48',
										'#84cc16',
										'#64748b',
									].map(hex => (
										<div
											key={hex}
											className={`color-preset-dot ${catColor.toLowerCase() === hex.toLowerCase() ? 'active' : ''}`}
											style={{ backgroundColor: hex }}
											onClick={() => setCatColor(hex)}
											title={hex}
										/>
									))}
								</div>
							</div>
						</div>

						<div className="modal-footer">
							<button type="button" className="admin-btn btn-secondary btn-sm" onClick={() => setShowCategoryModal(false)}>
								取消
							</button>
							<button type="button" className="admin-btn btn-primary btn-sm" onClick={handleSaveCategoryModal} disabled={saving}>
								{saving ? '保存中...' : '确认保存'}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 重命名/合并标签弹窗 */}
			{showTagModal && (
				<div className="admin-modal-overlay">
					<div className="admin-modal-box" style={{ maxWidth: 400 }}>
						<div className="modal-header">
							<div className="modal-title">重命名 / 合并标签</div>
							<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => setShowTagModal(false)}>
								<Icon icon="tabler:x" />
							</button>
						</div>
						<div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
							<div style={{ fontSize: 12, color: 'var(--admin-text-3)' }}>
								原标签名: <strong>{renamingTag}</strong>
							</div>
							<div>
								<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
									新标签名 (若输入已有标签名将自动合并)
								</label>
								<input
									type="text"
									className="admin-input"
									value={newTagName}
									onChange={e => setNewTagName(e.target.value)}
								/>
							</div>
						</div>
						<div className="modal-footer">
							<button type="button" className="admin-btn btn-secondary btn-sm" onClick={() => setShowTagModal(false)}>
								取消
							</button>
							<button type="button" className="admin-btn btn-primary btn-sm" onClick={handleSaveTagRename} disabled={saving}>
								{saving ? '保存中...' : '确认更新'}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 图标挑选器弹窗 */}
			{showIconPicker && (
				<IconPickerModal
					currentIcon={catIcon}
					onSelect={(ic) => setCatIcon(ic)}
					onClose={() => setShowIconPicker(false)}
				/>
			)}
		</div>
	)
}

export default CategoryTagView

import React, { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import type { FeedGroup, FeedItem, SniffResult } from '../types'
import { FeedCheckModal } from '../components/FeedCheckModal'
import { OpmlImportModal } from '../components/OpmlImportModal'
import { useToast } from '../components/Toast'
import FeedCard from '../../components/content/FeedCard'

export const FeedManagerView: React.FC = () => {
	const { showToast } = useToast()
	const [groups, setGroups] = useState<FeedGroup[]>([])
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [selectedGroupIdx, setSelectedGroupIdx] = useState(0)

	const [search, setSearch] = useState('')

	// 嗅探与新增弹窗
	const [showAddModal, setShowAddModal] = useState(false)
	const [sniffUrl, setSniffUrl] = useState('')
	const [sniffing, setSniffing] = useState(false)

	// 新建/编辑友链条目表单
	const [editingItem, setEditingItem] = useState<FeedItem | null>(null)
	const [editingGroupIdx, setEditingGroupIdx] = useState<number>(0)
	const [isEditMode, setIsEditMode] = useState(false)

	// 分组编辑与新建弹窗
	const [showGroupModal, setShowGroupModal] = useState(false)
	const [groupNameInput, setGroupNameInput] = useState('')
	const [groupDescInput, setGroupDescInput] = useState('')
	const [isEditGroupMode, setIsEditGroupMode] = useState(false)

	// 跨组移动
	const [movingItem, setMovingItem] = useState<{ item: FeedItem, sourceGroupIdx: number } | null>(null)
	const [targetGroupIdx, setTargetGroupIdx] = useState<number>(0)

	// 删除目标
	const [deleteTarget, setDeleteTarget] = useState<{ groupIdx: number, itemIndex: number, author: string } | null>(null)

	// 弹窗
	const [showCheckModal, setShowCheckModal] = useState(false)
	const [showOpmlModal, setShowOpmlModal] = useState(false)

	const loadFeeds = async () => {
		setLoading(true)
		try {
			const data = await adminApi.getFeeds()
			setGroups(data)
		}
		catch (err: any) {
			showToast(`加载友链失败: ${err.message}`, 'error')
		}
		finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadFeeds()
	}, [])

	const handleSaveToFile = async () => {
		setSaving(true)
		try {
			await adminApi.saveFeeds(groups)
			showToast('友链配置已安全写回 src/feeds.ts', 'success')
		}
		catch (err: any) {
			showToast(`保存失败: ${err.message}`, 'error')
		}
		finally {
			setSaving(false)
		}
	}

	const handleSniff = async () => {
		if (!sniffUrl.trim()) return
		setSniffing(true)
		try {
			const result: SniffResult = await adminApi.sniffWebsite(sniffUrl.trim())
			if (result.success) {
				setEditingItem({
					author: result.title || '新博友',
					sitenick: result.title || '',
					title: result.title || '',
					desc: result.desc || '',
					link: result.url,
					feed: result.feed || '',
					icon: result.icon || '',
					avatar: result.avatar || '',
					archs: result.archs || [],
					date: new Date().toISOString().slice(0, 10),
				})
				showToast('已智能解析网站元数据', 'success')
			}
			else {
				showToast(`嗅探提示: ${result.error || '未能自动提取，请手动填写'}`, 'warning')
				setEditingItem({
					author: '',
					link: sniffUrl.trim(),
					date: new Date().toISOString().slice(0, 10),
				})
			}
		}
		catch (err: any) {
			showToast(`嗅探异常: ${err.message}`, 'error')
		}
		finally {
			setSniffing(false)
		}
	}

	const handleOpenAddModal = (groupIdx: number) => {
		setEditingGroupIdx(groupIdx)
		setIsEditMode(false)
		setSniffUrl('')
		setEditingItem({
			author: '',
			link: '',
			date: new Date().toISOString().slice(0, 10),
		})
		setShowAddModal(true)
	}

	const handleOpenEditModal = (item: FeedItem, groupIdx: number) => {
		setEditingGroupIdx(groupIdx)
		setIsEditMode(true)
		setEditingItem({ ...item })
		setShowAddModal(true)
	}

	const handleSaveItemModal = () => {
		if (!editingItem || !editingItem.author.trim() || !editingItem.link.trim()) {
			showToast('请填写作者昵称和网站链接', 'warning')
			return
		}

		if (!/^https?:\/\//i.test(editingItem.link)) {
			editingItem.link = `https://${editingItem.link}`
		}

		const nextGroups = [...groups]
		const currentGroup = nextGroups[editingGroupIdx]
		if (!currentGroup) return

		if (isEditMode) {
			currentGroup.entries = currentGroup.entries.map((e) => {
				if (e.id === editingItem.id || (e.link === editingItem.link && e.author === editingItem.author)) {
					return editingItem
				}
				return e
			})
			showToast('已更新友链条目', 'success')
		}
		else {
			currentGroup.entries.unshift({
				...editingItem,
				id: `feed-${Date.now()}`,
			})
			showToast('已添加新友链条目', 'success')
		}

		setGroups(nextGroups)
		setShowAddModal(false)
		setEditingItem(null)
	}

	const confirmDeleteItem = () => {
		if (!deleteTarget) return
		const nextGroups = [...groups]
		nextGroups[deleteTarget.groupIdx]?.entries.splice(deleteTarget.itemIndex, 1)
		setGroups(nextGroups)
		showToast(`已移除友链《${deleteTarget.author}》`, 'success')
		setDeleteTarget(null)
	}

	const handleMoveItem = () => {
		if (!movingItem) return
		const { item, sourceGroupIdx } = movingItem
		if (sourceGroupIdx === targetGroupIdx) {
			setMovingItem(null)
			return
		}

		const nextGroups = [...groups]
		nextGroups[sourceGroupIdx]?.entries.splice(
			nextGroups[sourceGroupIdx]?.entries.findIndex(e => e.link === item.link),
			1,
		)
		nextGroups[targetGroupIdx]?.entries.unshift(item)
		setGroups(nextGroups)
		showToast(`已迁移至【${nextGroups[targetGroupIdx]?.name}】`, 'success')
		setMovingItem(null)
	}

	const handleOpenGroupModal = (isEdit: boolean) => {
		setIsEditGroupMode(isEdit)
		if (isEdit && groups[selectedGroupIdx]) {
			setGroupNameInput(groups[selectedGroupIdx]?.name || '')
			setGroupDescInput(groups[selectedGroupIdx]?.desc || '')
		}
		else {
			setGroupNameInput('')
			setGroupDescInput('')
		}
		setShowGroupModal(true)
	}

	const handleSaveGroupModal = () => {
		if (!groupNameInput.trim()) {
			showToast('分组名称不能为空', 'warning')
			return
		}
		const nextGroups = [...groups]
		if (isEditGroupMode) {
			const g = nextGroups[selectedGroupIdx]
			if (g) {
				g.name = groupNameInput.trim()
				g.desc = groupDescInput.trim()
			}
			showToast('已修改分组信息', 'success')
		}
		else {
			nextGroups.push({
				name: groupNameInput.trim(),
				desc: groupDescInput.trim(),
				entries: [],
			})
			setSelectedGroupIdx(nextGroups.length - 1)
			showToast('已创建新分组', 'success')
		}
		setGroups(nextGroups)
		setShowGroupModal(false)
	}

	const handleDeleteGroup = (idx: number) => {
		const g = groups[idx]
		if (!g) return
		if (g.entries.length > 0) {
			showToast('该分组下仍有友链，请先清空或迁移后再删除', 'warning')
			return
		}
		const nextGroups = groups.filter((_, i) => i !== idx)
		setGroups(nextGroups)
		setSelectedGroupIdx(Math.max(0, idx - 1))
		showToast(`已删除分组【${g.name}】`, 'success')
	}

	const handleMoveGroupOrder = (idx: number, direction: 'up' | 'down') => {
		const targetIdx = direction === 'up' ? idx - 1 : idx + 1
		if (targetIdx < 0 || targetIdx >= groups.length) return
		const nextGroups = [...groups]
		const temp = nextGroups[idx]!
		nextGroups[idx] = nextGroups[targetIdx]!
		nextGroups[targetIdx] = temp
		setGroups(nextGroups)
		setSelectedGroupIdx(targetIdx)
	}

	const handleExportOpml = () => {
		let opmlXml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>友链订阅导出</title>
    <dateCreated>${new Date().toISOString()}</dateCreated>
  </head>
  <body>
`
		for (const g of groups) {
			opmlXml += `    <outline text="${g.name}" title="${g.name}">\n`
			for (const e of g.entries) {
				opmlXml += `      <outline type="rss" text="${e.author}" title="${e.title || e.author}" xmlUrl="${e.feed || ''}" htmlUrl="${e.link}" description="${e.desc || ''}" />\n`
			}
			opmlXml += `    </outline>\n`
		}
		opmlXml += `  </body>\n</opml>`

		const blob = new Blob([opmlXml], { type: 'text/xml' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `friends-${new Date().toISOString().slice(0, 10)}.opml`
		a.click()
		URL.revokeObjectURL(url)
		showToast('OPML 文件已生成并下载', 'success')
	}

	const currentGroup = groups[selectedGroupIdx] || groups[0]
	const allLinks = groups.flatMap(g => g.entries.map(e => e.link).filter(Boolean))

	const filteredEntries = (currentGroup?.entries || []).filter((e) => {
		if (!search.trim()) return true
		const q = search.toLowerCase()
		return (
			e.author.toLowerCase().includes(q)
			|| (e.sitenick || '').toLowerCase().includes(q)
			|| (e.desc || '').toLowerCase().includes(q)
			|| e.link.toLowerCase().includes(q)
			|| (e.archs || []).some(a => a.toLowerCase().includes(q))
		)
	})

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
			{/* 顶部操作条 */}
			<div className="admin-card" style={{ padding: '14px 18px' }}>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
					<div>
						<div style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text-1)' }}>
							友链与订阅源治理
						</div>
						<div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 2 }}>
							共 {groups.length} 个分组、{allLinks.length} 个博友站点订阅源
						</div>
					</div>

					<div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
						<button
							type="button"
							className="admin-btn btn-secondary btn-sm"
							onClick={handleExportOpml}
							title="导出为 OPML 订阅文件"
						>
							<Icon icon="tabler:download" />
							<span>导出 OPML</span>
						</button>

						<button
							type="button"
							className="admin-btn btn-secondary btn-sm"
							onClick={() => setShowOpmlModal(true)}
							title="导入 OPML 文件"
						>
							<Icon icon="tabler:file-import" />
							<span>导入 OPML</span>
						</button>

						<button
							type="button"
							className="admin-btn btn-secondary btn-sm"
							onClick={() => setShowCheckModal(true)}
						>
							<Icon icon="tabler:activity-heartbeat" />
							<span>连通性测试</span>
						</button>

						<button
							type="button"
							className="admin-btn btn-primary btn-sm"
							onClick={handleSaveToFile}
							disabled={saving}
						>
							<Icon icon={saving ? 'tabler:loader-2' : 'tabler:device-floppy'} />
							<span>{saving ? '保存中...' : '保存更改'}</span>
						</button>
					</div>
				</div>
			</div>

			{/* 分组与检索栏 */}
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
				{/* 分组标签页 */}
				<div style={{ display: 'flex', gap: 6, overflowX: 'auto', alignItems: 'center' }}>
					{groups.map((g, idx) => (
						<button
							key={g.name}
							type="button"
							className={`admin-btn ${selectedGroupIdx === idx ? 'btn-primary' : 'btn-secondary'} btn-sm`}
							onClick={() => setSelectedGroupIdx(idx)}
							style={{ padding: '0 12px', flexShrink: 0 }}
						>
							<span>{g.name}</span>
							<span style={{ opacity: 0.7, fontSize: 10, marginLeft: 3 }}>({g.entries.length})</span>
						</button>
					))}

					<button
						type="button"
						className="admin-btn btn-secondary btn-sm"
						onClick={() => handleOpenGroupModal(false)}
						title="新增分组"
					>
						<Icon icon="tabler:plus" />
						<span>新分组</span>
					</button>
				</div>

				{/* 搜索框 */}
				<div style={{ position: 'relative', width: 220 }}>
					<input
						type="text"
						className="admin-input"
						placeholder="搜索作者、网站、架构..."
						value={search}
						onChange={e => setSearch(e.target.value)}
						style={{ paddingLeft: 30, height: 28, fontSize: 12 }}
					/>
					<Icon
						icon="tabler:search"
						style={{ position: 'absolute', left: 9, top: 7, color: 'var(--admin-text-3)', fontSize: 13 }}
					/>
				</div>
			</div>

			{/* 当前分组内容区 */}
			{loading ? (
				<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
					<Icon icon="tabler:loader-2" style={{ fontSize: 24, color: 'var(--admin-text-3)', animation: 'spin 1s linear infinite' }} />
				</div>
			) : currentGroup ? (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', flexWrap: 'wrap', gap: 8 }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							<span style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text-1)' }}>{currentGroup.name}</span>
							{currentGroup.desc && (
								<span style={{ fontSize: 12, color: 'var(--admin-text-3)' }}>
									- {currentGroup.desc}
								</span>
							)}
							<div style={{ display: 'flex', gap: 2 }}>
								<button
									type="button"
									className="admin-btn btn-ghost btn-sm"
									onClick={() => handleOpenGroupModal(true)}
									title="修改分组信息"
									style={{ height: 24, padding: '0 4px' }}
								>
									<Icon icon="tabler:edit" />
								</button>
								<button
									type="button"
									className="admin-btn btn-ghost btn-sm"
									onClick={() => handleMoveGroupOrder(selectedGroupIdx, 'up')}
									disabled={selectedGroupIdx === 0}
									title="前移分组"
									style={{ height: 24, padding: '0 4px' }}
								>
									<Icon icon="tabler:chevron-left" />
								</button>
								<button
									type="button"
									className="admin-btn btn-ghost btn-sm"
									onClick={() => handleMoveGroupOrder(selectedGroupIdx, 'down')}
									disabled={selectedGroupIdx === groups.length - 1}
									title="后移分组"
									style={{ height: 24, padding: '0 4px' }}
								>
									<Icon icon="tabler:chevron-right" />
								</button>
								<button
									type="button"
									className="admin-btn btn-ghost btn-sm"
									onClick={() => handleDeleteGroup(selectedGroupIdx)}
									disabled={currentGroup.entries.length > 0}
									title={currentGroup.entries.length > 0 ? '需先清空友链方可删除分组' : '删除当前空分组'}
									style={{ height: 24, padding: '0 4px', color: currentGroup.entries.length === 0 ? 'var(--admin-danger)' : undefined }}
								>
									<Icon icon="tabler:trash" />
								</button>
							</div>
						</div>

						<button
							type="button"
							className="admin-btn btn-primary btn-sm"
							onClick={() => handleOpenAddModal(selectedGroupIdx)}
						>
							<Icon icon="tabler:plus" />
							<span>添加友链</span>
						</button>
					</div>

					{/* 友链卡片网格 */}
					{filteredEntries.length === 0 ? (
						<div className="admin-card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--admin-text-3)' }}>
							未找到匹配的友链条目
						</div>
					) : (
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
							{filteredEntries.map((entry, entryIdx) => (
								<div
									key={entry.id || entryIdx}
									className="admin-card interactive"
									style={{
										padding: '14px 16px',
										display: 'flex',
										flexDirection: 'column',
										gap: 8,
										justifyContent: 'space-between',
									}}
								>
									<div>
										<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
											{entry.avatar ? (
												<img
													src={entry.avatar}
													alt={entry.author}
													style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover', background: 'var(--admin-bg-subtle)', border: '1px solid var(--admin-border)' }}
													onError={e => (e.currentTarget.style.display = 'none')}
												/>
											) : (
												<div
													style={{
														width: 34,
														height: 34,
														borderRadius: 6,
														background: 'var(--admin-accent-soft)',
														color: 'var(--admin-accent)',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														fontSize: 14,
														fontWeight: 700,
													}}
												>
													{entry.author.slice(0, 1)}
												</div>
											)}

											<div style={{ flex: 1, minWidth: 0 }}>
												<div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
													<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
														{entry.author}
													</span>
													{entry.sitenick && (
														<span style={{ fontSize: 11, color: 'var(--admin-text-3)', fontWeight: 400 }}>
															({entry.sitenick})
														</span>
													)}
												</div>
												<a
													href={entry.link}
													target="_blank"
													rel="noreferrer"
													style={{
														fontSize: 11,
														color: 'var(--admin-accent)',
														textDecoration: 'none',
														display: 'flex',
														alignItems: 'center',
														gap: 3,
														overflow: 'hidden',
														textOverflow: 'ellipsis',
														whiteSpace: 'nowrap',
													}}
												>
													<span>{entry.link}</span>
												</a>
											</div>
										</div>

										{entry.desc && (
											<div style={{ fontSize: 12, color: 'var(--admin-text-2)', margin: '4px 0', lineHeight: 1.4 }}>
												{entry.desc}
											</div>
										)}

										{entry.comment && (
											<div style={{ fontSize: 11, color: 'var(--admin-text-3)', background: 'var(--admin-bg-subtle)', padding: '3px 6px', borderRadius: 4, margin: '4px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
												<Icon icon="tabler:note" style={{ fontSize: 12 }} />
												<span>{entry.comment}</span>
											</div>
										)}

										{entry.archs && entry.archs.length > 0 && (
											<div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
												{entry.archs.map(a => (
													<span key={a} className="admin-badge badge-primary" style={{ fontSize: 10, padding: '1px 5px' }}>
														{a}
													</span>
												))}
											</div>
										)}
									</div>

									<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--admin-border)', paddingTop: 8, marginTop: 4 }}>
										<span style={{ fontSize: 10, color: 'var(--admin-text-3)' }}>
											{entry.date || '未记录日期'}
										</span>

										<div style={{ display: 'flex', gap: 2 }}>
											<button
												type="button"
												className="admin-btn btn-ghost btn-sm"
												onClick={() => {
													setMovingItem({ item: entry, sourceGroupIdx: selectedGroupIdx })
													setTargetGroupIdx(selectedGroupIdx)
												}}
												title="迁移分组"
												style={{ height: 24, padding: '0 4px' }}
											>
												<Icon icon="tabler:folder-share" />
											</button>
											<button
												type="button"
												className="admin-btn btn-ghost btn-sm"
												onClick={() => handleOpenEditModal(entry, selectedGroupIdx)}
												title="编辑"
												style={{ height: 24, padding: '0 4px' }}
											>
												<Icon icon="tabler:edit" />
											</button>
											<button
												type="button"
												className="admin-btn btn-danger btn-sm"
												onClick={() => setDeleteTarget({ groupIdx: selectedGroupIdx, itemIndex: entryIdx, author: entry.author })}
												title="删除"
												style={{ height: 24, padding: '0 4px' }}
											>
												<Icon icon="tabler:trash" />
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			) : null}

			{/* 新增/编辑友链弹窗 */}
			{showAddModal && editingItem && (
				<div className="admin-modal-overlay">
					<div className="admin-modal-box" style={{ maxWidth: 540 }}>
						<div className="modal-header">
							<div className="modal-title">
								{isEditMode ? '编辑友链条目' : '添加新友链 (支持智能元数据嗅探)'}
							</div>
							<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => setShowAddModal(false)}>
								<Icon icon="tabler:x" />
							</button>
						</div>

						<div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
							{!isEditMode && (
								<div style={{ background: 'var(--admin-bg-subtle)', padding: 12, borderRadius: 6, border: '1px solid var(--admin-border)' }}>
									<div style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-2)', marginBottom: 6 }}>
										智能嗅探：输入博友网址自动解析标题、描述与 RSS
									</div>
									<div style={{ display: 'flex', gap: 6 }}>
										<input
											type="text"
											className="admin-input"
											placeholder="https://example.com"
											value={sniffUrl}
											onChange={e => setSniffUrl(e.target.value)}
										/>
										<button
											type="button"
											className="admin-btn btn-primary btn-sm"
											onClick={handleSniff}
											disabled={sniffing}
											style={{ flexShrink: 0 }}
										>
											<Icon icon={sniffing ? 'tabler:loader-2' : 'tabler:scan'} />
											<span>{sniffing ? '嗅探中...' : '智能嗅探'}</span>
										</button>
									</div>
								</div>
							)}

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
								<div>
									<label style={{ fontSize: 11, fontWeight: 500, display: 'block', marginBottom: 3 }}>作者昵称 *</label>
									<input
										type="text"
										className="admin-input"
										value={editingItem.author}
										onChange={e => setEditingItem({ ...editingItem, author: e.target.value })}
									/>
								</div>
								<div>
									<label style={{ fontSize: 11, fontWeight: 500, display: 'block', marginBottom: 3 }}>网站名称 (sitenick)</label>
									<input
										type="text"
										className="admin-input"
										value={editingItem.sitenick || ''}
										onChange={e => setEditingItem({ ...editingItem, sitenick: e.target.value })}
									/>
								</div>
							</div>

							<div>
								<label style={{ fontSize: 11, fontWeight: 500, display: 'block', marginBottom: 3 }}>网站链接 *</label>
								<input
									type="text"
									className="admin-input"
									value={editingItem.link}
									onChange={e => setEditingItem({ ...editingItem, link: e.target.value })}
								/>
							</div>

							<div>
								<label style={{ fontSize: 11, fontWeight: 500, display: 'block', marginBottom: 3 }}>网站简介</label>
								<input
									type="text"
									className="admin-input"
									value={editingItem.desc || ''}
									onChange={e => setEditingItem({ ...editingItem, desc: e.target.value })}
								/>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
								<div>
									<label style={{ fontSize: 11, fontWeight: 500, display: 'block', marginBottom: 3 }}>Feed 订阅地址</label>
									<input
										type="text"
										className="admin-input"
										placeholder="/atom.xml"
										value={editingItem.feed || ''}
										onChange={e => setEditingItem({ ...editingItem, feed: e.target.value })}
									/>
								</div>
								<div>
									<label style={{ fontSize: 11, fontWeight: 500, display: 'block', marginBottom: 3 }}>头像 URL</label>
									<input
										type="text"
										className="admin-input"
										placeholder="https://..."
										value={editingItem.avatar || ''}
										onChange={e => setEditingItem({ ...editingItem, avatar: e.target.value })}
									/>
								</div>
							</div>

							<div>
								<label style={{ fontSize: 11, fontWeight: 500, display: 'block', marginBottom: 3 }}>个人备注</label>
								<input
									type="text"
									className="admin-input"
									placeholder="如：技术博客"
									value={editingItem.comment || ''}
									onChange={e => setEditingItem({ ...editingItem, comment: e.target.value })}
								/>
							</div>

							{/* 前台真实 FeedCard 实时预览 */}
							<div style={{ marginTop: 4, padding: '10px 12px', background: 'var(--admin-bg)', borderRadius: 8, border: '1px solid var(--admin-border)' }}>
								<div style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-3)', marginBottom: 8 }}>前台 FeedCard 实时效果预览:</div>
								<FeedCard
									author={editingItem.author || '新博友'}
									sitenick={editingItem.sitenick}
									title={editingItem.title}
									desc={editingItem.desc}
									link={editingItem.link || 'https://example.com'}
									avatar={editingItem.avatar || ''}
									icon={editingItem.icon || ''}
									feed={editingItem.feed}
									archs={editingItem.archs as any}
									date={editingItem.date || ''}
									comment={editingItem.comment}
								/>
							</div>
						</div>

						<div className="modal-footer">
							<button type="button" className="admin-btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>
								取消
							</button>
							<button type="button" className="admin-btn btn-primary btn-sm" onClick={handleSaveItemModal}>
								确认保存
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 分组新建/修改弹窗 */}
			{showGroupModal && (
				<div className="admin-modal-overlay">
					<div className="admin-modal-box" style={{ maxWidth: 400 }}>
						<div className="modal-header">
							<div className="modal-title">{isEditGroupMode ? '编辑分组信息' : '创建新友链分组'}</div>
						</div>
						<div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
							<div>
								<label style={{ fontSize: 11, fontWeight: 500, display: 'block', marginBottom: 3 }}>分组名称 *</label>
								<input
									type="text"
									className="admin-input"
									placeholder="如：常读博客"
									value={groupNameInput}
									onChange={e => setGroupNameInput(e.target.value)}
								/>
							</div>
							<div>
								<label style={{ fontSize: 11, fontWeight: 500, display: 'block', marginBottom: 3 }}>分组简介 (可选)</label>
								<input
									type="text"
									className="admin-input"
									placeholder="分组说明文字..."
									value={groupDescInput}
									onChange={e => setGroupDescInput(e.target.value)}
								/>
							</div>
						</div>
						<div className="modal-footer">
							<button type="button" className="admin-btn btn-secondary btn-sm" onClick={() => setShowGroupModal(false)}>
								取消
							</button>
							<button type="button" className="admin-btn btn-primary btn-sm" onClick={handleSaveGroupModal}>
								保存
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 跨组迁移弹窗 */}
			{movingItem && (
				<div className="admin-modal-overlay">
					<div className="admin-modal-box" style={{ maxWidth: 400 }}>
						<div className="modal-header">
							<div className="modal-title">迁移友链分组</div>
						</div>
						<div className="modal-body">
							<div style={{ fontSize: 12, marginBottom: 10 }}>
								将友链 <strong>《{movingItem.item.author}》</strong> 迁移至以下目标分组：
							</div>
							<select
								className="admin-select"
								value={targetGroupIdx}
								onChange={e => setTargetGroupIdx(Number(e.target.value))}
							>
								{groups.map((g, idx) => (
									<option key={g.name} value={idx}>{g.name} ({g.entries.length} 个条目)</option>
								))}
							</select>
						</div>
						<div className="modal-footer">
							<button type="button" className="admin-btn btn-secondary btn-sm" onClick={() => setMovingItem(null)}>
								取消
							</button>
							<button type="button" className="admin-btn btn-primary btn-sm" onClick={handleMoveItem}>
								确认移动
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 删除确认弹窗 */}
			{deleteTarget && (
				<div className="admin-modal-overlay">
					<div className="admin-modal-box" style={{ maxWidth: 380 }}>
						<div className="modal-header">
							<div className="modal-title">移除确认</div>
						</div>
						<div className="modal-body">
							确定要从友链列表中移除 <strong>{deleteTarget.author}</strong> 吗？
						</div>
						<div className="modal-footer">
							<button type="button" className="admin-btn btn-secondary btn-sm" onClick={() => setDeleteTarget(null)}>
								取消
							</button>
							<button type="button" className="admin-btn btn-danger btn-sm" onClick={confirmDeleteItem}>
								确认移除
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 连通性测试弹窗 */}
			{showCheckModal && (
				<FeedCheckModal
					links={allLinks}
					onClose={() => setShowCheckModal(false)}
				/>
			)}

			{/* OPML 导入弹窗 */}
			{showOpmlModal && currentGroup && (
				<OpmlImportModal
					targetGroupName={currentGroup.name}
					onImportSuccess={(newEntries) => {
						const nextGroups = [...groups]
						nextGroups[selectedGroupIdx]?.entries.unshift(...newEntries)
						setGroups(nextGroups)
					}}
					onClose={() => setShowOpmlModal(false)}
				/>
			)}
		</div>
	)
}

export default FeedManagerView

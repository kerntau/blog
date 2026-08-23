import React, { useEffect, useState, useMemo } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import type { FeedGroup, FeedItem, SniffResult } from '../types'
import { FeedCheckModal } from '../components/FeedCheckModal'
import { OpmlImportModal } from '../components/OpmlImportModal'
import { useToast } from '../components/Toast'
import FeedCard from '../../components/content/FeedCard'
import { MarkdownPreview } from '../components/MarkdownPreview'
import { getArchIcon, getDomainIcon } from '../../utils/icon'
import { getDomain } from '../../utils/link'

// 常用技术栈预设
const COMMON_ARCHS = [
	'React', 'Vue', 'Next.js', 'Nuxt', 'Astro', 'Svelte',
	'Hexo', 'Hugo', 'VitePress', 'Docusaurus', 'WordPress',
	'Tailwind', 'Rsbuild', 'TypeScript', 'Node.js', 'Rust', 'Go'
]

export const FeedManagerView: React.FC = () => {
	const { showToast } = useToast()
	const [activeTab, setActiveTab] = useState<'friends' | 'myFeed' | 'linkMd'>('friends')

	// 友链博友与分组列表
	const [groups, setGroups] = useState<FeedGroup[]>([])
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [selectedGroupIdx, setSelectedGroupIdx] = useState<number>(0)
	const [search, setSearch] = useState('')
	const [searchAllGroups, setSearchAllGroups] = useState(false)
	const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

	// 本站友链信息 (My Blog Feed)
	const [myFeedData, setMyFeedData] = useState<{
		author: string
		sitenick: string
		title: string
		desc: string
		link: string
		avatar: string
		archs: string[]
		date: string
		comment: string
	}>({
		author: 'kerntau',
		sitenick: '序栈',
		title: 'kerntau',
		desc: '心中有景,花香满径',
		link: 'https://keru.in/',
		avatar: '/avatar.webp',
		archs: ['React', 'Rsbuild'],
		date: '2025-11-10',
		comment: '这是我自己',
	})
	const [myFeedDirty, setMyFeedDirty] = useState(false)
	const [newMyArchInput, setNewMyArchInput] = useState('')

	// 申请说明 (link.md)
	const [linkMdContent, setLinkMdContent] = useState('')
	const [linkMdDirty, setLinkMdDirty] = useState(false)

	// 嗅探与新增弹窗
	const [showAddModal, setShowAddModal] = useState(false)
	const [sniffUrl, setSniffUrl] = useState('')
	const [sniffing, setSniffing] = useState(false)

	// 新建/编辑友链条目表单
	const [editingItem, setEditingItem] = useState<FeedItem | null>(null)
	const [editingGroupIdx, setEditingGroupIdx] = useState<number>(0)
	const [isEditMode, setIsEditMode] = useState(false)
	const [newArchInput, setNewArchInput] = useState('')

	// 分组编辑与新建弹窗
	const [showGroupModal, setShowGroupModal] = useState(false)
	const [isEditGroupMode, setIsEditGroupMode] = useState(false)
	const [groupNameInput, setGroupNameInput] = useState('')
	const [groupDescInput, setGroupDescInput] = useState('')

	// 删除目标
	const [deleteTarget, setDeleteTarget] = useState<{ groupIdx: number, itemIndex: number, author: string } | null>(null)
	const [deleteGroupTarget, setDeleteGroupTarget] = useState<number | null>(null)

	// 弹窗
	const [showCheckModal, setShowCheckModal] = useState(false)
	const [showOpmlModal, setShowOpmlModal] = useState(false)

	const loadAllData = async () => {
		setLoading(true)
		try {
			const [feedsData, myFeedRes, linkMdRes] = await Promise.all([
				adminApi.getFeeds(),
				adminApi.getMyFeed().catch(() => null),
				adminApi.getLinkMd().catch(() => null),
			])
			setGroups(feedsData)
			if (myFeedRes) {
				setMyFeedData(myFeedRes)
				setMyFeedDirty(false)
			}
			if (linkMdRes) {
				setLinkMdContent(linkMdRes.content || '')
				setLinkMdDirty(false)
			}
			setHasUnsavedChanges(false)
		}
		catch (err: any) {
			showToast(`加载友链数据失败: ${err.message}`, 'error')
		}
		finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadAllData()
	}, [])

	// 保存友链博友列表
	const handleSaveFeeds = async () => {
		setSaving(true)
		try {
			await adminApi.saveFeeds(groups)
			setHasUnsavedChanges(false)
			showToast('友链配置已保存生效', 'success')
		}
		catch (err: any) {
			showToast(`保存失败: ${err.message}`, 'error')
		}
		finally {
			setSaving(false)
		}
	}

	// 保存本站友链信息 (myFeed)
	const handleSaveMyFeed = async () => {
		setSaving(true)
		try {
			await adminApi.saveMyFeed(myFeedData)
			setMyFeedDirty(false)
			showToast('本站友链卡片配置已保存！', 'success')
		}
		catch (err: any) {
			showToast(`保存失败: ${err.message}`, 'error')
		}
		finally {
			setSaving(false)
		}
	}

	// 保存申请说明 (link.md)
	const handleSaveLinkMd = async () => {
		setSaving(true)
		try {
			await adminApi.saveLinkMd(linkMdContent)
			setLinkMdDirty(false)
			showToast('友链申请说明已保存生效！', 'success')
		}
		catch (err: any) {
			showToast(`保存失败: ${err.message}`, 'error')
		}
		finally {
			setSaving(false)
		}
	}

	// 智能嗅探网站元数据
	const handleSniff = async () => {
		if (!sniffUrl.trim()) {
			showToast('请输入要嗅探的网站链接', 'warning')
			return
		}
		setSniffing(true)
		try {
			const result: SniffResult = await adminApi.sniffWebsite(sniffUrl.trim())
			if (result.success) {
				setEditingItem(prev => ({
					...prev,
					author: result.title || prev?.author || '博友',
					sitenick: result.title || prev?.sitenick || '',
					title: result.title || prev?.title || '',
					desc: result.desc || prev?.desc || '',
					link: result.url || sniffUrl.trim(),
					feed: result.feed || prev?.feed || '',
					icon: result.icon || prev?.icon || '',
					avatar: result.avatar || prev?.avatar || '',
					archs: (result.archs && result.archs.length > 0) ? result.archs : (prev?.archs || []),
					date: prev?.date || new Date().toISOString().slice(0, 10),
				} as FeedItem))
				showToast('已成功嗅探并自动填入网站元信息！', 'success')
			}
			else {
				showToast(`嗅探提示: ${result.error || '未能完全提取，请手动完善'}`, 'warning')
				setEditingItem(prev => ({
					...prev,
					link: sniffUrl.trim(),
					date: prev?.date || new Date().toISOString().slice(0, 10),
				} as FeedItem))
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
			archs: [],
		})
		setShowAddModal(true)
	}

	const handleOpenEditModal = (item: FeedItem, groupIdx: number) => {
		setEditingGroupIdx(groupIdx)
		setIsEditMode(true)
		setSniffUrl(item.link || '')
		setEditingItem({ ...item, archs: item.archs ? [...item.archs] : [] })
		setShowAddModal(true)
	}

	const handleSaveItemModal = () => {
		if (!editingItem || !editingItem.author.trim() || !editingItem.link.trim()) {
			showToast('请填写作者昵称和网站链接', 'warning')
			return
		}

		let cleanLink = editingItem.link.trim()
		if (!/^https?:\/\//i.test(cleanLink)) {
			cleanLink = `https://${cleanLink}`
		}

		const nextGroups = [...groups]
		const currentGroup = nextGroups[editingGroupIdx]
		if (!currentGroup) return

		const sanitizedItem: FeedItem = {
			...editingItem,
			link: cleanLink,
			author: editingItem.author.trim(),
			sitenick: editingItem.sitenick?.trim() || undefined,
			title: editingItem.title?.trim() || undefined,
			desc: editingItem.desc?.trim() || undefined,
			feed: editingItem.feed?.trim() || undefined,
			avatar: editingItem.avatar?.trim() || undefined,
			icon: editingItem.icon?.trim() || undefined,
			comment: editingItem.comment?.trim() || undefined,
			archs: (editingItem.archs && editingItem.archs.length > 0) ? editingItem.archs : undefined,
		}

		if (isEditMode) {
			currentGroup.entries = currentGroup.entries.map((e) => {
				if (e.id === editingItem.id || (e.link === editingItem.link && e.author === editingItem.author)) {
					return sanitizedItem
				}
				return e
			})
		}
		else {
			const newItem: FeedItem = {
				...sanitizedItem,
				id: editingItem.id || `${cleanLink}-${Date.now().toString(36)}`,
			}
			currentGroup.entries = [...currentGroup.entries, newItem]
		}

		setGroups(nextGroups)
		setHasUnsavedChanges(true)
		setShowAddModal(false)
		showToast(isEditMode ? '已更新条目' : '已添加新友链', 'success')
	}

	const handleConfirmDelete = () => {
		if (!deleteTarget) return
		const nextGroups = [...groups]
		const g = nextGroups[deleteTarget.groupIdx]
		if (g) {
			g.entries = g.entries.filter((_, idx) => idx !== deleteTarget.itemIndex)
			setGroups(nextGroups)
			setHasUnsavedChanges(true)
			showToast(`已删除《${deleteTarget.author}》`, 'success')
		}
		setDeleteTarget(null)
	}

	const handleMoveItemOrder = (groupIdx: number, itemIdx: number, direction: 'up' | 'down') => {
		const nextGroups = [...groups]
		const g = nextGroups[groupIdx]
		if (!g) return
		const targetIdx = direction === 'up' ? itemIdx - 1 : itemIdx + 1
		if (targetIdx < 0 || targetIdx >= g.entries.length) return
		const temp = g.entries[itemIdx]!
		g.entries[itemIdx] = g.entries[targetIdx]!
		g.entries[targetIdx] = temp
		setGroups(nextGroups)
		setHasUnsavedChanges(true)
	}

	const handleSaveGroupModal = () => {
		if (!groupNameInput.trim()) {
			showToast('分组名称不能为空', 'warning')
			return
		}
		const nextGroups = [...groups]
		if (isEditGroupMode) {
			if (nextGroups[selectedGroupIdx]) {
				nextGroups[selectedGroupIdx]!.name = groupNameInput.trim()
				nextGroups[selectedGroupIdx]!.desc = groupDescInput.trim() || undefined
			}
			showToast('已更新分组信息', 'success')
		}
		else {
			nextGroups.push({
				name: groupNameInput.trim(),
				desc: groupDescInput.trim() || undefined,
				entries: [],
			})
			setSelectedGroupIdx(nextGroups.length - 1)
			showToast('已创建新分组', 'success')
		}
		setGroups(nextGroups)
		setHasUnsavedChanges(true)
		setShowGroupModal(false)
	}

	const handleConfirmDeleteGroup = () => {
		if (deleteGroupTarget === null) return
		if (groups.length <= 1) {
			showToast('必须保留至少一个友链分组', 'warning')
			setDeleteGroupTarget(null)
			return
		}
		const nextGroups = groups.filter((_, idx) => idx !== deleteGroupTarget)
		setGroups(nextGroups)
		setSelectedGroupIdx(Math.max(0, deleteGroupTarget - 1))
		setHasUnsavedChanges(true)
		setDeleteGroupTarget(null)
		showToast('分组已删除', 'success')
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
		setHasUnsavedChanges(true)
	}

	// 统计数据
	const totalFriendsCount = useMemo(() => {
		return groups.reduce((acc, g) => acc + (g.entries?.length || 0), 0)
	}, [groups])

	const withFeedCount = useMemo(() => {
		return groups.reduce((acc, g) => acc + (g.entries?.filter(e => Boolean(e.feed))?.length || 0), 0)
	}, [groups])

	const currentGroup = groups[selectedGroupIdx]

	// 检索博友列表
	const displayEntries = useMemo(() => {
		if (searchAllGroups && search.trim()) {
			const q = search.toLowerCase()
			const list: Array<{ item: FeedItem, groupIdx: number, groupName: string, itemIdx: number }> = []
			groups.forEach((g, gIdx) => {
				g.entries.forEach((item, iIdx) => {
					if (
						item.author.toLowerCase().includes(q)
						|| item.title?.toLowerCase().includes(q)
						|| item.desc?.toLowerCase().includes(q)
						|| item.link.toLowerCase().includes(q)
						|| item.comment?.toLowerCase().includes(q)
					) {
						list.push({ item, groupIdx: gIdx, groupName: g.name, itemIdx: iIdx })
					}
				})
			})
			return list
		}

		const currentList = (currentGroup?.entries || []).map((item, iIdx) => ({
			item,
			groupIdx: selectedGroupIdx,
			groupName: currentGroup?.name || '',
			itemIdx: iIdx,
		}))

		if (!search.trim()) return currentList

		const q = search.toLowerCase()
		return currentList.filter(({ item }) =>
			item.author.toLowerCase().includes(q)
			|| item.title?.toLowerCase().includes(q)
			|| item.desc?.toLowerCase().includes(q)
			|| item.link.toLowerCase().includes(q)
			|| item.comment?.toLowerCase().includes(q)
		)
	}, [groups, selectedGroupIdx, currentGroup, search, searchAllGroups])

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', height: 'calc(100vh - 84px)' }}>
			{/* 1. 沉浸式一体化控制栏 (Unified Control Center) */}
			<div
				className="admin-card"
				style={{
					padding: '8px 14px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: 12,
					flexWrap: 'wrap',
					background: 'var(--admin-surface)',
					flexShrink: 0,
				}}
			>
				{/* 模式导航 Tab 组 */}
				<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
					<div className="admin-btn-group" style={{ display: 'flex', border: '1px solid var(--admin-border)', borderRadius: 6, overflow: 'hidden' }}>
						<button
							type="button"
							className={`admin-btn btn-sm ${activeTab === 'friends' ? 'btn-primary' : 'btn-ghost'}`}
							onClick={() => setActiveTab('friends')}
							style={{ borderRadius: 0, height: 28, padding: '0 12px' }}
						>
							<Icon icon="tabler:users" />
							<span>博友管理 ({totalFriendsCount})</span>
						</button>
						<button
							type="button"
							className={`admin-btn btn-sm ${activeTab === 'myFeed' ? 'btn-primary' : 'btn-ghost'}`}
							onClick={() => setActiveTab('myFeed')}
							style={{ borderRadius: 0, height: 28, padding: '0 12px' }}
						>
							<Icon icon="tabler:id-badge-2" />
							<span>本站友链信息</span>
						</button>
						<button
							type="button"
							className={`admin-btn btn-sm ${activeTab === 'linkMd' ? 'btn-primary' : 'btn-ghost'}`}
							onClick={() => setActiveTab('linkMd')}
							style={{ borderRadius: 0, height: 28, padding: '0 12px' }}
						>
							<Icon icon="tabler:file-text" />
							<span>申请说明 (link.md)</span>
						</button>
					</div>

					{(hasUnsavedChanges || myFeedDirty || linkMdDirty) && (
						<span className="admin-badge badge-warning" style={{ fontSize: 10, animation: 'pulseYellow 2s infinite' }}>
							有未保存更改
						</span>
					)}
				</div>

				{/* 快捷全局操作 */}
				<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
					{activeTab === 'friends' && (
						<>
							<button
								type="button"
								className="admin-btn btn-ghost btn-sm"
								onClick={() => setShowCheckModal(true)}
								title="连通性存活体检"
							>
								<Icon icon="tabler:activity-heartbeat" />
								<span>连通性体检</span>
							</button>
							<button
								type="button"
								className="admin-btn btn-ghost btn-sm"
								onClick={() => setShowOpmlModal(true)}
								title="导入 OPML"
							>
								<Icon icon="tabler:file-import" />
								<span>导入 OPML</span>
							</button>
							<button
								type="button"
								className="admin-btn btn-primary btn-sm"
								onClick={handleSaveFeeds}
								disabled={saving}
							>
								{saving ? <Icon icon="tabler:loader-2" style={{ animation: 'spin 1s linear infinite' }} /> : <Icon icon="tabler:device-floppy" />}
								<span>保存博友数据</span>
							</button>
						</>
					)}

					{activeTab === 'myFeed' && (
						<button
							type="button"
							className="admin-btn btn-primary btn-sm"
							onClick={handleSaveMyFeed}
							disabled={saving}
						>
							{saving ? <Icon icon="tabler:loader-2" style={{ animation: 'spin 1s linear infinite' }} /> : <Icon icon="tabler:device-floppy" />}
							<span>保存本站配置</span>
						</button>
					)}

					{activeTab === 'linkMd' && (
						<button
							type="button"
							className="admin-btn btn-primary btn-sm"
							onClick={handleSaveLinkMd}
							disabled={saving}
						>
							{saving ? <Icon icon="tabler:loader-2" style={{ animation: 'spin 1s linear infinite' }} /> : <Icon icon="tabler:device-floppy" />}
							<span>保存说明文档</span>
						</button>
					)}
				</div>
			</div>

			{loading ? (
				<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
					<Icon icon="tabler:loader-2" style={{ fontSize: 28, color: 'var(--admin-accent)', animation: 'spin 1s linear infinite' }} />
				</div>
			) : (
				<>
					{/* ========================================================================= */}
					{/* 模式 1: 博友管理全景工作台 (顺畅双栏布局) */}
					{/* ========================================================================= */}
					{activeTab === 'friends' && (
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: '220px 1fr',
								gap: 10,
								flex: 1,
								minHeight: 0,
							}}
						>
							{/* 左侧：轻量精巧分组导航 */}
							<div
								className="admin-card"
								style={{
									padding: '10px',
									display: 'flex',
									flexDirection: 'column',
									gap: 6,
									background: 'var(--admin-surface)',
									height: '100%',
									overflow: 'hidden',
								}}
							>
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--admin-border)' }}>
									<span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-1)', display: 'flex', alignItems: 'center', gap: 4 }}>
										<Icon icon="tabler:folders" style={{ color: 'var(--admin-accent)' }} />
										分组列表
									</span>
									<button
										type="button"
										className="admin-btn btn-ghost btn-sm"
										onClick={() => {
											setGroupNameInput('')
											setGroupDescInput('')
											setIsEditGroupMode(false)
											setShowGroupModal(true)
										}}
										style={{ padding: '2px 5px', height: 20, fontSize: 11 }}
										title="新建分组"
									>
										<Icon icon="tabler:plus" />
										<span>新建</span>
									</button>
								</div>

								{/* 分组滚动清单 */}
								<div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
									{groups.map((group, idx) => {
										const isSelected = selectedGroupIdx === idx && !searchAllGroups
										return (
											<div
												key={group.name + idx}
												onClick={() => {
													setSelectedGroupIdx(idx)
													setSearchAllGroups(false)
												}}
												style={{
													padding: '7px 8px',
													borderRadius: 5,
													background: isSelected ? 'var(--admin-accent-soft)' : 'transparent',
													color: isSelected ? 'var(--admin-accent)' : 'var(--admin-text-1)',
													fontWeight: isSelected ? 600 : 400,
													cursor: 'pointer',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'space-between',
													fontSize: 12,
													transition: 'all 0.12s ease',
												}}
												className="admin-toc-item"
											>
												<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
													{group.name}
												</span>
												<span
													style={{
														fontSize: 10,
														padding: '1px 5px',
														borderRadius: 10,
														background: isSelected ? 'var(--admin-accent)' : 'var(--admin-bg-subtle)',
														color: isSelected ? '#ffffff' : 'var(--admin-text-3)',
														fontWeight: 600,
													}}
												>
													{group.entries?.length || 0}
												</span>
											</div>
										)
									})}
								</div>

								{/* 当前选中分组快捷控制条 */}
								{currentGroup && (
									<div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
										<div style={{ display: 'flex', gap: 2 }}>
											<button
												type="button"
												className="admin-btn btn-ghost btn-sm"
												onClick={() => handleMoveGroupOrder(selectedGroupIdx, 'up')}
												disabled={selectedGroupIdx === 0}
												title="上移"
												style={{ padding: 2, height: 22 }}
											>
												<Icon icon="tabler:arrow-up" style={{ fontSize: 12 }} />
											</button>
											<button
												type="button"
												className="admin-btn btn-ghost btn-sm"
												onClick={() => handleMoveGroupOrder(selectedGroupIdx, 'down')}
												disabled={selectedGroupIdx === groups.length - 1}
												title="下移"
												style={{ padding: 2, height: 22 }}
											>
												<Icon icon="tabler:arrow-down" style={{ fontSize: 12 }} />
											</button>
										</div>
										<div style={{ display: 'flex', gap: 2 }}>
											<button
												type="button"
												className="admin-btn btn-ghost btn-sm"
												onClick={() => {
													setGroupNameInput(currentGroup.name)
													setGroupDescInput(currentGroup.desc || '')
													setIsEditGroupMode(true)
													setShowGroupModal(true)
												}}
												title="重命名分组"
												style={{ padding: 2, height: 22 }}
											>
												<Icon icon="tabler:edit" style={{ fontSize: 12 }} />
											</button>
											<button
												type="button"
												className="admin-btn btn-ghost btn-sm"
												onClick={() => setDeleteGroupTarget(selectedGroupIdx)}
												disabled={groups.length <= 1}
												title="删除分组"
												style={{ padding: 2, height: 22, color: 'var(--admin-danger)' }}
											>
												<Icon icon="tabler:trash" style={{ fontSize: 12 }} />
											</button>
										</div>
									</div>
								)}
							</div>

							{/* 右侧：博友主展示区 */}
							<div
								className="admin-card"
								style={{
									display: 'flex',
									flexDirection: 'column',
									background: 'var(--admin-surface)',
									height: '100%',
									overflow: 'hidden',
								}}
							>
								{/* 工具搜索栏 */}
								<div
									style={{
										padding: '8px 12px',
										borderBottom: '1px solid var(--admin-border)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										gap: 10,
										flexWrap: 'wrap',
									}}
								>
									{/* 搜索 */}
									<div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
										<div style={{ position: 'relative', width: 220 }}>
											<input
												type="text"
												className="admin-input"
												placeholder={searchAllGroups ? "全库检索博友..." : `搜索 ${currentGroup?.name || ''}...`}
												value={search}
												onChange={e => setSearch(e.target.value)}
												style={{ paddingLeft: 26, height: 26, fontSize: 12 }}
											/>
											<Icon
												icon="tabler:search"
												style={{ position: 'absolute', left: 7, top: 6, color: 'var(--admin-text-4)', fontSize: 13 }}
											/>
										</div>

										<label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--admin-text-3)', cursor: 'pointer' }}>
											<input
												type="checkbox"
												checked={searchAllGroups}
												onChange={e => setSearchAllGroups(e.target.checked)}
											/>
											<span>全库搜索</span>
										</label>

										<span style={{ fontSize: 11.5, color: 'var(--admin-text-3)' }}>
											共 <strong style={{ color: 'var(--admin-text-1)' }}>{displayEntries.length}</strong> 位
										</span>
									</div>

									{/* 视图切换 & 快速新建 */}
									<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
										<div className="admin-btn-group" style={{ display: 'flex', border: '1px solid var(--admin-border)', borderRadius: 5, overflow: 'hidden' }}>
											<button
												type="button"
												className={`admin-btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
												onClick={() => setViewMode('grid')}
												title="网格视图"
												style={{ borderRadius: 0, height: 24, padding: '0 6px' }}
											>
												<Icon icon="tabler:layout-grid" />
											</button>
											<button
												type="button"
												className={`admin-btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
												onClick={() => setViewMode('table')}
												title="表格视图"
												style={{ borderRadius: 0, height: 24, padding: '0 6px' }}
											>
												<Icon icon="tabler:list" />
											</button>
										</div>

										<button
											type="button"
											className="admin-btn btn-primary btn-sm"
											onClick={() => handleOpenAddModal(selectedGroupIdx)}
											style={{ height: 24, padding: '0 8px' }}
										>
											<Icon icon="tabler:plus" />
											<span>添加博友</span>
										</button>
									</div>
								</div>

								{/* 博友卡片流滚动区 */}
								<div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
									{displayEntries.length === 0 ? (
										<div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--admin-text-3)' }}>
											<Icon icon="tabler:user-search" style={{ fontSize: 36, opacity: 0.4, marginBottom: 8 }} />
											<div style={{ fontSize: 13 }}>没有找到匹配的友链博友</div>
											<button
												type="button"
												className="admin-btn btn-secondary btn-sm"
												onClick={() => handleOpenAddModal(selectedGroupIdx)}
												style={{ marginTop: 12 }}
											>
												<Icon icon="tabler:plus" />
												<span>添加第一位博友</span>
											</button>
										</div>
									) : viewMode === 'grid' ? (
										/* 流畅现代网格 */
										<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
											{displayEntries.map(({ item, groupIdx, groupName, itemIdx }) => {
												const domainIcon = getDomainIcon(item.link)
												const domain = getDomain(item.link)

												return (
													<div
														key={item.link + item.author + itemIdx}
														className="admin-card"
														style={{
															padding: '10px 12px',
															display: 'flex',
															flexDirection: 'column',
															gap: 6,
															background: 'var(--admin-bg-subtle)',
															border: '1px solid var(--admin-border)',
															borderRadius: 6,
															position: 'relative',
															transition: 'all 0.15s ease',
														}}
													>
														{/* 头部：头像与名称 */}
														<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
															<div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
																<img
																	src={item.avatar || '/avatar.webp'}
																	alt={item.author}
																	style={{
																		width: 34,
																		height: 34,
																		borderRadius: '50%',
																		objectFit: 'cover',
																		background: 'var(--admin-surface)',
																		border: '1px solid var(--admin-border)',
																		flexShrink: 0,
																	}}
																	onError={e => (e.currentTarget.src = '/avatar.webp')}
																/>

																<div style={{ minWidth: 0 }}>
																	<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
																		<span style={{ fontWeight: 650, fontSize: 12.5, color: 'var(--admin-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
																			{item.author}
																		</span>
																		{item.sitenick && item.sitenick !== item.author && (
																			<span style={{ fontSize: 10.5, color: 'var(--admin-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
																				({item.sitenick})
																			</span>
																		)}
																	</div>

																	<a
																		href={item.link}
																		target="_blank"
																		rel="noreferrer"
																		style={{
																			fontSize: 10.5,
																			color: 'var(--admin-accent)',
																			textDecoration: 'none',
																			display: 'inline-flex',
																			alignItems: 'center',
																			gap: 2,
																			maxWidth: 140,
																			overflow: 'hidden',
																			textOverflow: 'ellipsis',
																			whiteSpace: 'nowrap',
																			marginTop: 1,
																		}}
																		title={item.link}
																	>
																		<span>{domain}</span>
																		{domainIcon ? <Icon icon={domainIcon} style={{ fontSize: 9 }} /> : <Icon icon="tabler:external-link" style={{ fontSize: 9 }} />}
																	</a>
																</div>
															</div>

															{/* 悬浮轻量操作栏 */}
															<div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
																<button
																	type="button"
																	className="admin-btn btn-ghost btn-sm"
																	onClick={() => handleMoveItemOrder(groupIdx, itemIdx, 'up')}
																	disabled={itemIdx === 0}
																	title="上移"
																	style={{ padding: 2, height: 20 }}
																>
																	<Icon icon="tabler:arrow-up" style={{ fontSize: 11 }} />
																</button>
																<button
																	type="button"
																	className="admin-btn btn-ghost btn-sm"
																	onClick={() => handleMoveItemOrder(groupIdx, itemIdx, 'down')}
																	disabled={itemIdx === (groups[groupIdx]?.entries.length || 0) - 1}
																	title="下移"
																	style={{ padding: 2, height: 20 }}
																>
																	<Icon icon="tabler:arrow-down" style={{ fontSize: 11 }} />
																</button>
																<button
																	type="button"
																	className="admin-btn btn-ghost btn-sm"
																	onClick={() => handleOpenEditModal(item, groupIdx)}
																	title="编辑"
																	style={{ padding: 2, height: 20 }}
																>
																	<Icon icon="tabler:edit" style={{ fontSize: 11 }} />
																</button>
																<button
																	type="button"
																	className="admin-btn btn-ghost btn-sm"
																	onClick={() => setDeleteTarget({ groupIdx, itemIndex: itemIdx, author: item.author })}
																	title="删除"
																	style={{ padding: 2, height: 20, color: 'var(--admin-danger)' }}
																>
																	<Icon icon="tabler:trash" style={{ fontSize: 11 }} />
																</button>
															</div>
														</div>

														{/* 描述与备注 */}
														<div style={{ fontSize: 11, color: 'var(--admin-text-2)', lineHeight: 1.35, minHeight: 28, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
															{item.desc || '暂无站点简介'}
														</div>

														{/* 标签与订阅源底栏 */}
														<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, flexWrap: 'wrap', paddingTop: 4, borderTop: '1px solid var(--admin-border-subtle)' }}>
															<div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
																{searchAllGroups && (
																	<span className="admin-badge badge-secondary" style={{ fontSize: 8.5, padding: '1px 4px' }}>
																		{groupName}
																	</span>
																)}
																{item.feed && (
																	<span className="admin-badge badge-success" style={{ fontSize: 8.5, padding: '1px 4px' }} title={`订阅源: ${item.feed}`}>
																		<Icon icon="tabler:rss" style={{ fontSize: 8.5 }} />
																		RSS
																	</span>
																)}
																{(item.archs || []).slice(0, 3).map(arch => {
																	const archIcon = getArchIcon(arch as any)
																	return (
																		<span key={arch} className="admin-badge badge-primary" style={{ fontSize: 8.5, padding: '1px 4px' }} title={arch}>
																			{archIcon && <Icon icon={archIcon} style={{ fontSize: 8.5 }} />}
																			{arch}
																		</span>
																	)
																})}
															</div>

															{item.comment && (
																<span style={{ fontSize: 10, color: 'var(--admin-text-4)' }} title={`私有备注: ${item.comment}`}>
																	<Icon icon="tabler:message-circle" />
																</span>
															)}
														</div>
													</div>
												)
											})}
										</div>
									) : (
										/* 高密度紧凑表格 */
										<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
											<thead>
												<tr style={{ background: 'var(--admin-bg-subtle)', borderBottom: '1px solid var(--admin-border)', textAlign: 'left' }}>
													<th style={{ padding: '6px 10px' }}>博友名称</th>
													<th style={{ padding: '6px 10px' }}>主页链接</th>
													<th style={{ padding: '6px 10px' }}>站点描述</th>
													<th style={{ padding: '6px 10px' }}>所属分组</th>
													<th style={{ padding: '6px 10px' }}>RSS</th>
													<th style={{ padding: '6px 10px', textAlign: 'right' }}>操作</th>
												</tr>
											</thead>
											<tbody>
												{displayEntries.map(({ item, groupIdx, groupName, itemIdx }) => (
													<tr key={item.link + itemIdx} style={{ borderBottom: '1px solid var(--admin-border)' }}>
														<td style={{ padding: '6px 10px' }}>
															<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
																<img
																	src={item.avatar || '/avatar.webp'}
																	alt=""
																	style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
																	onError={e => (e.currentTarget.src = '/avatar.webp')}
																/>
																<span style={{ fontWeight: 600, color: 'var(--admin-text-1)' }}>{item.author}</span>
															</div>
														</td>
														<td style={{ padding: '6px 10px' }}>
															<a href={item.link} target="_blank" rel="noreferrer" style={{ color: 'var(--admin-accent)', textDecoration: 'none' }}>
																{getDomain(item.link)}
															</a>
														</td>
														<td style={{ padding: '6px 10px', color: 'var(--admin-text-2)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
															{item.desc || '-'}
														</td>
														<td style={{ padding: '6px 10px' }}>
															<span className="admin-badge badge-secondary" style={{ fontSize: 9.5 }}>{groupName}</span>
														</td>
														<td style={{ padding: '6px 10px' }}>
															{item.feed ? <span className="admin-badge badge-success" style={{ fontSize: 9.5 }}>已配置</span> : <span style={{ color: 'var(--admin-text-4)', fontSize: 10 }}>无</span>}
														</td>
														<td style={{ padding: '6px 10px', textAlign: 'right' }}>
															<div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
																<button
																	type="button"
																	className="admin-btn btn-ghost btn-sm"
																	onClick={() => handleOpenEditModal(item, groupIdx)}
																	style={{ padding: 3 }}
																>
																	<Icon icon="tabler:edit" />
																</button>
																<button
																	type="button"
																	className="admin-btn btn-ghost btn-sm"
																	onClick={() => setDeleteTarget({ groupIdx, itemIndex: itemIdx, author: item.author })}
																	style={{ padding: 3, color: 'var(--admin-danger)' }}
																>
																	<Icon icon="tabler:trash" />
																</button>
															</div>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									)}
								</div>
							</div>
						</div>
					)}

					{/* ========================================================================= */}
					{/* 模式 2: 本站友链展示工坊 (My Blog Feed - 顺畅对称双栏) */}
					{/* ========================================================================= */}
					{activeTab === 'myFeed' && (
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
								gap: 12,
								flex: 1,
								minHeight: 0,
								overflowY: 'auto',
							}}
						>
							{/* 左栏：配置参数 */}
							<div className="admin-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--admin-surface)' }}>
								<div style={{ paddingBottom: 6, borderBottom: '1px solid var(--admin-border)' }}>
									<div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--admin-text-1)' }}>
										本站友链元数据设置
									</div>
									<div style={{ fontSize: 11.5, color: 'var(--admin-text-3)', marginTop: 2 }}>
										将写入 blog.config.ts 中的 myFeed，并在前台友链页作为本站卡片呈现
									</div>
								</div>

								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
									<div>
										<label style={{ display: 'block', color: 'var(--admin-text-3)', marginBottom: 3, fontWeight: 500, fontSize: 11.5 }}>
											作者昵称 (Author)
										</label>
										<input
											type="text"
											className="admin-input"
											value={myFeedData.author}
											onChange={e => {
												setMyFeedData({ ...myFeedData, author: e.target.value })
												setMyFeedDirty(true)
											}}
										/>
									</div>

									<div>
										<label style={{ display: 'block', color: 'var(--admin-text-3)', marginBottom: 3, fontWeight: 500, fontSize: 11.5 }}>
											站名短昵称 (Sitenick)
										</label>
										<input
											type="text"
											className="admin-input"
											value={myFeedData.sitenick}
											onChange={e => {
												setMyFeedData({ ...myFeedData, sitenick: e.target.value })
												setMyFeedDirty(true)
											}}
										/>
									</div>
								</div>

								<div>
									<label style={{ display: 'block', color: 'var(--admin-text-3)', marginBottom: 3, fontWeight: 500, fontSize: 11.5 }}>
										站点全称标题 (Title)
									</label>
									<input
										type="text"
										className="admin-input"
										value={myFeedData.title}
										onChange={e => {
											setMyFeedData({ ...myFeedData, title: e.target.value })
											setMyFeedDirty(true)
										}}
									/>
								</div>

								<div>
									<label style={{ display: 'block', color: 'var(--admin-text-3)', marginBottom: 3, fontWeight: 500, fontSize: 11.5 }}>
										站点主页链接 (Link)
									</label>
									<input
										type="text"
										className="admin-input"
										value={myFeedData.link}
										onChange={e => {
											setMyFeedData({ ...myFeedData, link: e.target.value })
											setMyFeedDirty(true)
										}}
									/>
								</div>

								<div>
									<label style={{ display: 'block', color: 'var(--admin-text-3)', marginBottom: 3, fontWeight: 500, fontSize: 11.5 }}>
										头像链接 (Avatar URL)
									</label>
									<input
										type="text"
										className="admin-input"
										value={myFeedData.avatar}
										onChange={e => {
											setMyFeedData({ ...myFeedData, avatar: e.target.value })
											setMyFeedDirty(true)
										}}
									/>
								</div>

								<div>
									<label style={{ display: 'block', color: 'var(--admin-text-3)', marginBottom: 3, fontWeight: 500, fontSize: 11.5 }}>
										一句话简介 (Description)
									</label>
									<textarea
										className="admin-textarea"
										rows={2}
										value={myFeedData.desc}
										onChange={e => {
											setMyFeedData({ ...myFeedData, desc: e.target.value })
											setMyFeedDirty(true)
										}}
									/>
								</div>

								{/* 技术架构 */}
								<div>
									<label style={{ display: 'block', color: 'var(--admin-text-3)', marginBottom: 3, fontWeight: 500, fontSize: 11.5 }}>
										技术栈徽章 (Archs)
									</label>
									<div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 6 }}>
										{COMMON_ARCHS.map(arch => {
											const isSelected = myFeedData.archs.includes(arch)
											return (
												<span
													key={arch}
													onClick={() => {
														const next = isSelected
															? myFeedData.archs.filter(a => a !== arch)
															: [...myFeedData.archs, arch]
														setMyFeedData({ ...myFeedData, archs: next })
														setMyFeedDirty(true)
													}}
													className={`admin-badge ${isSelected ? 'badge-primary' : 'badge-secondary'}`}
													style={{ cursor: 'pointer', fontSize: 9.5 }}
												>
													{arch}
												</span>
											)
										})}
									</div>
									<input
										type="text"
										className="admin-input"
										placeholder="输入自定义技术栈按回车添加..."
										value={newMyArchInput}
										onChange={e => setNewMyArchInput(e.target.value)}
										onKeyDown={e => {
											if (e.key === 'Enter' && newMyArchInput.trim()) {
												e.preventDefault()
												if (!myFeedData.archs.includes(newMyArchInput.trim())) {
													setMyFeedData({ ...myFeedData, archs: [...myFeedData.archs, newMyArchInput.trim()] })
													setMyFeedDirty(true)
												}
												setNewMyArchInput('')
											}
										}}
									/>
								</div>
							</div>

							{/* 右栏：所见即所得前台卡片 */}
							<div className="admin-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--admin-surface)' }}>
								<div style={{ paddingBottom: 6, borderBottom: '1px solid var(--admin-border)' }}>
									<div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--admin-text-1)' }}>
										前台 FeedCard 像素级即时渲染
									</div>
									<div style={{ fontSize: 11.5, color: 'var(--admin-text-3)', marginTop: 2 }}>
										悬浮下方卡片可查看实际弹出的详细 Popover 气泡效果
									</div>
								</div>

								<div style={{ padding: '40px 20px', background: 'var(--admin-bg)', borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
									<div style={{ width: 220 }}>
										<FeedCard
											author={myFeedData.author}
											sitenick={myFeedData.sitenick}
											title={myFeedData.title}
											desc={myFeedData.desc}
											link={myFeedData.link}
											avatar={myFeedData.avatar}
											icon=""
											archs={myFeedData.archs}
											date={myFeedData.date}
											comment={myFeedData.comment}
										/>
									</div>
								</div>

								<div style={{ background: 'var(--admin-bg-subtle)', border: '1px solid var(--admin-border)', borderRadius: 6, padding: '10px 12px', fontSize: 12 }}>
									<div style={{ fontWeight: 600, color: 'var(--admin-text-1)', marginBottom: 4 }}>
										供博友复制的友链信息代码块：
									</div>
									<pre style={{ margin: 0, fontFamily: 'var(--admin-font-mono)', fontSize: 11, color: 'var(--admin-text-2)', background: 'var(--admin-surface)', padding: 8, borderRadius: 4, overflowX: 'auto', border: '1px solid var(--admin-border)' }}>
{`name: ${myFeedData.sitenick || myFeedData.author}
url: ${myFeedData.link}
avatar: ${myFeedData.avatar}
desc: ${myFeedData.desc}`}
									</pre>
								</div>
							</div>
						</div>
					)}

					{/* ========================================================================= */}
					{/* 模式 3: 申请说明与留言规则 (link.md - 顺畅双栏即时渲染) */}
					{/* ========================================================================= */}
					{activeTab === 'linkMd' && (
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: '1fr 1fr',
								gap: 10,
								flex: 1,
								minHeight: 0,
							}}
						>
							{/* 左侧：输入框 */}
							<div className="admin-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--admin-surface)' }}>
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
									<span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--admin-text-1)' }}>
										编辑 content/link.md
									</span>
									<span style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>
										支持标准 Markdown 与 MDC 组件
									</span>
								</div>

								<textarea
									className="admin-textarea"
									value={linkMdContent}
									onChange={e => {
										setLinkMdContent(e.target.value)
										setLinkMdDirty(true)
									}}
									placeholder="输入友链申请要求、交换须知与留言说明..."
									style={{
										flex: 1,
										fontFamily: 'var(--admin-font-mono)',
										fontSize: 13,
										lineHeight: 1.6,
										resize: 'none',
										padding: '12px',
									}}
								/>
							</div>

							{/* 右侧：0 延迟同源实时预览 */}
							<div className="admin-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden', background: 'var(--admin-surface)' }}>
								<span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--admin-text-1)' }}>
									前台实时呈现预览 (0ms 即时渲染)
								</span>
								<div style={{ flex: 1, overflowY: 'auto', background: 'var(--admin-bg)', borderRadius: 6, padding: '12px 16px' }}>
									<MarkdownPreview
										content={linkMdContent}
										showChrome={false}
									/>
								</div>
							</div>
						</div>
					)}
				</>
			)}

			{/* ========================================================================= */}
			{/* 模态弹窗群 */}
			{/* ========================================================================= */}

			{/* 1. 嗅探 & 添加/编辑博友弹窗 */}
			{showAddModal && editingItem && (
				<div className="admin-modal-overlay">
					<div className="admin-modal-box" style={{ maxWidth: 540 }}>
						<div className="modal-header">
							<div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
								<Icon icon={isEditMode ? "tabler:edit" : "tabler:user-plus"} style={{ color: 'var(--admin-accent)' }} />
								<span>{isEditMode ? `编辑博友《${editingItem.author}》` : '添加新博友'}</span>
							</div>
							<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => setShowAddModal(false)}>
								<Icon icon="tabler:x" />
							</button>
						</div>

						<div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
							{/* 智能嗅探输入条 */}
							<div style={{ background: 'var(--admin-accent-soft)', border: '1px solid rgba(37, 99, 235, 0.15)', borderRadius: 6, padding: '8px 10px' }}>
								<div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--admin-accent)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
									<Icon icon="tabler:bolt" />
									<span>一键智能嗅探网站元数据 (Sniffer)</span>
								</div>
								<div style={{ display: 'flex', gap: 6 }}>
									<input
										type="text"
										className="admin-input"
										placeholder="输入对方站点网址 (如 https://example.com)..."
										value={sniffUrl}
										onChange={e => setSniffUrl(e.target.value)}
										onKeyDown={e => e.key === 'Enter' && handleSniff()}
										style={{ flex: 1, height: 28 }}
									/>
									<button
										type="button"
										className="admin-btn btn-primary btn-sm"
										onClick={handleSniff}
										disabled={sniffing}
										style={{ height: 28 }}
									>
										{sniffing ? <Icon icon="tabler:loader-2" style={{ animation: 'spin 1s linear infinite' }} /> : <Icon icon="tabler:sparkles" />}
										<span>{sniffing ? '嗅探中...' : '开始嗅探'}</span>
									</button>
								</div>
							</div>

							{/* 表单输入项 */}
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
								<div>
									<label style={{ display: 'block', color: 'var(--admin-text-3)', marginBottom: 3, fontWeight: 500, fontSize: 11.5 }}>
										博主昵称 / 名称 <span style={{ color: 'var(--admin-danger)' }}>*</span>
									</label>
									<input
										type="text"
										className="admin-input"
										placeholder="博主名称..."
										value={editingItem.author}
										onChange={e => setEditingItem({ ...editingItem, author: e.target.value })}
									/>
								</div>

								<div>
									<label style={{ display: 'block', color: 'var(--admin-text-3)', marginBottom: 3, fontWeight: 500, fontSize: 11.5 }}>
										所属分组
									</label>
									<select
										className="admin-select"
										value={editingGroupIdx}
										onChange={e => setEditingGroupIdx(Number(e.target.value))}
									>
										{groups.map((g, idx) => (
											<option key={g.name + idx} value={idx}>{g.name}</option>
										))}
									</select>
								</div>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
								<div>
									<label style={{ display: 'block', color: 'var(--admin-text-3)', marginBottom: 3, fontWeight: 500, fontSize: 11.5 }}>
										站点链接 (Link) <span style={{ color: 'var(--admin-danger)' }}>*</span>
									</label>
									<input
										type="text"
										className="admin-input"
										placeholder="https://..."
										value={editingItem.link}
										onChange={e => setEditingItem({ ...editingItem, link: e.target.value })}
									/>
								</div>

								<div>
									<label style={{ display: 'block', color: 'var(--admin-text-3)', marginBottom: 3, fontWeight: 500, fontSize: 11.5 }}>
										站点副标题 / 昵称 (Sitenick)
									</label>
									<input
										type="text"
										className="admin-input"
										placeholder="可选..."
										value={editingItem.sitenick || ''}
										onChange={e => setEditingItem({ ...editingItem, sitenick: e.target.value })}
									/>
								</div>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
								<div>
									<label style={{ display: 'block', color: 'var(--admin-text-3)', marginBottom: 3, fontWeight: 500, fontSize: 11.5 }}>
										头像链接 (Avatar URL)
									</label>
									<input
										type="text"
										className="admin-input"
										placeholder="https://..."
										value={editingItem.avatar || ''}
										onChange={e => setEditingItem({ ...editingItem, avatar: e.target.value })}
									/>
								</div>

								<div>
									<label style={{ display: 'block', color: 'var(--admin-text-3)', marginBottom: 3, fontWeight: 500, fontSize: 11.5 }}>
										RSS 订阅源 (Feed URL)
									</label>
									<input
										type="text"
										className="admin-input"
										placeholder="https://.../atom.xml"
										value={editingItem.feed || ''}
										onChange={e => setEditingItem({ ...editingItem, feed: e.target.value })}
									/>
								</div>
							</div>

							<div>
								<label style={{ display: 'block', color: 'var(--admin-text-3)', marginBottom: 3, fontWeight: 500, fontSize: 11.5 }}>
									一句话简介 (Description)
								</label>
								<input
									type="text"
									className="admin-input"
									placeholder="博友站点简短描述..."
									value={editingItem.desc || ''}
									onChange={e => setEditingItem({ ...editingItem, desc: e.target.value })}
								/>
							</div>

							{/* 技术架构 */}
							<div>
								<label style={{ display: 'block', color: 'var(--admin-text-3)', marginBottom: 3, fontWeight: 500, fontSize: 11.5 }}>
									架构技术栈 (Archs)
								</label>
								<div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 5 }}>
									{COMMON_ARCHS.slice(0, 10).map(arch => {
										const isSelected = (editingItem.archs || []).includes(arch)
										return (
											<span
												key={arch}
												onClick={() => {
													const cur = editingItem.archs || []
													const next = isSelected ? cur.filter(a => a !== arch) : [...cur, arch]
													setEditingItem({ ...editingItem, archs: next })
												}}
												className={`admin-badge ${isSelected ? 'badge-primary' : 'badge-secondary'}`}
												style={{ cursor: 'pointer', fontSize: 9.5 }}
											>
												{arch}
											</span>
										)
									})}
								</div>
								<input
									type="text"
									className="admin-input"
									placeholder="输入自定义标签按回车..."
									value={newArchInput}
									onChange={e => setNewArchInput(e.target.value)}
									onKeyDown={e => {
										if (e.key === 'Enter' && newArchInput.trim()) {
											e.preventDefault()
											const cur = editingItem.archs || []
											if (!cur.includes(newArchInput.trim())) {
												setEditingItem({ ...editingItem, archs: [...cur, newArchInput.trim()] })
											}
											setNewArchInput('')
										}
									}}
								/>
							</div>

							<div>
								<label style={{ display: 'block', color: 'var(--admin-text-3)', marginBottom: 3, fontWeight: 500, fontSize: 11.5 }}>
									私有备注 (Comment，仅后台可见)
								</label>
								<input
									type="text"
									className="admin-input"
									placeholder="互换时间、联系方式或私有评语..."
									value={editingItem.comment || ''}
									onChange={e => setEditingItem({ ...editingItem, comment: e.target.value })}
								/>
							</div>
						</div>

						<div className="modal-footer">
							<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => setShowAddModal(false)}>
								取消
							</button>
							<button type="button" className="admin-btn btn-primary btn-sm" onClick={handleSaveItemModal}>
								保存确认
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 2. 分组编辑/新建弹窗 */}
			{showGroupModal && (
				<div className="admin-modal-overlay">
					<div className="admin-modal-box" style={{ maxWidth: 400 }}>
						<div className="modal-header">
							<div className="modal-title">
								{isEditGroupMode ? '编辑分组信息' : '新建友链分组'}
							</div>
							<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => setShowGroupModal(false)}>
								<Icon icon="tabler:x" />
							</button>
						</div>
						<div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
							<div>
								<label style={{ display: 'block', color: 'var(--admin-text-3)', marginBottom: 3, fontWeight: 500, fontSize: 11.5 }}>
									分组名称
								</label>
								<input
									type="text"
									className="admin-input"
									placeholder="例如：技术博主、生活志..."
									value={groupNameInput}
									onChange={e => setGroupNameInput(e.target.value)}
								/>
							</div>
							<div>
								<label style={{ display: 'block', color: 'var(--admin-text-3)', marginBottom: 3, fontWeight: 500, fontSize: 11.5 }}>
									分组描述 (可选)
								</label>
								<input
									type="text"
									className="admin-input"
									placeholder="简短描述该分组包含的博友类型..."
									value={groupDescInput}
									onChange={e => setGroupDescInput(e.target.value)}
								/>
							</div>
						</div>
						<div className="modal-footer">
							<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => setShowGroupModal(false)}>
								取消
							</button>
							<button type="button" className="admin-btn btn-primary btn-sm" onClick={handleSaveGroupModal}>
								保存分组
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 3. 删除博友确认弹窗 */}
			{deleteTarget && (
				<div className="admin-modal-overlay">
					<div className="admin-modal-box" style={{ maxWidth: 360 }}>
						<div className="modal-header">
							<div className="modal-title" style={{ color: 'var(--admin-danger)' }}>
								删除博友确认
							</div>
						</div>
						<div className="modal-body" style={{ fontSize: 12.5 }}>
							确定要从友链列表中移除博友 <strong>《{deleteTarget.author}》</strong> 吗？
						</div>
						<div className="modal-footer">
							<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => setDeleteTarget(null)}>
								取消
							</button>
							<button type="button" className="admin-btn btn-danger btn-sm" onClick={handleConfirmDelete}>
								确认删除
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 4. 删除分组确认弹窗 */}
			{deleteGroupTarget !== null && (
				<div className="admin-modal-overlay">
					<div className="admin-modal-box" style={{ maxWidth: 360 }}>
						<div className="modal-header">
							<div className="modal-title" style={{ color: 'var(--admin-danger)' }}>
								删除分组确认
							</div>
						</div>
						<div className="modal-body" style={{ fontSize: 12.5 }}>
							确定要删除分组 <strong>《{groups[deleteGroupTarget]?.name}》</strong> 及其包含的所有博友条目吗？该操作不可撤销。
						</div>
						<div className="modal-footer">
							<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => setDeleteGroupTarget(null)}>
								取消
							</button>
							<button type="button" className="admin-btn btn-danger btn-sm" onClick={handleConfirmDeleteGroup}>
								确认删除分组
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 5. 连通性体检与 OPML 导入弹窗 */}
			{showCheckModal && (
				<FeedCheckModal
					onClose={() => setShowCheckModal(false)}
					links={groups.flatMap(g => g.entries.map(e => e.link)).filter(Boolean)}
				/>
			)}

			{showOpmlModal && (
				<OpmlImportModal
					targetGroupName={currentGroup?.name || '默认分组'}
					onClose={() => setShowOpmlModal(false)}
					onImportSuccess={(entries: FeedItem[]) => {
						if (currentGroup) {
							const nextGroups = [...groups]
							nextGroups[selectedGroupIdx]!.entries = [...nextGroups[selectedGroupIdx]!.entries, ...entries]
							setGroups(nextGroups)
							setHasUnsavedChanges(true)
							setShowOpmlModal(false)
							showToast(`成功导入 ${entries.length} 个订阅源至【${currentGroup.name}】`, 'success')
						}
					}}
				/>
			)}
		</div>
	)
}

export default FeedManagerView

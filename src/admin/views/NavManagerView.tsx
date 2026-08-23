import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import type { NavConfigData, NavItemConfig } from '../types'
import { IconPickerModal } from '../components/IconPickerModal'
import { useToast } from '../components/Toast'
import appConfig from '../../app.config'

export const NavManagerView: React.FC = () => {
	const { showToast } = useToast()
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [isDirty, setIsDirty] = useState(false)
	const [activeTab, setActiveTab] = useState<'main' | 'iconNav' | 'footer'>('main')
	const [previewTab, setPreviewTab] = useState<'sidebar' | 'footer'>('sidebar')
	const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light')

	const [navData, setNavData] = useState<NavConfigData & { copyright?: string }>({
		nav: [],
		footerNav: [],
		iconNav: [],
		copyright: `© ${new Date().getFullYear()} ${appConfig.author.name}`,
	})

	// 菜单项/图标项编辑弹窗
	const [modalType, setModalType] = useState<'mainItem' | 'iconItem' | 'footerItem' | 'footerGroup'>('mainItem')
	const [showItemModal, setShowItemModal] = useState(false)
	const [groupIndex, setGroupIndex] = useState(0)
	const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null)
	const [itemText, setItemText] = useState('')
	const [itemIcon, setItemIcon] = useState('tabler:link')
	const [itemUrl, setItemUrl] = useState('')
	const [groupTitle, setGroupTitle] = useState('')

	// 图标选择弹窗
	const [showIconPicker, setShowIconPicker] = useState(false)

	const loadNav = async () => {
		setLoading(true)
		try {
			const data = await adminApi.getNav()
			setNavData({
				nav: data.nav || [],
				footerNav: data.footerNav || [],
				iconNav: data.iconNav || [],
				copyright: (data as any).copyright || `© ${new Date().getFullYear()} ${appConfig.author.name}`,
			})
			setIsDirty(false)
		}
		catch (err: any) {
			showToast(`加载导航数据失败: ${err.message}`, 'error')
		}
		finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadNav()
	}, [])

	const handleSave = async (updated = navData) => {
		setSaving(true)
		try {
			await adminApi.saveNav(updated)
			setNavData(updated)
			setIsDirty(false)
			showToast('全站导航与页脚配置已成功更新保存！', 'success')
		}
		catch (err: any) {
			showToast(`保存失败: ${err.message}`, 'error')
		}
		finally {
			setSaving(false)
		}
	}

	// 快捷键保存 (Ctrl+S / Cmd+S)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === 's') {
				e.preventDefault()
				handleSave(navData)
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [navData])

	// ==================== 1. 主侧栏导航 (Main Nav) 操作 ====================
	const handleOpenAddMainItem = (gIdx: number) => {
		setModalType('mainItem')
		setGroupIndex(gIdx)
		setEditingItemIdx(null)
		setItemText('')
		setItemIcon('tabler:link')
		setItemUrl('/')
		setShowItemModal(true)
	}

	const handleOpenEditMainItem = (gIdx: number, iIdx: number) => {
		const target = navData.nav[gIdx]?.items[iIdx]
		if (!target) return
		setModalType('mainItem')
		setGroupIndex(gIdx)
		setEditingItemIdx(iIdx)
		setItemText(target.text)
		setItemIcon(target.icon || 'tabler:link')
		setItemUrl(target.url)
		setShowItemModal(true)
	}

	const handleDeleteMainItem = (gIdx: number, iIdx: number) => {
		const nextNav = JSON.parse(JSON.stringify(navData.nav))
		nextNav[gIdx]?.items.splice(iIdx, 1)
		const nextData = { ...navData, nav: nextNav }
		setNavData(nextData)
		setIsDirty(true)
	}

	const handleMoveMainItem = (gIdx: number, iIdx: number, direction: 'up' | 'down') => {
		const nextNav = JSON.parse(JSON.stringify(navData.nav))
		const items = nextNav[gIdx]?.items
		if (!items) return
		const targetIdx = direction === 'up' ? iIdx - 1 : iIdx + 1
		if (targetIdx < 0 || targetIdx >= items.length) return
		const temp = items[iIdx]!
		items[iIdx] = items[targetIdx]!
		items[targetIdx] = temp
		const nextData = { ...navData, nav: nextNav }
		setNavData(nextData)
		setIsDirty(true)
	}

	// ==================== 2. 侧栏底部图标导航 (Icon Nav) 操作 ====================
	const handleOpenAddIconNav = () => {
		setModalType('iconItem')
		setEditingItemIdx(null)
		setItemText('')
		setItemIcon('tabler:brand-github')
		setItemUrl('https://github.com/kerntau')
		setShowItemModal(true)
	}

	const handleOpenEditIconNav = (idx: number) => {
		const target = navData.iconNav[idx]
		if (!target) return
		setModalType('iconItem')
		setEditingItemIdx(idx)
		setItemText(target.text)
		setItemIcon(target.icon || 'tabler:brand-github')
		setItemUrl(target.url)
		setShowItemModal(true)
	}

	const handleDeleteIconNav = (idx: number) => {
		const nextIconNav = [...navData.iconNav]
		nextIconNav.splice(idx, 1)
		const nextData = { ...navData, iconNav: nextIconNav }
		setNavData(nextData)
		setIsDirty(true)
	}

	const handleMoveIconNav = (idx: number, direction: 'up' | 'down') => {
		const nextIconNav = [...navData.iconNav]
		const targetIdx = direction === 'up' ? idx - 1 : idx + 1
		if (targetIdx < 0 || targetIdx >= nextIconNav.length) return
		const temp = nextIconNav[idx]!
		nextIconNav[idx] = nextIconNav[targetIdx]!
		nextIconNav[targetIdx] = temp
		const nextData = { ...navData, iconNav: nextIconNav }
		setNavData(nextData)
		setIsDirty(true)
	}

	// ==================== 3. 页脚地图分组与项目 (Footer Nav) 操作 ====================
	const handleOpenAddFooterGroup = () => {
		setModalType('footerGroup')
		setGroupTitle('')
		setShowItemModal(true)
	}

	const handleDeleteFooterGroup = (gIdx: number) => {
		const nextFooterNav = [...navData.footerNav]
		nextFooterNav.splice(gIdx, 1)
		const nextData = { ...navData, footerNav: nextFooterNav }
		setNavData(nextData)
		setIsDirty(true)
	}

	const handleOpenAddFooterItem = (gIdx: number) => {
		setModalType('footerItem')
		setGroupIndex(gIdx)
		setEditingItemIdx(null)
		setItemText('')
		setItemIcon('tabler:link')
		setItemUrl('/')
		setShowItemModal(true)
	}

	const handleOpenEditFooterItem = (gIdx: number, iIdx: number) => {
		const target = navData.footerNav[gIdx]?.items[iIdx]
		if (!target) return
		setModalType('footerItem')
		setGroupIndex(gIdx)
		setEditingItemIdx(iIdx)
		setItemText(target.text)
		setItemIcon(target.icon || 'tabler:link')
		setItemUrl(target.url)
		setShowItemModal(true)
	}

	const handleDeleteFooterItem = (gIdx: number, iIdx: number) => {
		const nextFooterNav = JSON.parse(JSON.stringify(navData.footerNav))
		nextFooterNav[gIdx]?.items.splice(iIdx, 1)
		const nextData = { ...navData, footerNav: nextFooterNav }
		setNavData(nextData)
		setIsDirty(true)
	}

	const handleMoveFooterItem = (gIdx: number, iIdx: number, direction: 'up' | 'down') => {
		const nextFooterNav = JSON.parse(JSON.stringify(navData.footerNav))
		const items = nextFooterNav[gIdx]?.items
		if (!items) return
		const targetIdx = direction === 'up' ? iIdx - 1 : iIdx + 1
		if (targetIdx < 0 || targetIdx >= items.length) return
		const temp = items[iIdx]!
		items[iIdx] = items[targetIdx]!
		items[targetIdx] = temp
		const nextData = { ...navData, footerNav: nextFooterNav }
		setNavData(nextData)
		setIsDirty(true)
	}

	// 模态框确定保存
	const handleSaveModal = () => {
		if (modalType === 'footerGroup') {
			if (!groupTitle.trim()) {
				showToast('分组标题不能为空', 'warning')
				return
			}
			const nextFooterNav = [...navData.footerNav, { title: groupTitle.trim(), items: [] }]
			setNavData({ ...navData, footerNav: nextFooterNav })
			setIsDirty(true)
		}
		else {
			if (!itemText.trim()) {
				showToast('导航文本不能为空', 'warning')
				return
			}
			if (!itemUrl.trim()) {
				showToast('目标 URL 不能为空', 'warning')
				return
			}

			const newItem: NavItemConfig = {
				text: itemText.trim(),
				icon: itemIcon.trim() || 'tabler:link',
				url: itemUrl.trim(),
			}

			if (modalType === 'mainItem') {
				const nextNav = JSON.parse(JSON.stringify(navData.nav))
				if (!nextNav[groupIndex]) {
					nextNav[groupIndex] = { title: '', items: [] }
				}
				if (editingItemIdx !== null) {
					nextNav[groupIndex].items[editingItemIdx] = newItem
				}
				else {
					nextNav[groupIndex].items.push(newItem)
				}
				setNavData({ ...navData, nav: nextNav })
				setIsDirty(true)
			}
			else if (modalType === 'iconItem') {
				const nextIconNav = [...navData.iconNav]
				if (editingItemIdx !== null) {
					nextIconNav[editingItemIdx] = newItem
				}
				else {
					nextIconNav.push(newItem)
				}
				setNavData({ ...navData, iconNav: nextIconNav })
				setIsDirty(true)
			}
			else if (modalType === 'footerItem') {
				const nextFooterNav = JSON.parse(JSON.stringify(navData.footerNav))
				if (!nextFooterNav[groupIndex]) return
				if (editingItemIdx !== null) {
					nextFooterNav[groupIndex].items[editingItemIdx] = newItem
				}
				else {
					nextFooterNav[groupIndex].items.push(newItem)
				}
				setNavData({ ...navData, footerNav: nextFooterNav })
				setIsDirty(true)
			}
		}

		setShowItemModal(false)
	}

	if (loading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
				<Icon icon="tabler:loader-2" style={{ fontSize: 24, color: 'var(--admin-text-3)', animation: 'spin 1s linear infinite' }} />
			</div>
		)
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
			{/* 顶栏卡片 */}
			<div
				className="admin-card"
				style={{
					padding: '14px 18px',
					position: 'sticky',
					top: 0,
					zIndex: 30,
					backdropFilter: 'blur(12px)',
					boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
					<div>
						<div style={{ fontSize: 15, fontWeight: 700, color: 'var(--admin-text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
							<Icon icon="tabler:compass" style={{ color: 'var(--admin-accent)', fontSize: 18 }} />
							<span>导航与页脚 (Navigation & Footer)</span>
							{isDirty && (
								<span className="admin-badge badge-warning" style={{ fontSize: 11 }}>未保存修改</span>
							)}
						</div>
						<div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 2 }}>
							管理前台左侧栏菜单、侧栏底部外链社交图标及页脚 Sitemap 站点地图
						</div>
					</div>

					<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
						<button
							type="button"
							className="admin-btn btn-secondary btn-sm"
							onClick={loadNav}
							disabled={saving}
						>
							<Icon icon="tabler:refresh" />
							<span>重置读取</span>
						</button>
						<button
							type="button"
							className="admin-btn btn-primary btn-sm"
							onClick={() => handleSave()}
							disabled={saving}
							style={{ padding: '6px 18px', fontWeight: 600 }}
						>
							<Icon icon={saving ? 'tabler:loader-2' : 'tabler:device-floppy'} />
							<span>{saving ? '保存中...' : '保存导航配置 (Ctrl+S)'}</span>
						</button>
					</div>
				</div>
			</div>

			{/* 模块切换 Tab */}
			<div className="admin-card" style={{ padding: '8px 12px' }}>
				<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
					{[
						{ id: 'main', name: '1. 主侧栏导航', icon: 'tabler:layout-sidebar' },
						{ id: 'iconNav', name: '2. 侧栏底部图标导航', icon: 'tabler:brand-github' },
						{ id: 'footer', name: '3. 页脚栏目与版权信息', icon: 'tabler:layout-bottombar' },
					].map(tab => (
						<button
							key={tab.id}
							type="button"
							className={`admin-btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}
							onClick={() => {
								setActiveTab(tab.id as any)
								setPreviewTab(tab.id === 'footer' ? 'footer' : 'sidebar')
							}}
						>
							<Icon icon={tab.icon} />
							<span>{tab.name}</span>
						</button>
					))}
				</div>
			</div>

			{/* 主内容区：左侧表单编辑 + 右侧高保真实时预览 */}
			<div style={{ display: 'grid', gridTemplateColumns: 'minmax(460px, 1.2fr) minmax(340px, 1fr)', gap: 14 }}>
				{/* 左侧：表单配置区 */}
				<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
					{/* 1. 主导航配置 */}
					{activeTab === 'main' && (
						<div className="admin-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
							<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
								<div className="admin-section-title">
									<Icon icon="tabler:layout-sidebar" />
									<span>主侧栏导航条目</span>
								</div>
								<button
									type="button"
									className="admin-btn btn-primary btn-sm"
									onClick={() => handleOpenAddMainItem(0)}
								>
									<Icon icon="tabler:plus" />
									<span>新增主导航项</span>
								</button>
							</div>

							{(navData.nav || []).map((group, gIdx) => (
								<div key={gIdx} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
									{group.title && (
										<div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-2)' }}>
											{group.title}
										</div>
									)}

									<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
										{group.items.map((item, iIdx) => (
											<div
												key={iIdx}
												style={{
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'space-between',
													padding: '10px 14px',
													borderRadius: 6,
													background: 'var(--admin-surface)',
													border: '1px solid var(--admin-border)',
												}}
											>
												<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
													<div
														style={{
															width: 32,
															height: 32,
															borderRadius: 6,
															background: 'var(--admin-surface-hover)',
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'center',
															color: 'var(--admin-accent)',
														}}
													>
														<Icon icon={item.icon || 'tabler:link'} style={{ fontSize: 18 }} />
													</div>
													<div>
														<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)' }}>
															{item.text}
														</div>
														<div style={{ fontSize: 11, color: 'var(--admin-text-3)', fontFamily: 'monospace' }}>
															{item.url}
														</div>
													</div>
												</div>

												<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
													<button
														type="button"
														className="admin-btn btn-ghost btn-sm"
														disabled={iIdx === 0}
														onClick={() => handleMoveMainItem(gIdx, iIdx, 'up')}
														title="上移"
													>
														<Icon icon="tabler:arrow-up" />
													</button>
													<button
														type="button"
														className="admin-btn btn-ghost btn-sm"
														disabled={iIdx === group.items.length - 1}
														onClick={() => handleMoveMainItem(gIdx, iIdx, 'down')}
														title="下移"
													>
														<Icon icon="tabler:arrow-down" />
													</button>
													<button
														type="button"
														className="admin-btn btn-secondary btn-sm"
														onClick={() => handleOpenEditMainItem(gIdx, iIdx)}
													>
														<Icon icon="tabler:edit" />
														<span>编辑</span>
													</button>
													<button
														type="button"
														className="admin-btn btn-ghost btn-sm"
														onClick={() => handleDeleteMainItem(gIdx, iIdx)}
														style={{ color: 'var(--admin-danger)' }}
													>
														<Icon icon="tabler:trash" />
													</button>
												</div>
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					)}

					{/* 2. 侧栏底部图标导航配置 */}
					{activeTab === 'iconNav' && (
						<div className="admin-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
							<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
								<div className="admin-section-title">
									<Icon icon="tabler:brand-github" />
									<span>侧栏底部图标导航</span>
								</div>
								<button
									type="button"
									className="admin-btn btn-primary btn-sm"
									onClick={handleOpenAddIconNav}
								>
									<Icon icon="tabler:plus" />
									<span>新增图标外链</span>
								</button>
							</div>

							<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
								{(navData.iconNav || []).map((item, idx) => (
									<div
										key={idx}
										style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											padding: '10px 14px',
											borderRadius: 6,
											background: 'var(--admin-surface)',
											border: '1px solid var(--admin-border)',
										}}
									>
										<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
											<div
												style={{
													width: 32,
													height: 32,
													borderRadius: 6,
													background: 'var(--admin-surface-hover)',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													fontSize: 20,
													color: 'var(--admin-accent)',
												}}
											>
												<Icon icon={item.icon || 'tabler:link'} />
											</div>
											<div>
												<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)' }}>
													{item.text}
												</div>
												<div style={{ fontSize: 11, color: 'var(--admin-text-3)', fontFamily: 'monospace' }}>
													{item.url}
												</div>
											</div>
										</div>

										<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
											<button
												type="button"
												className="admin-btn btn-ghost btn-sm"
												disabled={idx === 0}
												onClick={() => handleMoveIconNav(idx, 'up')}
												title="左移/上移"
											>
												<Icon icon="tabler:arrow-up" />
											</button>
											<button
												type="button"
												className="admin-btn btn-ghost btn-sm"
												disabled={idx === navData.iconNav.length - 1}
												onClick={() => handleMoveIconNav(idx, 'down')}
												title="右移/下移"
											>
												<Icon icon="tabler:arrow-down" />
											</button>
											<button
												type="button"
												className="admin-btn btn-secondary btn-sm"
												onClick={() => handleOpenEditIconNav(idx)}
											>
												<Icon icon="tabler:edit" />
												<span>编辑</span>
											</button>
											<button
												type="button"
												className="admin-btn btn-ghost btn-sm"
												onClick={() => handleDeleteIconNav(idx)}
												style={{ color: 'var(--admin-danger)' }}
											>
												<Icon icon="tabler:trash" />
											</button>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* 3. 页脚配置 */}
					{activeTab === 'footer' && (
						<div className="admin-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
							<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
								<div className="admin-section-title">
									<Icon icon="tabler:layout-bottombar" />
									<span>页脚栏目与版权信息</span>
								</div>
								<button
									type="button"
									className="admin-btn btn-primary btn-sm"
									onClick={handleOpenAddFooterGroup}
								>
									<Icon icon="tabler:plus" />
									<span>新增页脚分组</span>
								</button>
							</div>

							<div className="admin-form-group">
								<label className="admin-form-label">页脚版权文本 (HTML 支持)</label>
								<input
									type="text"
									className="admin-input"
									value={navData.copyright || ''}
									onChange={e => {
										setNavData(prev => ({ ...prev, copyright: e.target.value }))
										setIsDirty(true)
									}}
								/>
							</div>

							{/* 页脚分组列表 */}
							<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
								{(navData.footerNav || []).map((group, gIdx) => (
									<div
										key={gIdx}
										style={{
											padding: '12px 14px',
											borderRadius: 6,
											background: 'var(--admin-bg-subtle)',
											border: '1px solid var(--admin-border)',
											display: 'flex',
											flexDirection: 'column',
											gap: 10,
										}}
									>
										<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
											<div style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text-1)' }}>
												分组: {group.title}
											</div>
											<div style={{ display: 'flex', gap: 4 }}>
												<button
													type="button"
													className="admin-btn btn-primary btn-sm"
													onClick={() => handleOpenAddFooterItem(gIdx)}
												>
													<Icon icon="tabler:plus" />
													<span>添加项目</span>
												</button>
												<button
													type="button"
													className="admin-btn btn-ghost btn-sm"
													onClick={() => handleDeleteFooterGroup(gIdx)}
													style={{ color: 'var(--admin-danger)' }}
												>
													<Icon icon="tabler:trash" />
												</button>
											</div>
										</div>

										<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
											{group.items.map((item, iIdx) => (
												<div
													key={iIdx}
													style={{
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'space-between',
														padding: '6px 10px',
														borderRadius: 4,
														background: 'var(--admin-surface)',
														border: '1px solid var(--admin-border)',
													}}
												>
													<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
														<Icon icon={item.icon || 'tabler:link'} style={{ fontSize: 14, color: 'var(--admin-accent)' }} />
														<span style={{ fontSize: 12, fontWeight: 600 }}>{item.text}</span>
														<span style={{ fontSize: 11, color: 'var(--admin-text-3)', fontFamily: 'monospace' }}>{item.url}</span>
													</div>

													<div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
														<button
															type="button"
															className="admin-btn btn-ghost btn-sm"
															disabled={iIdx === 0}
															onClick={() => handleMoveFooterItem(gIdx, iIdx, 'up')}
														>
															<Icon icon="tabler:arrow-up" />
														</button>
														<button
															type="button"
															className="admin-btn btn-ghost btn-sm"
															disabled={iIdx === group.items.length - 1}
															onClick={() => handleMoveFooterItem(gIdx, iIdx, 'down')}
														>
															<Icon icon="tabler:arrow-down" />
														</button>
														<button
															type="button"
															className="admin-btn btn-secondary btn-sm"
															onClick={() => handleOpenEditFooterItem(gIdx, iIdx)}
														>
															<Icon icon="tabler:edit" />
														</button>
														<button
															type="button"
															className="admin-btn btn-ghost btn-sm"
															onClick={() => handleDeleteFooterItem(gIdx, iIdx)}
															style={{ color: 'var(--admin-danger)' }}
														>
															<Icon icon="tabler:trash" />
														</button>
													</div>
												</div>
											))}
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{/* 右侧：前台同源高保真导航/页脚实时视口舞台 */}
				<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
					<div
						className="admin-card"
						style={{
							padding: '16px',
							position: 'sticky',
							top: 80,
							display: 'flex',
							flexDirection: 'column',
							gap: 14,
						}}
					>
						{/* 预览舞台头部 */}
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--admin-border)', paddingBottom: 10 }}>
							<div style={{ display: 'flex', gap: 6 }}>
								<button
									type="button"
									className={`admin-btn ${previewTab === 'sidebar' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
									onClick={() => setPreviewTab('sidebar')}
								>
									<Icon icon="tabler:layout-sidebar" />
									<span>侧栏视口</span>
								</button>
								<button
									type="button"
									className={`admin-btn ${previewTab === 'footer' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
									onClick={() => setPreviewTab('footer')}
								>
									<Icon icon="tabler:layout-bottombar" />
									<span>页脚视口</span>
								</button>
							</div>

							<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
								<button
									type="button"
									className="admin-btn btn-ghost btn-sm"
									onClick={() => setPreviewTheme(previewTheme === 'dark' ? 'light' : 'dark')}
									title={`切换预览主题 (当前: ${previewTheme === 'dark' ? '深色' : '浅色'})`}
									style={{ height: 24, padding: '0 8px', fontSize: 11 }}
								>
									<Icon icon={previewTheme === 'dark' ? 'tabler:sun' : 'tabler:moon'} />
									<span>{previewTheme === 'dark' ? '深色' : '浅色'}</span>
								</button>
								<span className="admin-badge badge-primary" style={{ fontSize: 10 }}>0ms Live</span>
							</div>
						</div>

						{/* 前台真实舞台呈现 */}
						<div
							data-theme={previewTheme}
							style={{
								padding: '16px',
								borderRadius: 8,
								background: previewTheme === 'dark' ? '#090a0f' : '#f8fafc',
								border: '1px solid var(--admin-border)',
								transition: 'background 0.2s ease',
							}}
						>
							{previewTab === 'sidebar' && (
								<div
									style={{
										width: 220,
										margin: '0 auto',
										background: previewTheme === 'dark' ? '#12151f' : '#ffffff',
										borderRadius: 12,
										border: '1px solid var(--admin-border)',
										padding: '16px 12px',
										display: 'flex',
										flexDirection: 'column',
										gap: 16,
										boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
									}}
								>
									{/* 前台侧栏头部 Logo 与身份 */}
									<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
										<div
											style={{
												width: 38,
												height: 38,
												borderRadius: '50%',
												background: 'var(--admin-accent)',
												color: '#ffffff',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												fontWeight: 700,
												fontSize: 16,
												flexShrink: 0,
												overflow: 'hidden',
											}}
										>
											<img
												src={appConfig.author.avatar || '/avatar.webp'}
												alt="Avatar"
												style={{ width: '100%', height: '100%', objectFit: 'cover' }}
												onError={e => (e.currentTarget.style.display = 'none')}
											/>
										</div>
										<div style={{ minWidth: 0, flex: 1 }}>
											<div style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
												{appConfig.title}
											</div>
											<div style={{ fontSize: 11, color: 'var(--admin-text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
												{appConfig.subtitle}
											</div>
										</div>
									</div>

									{/* 模拟搜索框 */}
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											padding: '6px 10px',
											borderRadius: 6,
											background: 'var(--admin-bg-subtle)',
											border: '1px solid var(--admin-border)',
											fontSize: 12,
											color: 'var(--admin-text-3)',
										}}
									>
										<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
											<Icon icon="tabler:search" />
											<span>搜索文章...</span>
										</div>
										<span className="admin-badge badge-secondary" style={{ fontSize: 10 }}>⌘K</span>
									</div>

									{/* 主菜单列表 */}
									<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
										{(navData.nav || []).map((group, gIdx) => (
											<div key={gIdx} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
												{group.title && (
													<div style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-3)', padding: '4px 8px' }}>
														{group.title}
													</div>
												)}
												{group.items.map((item, iIdx) => (
													<div
														key={iIdx}
														style={{
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'space-between',
															padding: '8px 10px',
															borderRadius: 6,
															background: iIdx === 0 && gIdx === 0 ? 'var(--admin-accent-soft)' : 'transparent',
															color: iIdx === 0 && gIdx === 0 ? 'var(--admin-accent)' : 'var(--admin-text-1)',
															fontWeight: iIdx === 0 && gIdx === 0 ? 600 : 400,
															fontSize: 13,
															transition: 'all 0.15s ease',
														}}
													>
														<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
															<Icon icon={item.icon || 'tabler:link'} style={{ fontSize: 16 }} />
															<span>{item.text}</span>
														</div>
														{item.url.startsWith('http') && (
															<Icon icon="tabler:arrow-up-right" style={{ fontSize: 12, opacity: 0.6 }} />
														)}
													</div>
												))}
											</div>
										))}
									</div>

									{/* 底部图标导航栏 */}
									<div
										style={{
											borderTop: '1px solid var(--admin-border)',
											paddingTop: 12,
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
										}}
									>
										<div style={{ display: 'flex', gap: 8, color: 'var(--admin-text-2)' }}>
											<Icon icon={previewTheme === 'dark' ? 'tabler:sun' : 'tabler:moon'} style={{ fontSize: 18, cursor: 'pointer' }} />
										</div>
										<div style={{ display: 'flex', gap: 8, color: 'var(--admin-text-2)' }}>
											{(navData.iconNav || []).map((item, idx) => (
												<span key={idx} title={item.text} style={{ display: 'inline-flex', cursor: 'pointer' }}>
													<Icon icon={item.icon || 'tabler:link'} style={{ fontSize: 18 }} />
												</span>
											))}
										</div>
									</div>
								</div>
							)}

							{previewTab === 'footer' && (
								<div
									style={{
										borderRadius: 12,
										background: previewTheme === 'dark' ? '#12151f' : '#ffffff',
										border: '1px solid var(--admin-border)',
										padding: '20px',
										display: 'flex',
										flexDirection: 'column',
										gap: 16,
										boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
									}}
								>
									<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 12 }}>
										{(navData.footerNav || []).map((group, idx) => (
											<div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
												<div style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-1)' }}>
													{group.title}
												</div>
												{group.items.map((item, iIdx) => (
													<div key={iIdx} style={{ fontSize: 11, color: 'var(--admin-text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
														<Icon icon={item.icon || 'tabler:link'} style={{ fontSize: 12 }} />
														<span>{item.text}</span>
													</div>
												))}
											</div>
										))}
									</div>

									<div
										style={{
											borderTop: '1px solid var(--admin-border)',
											paddingTop: 12,
											textAlign: 'center',
											fontSize: 11,
											color: 'var(--admin-text-3)',
										}}
										dangerouslySetInnerHTML={{ __html: navData.copyright || '' }}
									/>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* 新增/编辑条目通用弹窗 */}
			{showItemModal && (
				<div className="admin-modal-overlay">
					<div className="admin-modal-box" style={{ maxWidth: 440 }}>
						<div className="modal-header">
							<div className="modal-title">
								{modalType === 'footerGroup' ? '新增页脚栏目' : editingItemIdx !== null ? '编辑导航项' : '新增导航项'}
							</div>
							<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => setShowItemModal(false)}>
								<Icon icon="tabler:x" />
							</button>
						</div>

						<div className="modal-body">
							{modalType === 'footerGroup' ? (
								<div className="admin-form-group">
									<label className="admin-form-label required">分组标题</label>
									<input
										type="text"
										className="admin-input"
										placeholder="如: 探索 / 社交 / 信息"
										value={groupTitle}
										onChange={e => setGroupTitle(e.target.value)}
										autoFocus
									/>
								</div>
							) : (
								<>
									<div className="admin-form-group">
										<label className="admin-form-label required">导航文字 / 名称</label>
										<input
											type="text"
											className="admin-input"
											placeholder="如: 归档 / GitHub / 友链"
											value={itemText}
											onChange={e => setItemText(e.target.value)}
											autoFocus
										/>
									</div>

									<div className="admin-form-group">
										<label className="admin-form-label required">目标 URL 路径 / 外部链接</label>
										<input
											type="text"
											className="admin-input"
											placeholder="如: /archive 或 https://..."
											value={itemUrl}
											onChange={e => setItemUrl(e.target.value)}
										/>
									</div>

									<div className="admin-form-group">
										<label className="admin-form-label">展示图标 (Icon)</label>
										<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
											<div
												style={{
													width: 38,
													height: 38,
													borderRadius: 'var(--admin-radius-sm)',
													background: 'var(--admin-surface-hover)',
													border: '1px solid var(--admin-border)',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													fontSize: 20,
													color: 'var(--admin-accent)',
													cursor: 'pointer',
													transition: 'all 0.15s ease',
												}}
												onClick={() => setShowIconPicker(true)}
												title="点击选择图标"
											>
												<Icon icon={itemIcon || 'tabler:link'} />
											</div>
											<input
												type="text"
												className="admin-input"
												value={itemIcon}
												onChange={e => setItemIcon(e.target.value)}
												placeholder="tabler:link"
												style={{ flex: 1 }}
											/>
											<button
												type="button"
												className="admin-btn btn-secondary"
												onClick={() => setShowIconPicker(true)}
												style={{ padding: '0 12px' }}
											>
												<Icon icon="tabler:icons" />
												<span>选择图标</span>
											</button>
										</div>
									</div>
								</>
							)}
						</div>

						<div className="modal-footer">
							<button type="button" className="admin-btn btn-secondary" onClick={() => setShowItemModal(false)}>
								取消
							</button>
							<button type="button" className="admin-btn btn-primary" onClick={handleSaveModal}>
								<Icon icon="tabler:check" />
								<span>保存确定</span>
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 全站统一图标选择器 */}
			{showIconPicker && (
				<IconPickerModal
					currentIcon={itemIcon}
					onSelect={(ic) => {
						setItemIcon(ic)
						setShowIconPicker(false)
					}}
					onClose={() => setShowIconPicker(false)}
				/>
			)}
		</div>
	)
}

export default NavManagerView

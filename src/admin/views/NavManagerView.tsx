import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import type { NavConfigData, NavGroupConfig, NavItemConfig } from '../types'
import { IconPickerModal } from '../components/IconPickerModal'
import { useToast } from '../components/Toast'
import appConfig from '../../app.config'

export const NavManagerView: React.FC = () => {
	const { showToast } = useToast()
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [activeTab, setActiveTab] = useState<'main' | 'iconNav' | 'footer'>('main')
	const [previewTab, setPreviewTab] = useState<'sidebar' | 'footer'>('sidebar')

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

	// 图标挑选弹窗
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
		}
		catch (err: any) {
			showToast(`加载导航失败: ${err.message}`, 'error')
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
			showToast('全站导航与页脚配置已成功更新保存！', 'success')
		}
		catch (err: any) {
			showToast(`保存失败: ${err.message}`, 'error')
		}
		finally {
			setSaving(false)
		}
	}

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
		handleSave(nextData)
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
		handleSave(nextData)
	}

	// ==================== 2. 侧栏底部图标导航 (Icon Nav) 操作 ====================
	const handleOpenAddIconNav = () => {
		setModalType('iconItem')
		setEditingItemIdx(null)
		setItemText('')
		setItemIcon('tabler:brand-github')
		setItemUrl('https://github.com/')
		setShowItemModal(true)
	}

	const handleOpenEditIconNav = (iIdx: number) => {
		const target = navData.iconNav[iIdx]
		if (!target) return
		setModalType('iconItem')
		setEditingItemIdx(iIdx)
		setItemText(target.text)
		setItemIcon(target.icon || 'tabler:link')
		setItemUrl(target.url)
		setShowItemModal(true)
	}

	const handleDeleteIconNav = (iIdx: number) => {
		const nextIconNav = [...navData.iconNav]
		nextIconNav.splice(iIdx, 1)
		const nextData = { ...navData, iconNav: nextIconNav }
		handleSave(nextData)
	}

	const handleMoveIconNav = (iIdx: number, direction: 'up' | 'down') => {
		const nextIconNav = [...navData.iconNav]
		const targetIdx = direction === 'up' ? iIdx - 1 : iIdx + 1
		if (targetIdx < 0 || targetIdx >= nextIconNav.length) return
		const temp = nextIconNav[iIdx]!
		nextIconNav[iIdx] = nextIconNav[targetIdx]!
		nextIconNav[targetIdx] = temp
		const nextData = { ...navData, iconNav: nextIconNav }
		handleSave(nextData)
	}

	// ==================== 3. 页脚站点地图 (Footer Nav) 操作 ====================
	const handleOpenAddFooterGroup = () => {
		setModalType('footerGroup')
		setGroupTitle('')
		setShowItemModal(true)
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

	const handleDeleteFooterGroup = (gIdx: number) => {
		const nextFooter = [...navData.footerNav]
		nextFooter.splice(gIdx, 1)
		const nextData = { ...navData, footerNav: nextFooter }
		handleSave(nextData)
	}

	const handleDeleteFooterItem = (gIdx: number, iIdx: number) => {
		const nextFooter = JSON.parse(JSON.stringify(navData.footerNav))
		nextFooter[gIdx]?.items.splice(iIdx, 1)
		const nextData = { ...navData, footerNav: nextFooter }
		handleSave(nextData)
	}

	const handleMoveFooterItem = (gIdx: number, iIdx: number, direction: 'up' | 'down') => {
		const nextFooter = JSON.parse(JSON.stringify(navData.footerNav))
		const items = nextFooter[gIdx]?.items
		if (!items) return
		const targetIdx = direction === 'up' ? iIdx - 1 : iIdx + 1
		if (targetIdx < 0 || targetIdx >= items.length) return
		const temp = items[iIdx]!
		items[iIdx] = items[targetIdx]!
		items[targetIdx] = temp
		const nextData = { ...navData, footerNav: nextFooter }
		handleSave(nextData)
	}

	// ==================== 模态框保存分发 ====================
	const handleSaveModal = () => {
		if (modalType === 'footerGroup') {
			if (!groupTitle.trim()) {
				showToast('分组标题不能为空', 'warning')
				return
			}
			const nextFooter = [...navData.footerNav, { title: groupTitle.trim(), items: [] }]
			const nextData = { ...navData, footerNav: nextFooter }
			handleSave(nextData)
			setShowItemModal(false)
			return
		}

		if (!itemText.trim() || !itemUrl.trim()) {
			showToast('名称与链接不能为空', 'warning')
			return
		}

		const newItem: NavItemConfig = {
			text: itemText.trim(),
			icon: itemIcon.trim() || 'tabler:link',
			url: itemUrl.trim(),
		}

		if (modalType === 'mainItem') {
			const nextNav = JSON.parse(JSON.stringify(navData.nav))
			let group = nextNav[groupIndex]
			if (!group) {
				group = { title: '', items: [] }
				nextNav.push(group)
			}
			if (editingItemIdx !== null) {
				group.items[editingItemIdx] = newItem
			}
			else {
				group.items.push(newItem)
			}
			handleSave({ ...navData, nav: nextNav })
		}
		else if (modalType === 'iconItem') {
			const nextIconNav = [...navData.iconNav]
			if (editingItemIdx !== null) {
				nextIconNav[editingItemIdx] = newItem
			}
			else {
				nextIconNav.push(newItem)
			}
			handleSave({ ...navData, iconNav: nextIconNav })
		}
		else if (modalType === 'footerItem') {
			const nextFooter = JSON.parse(JSON.stringify(navData.footerNav))
			const group = nextFooter[groupIndex]
			if (!group) return
			if (editingItemIdx !== null) {
				group.items[editingItemIdx] = newItem
			}
			else {
				group.items.push(newItem)
			}
			handleSave({ ...navData, footerNav: nextFooter })
		}

		setShowItemModal(false)
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
			{/* 顶栏控制卡片 */}
			<div className="admin-card" style={{ padding: '16px 20px' }}>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
					<div>
						<div style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-text-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
							<Icon icon="tabler:compass" style={{ color: 'var(--admin-accent)', fontSize: 20 }} />
							<span>全站导航与页脚地图管理 (Navigation & Footer)</span>
						</div>
						<div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 4 }}>
							管理博客侧边栏菜单、侧栏底部社交图标、页脚多列站点地图及备案版权信息，修改即时反映至前台！
						</div>
					</div>

					<div style={{ display: 'flex', gap: 8 }}>
						<button
							type="button"
							className="admin-btn btn-secondary btn-sm"
							onClick={loadNav}
							disabled={loading || saving}
						>
							<Icon icon="tabler:refresh" />
							<span>重置读取</span>
						</button>
						<button
							type="button"
							className="admin-btn btn-primary btn-sm"
							onClick={() => handleSave()}
							disabled={saving}
						>
							<Icon icon={saving ? 'tabler:loader-2' : 'tabler:device-floppy'} />
							<span>{saving ? '保存中...' : '保存全站导航配置'}</span>
						</button>
					</div>
				</div>

				{/* 模块切换 Tabs */}
				<div style={{ display: 'flex', gap: 6, marginTop: 16, borderTop: '1px solid var(--admin-border)', paddingTop: 14 }}>
					<button
						type="button"
						className={`admin-btn btn-sm ${activeTab === 'main' ? 'btn-primary' : 'btn-ghost'}`}
						onClick={() => { setActiveTab('main'); setPreviewTab('sidebar') }}
					>
						<Icon icon="tabler:layout-sidebar" />
						<span>1. 侧栏主菜单 ({navData.nav.reduce((acc, g) => acc + g.items.length, 0)}项)</span>
					</button>
					<button
						type="button"
						className={`admin-btn btn-sm ${activeTab === 'iconNav' ? 'btn-primary' : 'btn-ghost'}`}
						onClick={() => { setActiveTab('iconNav'); setPreviewTab('sidebar') }}
					>
						<Icon icon="tabler:brand-github" />
						<span>2. 侧栏底部社交图标 ({navData.iconNav.length}项)</span>
					</button>
					<button
						type="button"
						className={`admin-btn btn-sm ${activeTab === 'footer' ? 'btn-primary' : 'btn-ghost'}`}
						onClick={() => { setActiveTab('footer'); setPreviewTab('footer') }}
					>
						<Icon icon="tabler:map-pin" />
						<span>3. 页脚站点地图与备案 ({navData.footerNav.length}组)</span>
					</button>
				</div>
			</div>

			{loading ? (
				<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
					<Icon icon="tabler:loader-2" style={{ fontSize: 24, color: 'var(--admin-text-3)', animation: 'spin 1s linear infinite' }} />
				</div>
			) : (
				<div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 1fr) 340px', gap: 14 }}>
					{/* 左侧：编辑配置区 */}
					<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
						{/* Tab 1: 主侧栏导航 */}
						{activeTab === 'main' && (
							<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
								{navData.nav.map((group, gIdx) => (
									<div key={gIdx} className="admin-card" style={{ padding: '16px' }}>
										<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
											<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
												<Icon icon="tabler:list" style={{ color: 'var(--admin-accent)' }} />
												<span style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)' }}>
													{group.title ? `导航分组: ${group.title}` : '主侧栏导航列表'}
												</span>
											</div>
											<button
												type="button"
												className="admin-btn btn-secondary btn-sm"
												onClick={() => handleOpenAddMainItem(gIdx)}
											>
												<Icon icon="tabler:plus" />
												<span>添加菜单项</span>
											</button>
										</div>

										<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
											{group.items.map((item, iIdx) => (
												<div
													key={iIdx}
													style={{
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'space-between',
														padding: '8px 12px',
														background: 'var(--admin-surface)',
														border: '1px solid var(--admin-border)',
														borderRadius: 6,
													}}
												>
													<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
														<div
															style={{
																width: 28,
																height: 28,
																borderRadius: 6,
																background: 'var(--admin-accent-soft)',
																color: 'var(--admin-accent)',
																display: 'flex',
																alignItems: 'center',
																justifyContent: 'center',
																fontSize: 16,
															}}
														>
															<Icon icon={item.icon || 'tabler:link'} />
														</div>
														<div>
															<div style={{ fontSize: 13, fontWeight: 500, color: 'var(--admin-text-1)' }}>
																{item.text}
															</div>
															<div style={{ fontSize: 11, color: 'var(--admin-text-3)', fontFamily: 'var(--admin-font-mono)' }}>
																{item.url}
															</div>
														</div>
													</div>

													<div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
														<button
															type="button"
															className="admin-btn btn-ghost btn-sm"
															onClick={() => handleMoveMainItem(gIdx, iIdx, 'up')}
															disabled={iIdx === 0}
															style={{ padding: '0 4px', height: 24 }}
															title="上移"
														>
															<Icon icon="tabler:chevron-up" />
														</button>
														<button
															type="button"
															className="admin-btn btn-ghost btn-sm"
															onClick={() => handleMoveMainItem(gIdx, iIdx, 'down')}
															disabled={iIdx === group.items.length - 1}
															style={{ padding: '0 4px', height: 24 }}
															title="下移"
														>
															<Icon icon="tabler:chevron-down" />
														</button>
														<button
															type="button"
															className="admin-btn btn-ghost btn-sm"
															onClick={() => handleOpenEditMainItem(gIdx, iIdx)}
															style={{ padding: '0 4px', height: 24 }}
															title="编辑"
														>
															<Icon icon="tabler:edit" />
														</button>
														<button
															type="button"
															className="admin-btn btn-danger btn-sm"
															onClick={() => handleDeleteMainItem(gIdx, iIdx)}
															style={{ padding: '0 4px', height: 24 }}
															title="删除"
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

						{/* Tab 2: 侧栏底部社交与订阅图标导航 */}
						{activeTab === 'iconNav' && (
							<div className="admin-card" style={{ padding: '16px' }}>
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
									<div>
										<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
											<Icon icon="tabler:brand-github" style={{ color: 'var(--admin-accent)' }} />
											<span>侧边栏底部社交与快速订阅图标 (Icon Nav)</span>
										</div>
										<div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginTop: 2 }}>
											前台 Sidebar 最底部常驻的社交小图标栏（如个人主页、GitHub、B站、Atom RSS）
										</div>
									</div>

									<button
										type="button"
										className="admin-btn btn-secondary btn-sm"
										onClick={handleOpenAddIconNav}
									>
										<Icon icon="tabler:plus" />
										<span>添加社交图标</span>
									</button>
								</div>

								<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
									{navData.iconNav.map((item, iIdx) => (
										<div
											key={iIdx}
											style={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												padding: '8px 12px',
												background: 'var(--admin-surface)',
												border: '1px solid var(--admin-border)',
												borderRadius: 6,
											}}
										>
											<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
												<div
													style={{
														width: 32,
														height: 32,
														borderRadius: '50%',
														background: 'var(--admin-bg-subtle)',
														border: '1px solid var(--admin-border)',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														fontSize: 18,
														color: 'var(--admin-accent)',
													}}
												>
													<Icon icon={item.icon} />
												</div>
												<div>
													<div style={{ fontSize: 13, fontWeight: 500, color: 'var(--admin-text-1)' }}>
														{item.text}
													</div>
													<div style={{ fontSize: 11, color: 'var(--admin-text-3)', fontFamily: 'var(--admin-font-mono)' }}>
														{item.url}
													</div>
												</div>
											</div>

											<div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
												<button
													type="button"
													className="admin-btn btn-ghost btn-sm"
													onClick={() => handleMoveIconNav(iIdx, 'up')}
													disabled={iIdx === 0}
													style={{ padding: '0 4px', height: 24 }}
													title="上移"
												>
													<Icon icon="tabler:chevron-up" />
												</button>
												<button
													type="button"
													className="admin-btn btn-ghost btn-sm"
													onClick={() => handleMoveIconNav(iIdx, 'down')}
													disabled={iIdx === navData.iconNav.length - 1}
													style={{ padding: '0 4px', height: 24 }}
													title="下移"
												>
													<Icon icon="tabler:chevron-down" />
												</button>
												<button
													type="button"
													className="admin-btn btn-ghost btn-sm"
													onClick={() => handleOpenEditIconNav(iIdx)}
													style={{ padding: '0 4px', height: 24 }}
													title="编辑"
												>
													<Icon icon="tabler:edit" />
												</button>
												<button
													type="button"
													className="admin-btn btn-danger btn-sm"
													onClick={() => handleDeleteIconNav(iIdx)}
													style={{ padding: '0 4px', height: 24 }}
													title="删除"
												>
													<Icon icon="tabler:trash" />
												</button>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Tab 3: 页脚站点地图与版权备案 */}
						{activeTab === 'footer' && (
							<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
								{/* 页脚版权与备案 */}
								<div className="admin-card" style={{ padding: '16px' }}>
									<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
										<Icon icon="tabler:copyright" style={{ color: 'var(--admin-accent)' }} />
										<span>页脚版权与签名设置</span>
									</div>
									<div>
										<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 4 }}>
											页脚 Copyright 文本 (支持 HTML 标签如 &lt;br&gt;)
										</label>
										<input
											type="text"
											className="admin-input"
											value={navData.copyright || ''}
											onChange={e => setNavData({ ...navData, copyright: e.target.value })}
											placeholder={`© ${new Date().getFullYear()} ${appConfig.author.name}`}
										/>
									</div>
								</div>

								{/* 页脚站点地图分组列表 */}
								<div className="admin-card" style={{ padding: '16px' }}>
									<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
										<div>
											<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
												<Icon icon="tabler:map-pin" style={{ color: 'var(--admin-accent)' }} />
												<span>页脚站点地图分类与链接 (Footer Nav)</span>
											</div>
											<div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginTop: 2 }}>
												如「探索」、「社交」、「信息/备案」等多列聚合链接
											</div>
										</div>

										<button
											type="button"
											className="admin-btn btn-secondary btn-sm"
											onClick={handleOpenAddFooterGroup}
										>
											<Icon icon="tabler:folder-plus" />
											<span>新建地图分组</span>
										</button>
									</div>

									<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
										{navData.footerNav.map((group, gIdx) => (
											<div
												key={gIdx}
												style={{
													background: 'var(--admin-surface)',
													border: '1px solid var(--admin-border)',
													borderRadius: 8,
													padding: 12,
												}}
											>
												<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, borderBottom: '1px dashed var(--admin-border)', paddingBottom: 6 }}>
													<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)' }}>
														📂 {group.title || `分组 ${gIdx + 1}`}
													</div>
													<div style={{ display: 'flex', gap: 4 }}>
														<button
															type="button"
															className="admin-btn btn-ghost btn-sm"
															onClick={() => handleOpenAddFooterItem(gIdx)}
															style={{ height: 24, fontSize: 11 }}
														>
															<Icon icon="tabler:plus" />
															<span>添加项</span>
														</button>
														<button
															type="button"
															className="admin-btn btn-danger btn-sm"
															onClick={() => handleDeleteFooterGroup(gIdx)}
															style={{ height: 24, padding: '0 6px' }}
															title="删除分组"
														>
															<Icon icon="tabler:trash" />
														</button>
													</div>
												</div>

												<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
													{group.items.map((item, iIdx) => (
														<div
															key={iIdx}
															style={{
																display: 'flex',
																alignItems: 'center',
																justifyContent: 'space-between',
																padding: '6px 8px',
																background: 'var(--admin-bg)',
																borderRadius: 4,
																fontSize: 12,
															}}
														>
															<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
																<Icon icon={item.icon || 'tabler:link'} style={{ color: 'var(--admin-accent)' }} />
																<span style={{ fontWeight: 500, color: 'var(--admin-text-1)' }}>{item.text}</span>
																<span style={{ color: 'var(--admin-text-3)', fontSize: 10, fontFamily: 'var(--admin-font-mono)' }}>{item.url}</span>
															</div>

															<div style={{ display: 'flex', gap: 2 }}>
																<button
																	type="button"
																	className="admin-btn btn-ghost btn-sm"
																	onClick={() => handleMoveFooterItem(gIdx, iIdx, 'up')}
																	disabled={iIdx === 0}
																	style={{ padding: '0 4px', height: 20 }}
																>
																	<Icon icon="tabler:chevron-up" />
																</button>
																<button
																	type="button"
																	className="admin-btn btn-ghost btn-sm"
																	onClick={() => handleMoveFooterItem(gIdx, iIdx, 'down')}
																	disabled={iIdx === group.items.length - 1}
																	style={{ padding: '0 4px', height: 20 }}
																>
																	<Icon icon="tabler:chevron-down" />
																</button>
																<button
																	type="button"
																	className="admin-btn btn-ghost btn-sm"
																	onClick={() => handleOpenEditFooterItem(gIdx, iIdx)}
																	style={{ padding: '0 4px', height: 20 }}
																>
																	<Icon icon="tabler:edit" />
																</button>
																<button
																	type="button"
																	className="admin-btn btn-danger btn-sm"
																	onClick={() => handleDeleteFooterItem(gIdx, iIdx)}
																	style={{ padding: '0 4px', height: 20 }}
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
							</div>
						)}
					</div>

					{/* 右侧：同源真实高保真双模预览 */}
					<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
						<div className="admin-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
							<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
								<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
									<Icon icon="tabler:eye" style={{ color: 'var(--admin-accent)' }} />
									<span>前台同源高保真即时预览</span>
								</div>
								<div style={{ display: 'flex', gap: 4 }}>
									<button
										type="button"
										className={`admin-btn btn-sm ${previewTab === 'sidebar' ? 'btn-primary' : 'btn-ghost'}`}
										style={{ height: 24, fontSize: 11 }}
										onClick={() => setPreviewTab('sidebar')}
									>
										Sidebar
									</button>
									<button
										type="button"
										className={`admin-btn btn-sm ${previewTab === 'footer' ? 'btn-primary' : 'btn-ghost'}`}
										style={{ height: 24, fontSize: 11 }}
										onClick={() => setPreviewTab('footer')}
									>
										Footer
									</button>
								</div>
							</div>

							{/* 模式 1: 侧栏高保真预览 */}
							{previewTab === 'sidebar' ? (
								<div
									style={{
										padding: '16px 14px',
										background: 'var(--admin-bg)',
										borderRadius: 8,
										border: '1px solid var(--admin-border)',
										display: 'flex',
										flexDirection: 'column',
										gap: 12,
									}}
								>
									{/* 顶部身份 */}
									<div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, borderBottom: '1px solid var(--admin-border)' }}>
										<img
											src={appConfig.author.avatar || '/avatar.webp'}
											alt="Avatar"
											style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--admin-accent)' }}
											onError={e => (e.currentTarget.src = '/favicon.ico')}
										/>
										<div>
											<div style={{ fontSize: 14, fontWeight: 700, color: 'var(--admin-text-1)' }}>
												{appConfig.title || 'kerntau'}
											</div>
											<div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>
												{appConfig.subtitle || '心中有景,花香满径'}
											</div>
										</div>
									</div>

									{/* 中部主导航列表 */}
									<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
										<div style={{ fontSize: 11, color: 'var(--admin-text-3)', padding: '0 4px', marginBottom: 2 }}>
											主导航列表
										</div>
										{navData.nav.flatMap(g => g.items).map((it, idx) => (
											<div
												key={idx}
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: 10,
													padding: '8px 12px',
													borderRadius: 6,
													background: idx === 0 ? 'var(--admin-surface-hover)' : 'transparent',
													color: idx === 0 ? 'var(--admin-accent)' : 'var(--admin-text-1)',
													fontSize: 13,
													fontWeight: 500,
												}}
											>
												<Icon icon={it.icon || 'tabler:link'} style={{ fontSize: 18 }} />
												<span>{it.text}</span>
											</div>
										))}
									</div>

									{/* 底部社交图标导航 */}
									<div style={{ paddingTop: 10, borderTop: '1px solid var(--admin-border)' }}>
										<div style={{ fontSize: 11, color: 'var(--admin-text-3)', padding: '0 4px', marginBottom: 6 }}>
											底部社交图标栏 (iconNav)
										</div>
										<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
											{navData.iconNav.map((ic, idx) => (
												<div
													key={idx}
													style={{
														width: 32,
														height: 32,
														borderRadius: '50%',
														background: 'var(--admin-surface)',
														border: '1px solid var(--admin-border)',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														color: 'var(--admin-text-1)',
														fontSize: 16,
													}}
													title={ic.text}
												>
													<Icon icon={ic.icon || 'tabler:link'} />
												</div>
											))}
										</div>
									</div>
								</div>
							) : (
								/* 模式 2: 页脚站点地图高保真预览 */
								<div
									style={{
										padding: '16px 14px',
										background: 'var(--admin-bg)',
										borderRadius: 8,
										border: '1px solid var(--admin-border)',
										display: 'flex',
										flexDirection: 'column',
										gap: 14,
									}}
								>
									<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 12 }}>
										{navData.footerNav.map((g, idx) => (
											<div key={idx}>
												<div style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-1)', marginBottom: 6 }}>
													{g.title}
												</div>
												<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
													{g.items.map((it, iIdx) => (
														<div key={iIdx} style={{ fontSize: 11, color: 'var(--admin-text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
															<Icon icon={it.icon || 'tabler:link'} style={{ fontSize: 12 }} />
															<span>{it.text}</span>
														</div>
													))}
												</div>
											</div>
										))}
									</div>

									<div style={{ borderTop: '1px dashed var(--admin-border)', paddingTop: 10, fontSize: 11, color: 'var(--admin-text-3)', textAlign: 'center' }}>
										{navData.copyright}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* 新建/编辑弹窗 */}
			{showItemModal && (
				<div className="admin-modal-overlay">
					<div className="admin-modal-box" style={{ maxWidth: 440 }}>
						<div className="modal-header">
							<div className="modal-title">
								{modalType === 'footerGroup'
									? '新建页脚地图分组'
									: editingItemIdx !== null
										? '编辑导航/图标菜单项'
										: '添加导航/图标菜单项'}
							</div>
							<button type="button" className="admin-btn btn-ghost btn-sm" onClick={() => setShowItemModal(false)}>
								<Icon icon="tabler:x" />
							</button>
						</div>

						<div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
							{modalType === 'footerGroup' ? (
								<div>
									<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 4 }}>
										分组标题 *
									</label>
									<input
										type="text"
										className="admin-input"
										placeholder="如: 探索、社交、相关信息、备案认证"
										value={groupTitle}
										onChange={e => setGroupTitle(e.target.value)}
									/>
								</div>
							) : (
								<>
									{/* 快捷预设 */}
									<div>
										<span style={{ fontSize: 11, color: 'var(--admin-text-3)', display: 'block', marginBottom: 4 }}>
											常用预设快速填入:
										</span>
										<div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
											{[
												{ text: '博客主页', url: '/', icon: 'tabler:home' },
												{ text: '文章归档', url: '/archive', icon: 'tabler:archive' },
												{ text: '友链邻居', url: '/link', icon: 'tabler:link' },
												{ text: 'GitHub', url: 'https://github.com/kerntau', icon: 'tabler:brand-github' },
												{ text: '哔哩哔哩', url: 'https://space.bilibili.com/9655855', icon: 'ri:bilibili-fill' },
												{ text: 'Atom订阅', url: '/atom.xml', icon: 'tabler:rss' },
												{ text: '开往 Travellings', url: 'https://www.travellings.cn/go.html', icon: 'ri:subway-line' },
												{ text: '工信部ICP备案', url: 'https://beian.miit.gov.cn/', icon: 'tabler:certificate' },
											].map(p => (
												<button
													key={p.text}
													type="button"
													className="admin-btn btn-ghost btn-sm"
													style={{ background: 'var(--admin-bg-subtle)', height: 24, fontSize: 11 }}
													onClick={() => {
														setItemText(p.text)
														setItemUrl(p.url)
														setItemIcon(p.icon)
													}}
												>
													<Icon icon={p.icon} />
													<span>{p.text}</span>
												</button>
											))}
										</div>
									</div>

									<div>
										<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
											文本名称 *
										</label>
										<input
											type="text"
											className="admin-input"
											placeholder="如: 文章、友链、GitHub、Atom订阅"
											value={itemText}
											onChange={e => setItemText(e.target.value)}
										/>
									</div>

									<div>
										<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
											目标 URL 路径 *
										</label>
										<input
											type="text"
											className="admin-input"
											placeholder="如: / 或 https://github.com/kerntau"
											value={itemUrl}
											onChange={e => setItemUrl(e.target.value)}
										/>
									</div>

									<div>
										<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
											图标 (Iconify / Tabler / Remix / Devicon)
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
													color: 'var(--admin-accent)',
												}}
											>
												<Icon icon={itemIcon} />
											</div>
											<input
												type="text"
												className="admin-input"
												value={itemIcon}
												onChange={e => setItemIcon(e.target.value)}
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
								</>
							)}
						</div>

						<div className="modal-footer">
							<button type="button" className="admin-btn btn-secondary btn-sm" onClick={() => setShowItemModal(false)}>
								取消
							</button>
							<button type="button" className="admin-btn btn-primary btn-sm" onClick={handleSaveModal}>
								确认保存
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 图标挑选器弹窗 */}
			{showIconPicker && (
				<IconPickerModal
					currentIcon={itemIcon}
					onSelect={(ic) => setItemIcon(ic)}
					onClose={() => setShowIconPicker(false)}
				/>
			)}
		</div>
	)
}

export default NavManagerView

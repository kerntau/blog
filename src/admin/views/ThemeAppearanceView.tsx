import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import type { AppearanceConfigData } from '../types'
import { useToast } from '../components/Toast'

export const ThemeAppearanceView: React.FC = () => {
	const { showToast } = useToast()
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)

	const [config, setConfig] = useState<AppearanceConfigData>({
		alert: { defaultStyle: 'card' },
		codeblock: { triggerRows: 32, collapsedRows: 16, enableIndentGuide: true, indent: 4, tabSize: 3 },
		excerpt: { animation: true, caret: '_' },
		slide: { showTitle: true },
		pagination: { perPage: 10, sortOrder: 'date', allowAscending: false },
	})

	const [activeSection, setActiveSection] = useState<'alert' | 'codeblock' | 'excerpt' | 'pagination'>('alert')

	const loadData = async () => {
		setLoading(true)
		try {
			const data = await adminApi.getAppearance()
			setConfig(data)
		}
		catch (err: any) {
			showToast(`加载主题外观配置失败: ${err.message}`, 'error')
		}
		finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadData()
	}, [])

	const handleSave = async () => {
		setSaving(true)
		try {
			await adminApi.saveAppearance(config)
			showToast('主题外观与排版参数已成功保存并实时生效！', 'success')
		}
		catch (err: any) {
			showToast(`保存失败: ${err.message}`, 'error')
		}
		finally {
			setSaving(false)
		}
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
			{/* 顶栏控制卡片 */}
			<div className="admin-card" style={{ padding: '16px 20px' }}>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
					<div>
						<div style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-text-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
							<Icon icon="tabler:palette" style={{ color: 'var(--admin-accent)', fontSize: 20 }} />
							<span>主题外观与前台排版工坊 (Themes & Components)</span>
						</div>
						<div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 4 }}>
							管理博客提示框卡片风格、代码块折叠行数、文章摘要打字机光标与列表分页排版细节
						</div>
					</div>

					<div style={{ display: 'flex', gap: 8 }}>
						<button
							type="button"
							className="admin-btn btn-secondary btn-sm"
							onClick={loadData}
							disabled={loading || saving}
						>
							<Icon icon="tabler:refresh" />
							<span>重置读取</span>
						</button>
						<button
							type="button"
							className="admin-btn btn-primary btn-sm"
							onClick={handleSave}
							disabled={saving}
						>
							<Icon icon={saving ? 'tabler:loader-2' : 'tabler:device-floppy'} />
							<span>{saving ? '保存中...' : '保存排版外观配置'}</span>
						</button>
					</div>
				</div>

				{/* 模块分类 Tabs */}
				<div style={{ display: 'flex', gap: 6, marginTop: 16, borderTop: '1px solid var(--admin-border)', paddingTop: 14 }}>
					<button
						type="button"
						className={`admin-btn btn-sm ${activeSection === 'alert' ? 'btn-primary' : 'btn-ghost'}`}
						onClick={() => setActiveSection('alert')}
					>
						<Icon icon="tabler:alert-triangle" />
						<span>1. 提示框组件 (Alert)</span>
					</button>
					<button
						type="button"
						className={`admin-btn btn-sm ${activeSection === 'codeblock' ? 'btn-primary' : 'btn-ghost'}`}
						onClick={() => setActiveSection('codeblock')}
					>
						<Icon icon="tabler:code" />
						<span>2. 代码块排版 (Codeblock)</span>
					</button>
					<button
						type="button"
						className={`admin-btn btn-sm ${activeSection === 'excerpt' ? 'btn-primary' : 'btn-ghost'}`}
						onClick={() => setActiveSection('excerpt')}
					>
						<Icon icon="tabler:cursor-text" />
						<span>3. 摘要打字动效 (Excerpt)</span>
					</button>
					<button
						type="button"
						className={`admin-btn btn-sm ${activeSection === 'pagination' ? 'btn-primary' : 'btn-ghost'}`}
						onClick={() => setActiveSection('pagination')}
					>
						<Icon icon="tabler:layout-grid" />
						<span>4. 分页与轮播 (Pagination)</span>
					</button>
				</div>
			</div>

			{loading ? (
				<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
					<Icon icon="tabler:loader-2" style={{ fontSize: 24, color: 'var(--admin-text-3)', animation: 'spin 1s linear infinite' }} />
				</div>
			) : (
				<div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 1fr) 380px', gap: 14 }}>
					{/* 左侧：表单配置区 */}
					<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
						{/* 1. 提示框 (Alert) */}
						{activeSection === 'alert' && (
							<div className="admin-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
								<div>
									<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)', marginBottom: 4 }}>
										提示框默认风格 (Alert Default Style)
									</div>
									<div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginBottom: 12 }}>
										控制文章内 MDC `::alert` 指令与提示块的默认渲染样式
									</div>

									<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
										<div
											style={{
												padding: '12px',
												borderRadius: 8,
												border: config.alert.defaultStyle === 'card' ? '2px solid var(--admin-accent)' : '1px solid var(--admin-border)',
												background: config.alert.defaultStyle === 'card' ? 'var(--admin-accent-soft)' : 'var(--admin-surface)',
												cursor: 'pointer',
												display: 'flex',
												flexDirection: 'column',
												gap: 4,
											}}
											onClick={() => setConfig({ ...config, alert: { defaultStyle: 'card' } })}
										>
											<div style={{ fontWeight: 600, fontSize: 13, color: 'var(--admin-text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
												<Icon icon={config.alert.defaultStyle === 'card' ? 'tabler:circle-check-filled' : 'tabler:circle'} style={{ color: 'var(--admin-accent)' }} />
												<span>卡片风格 (Card)</span>
											</div>
											<div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>
												带有背景柔光色块与细边框，层次感更丰富
											</div>
										</div>

										<div
											style={{
												padding: '12px',
												borderRadius: 8,
												border: config.alert.defaultStyle === 'flat' ? '2px solid var(--admin-accent)' : '1px solid var(--admin-border)',
												background: config.alert.defaultStyle === 'flat' ? 'var(--admin-accent-soft)' : 'var(--admin-surface)',
												cursor: 'pointer',
												display: 'flex',
												flexDirection: 'column',
												gap: 4,
											}}
											onClick={() => setConfig({ ...config, alert: { defaultStyle: 'flat' } })}
										>
											<div style={{ fontWeight: 600, fontSize: 13, color: 'var(--admin-text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
												<Icon icon={config.alert.defaultStyle === 'flat' ? 'tabler:circle-check-filled' : 'tabler:circle'} style={{ color: 'var(--admin-accent)' }} />
												<span>扁平风格 (Flat)</span>
											</div>
											<div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>
												仅保留左侧强调竖线与极简背景，简洁沉浸
											</div>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* 2. 代码块排版 (Codeblock) */}
						{activeSection === 'codeblock' && (
							<div className="admin-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
								<div>
									<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)', marginBottom: 4 }}>
										代码块折叠与缩进导航参数 (Codeblock Folding & Indent Guide)
									</div>
									<div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginBottom: 12 }}>
										控制前台长代码块自动折叠展开高度及代码缩进辅助线
									</div>

									<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
										<div>
											<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
												触发自动折叠的行数 (Trigger Rows)
											</label>
											<input
												type="number"
												className="admin-input"
												value={config.codeblock.triggerRows}
												onChange={e => setConfig({
													...config,
													codeblock: { ...config.codeblock, triggerRows: Number(e.target.value) },
												})}
											/>
										</div>

										<div>
											<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
												折叠后展示行数 (Collapsed Rows)
											</label>
											<input
												type="number"
												className="admin-input"
												value={config.codeblock.collapsedRows}
												onChange={e => setConfig({
													...config,
													codeblock: { ...config.codeblock, collapsedRows: Number(e.target.value) },
												})}
											/>
										</div>

										<div>
											<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
												Tab 渲染宽度 (Tab Size)
											</label>
											<input
												type="number"
												className="admin-input"
												value={config.codeblock.tabSize || 3}
												onChange={e => setConfig({
													...config,
													codeblock: { ...config.codeblock, tabSize: Number(e.target.value) },
												})}
											/>
										</div>

										<div>
											<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
												缩进竖线匹配空格数 (Indent)
											</label>
											<input
												type="number"
												className="admin-input"
												value={config.codeblock.indent || 4}
												onChange={e => setConfig({
													...config,
													codeblock: { ...config.codeblock, indent: Number(e.target.value) },
												})}
											/>
										</div>
									</div>

									<div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
										<input
											type="checkbox"
											id="enableIndentGuide"
											checked={config.codeblock.enableIndentGuide}
											onChange={e => setConfig({
												...config,
												codeblock: { ...config.codeblock, enableIndentGuide: e.target.checked },
											})}
										/>
										<label htmlFor="enableIndentGuide" style={{ fontSize: 12, color: 'var(--admin-text-1)', cursor: 'pointer' }}>
											启用代码块垂直缩进参考线 (Indent Guides)
										</label>
									</div>
								</div>
							</div>
						)}

						{/* 3. 摘要打字动效 (Excerpt) */}
						{activeSection === 'excerpt' && (
							<div className="admin-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
								<div>
									<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)', marginBottom: 4 }}>
										文章摘要打字机动画 (Excerpt Typewriter Effect)
									</div>
									<div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginBottom: 12 }}>
										控制前台文章开头引用块的逐字打字机光标动画
									</div>

									<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
										<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
											<input
												type="checkbox"
												id="excerptAnim"
												checked={config.excerpt.animation}
												onChange={e => setConfig({
													...config,
													excerpt: { ...config.excerpt, animation: e.target.checked },
												})}
											/>
											<label htmlFor="excerptAnim" style={{ fontSize: 12, color: 'var(--admin-text-1)', cursor: 'pointer' }}>
												开启前台文章摘要逐字打字机动画
											</label>
										</div>

										<div>
											<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 4 }}>
												光标闪烁符号 (Caret Symbol)
											</label>
											<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
												<input
													type="text"
													className="admin-input"
													value={config.excerpt.caret}
													onChange={e => setConfig({
														...config,
														excerpt: { ...config.excerpt, caret: e.target.value },
													})}
													style={{ width: 120 }}
												/>
												<div style={{ display: 'flex', gap: 4 }}>
													{['_', '|', '▋', '•', '✦'].map(sym => (
														<button
															key={sym}
															type="button"
															className="admin-btn btn-ghost btn-sm"
															style={{ background: 'var(--admin-bg-subtle)', height: 26, width: 26, padding: 0 }}
															onClick={() => setConfig({ ...config, excerpt: { ...config.excerpt, caret: sym } })}
														>
															{sym}
														</button>
													))}
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* 4. 分页与轮播 (Pagination & Slide) */}
						{activeSection === 'pagination' && (
							<div className="admin-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
								<div>
									<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)', marginBottom: 4 }}>
										全站分页与精选轮播配置 (Pagination & Slide)
									</div>
									<div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginBottom: 12 }}>
										控制首页/归档文章列表单页承载量与精选卡片标题展示
									</div>

									<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
										<div>
											<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
												默认每页文章数 (Per Page)
											</label>
											<input
												type="number"
												className="admin-input"
												value={config.pagination.perPage}
												onChange={e => setConfig({
													...config,
													pagination: { ...config.pagination, perPage: Number(e.target.value) },
												})}
											/>
										</div>

										<div>
											<label style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-3)', display: 'block', marginBottom: 3 }}>
												默认文章排序方式
											</label>
											<select
												className="admin-input"
												value={config.pagination.sortOrder}
												onChange={e => setConfig({
													...config,
													pagination: { ...config.pagination, sortOrder: e.target.value },
												})}
											>
												<option value="date">按发布日期倒序 (最新发布)</option>
												<option value="updated">按修改日期倒序 (最近更新)</option>
												<option value="title">按标题字典排序</option>
											</select>
										</div>
									</div>

									<div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
										<input
											type="checkbox"
											id="slideShowTitle"
											checked={config.slide.showTitle}
											onChange={e => setConfig({
												...config,
												slide: { showTitle: e.target.checked },
											})}
										/>
										<label htmlFor="slideShowTitle" style={{ fontSize: 12, color: 'var(--admin-text-1)', cursor: 'pointer' }}>
											精选轮播卡片启用标题浮层 (适合无字封面图)
										</label>
									</div>
								</div>
							</div>
						)}
					</div>

					{/* 右侧：同源真实组件高保真即时渲染 */}
					<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
						<div className="admin-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
							<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
								<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
									<Icon icon="tabler:eye" style={{ color: 'var(--admin-accent)' }} />
									<span>前台真实效果即时同源渲染</span>
								</div>
								<span className="admin-badge badge-primary">所见即所得</span>
							</div>

							<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
								{/* Alert 预览 */}
								<div>
									<div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginBottom: 6 }}>
										提示框效果 ({config.alert.defaultStyle === 'card' ? '卡片 Card' : '扁平 Flat'} 风格):
									</div>

									<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
										{/* Info Alert */}
										<div
											style={{
												padding: '12px 14px',
												borderRadius: config.alert.defaultStyle === 'card' ? 8 : 4,
												background: config.alert.defaultStyle === 'card' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.04)',
												borderLeft: '4px solid #3b82f6',
												borderTop: config.alert.defaultStyle === 'card' ? '1px solid rgba(59, 130, 246, 0.2)' : 'none',
												borderRight: config.alert.defaultStyle === 'card' ? '1px solid rgba(59, 130, 246, 0.2)' : 'none',
												borderBottom: config.alert.defaultStyle === 'card' ? '1px solid rgba(59, 130, 246, 0.2)' : 'none',
												fontSize: 12,
												color: 'var(--admin-text-1)',
												display: 'flex',
												alignItems: 'flex-start',
												gap: 8,
											}}
										>
											<Icon icon="tabler:info-circle" style={{ color: '#3b82f6', fontSize: 16, marginTop: 1, flexShrink: 0 }} />
											<div>这是一个「信息」提示框，展示前台真实文章内的通知和备忘内容。</div>
										</div>

										{/* Warning Alert */}
										<div
											style={{
												padding: '12px 14px',
												borderRadius: config.alert.defaultStyle === 'card' ? 8 : 4,
												background: config.alert.defaultStyle === 'card' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.04)',
												borderLeft: '4px solid #f59e0b',
												borderTop: config.alert.defaultStyle === 'card' ? '1px solid rgba(245, 158, 11, 0.2)' : 'none',
												borderRight: config.alert.defaultStyle === 'card' ? '1px solid rgba(245, 158, 11, 0.2)' : 'none',
												borderBottom: config.alert.defaultStyle === 'card' ? '1px solid rgba(245, 158, 11, 0.2)' : 'none',
												fontSize: 12,
												color: 'var(--admin-text-1)',
												display: 'flex',
												alignItems: 'flex-start',
												gap: 8,
											}}
										>
											<Icon icon="tabler:alert-triangle" style={{ color: '#f59e0b', fontSize: 16, marginTop: 1, flexShrink: 0 }} />
											<div>这是一个「注意」警告框，提示读者某些关键操作与配置变更。</div>
										</div>
									</div>
								</div>

								{/* Excerpt 动效预览 */}
								<div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: 12 }}>
									<div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginBottom: 6 }}>
										文章开头摘要与打字机光标动效:
									</div>
									<div
										style={{
											padding: '12px 14px',
											background: 'var(--admin-bg)',
											borderRadius: 6,
											borderLeft: '3px solid var(--admin-accent)',
											fontSize: 12,
											color: 'var(--admin-text-2)',
											lineHeight: 1.6,
										}}
									>
										<span>在有序的世界里，寻一处生活的归栈。用理性梳理日常，用技术温柔时光...</span>
										<span style={{ color: 'var(--admin-accent)', fontWeight: 700, marginLeft: 2, animation: 'pulse 1s infinite' }}>
											{config.excerpt.animation ? config.excerpt.caret : ''}
										</span>
									</div>
								</div>

								{/* Codeblock 预览 */}
								<div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: 12 }}>
									<div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginBottom: 6 }}>
										代码块折叠与缩进排版 (折叠阈值: {config.codeblock.triggerRows}行, 折叠高度: {config.codeblock.collapsedRows}行):
									</div>
									<div
										style={{
											padding: '10px 12px',
											background: '#18181b',
											borderRadius: 6,
											fontFamily: 'var(--admin-font-mono)',
											fontSize: 11,
											color: '#e4e4e7',
											lineHeight: 1.5,
										}}
									>
										<div style={{ color: '#71717a' }}>// TypeScript 配置示例</div>
										<div><span style={{ color: '#f43f5e' }}>export</span> <span style={{ color: '#60a5fa' }}>const</span> appConfig = &#123;</div>
										<div style={{ paddingLeft: `${(config.codeblock.indent || 4) * 4}px`, borderLeft: config.codeblock.enableIndentGuide ? '1px dashed #3f3f46' : 'none' }}>
											perPage: <span style={{ color: '#fbbf24' }}>{config.pagination.perPage}</span>,
										</div>
										<div style={{ paddingLeft: `${(config.codeblock.indent || 4) * 4}px`, borderLeft: config.codeblock.enableIndentGuide ? '1px dashed #3f3f46' : 'none' }}>
											caret: <span style={{ color: '#34d399' }}>'{config.excerpt.caret}'</span>,
										</div>
										<div>&#125;</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default ThemeAppearanceView

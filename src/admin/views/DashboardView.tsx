import React, { useEffect, useState, useMemo } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import type { GitStatusData, PostMeta, StatsData, AuditLogItem, BackupSnapshotItem } from '../types'
import { useToast } from '../components/Toast'
import appConfig from '../../app.config'
import { timeElapse } from '../../utils/time'

interface DashboardViewProps {
	onNavigate: (tab: string, params?: any) => void
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
	const { showToast } = useToast()
	const [stats, setStats] = useState<StatsData | null>(null)
	const [gitStatus, setGitStatus] = useState<GitStatusData | null>(null)
	const [allPosts, setAllPosts] = useState<PostMeta[]>([])
	const [snapshots, setSnapshots] = useState<BackupSnapshotItem[]>([])
	const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([])
	const [loading, setLoading] = useState(true)
	const [selectedPostFilter, setSelectedPostFilter] = useState<'all' | 'published' | 'draft'>('all')
	const [hoveredHeatmapDay, setHoveredHeatmapDay] = useState<{ date: string, count: number, titles: string[] } | null>(null)

	// 博主身份与站点配置
	const [authorProfile, setAuthorProfile] = useState({
		name: appConfig.author.name || 'kerntau',
		avatar: appConfig.author.avatar || '/avatar.webp',
		title: appConfig.title || '序栈',
		subtitle: appConfig.subtitle || '',
		url: appConfig.url || 'https://keru.in/',
	})

	const loadData = async () => {
		setLoading(true)
		try {
			const [statsData, gitData, postsData, siteInfoData, logsData, snapshotsData] = await Promise.all([
				adminApi.getStats().catch(() => null),
				adminApi.getGitStatus().catch(() => null),
				adminApi.getPosts().catch(() => []),
				adminApi.getSiteInfo().catch(() => null),
				adminApi.getAuditLogs().catch(() => []),
				adminApi.getBackups().catch(() => []),
			])
			setStats(statsData)
			setGitStatus(gitData)
			setAllPosts(postsData)
			setAuditLogs(logsData.slice(0, 10))
			setSnapshots(snapshotsData)

			if (siteInfoData && siteInfoData.authorAvatar) {
				setAuthorProfile({
					name: siteInfoData.authorName || appConfig.author.name,
					avatar: siteInfoData.authorAvatar || appConfig.author.avatar,
					title: siteInfoData.title || appConfig.title,
					subtitle: siteInfoData.subtitle || appConfig.subtitle,
					url: siteInfoData.url || appConfig.url,
				})
			}
		}
		catch (err: any) {
			showToast(`加载仪表盘数据失败: ${err.message}`, 'error')
		}
		finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadData()
	}, [])

	// 1. 生成过去 52 周 (364天) GitHub 风格写作热力图点阵
	const heatmapData = useMemo(() => {
		const dayMap: Record<string, { count: number, titles: string[] }> = {}
		for (const p of allPosts) {
			if (p.date) {
				const dStr = String(p.date).slice(0, 10)
				if (!dayMap[dStr]) dayMap[dStr] = { count: 0, titles: [] }
				dayMap[dStr].count++
				dayMap[dStr].titles.push(p.title)
			}
		}

		// 生成 52 周，每周 7 天（周日到周六）
		const today = new Date()
		const weeks: Array<Array<{ date: string, count: number, titles: string[], level: number }>> = []
		
		// 计算 52 周起始日（对齐到星期天）
		const totalDays = 52 * 7
		const startDay = new Date(today)
		startDay.setDate(today.getDate() - totalDays + (7 - today.getDay()))

		const currentDay = new Date(startDay)
		for (let w = 0; w < 52; w++) {
			const weekDays = []
			for (let d = 0; d < 7; d++) {
				const dateStr = currentDay.toISOString().slice(0, 10)
				const item = dayMap[dateStr] || { count: 0, titles: [] }
				let level = 0
				if (item.count >= 3) level = 4
				else if (item.count === 2) level = 3
				else if (item.count === 1) level = 2

				weekDays.push({
					date: dateStr,
					count: item.count,
					titles: item.titles,
					level,
				})
				currentDay.setDate(currentDay.getDate() + 1)
			}
			weeks.push(weekDays)
		}

		return weeks
	}, [allPosts])

	// 2. 分类专栏与知识架构占比
	const categoryDistribution = useMemo(() => {
		if (!allPosts || allPosts.length === 0) return []
		const map: Record<string, { count: number, words: number }> = {}
		for (const p of allPosts) {
			const cat = p.categories?.[0] || '未分类'
			if (!map[cat]) map[cat] = { count: 0, words: 0 }
			map[cat].count++
			map[cat].words += p.wordCount || 0
		}
		const total = allPosts.length
		return Object.entries(map)
			.map(([name, val]) => ({
				name,
				count: val.count,
				words: val.words,
				percentage: Math.round((val.count / total) * 100),
			}))
			.sort((a, b) => b.count - a.count)
			.slice(0, 5)
	}, [allPosts])

	// 3. 筛选后的最近文章列表
	const filteredPosts = useMemo(() => {
		let list = [...allPosts].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
		if (selectedPostFilter === 'published') list = list.filter(p => !p.draft)
		if (selectedPostFilter === 'draft') list = list.filter(p => p.draft)
		return list.slice(0, 6)
	}, [allPosts, selectedPostFilter])

	if (loading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
				<Icon icon="tabler:loader-2" style={{ fontSize: 28, color: 'var(--admin-accent)', animation: 'spin 1s linear infinite' }} />
			</div>
		)
	}

	const totalPosts = stats?.postCount || allPosts.length || 0
	const draftCount = stats?.draftCount || allPosts.filter(p => p.draft).length || 0
	const publishedCount = totalPosts - draftCount
	const totalWords = stats?.totalWords || allPosts.reduce((acc, p) => acc + (p.wordCount || 0), 0)
	const totalCategories = stats?.categoryCount || categoryDistribution.length || 0
	const latestSnapshot = snapshots[0]

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%', maxWidth: 1180, margin: '0 auto' }}>
			{/* ════════════════════════════════════════════════════════════════
			    顶层 Hero: Raycast / Linear 极简沉浸式控制台横幅
			   ════════════════════════════════════════════════════════════════ */}
			<div
				className="admin-card"
				style={{
					padding: '24px 28px',
					background: 'var(--admin-surface)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					flexWrap: 'wrap',
					gap: 16,
					border: '1px solid var(--admin-border)',
					borderRadius: 'var(--admin-radius-lg)',
					boxShadow: 'var(--admin-shadow-sm)',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
					<div style={{ position: 'relative' }}>
						<img
							src={authorProfile.avatar}
							alt={authorProfile.name}
							style={{
								width: 58,
								height: 58,
								borderRadius: '50%',
								objectFit: 'cover',
								border: '2px solid var(--admin-accent)',
								boxShadow: '0 0 24px var(--admin-accent-soft)',
							}}
							onError={e => (e.currentTarget.src = '/favicon.ico')}
						/>
						<span
							style={{
								position: 'absolute',
								bottom: 2,
								right: 2,
								width: 12,
								height: 12,
								borderRadius: '50%',
								background: 'var(--admin-success)',
								border: '2px solid var(--admin-surface)',
							}}
							title="API 在线"
						/>
					</div>

					<div>
						<div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
							<span style={{ fontSize: 20, fontWeight: 750, color: 'var(--admin-text-1)', letterSpacing: '-0.02em' }}>
								{authorProfile.title}
							</span>
							<span className="admin-badge badge-primary" style={{ padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
								Engineering Hub
							</span>
							<span style={{ fontSize: 12.5, color: 'var(--admin-text-3)', fontFamily: 'var(--admin-font-mono)' }}>
								@{authorProfile.name}
							</span>
						</div>
						<div style={{ fontSize: 13, color: 'var(--admin-text-3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
							<span>已持续平稳运行 <strong>{timeElapse(appConfig.timeEstablished)}</strong></span>
							<span>·</span>
							<span>全站共 <strong>{totalPosts}</strong> 篇博文 (<strong>{totalWords.toLocaleString()}</strong> 字)</span>
							<span>·</span>
							<span style={{ color: 'var(--admin-success)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
								<span>本地服务正常</span>
							</span>
						</div>
					</div>
				</div>

				{/* 顶栏快捷操作按键组 */}
				<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
					<button
						type="button"
						className="admin-btn btn-primary"
						onClick={() => onNavigate('posts-new')}
						style={{ padding: '7px 16px', fontWeight: 600 }}
					>
						<Icon icon="tabler:plus" />
						<span>新建文章</span>
					</button>

					<button
						type="button"
						className="admin-btn btn-secondary"
						onClick={() => onNavigate('backup')}
						title="前往全站数据备份与快照中心"
					>
						<Icon icon="tabler:database-export" />
						<span>数据备份</span>
					</button>

					<button
						type="button"
						className="admin-btn btn-secondary"
						onClick={() => onNavigate('settings')}
						title="全站设置与SEO控制"
					>
						<Icon icon="tabler:settings" />
						<span>站点设置</span>
					</button>

					<a
						href="/"
						target="_blank"
						rel="noreferrer"
						className="admin-btn btn-ghost"
						title="在新标签页查看前台主页"
					>
						<Icon icon="tabler:external-link" />
						<span>前台主页</span>
					</a>
				</div>
			</div>

			{/* ════════════════════════════════════════════════════════════════
			    核心 Bento Grid: GitHub 写作热力图 + 关键监控矩阵
			   ════════════════════════════════════════════════════════════════ */}
			<div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1.1fr)', gap: 16 }}>
				{/* 核心大卡 1：GitHub 风格年度写作活跃度热力图 (Contribution Heatmap) */}
				<div
					className="admin-card"
					style={{
						padding: '20px 22px',
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'space-between',
						borderRadius: 'var(--admin-radius-lg)',
					}}
				>
					<div>
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
							<div className="admin-section-title">
								<Icon icon="tabler:flame" style={{ color: '#f59e0b' }} />
								<span>写作产出全景与活跃热力图 (Contribution Graph)</span>
							</div>
							<span style={{ fontSize: 11.5, color: 'var(--admin-text-3)', fontFamily: 'var(--admin-font-mono)' }}>
								近 52 周活跃点阵
							</span>
						</div>

						{/* 热力图网格容器 */}
						<div style={{ overflowX: 'auto', paddingBottom: 6 }}>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(52, 1fr)',
									gridTemplateRows: 'repeat(7, 1fr)',
									gridAutoFlow: 'column',
									gap: 3.5,
									width: '100%',
									minWidth: 540,
								}}
							>
								{heatmapData.map((week, wIdx) =>
									week.map((day, dIdx) => {
										// 颜色阶梯
										let bg = 'var(--admin-bg-subtle)'
										if (day.level === 1) bg = 'rgba(16, 185, 129, 0.25)'
										if (day.level === 2) bg = 'rgba(16, 185, 129, 0.5)'
										if (day.level === 3) bg = 'rgba(16, 185, 129, 0.75)'
										if (day.level === 4) bg = 'var(--admin-success)'

										return (
											<div
												key={`${wIdx}-${dIdx}`}
												onMouseEnter={() => setHoveredHeatmapDay(day)}
												onMouseLeave={() => setHoveredHeatmapDay(null)}
												style={{
													aspectRatio: '1',
													borderRadius: 2.5,
													background: bg,
													cursor: day.count > 0 ? 'pointer' : 'default',
													transition: 'transform 0.15s ease',
												}}
											/>
										)
									}),
								)}
							</div>
						</div>
					</div>

					{/* 悬浮提示与热力图底部图例 */}
					<div
						style={{
							marginTop: 14,
							paddingTop: 10,
							borderTop: '1px dashed var(--admin-border)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							fontSize: 11.5,
						}}
					>
						<div style={{ color: 'var(--admin-text-2)', minHeight: 18 }}>
							{hoveredHeatmapDay ? (
								hoveredHeatmapDay.count > 0 ? (
									<span>
										<strong>{hoveredHeatmapDay.date}</strong>：发表了 <strong>{hoveredHeatmapDay.count}</strong> 篇博文（{hoveredHeatmapDay.titles.join('、')}）
									</span>
								) : (
									<span style={{ color: 'var(--admin-text-4)' }}>{hoveredHeatmapDay.date}：暂无文章发表</span>
								)
							) : (
								<span style={{ color: 'var(--admin-text-3)' }}>鼠标悬浮于点阵可查看单日发表文章明细</span>
							)}
						</div>

						<div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--admin-text-4)', fontSize: 10.5 }}>
							<span>Less</span>
							<span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--admin-bg-subtle)' }} />
							<span style={{ width: 9, height: 9, borderRadius: 2, background: 'rgba(16, 185, 129, 0.25)' }} />
							<span style={{ width: 9, height: 9, borderRadius: 2, background: 'rgba(16, 185, 129, 0.5)' }} />
							<span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--admin-success)' }} />
							<span>More</span>
						</div>
					</div>
				</div>

				{/* 核心大卡 2：4 维核心数据矩阵 (4-in-1 Compact Metrics) */}
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
					{/* 已发布与草稿 */}
					<div className="admin-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
						<div style={{ fontSize: 11.5, color: 'var(--admin-text-3)', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
							<span>已发布博文</span>
							<Icon icon="tabler:file-text" style={{ fontSize: 16, color: 'var(--admin-success)' }} />
						</div>
						<div>
							<div style={{ fontSize: 26, fontWeight: 800, color: 'var(--admin-text-1)', letterSpacing: '-0.02em', marginTop: 4 }}>
								{publishedCount}
							</div>
							<div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginTop: 2 }}>
								草稿箱 {draftCount} 篇
							</div>
						</div>
					</div>

					{/* 全站总字数 */}
					<div className="admin-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
						<div style={{ fontSize: 11.5, color: 'var(--admin-text-3)', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
							<span>全站总字数</span>
							<Icon icon="tabler:writing" style={{ fontSize: 16, color: 'var(--admin-accent)' }} />
						</div>
						<div>
							<div style={{ fontSize: 26, fontWeight: 800, color: 'var(--admin-text-1)', letterSpacing: '-0.02em', marginTop: 4 }}>
								{totalWords.toLocaleString()}
							</div>
							<div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginTop: 2 }}>
								篇均约 {totalPosts > 0 ? Math.round(totalWords / totalPosts) : 0} 字
							</div>
						</div>
					</div>

					{/* 分类与标签 */}
					<div className="admin-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
						<div style={{ fontSize: 11.5, color: 'var(--admin-text-3)', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
							<span>分类专栏</span>
							<Icon icon="tabler:category" style={{ fontSize: 16, color: '#f59e0b' }} />
						</div>
						<div>
							<div style={{ fontSize: 26, fontWeight: 800, color: 'var(--admin-text-1)', letterSpacing: '-0.02em', marginTop: 4 }}>
								{totalCategories}
							</div>
							<div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginTop: 2 }}>
								共 {stats?.tagCount || 0} 个标签
							</div>
						</div>
					</div>

					{/* 本地快照状态 */}
					<div className="admin-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
						<div style={{ fontSize: 11.5, color: 'var(--admin-text-3)', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
							<span>安全快照</span>
							<Icon icon="tabler:database-check" style={{ fontSize: 16, color: 'var(--admin-accent)' }} />
						</div>
						<div>
							<div style={{ fontSize: 26, fontWeight: 800, color: 'var(--admin-text-1)', letterSpacing: '-0.02em', marginTop: 4 }}>
								{snapshots.length} 份
							</div>
							<div style={{ fontSize: 11, color: 'var(--admin-success)', marginTop: 2, fontWeight: 550 }}>
								{latestSnapshot ? '已建立持久化备份' : '建议建立快照'}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* ════════════════════════════════════════════════════════════════
			    中层 Bento: 专栏内容占比条 + Git 工作区状态卡
			   ════════════════════════════════════════════════════════════════ */}
			<div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)', gap: 16 }}>
				{/* 知识架构与分类占比 */}
				<div className="admin-card" style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
					<div>
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
							<div className="admin-section-title">
								<Icon icon="tabler:chart-pie" />
								<span>专栏内容与知识分布 (Knowledge Hierarchy)</span>
							</div>
							<button
								type="button"
								className="admin-btn btn-ghost btn-sm"
								onClick={() => onNavigate('categories')}
								style={{ padding: '0 4px', fontSize: 11 }}
							>
								管理分类 »
							</button>
						</div>

						<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
							{categoryDistribution.map((cat, idx) => {
								const colors = ['var(--admin-accent)', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
								const curColor = colors[idx % colors.length]
								return (
									<div key={cat.name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
										<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
											<span style={{ fontWeight: 600, color: 'var(--admin-text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
												<span style={{ width: 8, height: 8, borderRadius: '50%', background: curColor }} />
												<span>{cat.name}</span>
											</span>
											<span style={{ color: 'var(--admin-text-3)', fontFamily: 'var(--admin-font-mono)', fontSize: 11.5 }}>
												{cat.count} 篇 ({cat.words.toLocaleString()} 字 · {cat.percentage}%)
											</span>
										</div>
										<div style={{ width: '100%', height: 6, background: 'var(--admin-bg-subtle)', borderRadius: 3, overflow: 'hidden' }}>
											<div
												style={{
													width: `${cat.percentage}%`,
													height: '100%',
													background: curColor,
													borderRadius: 3,
													transition: 'width 0.4s ease',
												}}
											/>
										</div>
									</div>
								)
							})}
						</div>
					</div>

					<div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px dashed var(--admin-border)', fontSize: 11, color: 'var(--admin-text-3)' }}>
						知识资产主要集中于前 5 大核心技术专栏
					</div>
				</div>

				{/* Git 状态与版本终端 */}
				<div className="admin-card" style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
					<div>
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
							<div className="admin-section-title">
								<Icon icon="tabler:git-branch" />
								<span>Git 本地仓库与分支 (Git Activity)</span>
							</div>
							<span className="admin-badge badge-secondary" style={{ fontFamily: 'var(--admin-font-mono)' }}>
								{gitStatus?.branch || 'main'}
							</span>
						</div>

						<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--admin-bg-subtle)', borderRadius: 'var(--admin-radius-sm)', fontSize: 12 }}>
								<span style={{ color: 'var(--admin-text-3)' }}>工作区状态</span>
								<span style={{ fontWeight: 600, color: gitStatus?.hasChanges ? 'var(--admin-warning)' : 'var(--admin-success)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
									<span style={{ width: 6, height: 6, borderRadius: '50%', background: gitStatus?.hasChanges ? 'var(--admin-warning)' : 'var(--admin-success)' }} />
									<span>{gitStatus?.hasChanges ? `${gitStatus.changes.length} 个未提交变更` : '工作区整洁 (Clean)'}</span>
								</span>
							</div>

							<div style={{ fontSize: 11.5, color: 'var(--admin-text-3)', marginTop: 4 }}>
								最近提交历史 (Recent Commits)：
							</div>

							<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
								{(!gitStatus?.recentCommits || gitStatus.recentCommits.length === 0) ? (
									<div style={{ color: 'var(--admin-text-3)', fontSize: 12, padding: '8px 0', textAlign: 'center' }}>
										暂无提交记录
									</div>
								) : (
									gitStatus.recentCommits.slice(0, 3).map((cStr, idx) => {
										const parts = cStr.split(' ')
										const hash = parts[0]
										const msg = parts.slice(1).join(' ')
										return (
											<div
												key={idx}
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: 8,
													padding: '5px 10px',
													borderRadius: 'var(--admin-radius-sm)',
													background: 'var(--admin-surface-hover)',
													border: '1px solid var(--admin-border)',
													fontSize: 11,
												}}
											>
												<code style={{ fontSize: 10.5, color: 'var(--admin-accent)', fontFamily: 'var(--admin-font-mono)' }}>
													{hash}
												</code>
												<span
													style={{
														color: 'var(--admin-text-1)',
														overflow: 'hidden',
														textOverflow: 'ellipsis',
														whiteSpace: 'nowrap',
														flex: 1,
													}}
													title={msg}
												>
													{msg}
												</span>
											</div>
										)
									})
								)}
							</div>
						</div>
					</div>

					<div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px dashed var(--admin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--admin-text-3)' }}>
						<span>本地源码与 Markdown 资产受 Git 严格版本管控</span>
					</div>
				</div>
			</div>

			{/* ════════════════════════════════════════════════════════════════
			    底层 Bento: 最近文章创作清单 + 实时审计流水
			   ════════════════════════════════════════════════════════════════ */}
			<div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)', gap: 16 }}>
				{/* 左侧：最近文章创作流 */}
				<div className="admin-card" style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
						<div className="admin-section-title">
							<Icon icon="tabler:clock-edit" />
							<span>最近博文创作动态 (Recent Content)</span>
						</div>

						{/* iOS / Linear 顶级微质感分段控制器 (Segmented Control) */}
						<div
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								padding: '2.5px',
								borderRadius: 'var(--admin-radius-sm)',
								background: 'var(--admin-bg-subtle)',
								border: '1px solid var(--admin-border)',
								gap: 2,
							}}
						>
							<button
								type="button"
								onClick={() => setSelectedPostFilter('all')}
								style={{
									padding: '3px 10px',
									borderRadius: 5,
									fontSize: 11.5,
									fontWeight: selectedPostFilter === 'all' ? 650 : 500,
									color: selectedPostFilter === 'all' ? 'var(--admin-text-1)' : 'var(--admin-text-3)',
									background: selectedPostFilter === 'all' ? 'var(--admin-surface)' : 'transparent',
									boxShadow: selectedPostFilter === 'all' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
									border: selectedPostFilter === 'all' ? '1px solid var(--admin-border)' : '1px solid transparent',
									cursor: 'pointer',
									transition: 'all 0.15s ease',
								}}
							>
								全部 ({totalPosts})
							</button>

							<button
								type="button"
								onClick={() => setSelectedPostFilter('published')}
								style={{
									padding: '3px 10px',
									borderRadius: 5,
									fontSize: 11.5,
									fontWeight: selectedPostFilter === 'published' ? 650 : 500,
									color: selectedPostFilter === 'published' ? 'var(--admin-text-1)' : 'var(--admin-text-3)',
									background: selectedPostFilter === 'published' ? 'var(--admin-surface)' : 'transparent',
									boxShadow: selectedPostFilter === 'published' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
									border: selectedPostFilter === 'published' ? '1px solid var(--admin-border)' : '1px solid transparent',
									cursor: 'pointer',
									transition: 'all 0.15s ease',
								}}
							>
								已发布 ({publishedCount})
							</button>

							<button
								type="button"
								onClick={() => setSelectedPostFilter('draft')}
								style={{
									padding: '3px 10px',
									borderRadius: 5,
									fontSize: 11.5,
									fontWeight: selectedPostFilter === 'draft' ? 650 : 500,
									color: selectedPostFilter === 'draft' ? 'var(--admin-text-1)' : 'var(--admin-text-3)',
									background: selectedPostFilter === 'draft' ? 'var(--admin-surface)' : 'transparent',
									boxShadow: selectedPostFilter === 'draft' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
									border: selectedPostFilter === 'draft' ? '1px solid var(--admin-border)' : '1px solid transparent',
									cursor: 'pointer',
									transition: 'all 0.15s ease',
								}}
							>
								草稿 ({draftCount})
							</button>
						</div>
					</div>

					<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
						{filteredPosts.length === 0 ? (
							<div style={{ color: 'var(--admin-text-3)', fontSize: 12, padding: '32px 0', textAlign: 'center' }}>
								暂无符合条件的博文记录
							</div>
						) : (
							filteredPosts.map((p) => {
								// 精准解析并格式化日期为 YYYY-MM-DD
								let dateFormatted = '未定日期'
								if (p.date) {
									try {
										const d = new Date(p.date)
										if (!Number.isNaN(d.getTime())) {
											dateFormatted = d.toISOString().slice(0, 10)
										} else {
											dateFormatted = String(p.date).slice(0, 10)
										}
									} catch {
										dateFormatted = String(p.date).slice(0, 10)
									}
								}

								return (
									<div
										key={p.path}
										style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											padding: '10px 14px',
											borderRadius: 'var(--admin-radius-sm)',
											background: 'var(--admin-surface-hover)',
											border: '1px solid var(--admin-border)',
										}}
									>
										<div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
											<span
												className={`admin-badge ${p.draft ? 'badge-warning' : 'badge-primary'}`}
												style={{ fontSize: 10.5, flexShrink: 0 }}
											>
												{p.draft ? '草稿' : '已发布'}
											</span>
											<div style={{ overflow: 'hidden' }}>
												<div
													style={{
														fontSize: 13,
														fontWeight: 650,
														color: 'var(--admin-text-1)',
														overflow: 'hidden',
														textOverflow: 'ellipsis',
														whiteSpace: 'nowrap',
													}}
													title={p.title}
												>
													{p.title}
												</div>
												<div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
													<span>{dateFormatted}</span>
													<span>·</span>
													<span>{p.categories?.[0] || '未分类'}</span>
													<span>·</span>
													<span>{p.wordCount || 0} 字</span>
												</div>
											</div>
										</div>

										<button
											type="button"
											className="admin-btn btn-secondary btn-sm"
											onClick={() => onNavigate('posts-edit', { path: p.path })}
											style={{ flexShrink: 0 }}
										>
											<Icon icon="tabler:edit" />
											<span>编辑</span>
										</button>
									</div>
								)
							})
						)}
					</div>
				</div>

				{/* 右侧：实时操作审计流水 (Audit Trail) */}
				<div className="admin-card" style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
					<div>
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
							<div className="admin-section-title">
								<Icon icon="tabler:shield-check" />
								<span>管理操作审计流水 (Audit Logs)</span>
							</div>
							<button
								type="button"
								className="admin-btn btn-ghost btn-sm"
								onClick={() => onNavigate('backup')}
								style={{ padding: '0 4px', fontSize: 11 }}
							>
								备份中心 »
							</button>
						</div>

						<div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
							{auditLogs.length === 0 ? (
								<div style={{ color: 'var(--admin-text-3)', fontSize: 12, padding: '24px 0', textAlign: 'center' }}>
									暂无近期操作日志
								</div>
							) : (
								auditLogs.slice(0, 6).map((log) => (
									<div
										key={log.id}
										style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											padding: '7px 10px',
											borderRadius: 'var(--admin-radius-sm)',
											background: 'var(--admin-bg-subtle)',
											border: '1px solid var(--admin-border-subtle)',
											fontSize: 11.5,
										}}
									>
										<div style={{ display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden' }}>
											<span className="admin-badge badge-default" style={{ fontSize: 9.5, padding: '2px 6px', fontWeight: 600 }}>
												{log.action}
											</span>
											<span
												style={{
													color: 'var(--admin-text-1)',
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													whiteSpace: 'nowrap',
												}}
												title={log.target || log.details}
											>
												{log.target || log.details}
											</span>
										</div>
										<span style={{ color: 'var(--admin-text-4)', fontSize: 10.5, fontFamily: 'var(--admin-font-mono)', flexShrink: 0, marginLeft: 8 }}>
											{log.timestamp ? new Date(log.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : ''}
										</span>
									</div>
								))
							)}
						</div>
					</div>

					<div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px dashed var(--admin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--admin-text-3)' }}>
						<span>每次修改与快照动作均记录审计流水</span>
						<span style={{ color: 'var(--admin-success)', fontWeight: 600 }}>● 实时审计中</span>
					</div>
				</div>
			</div>
		</div>
	)
}

export default DashboardView

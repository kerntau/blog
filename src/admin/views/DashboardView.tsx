import React, { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import type { GitStatusData, PostMeta, StatsData } from '../types'
import { useToast } from '../components/Toast'

interface DashboardViewProps {
	onNavigate: (tab: string, params?: any) => void
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
	const { showToast } = useToast()
	const [stats, setStats] = useState<StatsData | null>(null)
	const [gitStatus, setGitStatus] = useState<GitStatusData | null>(null)
	const [recentPosts, setRecentPosts] = useState<PostMeta[]>([])
	const [loading, setLoading] = useState(true)

	const loadData = async () => {
		setLoading(true)
		try {
			const [statsData, gitData, postsData] = await Promise.all([
				adminApi.getStats(),
				adminApi.getGitStatus().catch(() => null),
				adminApi.getPosts().catch(() => []),
			])
			setStats(statsData)
			setGitStatus(gitData)
			setRecentPosts(postsData.slice(0, 5))
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

	if (loading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
				<Icon icon="tabler:loader-2" style={{ fontSize: 24, color: 'var(--admin-text-3)', animation: 'spin 1s linear infinite' }} />
			</div>
		)
	}

	const totalPosts = stats?.postCount || 0
	const totalWords = stats?.totalWords || 0
	const totalFriends = stats?.friendCount || 0
	const totalCategories = stats?.categoryCount || 0
	const totalTags = stats?.tagCount || 0

	const yearEntries = Object.entries(stats?.years || {}).sort((a, b) => b[0].localeCompare(a[0]))
	const categoryEntries = Object.entries(stats?.categories || {}).sort((a, b) => b[1] - a[1])

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
			{/* 顶部紧凑操作卡 */}
			<div
				className="admin-card"
				style={{
					padding: '12px 16px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					flexWrap: 'wrap',
					gap: 10,
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
					<div style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text-1)' }}>
						博客内容控制台
					</div>
					<div style={{ fontSize: 11, color: 'var(--admin-text-3)', borderLeft: '1px solid var(--admin-border)', paddingLeft: 12 }}>
						最近更新：{stats?.lastUpdated || '无记录'}
					</div>
				</div>

				<div style={{ display: 'flex', gap: 6 }}>
					<button
						type="button"
						className="admin-btn btn-primary btn-sm"
						onClick={() => onNavigate('posts-new')}
					>
						<Icon icon="tabler:plus" />
						<span>新建文章</span>
					</button>
					<button
						type="button"
						className="admin-btn btn-secondary btn-sm"
						onClick={() => onNavigate('console')}
					>
						<Icon icon="tabler:player-play" />
						<span>构建刷新</span>
					</button>
				</div>
			</div>

			{/* 5 格横向饱满指标网格 */}
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
				<div className="admin-card" style={{ padding: '12px 14px' }}>
					<div style={{ fontSize: 11, color: 'var(--admin-text-3)', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<span>全部博文</span>
						<Icon icon="tabler:file-text" style={{ fontSize: 14 }} />
					</div>
					<div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: 'var(--admin-text-1)', letterSpacing: '-0.02em' }}>
						{totalPosts.toLocaleString()}
					</div>
					<div style={{ fontSize: 10, color: 'var(--admin-text-4)', marginTop: 2 }}>
						跨越 {yearEntries.length} 个年份
					</div>
				</div>

				<div className="admin-card" style={{ padding: '12px 14px' }}>
					<div style={{ fontSize: 11, color: 'var(--admin-text-3)', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<span>全站字数</span>
						<Icon icon="tabler:writing" style={{ fontSize: 14 }} />
					</div>
					<div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: 'var(--admin-text-1)', letterSpacing: '-0.02em' }}>
						{totalWords.toLocaleString()}
					</div>
					<div style={{ fontSize: 10, color: 'var(--admin-text-4)', marginTop: 2 }}>
						篇均约 {totalPosts > 0 ? Math.round(totalWords / totalPosts) : 0} 字
					</div>
				</div>

				<div className="admin-card" style={{ padding: '12px 14px' }}>
					<div style={{ fontSize: 11, color: 'var(--admin-text-3)', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<span>友链订阅</span>
						<Icon icon="tabler:users-group" style={{ fontSize: 14 }} />
					</div>
					<div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: 'var(--admin-text-1)', letterSpacing: '-0.02em' }}>
						{totalFriends.toLocaleString()}
					</div>
					<div style={{ fontSize: 10, color: 'var(--admin-text-4)', marginTop: 2 }}>
						已收录博友站点
					</div>
				</div>

				<div className="admin-card" style={{ padding: '12px 14px' }}>
					<div style={{ fontSize: 11, color: 'var(--admin-text-3)', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<span>分类专栏</span>
						<Icon icon="tabler:category" style={{ fontSize: 14 }} />
					</div>
					<div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: 'var(--admin-text-1)', letterSpacing: '-0.02em' }}>
						{totalCategories}
					</div>
					<div style={{ fontSize: 10, color: 'var(--admin-text-4)', marginTop: 2 }}>
						覆盖各个技术领域
					</div>
				</div>

				<div className="admin-card" style={{ padding: '12px 14px' }}>
					<div style={{ fontSize: 11, color: 'var(--admin-text-3)', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<span>标签索引</span>
						<Icon icon="tabler:tags" style={{ fontSize: 14 }} />
					</div>
					<div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: 'var(--admin-text-1)', letterSpacing: '-0.02em' }}>
						{totalTags}
					</div>
					<div style={{ fontSize: 10, color: 'var(--admin-text-4)', marginTop: 2 }}>
						知识图谱关联点
					</div>
				</div>
			</div>

			{/* 中部双栏：年份归档统计 + 分类结构占比 */}
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
				{/* 年份分布 */}
				<div className="admin-card" style={{ padding: '14px 16px' }}>
					<div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<span>年份发文趋势</span>
						<span style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>按年汇总</span>
					</div>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
						{yearEntries.map(([year, count]) => {
							const pct = totalPosts > 0 ? Math.round((count / totalPosts) * 100) : 0
							return (
								<div key={year} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
									<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
										<span style={{ fontWeight: 500 }}>{year} 年</span>
										<span style={{ color: 'var(--admin-text-3)' }}>{count} 篇 ({pct}%)</span>
									</div>
									<div style={{ height: 4, background: 'var(--admin-bg-subtle)', borderRadius: 2, overflow: 'hidden' }}>
										<div
											style={{
												width: `${pct}%`,
												height: '100%',
												background: 'var(--admin-accent)',
												borderRadius: 2,
											}}
										/>
									</div>
								</div>
							)
						})}
					</div>
				</div>

				{/* 分类分布 */}
				<div className="admin-card" style={{ padding: '14px 16px' }}>
					<div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<span>分类权重占比</span>
						<span style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>共 {categoryEntries.length} 类</span>
					</div>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
						{categoryEntries.slice(0, 6).map(([cat, count]) => {
							const pct = totalPosts > 0 ? Math.round((count / totalPosts) * 100) : 0
							return (
								<div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
									<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
										<span style={{ fontWeight: 500 }}>{cat}</span>
										<span style={{ color: 'var(--admin-text-3)' }}>{count} 篇 ({pct}%)</span>
									</div>
									<div style={{ height: 4, background: 'var(--admin-bg-subtle)', borderRadius: 2, overflow: 'hidden' }}>
										<div
											style={{
												width: `${pct}%`,
												height: '100%',
												background: 'var(--admin-text-2)',
												borderRadius: 2,
											}}
										/>
									</div>
								</div>
							)
						})}
					</div>
				</div>
			</div>

			{/* 底部：近期博文快捷流 + Git 状态 */}
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
				{/* 近期博文 */}
				<div className="admin-card" style={{ padding: '14px 16px' }}>
					<div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<span>近期博文列表</span>
						<button
							type="button"
							className="admin-btn btn-ghost btn-sm"
							onClick={() => onNavigate('posts')}
							style={{ height: 22, fontSize: 11 }}
						>
							<span>全部 ({totalPosts})</span>
							<Icon icon="tabler:chevron-right" />
						</button>
					</div>

					<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
						{recentPosts.map(p => (
							<div
								key={p.path}
								style={{
									padding: '6px 8px',
									borderRadius: 4,
									background: 'var(--admin-bg-subtle)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									gap: 8,
									cursor: 'pointer',
								}}
								onClick={() => onNavigate('posts-edit', { path: p.path })}
							>
								<div style={{ flex: 1, minWidth: 0 }}>
									<div style={{ fontSize: 12, fontWeight: 500, color: 'var(--admin-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
										{p.title}
									</div>
									<div style={{ fontSize: 10, color: 'var(--admin-text-3)', display: 'flex', gap: 8, marginTop: 2 }}>
										<span>{p.date || '无日期'}</span>
										<span>{p.categories?.[0] || '未分类'}</span>
										<span>{p.wordCount} 字</span>
									</div>
								</div>
								<Icon icon="tabler:edit" style={{ fontSize: 13, color: 'var(--admin-text-3)' }} />
							</div>
						))}
					</div>
				</div>

				{/* Git 状态 */}
				{gitStatus && (
					<div className="admin-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
						<div>
							<div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
								<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
									<Icon icon="tabler:git-branch" style={{ fontSize: 14 }} />
									<span>Git 工作区状态</span>
								</div>
								<span className={`admin-badge ${gitStatus.hasChanges ? 'badge-warning' : 'badge-success'}`}>
									{gitStatus.hasChanges ? `${gitStatus.changes.length} 处变更` : '工作区洁净'}
								</span>
							</div>

							{gitStatus.hasChanges ? (
								<div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 110, overflowY: 'auto' }}>
									{gitStatus.changes.map((c, i) => (
										<div
											key={i}
											style={{
												fontSize: 10,
												fontFamily: 'var(--admin-font-mono)',
												padding: '2px 6px',
												background: 'var(--admin-bg-subtle)',
												borderRadius: 3,
												color: 'var(--admin-text-2)',
												border: '1px solid var(--admin-border)',
											}}
										>
											<strong style={{ color: c.status.includes('M') ? 'var(--admin-warning)' : 'var(--admin-success)', marginRight: 3 }}>
												{c.status}
											</strong>
											<span>{c.file}</span>
										</div>
									))}
								</div>
							) : (
								<div style={{ fontSize: 12, color: 'var(--admin-text-3)', padding: '12px 0' }}>
									本地所有改动已提交，暂无未保存变更。
								</div>
							)}
						</div>

						{gitStatus.recentCommits && gitStatus.recentCommits.length > 0 && (
							<div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: 8, marginTop: 8 }}>
								<div style={{ fontSize: 10, color: 'var(--admin-text-3)', marginBottom: 4 }}>最近提交：</div>
								<div style={{ fontSize: 11, fontFamily: 'var(--admin-font-mono)', color: 'var(--admin-text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
									{gitStatus.recentCommits[0]}
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	)
}

export default DashboardView

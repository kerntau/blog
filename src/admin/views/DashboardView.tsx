import React, { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import type { GitStatusData, PostMeta, StatsData } from '../types'
import { useToast } from '../components/Toast'

import appConfig from '../../app.config'

interface DashboardViewProps {
	onNavigate: (tab: string, params?: any) => void
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
	const { showToast } = useToast()
	const [stats, setStats] = useState<StatsData | null>(null)
	const [gitStatus, setGitStatus] = useState<GitStatusData | null>(null)
	const [recentPosts, setRecentPosts] = useState<PostMeta[]>([])
	const [loading, setLoading] = useState(true)

	// 统一博主身份与头像数据源
	const [authorProfile, setAuthorProfile] = useState({
		name: appConfig.author.name || 'kerntau',
		avatar: appConfig.author.avatar || '/avatar.webp',
		title: appConfig.title || 'kerntau',
		subtitle: appConfig.subtitle || '',
	})

	const loadData = async () => {
		setLoading(true)
		try {
			const [statsData, gitData, postsData, siteInfoData] = await Promise.all([
				adminApi.getStats(),
				adminApi.getGitStatus().catch(() => null),
				adminApi.getPosts().catch(() => []),
				adminApi.getSiteInfo().catch(() => null),
			])
			setStats(statsData)
			setGitStatus(gitData)
			setRecentPosts(postsData.slice(0, 6))

			if (siteInfoData && siteInfoData.authorAvatar) {
				setAuthorProfile({
					name: siteInfoData.authorName || appConfig.author.name,
					avatar: siteInfoData.authorAvatar || appConfig.author.avatar,
					title: siteInfoData.title || appConfig.title,
					subtitle: siteInfoData.subtitle || appConfig.subtitle,
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

	if (loading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
				<Icon icon="tabler:loader-2" style={{ fontSize: 24, color: 'var(--admin-text-3)', animation: 'spin 1s linear infinite' }} />
			</div>
		)
	}

	const totalPosts = stats?.postCount || 0
	const publishedCount = stats?.publishedCount || (totalPosts - (stats?.draftCount || 0))
	const draftCount = stats?.draftCount || 0
	const totalWords = stats?.totalWords || 0
	const totalFriends = stats?.friendCount || 0
	const totalCategories = stats?.categoryCount || 0
	const totalTags = stats?.tagCount || 0

	const yearEntries = Object.entries(stats?.years || {}).sort((a, b) => b[0].localeCompare(a[0]))
	const categoryEntries = Object.entries(stats?.categories || {}).sort((a, b) => b[1] - a[1])

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
			{/* 顶部：原生博主身份与站点运行横幅 */}
			<div
				className="admin-card"
				style={{
					padding: '20px 24px',
					background: 'var(--admin-surface)',
					position: 'relative',
					overflow: 'hidden',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					flexWrap: 'wrap',
					gap: 16,
				}}
			>
				{/* 装饰性背景微光 */}
				<div
					style={{
						position: 'absolute',
						right: -40,
						top: -40,
						width: 220,
						height: 220,
						background: 'var(--admin-accent-soft)',
						borderRadius: '50%',
						filter: 'blur(40px)',
						pointerEvents: 'none',
					}}
				/>

				<div style={{ display: 'flex', alignItems: 'center', gap: 16, zIndex: 1 }}>
					<img
						src={authorProfile.avatar}
						alt={authorProfile.name}
						style={{
							width: 56,
							height: 56,
							borderRadius: '50%',
							objectFit: 'cover',
							border: '2px solid var(--admin-accent)',
							boxShadow: '0 0 16px var(--admin-accent-soft)',
						}}
						onError={e => (e.currentTarget.src = '/favicon.ico')}
					/>
					<div>
						<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							<span style={{ fontSize: 18, fontWeight: 700, color: 'var(--admin-text-1)', letterSpacing: '-0.02em' }}>
								{authorProfile.name} 的内容管理工坊
							</span>
							<span className="admin-badge badge-primary">Local CMS</span>
						</div>
						<div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 4 }}>
							欢迎回来！所有内容编辑均支持前台像素级同源实时渲染与原子备份。
						</div>
					</div>
				</div>

				<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', zIndex: 1 }}>
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
						onClick={() => onNavigate('preview-center')}
					>
						<Icon icon="tabler:device-laptop" />
						<span>预览中心</span>
					</button>
					<button
						type="button"
						className="admin-btn btn-secondary btn-sm"
						onClick={() => onNavigate('seo')}
					>
						<Icon icon="tabler:world-cog" />
						<span>站点与头像</span>
					</button>
					<button
						type="button"
						className="admin-btn btn-secondary btn-sm"
						onClick={() => onNavigate('backup')}
					>
						<Icon icon="tabler:database" />
						<span>全量快照</span>
					</button>
				</div>
			</div>

			{/* 6 格横向饱满指标网格 */}
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
				<div className="admin-card" style={{ padding: '12px 14px' }}>
					<div style={{ fontSize: 11, color: 'var(--admin-text-3)', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<span>已发布博文</span>
						<Icon icon="tabler:file-text" style={{ fontSize: 14, color: 'var(--admin-success)' }} />
					</div>
					<div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: 'var(--admin-text-1)', letterSpacing: '-0.02em' }}>
						{publishedCount.toLocaleString()}
					</div>
					<div style={{ fontSize: 10, color: 'var(--admin-text-4)', marginTop: 2 }}>
						草稿箱 {draftCount} 篇
					</div>
				</div>

				<div className="admin-card" style={{ padding: '12px 14px' }}>
					<div style={{ fontSize: 11, color: 'var(--admin-text-3)', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<span>全站字数</span>
						<Icon icon="tabler:writing" style={{ fontSize: 14, color: 'var(--admin-accent)' }} />
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
						<Icon icon="tabler:users-group" style={{ fontSize: 14, color: '#33bbaa' }} />
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
						<Icon icon="tabler:category" style={{ fontSize: 14, color: '#ffaa33' }} />
					</div>
					<div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: 'var(--admin-text-1)', letterSpacing: '-0.02em' }}>
						{totalCategories}
					</div>
					<div style={{ fontSize: 10, color: 'var(--admin-text-4)', marginTop: 2 }}>
						专属颜色与图标定义
					</div>
				</div>

				<div className="admin-card" style={{ padding: '12px 14px' }}>
					<div style={{ fontSize: 11, color: 'var(--admin-text-3)', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<span>标签索引</span>
						<Icon icon="tabler:tags" style={{ fontSize: 14, color: '#ff7733' }} />
					</div>
					<div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: 'var(--admin-text-1)', letterSpacing: '-0.02em' }}>
						{totalTags}
					</div>
					<div style={{ fontSize: 10, color: 'var(--admin-text-4)', marginTop: 2 }}>
						知识图谱关键词
					</div>
				</div>

				<div className="admin-card" style={{ padding: '12px 14px' }}>
					<div style={{ fontSize: 11, color: 'var(--admin-text-3)', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<span>本地数据健康</span>
						<Icon icon="tabler:shield-check" style={{ fontSize: 14, color: 'var(--admin-success)' }} />
					</div>
					<div style={{ fontSize: 16, fontWeight: 700, marginTop: 4, color: 'var(--admin-success)', letterSpacing: '-0.02em' }}>
						正常就绪
					</div>
					<div style={{ fontSize: 10, color: 'var(--admin-text-4)', marginTop: 2 }}>
						已接入实时同源渲染
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
						<button
							type="button"
							className="admin-btn btn-ghost btn-sm"
							onClick={() => onNavigate('categories')}
							style={{ height: 20, fontSize: 11 }}
						>
							<span>管理分类</span>
							<Icon icon="tabler:chevron-right" />
						</button>
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
										{p.draft && <span className="admin-badge badge-warning" style={{ fontSize: 9 }}>草稿</span>}
									</div>
								</div>
								<Icon icon="tabler:edit" style={{ fontSize: 13, color: 'var(--admin-text-3)' }} />
							</div>
						))}
					</div>
				</div>

				{/* Git 工作区状态 */}
				{gitStatus && (
					<div className="admin-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
						{/* 头部：标题、分支与操作栏 */}
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
								<div style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--admin-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
									<Icon icon="tabler:git-branch" style={{ fontSize: 16, color: 'var(--admin-accent)' }} />
								</div>
								<span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--admin-text-1)', whiteSpace: 'nowrap' }}>Git 工作区状态</span>
								<span
									style={{
										fontSize: 11,
										color: 'var(--admin-text-2)',
										fontFamily: 'var(--admin-font-mono)',
										background: 'var(--admin-bg-subtle)',
										padding: '1px 7px',
										borderRadius: 4,
										border: '1px solid var(--admin-border)',
										display: 'inline-flex',
										alignItems: 'center',
										gap: 4,
									}}
								>
									<Icon icon="tabler:git-fork" style={{ fontSize: 11, color: 'var(--admin-text-3)' }} />
									{gitStatus.branch || 'main'}
								</span>
							</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
								<span className={`admin-badge ${gitStatus.hasChanges ? 'badge-warning' : 'badge-success'}`}>
									{gitStatus.hasChanges ? `${gitStatus.changes.length} 项变更待提交` : '工作区整洁'}
								</span>
								<button
									type="button"
									className="admin-btn btn-ghost btn-sm"
									style={{ padding: '3px 8px', height: 24, fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 4 }}
									onClick={() => onNavigate('console')}
									title="前往运维控制台查看详情与提交"
								>
									<span>前往提交</span>
									<Icon icon="tabler:arrow-right" style={{ fontSize: 13 }} />
								</button>
							</div>
						</div>

						{/* 中间：变更列表 */}
						{gitStatus.hasChanges ? (
							<div
								style={{
									display: 'flex',
									flexDirection: 'column',
									gap: 4,
									maxHeight: 160,
									overflowY: 'auto',
									background: 'var(--admin-bg-subtle)',
									padding: '6px',
									borderRadius: 8,
									border: '1px solid var(--admin-border)',
								}}
							>
								{gitStatus.changes.map((c, i) => {
									const isMod = c.status.includes('M')
									const isAdd = c.status.includes('A') || c.status.includes('?')
									const isDel = c.status.includes('D')
									const badgeBg = isMod ? 'rgba(245, 158, 11, 0.15)' : isAdd ? 'rgba(34, 197, 94, 0.15)' : isDel ? 'rgba(239, 68, 68, 0.15)' : 'rgba(148, 163, 184, 0.15)'
									const badgeColor = isMod ? '#d97706' : isAdd ? '#16a34a' : isDel ? '#dc2626' : '#64748b'
									
									// 智能分离路径与文件名
									const lastSlash = c.file.lastIndexOf('/')
									const dirPath = lastSlash !== -1 ? c.file.slice(0, lastSlash + 1) : ''
									const fileName = lastSlash !== -1 ? c.file.slice(lastSlash + 1) : c.file

									return (
										<div
											key={i}
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: 8,
												padding: '4px 8px',
												borderRadius: 5,
												fontSize: 11.5,
												background: 'var(--admin-surface)',
												border: '1px solid var(--admin-border)',
												transition: 'background 0.15s ease',
											}}
											title={c.file}
										>
											<span
												style={{
													fontSize: 10.5,
													fontWeight: 700,
													fontFamily: 'var(--admin-font-mono)',
													padding: '1px 6px',
													borderRadius: 3,
													background: badgeBg,
													color: badgeColor,
													flexShrink: 0,
													minWidth: 22,
													textAlign: 'center',
													lineHeight: 1.3,
												}}
											>
												{c.status.trim() || 'M'}
											</span>
											<div
												style={{
													fontFamily: 'var(--admin-font-mono)',
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													whiteSpace: 'nowrap',
													flex: 1,
													lineHeight: 1.4,
												}}
											>
												{dirPath && <span style={{ color: 'var(--admin-text-3)', fontSize: '0.95em' }}>{dirPath}</span>}
												<span style={{ color: 'var(--admin-text-1)', fontWeight: 550 }}>{fileName}</span>
											</div>
										</div>
									)
								})}
							</div>
						) : (
							<div style={{ fontSize: 12, color: 'var(--admin-text-3)', padding: '10px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
								<Icon icon="tabler:circle-check" style={{ color: 'var(--admin-success)', fontSize: 16 }} />
								<span>本地工作区状态整洁，所有改动均已提交。</span>
							</div>
						)}

						{/* 底部：最近提交记录 */}
						{gitStatus.recentCommits && gitStatus.recentCommits.length > 0 && (() => {
							const commitLine = gitStatus.recentCommits[0]
							const firstSpace = commitLine.indexOf(' ')
							const hash = firstSpace !== -1 ? commitLine.slice(0, firstSpace) : commitLine
							const msg = firstSpace !== -1 ? commitLine.slice(firstSpace + 1) : ''

							return (
								<div
									style={{
										borderTop: '1px solid var(--admin-border)',
										paddingTop: 8,
										display: 'flex',
										alignItems: 'center',
										gap: 8,
										fontSize: 11,
										minWidth: 0,
									}}
								>
									<div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--admin-text-3)', flexShrink: 0 }}>
										<Icon icon="tabler:git-commit" style={{ fontSize: 13 }} />
										<span>最近提交:</span>
									</div>
									<div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
										<span
											style={{
												fontFamily: 'var(--admin-font-mono)',
												fontSize: 10.5,
												fontWeight: 600,
												color: 'var(--admin-accent)',
												background: 'var(--admin-accent-soft)',
												padding: '1px 5px',
												borderRadius: 3,
												flexShrink: 0,
											}}
										>
											{hash}
										</span>
										<span
											style={{
												fontFamily: 'var(--admin-font-mono)',
												color: 'var(--admin-text-2)',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap',
												flex: 1,
											}}
											title={commitLine}
										>
											{msg}
										</span>
									</div>
								</div>
							)
						})()}
					</div>
				)}
			</div>
		</div>
	)
}

export default DashboardView

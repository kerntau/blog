import React, { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { adminApi } from '../api'
import type { GitStatusData, PostMeta, StatsData, AuditLogItem, IntegrityCheckResult } from '../types'
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
	const [recentPosts, setRecentPosts] = useState<PostMeta[]>([])
	const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([])
	const [integrity, setIntegrity] = useState<IntegrityCheckResult | null>(null)
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
			const [statsData, gitData, postsData, siteInfoData, logsData, integrityData] = await Promise.all([
				adminApi.getStats(),
				adminApi.getGitStatus().catch(() => null),
				adminApi.getPosts().catch(() => []),
				adminApi.getSiteInfo().catch(() => null),
				adminApi.getAuditLogs().catch(() => []),
				adminApi.checkIntegrity().catch(() => null),
			])
			setStats(statsData)
			setGitStatus(gitData)
			setRecentPosts(postsData.slice(0, 5))
			setAuditLogs(logsData.slice(0, 6))
			setIntegrity(integrityData)

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

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
			{/* 顶部：博主身份与站点运行概况横幅 */}
			<div
				className="admin-card"
				style={{
					padding: '18px 24px',
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
				<div style={{ display: 'flex', alignItems: 'center', gap: 16, zIndex: 1 }}>
					<img
						src={authorProfile.avatar}
						alt={authorProfile.name}
						style={{
							width: 52,
							height: 52,
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
								{authorProfile.title} 管理中心
							</span>
							<span className="admin-badge badge-primary">Control Center</span>
						</div>
						<div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 4 }}>
							已持续平稳运行 {timeElapse(appConfig.timeEstablished)}，所有配置前后台同源且具备实时双向渲染。
						</div>
					</div>
				</div>

				{/* 顶部快捷跳转 */}
				<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', zIndex: 1 }}>
					<button
						type="button"
						className="admin-btn btn-primary btn-sm"
						onClick={() => onNavigate('posts-new')}
						style={{ padding: '6px 14px', fontWeight: 600 }}
					>
						<Icon icon="tabler:plus" />
						<span>新建文章</span>
					</button>
					<button
						type="button"
						className="admin-btn btn-secondary btn-sm"
						onClick={() => onNavigate('settings')}
					>
						<Icon icon="tabler:settings" />
						<span>站点设置</span>
					</button>
					<button
						type="button"
						className="admin-btn btn-secondary btn-sm"
						onClick={() => onNavigate('console')}
					>
						<Icon icon="tabler:terminal-2" />
						<span>构建发布</span>
					</button>
				</div>
			</div>

			{/* 第一层：网站状态核心指标网格 */}
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
				<div className="admin-card" style={{ padding: '12px 14px' }}>
					<div style={{ fontSize: 11, color: 'var(--admin-text-3)', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<span>已发布文章</span>
						<Icon icon="tabler:file-text" style={{ fontSize: 15, color: 'var(--admin-success)' }} />
					</div>
					<div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: 'var(--admin-text-1)', letterSpacing: '-0.02em' }}>
						{publishedCount.toLocaleString()}
					</div>
					<div style={{ fontSize: 10, color: 'var(--admin-text-4)', marginTop: 2 }}>
						草稿箱 {draftCount} 篇
					</div>
				</div>

				<div className="admin-card" style={{ padding: '12px 14px' }}>
					<div style={{ fontSize: 11, color: 'var(--admin-text-3)', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<span>全站总字数</span>
						<Icon icon="tabler:writing" style={{ fontSize: 15, color: 'var(--admin-accent)' }} />
					</div>
					<div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: 'var(--admin-text-1)', letterSpacing: '-0.02em' }}>
						{totalWords.toLocaleString()}
					</div>
					<div style={{ fontSize: 10, color: 'var(--admin-text-4)', marginTop: 2 }}>
						篇均约 {totalPosts > 0 ? Math.round(totalWords / totalPosts) : 0} 字
					</div>
				</div>

				<div className="admin-card" style={{ padding: '12px 14px' }}>
					<div style={{ fontSize: 11, color: 'var(--admin-text-3)', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<span>友链博友</span>
						<Icon icon="tabler:users-group" style={{ fontSize: 15, color: '#33bbaa' }} />
					</div>
					<div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: 'var(--admin-text-1)', letterSpacing: '-0.02em' }}>
						{totalFriends.toLocaleString()}
					</div>
					<div style={{ fontSize: 10, color: 'var(--admin-text-4)', marginTop: 2 }}>
						已收录博友站点
					</div>
				</div>

				<div className="admin-card" style={{ padding: '12px 14px' }}>
					<div style={{ fontSize: 11, color: 'var(--admin-text-3)', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<span>分类与专栏</span>
						<Icon icon="tabler:category" style={{ fontSize: 15, color: '#ffaa33' }} />
					</div>
					<div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: 'var(--admin-text-1)', letterSpacing: '-0.02em' }}>
						{totalCategories}
					</div>
					<div style={{ fontSize: 10, color: 'var(--admin-text-4)', marginTop: 2 }}>
						共 {totalTags} 个知识标签
					</div>
				</div>

				<div className="admin-card" style={{ padding: '12px 14px' }}>
					<div style={{ fontSize: 11, color: 'var(--admin-text-3)', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<span>数据体检状态</span>
						<Icon icon="tabler:shield-check" style={{ fontSize: 15, color: integrity?.healthy ? 'var(--admin-success)' : 'var(--admin-warning)' }} />
					</div>
					<div style={{ fontSize: 16, fontWeight: 700, marginTop: 4, color: integrity?.healthy ? 'var(--admin-success)' : 'var(--admin-warning)', letterSpacing: '-0.02em' }}>
						{integrity?.healthy ? '数据正常' : `${integrity?.issueCount || 0} 项待治理`}
					</div>
					<div style={{ fontSize: 10, color: 'var(--admin-text-4)', marginTop: 2 }}>
						Slug与元数据完整
					</div>
				</div>

				<div className="admin-card" style={{ padding: '12px 14px' }}>
					<div style={{ fontSize: 11, color: 'var(--admin-text-3)', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<span>Git 变更状态</span>
						<Icon icon="tabler:git-branch" style={{ fontSize: 15, color: 'var(--admin-accent)' }} />
					</div>
					<div style={{ fontSize: 16, fontWeight: 700, marginTop: 4, color: gitStatus?.hasChanges ? 'var(--admin-warning)' : 'var(--admin-text-1)' }}>
						{gitStatus?.hasChanges ? `${gitStatus.changes.length} 个未提交` : '工作区整洁'}
					</div>
					<div style={{ fontSize: 10, color: 'var(--admin-text-4)', marginTop: 2 }}>
						本地 Git 版本仓库
					</div>
				</div>
			</div>

			{/* 第二层与第三层：双栏排布（左侧：最近内容 / 右侧：系统健康与快捷操作） */}
			<div style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 1.4fr) minmax(320px, 1fr)', gap: 14 }}>
				{/* 第二层：最近内容 */}
				<div className="admin-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<div className="admin-section-title">
							<Icon icon="tabler:clock-edit" />
							<span>最近编辑与发布内容</span>
						</div>
						<button
							type="button"
							className="admin-btn btn-ghost btn-sm"
							onClick={() => onNavigate('posts')}
						>
							<span>全部文章 »</span>
						</button>
					</div>

					<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
						{recentPosts.length === 0 ? (
							<div style={{ color: 'var(--admin-text-3)', fontSize: 12, padding: '20px 0', textAlign: 'center' }}>
								暂无文章
							</div>
						) : (
							recentPosts.map(p => (
								<div
									key={p.path}
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										padding: '10px 12px',
										borderRadius: 6,
										background: 'var(--admin-surface-hover)',
										border: '1px solid var(--admin-border)',
									}}
								>
									<div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
										<span
											className={`admin-badge ${p.draft ? 'badge-warning' : 'badge-primary'}`}
											style={{ fontSize: 10, flexShrink: 0 }}
										>
											{p.draft ? '草稿' : '已发布'}
										</span>
										<div style={{ overflow: 'hidden' }}>
											<div
												style={{
													fontSize: 13,
													fontWeight: 600,
													color: 'var(--admin-text-1)',
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													whiteSpace: 'nowrap',
												}}
												title={p.title}
											>
												{p.title}
											</div>
											<div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginTop: 2 }}>
												{p.date || '未定日期'} · {p.categories?.[0] || '未分类'} · {p.wordCount} 字
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
							))
						)}
					</div>
				</div>

				{/* 第三层 & 第四层：系统健康与常用快捷操作 */}
				<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
					{/* 快捷操作卡片 */}
					<div className="admin-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
						<div className="admin-section-title">
							<Icon icon="tabler:bolt" />
							<span>常用快捷操作</span>
						</div>

						<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
							<button
								type="button"
								className="admin-btn btn-secondary btn-sm"
								onClick={() => onNavigate('posts-new')}
								style={{ justifyContent: 'flex-start', padding: '8px 10px' }}
							>
								<Icon icon="tabler:plus" style={{ color: 'var(--admin-accent)' }} />
								<span>新建博文</span>
							</button>

							<button
								type="button"
								className="admin-btn btn-secondary btn-sm"
								onClick={() => onNavigate('assets')}
								style={{ justifyContent: 'flex-start', padding: '8px 10px' }}
							>
								<Icon icon="tabler:photo" style={{ color: '#33bbaa' }} />
								<span>媒体资源库</span>
							</button>

							<button
								type="button"
								className="admin-btn btn-secondary btn-sm"
								onClick={() => onNavigate('feeds')}
								style={{ justifyContent: 'flex-start', padding: '8px 10px' }}
							>
								<Icon icon="tabler:users-group" style={{ color: '#ffaa33' }} />
								<span>管理友链</span>
							</button>

							<button
								type="button"
								className="admin-btn btn-secondary btn-sm"
								onClick={() => onNavigate('navigation')}
								style={{ justifyContent: 'flex-start', padding: '8px 10px' }}
							>
								<Icon icon="tabler:compass" style={{ color: '#7777ff' }} />
								<span>导航管理</span>
							</button>

							<button
								type="button"
								className="admin-btn btn-secondary btn-sm"
								onClick={() => onNavigate('widgets')}
								style={{ justifyContent: 'flex-start', padding: '8px 10px' }}
							>
								<Icon icon="tabler:layout-sidebar" style={{ color: '#ff5577' }} />
								<span>侧栏挂件</span>
							</button>

							<button
								type="button"
								className="admin-btn btn-secondary btn-sm"
								onClick={() => onNavigate('settings')}
								style={{ justifyContent: 'flex-start', padding: '8px 10px' }}
							>
								<Icon icon="tabler:settings" style={{ color: 'var(--admin-accent)' }} />
								<span>全站设置</span>
							</button>
						</div>
					</div>

					{/* 系统运维健康卡片 */}
					<div className="admin-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
						<div className="admin-section-title">
							<Icon icon="tabler:activity" />
							<span>系统运维状态</span>
						</div>

						<div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
							<div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--admin-border)' }}>
								<span style={{ color: 'var(--admin-text-3)' }}>本地 API 服务</span>
								<span style={{ color: 'var(--admin-success)', fontWeight: 600 }}>在线 (端口 3001)</span>
							</div>
							<div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--admin-border)' }}>
								<span style={{ color: 'var(--admin-text-3)' }}>全站元数据体检</span>
								<span style={{ color: integrity?.healthy ? 'var(--admin-success)' : 'var(--admin-warning)', fontWeight: 600 }}>
									{integrity?.healthy ? '通过 (0 错误)' : `${integrity?.issueCount} 个异常项`}
								</span>
							</div>
							<div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
								<span style={{ color: 'var(--admin-text-3)' }}>前台运行端口</span>
								<span style={{ color: 'var(--admin-text-1)', fontWeight: 600 }}>http://localhost:3000</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* 第五层：最近管理活动审计日志 */}
			<div className="admin-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
					<div className="admin-section-title">
						<Icon icon="tabler:history" />
						<span>最近管理操作活动流水 (Audit Log)</span>
					</div>
					<button
						type="button"
						className="admin-btn btn-ghost btn-sm"
						onClick={() => onNavigate('backup')}
					>
						<span>完整审计记录 »</span>
					</button>
				</div>

				<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
					{auditLogs.length === 0 ? (
						<div style={{ color: 'var(--admin-text-3)', fontSize: 12, padding: '10px 0', textAlign: 'center' }}>
							暂无近期操作日志
						</div>
					) : (
						auditLogs.map(log => (
							<div
								key={log.id}
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									padding: '6px 10px',
									borderRadius: 4,
									background: 'var(--admin-bg-subtle)',
									fontSize: 12,
								}}
							>
								<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
									<span className="admin-badge badge-secondary" style={{ fontSize: 10 }}>{log.action}</span>
									<span style={{ color: 'var(--admin-text-2)' }}>{log.details || log.target}</span>
								</div>
								<span style={{ color: 'var(--admin-text-3)', fontSize: 11 }}>{log.timestamp}</span>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	)
}

export default DashboardView

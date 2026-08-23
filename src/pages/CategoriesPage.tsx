import { useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@iconify/react'
import { getPostsByStemPrefix } from '@/lib/content'
import { useLayoutStore } from '@/stores/layout'
import { useArticleSort, useCategory } from '@/hooks/useArticle'
import { getCategoryColor, getCategoryIcon } from '@/utils/article'
import PostOrderToggle from '@/components/post/PostOrderToggle'
import PostArticle from '@/components/post/PostArticle'
import UtilLink from '@/components/util/UtilLink'
import appConfig from '@/app.config'
import styles from './CategoriesPage.module.scss'

export default function CategoriesPage() {
	const allPosts = useMemo(() => getPostsByStemPrefix('posts/'), [])
	const setAside = useLayoutStore(s => s.setAside)

	useEffect(() => {
		const widgets = (appConfig.widgets as any)?.pageAsideMappings?.categories || (appConfig.widgets as any)?.pageAsideMappings?.home || ['blog-weather', 'blog-stats', 'blog-tech', 'comm-group']
		setAside(widgets)
	}, [setAside])

	const { listSorted, isAscending, setIsAscending, sortOrder, setSortOrder } = useArticleSort(allPosts)
	const { category, setCategory, categories, listCategorized } = useCategory(listSorted, {
		bindQuery: 'category',
	})

	// 分类矩阵元数据汇总
	const categorySummaries = useMemo(() => {
		const map: Record<string, {
			name: string
			icon: string
			color: string
			count: number
			latestPost?: string
		}> = {}

		for (const post of allPosts) {
			const postCat = post.categories?.[0] || '未分类'
			if (!map[postCat]) {
				map[postCat] = {
					name: postCat,
					icon: getCategoryIcon(postCat),
					color: getCategoryColor(postCat) || '#33aaff',
					count: 0,
					latestPost: post.title,
				}
			}
			map[postCat]!.count++
		}

		return Object.values(map).sort((a, b) => b.count - a.count)
	}, [allPosts])

	const activeCategoryMeta = useMemo(() => {
		if (!category) return null
		return categorySummaries.find(c => c.name === category) || {
			name: category,
			icon: getCategoryIcon(category),
			color: getCategoryColor(category) || '#33aaff',
			count: listCategorized.length,
		}
	}, [category, categorySummaries, listCategorized])

	return (
		<div className={styles.categoriesPage}>
			{/* 分类矩阵卡片网格 */}
			<div>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
					<h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
						<UtilLink className="mobile-only" to="/" title="主页">
							<Icon icon="tabler:chevron-left" />
						</UtilLink>
						<Icon icon="tabler:category" style={{ color: 'var(--c-primary)' }} />
						<span>全站分类</span>
						<span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--c-text-3)' }}>
							({categorySummaries.length} 个分类)
						</span>
					</h1>
				</div>

				<ul className={styles.categoryCardsGrid}>
					{categorySummaries.map((cat) => {
						const isSelected = category === cat.name
						return (
							<li
								key={cat.name}
								className={`${styles.categoryCard} ${isSelected ? styles.active : ''}`}
								style={{
									'--cat-color': cat.color,
									'--cat-bg-tint': `${cat.color}15`,
									'--cat-border-tint': `${cat.color}35`,
								} as any}
								onClick={() => {
									if (isSelected) {
										setCategory(undefined)
									}
									else {
										setCategory(cat.name)
									}
								}}
							>
								<div className={styles.cardHeader}>
									<div className={styles.iconWrapper}>
										<Icon icon={cat.icon} />
									</div>
									<div className={styles.cardTitleArea}>
										<h2 className={styles.categoryName}>{cat.name}</h2>
										<span className={styles.postCount}>{cat.count} 篇文章</span>
									</div>
									{isSelected && (
										<Icon icon="tabler:check" style={{ color: cat.color, fontSize: 18 }} />
									)}
								</div>

								{cat.latestPost && (
									<div className={styles.cardLatestPost}>
										<Icon icon="tabler:file-text" />
										<span>{cat.latestPost}</span>
									</div>
								)}
							</li>
						)
					})}
				</ul>
			</div>

			{/* 分类筛选与排序控制条 */}
			<div className={styles.categorySectionHeader}>
				<div className={styles.currentCatTitle}>
					{activeCategoryMeta ? (
						<>
							<span style={{ color: activeCategoryMeta.color, display: 'inline-flex', alignItems: 'center' }}>
								<Icon icon={activeCategoryMeta.icon} />
							</span>
							<span>{activeCategoryMeta.name}</span>
							<span style={{ fontSize: '0.9rem', color: 'var(--c-text-3)', fontWeight: 500 }}>
								({listCategorized.length} 篇)
							</span>
						</>
					) : (
						<>
							<Icon icon="tabler:files" style={{ color: 'var(--c-primary)' }} />
							<span>全部博文</span>
							<span style={{ fontSize: '0.9rem', color: 'var(--c-text-3)', fontWeight: 500 }}>
								({listSorted.length} 篇)
							</span>
						</>
					)}
				</div>

				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					{category && (
						<button
							type="button"
							className={styles.allBtn}
							onClick={() => setCategory(undefined)}
						>
							<Icon icon="tabler:x" />
							<span>清除筛选</span>
						</button>
					)}
					<PostOrderToggle
						isAscending={isAscending}
						onIsAscendingChange={setIsAscending}
						sortOrder={sortOrder}
						onSortOrderChange={setSortOrder}
						category={category}
						onCategoryChange={setCategory}
						categories={categories}
					/>
				</div>
			</div>

			{/* 文章列表展示 */}
			<menu className={styles.postList}>
				<AnimatePresence mode="wait">
					<motion.div
						key={`${category || 'all'}-${sortOrder}-${isAscending}`}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						transition={{ duration: 0.2, ease: 'easeOut' }}
						style={{ display: 'contents' }}
					>
						{listCategorized.length === 0 ? (
							<div className={styles.emptyTip}>
								<Icon icon="tabler:folder-off" />
								<span>该分类下暂无文章</span>
							</div>
						) : (
							listCategorized.map(article => (
								<div key={article.path}>
									<PostArticle
										{...article}
										to={article.path}
										useUpdated={sortOrder === 'updated'}
									/>
								</div>
							))
						)}
					</motion.div>
				</AnimatePresence>
			</menu>
		</div>
	)
}

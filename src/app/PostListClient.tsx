'use client'

import { useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { orderBy } from 'es-toolkit/array'
import usePagination from '../hooks/usePagination'
import { useCategory, useArticleSort } from '../hooks/useArticle'
import { useLayoutStore } from '../stores/layout'
import PostSlide from '../components/post/PostSlide'
import PostOrderToggle from '../components/post/PostOrderToggle'
import PostArticle from '../components/post/PostArticle'
import ZPagination from '../components/partial/ZPagination'
import ZSecret from '../components/partial/ZSecret'
import UtilLink from '../components/util/UtilLink'
import UtilHydrateSafe from '../components/util/UtilHydrateSafe'
import { Icon } from '@iconify/react'
import type { ArticleProps } from '../types/article'
import styles from './PostListClient.module.scss'

export default function PostListClient({ allPosts, previewCount }: { allPosts: ArticleProps[], previewCount: number }) {
	const setAside = useLayoutStore(s => s.setAside)

	useEffect(() => {
		setAside(['blog-stats', 'blog-tech', 'comm-group'])
	}, [setAside])

	const { listSorted, isAscending, setIsAscending, sortOrder, setSortOrder } = useArticleSort(allPosts, { bindDirectionQuery: 'asc', bindOrderQuery: 'sort' })
	
	const { category, setCategory, categories, listCategorized } = useCategory(listSorted, { bindQuery: 'category' })
	
	const { page, setPage, totalPages, listPaged } = usePagination(listCategorized, { bindQuery: 'page' })

	useEffect(() => {
		setPage(1)
	}, [category])

	const listRecommended = useMemo(() => orderBy(
		allPosts.filter(item => item.recommend !== undefined && item.recommend !== null),
		['recommend', 'date'],
		['desc']
	), [allPosts])

	return (
		<UtilHydrateSafe>
			{listRecommended.length > 0 && page === 1 && !category && (
				<PostSlide list={listRecommended} />
			)}

			<div className={styles.postList}>
				<PostOrderToggle
					isAscending={isAscending}
					onIsAscendingChange={setIsAscending}
					sortOrder={sortOrder}
					onSortOrderChange={setSortOrder}
					category={category}
					onCategoryChange={setCategory}
					categories={categories}
				>
					<ZSecret>
						{previewCount > 0 && (
							<UtilLink to="/preview" className="preview-entrance">
								<Icon icon="tabler:shield-lock" />
								查看预览文章
							</UtilLink>
						)}
					</ZSecret>
				</PostOrderToggle>

				<motion.menu layout className={styles.postListContent}>
					<AnimatePresence mode="popLayout" initial={false}>
						{listPaged.map((article, index) => (
							<motion.div
								key={article.path}
								layout
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
								transition={{
									type: 'spring',
									stiffness: 400,
									damping: 35,
									mass: 1,
									opacity: { duration: 0.25 },
									delay: index * 0.02,
								}}
							>
								<PostArticle
									{...article}
									to={article.path}
									useUpdated={sortOrder === 'updated'}
									priority={index < 2}
								/>
							</motion.div>
						))}
					</AnimatePresence>
				</motion.menu>

				<ZPagination page={page} setPage={setPage} totalPages={totalPages} sticky avoid />
			</div>
		</UtilHydrateSafe>
	)
}

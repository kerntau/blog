import { useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { orderBy } from 'es-toolkit/array'
import { Icon } from '@iconify/react'
import { getPostsByStemPrefix } from '@/lib/content'
import usePagination from '@/hooks/usePagination'
import { useCategory, useArticleSort } from '@/hooks/useArticle'
import { useLayoutStore } from '@/stores/layout'
import BlogHeader from '@/components/blog/BlogHeader'
import PostSlide from '@/components/post/PostSlide'
import PostOrderToggle from '@/components/post/PostOrderToggle'
import PostArticle from '@/components/post/PostArticle'
import ZPagination from '@/components/partial/ZPagination'
import ZSecret from '@/components/partial/ZSecret'
import UtilLink from '@/components/util/UtilLink'
import styles from './HomePage.module.scss'

export default function HomePage() {
	const allPosts = useMemo(() => getPostsByStemPrefix('posts/'), [])
	const previewCount = useMemo(() => getPostsByStemPrefix('previews/').length, [])

	const setAside = useLayoutStore(s => s.setAside)

	useEffect(() => {
		setAside(['blog-stats', 'blog-tech', 'comm-group'])
	}, [setAside])

	const { listSorted, isAscending, setIsAscending, sortOrder, setSortOrder } = useArticleSort(allPosts, {
		bindDirectionQuery: 'asc',
		bindOrderQuery: 'sort',
	})

	const { category, setCategory, categories, listCategorized } = useCategory(listSorted, {
		bindQuery: 'category',
	})

	const { page, setPage, totalPages, listPaged } = usePagination(listCategorized, {
		bindQuery: 'page',
	})

	useEffect(() => {
		setPage(1)
	}, [category, setPage])

	const listRecommended = useMemo(() => {
		const withRecommend = allPosts.filter(item => item.recommend !== undefined && item.recommend !== null)
		return orderBy(withRecommend, ['recommend', 'date'], ['desc'])
	}, [allPosts])

	return (
		<>
			<BlogHeader className="mobile-only" as="h1" to="/" />

			{listRecommended.length > 0 && page === 1 && !category && (
				<PostSlide list={listRecommended} />
			)}

			<div className={styles.homePage}>
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
								查看预览
							</UtilLink>
						)}
					</ZSecret>
				</PostOrderToggle>

				<menu className={`${styles.homePageContent} proper-height`}>
					<AnimatePresence mode="wait">
						<motion.div
							key={`${category || 'all'}-${sortOrder}-${isAscending}-${page}`}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.2, ease: 'easeOut' }}
							style={{ display: 'contents' }}
						>
							{listPaged.map((article, index) => (
								<PostArticle
									key={article.path}
									{...article}
									to={article.path}
									useUpdated={sortOrder === 'updated'}
									priority={index < 2}
								/>
							))}
						</motion.div>
					</AnimatePresence>
				</menu>

				<ZPagination page={page} setPage={setPage} totalPages={totalPages} sticky avoid />
			</div>
		</>
	)
}

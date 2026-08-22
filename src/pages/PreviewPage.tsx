import { useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@iconify/react'
import { getPostsByStemPrefix } from '@/lib/content'
import { useLayoutStore } from '@/stores/layout'
import { useArticleSort, useCategory } from '@/hooks/useArticle'
import PostOrderToggle from '@/components/post/PostOrderToggle'
import PostArticle from '@/components/post/PostArticle'
import UtilLink from '@/components/util/UtilLink'
import styles from './PreviewPage.module.scss'

export default function PreviewPage() {
	const allPosts = useMemo(() => getPostsByStemPrefix('previews/'), [])
	const setAside = useLayoutStore(s => s.setAside)

	useEffect(() => {
		setAside(['blog-log'])
	}, [setAside])

	const { listSorted, isAscending, setIsAscending, sortOrder, setSortOrder } = useArticleSort(allPosts)
	const { category, setCategory, categories, listCategorized } = useCategory(listSorted)

	return (
		<div className={styles.preview}>
			<div className={styles.previewHeader}>
				<h1>
					<UtilLink className="mobile-only" to="/" title="主页">
						<Icon icon="tabler:chevron-left" />
					</UtilLink>
					预览
				</h1>
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
			<p>勇敢的探索者。这里是一些尚未发布的文章。</p>

			<motion.menu layout className={`${styles.previewList} proper-height`}>
				<AnimatePresence mode="popLayout">
					{listCategorized.map((article, index) => (
						<motion.div
							layout
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 30, scale: 0.95 }}
							transition={{ 
								duration: 0.2, 
								delay: index * 0.05,
								layout: { type: 'spring', stiffness: 300, damping: 30 },
							}}
							key={article.path}
							style={{ margin: 0, padding: 0 }}
						>
							<PostArticle
								{...article}
								to={article.path}
								useUpdated={sortOrder === 'updated'}
							/>
						</motion.div>
					))}
				</AnimatePresence>
			</motion.menu>
		</div>
	)
}

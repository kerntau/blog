'use client'

import { useEffect } from 'react'
import { useLayoutStore } from '../../stores/layout'
import PostOrderToggle from '../../components/post/PostOrderToggle'
import PostArticle from '../../components/post/PostArticle'
import UtilLink from '../../components/util/UtilLink'
import { useArticleSort, useCategory } from '../../hooks/useArticle'
import { Icon } from '@iconify/react'
import styles from './Preview.module.scss'

import { motion, AnimatePresence } from 'framer-motion'

export default function PreviewClient({ allPosts }: { allPosts: any[] }) {
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
					<UtilLink className="mobile-only" to="/" title="返回首页">
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
			<p>勇敢的人探索世界。这里是一些还未发布的文章。</p>

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
								layout: { type: "spring", stiffness: 300, damping: 30 }
							}}
							key={article.path}
							style={{ margin: 0, padding: 0 }}
						>
							<PostArticle
								{...article}
								useUpdated={sortOrder === 'updated'}
							/>
						</motion.div>
					))}
				</AnimatePresence>
			</motion.menu>
		</div>
	)
}

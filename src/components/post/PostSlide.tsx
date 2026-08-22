'use client'

import { useEffect } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures'
import { Icon } from '@iconify/react'
import UtilLink from '../util/UtilLink'
import UtilDate from '../util/UtilDate'
import ZButton from '../partial/ZButton'
import type { ArticleProps } from '../../types/article'
import appConfig from '../../app.config'
import styles from './PostSlide.module.scss'

export default function PostSlide({ list }: { list: ArticleProps[] }) {
	const compConf = appConfig.component?.slide || { showTitle: true }

	const [emblaRef, emblaApi] = useEmblaCarousel(
		{ containScroll: false, loop: true, skipSnaps: true },
		[
			Autoplay({ stopOnInteraction: false, stopOnMouseEnter: true }),
			WheelGesturesPlugin() as any,
		]
	)

	useEffect(() => {
		if (!emblaApi) return
		const handleWheel = (e: WheelEvent) => {
			const delta = e.deltaX + (e.shiftKey ? e.deltaY : 0)
			if (Math.abs(delta) < 80) return
			if (delta > 0) emblaApi.scrollNext()
			else emblaApi.scrollPrev()
		}
		const container = emblaApi.rootNode()
		container.addEventListener('wheel', handleWheel, { passive: true })
		return () => container.removeEventListener('wheel', handleWheel)
	}, [emblaApi])

	return (
		<div className={styles.zSlide}>
			<div className={styles.zSlideHeader}>
				<span className={`${styles.title} text-creative`}>精选文章</span>
				<div className={styles.atSlideHover}>
					<Icon icon="tabler:mouse" />
					按住 Shift 横向滚动
				</div>
			</div>

			<div ref={emblaRef} className={styles.zSlideBody} dir="ltr">
				<div className={styles.slideList}>
					{list.map((article, index) => (
						<UtilLink
							key={index}
							className={styles.slideItem}
							title={article.description}
							to={article.path}
						>
							{article.image && (
								<img
									className={styles.cover}
									src={article.image}
									alt={compConf.showTitle ? '' : (article.title || '')}
									loading="lazy"
									decoding="async"
								/>
							)}

							{compConf.showTitle && (
								<div className={`${styles.stableInfo} text-creative`}>
									{article.title}
								</div>
							)}

							<div className={styles.hoverInfo}>
								<div className={`${styles.title} text-creative`}>
									{article.title}
								</div>
								{article.date && <UtilDate className={styles.desc} date={article.date} />}
							</div>
						</UtilLink>
					))}
				</div>

				<ZButton
					className={`${styles.carouselAction} ${styles.prev} ${styles.atSlideHover}`}
					aria-label="上一页"
					icon="tabler:chevron-left"
					tabIndex={-1}
					onClick={() => emblaApi?.scrollPrev()}
				/>

				<ZButton
					className={`${styles.carouselAction} ${styles.next} ${styles.atSlideHover}`}
					aria-label="下一页"
					icon="tabler:chevron-right"
					tabIndex={-1}
					onClick={() => emblaApi?.scrollNext()}
				/>
			</div>
		</div>
	)
}

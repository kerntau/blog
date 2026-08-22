import Image from '@/lib/compat-image'
import styles from './BlogWidget.module.scss'

interface BlogWidgetProps {
	title?: React.ReactNode
	action?: React.ReactNode
	card?: boolean
	shrink?: boolean
	grayscale?: boolean
	dim?: boolean
	bgImg?: string
	bgRight?: boolean
	unoptimized?: boolean
	children?: React.ReactNode
	bodyRef?: React.RefObject<HTMLDivElement | null>
	className?: string
	style?: React.CSSProperties
}

export default function BlogWidget({
	title,
	action,
	card,
	shrink,
	grayscale,
	dim,
	bgImg,
	bgRight,
	unoptimized,
	children,
	bodyRef,
	className,
	style,
}: BlogWidgetProps) {
	return (
		<section
			className={`${styles.blogWidget} blog-widget ${className ?? ''} ${shrink ? `${styles.shrink} shrink` : ''} ${grayscale ? `${styles.grayscale} grayscale` : ''} ${dim ? `${styles.dim} dim` : ''}`.trim()}
			style={style}
		>
			{(title || action) && (
				<hgroup className={`${styles.widgetHeader} widget-header text-creative`}>
					{title}
					{action && <span className={`${styles.seperator} seperator`} />}
					{action}
				</hgroup>
			)}

			<div
				ref={bodyRef}
				className={`${styles.widgetBody} widget-body ${card ? `${styles.widgetCard} widget-card` : ''} ${bgImg ? `${styles.withBg} with-bg` : ''} ${shrink ? 'scrollcheck-y scrollbar-hidden' : ''}`.trim()}
			>
				{bgImg && (
					<Image
						src={bgImg}
						alt=""
						className={`${styles.bgImg} bg-img ${bgRight ? `${styles.bgRight} bg-right` : ''}`.trim()}
						fill
						sizes="280px"
						unoptimized={unoptimized}
					/>
				)}
				{children}
			</div>
		</section>
	)
}

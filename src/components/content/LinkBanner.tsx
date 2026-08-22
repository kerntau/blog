import UtilLink from '../util/UtilLink'
import { getDomain } from '../../utils/link'
import styles from './LinkBanner.module.scss'

interface LinkBannerProps {
	banner?: string
	image?: string
	title?: string
	description?: string
	link: string
}

export default function LinkBanner({ banner, image, title, description, link }: LinkBannerProps) {
	const bg = banner || image
	const tooltip = [title, description, link].filter(Boolean).join(' - ')

	return (
		<UtilLink to={link} className={`${styles.linkBanner} link-banner card`} title={tooltip}>
			{bg && <img className={`${styles.linkBannerBg} link-banner-bg`} src={bg} alt={title || ''} loading="lazy" />}
			<div className={styles.linkBannerHeader} />
			<div className={styles.linkBannerInfo}>
				{title && <div className={styles.linkBannerTitle}>{title}</div>}
				<div className={styles.linkBannerDesc}>
					{description ?? getDomain(link)}
				</div>
			</div>
		</UtilLink>
	)
}

import UtilLink from '../util/UtilLink'
import Pic from './Pic'
import styles from './LinkBanner.module.scss'

interface LinkBannerProps {
	link: string
	image: string
}

export default function LinkBanner({ link, image }: LinkBannerProps) {
	return (
		<UtilLink to={link} className={styles.linkBanner}>
			<Pic src={image} className={styles.image} />
		</UtilLink>
	)
}

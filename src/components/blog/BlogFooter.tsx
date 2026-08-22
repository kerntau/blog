import UtilLink from '../util/UtilLink'
import appConfig from '../../app.config'
import styles from './BlogFooter.module.scss'
import { Icon } from '@iconify/react'

export default function BlogFooter() {
	return (
		<footer className={`${styles.blogFooter} blog-footer`}>
			{appConfig.footer.nav && (
				<nav className={styles.footerNav}>
					{appConfig.footer.nav.map((group, groupIndex) => (
						<div key={groupIndex} className={styles.navGroup}>
							<hgroup className="text-creative">{group.title}</hgroup>
							<menu>
								{group.items.map((item, itemIndex) => (
									<li key={itemIndex}>
										<UtilLink to={item.url}>
											<Icon icon={item.icon} />
											<span className={styles.navText}>{item.text}</span>
										</UtilLink>
									</li>
								))}
							</menu>
						</div>
					))}
				</nav>
			)}

			<p
				dangerouslySetInnerHTML={{ __html: appConfig.footer.copyright }}
			/>
		</footer>
	)
}

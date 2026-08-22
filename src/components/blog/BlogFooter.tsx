import Link from 'next/link'
import appConfig from '../../app.config'
import styles from './BlogFooter.module.scss'
import { getFixedDelay } from '../../utils/anim'
import { Icon } from '@iconify/react'

export default function BlogFooter() {
	return (
		<footer className={`${styles.blogFooter} blog-footer`}>
			{appConfig.footer.nav && (
				<nav className={styles.footerNav}>
					{appConfig.footer.nav.map((group, groupIndex) => (
						<div key={groupIndex} className={styles.navGroup}>
							<hgroup className="text-creative" style={getFixedDelay(groupIndex * 0.1)}>{group.title}</hgroup>
							<menu>
								{group.items.map((item, itemIndex) => (
									<li key={itemIndex} style={getFixedDelay((groupIndex + 1) * 0.1 + itemIndex * 0.05)}>
										<Link
											href={item.url}
											target={item.url.startsWith('http') ? '_blank' : undefined}
											rel={item.url.startsWith('http') ? 'noopener noreferrer' : undefined}
										>
											<Icon icon={item.icon} />
											<span className={styles.navText}>{item.text}</span>
										</Link>
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

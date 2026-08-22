'use client'

import { Icon } from '@iconify/react'
import appConfig from '../../app.config'
import { useLayoutStore } from '../../stores/layout'
import { useSearchStore } from '../../stores/search'
import BlogHeader from './BlogHeader'
import BlogThemeToggle from './ThemeToggle'
import Mask from './Mask'
import IconNavList from '../partial/IconNavList'
import UtilLink from '../util/UtilLink'
import Key from '../content/Key'
import styles from './BlogSidebar.module.scss'

import { useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useTextSelection } from '../../hooks/useTextSelection'
import { useDebounce } from '../../hooks/useDebounce'

export default function BlogSidebar() {
	const location = useLocation()
	const pathname = location.pathname
	const [hydrated, setHydrated] = useState(false)
	const { state, close } = useLayoutStore()
	const { setIsOpen, word } = useSearchStore()
	const { text } = useTextSelection()
	const debouncedSelection = useDebounce(text, 200)

	useEffect(() => setHydrated(true), [])

	const isExtLink = (url: string) => url.startsWith('http')
	const isLinkActive = (url: string) => hydrated && pathname === url

	return (
		<>
			<Mask show={state === 'sidebar'} className="mobile-only" onClick={close} />
			<aside
				id="blog-sidebar"
				className={`${styles.sidebar} ${state === 'sidebar' ? styles.show : ''}`}
			>
				<BlogHeader className={styles.sidebarHeader} />

				<nav className={`${styles.sidebarNav} scrollcheck-y`}>
					<div className={`${styles.searchBtn} ${styles.navItem} gradient-card`} onClick={() => setIsOpen(true)}>
						<Icon icon="tabler:search" />
						<span className={styles.navText}>{debouncedSelection || word || '搜索'}</span>
						<Key className={styles.keycut} code="K" cmd prevent onPress={() => setIsOpen(true)} />
					</div>

					{appConfig.nav.map((group, gIdx) => (
						<div key={gIdx} className={styles.navGroup}>
							{group.title && <h3 className={styles.groupTitle}>{group.title}</h3>}
							<menu className={styles.navMenu}>
								{group.items.map((item, iIdx) => (
									<li key={iIdx}>
										<UtilLink
											to={item.url}
											className={`${styles.navItem} ${isLinkActive(item.url) ? styles.routerLinkActive : ''}`}
										>
											<Icon icon={item.icon} />
											<span className={styles.navText}>{item.text}</span>
											{isExtLink(item.url) && (
												<Icon icon="tabler:arrow-up-right" className={styles.externalTip} />
											)}
										</UtilLink>
									</li>
								))}
							</menu>
						</div>
					))}
				</nav>

				<footer className={styles.sidebarFooter}>
					<BlogThemeToggle />
					<IconNavList list={appConfig.footer.iconNav} />
				</footer>
			</aside>
		</>
	)
}

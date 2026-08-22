'use client'

import { useLayoutStore } from '../../stores/layout'
import { widgetMap } from './widgets'
import Mask from './Mask'
import styles from './BlogAside.module.scss'

export default function BlogAside() {
	const layoutStore = useLayoutStore()
	const { asideWidgets, state } = layoutStore

	if (!asideWidgets || asideWidgets.length === 0) {
		return null
	}

	const handleAsideClick = (e: React.MouseEvent) => {
		const target = e.target as HTMLElement
		const link = target.closest('a')
		if (link && state === 'aside') {
			layoutStore.close()
		}
	}

	return (
		<>
			<Mask show={state === 'aside'} className="widescreen-only" onClick={() => layoutStore.close()} />

			<aside
				id="blog-aside"
				className={`${styles.blogAside} ${state === 'aside' ? `${styles.show} show` : ''}`}
				onClick={handleAsideClick}
			>
				{asideWidgets.map((name) => {
					const Widget = widgetMap[name]
					return Widget ? <Widget key={name} /> : null
				})}
			</aside>
		</>
	)
}

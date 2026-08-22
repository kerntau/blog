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

	return (
		<>
			<Mask show={state === 'aside'} className="widescreen-only" onClick={() => layoutStore.close()} />

			<aside id="blog-aside" className={`${styles.blogAside} ${state === 'aside' ? `${styles.show} show` : ''}`}>
				{asideWidgets.map((name) => {
					const Widget = widgetMap[name]
					return Widget ? <Widget key={name} /> : null
				})}
			</aside>
		</>
	)
}

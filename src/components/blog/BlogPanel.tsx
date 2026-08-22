'use client'

import { useRef } from 'react'
import { Icon } from '@iconify/react'
import { useLayoutStore } from '../../stores/layout'
import { useAvoidTransform } from '../../hooks/useAvoid'
import styles from './BlogPanel.module.scss'

export default function BlogPanel() {
	const layoutStore = useLayoutStore()
	const panelRef = useRef<HTMLDivElement>(null)
	const transform = useAvoidTransform(panelRef)

	return (
		<div
			id="blog-panel"
			ref={panelRef}
			className={`${styles.blogPanel} ${layoutStore.state !== 'none' ? styles.hasActive : ''}`}
			style={{ transform }}
		>
			{layoutStore.asideWidgets.length > 0 && (
				<button
					className={`widescreen-only ${layoutStore.state === 'aside' ? styles.active : ''}`}
					aria-label="切换侧边栏"
					onClick={() => layoutStore.toggle('aside')}
				>
					<Icon className="rtl-flip" icon="tabler:align-right" />
				</button>
			)}

			<button
				className={`mobile-only ${layoutStore.state === 'sidebar' ? styles.active : ''}`}
				aria-label="切换菜单"
				onClick={() => layoutStore.toggle('sidebar')}
			>
				<Icon className="rtl-flip" icon={layoutStore.state === 'sidebar' ? 'tabler:layout-sidebar-filled' : 'tabler:layout-sidebar'} />
			</button>
		</div>
	)
}

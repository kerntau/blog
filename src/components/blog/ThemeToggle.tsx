'use client'

import { useTheme } from 'next-themes'
import { Icon } from '@iconify/react'
import { useEffect, useState } from 'react'
import appConfig from '../../app.config'
import styles from './ThemeToggle.module.scss'

export default function ThemeToggle() {
	const { theme, setTheme } = useTheme()
	const [mounted, setMounted] = useState(false)

	useEffect(() => setMounted(true), [])

	if (!mounted) {
		return (
			<div className={styles.themeToggle}>
				<button style={{ opacity: 0 }}>
					<Icon icon="tabler:device-desktop" />
				</button>
			</div>
		)
	}

	return (
		<div className={styles.themeToggle}>
			{Object.entries(appConfig.themes).map(([themeName, themeData]) => (
				<button
					key={themeName}
					data-tip={themeData.tip}
					aria-label={themeData.tip}
					className={theme === themeName ? styles.active : ''}
					onClick={() => setTheme(themeName)}
				>
					<Icon icon={themeData.icon} />
				</button>
			))}
		</div>
	)
}

'use client'

import { useTheme } from 'next-themes'
import { Icon } from '@iconify/react'
import { useEffect, useState } from 'react'
import appConfig from '../../app.config'
import styles from './ThemeToggle.module.scss'
import ZTooltip from '../partial/ZTooltip'

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
		<div className={`${styles.themeToggle} theme-toggle`}>
			{Object.entries(appConfig.themes).map(([themeName, themeData]) => {
				const isActive = (theme || 'system') === themeName
				return (
					<ZTooltip key={themeName} content={themeData.tip}>
						<button
							type="button"
							aria-label={themeData.tip}
							className={`${isActive ? `${styles.active} active` : ''}`.trim()}
							onClick={() => setTheme(themeName)}
						>
							<Icon icon={themeData.icon} />
						</button>
					</ZTooltip>
				)
			})}
		</div>
	)
}

'use client'
import styles from './Blur.module.scss'

export default function Blur({ children }: { children: React.ReactNode }) {
	return (
		<span className={styles.blur}>
			{children}
		</span>
	)
}

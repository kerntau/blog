import React from 'react'
import styles from './Poetry.module.scss'

interface PoetryProps {
	title?: string
	author?: string
	footer?: string
	children?: React.ReactNode
}

export default function Poetry({ title, author, footer, children }: PoetryProps) {
	return (
		<section className={styles.poetry}>
			{title && (
				<h2 className={`${styles.poetryTitle} text-center`}>
					{title}
				</h2>
			)}
			{author && (
				<div className="text-center">
					{author}
				</div>
			)}
			<div className={styles.poetryContent}>
				{children}
			</div>
			{footer && (
				<div className="text-center">
					{footer}
				</div>
			)}
		</section>
	)
}

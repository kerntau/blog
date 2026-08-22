import styles from './SkipToContent.module.scss'

export default function SkipToContent() {
	return (
		<a href="#main-content" className={`${styles.skipLink} gradient-card active`}>
			跳转到主要内容 / Skip to content
		</a>
	)
}

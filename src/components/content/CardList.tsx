import styles from './CardList.module.scss'

export default function CardList({ children }: { children?: React.ReactNode }) {
	return (
		<div className={`${styles.cardList} card-list`}>
			{children}
		</div>
	)
}


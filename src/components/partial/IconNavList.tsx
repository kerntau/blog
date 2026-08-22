import { Icon } from '@iconify/react'
import UtilLink from '../util/UtilLink'
import styles from './IconNavList.module.scss'
import type { NavItem } from '../../types/nav'

export default function IconNavList({ list }: { list: NavItem[] }) {
	return (
		<menu className={styles.menu}>
			{list.map(({ text, icon, url }) => (
				<UtilLink
					key={text}
					data-tip={text}
					to={url}
					aria-label={text}
				>
					<Icon icon={icon} />
				</UtilLink>
			))}
		</menu>
	)
}

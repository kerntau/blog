import { Icon } from '@iconify/react'
import UtilLink from '../util/UtilLink'
import { getDomain, isExtLink, safelyDecodeUriComponent } from '../../utils/link'
import { getDomainIcon } from '../../utils/icon'
import ZTooltip from '../partial/ZTooltip'
import styles from './ProseA.module.scss'

interface ProseAProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
	icon?: string | false
}

export default function ProseA(props: ProseAProps) {
	const { href, icon, children, className = '', title, ...rest } = props
	const domainIcon = icon === false ? undefined : (icon ?? (href ? getDomainIcon(href) : undefined))
	const tip = title ?? (href ? (isExtLink(href) ? getDomain(href) : safelyDecodeUriComponent(href)) : undefined)

	const content = (
		<UtilLink
			to={href}
			className={`${styles.zLink} ${className}`.trim()}
			{...(rest as any)}
		>
			{domainIcon && <Icon className={styles.domainIcon} icon={domainIcon} />}
			{children}
		</UtilLink>
	)

	if (tip) {
		return (
			<ZTooltip content={tip}>
				{content}
			</ZTooltip>
		)
	}

	return content
}

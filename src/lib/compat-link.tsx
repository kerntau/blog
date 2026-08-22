import { forwardRef, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
	href: string | { pathname?: string, search?: string, hash?: string }
	replace?: boolean
	scroll?: boolean
	prefetch?: boolean
	children?: ReactNode
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(({
	href,
	replace,
	scroll,
	prefetch: _prefetch,
	onClick,
	children,
	...props
}, ref) => {
	const to = typeof href === 'string' ? href : `${href.pathname || ''}${href.search || ''}${href.hash || ''}`
	const isExternal = typeof to === 'string' && (to.startsWith('http://') || to.startsWith('https://') || to.startsWith('//') || to.startsWith('mailto:'))

	if (isExternal) {
		return (
			<a
				ref={ref}
				href={to}
				target={props.target || '_blank'}
				rel={props.rel || 'noreferrer noopener'}
				onClick={onClick}
				{...props}
			>
				{children}
			</a>
		)
	}

	const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
		onClick?.(e)
		if (!e.defaultPrevented && scroll !== false && !to.includes('#')) {
			window.scrollTo({ top: 0, behavior: 'instant' })
		}
	}

	return (
		<RouterLink
			ref={ref}
			to={to}
			replace={replace}
			onClick={handleClick}
			{...props}
		>
			{children}
		</RouterLink>
	)
})

Link.displayName = 'Link'

export default Link

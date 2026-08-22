import React, { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { isExtLink } from '../../utils/link'

interface UtilLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
	to?: string
	href?: string
}

const UtilLink = forwardRef<HTMLAnchorElement, UtilLinkProps>(({ to, href, children, ...props }, ref) => {
	const destination = to || href

	if (destination?.startsWith('#')) {
		return <a ref={ref} href={destination} {...props}>{children}</a>
	}

	if (typeof destination === 'undefined') {
		return <span ref={ref as any} {...(props as any)}>{children}</span>
	}

	if (isExtLink(destination)) {
		return (
			<a
				ref={ref}
				href={destination}
				target="_blank"
				rel="noopener noreferrer"
				{...props}
			>
				{children}
			</a>
		)
	}

	return (
		<Link
			ref={ref}
			to={destination}
			{...(props as any)}
		>
			{children}
		</Link>
	)
})

UtilLink.displayName = 'UtilLink'

export default UtilLink

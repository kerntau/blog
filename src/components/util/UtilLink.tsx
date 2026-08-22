import React, { forwardRef } from 'react'
import Link from 'next/link'
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

	return (
		<Link
			ref={ref}
			href={destination}
			target={isExtLink(destination) ? '_blank' : undefined}
			rel={isExtLink(destination) ? 'noopener noreferrer' : undefined}
			{...props}
		>
			{children}
		</Link>
	)
})

export default UtilLink

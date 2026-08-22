'use client'

import { useEffect } from 'react'
import { useLayoutStore, type TocItem } from '../../stores/layout'

interface ArticleClientProps {
	toc: TocItem[]
	aside?: string[]
}

export default function ArticleClient({ toc, aside }: ArticleClientProps) {
	const setToc = useLayoutStore(s => s.setToc)
	const setAside = useLayoutStore(s => s.setAside)

	useEffect(() => {
		setToc(toc)
		if (aside) {
			setAside(aside)
		} else {
			setAside(['toc'])
		}

		return () => {
			setToc([])
			setAside(['blog-stats'])
		}
	}, [toc, aside, setToc, setAside])

	return null
}

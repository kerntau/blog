import { usePathname, useRouter, useSearchParams } from '@/lib/compat-navigation'
import { useCallback, useMemo, useState } from 'react'
import appConfig from '../app.config'

interface UsePaginationOptions {
	initialPage?: number
	perPage?: number
	bindQuery?: string
}

export default function usePagination<T>(list: T[], options?: UsePaginationOptions) {
	const {
		initialPage = 1,
		perPage = appConfig.pagination.perPage || 10,
		bindQuery,
	} = options || {}

	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()

	const totalPages = Math.ceil(list.length / perPage) || initialPage

	const getPageFromQuery = useCallback(() => {
		if (!bindQuery) return initialPage
		const val = searchParams?.get(bindQuery)
		if (!val) return initialPage
		const page = Number(val)
		return page >= 1 && page <= totalPages ? page : initialPage
	}, [bindQuery, searchParams, initialPage, totalPages])

	const [internalPage, setInternalPage] = useState(getPageFromQuery())

	const page = bindQuery ? getPageFromQuery() : internalPage

	const setPage = useCallback((newPage: number) => {
		if (newPage < 1 || newPage > totalPages) return

		if (bindQuery) {
			const params = new URLSearchParams(searchParams?.toString())
			if (newPage === initialPage) {
				params.delete(bindQuery)
			} else {
				params.set(bindQuery, newPage.toString())
			}
			router.push(`${pathname}?${params.toString()}`, { scroll: true })
		} else {
			setInternalPage(newPage)
		}
	}, [bindQuery, searchParams, pathname, router, initialPage, totalPages])

	const listPaged = useMemo(() => {
		const start = (page - 1) * perPage
		return list.slice(start, start + perPage)
	}, [list, page, perPage])

	return {
		totalPages,
		page,
		setPage,
		listPaged,
	}
}

export function getPaginationIndicator(current: number, total: number, expand = 1) {
	const start = Math.max(2, Math.min(current - expand, total - 2 * expand))
	const end = Math.min(total, start + 2 * expand)
	const pageArr: number[] = Array.from({ length: end - start + 1 }, (_, i) => start + i)
	if (start > 3) pageArr.unshift(Number.NEGATIVE_INFINITY)
	if (start === 3) pageArr.unshift(2)
	if (start > 1) pageArr.unshift(1)
	if (end < total - 2) pageArr.push(Number.POSITIVE_INFINITY)
	if (end === total - 2) pageArr.push(total - 1)
	if (end < total) pageArr.push(total)
	return pageArr
}

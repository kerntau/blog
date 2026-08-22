import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
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

	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const location = useLocation()
	const pathname = location.pathname

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
	const safePage = Math.min(page, Math.max(1, totalPages))

	const setPage = useCallback((newPage: number) => {
		const targetPage = Math.max(1, Math.min(newPage, totalPages))

		if (bindQuery) {
			const params = new URLSearchParams(window.location.search)
			if (targetPage === initialPage) {
				params.delete(bindQuery)
			} else {
				params.set(bindQuery, targetPage.toString())
			}
			const query = params.toString()
			navigate(query ? `${pathname}?${query}` : pathname)
		} else {
			setInternalPage(targetPage)
		}
	}, [bindQuery, pathname, navigate, initialPage, totalPages])

	const listPaged = useMemo(() => {
		const start = (safePage - 1) * perPage
		return list.slice(start, start + perPage)
	}, [list, safePage, perPage])

	return {
		totalPages,
		page: safePage,
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

'use client'

import { useSearchParams, useRouter, usePathname } from '@/lib/compat-navigation'
import { useState, useMemo, useEffect, useCallback } from 'react'
import type { ArticleOrderType, ArticleProps } from '../types/article'
import { orderBy } from 'es-toolkit/array'
import appConfig from '../app.config'

// 重新导出纯函数，供客户端组件直接使用
export { getCategoryIcon, getCategoryColor, getPostTypeClassName } from '../utils/article'

interface UseCategoryOptions {
	bindQuery?: string
}

export function useCategory(list: ArticleProps[], options?: UseCategoryOptions) {
	const { bindQuery } = options || {}
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()

	const queryCategory = bindQuery ? (searchParams?.get(bindQuery) ?? undefined) : undefined
	const [localCategory, setLocalCategory] = useState<string | undefined>(queryCategory)

	useEffect(() => {
		if (bindQuery) {
			setLocalCategory(searchParams?.get(bindQuery) ?? undefined)
		}
	}, [bindQuery, searchParams])

	const category = localCategory

	// 提取全部可用分类（从全量博文或传入列表中提取，确保下拉菜单项完整且不丢失）
	const categories = useMemo(() => {
		return [...new Set(list.map(item => item.categories?.[0]).filter(Boolean))] as string[]
	}, [list])

	const listCategorized = useMemo(() => {
		if (!category) return list
		return list.filter(item => item.categories?.[0] === category)
	}, [list, category])

	const setCategory = useCallback((newCategory?: string) => {
		setLocalCategory(newCategory)
		if (bindQuery) {
			const params = new URLSearchParams(window.location.search)
			if (!newCategory) {
				params.delete(bindQuery)
			}
			else {
				params.set(bindQuery, newCategory)
			}
			const query = params.toString()
			router.push(query ? `${pathname}?${query}` : pathname, { scroll: true })
		}
	}, [bindQuery, pathname, router])

	return {
		category,
		setCategory,
		categories,
		listCategorized,
		isPending: false,
	}
}

interface UseArticleSortOptions {
	bindDirectionQuery?: string
	bindOrderQuery?: string
	initialAscend?: boolean
	initialOrder?: ArticleOrderType
}

export function useArticleSort(list: ArticleProps[], options?: UseArticleSortOptions) {
	const {
		bindDirectionQuery,
		bindOrderQuery,
		initialAscend = false,
		initialOrder = appConfig.pagination.sortOrder || 'date',
	} = options || {}

	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()

	const querySortOrder = bindOrderQuery
		? ((searchParams?.get(bindOrderQuery) as ArticleOrderType | null) ?? initialOrder)
		: initialOrder
	const [localSortOrder, setLocalSortOrder] = useState<ArticleOrderType>(querySortOrder)

	const queryIsAscending = bindDirectionQuery
		? (searchParams?.get(bindDirectionQuery) === 'true')
		: initialAscend
	const [localIsAscending, setLocalIsAscending] = useState<boolean>(queryIsAscending)

	useEffect(() => {
		if (bindOrderQuery) {
			const q = searchParams?.get(bindOrderQuery) as ArticleOrderType | null
			setLocalSortOrder(q ?? initialOrder)
		}
	}, [bindOrderQuery, searchParams, initialOrder])

	useEffect(() => {
		if (bindDirectionQuery) {
			setLocalIsAscending(searchParams?.get(bindDirectionQuery) === 'true')
		}
	}, [bindDirectionQuery, searchParams])

	const sortOrder = localSortOrder
	const isAscending = localIsAscending

	const listSorted = useMemo(() => {
		return orderBy(
			list,
			[sortOrder, 'date'],
			[isAscending ? 'asc' : 'desc'],
		)
	}, [list, sortOrder, isAscending])

	const setSortOrder = useCallback((newOrder: ArticleOrderType) => {
		setLocalSortOrder(newOrder)
		if (bindOrderQuery) {
			const params = new URLSearchParams(window.location.search)
			params.set(bindOrderQuery, newOrder)
			router.push(`${pathname}?${params.toString()}`, { scroll: true })
		}
	}, [bindOrderQuery, pathname, router])

	const setIsAscending = useCallback((asc: boolean) => {
		setLocalIsAscending(asc)
		if (bindDirectionQuery) {
			const params = new URLSearchParams(window.location.search)
			params.set(bindDirectionQuery, asc ? 'true' : 'false')
			router.push(`${pathname}?${params.toString()}`, { scroll: true })
		}
	}, [bindDirectionQuery, pathname, router])

	return {
		sortOrder,
		setSortOrder,
		isAscending,
		setIsAscending,
		listSorted,
		isPending: false,
	}
}

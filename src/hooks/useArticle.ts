'use client'

import { useSearchParams, useRouter, usePathname } from '@/lib/compat-navigation'
import { useState, useMemo, useTransition, useCallback } from 'react'
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
	const [isPending, startTransition] = useTransition()

	// 若未绑定 URL 参数，则由本地状态托管
	const [localCategory, setLocalCategory] = useState<string | undefined>(undefined)

	// 状态唯一事实来源 (Single Source of Truth)
	const category = bindQuery
		? (searchParams?.get(bindQuery) ?? undefined)
		: localCategory

	const categories = useMemo(() => {
		return [...new Set(list.map(item => item.categories?.[0]).filter(Boolean))] as string[]
	}, [list])

	const listCategorized = useMemo(() => {
		return list.filter(item => !category || item.categories?.[0] === category)
	}, [list, category])

	const setCategory = useCallback((newCategory?: string) => {
		if (bindQuery) {
			const params = new URLSearchParams(searchParams?.toString())
			if (!newCategory) {
				params.delete(bindQuery)
			}
			else {
				params.set(bindQuery, newCategory)
			}
			startTransition(() => {
				const query = params.toString()
				router.push(query ? `${pathname}?${query}` : pathname, { scroll: true })
			})
		}
		else {
			setLocalCategory(newCategory)
		}
	}, [bindQuery, searchParams, pathname, router])

	return {
		category,
		setCategory,
		categories,
		listCategorized,
		isPending,
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
	const [isPending, startTransition] = useTransition()

	// 仅在未绑定 URL 时使用本地状态
	const [localSortOrder, setLocalSortOrder] = useState<ArticleOrderType>(initialOrder)
	const [localIsAscending, setLocalIsAscending] = useState<boolean>(initialAscend)

	// 状态唯一事实来源：优先直接由 URL 派生
	const sortOrder = bindOrderQuery
		? ((searchParams?.get(bindOrderQuery) as ArticleOrderType | null) ?? initialOrder)
		: localSortOrder

	const isAscending = bindDirectionQuery
		? (searchParams?.get(bindDirectionQuery) === 'true')
		: localIsAscending

	const listSorted = useMemo(() => {
		return orderBy(
			list,
			[sortOrder, 'date'],
			[isAscending ? 'asc' : 'desc'],
		)
	}, [list, sortOrder, isAscending])

	const setSortOrder = useCallback((newOrder: ArticleOrderType) => {
		if (bindOrderQuery) {
			const params = new URLSearchParams(searchParams?.toString())
			params.set(bindOrderQuery, newOrder)
			startTransition(() => {
				router.push(`${pathname}?${params.toString()}`, { scroll: true })
			})
		}
		else {
			setLocalSortOrder(newOrder)
		}
	}, [bindOrderQuery, searchParams, pathname, router])

	const setIsAscending = useCallback((asc: boolean) => {
		if (bindDirectionQuery) {
			const params = new URLSearchParams(searchParams?.toString())
			params.set(bindDirectionQuery, asc ? 'true' : 'false')
			startTransition(() => {
				router.push(`${pathname}?${params.toString()}`, { scroll: true })
			})
		}
		else {
			setLocalIsAscending(asc)
		}
	}, [bindDirectionQuery, searchParams, pathname, router])

	return {
		sortOrder,
		setSortOrder,
		isAscending,
		setIsAscending,
		listSorted,
		isPending,
	}
}

'use client'

import { useSearchParams, useRouter, usePathname } from '@/lib/compat-navigation'
import { useMemo, useTransition } from 'react'
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

	const category = bindQuery ? searchParams?.get(bindQuery) ?? undefined : undefined

	const categories = useMemo(() => {
		return [...new Set(list.map(item => item.categories?.[0]).filter(Boolean))] as string[]
	}, [list])

	const listCategorized = useMemo(() => {
		return list.filter(item => !category || item.categories?.[0] === category)
	}, [list, category])

	const router = useRouter()
	const pathname = usePathname()
	const [isPending, startTransition] = useTransition()
	const setCategory = (newCategory?: string) => {
		if (bindQuery) {
			const params = new URLSearchParams(searchParams?.toString())
			if (!newCategory) {
				params.delete(bindQuery)
			} else {
				params.set(bindQuery, newCategory)
			}
			startTransition(() => {
				router.push(`${pathname}?${params.toString()}`, { scroll: true })
			})
		}
	}

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

	const sortOrder = (bindOrderQuery ? searchParams?.get(bindOrderQuery) : null) as ArticleOrderType | null ?? initialOrder

	const isAscending = bindDirectionQuery
		? searchParams?.get(bindDirectionQuery) === 'true'
		: initialAscend

	const listSorted = useMemo(() => {
		return orderBy(
			list,
			[sortOrder, 'date'],
			[isAscending ? 'asc' : 'desc'],
		)
	}, [list, sortOrder, isAscending])

	const router = useRouter()
	const pathname = usePathname()
	const [isPending, startTransition] = useTransition()
	const setSortOrder = (newOrder: ArticleOrderType) => {
		if (bindOrderQuery) {
			const params = new URLSearchParams(searchParams?.toString())
			params.set(bindOrderQuery, newOrder)
			startTransition(() => {
				router.push(`${pathname}?${params.toString()}`, { scroll: true })
			})
		}
	}

	const setIsAscending = (asc: boolean) => {
		if (bindDirectionQuery) {
			const params = new URLSearchParams(searchParams?.toString())
			params.set(bindDirectionQuery, asc ? 'true' : 'false')
			startTransition(() => {
				router.push(`${pathname}?${params.toString()}`, { scroll: true })
			})
		}
	}

	return {
		sortOrder,
		setSortOrder,
		isAscending,
		setIsAscending,
		listSorted,
		isPending,
	}
}

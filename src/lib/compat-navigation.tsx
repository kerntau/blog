import { useCallback } from 'react'
import {
	useLocation,
	useNavigate,
	useSearchParams as useRouterSearchParams,
	useParams as useRouterParams,
} from 'react-router-dom'

export function usePathname(): string {
	const location = useLocation()
	return location.pathname
}

export function useRouter() {
	const navigate = useNavigate()

	const push = useCallback((url: string, _options?: { scroll?: boolean }) => {
		navigate(url)
	}, [navigate])

	const replace = useCallback((url: string, _options?: { scroll?: boolean }) => {
		navigate(url, { replace: true })
	}, [navigate])

	const back = useCallback(() => {
		navigate(-1)
	}, [navigate])

	const forward = useCallback(() => {
		navigate(1)
	}, [navigate])

	const refresh = useCallback(() => {
		window.location.reload()
	}, [])

	const prefetch = useCallback((_url: string) => {}, [])

	return {
		push,
		replace,
		back,
		forward,
		refresh,
		prefetch,
	}
}

export function useSearchParams() {
	const [searchParams] = useRouterSearchParams()
	return searchParams
}

export function useParams<T extends Record<string, string | string[]> = Record<string, string | string[]>>(): T {
	const params = useRouterParams()
	return params as unknown as T
}

export function redirect(url: string): never {
	window.location.replace(url)
	throw new Error(`Redirecting to ${url}`)
}

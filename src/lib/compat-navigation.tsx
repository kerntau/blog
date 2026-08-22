import { useMemo } from 'react'
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

	return useMemo(() => ({
		push: (url: string, _options?: { scroll?: boolean }) => navigate(url),
		replace: (url: string, _options?: { scroll?: boolean }) => navigate(url, { replace: true }),
		back: () => navigate(-1),
		forward: () => navigate(1),
		refresh: () => window.location.reload(),
		prefetch: (_url: string) => {},
	}), [navigate])
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

declare module 'next' {
	export interface Metadata {
		[key: string]: any
	}
}

declare module 'next/server' {
	export class NextResponse {
		constructor(body?: any, init?: any)
		static json(data: any, init?: any): any
	}
}

declare module 'next/link' {
	import type { ComponentType } from 'react'
	import type { LinkProps } from '@/lib/compat-link'

	const Link: ComponentType<LinkProps>
	export default Link
}

declare module 'next/image' {
	import type { ComponentType } from 'react'
	import type { ImageProps } from '@/lib/compat-image'

	const Image: ComponentType<ImageProps>
	export default Image
}

declare module 'next/navigation' {
	export function usePathname(): string
	export function useRouter(): {
		push: (url: string) => void
		replace: (url: string) => void
		back: () => void
		forward: () => void
		refresh: () => void
		prefetch: (url: string) => void
	}
	export function useSearchParams(): URLSearchParams
	export function useParams<T = any>(): T
	export function redirect(url: string): never
}

declare module 'next/script' {
	import type { ComponentType } from 'react'
	import type { ScriptProps } from '@/lib/compat-script'

	export const Script: ComponentType<ScriptProps>
	export default Script
}

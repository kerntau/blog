import { useEffect } from 'react'

export interface ScriptProps {
	src?: string
	id?: string
	strategy?: string
	dangerouslySetInnerHTML?: { __html: string }
	async?: boolean
	defer?: boolean
	crossOrigin?: string
	[key: string]: any
}

export function Script({ src, id, dangerouslySetInnerHTML, ...props }: ScriptProps) {
	useEffect(() => {
		if (src) {
			const script = document.createElement('script')
			script.src = src
			if (id) script.id = id
			Object.entries(props).forEach(([k, v]) => {
				if (typeof v === 'string' || typeof v === 'boolean') {
					(script as any)[k] = v
				}
			})
			document.body.appendChild(script)
			return () => {
				script.remove()
			}
		} else if (dangerouslySetInnerHTML?.__html) {
			const script = document.createElement('script')
			if (id) script.id = id
			script.innerHTML = dangerouslySetInnerHTML.__html
			document.body.appendChild(script)
			return () => {
				script.remove()
			}
		}
	}, [src, id, dangerouslySetInnerHTML])

	return null
}

export default Script

import { getCompiledMDX } from '@/lib/mdx'
import LinkClient from '@/app/link/LinkClient'

export default function LinkPage() {
	const mdx = getCompiledMDX('/link')
	return <LinkClient mdx={mdx} />
}

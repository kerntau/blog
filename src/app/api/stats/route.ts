import { NextResponse } from 'next/server'
import { getStats } from '../../../lib/content'

export const dynamic = 'force-static'

export async function GET() {
	const stats = getStats()
	return NextResponse.json(stats)
}

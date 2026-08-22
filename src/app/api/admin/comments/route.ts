import { NextResponse } from 'next/server'

export async function GET() {
	if (!process.env.ARTALK_API_URL || !process.env.ARTALK_ADMIN_TOKEN) return NextResponse.json({ comments: [], configured: false })
	try {
		const response = await fetch(`${process.env.ARTALK_API_URL.replace(/\/$/, '')}/api/v2/admin/comments`, { headers: { Authorization: `Bearer ${process.env.ARTALK_ADMIN_TOKEN}` }, cache: 'no-store' })
		if (!response.ok) throw new Error('Artalk 请求失败')
		return NextResponse.json({ comments: await response.json(), configured: true })
	} catch { return NextResponse.json({ comments: [], configured: true, error: '无法连接 Artalk 服务' }, { status: 502 }) }
}

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve, relative } from 'node:path'
import matter from 'gray-matter'
import { NextResponse } from 'next/server'
import { getContentRoot } from '@/lib/admin'

function resolveArticle(path: string) {
	const root = getContentRoot()
	const requested = resolve(root, `.${path.replace(/^\/+/, '/')}.mdx`)
	if (relative(root, requested).startsWith('..') || !requested.endsWith('.mdx')) throw new Error('无效文章路径')
	return requested
}

export async function GET(request: Request) {
	try {
		const path = new URL(request.url).searchParams.get('path')
		if (!path) return NextResponse.json({ error: '缺少文章路径' }, { status: 400 })
		const source = await readFile(resolveArticle(path), 'utf8')
		return NextResponse.json({ source })
	} catch { return NextResponse.json({ error: '无法读取文章' }, { status: 404 }) }
}

export async function PUT(request: Request) {
	try {
		const { path, source } = await request.json()
		if (typeof path !== 'string' || typeof source !== 'string') return NextResponse.json({ error: '请求内容无效' }, { status: 400 })
		matter(source)
		const target = resolveArticle(path)
		await mkdir(dirname(target), { recursive: true })
		await writeFile(target, source, 'utf8')
		return NextResponse.json({ ok: true })
	} catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : '保存失败' }, { status: 400 }) }
}

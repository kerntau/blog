import { NextResponse } from 'next/server'
import { getAllPosts, ParsedPost } from '../../../lib/content'
import { readFileSync } from 'node:fs'
import matter from 'gray-matter'
import GithubSlugger from 'github-slugger'

export const dynamic = 'force-dynamic'

export async function GET() {
	const posts = getAllPosts()
	const slugger = new GithubSlugger()
	
	const index: any[] = []

	posts.forEach((p: ParsedPost) => {
		try {
			const { content } = matter(readFileSync(p._filePath, 'utf-8'))
			slugger.reset()
			const postTitle = p.title || ''
			const articlePath = p.path.replace(/^\//, '').replace(/\//g, ' > ')

			// 简单清理内容
			const cleanContent = content
				.replace(/!\[.*?\]\(.*?\)/g, '')
				.replace(/\[(.*?)\]\(.*?\)/g, '$1')

			// 按标题拆分内容
			const lines = cleanContent.split('\n')
			let currentSection = {
				id: p.path,
				title: postTitle,
				titles: [articlePath],
				content: '',
				level: 1
			}
			
			const hierarchy: { title: string, level: number }[] = [{ title: postTitle, level: 1 }]

			lines.forEach(line => {
				const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
				if (headingMatch) {
					// 保存旧章节
					if (currentSection.content.trim() || currentSection.level === 1) {
						index.push({ ...currentSection, content: currentSection.content.trim().slice(0, 800) })
					}

					const level = headingMatch[1]!.length
					const title = headingMatch[2]!.trim()
					const slug = slugger.slug(title)

					// 更新层级
					while (hierarchy.length > 0 && hierarchy[hierarchy.length - 1]!.level >= level) {
						hierarchy.pop()
					}
					
					const parentTitles = hierarchy.map(h => h.title)
					hierarchy.push({ title, level })

					currentSection = {
						id: `${p.path}#${slug}`,
						title: title,
						titles: [articlePath, ...parentTitles],
						content: '',
						level: level
					}
				} else {
					currentSection.content += line + '\n'
				}
			})

			// 保存最后一个章节
			if (currentSection.content.trim() || currentSection.level === 1) {
				index.push({ ...currentSection, content: currentSection.content.trim().slice(0, 800) })
			}
		} catch (e) {
			console.error(`Failed to index post ${p.path}:`, e)
		}
	})

	return NextResponse.json(index)
}

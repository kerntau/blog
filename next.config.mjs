import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const redirectList = JSON.parse(readFileSync(resolve(__dirname, 'redirects.json'), 'utf-8'))

/** @type {import('next').NextConfig} */
const nextConfig = {
	sassOptions: {
		additionalData: '@use "@/assets/css/_variable.scss" as *;',
		implementation: 'sass-embedded',
	},

	images: {
		remotePatterns: [
			{ protocol: 'https', hostname: '**' },
		],
	},

	eslint: {
		ignoreDuringBuilds: true,
	},

	redirects() {
		return [
			...Object.entries(redirectList).map(([source, destination]) => ({
				source,
				destination,
				statusCode: 308,
			})),
			{
				source: '/favicon.ico',
				destination: 'https://www.zhilu.site/api/icon.png',
				statusCode: 307,
			},
		]
	},

	webpack(config) {
		config.resolve = config.resolve ?? {}
		config.resolve.alias = {
			...config.resolve.alias,
			'@': resolve(__dirname, 'src'),
			'~': resolve(__dirname, 'src'),
			'~~': resolve(__dirname),
		}
		return config
	},
}

export default nextConfig

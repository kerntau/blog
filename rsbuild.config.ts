import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginSass } from '@rsbuild/plugin-sass'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
	plugins: [
		pluginReact(),
		pluginSass({
			sassLoaderOptions: {
				additionalData: '@use "@/assets/css/_variable.scss" as *;',
			},
		}),
	],
	source: {
		entry: {
			index: './src/index.tsx',
		},
		alias: {
			'@': path.resolve(__dirname, 'src'),
			'~': path.resolve(__dirname, 'src'),
			'~~': path.resolve(__dirname),
			'/fonts': path.resolve(__dirname, 'public/fonts'),
			'next/link': path.resolve(__dirname, 'src/lib/compat-link.tsx'),
			'next/image': path.resolve(__dirname, 'src/lib/compat-image.tsx'),
			'next/navigation': path.resolve(__dirname, 'src/lib/compat-navigation.tsx'),
		},
		define: {
			'process.env.NEXT_PUBLIC_BUILD_TIME': JSON.stringify(new Date().toISOString()),
		},
	},
	html: {
		template: './index.html',
	},
	server: {
		port: 3000,
		historyApiFallback: true,
	},
	output: {
		distPath: {
			root: 'dist',
		},
		assetPrefix: '/',
	},
})

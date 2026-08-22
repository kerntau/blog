export function GET() {
	return Response.json({
		name: '序栈控制台', 
short_name: '序栈', 
start_url: '/admin/dashboard', 
scope: '/admin', 
display: 'standalone',
		theme_color: '#111214', 
background_color: '#111214',
		icons: [
			{ src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
			{ src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
			{ src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
		],
	}, { headers: { 'Content-Type': 'application/manifest+json' } })
}

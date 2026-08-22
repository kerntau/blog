import { forwardRef, type ImgHTMLAttributes } from 'react'

export interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
	src: string
	alt: string
	width?: number | string
	height?: number | string
	fill?: boolean
	priority?: boolean
	unoptimized?: boolean
	quality?: number
}

export const Image = forwardRef<HTMLImageElement, ImageProps>(({
	src,
	alt,
	width,
	height,
	fill,
	priority,
	unoptimized: _unoptimized,
	quality: _quality,
	style,
	className,
	...props
}, ref) => {
	const combinedStyle = fill
		? {
			position: 'absolute' as const,
			height: '100%',
			width: '100%',
			left: 0,
			top: 0,
			right: 0,
			bottom: 0,
			objectFit: 'cover' as const,
			...style,
		}
		: style

	return (
		<img
			ref={ref}
			src={src}
			alt={alt || ''}
			width={fill ? undefined : width}
			height={fill ? undefined : height}
			loading={priority ? 'eager' : 'lazy'}
			decoding="async"
			className={className}
			style={combinedStyle}
			{...props}
		/>
	)
})

Image.displayName = 'Image'

export default Image

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import styles from './Mask.module.scss'

interface MaskProps {
	show: boolean
	blur?: boolean | string
	zIndex?: number
	onClick?: () => void
	className?: string
}

export default function Mask({ show, blur, zIndex, onClick, className = '' }: MaskProps) {
	return (
		<AnimatePresence>
			{show && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.2 }}
					className={`${styles.bgMask} ${className}`.trim()}
					style={{
						zIndex: zIndex || 'var(--z-index-popover)',
						backdropFilter: blur ? `blur(${blur === true ? '4px' : blur})` : 'none',
					} as React.CSSProperties}
					onClick={onClick}
				/>
			)}
		</AnimatePresence>
	)
}

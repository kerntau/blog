'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@iconify/react'
import Image from '@/lib/compat-image'
import styles from './Lightbox.module.scss'

interface LightboxProps {
	src: string
	alt?: string
	open: boolean
	onClose: () => void
}

export default function Lightbox({ src, alt, open, onClose }: LightboxProps) {
	return (
		<AnimatePresence>
			{open && (
				<>
					<motion.div
						className={styles.overlay}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
					>
						<motion.div 
							className={styles.container}
							onClick={(e) => e.stopPropagation()}
						>
							<motion.div
								className={styles.image}
								initial={{ scale: 0.8, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								exit={{ scale: 0.8, opacity: 0 }}
								transition={{ type: 'spring', damping: 25, stiffness: 300 }}
							>
								<Image
									src={src}
									alt={alt || ''}
									fill
									sizes="90vw"
									className={styles.imageInner}
								/>
							</motion.div>
						</motion.div>
					</motion.div>
					<motion.div 
						className={styles.tooltip}
						initial={{ opacity: 0, y: '100%' }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: '100%' }}
						transition={{ duration: 0.2 }}
					>
						{alt && (
							<span className={styles.caption}>
								{alt}
							</span>
						)}
						<button className={styles.close} onClick={onClose} aria-label="关闭">
							<Icon icon="tabler:x" />
						</button>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	)
}

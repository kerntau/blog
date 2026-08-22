'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@iconify/react'
import Image from 'next/image'
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
						{alt && (
							<motion.div 
								className={styles.caption}
								initial={{ y: 20, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								exit={{ y: 20, opacity: 0 }}
							>
								{alt}
							</motion.div>
						)}
					</motion.div>
					<button className={styles.closeBtn} onClick={onClose}>
						<Icon icon="tabler:x" />
					</button>
				</motion.div>
			)}
		</AnimatePresence>
	)
}

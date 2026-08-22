import React, { createContext, useContext, useState, useCallback } from 'react'
import { Icon } from '@iconify/react'

interface ToastMessage {
	id: string
	type: 'info' | 'success' | 'warning' | 'error'
	message: string
}

interface ToastContextType {
	showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void
}

const ToastContext = createContext<ToastContextType>({
	showToast: () => {},
})

export const useToast = () => useContext(ToastContext)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [toasts, setToasts] = useState<ToastMessage[]>([])

	const showToast = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
		const id = Math.random().toString(36).slice(2, 9)
		setToasts(prev => [...prev, { id, type, message }])
		setTimeout(() => {
			setToasts(prev => prev.filter(t => t.id !== id))
		}, 3000)
	}, [])

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			<div
				style={{
					position: 'fixed',
					bottom: 24,
					right: 24,
					zIndex: 9999,
					display: 'flex',
					flexDirection: 'column',
					gap: 10,
					pointerEvents: 'none',
				}}
			>
				{toasts.map(t => (
					<div
						key={t.id}
						className="glass-card"
						style={{
							padding: '10px 16px',
							display: 'flex',
							alignItems: 'center',
							gap: 10,
							fontSize: 13,
							fontWeight: 600,
							boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
							pointerEvents: 'auto',
							borderColor:
								t.type === 'success'
									? 'var(--c-success)'
									: t.type === 'error'
										? 'var(--c-error)'
										: 'var(--c-primary)',
						}}
					>
						<Icon
							icon={
								t.type === 'success'
									? 'tabler:circle-check-filled'
									: t.type === 'error'
										? 'tabler:alert-circle-filled'
										: t.type === 'warning'
											? 'tabler:alert-triangle-filled'
											: 'tabler:info-circle-filled'
							}
							style={{
								color:
									t.type === 'success'
										? 'var(--c-success)'
										: t.type === 'error'
											? 'var(--c-error)'
											: 'var(--c-primary)',
								fontSize: 18,
							}}
						/>
						<span>{t.message}</span>
					</div>
				))}
			</div>
		</ToastContext.Provider>
	)
}

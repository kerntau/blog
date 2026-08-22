import { useState, useEffect, useCallback } from 'react'
import { adminApi } from '../api'
import type { HealthData } from '../types'

export type ServiceStatus = 'online' | 'offline' | 'checking'

export function useServiceHealth() {
	const [status, setStatus] = useState<ServiceStatus>('checking')
	const [healthData, setHealthData] = useState<HealthData | null>(null)
	const [lastChecked, setLastChecked] = useState<Date>(new Date())

	const checkHealth = useCallback(async () => {
		try {
			const data = await adminApi.getHealth()
			setStatus('online')
			setHealthData(data)
		}
		catch {
			setStatus('offline')
			setHealthData(null)
		}
		finally {
			setLastChecked(new Date())
		}
	}, [])

	useEffect(() => {
		checkHealth()
		const timer = setInterval(checkHealth, 6000)
		return () => clearInterval(timer)
	}, [checkHealth])

	return {
		status,
		healthData,
		lastChecked,
		recheck: checkHealth,
	}
}

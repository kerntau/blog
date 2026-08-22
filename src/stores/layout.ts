import type { RefObject } from 'react'
import { create } from 'zustand'

export type LayoutState = 'none' | 'sidebar' | 'aside' | 'search' | 'lightbox'
export type WidgetName = string
export type AvoidTarget = RefObject<HTMLElement | null>
export interface TocItem {
	depth: number
	text: string
	id: string
}

interface LayoutStore {
	state: LayoutState
	asideWidgets: WidgetName[]
	avoidTargets: AvoidTarget[]
	close: () => void
	toggle: (key: LayoutState) => void
	setAside: (widgets?: WidgetName[]) => void
	toc: TocItem[]
	setToc: (toc: TocItem[]) => void
	addAvoidTarget: (target: AvoidTarget) => void
	removeAvoidTarget: (target: AvoidTarget) => void
}

export const useLayoutStore = create<LayoutStore>((set) => ({
	state: 'none',
	asideWidgets: [],
	avoidTargets: [],
	close: () => set({ state: 'none' }),
	toggle: (key) => set((prev) => ({ state: prev.state === key ? 'none' : key })),
	setAside: (widgets) => widgets && set({ asideWidgets: widgets }),
	toc: [],
	setToc: (toc) => set({ toc }),
	addAvoidTarget: (target) => set((prev) => ({
		avoidTargets: prev.avoidTargets.includes(target) ? prev.avoidTargets : [...prev.avoidTargets, target]
	})),
	removeAvoidTarget: (target) => set((prev) => ({
		avoidTargets: prev.avoidTargets.filter(t => t !== target)
	})),
}))

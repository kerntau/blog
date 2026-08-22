import { create } from 'zustand'

interface SearchStore {
	word: string
	isOpen: boolean
	setWord: (word: string) => void
	setIsOpen: (isOpen: boolean) => void
}

export const useSearchStore = create<SearchStore>((set) => ({
	word: '',
	isOpen: false,
	setWord: (word) => set({ word }),
	setIsOpen: (isOpen) => set({ isOpen }),
}))

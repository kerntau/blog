'use client'

import type { ReactNode } from 'react'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'

const theme = createTheme({
	palette: {
		mode: 'dark',
		primary: { main: '#66aaff', contrastText: '#111214' },
		error: { main: '#dd5555' },
		background: { default: '#17191c', paper: '#111214' },
		text: { primary: '#e6e6e6', secondary: '#b3b3b3' },
	},
	shape: { borderRadius: 8 },
	spacing: 8,
	typography: { fontFamily: 'Inter, var(--font-basic), sans-serif', button: { textTransform: 'none', fontWeight: 650 } },
	components: {
		MuiCssBaseline: { styleOverrides: { body: { backgroundColor: 'var(--c-bg-1)', color: 'var(--c-text-1)' } } },
		MuiButton: { defaultProps: { size: 'small' }, styleOverrides: { root: { minHeight: 44, borderRadius: 10 } } },
		MuiTextField: { defaultProps: { size: 'small', variant: 'standard' } },
		MuiDrawer: { styleOverrides: { paper: { backgroundColor: 'var(--c-bg)', color: 'var(--c-text-1)' } } },
	},
})

export function AdminMuiProvider({ children }: { children: ReactNode }) {
	return <ThemeProvider theme={theme}><CssBaseline enableColorScheme />{children}</ThemeProvider>
}

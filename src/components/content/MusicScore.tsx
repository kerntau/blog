'use client'

import React, { useEffect, useRef } from 'react'
import type { AbcVisualParams, SynthObjectController, SynthVisualOptions, TuneObject } from 'abcjs'
import styles from './MusicScore.module.scss'

export interface MusicScoreProps {
	abc?: string
	children?: React.ReactNode
}

export function MusicScore({ abc, children }: MusicScoreProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const synthRef = useRef<HTMLDivElement>(null)
	const synthObjRef = useRef<SynthObjectController | null>(null)

	const scoreText = (abc || (typeof children === 'string' ? children : '')).trim()

	useEffect(() => {
		let isCancelled = false

		async function initScore() {
			if (!containerRef.current || !scoreText) return

			try {
				const abcjs = await import('abcjs')
				if (isCancelled) return

				const abcVisualParams: AbcVisualParams = {
					responsive: 'resize',
				}

				const rendered = abcjs.renderAbc(containerRef.current, scoreText, abcVisualParams)
				const tuneObj: TuneObject = rendered[0]

				if (!tuneObj) return

				const synthVisualOptions: SynthVisualOptions = {
					displayLoop: true,
					displayRestart: true,
					displayPlay: true,
					displayProgress: true,
					displayWarp: true,
				}

				if (abcjs.synth && abcjs.synth.supportsAudio()) {
					try {
						const res = await fetch('https://paulrosen.github.io/midi-js-soundfonts/', { method: 'HEAD' })
						if (res.ok && synthRef.current && !isCancelled) {
							const synthObjController = new abcjs.synth.SynthController()
							synthObjRef.current = synthObjController
							synthObjController.load(synthRef.current, null, synthVisualOptions)
							synthObjController.setTune(tuneObj, false)
						}
					} catch {
						// SoundFonts fallback
					}
				}
			} catch (e) {
				console.error('[music-abc] Failed to render score:', e)
			}
		}

		initScore()

		return () => {
			isCancelled = true
			try {
				synthObjRef.current?.pause()
			} catch {}
		}
	}, [scoreText])

	return (
		<div className={`music-score ${styles.musicScore}`}>
			<div ref={containerRef} />
			<div ref={synthRef} />
		</div>
	)
}

export default MusicScore

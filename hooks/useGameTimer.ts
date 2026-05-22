'use client'
import { useState, useEffect } from 'react'
import type { Game } from '@/types'
import {
  getHeadstartSecondsLeft,
  getGameSecondsLeft,
  getNextLocationUpdateSeconds,
} from '@/lib/game-state'

export function useGameTimer(game: Game | null) {
  const [headstartLeft, setHeadstartLeft] = useState(0)
  const [gameLeft, setGameLeft] = useState(0)
  const [nextUpdateLeft, setNextUpdateLeft] = useState(0)

  useEffect(() => {
    if (!game) return
    const tick = () => {
      setHeadstartLeft(getHeadstartSecondsLeft(game))
      setGameLeft(getGameSecondsLeft(game))
      setNextUpdateLeft(getNextLocationUpdateSeconds(game))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [game])

  return { headstartLeft, gameLeft, nextUpdateLeft }
}

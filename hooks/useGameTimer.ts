'use client'
import { useState, useEffect, useRef } from 'react'
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
  const gameRef = useRef(game)
  gameRef.current = game

  useEffect(() => {
    if (!game?.id) return
    const tick = () => {
      const g = gameRef.current
      if (!g) return
      setHeadstartLeft(getHeadstartSecondsLeft(g))
      setGameLeft(getGameSecondsLeft(g))
      setNextUpdateLeft(getNextLocationUpdateSeconds(g))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  // Only restart when a new game is loaded — reads latest game via ref each tick
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.id])

  return { headstartLeft, gameLeft, nextUpdateLeft }
}

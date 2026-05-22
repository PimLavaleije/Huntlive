'use client'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/game-state'

interface GameTimerProps {
  seconds: number
  label: string
  urgent?: boolean // turns red when < 60s
  className?: string
}

export function GameTimer({ seconds, label, urgent, className }: GameTimerProps) {
  const isUrgent = urgent && seconds < 60
  const isPulsing = isUrgent && seconds < 30

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">{label}</p>
      <div
        className={cn(
          'font-mono text-5xl font-bold tabular-nums transition-colors',
          isUrgent ? 'text-red-400' : 'text-white',
          isPulsing && 'animate-pulse'
        )}
      >
        {formatTime(seconds)}
      </div>
    </div>
  )
}

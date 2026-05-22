import { cn } from '@/lib/utils'
import type { GameStatus } from '@/types'

const statusConfig: Record<GameStatus, { label: string; description: string; className: string }> = {
  waiting: { label: 'Wachten op start', description: 'De spelleider start het spel zodra iedereen klaar is', className: 'bg-gray-700/80 text-gray-200 border-gray-600' },
  headstart: { label: '⏱️ Voorsprong actief', description: 'De voortvluchtige pakt voorsprong — jagers wacht!', className: 'bg-orange-900/60 text-orange-200 border-orange-600' },
  active: { label: '🚨 De jacht is begonnen!', description: 'Jagers ontvangen periodiek de locatie van de voortvluchtige', className: 'bg-red-900/60 text-red-200 border-red-600' },
  paused: { label: '⏸️ Gepauzeerd', description: 'De spelleider heeft het spel gepauzeerd', className: 'bg-yellow-900/60 text-yellow-200 border-yellow-600' },
  finished: { label: '🏁 Spel afgelopen', description: 'Het spel is beëindigd', className: 'bg-green-900/60 text-green-200 border-green-600' },
}

export function GameStatusBanner({ status, className }: { status: GameStatus; className?: string }) {
  const config = statusConfig[status]
  return (
    <div className={cn('rounded-xl border px-4 py-3 text-center', config.className, className)}>
      <p className="font-bold text-base">{config.label}</p>
      <p className="text-xs opacity-80 mt-0.5">{config.description}</p>
    </div>
  )
}

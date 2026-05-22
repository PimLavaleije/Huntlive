import { cn } from '@/lib/utils'
import type { PlayerRole } from '@/types'

const roleConfig: Record<PlayerRole, { label: string; className: string }> = {
  fugitive: { label: '🏃 Voortvluchtige', className: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  hunter: { label: '🔍 Jager', className: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  admin: { label: '👑 Spelleider', className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
}

interface RoleBadgeProps {
  role: PlayerRole
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role]
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', config.className, className)}>
      {config.label}
    </span>
  )
}

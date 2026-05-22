'use client'
import { cn } from '@/lib/utils'
import type { PlayerRole } from '@/types'
import { useLanguage } from '@/contexts/LanguageContext'

const roleStyle: Record<PlayerRole, string> = {
  fugitive: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  hunter:   'bg-red-500/20 text-red-300 border-red-500/40',
  admin:    'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
}

export function RoleBadge({ role, className }: { role: PlayerRole; className?: string }) {
  const { t } = useLanguage()
  const label = role === 'fugitive' ? t('role_fugitive') : role === 'hunter' ? t('role_hunter') : t('role_admin')
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', roleStyle[role], className)}>
      {label}
    </span>
  )
}

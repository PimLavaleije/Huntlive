'use client'
import { cn } from '@/lib/utils'
import type { GameStatus } from '@/types'
import { useLanguage } from '@/contexts/LanguageContext'

export function GameStatusBanner({ status, className }: { status: GameStatus; className?: string }) {
  const { t } = useLanguage()

  const configs: Record<GameStatus, { label: string; description: string; className: string }> = {
    waiting:   { label: t('status_waiting_label'),   description: t('status_waiting_desc'),   className: 'bg-gray-700/80 text-gray-200 border-gray-600' },
    headstart: { label: t('status_headstart_label'), description: t('status_headstart_desc'), className: 'bg-orange-900/60 text-orange-200 border-orange-600' },
    active:    { label: t('status_active_label'),    description: t('status_active_desc'),    className: 'bg-red-900/60 text-red-200 border-red-600' },
    paused:    { label: t('status_paused_label'),    description: t('status_paused_desc'),    className: 'bg-yellow-900/60 text-yellow-200 border-yellow-600' },
    finished:  { label: t('status_finished_label'),  description: t('status_finished_desc'),  className: 'bg-green-900/60 text-green-200 border-green-600' },
  }

  const config = configs[status]
  return (
    <div className={cn('rounded-xl border px-4 py-3 text-center', config.className, className)}>
      <p className="font-bold text-base">{config.label}</p>
      <p className="text-xs opacity-80 mt-0.5">{config.description}</p>
    </div>
  )
}

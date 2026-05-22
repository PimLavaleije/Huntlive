import { cn } from '@/lib/utils'

interface LocationStatusProps {
  accuracy: 'good' | 'ok' | 'poor' | null
  error: string | null
  loading: boolean
  className?: string
}

const accuracyConfig = {
  good: { label: 'GPS: Uitstekend', className: 'text-green-400', dot: 'bg-green-400' },
  ok: { label: 'GPS: Redelijk', className: 'text-yellow-400', dot: 'bg-yellow-400' },
  poor: { label: 'GPS: Zwak signaal', className: 'text-red-400', dot: 'bg-red-400 animate-pulse' },
}

export function LocationStatus({ accuracy, error, loading, className }: LocationStatusProps) {
  if (loading) {
    return (
      <div className={cn('flex items-center gap-2 text-xs text-gray-400', className)}>
        <span className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
        GPS ophalen...
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('flex items-center gap-2 text-xs text-red-400', className)}>
        <span className="w-2 h-2 rounded-full bg-red-500" />
        {error}
      </div>
    )
  }

  if (!accuracy) return null

  const config = accuracyConfig[accuracy]
  return (
    <div className={cn('flex items-center gap-2 text-xs', config.className, className)}>
      <span className={cn('w-2 h-2 rounded-full', config.dot)} />
      {config.label}
    </div>
  )
}

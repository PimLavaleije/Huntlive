'use client'
import { useState } from 'react'
import { Button } from './ui/Button'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

interface CaptureButtonProps {
  onCapture: () => Promise<{ success: boolean; distance?: number; message: string }>
  withinRadius?: boolean
  distanceMeters?: number | null
  captureRadius?: number
  className?: string
}

export function CaptureButton({ onCapture, withinRadius, distanceMeters, captureRadius, className }: CaptureButtonProps) {
  const { t } = useLanguage()
  const [state, setState] = useState<'idle' | 'confirming' | 'loading' | 'result'>('idle')
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleClick = () => {
    if (state === 'idle') { setState('confirming'); return }
  }

  const handleConfirm = async () => {
    setState('loading')
    const res = await onCapture()
    setResult(res)
    setState('result')
    if (!res.success) {
      setTimeout(() => { setState('idle'); setResult(null) }, 5000)
    }
  }

  if (state === 'result' && result) {
    return (
      <div className={cn('text-center p-4 rounded-2xl border', result.success ? 'bg-green-900/50 border-green-600 text-green-300' : 'bg-red-900/50 border-red-600 text-red-300', className)}>
        <p className="font-bold text-lg">{result.success ? t('capture_caught') : t('capture_failed')}</p>
        <p className="text-sm mt-1">{result.message}</p>
      </div>
    )
  }

  if (state === 'confirming') {
    return (
      <div className={cn('flex flex-col gap-3 p-4 bg-red-900/30 border border-red-600 rounded-2xl', className)}>
        <p className="text-center text-white font-semibold">{t('capture_confirm')}</p>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setState('idle')}>{t('cancel')}</Button>
          <Button variant="danger" className="flex-1" onClick={handleConfirm}>{t('capture_confirmYes')}</Button>
        </div>
      </div>
    )
  }

  if (withinRadius === false) {
    const dist = distanceMeters != null ? Math.round(distanceMeters) : null
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <button disabled className="w-full bg-gray-700 text-gray-400 font-bold py-4 px-6 rounded-2xl text-lg border border-gray-600 cursor-not-allowed opacity-60">
          {t('capture_btn')}
        </button>
        <p className="text-center text-xs text-gray-400">
          {dist != null
            ? t('capture_distInfo', { dist, radius: captureRadius ?? '?' })
            : t('capture_distInfoNoPos', { radius: captureRadius ?? '?' })}
        </p>
      </div>
    )
  }

  return (
    <Button variant="danger" size="xl" loading={state === 'loading'} onClick={handleClick} className={cn('w-full', className)}>
      {t('capture_btn')}
    </Button>
  )
}

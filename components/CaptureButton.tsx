'use client'
import { useState } from 'react'
import { Button } from './ui/Button'
import { cn } from '@/lib/utils'

interface CaptureButtonProps {
  onCapture: () => Promise<{ success: boolean; distance?: number; message: string }>
  className?: string
}

export function CaptureButton({ onCapture, className }: CaptureButtonProps) {
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
    // Reset after 5 seconds if failed
    if (!res.success) {
      setTimeout(() => { setState('idle'); setResult(null) }, 5000)
    }
  }

  if (state === 'result' && result) {
    return (
      <div className={cn('text-center p-4 rounded-2xl border', result.success ? 'bg-green-900/50 border-green-600 text-green-300' : 'bg-red-900/50 border-red-600 text-red-300', className)}>
        <p className="font-bold text-lg">{result.success ? '🎉 Gevangen!' : '❌ Mislukt'}</p>
        <p className="text-sm mt-1">{result.message}</p>
      </div>
    )
  }

  if (state === 'confirming') {
    return (
      <div className={cn('flex flex-col gap-3 p-4 bg-red-900/30 border border-red-600 rounded-2xl', className)}>
        <p className="text-center text-white font-semibold">Weet je zeker dat je de voortvluchtige hebt gevangen?</p>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setState('idle')}>Annuleer</Button>
          <Button variant="danger" className="flex-1" onClick={handleConfirm}>Ja, gevangen!</Button>
        </div>
      </div>
    )
  }

  return (
    <Button
      variant="danger"
      size="xl"
      loading={state === 'loading'}
      onClick={handleClick}
      className={cn('w-full', className)}
    >
      🎯 Boef gevangen!
    </Button>
  )
}

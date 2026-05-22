'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function HomePage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [joiningError, setJoiningError] = useState('')

  const handleJoin = () => {
    if (!code.trim()) { setJoiningError('Voer een gamecode in'); return }
    router.push(`/game/${code.trim().toUpperCase()}`)
  }

  return (
    <main className="flex flex-col min-h-svh bg-gray-900 text-white">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center flex-1 px-5 py-16 text-center">
        <div className="mb-6 text-6xl">🎯</div>
        <h1 className="text-4xl font-black mb-2 tracking-tight">Chase Zone</h1>
        <p className="text-gray-400 text-lg max-w-sm">
          Echte GPS-jacht in de echte wereld. Eén voortvluchtige, meerdere jagers.
        </p>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-3 mt-8 w-full max-w-sm text-sm">
          <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
            <div className="text-2xl mb-1">🏃</div>
            <div className="text-orange-400 font-semibold">Voorsprong</div>
            <div className="text-gray-400 text-xs mt-1">Boef pakt een vluchtvlucht</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
            <div className="text-2xl mb-1">📍</div>
            <div className="text-blue-400 font-semibold">GPS Pings</div>
            <div className="text-gray-400 text-xs mt-1">Jagers krijgen locatie-updates</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
            <div className="text-2xl mb-1">🏆</div>
            <div className="text-green-400 font-semibold">Win of ontsnap</div>
            <div className="text-gray-400 text-xs mt-1">Vang of overleef de tijd</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 mt-10 w-full max-w-sm">
          <Button size="xl" variant="primary" onClick={() => router.push('/create')} className="w-full">
            Nieuw spel aanmaken
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-500">
              <span className="bg-gray-900 px-3">of join een bestaand spel</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setJoiningError('') }}
              placeholder="Gamecode (bijv. AB3X9Z)"
              className="flex-1 uppercase tracking-widest font-mono"
              maxLength={6}
              error={joiningError}
            />
            <Button onClick={handleJoin} disabled={!code.trim()} className="shrink-0">
              Join
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-600">
        Chase Zone — Real-Life GPS Chase Game
      </footer>
    </main>
  )
}

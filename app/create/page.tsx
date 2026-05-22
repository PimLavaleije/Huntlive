'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, generateGameCode } from '@/lib/supabase-client'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

type Step = 'settings' | 'identity'

export default function CreateGamePage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('settings')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [settings, setSettings] = useState({
    name: '',
    duration_minutes: 60,
    headstart_minutes: 5,
    location_interval_minutes: 5,
    capture_radius_meters: 50,
    rules_text: '',
    geofence_radius_meters: '',
  })

  const [hostName, setHostName] = useState('')

  const handleCreate = async () => {
    if (!hostName.trim()) { setError('Vul je naam in'); return }
    setLoading(true)
    setError('')

    try {
      const code = generateGameCode()

      // Create game
      const { data: game, error: gameErr } = await supabase.from('games').insert({
        code,
        name: settings.name || `Spel ${code}`,
        status: 'waiting',
        created_by: hostName.trim(),
        duration_minutes: settings.duration_minutes,
        headstart_minutes: settings.headstart_minutes,
        location_interval_minutes: settings.location_interval_minutes,
        capture_radius_meters: settings.capture_radius_meters,
        rules_text: settings.rules_text || null,
        geofence_radius_meters: settings.geofence_radius_meters ? Number(settings.geofence_radius_meters) : null,
        geofence_center_lat: null,
        geofence_center_lng: null,
        winner: null,
        started_at: null,
        active_at: null,
        ends_at: null,
      }).select().single()

      if (gameErr || !game) throw new Error(gameErr?.message ?? 'Spel aanmaken mislukt')

      // Create host player
      const { data: player, error: playerErr } = await supabase.from('players').insert({
        game_id: game.id,
        user_name: hostName.trim(),
        role: 'admin',
        is_host: true,
        last_seen_at: new Date().toISOString(),
      }).select().single()

      if (playerErr || !player) throw new Error(playerErr?.message ?? 'Speler aanmaken mislukt')

      // Store player id in sessionStorage for this session
      sessionStorage.setItem(`player_${code}`, player.id)
      sessionStorage.setItem(`player_name_${code}`, hostName.trim())

      router.push(`/game/${code}/lobby`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-svh bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white p-1">
          ← Terug
        </button>
        <h1 className="font-bold text-lg">Nieuw spel aanmaken</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-lg mx-auto w-full">
        {step === 'settings' ? (
          <div className="flex flex-col gap-5">
            <Card>
              <h2 className="font-semibold text-gray-200 mb-4">Spel-instellingen</h2>
              <div className="flex flex-col gap-4">
                <Input
                  label="Spelnaam (optioneel)"
                  placeholder="bijv. Jacht door Amsterdam"
                  value={settings.name}
                  onChange={(e) => setSettings((s) => ({ ...s, name: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Speelduur (min)"
                    type="number"
                    min={5}
                    max={240}
                    value={settings.duration_minutes}
                    onChange={(e) => setSettings((s) => ({ ...s, duration_minutes: Number(e.target.value) }))}
                  />
                  <Input
                    label="Voorsprong (min)"
                    type="number"
                    min={1}
                    max={30}
                    value={settings.headstart_minutes}
                    onChange={(e) => setSettings((s) => ({ ...s, headstart_minutes: Number(e.target.value) }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Locatie-interval (min)"
                    type="number"
                    min={1}
                    max={30}
                    value={settings.location_interval_minutes}
                    onChange={(e) => setSettings((s) => ({ ...s, location_interval_minutes: Number(e.target.value) }))}
                    hint="Hoe vaak jagers een locatie-update krijgen"
                  />
                  <Input
                    label="Vangradius (meter)"
                    type="number"
                    min={10}
                    max={500}
                    value={settings.capture_radius_meters}
                    onChange={(e) => setSettings((s) => ({ ...s, capture_radius_meters: Number(e.target.value) }))}
                    hint="Hoe dichtbij om te vangen"
                  />
                </div>
                <Input
                  label="Speelgebied-radius (meter, optioneel)"
                  type="number"
                  min={100}
                  placeholder="Leeg = geen geofence"
                  value={settings.geofence_radius_meters}
                  onChange={(e) => setSettings((s) => ({ ...s, geofence_radius_meters: e.target.value }))}
                  hint="Gecentreerd op startlocatie boef"
                />
                <Textarea
                  label="Vervoersregels / extra info (optioneel)"
                  placeholder="bijv. Geen openbaar vervoer, alleen te voet en fiets..."
                  rows={3}
                  value={settings.rules_text}
                  onChange={(e) => setSettings((s) => ({ ...s, rules_text: e.target.value }))}
                />
              </div>
            </Card>

            {/* Preview */}
            <Card className="bg-gray-800/50">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Samenvatting</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ['Speelduur', `${settings.duration_minutes} min`],
                  ['Voorsprong', `${settings.headstart_minutes} min`],
                  ['Locatie-ping', `elke ${settings.location_interval_minutes} min`],
                  ['Vangradius', `${settings.capture_radius_meters}m`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-gray-500">{k}</span>
                    <span className="text-white font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Button size="lg" onClick={() => setStep('identity')} className="w-full">
              Verder →
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <Card>
              <h2 className="font-semibold text-gray-200 mb-4">Jouw naam als spelleider</h2>
              <Input
                label="Je naam"
                placeholder="bijv. Max"
                value={hostName}
                onChange={(e) => { setHostName(e.target.value); setError('') }}
                autoFocus
              />
            </Card>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <div className="flex gap-3">
              <Button variant="ghost" size="lg" onClick={() => setStep('settings')} className="flex-1">
                ← Terug
              </Button>
              <Button size="lg" loading={loading} onClick={handleCreate} className="flex-1">
                Spel aanmaken 🎯
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

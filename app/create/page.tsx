'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, generateGameCode } from '@/lib/supabase-client'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useLanguage } from '@/contexts/LanguageContext'
import { LangToggle } from '@/components/LangToggle'

type Step = 'settings' | 'identity'

export default function CreateGamePage() {
  const router = useRouter()
  const { t } = useLanguage()
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
    if (!hostName.trim()) { setError(t('create_nameError')); return }
    setLoading(true)
    setError('')

    try {
      const code = generateGameCode()

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

      if (gameErr || !game) throw new Error(gameErr?.message ?? t('create_nameError'))

      const { data: player, error: playerErr } = await supabase.from('players').insert({
        game_id: game.id,
        user_name: hostName.trim(),
        role: 'admin',
        is_host: true,
        last_seen_at: new Date().toISOString(),
      }).select().single()

      if (playerErr || !player) throw new Error(playerErr?.message ?? t('create_nameError'))

      sessionStorage.setItem(`player_${code}`, player.id)
      sessionStorage.setItem(`player_name_${code}`, hostName.trim())

      router.push(`/game/${code}/lobby`)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('create_nameError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-svh text-white flex flex-col" style={{ background: '#000000' }}>
      <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: '1px solid #1a2540' }}>
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-white transition-colors p-1 text-sm tracking-widest uppercase font-bold"
        >
          {t('back')}
        </button>
        <h1 className="font-black tracking-widest uppercase text-white text-sm">{t('create_title')}</h1>
        <div className="ml-auto"><LangToggle /></div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-lg mx-auto w-full">
        {step === 'settings' ? (
          <div className="flex flex-col gap-5">
            <Card>
              <h2 className="font-black tracking-widest uppercase text-xs text-gray-400 mb-4">{t('create_settings')}</h2>
              <div className="flex flex-col gap-4">
                <Input
                  label={t('create_gameName')}
                  placeholder={t('create_gameNamePlaceholder')}
                  value={settings.name}
                  onChange={(e) => setSettings((s) => ({ ...s, name: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={t('create_duration')}
                    type="number"
                    min={5}
                    max={240}
                    value={settings.duration_minutes}
                    onChange={(e) => setSettings((s) => ({ ...s, duration_minutes: Number(e.target.value) }))}
                  />
                  <Input
                    label={t('create_headstart')}
                    type="number"
                    min={1}
                    max={30}
                    value={settings.headstart_minutes}
                    onChange={(e) => setSettings((s) => ({ ...s, headstart_minutes: Number(e.target.value) }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={t('create_locationInterval')}
                    type="number"
                    min={1}
                    max={30}
                    value={settings.location_interval_minutes}
                    onChange={(e) => setSettings((s) => ({ ...s, location_interval_minutes: Number(e.target.value) }))}
                    hint={t('create_locationIntervalHint')}
                  />
                  <Input
                    label={t('create_captureRadius')}
                    type="number"
                    min={10}
                    max={500}
                    value={settings.capture_radius_meters}
                    onChange={(e) => setSettings((s) => ({ ...s, capture_radius_meters: Number(e.target.value) }))}
                    hint={t('create_captureRadiusHint')}
                  />
                </div>
                <Input
                  label={t('create_geofenceRadius')}
                  type="number"
                  min={100}
                  placeholder={t('create_geofencePlaceholder')}
                  value={settings.geofence_radius_meters}
                  onChange={(e) => setSettings((s) => ({ ...s, geofence_radius_meters: e.target.value }))}
                  hint={t('create_geofenceHint')}
                />
                <Textarea
                  label={t('create_rules')}
                  placeholder={t('create_rulesPlaceholder')}
                  rows={3}
                  value={settings.rules_text}
                  onChange={(e) => setSettings((s) => ({ ...s, rules_text: e.target.value }))}
                />
              </div>
            </Card>

            <Card>
              <h3 className="font-black tracking-widest uppercase text-xs text-gray-400 mb-3">{t('create_summary')}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  [t('create_summaryDuration'), t('create_summaryDurationVal', { n: settings.duration_minutes })],
                  [t('create_summaryHeadstart'), t('create_summaryDurationVal', { n: settings.headstart_minutes })],
                  [t('create_summaryInterval'), t('create_summaryIntervalVal', { n: settings.location_interval_minutes })],
                  [t('create_summaryRadius'), t('create_summaryRadiusVal', { n: settings.capture_radius_meters })],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-gray-600 text-xs">{k}</span>
                    <span className="text-white font-bold text-xs">{v}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Button size="lg" onClick={() => setStep('identity')} className="w-full">
              {t('create_continue')}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <Card>
              <h2 className="font-black tracking-widest uppercase text-xs text-gray-400 mb-4">{t('create_hostName')}</h2>
              <Input
                label={t('create_yourName')}
                placeholder={t('create_yourNamePlaceholder')}
                value={hostName}
                onChange={(e) => { setHostName(e.target.value); setError('') }}
                autoFocus
              />
            </Card>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <div className="flex gap-3">
              <Button variant="ghost" size="lg" onClick={() => setStep('settings')} className="flex-1">
                {t('back')}
              </Button>
              <Button
                size="lg"
                loading={loading}
                onClick={handleCreate}
                className="flex-1"
                style={{ background: 'linear-gradient(135deg, #6b0000, #b91c1c, #991b1b)', border: '1px solid #ef4444', boxShadow: '0 0 20px rgba(239,68,68,0.3)' }}
              >
                {t('create_createBtn')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

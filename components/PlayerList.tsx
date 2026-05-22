'use client'
import { RoleBadge } from './RoleBadge'
import type { Player } from '@/types'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

interface PlayerListProps {
  players: Player[]
  currentPlayerId?: string | null
  showRoles?: boolean
  onRoleChange?: (playerId: string, role: Player['role']) => void
  className?: string
}

export function PlayerList({ players, currentPlayerId, showRoles = true, onRoleChange, className }: PlayerListProps) {
  const { t } = useLanguage()
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {players.map((player) => (
        <div
          key={player.id}
          className="flex items-center justify-between px-4 py-3 rounded-xl border transition-colors"
          style={player.id === currentPlayerId
            ? { background: 'rgba(37,99,235,0.1)', border: '1px solid #1e3a8a' }
            : { background: '#0d1018', border: '1px solid #1a2540' }}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">
              {player.user_name}
              {player.id === currentPlayerId && <span className="text-xs text-gray-400 ml-1">({t('playerList_you')})</span>}
            </span>
            {player.is_host && <span className="text-xs text-yellow-400">★</span>}
          </div>
          <div className="flex items-center gap-2">
            {showRoles && onRoleChange ? (
              <RoleSelector role={player.role} onChange={(r) => onRoleChange(player.id, r)} />
            ) : (
              showRoles && <RoleBadge role={player.role} />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function RoleSelector({ role, onChange }: { role: Player['role']; onChange: (r: Player['role']) => void }) {
  const { t } = useLanguage()
  return (
    <select
      value={role}
      onChange={(e) => onChange(e.target.value as Player['role'])}
      className="text-white text-xs rounded-lg px-2 py-1"
      style={{ background: '#0b1120', border: '1px solid #1e2d45' }}
    >
      <option value="hunter">{t('playerList_roleHunter')}</option>
      <option value="fugitive">{t('playerList_roleFugitive')}</option>
      <option value="admin">{t('playerList_roleAdmin')}</option>
    </select>
  )
}

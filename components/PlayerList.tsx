import { RoleBadge } from './RoleBadge'
import type { Player } from '@/types'
import { cn } from '@/lib/utils'

interface PlayerListProps {
  players: Player[]
  currentPlayerId?: string | null
  showRoles?: boolean
  onRoleChange?: (playerId: string, role: Player['role']) => void
  className?: string
}

export function PlayerList({ players, currentPlayerId, showRoles = true, onRoleChange, className }: PlayerListProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {players.map((player) => (
        <div
          key={player.id}
          className={cn(
            'flex items-center justify-between px-4 py-3 rounded-xl border transition-colors',
            player.id === currentPlayerId
              ? 'bg-blue-900/30 border-blue-600'
              : 'bg-gray-700/50 border-gray-600'
          )}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">
              {player.user_name}
              {player.id === currentPlayerId && <span className="text-xs text-gray-400 ml-1">(jij)</span>}
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
  return (
    <select
      value={role}
      onChange={(e) => onChange(e.target.value as Player['role'])}
      className="bg-gray-600 border border-gray-500 text-white text-xs rounded-lg px-2 py-1"
    >
      <option value="hunter">🔍 Jager</option>
      <option value="fugitive">🏃 Voortvluchtige</option>
      <option value="admin">👑 Spelleider</option>
    </select>
  )
}

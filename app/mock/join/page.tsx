'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MockJoinPage() {
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const id   = params.get('id')
    const name = params.get('name')

    if (!code || !id || !name) { router.replace('/mock'); return }

    sessionStorage.setItem(`player_${code}`, id)
    sessionStorage.setItem(`player_name_${code}`, name)
    router.replace(`/game/${code}/play`)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-svh flex items-center justify-center text-gray-600 text-xs tracking-widest uppercase" style={{ background: '#000000' }}>
      Verbinden...
    </div>
  )
}

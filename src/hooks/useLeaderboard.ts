import { useState, useEffect } from 'react'
import {
  fetchLeaderboard,
  getDemoLeaderboard,
} from '../services/leaderboardService'
import type { LeaderboardEntry } from '../services/leaderboardService'

interface UseLeaderboardResult {
  entries: LeaderboardEntry[]
  loading: boolean
  error: string | null
  isDemoMode: boolean
}

export function useLeaderboard(): UseLeaderboardResult {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadLeaderboard() {
      setLoading(true)
      setError(null)

      try {
        const data = await fetchLeaderboard()
        if (!cancelled) {
          setEntries(data)
          setIsDemoMode(false)
        }
      } catch {
        if (!cancelled) {
          setEntries(getDemoLeaderboard())
          setIsDemoMode(true)
          setError(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadLeaderboard()
    return () => {
      cancelled = true
    }
  }, [])

  return { entries, loading, error, isDemoMode }
}

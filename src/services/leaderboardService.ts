import { ENDPOINTS } from '../config/endpoints'

export interface LeaderboardEntry {
  rank: number
  username: string
  avatar_url: string
  total_points: number
  classifications: number
  accuracy: number
  badge?: string
}

/**
 * Fetches the leaderboard data from the SolarHub data repository.
 */
export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const response = await fetch(ENDPOINTS.LEADERBOARD)
  if (!response.ok) {
    throw new Error(`Failed to fetch leaderboard: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Returns demo leaderboard data for offline / demo mode.
 */
export function getDemoLeaderboard(): LeaderboardEntry[] {
  return [
    {
      rank: 1,
      username: 'AstroHunter42',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AstroHunter42',
      total_points: 4850,
      classifications: 312,
      accuracy: 0.97,
      badge: '🌟 Solar Expert',
    },
    {
      rank: 2,
      username: 'SunspotTracker',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SunspotTracker',
      total_points: 3720,
      classifications: 248,
      accuracy: 0.94,
      badge: '🔥 Flare Chaser',
    },
    {
      rank: 3,
      username: 'CoronalObserver',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CoronalObserver',
      total_points: 3105,
      classifications: 215,
      accuracy: 0.92,
      badge: '🌑 Corona Master',
    },
    {
      rank: 4,
      username: 'HelioStar99',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HelioStar99',
      total_points: 2890,
      classifications: 198,
      accuracy: 0.91,
    },
    {
      rank: 5,
      username: 'SolarWatcher',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SolarWatcher',
      total_points: 2450,
      classifications: 175,
      accuracy: 0.89,
    },
    {
      rank: 6,
      username: 'NebulaNaut',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NebulaNaut',
      total_points: 2100,
      classifications: 152,
      accuracy: 0.88,
    },
    {
      rank: 7,
      username: 'StargazerX',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=StargazerX',
      total_points: 1950,
      classifications: 138,
      accuracy: 0.87,
    },
    {
      rank: 8,
      username: 'ProminenceHero',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProminenceHero',
      total_points: 1720,
      classifications: 125,
      accuracy: 0.86,
    },
    {
      rank: 9,
      username: 'FilamentFinder',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=FilamentFinder',
      total_points: 1540,
      classifications: 112,
      accuracy: 0.85,
    },
    {
      rank: 10,
      username: 'ChromosCientist',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ChromosCientist',
      total_points: 1380,
      classifications: 98,
      accuracy: 0.84,
    },
  ]
}

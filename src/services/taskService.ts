import { ENDPOINTS } from '../config/endpoints'

export interface Task {
  id: string
  url: string
  task_type: string
  ml_prediction: string
  confidence: number
  points: number
}

const CACHE_KEY = 'solarhub_tasks_cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface CacheEntry {
  data: Task[]
  timestamp: number
}

/**
 * Fetches tasks from the SolarHub data repository.
 * Results are cached in sessionStorage for the given TTL.
 */
export async function fetchTasks(): Promise<Task[]> {
  // Check cache first
  const cached = sessionStorage.getItem(CACHE_KEY)
  if (cached) {
    const entry: CacheEntry = JSON.parse(cached)
    if (Date.now() - entry.timestamp < CACHE_TTL) {
      return entry.data
    }
  }

  const response = await fetch(ENDPOINTS.TASKS)
  if (!response.ok) {
    throw new Error(`Failed to fetch tasks: ${response.statusText}`)
  }

  const data: Task[] = await response.json()

  // Write to cache
  const entry: CacheEntry = { data, timestamp: Date.now() }
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry))

  return data
}

/**
 * Returns mock/demo tasks to use when the remote endpoint is unavailable.
 */
export function getDemoTasks(): Task[] {
  return [
    {
      id: 'task001',
      url: 'https://images.unsplash.com/photo-1614642264762-d0a3b8bf3700?w=800',
      task_type: 'sunspot',
      ml_prediction: 'sunspot',
      confidence: 0.92,
      points: 10,
    },
    {
      id: 'task002',
      url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800',
      task_type: 'solar_flare',
      ml_prediction: 'solar_flare',
      confidence: 0.78,
      points: 15,
    },
    {
      id: 'task003',
      url: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=800',
      task_type: 'coronal_hole',
      ml_prediction: 'coronal_hole',
      confidence: 0.65,
      points: 12,
    },
    {
      id: 'task004',
      url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800',
      task_type: 'prominence',
      ml_prediction: 'sunspot',
      confidence: 0.55,
      points: 20,
    },
    {
      id: 'task005',
      url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800',
      task_type: 'filament',
      ml_prediction: 'filament',
      confidence: 0.88,
      points: 14,
    },
  ]
}

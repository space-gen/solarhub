import { useState, useEffect, useCallback } from 'react'
import { fetchTasks, getDemoTasks } from '../services/taskService'
import type { Task } from '../services/taskService'

interface UseTasksResult {
  tasks: Task[]
  currentTask: Task | null
  currentIndex: number
  loading: boolean
  error: string | null
  totalTasks: number
  nextTask: () => void
  prevTask: () => void
  goToTask: (index: number) => void
  isDemoMode: boolean
}

export function useTasks(): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadTasks() {
      setLoading(true)
      setError(null)

      try {
        const data = await fetchTasks()
        if (!cancelled) {
          setTasks(data)
          setIsDemoMode(false)
        }
      } catch {
        if (!cancelled) {
          // Fall back to demo tasks when the endpoint is unavailable
          setTasks(getDemoTasks())
          setIsDemoMode(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadTasks()
    return () => {
      cancelled = true
    }
  }, [])

  const nextTask = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % Math.max(tasks.length, 1))
  }, [tasks.length])

  const prevTask = useCallback(() => {
    setCurrentIndex((i) =>
      i === 0 ? Math.max(tasks.length - 1, 0) : i - 1,
    )
  }, [tasks.length])

  const goToTask = useCallback(
    (index: number) => {
      if (index >= 0 && index < tasks.length) {
        setCurrentIndex(index)
      }
    },
    [tasks.length],
  )

  return {
    tasks,
    currentTask: tasks[currentIndex] ?? null,
    currentIndex,
    loading,
    error,
    totalTasks: tasks.length,
    nextTask,
    prevTask,
    goToTask,
    isDemoMode,
  }
}

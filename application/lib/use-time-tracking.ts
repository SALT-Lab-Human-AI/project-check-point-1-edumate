import { useEffect, useRef } from 'react'
import { useApp } from '@/store/app-context'
import { recordTimeSpent } from '@/lib/api-service'

/**
 * Hook to track time spent on a page/module
 * @param module - The module identifier ('s1', 's2', or 's3')
 * @param enabled - Whether tracking is enabled (default: true)
 */
export function useTimeTracking(module: 's1' | 's2' | 's3', enabled: boolean = true) {
  const { user } = useApp()
  const startTimeRef = useRef<number | null>(null)
  const sessionStartTimeRef = useRef<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const accumulatedTimeRef = useRef<number>(0)

  useEffect(() => {
    if (!enabled || !user || user.role !== 'student') {
      return
    }

    // Start tracking when component mounts - this is the session start
    const sessionStart = Date.now()
    sessionStartTimeRef.current = sessionStart
    startTimeRef.current = sessionStart

    // Send time updates every 30 seconds to update cumulative totals (not session records)
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        
        if (elapsed > 0) {
          accumulatedTimeRef.current += elapsed
          
          // Update cumulative total (for stats) but don't create session yet
          recordTimeSpent({
            student_id: user.id,
            module,
            time_spent_seconds: elapsed,
            update_total_only: true // Only update cumulative, don't create session
          }).catch(err => {
            console.error('Failed to update cumulative time:', err)
          })
          
          // Reset start time for next interval
          startTimeRef.current = Date.now()
        }
      }
    }, 30000) // Every 30 seconds for cumulative updates

    // Cleanup: record session when component unmounts (user leaves feature)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      
      if (sessionStartTimeRef.current && startTimeRef.current) {
        const sessionEnd = Date.now()
        const finalElapsed = Math.floor((sessionEnd - startTimeRef.current) / 1000)
        const totalSessionTime = accumulatedTimeRef.current + finalElapsed
        
        if (totalSessionTime > 0 && user && user.role === 'student') {
          // Record the complete session (session time only)
          recordTimeSpent({
            student_id: user.id,
            module,
            time_spent_seconds: totalSessionTime,
            session_started_at: new Date(sessionStartTimeRef.current).toISOString(),
            session_ended_at: new Date(sessionEnd).toISOString(),
            is_session: true // This is a complete session
          }).then(() => {
            console.log(`[Time Tracking] Session recorded: ${totalSessionTime}s for ${module}`)
            // Dispatch custom event to notify dashboard to refresh
            window.dispatchEvent(new CustomEvent('timeTrackingUpdated', { 
              detail: { module, time_spent: totalSessionTime } 
            }))
          }).catch(err => {
            console.error('Failed to record session:', err)
          })
        }
        
        // Reset tracking
        startTimeRef.current = null
        sessionStartTimeRef.current = null
        accumulatedTimeRef.current = 0
      }
    }
  }, [module, enabled, user])

  // Handle page visibility changes (when user switches tabs)
  useEffect(() => {
    if (!enabled || !user || user.role !== 'student') {
      return
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, pause tracking
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
          accumulatedTimeRef.current += elapsed
          startTimeRef.current = null
        }
      } else {
        // Page is visible again, resume tracking (but keep same session start time)
        if (sessionStartTimeRef.current) {
          startTimeRef.current = Date.now()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, user])
}


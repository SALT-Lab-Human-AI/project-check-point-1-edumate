"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/store/app-context"
import { NavBar } from "@/components/nav-bar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BookOpen, FileCheck, Brain, Clock, Target, TrendingUp, Loader2 } from "lucide-react"
import { getStudentStats } from "@/lib/api-service"
import Link from "next/link"

interface StudentStats {
  total_quizzes: number
  avg_score: number
  total_correct: number
  total_questions: number
  accuracy: number
  s1_sessions: number
  s2_sessions: number
  today_total_time_seconds: number
  today_quiz_count: number
  recent_quizzes: any[]
  recent_activities?: any[]
}

export default function StudentDashboard() {
  const { user } = useApp()
  const router = useRouter()
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(async (isInitialLoad = false) => {
    if (!user || user.role !== "student") return
    
    if (isInitialLoad) {
      setLoading(true)
    }
    
    try {
      const response = await getStudentStats(user.id)
      if (response.success && response.stats) {
        setStats(response.stats)
      } else {
        console.warn('[Student Dashboard] Stats response not successful:', response)
      }
    } catch (err) {
      console.error("Failed to load stats:", err)
    } finally {
      if (isInitialLoad) {
        setLoading(false)
      }
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      router.push("/login")
    } else if (user.role !== "student") {
      router.push("/parent")
    } else {
      // Initial load
      loadStats(true)
      
      // Set up real-time polling every 10 seconds for more frequent updates
      const interval = setInterval(() => {
        loadStats(false)
      }, 10000) // Poll every 10 seconds for faster updates
      
      // Refresh immediately when page becomes visible (user returns from another page)
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          // Page is visible, refresh stats immediately
          loadStats(false)
        }
      }
      
      // Refresh when window gains focus (user clicks back to tab)
      const handleFocus = () => {
        loadStats(false)
      }
      
      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('focus', handleFocus)
      
      return () => {
        clearInterval(interval)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('focus', handleFocus)
      }
    }
  }, [user, router, loadStats])
  
  // Listen for time tracking updates from other pages (when user leaves a session)
  useEffect(() => {
    if (!user || user.role !== "student") return
    
    const handleTimeTrackingUpdate = (event: CustomEvent) => {
      // Refresh stats immediately when a session ends
      console.log('[Student Dashboard] Session ended, refreshing stats...', event.detail)
      // Small delay to ensure backend has processed the session
      setTimeout(() => {
        loadStats(false)
      }, 300)
    }
    
    window.addEventListener('timeTrackingUpdated', handleTimeTrackingUpdate as EventListener)
    
    return () => {
      window.removeEventListener('timeTrackingUpdated', handleTimeTrackingUpdate as EventListener)
    }
  }, [user, loadStats])
  
  // Also refresh when component mounts (user navigates to this page)
  useEffect(() => {
    if (user && user.role === "student") {
      // Small delay to ensure time tracking cleanup has completed
      const timeout = setTimeout(() => {
        loadStats(false)
      }, 500) // Wait 500ms for time tracking to complete
      
      return () => clearTimeout(timeout)
    }
  }, [user, loadStats]) // Run when user changes or component mounts

  if (!user || user.role !== "student") return null

  const modules = [
    {
      id: "s1",
      title: "Structured Problem-Solving Practice",
      description: "Master math concepts with step-by-step guided solutions across 5 learning phases",
      icon: BookOpen,
      color: "primary",
      href: "/student/s1",
    },
    {
      id: "s2",
      title: "AI-Powered Solution Feedback",
      description: "Upload your work and get instant, detailed feedback with error detection and hints",
      icon: FileCheck,
      color: "leaf",
      href: "/student/s2",
    },
    {
      id: "s3",
      title: "Mathematical Quiz Generation",
      description: "Practice with adaptive quizzes tailored to your grade level and learning goals",
      icon: Brain,
      color: "yellow",
      href: "/student/s3",
    },
  ]

  const displayStats = [
    { 
      label: "Total Quizzes", 
      value: stats?.total_quizzes || 0, 
      icon: Target, 
      color: "primary" 
    },
    { 
      label: "Average Score", 
      value: stats ? `${stats.avg_score.toFixed(0)}%` : "0%", 
      icon: TrendingUp, 
      color: "leaf" 
    },
    { 
      label: "Accuracy Rate", 
      value: stats ? `${stats.accuracy.toFixed(0)}%` : "0%", 
      icon: Target, 
      color: "yellow" 
    },
  ]

  // Format recent activities - prioritize recent_activities, fallback to recent_quizzes
  // Backend returns top 5 most recent activities (sessions + quizzes) sorted by latest first
  const recentActivity = (() => {
    if (stats?.recent_activities && stats.recent_activities.length > 0) {
      return stats.recent_activities.map((activity: any) => {
        if (activity.type === 'quiz') {
          return {
            title: activity.title || `${activity.topic || 'Quiz'} Quiz`,
            time: activity.date ? new Date(activity.date).toLocaleDateString() : 'Today',
            score: activity.score || null,
            timeSpent: activity.time_spent || null
          }
        } else if (activity.type === 'session' || activity.type === 'time') {
          return {
            title: activity.title || activity.module || 'Activity',
            time: activity.date ? new Date(activity.date).toLocaleDateString() : 'Today',
            score: null,
            timeSpent: activity.time_spent || null
          }
        } else {
          return {
            title: activity.title || 'Activity',
            time: activity.date ? new Date(activity.date).toLocaleDateString() : 'Today',
            score: activity.score || null,
            timeSpent: activity.time_spent || null
          }
        }
      })
    } else if (stats?.recent_quizzes && stats.recent_quizzes.length > 0) {
      return stats.recent_quizzes.slice(0, 5).map((quiz: any) => ({
        title: `${quiz.topic || 'Quiz'} Quiz`,
        time: quiz.completed_at ? new Date(quiz.completed_at).toLocaleDateString() : 'Today',
        score: `${quiz.correct_answers || 0}/${quiz.total_questions || 0} (${(quiz.score_percentage || 0).toFixed(0)}%)`,
        timeSpent: null
      }))
    }
    return []
  })()

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="max-w-[1440px] mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy mb-2">Welcome back, {user.name}! 👋</h1>
          <p className="text-text/60">Ready to continue your learning journey?</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {modules.map((module) => {
            const Icon = module.icon
            return (
              <Card key={module.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 rounded-xl bg-${module.color}/10 flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 text-${module.color}`} style={{ color: `var(--color-${module.color})` }} />
                </div>
                <h3 className="text-lg font-bold text-navy mb-2">{module.title}</h3>
                <p className="text-sm text-text/60 mb-4 leading-relaxed">{module.description}</p>
                <Button asChild className="w-full">
                  <Link href={module.href}>Start Practice</Link>
                </Button>
              </Card>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-navy mb-4">Your Progress</h2>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {displayStats.map((stat) => {
                    const Icon = stat.icon
                    return (
                      <div key={stat.label} className="text-center p-4 bg-gray-50 rounded-xl">
                        <Icon className="w-6 h-6 mx-auto mb-2" style={{ color: `var(--color-${stat.color})` }} />
                        <div className="text-2xl font-bold text-navy mb-1">{stat.value}</div>
                        <div className="text-xs text-text/60">{stat.label}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-navy">Recent Activity</h2>
              <div className="flex items-center gap-2 text-xs text-text/60">
                <div className="w-2 h-2 bg-leaf rounded-full animate-pulse"></div>
                <span>Live updates</span>
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="pb-3 border-b border-gray-line last:border-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium text-navy">{activity.title}</p>
                      <div className="flex items-center gap-2">
                        {activity.score && (
                          <span className="text-xs font-semibold text-leaf">{activity.score}</span>
                        )}
                        {activity.timeSpent && (
                          <span className="text-xs font-semibold text-primary flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {activity.timeSpent}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-text/60">{activity.time}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-text/60 mb-2">No recent activity yet.</p>
                <p className="text-xs text-text/40">Time spent in S1, S2, and S3 will appear here automatically.</p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}

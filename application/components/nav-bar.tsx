"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useApp } from "@/store/app-context"
import { User, LogOut, Home, Clock, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getStudentStats, getDailyGoals } from "@/lib/api-service"

export function NavBar() {
  const { user, logout } = useApp()
  const pathname = usePathname()
  const router = useRouter()
  const [todayTotalTime, setTodayTotalTime] = useState<number>(0)
  const [todayQuizCount, setTodayQuizCount] = useState<number>(0)
  const [totalQuizzes, setTotalQuizzes] = useState<number>(0)
  const [targetTime, setTargetTime] = useState<number>(1800) // 30 minutes default
  const [targetQuizzes, setTargetQuizzes] = useState<number>(2) // 2 quizzes default

  useEffect(() => {
    if (user && user.role === "student") {
      const fetchData = async () => {
        try {
          // Fetch stats (includes today's time and quiz count)
          const statsResponse = await getStudentStats(user.id)
          if (statsResponse.success && statsResponse.stats) {
            setTodayTotalTime(statsResponse.stats.today_total_time_seconds || 0)
            setTodayQuizCount(statsResponse.stats.today_quiz_count || 0)
            setTotalQuizzes(statsResponse.stats.total_quizzes || 0)
          }
          
          // Fetch daily goals
          const goalsResponse = await getDailyGoals(user.id)
          if (goalsResponse.success && goalsResponse.goals) {
            setTargetTime(goalsResponse.goals.target_time_seconds || 1800)
            setTargetQuizzes(goalsResponse.goals.target_quizzes || 2)
          }
        } catch (err) {
          console.error("Failed to fetch data:", err)
        }
      }
      
      fetchData()
      
      // Poll every 30 seconds to update the data
      const interval = setInterval(fetchData, 30000)
      
      // Listen for time tracking updates
      const handleTimeTrackingUpdate = () => {
        setTimeout(fetchData, 500)
      }
      
      window.addEventListener('timeTrackingUpdated', handleTimeTrackingUpdate as EventListener)
      
      return () => {
        clearInterval(interval)
        window.removeEventListener('timeTrackingUpdated', handleTimeTrackingUpdate as EventListener)
      }
    }
  }, [user])

  if (!user) return null

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const getBreadcrumb = () => {
    if (pathname === "/student") return "Dashboard"
    if (pathname === "/parent") return "Parent Dashboard"
    if (pathname.startsWith("/student/s1")) return "Structured Practice"
    if (pathname.startsWith("/student/s2")) return "Solution Feedback"
    if (pathname.startsWith("/student/s3")) return "Quiz Generation"
    if (pathname === "/profile") return "Profile"
    return ""
  }

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b-2 border-primary shadow-sm">
      <div className="max-w-[1440px] mx-auto px-3 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-8">
          <Link
            href={user.role === "student" ? "/student" : "/parent"}
            className="flex items-center gap-2 md:gap-3 font-bold text-lg md:text-xl text-navy hover:opacity-80 transition-opacity"
          >
            <img src="/logo.png" alt="EduMate Logo" className="w-8 h-8 md:w-10 md:h-10" />
            <span>EduMate</span>
          </Link>
          <span className="text-xs md:text-sm text-text/60 hidden sm:inline">{getBreadcrumb()}</span>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {user.role === "student" && (
            <>
              {/* Daily Goals Section */}
              <div className="flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-1.5 bg-primary/5 rounded-lg border border-primary/20">
                <Target className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-1.5 lg:gap-4">
                  {/* Time Goal */}
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-text/60 flex-shrink-0" />
                    <span className="text-xs font-medium text-navy whitespace-nowrap">
                      {formatTime(todayTotalTime)} / {formatTime(targetTime)}
                    </span>
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ 
                          width: `${Math.min(100, targetTime > 0 ? (todayTotalTime / targetTime) * 100 : 0)}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Quiz Goal */}
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-text/60 flex-shrink-0" />
                    <span className="text-xs font-medium text-navy whitespace-nowrap">
                      {totalQuizzes} / {targetQuizzes} quizzes
                    </span>
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                      <div 
                        className="h-full bg-leaf transition-all"
                        style={{ 
                          width: `${Math.min(100, targetQuizzes > 0 ? (totalQuizzes / targetQuizzes) * 100 : 0)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="w-8 h-8 bg-sky rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-navy" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-semibold text-navy">{user.name}</p>
                <p className="text-xs text-text/60">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={user.role === "student" ? "/student" : "/parent"} className="cursor-pointer">
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}

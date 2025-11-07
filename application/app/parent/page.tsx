"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/store/app-context"
import { NavBar } from "@/components/nav-bar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Lock, TrendingUp, Clock, Target, Calendar, Loader2, UserPlus } from "lucide-react"
import { getLinkedStudents, getStudentStats, linkAccount } from "@/lib/api-service"

interface Student {
  id: string
  email: string
  name: string
  grade: number
}

interface StudentStats {
  total_quizzes: number
  avg_score: number
  total_correct: number
  total_questions: number
  accuracy: number
  s1_sessions: number
  s2_sessions: number
  recent_quizzes: any[]
  recent_activities?: any[]
}

export default function ParentDashboard() {
  const { user, parentControls, updateParentControls } = useApp()
  const router = useRouter()
  const [localControls, setLocalControls] = useState(parentControls)
  const [students, setStudents] = useState<Student[]>([])
  const [studentStats, setStudentStats] = useState<Record<string, StudentStats>>({})
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState(false)
  const [studentEmail, setStudentEmail] = useState("")
  const [showLinkForm, setShowLinkForm] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/login")
    } else if (user.role !== "parent") {
      router.push("/student")
    } else {
      loadStudents()
    }
  }, [user, router])

  const loadStudents = async () => {
    if (!user || user.role !== "parent") return
    
    setLoading(true)
    try {
      const response = await getLinkedStudents(user.id)
      if (response.success && response.students) {
        setStudents(response.students)
        
        // Load stats for each student
        const statsPromises = response.students.map(async (student) => {
          const statsResponse = await getStudentStats(student.id)
          if (statsResponse.success && statsResponse.stats) {
            return { studentId: student.id, stats: statsResponse.stats }
          }
          return null
        })
        
        const statsResults = await Promise.all(statsPromises)
        const statsMap: Record<string, StudentStats> = {}
        statsResults.forEach((result) => {
          if (result) {
            statsMap[result.studentId] = result.stats
          }
        })
        setStudentStats(statsMap)
      }
    } catch (err) {
      console.error("Failed to load students:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleLinkStudent = async () => {
    if (!user || !studentEmail) return
    
    setLinking(true)
    try {
      const response = await linkAccount({
        parent_id: user.id,
        student_email: studentEmail
      })
      
      if (response.success) {
        setStudentEmail("")
        setShowLinkForm(false)
        await loadStudents() // Reload students
      } else {
        alert(response.error || "Failed to link account")
      }
    } catch (err) {
      console.error("Failed to link account:", err)
      alert("Failed to link account. Please try again.")
    } finally {
      setLinking(false)
    }
  }

  useEffect(() => {
    setLocalControls(parentControls)
  }, [parentControls])

  const handleSave = () => {
    updateParentControls(localControls)
    alert("Settings saved successfully!")
  }

  if (!user || user.role !== "parent") return null

  // Calculate aggregate stats from all students
  const aggregateStats = students.reduce((acc, student) => {
    const stats = studentStats[student.id]
    if (stats) {
      acc.totalQuizzes += stats.total_quizzes
      acc.totalCorrect += stats.total_correct
      acc.totalQuestions += stats.total_questions
      acc.totalScore += stats.avg_score * stats.total_quizzes
      acc.quizCount += stats.total_quizzes
    }
    return acc
  }, {
    totalQuizzes: 0,
    totalCorrect: 0,
    totalQuestions: 0,
    totalScore: 0,
    quizCount: 0
  })

  const avgAccuracy = aggregateStats.totalQuestions > 0 
    ? (aggregateStats.totalCorrect / aggregateStats.totalQuestions * 100).toFixed(0)
    : "0"
  
  const avgScore = aggregateStats.quizCount > 0
    ? (aggregateStats.totalScore / aggregateStats.quizCount).toFixed(0)
    : "0"

  const analyticsData = [
    { label: "Avg. Accuracy", value: `${avgAccuracy}%`, icon: Target, color: "leaf" },
    { label: "Total Quizzes", value: aggregateStats.totalQuizzes.toString(), icon: TrendingUp, color: "primary" },
    { label: "Avg. Score", value: `${avgScore}%`, icon: Target, color: "yellow" },
    { label: "Linked Students", value: students.length.toString(), icon: Calendar, color: "sky" },
  ]

  // Get recent activity from all students
  const recentActivity = students.flatMap(student => {
    const stats = studentStats[student.id]
    if (!stats) return []
    
    // Use recent_activities if available, otherwise fall back to recent_quizzes
    const activities = stats.recent_activities || stats.recent_quizzes?.map((quiz: any) => ({
      type: 'quiz',
      module: 'S3',
      title: `${quiz.topic} Quiz`,
      score: `${quiz.correct_answers}/${quiz.total_questions} (${quiz.score_percentage.toFixed(0)}%)`,
      date: quiz.completed_at,
      time_spent: null
    })) || []
    
    return activities.slice(0, 3).map((activity: any) => {
      const moduleNames: Record<string, string> = {
        'S1': 'S1',
        'S2': 'S2',
        'S3': 'S3',
        'PORTAL': 'Portal'
      }
      
      return {
        student: student.name,
        date: new Date(activity.date).toLocaleDateString(),
        activity: activity.title || activity.activity || `Activity in ${moduleNames[activity.module] || activity.module}`,
        score: activity.score || null,
        module: moduleNames[activity.module] || activity.module,
        timeSpent: activity.time_spent || null
      }
    })
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="max-w-[1440px] mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-navy mb-2">Parent Dashboard</h1>
              <p className="text-text/60">Monitor progress and manage learning controls</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowLinkForm(!showLinkForm)}
              className="flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {showLinkForm ? "Cancel" : "Link Student"}
            </Button>
          </div>
          
          {showLinkForm && (
            <Card className="p-4 mt-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Student email address"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleLinkStudent} disabled={linking || !studentEmail}>
                  {linking ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Linking...
                    </>
                  ) : (
                    "Link Account"
                  )}
                </Button>
              </div>
            </Card>
          )}
        </div>

        {students.length === 0 && !loading && (
          <Card className="p-8 text-center">
            <p className="text-text/60 mb-4">No students linked yet.</p>
            <Button onClick={() => setShowLinkForm(true)}>
              Link a Student Account
            </Button>
          </Card>
        )}

        {students.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-navy mb-4">Linked Students</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map(student => {
                const stats = studentStats[student.id]
                return (
                  <Card key={student.id} className="p-4">
                    <h3 className="font-bold text-navy mb-2">{student.name}</h3>
                    <p className="text-sm text-text/60 mb-3">Grade {student.grade}</p>
                    {stats ? (
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-text/60">Quizzes:</span>
                          <span className="font-semibold">{stats.total_quizzes}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text/60">Accuracy:</span>
                          <span className="font-semibold">{stats.accuracy.toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text/60">Avg Score:</span>
                          <span className="font-semibold">{stats.avg_score.toFixed(0)}%</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-text/60">No activity yet</p>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 lg:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <Lock className="w-5 h-5 text-navy" />
              <h2 className="text-xl font-bold text-navy">Learning Controls</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="direct-answer" className="font-medium">
                    Allow Direct Answer (S2)
                  </Label>
                  <p className="text-xs text-text/60 mt-1">Enable instant answer mode</p>
                </div>
                <Switch
                  id="direct-answer"
                  checked={localControls.allowDirectAnswer}
                  onCheckedChange={(checked) => setLocalControls({ ...localControls, allowDirectAnswer: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="s1-generate" className="font-medium">
                    Allow Question Generation (S1)
                  </Label>
                  <p className="text-xs text-text/60 mt-1">Enable AI question generator</p>
                </div>
                <Switch
                  id="s1-generate"
                  checked={localControls.allowS1Generate}
                  onCheckedChange={(checked) => setLocalControls({ ...localControls, allowS1Generate: checked })}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="fixed-count" className="font-medium">
                    Fixed Question Count (S3)
                  </Label>
                  <Switch
                    checked={localControls.fixedQuestionCount !== null}
                    onCheckedChange={(checked) =>
                      setLocalControls({
                        ...localControls,
                        fixedQuestionCount: checked ? 5 : null,
                      })
                    }
                  />
                </div>
                {localControls.fixedQuestionCount !== null && (
                  <Input
                    id="fixed-count"
                    type="number"
                    min={3}
                    max={15}
                    value={localControls.fixedQuestionCount}
                    onChange={(e) =>
                      setLocalControls({
                        ...localControls,
                        fixedQuestionCount: Number.parseInt(e.target.value),
                      })
                    }
                  />
                )}
                <p className="text-xs text-text/60 mt-1">Lock quiz length</p>
              </div>

              <div>
                <Label className="font-medium mb-2 block">Lock Difficulty (S3)</Label>
                <div className="flex gap-2">
                  {[null, "easy", "medium", "hard"].map((d) => (
                    <Button
                      key={d || "none"}
                      variant={localControls.lockedDifficulty === d ? "default" : "outline"}
                      size="sm"
                      className="flex-1 capitalize"
                      onClick={() =>
                        setLocalControls({
                          ...localControls,
                          lockedDifficulty: d as any,
                        })
                      }
                    >
                      {d || "None"}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="daily-goal" className="font-medium">
                  Daily Goal (minutes)
                </Label>
                <Input
                  id="daily-goal"
                  type="number"
                  min={10}
                  max={120}
                  value={localControls.dailyGoalMinutes}
                  onChange={(e) =>
                    setLocalControls({
                      ...localControls,
                      dailyGoalMinutes: Number.parseInt(e.target.value),
                    })
                  }
                  className="mt-2"
                />
              </div>

              <Button onClick={handleSave} className="w-full">
                Save Settings
              </Button>
            </div>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {analyticsData.map((stat) => {
                const Icon = stat.icon
                return (
                  <Card key={stat.label} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Icon className="w-5 h-5" style={{ color: `var(--color-${stat.color})` }} />
                    </div>
                    <div className="text-2xl font-bold text-navy mb-1">{stat.value}</div>
                    <div className="text-xs text-text/60">{stat.label}</div>
                  </Card>
                )
              })}
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-bold text-navy mb-4">Recent Activity</h3>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between pb-3 border-b border-gray-line last:border-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-navy">{activity.activity}</span>
                          <span className="text-xs px-2 py-0.5 bg-sky/20 text-navy rounded-full">{activity.module}</span>
                          <span className="text-xs text-text/60">({activity.student})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-text/60">{activity.date}</p>
                          {activity.timeSpent && (
                            <span className="text-xs text-primary flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {activity.timeSpent}
                            </span>
                          )}
                        </div>
                      </div>
                      {activity.score && (
                        <span className="text-sm font-semibold text-leaf">{activity.score}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text/60 text-center py-4">No recent activity</p>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

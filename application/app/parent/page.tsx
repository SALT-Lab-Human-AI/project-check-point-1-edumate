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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Lock, TrendingUp, Clock, Target, Calendar, Loader2, UserPlus, Save } from "lucide-react"
import { getLinkedStudents, getStudentStats, linkAccount, getDailyGoals, setStudentGoalsByParent, updateStudentGradeByParent, getDailyGoalsCompletion } from "@/lib/api-service"

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

interface CalendarViewProps {
  year: number
  month: number
  completionData: Record<string, { goal_met: boolean }>
  compact?: boolean
}

function CalendarView({ year, month, completionData, compact = false }: CalendarViewProps) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()
  const dayNames = compact ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  // Create array of days for the month
  const days: (number | null)[] = []
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null)
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day)
  }
  
  const getDateString = (day: number): string => {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  
  return (
    <div className="w-full">
      {/* Day headers */}
      <div className={`grid grid-cols-7 ${compact ? 'gap-0.5 mb-1' : 'gap-1 mb-2'}`}>
        {dayNames.map((day) => (
          <div key={day} className={`text-center ${compact ? 'text-[10px]' : 'text-xs'} font-medium text-text/60 ${compact ? 'py-0.5' : 'py-1'}`}>
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className={`grid grid-cols-7 ${compact ? 'gap-0.5' : 'gap-1'}`}>
        {days.map((day, index) => {
          if (day === null) {
            return <div key={index} className={compact ? 'aspect-square min-h-[24px]' : 'aspect-square'} />
          }
          
          const dateStr = getDateString(day)
          const isGoalMet = completionData[dateStr]?.goal_met || false
          const isToday = 
            day === new Date().getDate() &&
            month === new Date().getMonth() + 1 &&
            year === new Date().getFullYear()
          
          return (
            <div
              key={index}
              className={`
                ${compact ? 'min-h-[24px]' : 'aspect-square'} flex items-center justify-center relative
                border border-gray-200 rounded
                ${isGoalMet ? 'bg-green-500 text-white' : 'bg-white'}
                ${isToday ? 'border-primary border-2' : ''}
                ${compact ? 'text-[11px]' : 'text-sm'}
                ${isGoalMet && isToday ? 'text-white' : ''}
              `}
            >
              <span className={isToday && !isGoalMet ? 'font-bold text-primary' : isGoalMet ? 'font-medium text-white' : ''}>{day}</span>
            </div>
          )
        })}
      </div>
      
      {/* Legend - only show if not compact */}
      {!compact && (
        <div className="flex items-center gap-4 mt-4 text-xs text-text/60">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span>Goal Met</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-white border border-gray-300" />
            <span>Goal Not Met</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ParentDashboard() {
  const { user, parentControls, updateParentControls } = useApp()
  const router = useRouter()
  const [localControls, setLocalControls] = useState(parentControls)
  const [students, setStudents] = useState<Student[]>([])
  const [studentStats, setStudentStats] = useState<Record<string, StudentStats>>({})
  const [studentGoals, setStudentGoals] = useState<Record<string, { target_time_seconds: number; target_quizzes: number }>>({})
  const [editingGoals, setEditingGoals] = useState<Record<string, { target_time_seconds: number; target_quizzes: number }>>({})
  const [savingGoals, setSavingGoals] = useState<Record<string, boolean>>({})
  const [editingGrades, setEditingGrades] = useState<Record<string, number>>({})
  const [savingGrades, setSavingGrades] = useState<Record<string, boolean>>({})
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState(false)
  const [studentEmail, setStudentEmail] = useState("")
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [goalCompletionData, setGoalCompletionData] = useState<Record<string, Record<string, { goal_met: boolean }>>>({})
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

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
        
        // Load stats and goals for each student
        const dataPromises = response.students.map(async (student) => {
          const [statsResponse, goalsResponse] = await Promise.all([
            getStudentStats(student.id),
            getDailyGoals(student.id)
          ])
          
          const result: { studentId: string; stats?: StudentStats; goals?: { target_time_seconds: number; target_quizzes: number } } = {
            studentId: student.id
          }
          
          if (statsResponse.success && statsResponse.stats) {
            result.stats = statsResponse.stats
          }
          
          if (goalsResponse.success && goalsResponse.goals) {
            result.goals = goalsResponse.goals
          }
          
          return result
        })
        
        const dataResults = await Promise.all(dataPromises)
        const statsMap: Record<string, StudentStats> = {}
        const goalsMap: Record<string, { target_time_seconds: number; target_quizzes: number }> = {}
        const editingMap: Record<string, { target_time_seconds: number; target_quizzes: number }> = {}
        
        dataResults.forEach((result) => {
          if (result.stats) {
            statsMap[result.studentId] = result.stats
          }
          if (result.goals) {
            goalsMap[result.studentId] = result.goals
            editingMap[result.studentId] = { ...result.goals }
          } else {
            // Set defaults if no goals exist
            goalsMap[result.studentId] = { target_time_seconds: 1800, target_quizzes: 2 }
            editingMap[result.studentId] = { target_time_seconds: 1800, target_quizzes: 2 }
          }
        })
        
        setStudentStats(statsMap)
        setStudentGoals(goalsMap)
        setEditingGoals(editingMap)
        
        // Initialize editing grades with current student grades
        const gradesMap: Record<string, number> = {}
        response.students.forEach((student) => {
          gradesMap[student.id] = student.grade
        })
        setEditingGrades(gradesMap)
        
        // Set first student as selected by default
        if (response.students.length > 0 && !selectedStudentId) {
          setSelectedStudentId(response.students[0].id)
        }
        
        // Load goal completion data for all students
        loadGoalCompletionData(response.students.map(s => s.id))
      }
    } catch (err) {
      console.error("Failed to load students:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadGoalCompletionData = async (studentIds: string[]) => {
    const completionMap: Record<string, Record<string, { goal_met: boolean }>> = {}
    
    for (const studentId of studentIds) {
      try {
        const response = await getDailyGoalsCompletion(studentId, currentYear, currentMonth)
        if (response.success && response.completion_data) {
          completionMap[studentId] = response.completion_data
        }
      } catch (err) {
        console.error(`Failed to load goal completion for student ${studentId}:`, err)
      }
    }
    
    setGoalCompletionData(completionMap)
  }

  useEffect(() => {
    if (students.length > 0) {
      loadGoalCompletionData(students.map(s => s.id))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, currentYear, students.length])

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

  const handleSaveGoals = async () => {
    if (!user || user.role !== "parent" || !selectedStudentId) return
    
    const goals = editingGoals[selectedStudentId]
    if (!goals) return
    
    setSavingGoals(prev => ({ ...prev, [selectedStudentId]: true }))
    
    try {
      const response = await setStudentGoalsByParent(user.id, selectedStudentId, {
        target_time_seconds: goals.target_time_seconds,
        target_quizzes: goals.target_quizzes
      })
      
      if (response.success && response.goals) {
        setStudentGoals(prev => ({ ...prev, [selectedStudentId]: response.goals! }))
        alert("Daily goals updated successfully!")
      } else {
        alert(response.error || "Failed to update goals")
      }
    } catch (err) {
      console.error("Failed to save goals:", err)
      alert("Failed to save goals. Please try again.")
    } finally {
      setSavingGoals(prev => ({ ...prev, [selectedStudentId]: false }))
    }
  }

  const handleSaveGrade = async (studentId: string) => {
    if (!user || user.role !== "parent") return
    
    const newGrade = editingGrades[studentId]
    if (newGrade === undefined) return
    
    const currentStudent = students.find(s => s.id === studentId)
    if (!currentStudent || currentStudent.grade === newGrade) {
      return // No change needed
    }
    
    setSavingGrades(prev => ({ ...prev, [studentId]: true }))
    
    try {
      const response = await updateStudentGradeByParent(user.id, studentId, newGrade)
      
      if (response.success && response.student) {
        // Update the student in the students array
        setStudents(prev => prev.map(s => 
          s.id === studentId ? { ...s, grade: response.student!.grade } : s
        ))
        alert(`Grade updated successfully to Grade ${response.student.grade}!`)
      } else {
        alert(response.error || "Failed to update grade")
        // Revert the editing grade on error
        setEditingGrades(prev => ({
          ...prev,
          [studentId]: currentStudent.grade
        }))
      }
    } catch (err) {
      console.error("Failed to save grade:", err)
      alert("Failed to save grade. Please try again.")
      // Revert the editing grade on error
      setEditingGrades(prev => ({
        ...prev,
        [studentId]: currentStudent.grade
      }))
    } finally {
      setSavingGrades(prev => ({ ...prev, [studentId]: false }))
    }
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  useEffect(() => {
    setLocalControls(parentControls)
  }, [parentControls])

  const handleSave = async () => {
    if (!user || user.role !== "parent") return
    
    setSaving(true)
    setSaveSuccess(false)
    
    try {
      // Save parent controls
      updateParentControls(localControls)
      
      // Save grade if changed
      if (selectedStudentId) {
        const currentStudent = students.find(s => s.id === selectedStudentId)
        const newGrade = editingGrades[selectedStudentId]
        if (currentStudent && newGrade !== undefined && currentStudent.grade !== newGrade) {
          await updateStudentGradeByParent(user.id, selectedStudentId, newGrade)
          // Update the student in the students array
          setStudents(prev => prev.map(s => 
            s.id === selectedStudentId ? { ...s, grade: newGrade } : s
          ))
        }
      }
      
      // Save goals if changed
      if (selectedStudentId) {
        const goals = editingGoals[selectedStudentId]
        if (goals) {
          await setStudentGoalsByParent(user.id, selectedStudentId, {
            target_time_seconds: goals.target_time_seconds,
            target_quizzes: goals.target_quizzes
          })
          setStudentGoals(prev => ({ ...prev, [selectedStudentId]: goals }))
        }
      }
      
      setSaveSuccess(true)
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)
    } catch (err) {
      console.error("Failed to save settings:", err)
      alert("Failed to save some settings. Please try again.")
    } finally {
      setSaving(false)
    }
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

  // Get recent activity from selected student (or all students if none selected)
  const recentActivity = (() => {
    const studentsToShow = selectedStudentId 
      ? students.filter(s => s.id === selectedStudentId)
      : students
    
    return studentsToShow.flatMap(student => {
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
      
      return activities.map((activity: any) => {
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
  })()

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

              {/* Change Grade Section */}
              {students.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Lock className="w-5 h-5 text-navy" />
                    <h3 className="text-lg font-bold text-navy">Change Grade</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Student Selector for Grade - only show if more than 1 student */}
                    {students.length > 1 && (
                      <div>
                        <Label htmlFor="grade-student-select" className="font-medium mb-2 block">
                          Select Student
                        </Label>
                        <Select
                          value={selectedStudentId}
                          onValueChange={(value) => {
                            setSelectedStudentId(value)
                          }}
                        >
                          <SelectTrigger id="grade-student-select" className="w-full">
                            <SelectValue placeholder="Select a student" />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map((student) => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.name} (Grade {student.grade})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {selectedStudentId && (
                      <>
                        <div>
                          <Label htmlFor="grade-input" className="font-medium">
                            Grade Level
                          </Label>
                          <Input
                            id="grade-input"
                            type="number"
                            min={1}
                            max={12}
                            value={editingGrades[selectedStudentId] || students.find(s => s.id === selectedStudentId)?.grade || 1}
                            onChange={(e) => {
                              const grade = parseInt(e.target.value) || 1
                              setEditingGrades(prev => ({
                                ...prev,
                                [selectedStudentId]: Math.max(1, Math.min(12, grade))
                              }))
                            }}
                            className="mt-2"
                          />
                          <p className="text-xs text-text/60 mt-1">Current: Grade {students.find(s => s.id === selectedStudentId)?.grade || 'N/A'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Daily Goals Section */}
              {students.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold text-navy">Daily Goals</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Student Selector - only show if more than 1 student */}
                    {students.length > 1 && (
                      <div>
                        <Label htmlFor="student-select" className="font-medium mb-2 block">
                          Select Student
                        </Label>
                        <Select
                          value={selectedStudentId}
                          onValueChange={(value) => {
                            setSelectedStudentId(value)
                            // Initialize editing goals for selected student if not exists
                            if (!editingGoals[value] && studentGoals[value]) {
                              setEditingGoals(prev => ({
                                ...prev,
                                [value]: { ...studentGoals[value] }
                              }))
                            } else if (!editingGoals[value]) {
                              setEditingGoals(prev => ({
                                ...prev,
                                [value]: { target_time_seconds: 1800, target_quizzes: 2 }
                              }))
                            }
                          }}
                        >
                          <SelectTrigger id="student-select" className="w-full">
                            <SelectValue placeholder="Select a student" />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map((student) => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.name} (Grade {student.grade})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {selectedStudentId && (
                      <>
                        {/* Target Time */}
                        <div>
                          <Label htmlFor="goal-time" className="font-medium">
                            Target Time (minutes)
                          </Label>
                          <Input
                            id="goal-time"
                            type="number"
                            min={10}
                            max={180}
                            value={editingGoals[selectedStudentId] ? Math.floor(editingGoals[selectedStudentId].target_time_seconds / 60) : 30}
                            onChange={(e) => {
                              const minutes = parseInt(e.target.value) || 30
                              setEditingGoals(prev => ({
                                ...prev,
                                [selectedStudentId]: {
                                  ...(prev[selectedStudentId] || { target_time_seconds: 1800, target_quizzes: 2 }),
                                  target_time_seconds: minutes * 60
                                }
                              }))
                            }}
                            className="mt-2"
                          />
                        </div>
                        
                        {/* Target Quizzes */}
                        <div>
                          <Label htmlFor="goal-quizzes" className="font-medium">
                            Target Quizzes
                          </Label>
                          <Input
                            id="goal-quizzes"
                            type="number"
                            min={1}
                            max={10}
                            value={editingGoals[selectedStudentId]?.target_quizzes || 2}
                            onChange={(e) => {
                              const quizzes = parseInt(e.target.value) || 2
                              setEditingGoals(prev => ({
                                ...prev,
                                [selectedStudentId]: {
                                  ...(prev[selectedStudentId] || { target_time_seconds: 1800, target_quizzes: 2 }),
                                  target_quizzes: quizzes
                                }
                              }))
                            }}
                            className="mt-2"
                          />
                        </div>
                        
                        {/* Current Goals Display */}
                        {studentGoals[selectedStudentId] && (
                          <div className="text-sm text-text/60 p-2 bg-gray-50 rounded">
                            <div className="flex justify-between">
                              <span>Current Goals:</span>
                              <span>{formatTime(studentGoals[selectedStudentId].target_time_seconds)} / {studentGoals[selectedStudentId].target_quizzes} quizzes</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </Button>
              
              {saveSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  Settings saved successfully!
                </div>
              )}
            </div>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            {/* Metrics and Calendar Row */}
            <div className="flex gap-4">
              {/* 2x2 Grid of Metric Boxes */}
              <div className="grid grid-cols-2 gap-4 flex-1">
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

              {/* Calendar Component - Square shape, same height as boxes */}
              {students.length > 0 && selectedStudentId && (
                <Card className="p-3 w-[280px] flex-shrink-0 flex flex-col">
                  <div className="flex flex-col items-center mb-2 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-1.5 w-full">
                      {students.length > 1 && (
                        <Select
                          value={selectedStudentId}
                          onValueChange={(value) => {
                            setSelectedStudentId(value)
                          }}
                        >
                          <SelectTrigger className="w-full h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map((student) => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="flex items-center gap-1 w-full justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0 text-xs"
                        onClick={() => {
                          if (currentMonth === 1) {
                            setCurrentMonth(12)
                            setCurrentYear(currentYear - 1)
                          } else {
                            setCurrentMonth(currentMonth - 1)
                          }
                        }}
                      >
                        ←
                      </Button>
                      <span className="text-[10px] font-medium min-w-[80px] text-center">
                        {new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0 text-xs"
                        onClick={() => {
                          if (currentMonth === 12) {
                            setCurrentMonth(1)
                            setCurrentYear(currentYear + 1)
                          } else {
                            setCurrentMonth(currentMonth + 1)
                          }
                        }}
                      >
                        →
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center">
                    <CalendarView
                      year={currentYear}
                      month={currentMonth}
                      completionData={goalCompletionData[selectedStudentId] || {}}
                      compact={true}
                    />
                  </div>
                </Card>
              )}
            </div>

            {/* Recent Activity and Linked Students Side by Side */}
            <div className="flex gap-4">
              {/* Recent Activity - Half Width */}
              <Card className="p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-navy">Recent Activity</h3>
                  {selectedStudentId && students.length > 1 && (
                    <Select
                      value={selectedStudentId}
                      onValueChange={(value) => {
                        setSelectedStudentId(value)
                      }}
                    >
                      <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {selectedStudentId && (
                  <p className="text-xs text-text/60 mb-4">
                    Showing activity for: <span className="font-medium">{students.find(s => s.id === selectedStudentId)?.name || 'Selected student'}</span>
                  </p>
                )}
                {loading ? (
                  <div className="flex items-center justify-center py-8 flex-1">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : recentActivity.length > 0 ? (
                  <div className="space-y-3 flex-1">
                    {recentActivity.map((activity, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between pb-3 border-b border-gray-line last:border-0"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-navy">{activity.activity}</span>
                            <span className="text-xs px-2 py-0.5 bg-sky/20 text-navy rounded-full">{activity.module}</span>
                            {students.length > 1 && !selectedStudentId && (
                              <span className="text-xs text-text/60">({activity.student})</span>
                            )}
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
                  <p className="text-sm text-text/60 text-center py-4 flex-1">
                    {selectedStudentId ? 'No recent activity for this student' : 'No recent activity'}
                  </p>
                )}
              </Card>

              {/* Linked Students Section - Half Width */}
              {students.length > 0 && (
                <Card className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-navy mb-4">Linked Students</h3>
                  <div className="flex flex-col gap-4 flex-1">
                    {students.map(student => {
                      const stats = studentStats[student.id]
                      return (
                        <Card key={student.id} className="p-4">
                          <h4 className="font-bold text-navy mb-2">{student.name}</h4>
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
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

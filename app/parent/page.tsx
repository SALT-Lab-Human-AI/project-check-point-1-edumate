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
import { Lock, TrendingUp, Clock, Target, Calendar } from "lucide-react"

export default function ParentDashboard() {
  const { user, parentControls, updateParentControls } = useApp()
  const router = useRouter()
  const [localControls, setLocalControls] = useState(parentControls)

  useEffect(() => {
    if (!user) {
      router.push("/login")
    } else if (user.role !== "parent") {
      router.push("/student")
    }
  }, [user, router])

  useEffect(() => {
    setLocalControls(parentControls)
  }, [parentControls])

  const handleSave = () => {
    updateParentControls(localControls)
    alert("Settings saved successfully!")
  }

  if (!user || user.role !== "parent") return null

  const analyticsData = [
    { label: "Avg. Accuracy", value: "85%", icon: Target, color: "leaf", trend: "+5%" },
    { label: "Study Time (7d)", value: "4.5 hrs", icon: Clock, color: "primary", trend: "+12%" },
    { label: "Problems Solved", value: "47", icon: TrendingUp, color: "yellow", trend: "+8" },
    { label: "Active Days", value: "6/7", icon: Calendar, color: "sky", trend: "86%" },
  ]

  const topicPerformance = [
    { topic: "Algebra", accuracy: 92, problems: 15 },
    { topic: "Linear Equations", accuracy: 85, problems: 12 },
    { topic: "Geometry", accuracy: 78, problems: 20 },
  ]

  const recentActivity = [
    { date: "2 hours ago", activity: "Completed Algebra Quiz", score: "9/10", module: "S3" },
    { date: "5 hours ago", activity: "Practiced Geometry", score: "85%", module: "S1" },
    { date: "Yesterday", activity: "Solution Feedback", score: "100%", module: "S2" },
    { date: "Yesterday", activity: "Linear Equations Quiz", score: "7/10", module: "S3" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="max-w-[1440px] mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy mb-2">Parent Dashboard</h1>
          <p className="text-text/60">Monitor progress and manage learning controls for Alex</p>
        </div>

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
                      <span className="text-xs font-semibold text-leaf">{stat.trend}</span>
                    </div>
                    <div className="text-2xl font-bold text-navy mb-1">{stat.value}</div>
                    <div className="text-xs text-text/60">{stat.label}</div>
                  </Card>
                )
              })}
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-bold text-navy mb-4">Topic Performance</h3>
              <div className="space-y-4">
                {topicPerformance.map((topic) => (
                  <div key={topic.topic}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-navy">{topic.topic}</span>
                      <span className="text-sm text-text/60">
                        {topic.accuracy}% · {topic.problems} problems
                      </span>
                    </div>
                    <div className="h-2 bg-gray-line rounded-full overflow-hidden">
                      <div className="h-full bg-leaf transition-all" style={{ width: `${topic.accuracy}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold text-navy mb-4">Recent Activity</h3>
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
                      </div>
                      <p className="text-xs text-text/60">{activity.date}</p>
                    </div>
                    <span className="text-sm font-semibold text-leaf">{activity.score}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

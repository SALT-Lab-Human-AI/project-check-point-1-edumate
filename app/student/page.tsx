"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/store/app-context"
import { NavBar } from "@/components/nav-bar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BookOpen, FileCheck, Brain, Clock, Target, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function StudentDashboard() {
  const { user } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/login")
    } else if (user.role !== "student") {
      router.push("/parent")
    }
  }, [user, router])

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

  const stats = [
    { label: "Study Time Today", value: "45 min", icon: Clock, color: "primary" },
    { label: "Problems Solved", value: "12", icon: Target, color: "leaf" },
    { label: "Accuracy Rate", value: "87%", icon: TrendingUp, color: "yellow" },
  ]

  const recentActivity = [
    { title: "Completed Algebra Quiz", time: "2 hours ago", score: "9/10" },
    { title: "Practiced Geometry Problems", time: "5 hours ago", score: "85%" },
    { title: "Reviewed Fractions Feedback", time: "Yesterday", score: "100%" },
  ]

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
              <h2 className="text-xl font-bold text-navy mb-4">Today's Progress</h2>
              <div className="grid grid-cols-3 gap-4">
                {stats.map((stat) => {
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
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="text-xl font-bold text-navy mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.map((activity, i) => (
                <div key={i} className="pb-3 border-b border-gray-line last:border-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-medium text-navy">{activity.title}</p>
                    <span className="text-xs font-semibold text-leaf">{activity.score}</span>
                  </div>
                  <p className="text-xs text-text/60">{activity.time}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}

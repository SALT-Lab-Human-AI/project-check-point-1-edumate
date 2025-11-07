"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useApp } from "@/store/app-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Force dynamic rendering to prevent static generation issues with useSearchParams
export const dynamic = 'force-dynamic'

function LoginForm() {
  const [role, setRole] = useState<"student" | "parent">("student")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams?.get("signup") === "success") {
      setSuccess("Account created successfully! Please log in.")
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await login(email, password, role)
      router.push(role === "student" ? "/student" : "/parent")
    } catch (err) {
      setError("Invalid credentials. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky/20 via-white to-primary/10 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/logo.png" alt="EduMate Logo" className="w-32 h-32" />
          </div>
          <h1 className="text-4xl font-bold text-navy mb-2">Welcome to EduMate</h1>
          <p className="text-text/60">AI-powered learning for K-12 students</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-line p-8">
          <div className="flex gap-2 mb-6">
            <Button
              type="button"
              variant={role === "student" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setRole("student")}
            >
              Student
            </Button>
            <Button
              type="button"
              variant={role === "parent" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setRole("parent")}
            >
              Parent
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {success && (
              <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
                {success}
              </div>
            )}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <p className="text-xs text-text/60 text-center mt-6">
            Don't have an account?{" "}
            <a href="/signup" className="text-primary hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-sky/20 via-white to-primary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/logo.png" alt="EduMate Logo" className="w-32 h-32" />
          </div>
          <h1 className="text-4xl font-bold text-navy mb-2">Welcome to EduMate</h1>
          <p className="text-text/60">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

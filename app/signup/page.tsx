"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function SignupPage() {
  const [studentName, setStudentName] = useState("")
  const [studentEmail, setStudentEmail] = useState("")
  const [grade, setGrade] = useState<number>(8)
  const [studentPassword, setStudentPassword] = useState("")
  const [confirmStudentPassword, setConfirmStudentPassword] = useState("")
  const [parentName, setParentName] = useState("")
  const [parentEmail, setParentEmail] = useState("")
  const [parentPassword, setParentPassword] = useState("")
  const [confirmParentPassword, setConfirmParentPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!studentName || !studentEmail || !studentPassword || !confirmStudentPassword) {
      setError("Please fill in all student fields")
      return
    }

    if (!parentName || !parentEmail || !parentPassword || !confirmParentPassword) {
      setError("Please fill in all parent fields")
      return
    }

    if (studentPassword !== confirmStudentPassword) {
      setError("Student passwords do not match")
      return
    }

    if (parentPassword !== confirmParentPassword) {
      setError("Parent passwords do not match")
      return
    }

    if (studentPassword.length < 6) {
      setError("Student password must be at least 6 characters")
      return
    }

    if (parentPassword.length < 6) {
      setError("Parent password must be at least 6 characters")
      return
    }

    if (!grade) {
      setError("Please select a grade level")
      return
    }

    setLoading(true)

    try {
      // First, create parent account
      const parentResponse = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: parentEmail,
          password: parentPassword,
          name: parentName,
          role: "parent",
        }),
      })

      const parentData = await parentResponse.json()

      if (!parentData.success) {
        // If parent already exists, try to continue
        if (parentData.error && !parentData.error.includes("already registered")) {
          setError(parentData.error || "Failed to create parent account")
          return
        }
        // If parent exists, we'll need to get their ID - but for now, let's require unique emails
        setError("Parent email already registered. Please use a different email or log in.")
        return
      }

      // Then, create student account with parent linking
      const studentResponse = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: studentEmail,
          password: studentPassword,
          name: studentName,
          role: "student",
          grade: grade,
          parent_email: parentEmail,
        }),
      })

      const studentData = await studentResponse.json()

      if (!studentData.success) {
        setError(studentData.error || "Failed to create student account")
        return
      }

      // Success - redirect to login
      router.push("/login?signup=success")
    } catch (err) {
      setError("Network error. Please try again.")
      console.error("Signup error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky/20 via-white to-primary/10 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/logo.png" alt="EduMate Logo" className="w-32 h-32" />
          </div>
          <h1 className="text-4xl font-bold text-navy mb-2">Create Account</h1>
          <p className="text-text/60">Create both student and parent accounts</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-line p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Section */}
            <div className="border-b border-gray-line pb-6">
              <h2 className="text-xl font-bold text-navy mb-4">Student Account</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="studentName">Student's Full Name</Label>
                  <Input
                    id="studentName"
                    type="text"
                    placeholder="John Doe"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="studentEmail">Student Email</Label>
                  <Input
                    id="studentEmail"
                    type="email"
                    placeholder="student@example.com"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="grade">Grade Level</Label>
                  <Select value={grade.toString()} onValueChange={(v) => setGrade(parseInt(v))}>
                    <SelectTrigger id="grade">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                        <SelectItem key={g} value={g.toString()}>
                          Grade {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="studentPassword">Student Portal Password</Label>
                  <Input
                    id="studentPassword"
                    type="password"
                    placeholder="••••••••"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <Label htmlFor="confirmStudentPassword">Confirm Student Portal Password</Label>
                  <Input
                    id="confirmStudentPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmStudentPassword}
                    onChange={(e) => setConfirmStudentPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            {/* Parent Section */}
            <div>
              <h2 className="text-xl font-bold text-navy mb-4">Parent Account</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="parentName">Parent's Full Name</Label>
                  <Input
                    id="parentName"
                    type="text"
                    placeholder="Jane Doe"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="parentEmail">Parent Email</Label>
                  <Input
                    id="parentEmail"
                    type="email"
                    placeholder="parent@example.com"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="parentPassword">Parent Portal Password</Label>
                  <Input
                    id="parentPassword"
                    type="password"
                    placeholder="••••••••"
                    value={parentPassword}
                    onChange={(e) => setParentPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <Label htmlFor="confirmParentPassword">Confirm Parent Portal Password</Label>
                  <Input
                    id="confirmParentPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmParentPassword}
                    onChange={(e) => setConfirmParentPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating accounts...
                </>
              ) : (
                "Create Accounts"
              )}
            </Button>
          </form>

          <p className="text-xs text-text/60 text-center mt-6">
            Already have an account?{" "}
            <a href="/login" className="text-primary hover:underline">
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}



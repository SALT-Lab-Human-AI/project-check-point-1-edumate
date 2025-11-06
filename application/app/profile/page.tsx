"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/store/app-context"
import { NavBar } from "@/components/nav-bar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { User, Mail, GraduationCap, Lock } from "lucide-react"

export default function ProfilePage() {
  const { user, logout } = useApp()
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match")
      return
    }
    alert("Password changed successfully! (Demo only)")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="max-w-[1440px] mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy mb-2">Profile Settings</h1>
          <p className="text-text/60">Manage your account information and preferences</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-navy">{user.name}</h2>
              <p className="text-sm text-text/60 capitalize">{user.role}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-navy" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text/60">Email</p>
                  <p className="text-sm font-medium text-navy truncate">{user.email}</p>
                </div>
              </div>

              {user.role === "student" && user.grade && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-navy" />
                  <div className="flex-1">
                    <p className="text-xs text-text/60">Grade Level</p>
                    <p className="text-sm font-medium text-navy">Grade {user.grade}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <Lock className="w-5 h-5 text-navy" />
              <h2 className="text-xl font-bold text-navy">Change Password</h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 mb-8">
              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit">Update Password</Button>
            </form>

            <div className="pt-6 border-t border-gray-line">
              <h3 className="text-lg font-bold text-navy mb-4">Account Actions</h3>
              <Button variant="destructive" onClick={handleLogout}>
                Log Out
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}

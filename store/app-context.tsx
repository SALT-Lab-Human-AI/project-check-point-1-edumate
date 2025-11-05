"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import * as apiService from "@/lib/api-service"

interface User {
  id: string
  email: string
  name: string
  role: "student" | "parent"
  grade?: number
}

interface ParentControls {
  allowDirectAnswer: boolean
  allowS1Generate: boolean
  fixedQuestionCount: number | null
  lockedDifficulty: "easy" | "medium" | "hard" | null
  dailyGoalMinutes: number
}

interface AppContextType {
  user: User | null
  login: (email: string, password: string, role: "student" | "parent") => Promise<void>
  logout: () => void
  parentControls: ParentControls
  updateParentControls: (controls: Partial<ParentControls>) => void
  announce: (message: string) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

const defaultParentControls: ParentControls = {
  allowDirectAnswer: true,
  allowS1Generate: true,
  fixedQuestionCount: null,
  lockedDifficulty: null,
  dailyGoalMinutes: 30,
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [parentControls, setParentControls] = useState<ParentControls>(defaultParentControls)

  useEffect(() => {
    // Load user from localStorage
    const savedUser = localStorage.getItem("edumate_user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }

    // Load parent controls
    const savedControls = localStorage.getItem("edumate_parent_controls")
    if (savedControls) {
      setParentControls(JSON.parse(savedControls))
    }
  }, [])

  const login = async (email: string, password: string, role: "student" | "parent") => {
    try {
      const response = await apiService.login({ email, password, role })
      
      if (!response.success || !response.user) {
        throw new Error(response.error || "Login failed")
      }

      const user: User = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role,
        grade: response.user.grade,
      }

      setUser(user)
      localStorage.setItem("edumate_user", JSON.stringify(user))
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("edumate_user")
  }

  const updateParentControls = (controls: Partial<ParentControls>) => {
    const updated = { ...parentControls, ...controls }
    setParentControls(updated)
    localStorage.setItem("edumate_parent_controls", JSON.stringify(updated))
  }

  const announce = (message: string) => {
    const announcer = document.getElementById("announcer")
    if (announcer) {
      announcer.textContent = message
    }
  }

  return (
    <AppContext.Provider value={{ user, login, logout, parentControls, updateParentControls, announce }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within AppProvider")
  }
  return context
}

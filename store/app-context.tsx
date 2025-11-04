"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

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
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    const mockUser: User = {
      id: "1",
      email,
      name: role === "student" ? "Alex Johnson" : "Sarah Johnson",
      role,
      grade: role === "student" ? 8 : undefined,
    }

    setUser(mockUser)
    localStorage.setItem("edumate_user", JSON.stringify(mockUser))
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

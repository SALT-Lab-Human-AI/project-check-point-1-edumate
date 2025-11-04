"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useApp } from "@/store/app-context"
import { Bell, User, LogOut, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function NavBar() {
  const { user, logout } = useApp()
  const pathname = usePathname()
  const router = useRouter()

  if (!user) return null

  const handleLogout = () => {
    logout()
    router.push("/login")
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
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href={user.role === "student" ? "/student" : "/parent"}
            className="flex items-center gap-3 font-bold text-xl text-navy hover:opacity-80 transition-opacity"
          >
            <img src="/logo.png" alt="EduMate Logo" className="w-10 h-10" />
            <span>EduMate</span>
          </Link>
          <span className="text-sm text-text/60">{getBreadcrumb()}</span>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5 text-navy" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-yellow rounded-full" />
          </Button>

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

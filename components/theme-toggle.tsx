"use client"

import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark" || theme === undefined // default dark in globals

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Tema değiştir"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}

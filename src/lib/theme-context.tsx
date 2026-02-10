'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Script to prevent flash - runs before React hydrates
const themeScript = `
  (function() {
    const theme = localStorage.getItem('theme') || 'light'
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    }
  })()
`

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Load theme from localStorage on mount
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored) {
      setThemeState(stored)
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    
    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#1A1D23' : '#FBF7F0')
    }
  }, [theme])

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
    
    // Also save to database if user is logged in
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('user_preferences')
          .upsert({ user_id: user.id, theme: newTheme }, { onConflict: 'user_id' })
      }
    } catch (e) {
      // Silently fail - localStorage is the primary source
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, mounted }}>
      {/* Inject script to prevent flash before hydration */}
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

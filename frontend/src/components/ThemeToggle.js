import { useState, useEffect } from 'react'
import '../style/App.css'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  return (
    <button 
      onClick={() => setIsDark(!isDark)}
      className="theme-toggle"
      aria-label={isDark ? 'Light' : 'Dark'}
    >
      {isDark ? '🌞' : '🌙'}
    </button>
  )
}
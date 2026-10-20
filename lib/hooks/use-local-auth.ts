"use client"

import { useEffect, useState } from "react"

interface User {
  id: string
  email: string
  is_admin: boolean
}

export function useLocalAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem("auth_user")
    if (stored) {
      setUser(JSON.parse(stored))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", email, password }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error)
    }

    const { user } = await response.json()
    localStorage.setItem("auth_user", JSON.stringify(user))
    setUser(user)
    return user
  }

  const signup = async (email: string, password: string) => {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "signup", email, password }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error)
    }

    const { user } = await response.json()
    localStorage.setItem("auth_user", JSON.stringify(user))
    setUser(user)
    return user
  }

  const logout = () => {
    localStorage.removeItem("auth_user")
    setUser(null)
  }

  return { user, isLoading, login, signup, logout }
}

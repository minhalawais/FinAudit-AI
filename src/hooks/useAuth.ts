"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem("token")
    setIsAuthenticated(!!token)
  }, [])

  const login = (token: string) => {
    localStorage.setItem("token", token)
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem("token")
    setIsAuthenticated(false)
    navigate("/login")
  }

  return { isAuthenticated, login, logout }
}


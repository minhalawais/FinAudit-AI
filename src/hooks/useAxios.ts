"use client"

import { useCallback, useMemo } from "react"
import axios from "axios"

export const useAxios = () => {
  const getAuthToken = useCallback(() => {
    return localStorage.getItem("token")
  }, [])

  const axiosInstance = useMemo(() => {
    const instance = axios.create({
      baseURL: "http://127.0.0.1:8000",
      headers: {
        "Content-Type": "application/json",
      },
    })

    instance.interceptors.request.use(
      (config) => {
        const token = getAuthToken()
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      },
    )

    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // Handle unauthorized access (e.g., redirect to login page)
          console.error("Unauthorized access")
          localStorage.removeItem("token")
          window.location.href = "/login"
        }
        return Promise.reject(error)
      },
    )

    return instance
  }, [getAuthToken])

  return axiosInstance
}

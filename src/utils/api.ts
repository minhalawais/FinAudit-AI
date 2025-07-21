import axios from "axios"

const API_URL = "http://127.0.0.1:8000" // Replace with your API URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`
  }
  return config
})

export const login = async (username: string, password: string) => {
  const response = await api.post(
    "/auth/token",
    new URLSearchParams({
      username: username,
      password: password,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  )
  return response.data
}

export const signup = async (userData: any) => {
  const response = await api.post("/auth/signup", userData)
  return response.data
}

export const getCurrentUser = async () => {
  const response = await api.get("/auth/users/me")
  return response.data
}

export default api


import axios from "axios"
import { API_ENDPOINTS } from "./endpoints"

const api = axios.create({
     baseURL: API_ENDPOINTS.API_ROOT,
     headers: { "Content-Type": "application/json" },
     withCredentials: true,
})

api.interceptors.response.use(
     (response) => response,
     async (error) => {
          const originalRequest = error.config as typeof error.config & { _retry?: boolean }
          const isUnauthorized = error.response?.status === 401
          const isRefreshCall = originalRequest?.url?.includes(API_ENDPOINTS.USER_TOKEN_REFRESH)

          if (isUnauthorized && !originalRequest?._retry && !isRefreshCall) {
               originalRequest._retry = true

               try {
                    await api.post(API_ENDPOINTS.USER_TOKEN_REFRESH)
                    return api(originalRequest)
               } catch (refreshError) {
                    return Promise.reject(refreshError)
               }
          }

          return Promise.reject(error)
     }
)

export default api


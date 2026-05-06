import type { User } from "@/types/user"
import api from "../axios"
import { API_ENDPOINTS } from "../endpoints"
import type { ApiResponse } from "../types"

type RegisterPayload = {
     email: string
     phone: string
     password: string
}

type LoginPayload = {
     email: string
     password: string
}

type PasswordResetPayload = {
     email: string
}

type PasswordResetConfirmPayload = {
     uid: string
     token: string
     new_password: string
}

export const authUserService = {
     async userRegister(payload: RegisterPayload): Promise<ApiResponse<User>> {
          const response = await api.post<User>(API_ENDPOINTS.USER_REGISTRATION, payload)
          return {
               data: response.data,
               status: response.status,
          }
     },

     async userLogin(payload: LoginPayload): Promise<ApiResponse<User>> {
          const response = await api.post<User>(API_ENDPOINTS.USER_LOGIN, payload)
          return {
               data: response.data,
               status: response.status,
          }
     },

     async requestPasswordReset(payload: PasswordResetPayload) {
          const response = await api.post(API_ENDPOINTS.USER_PASSWORD_RESET, payload)
          return {
               data: response.data,
               status: response.status,
          }
     },

     async confirmPasswordReset(payload: PasswordResetConfirmPayload) {
          const response = await api.post(API_ENDPOINTS.USER_PASSWORD_RESET_CONFIRM, payload)
          return {
               data: response.data,
               status: response.status,
          }
     },

     async refreshAccessToken() {
          const response = await api.post(API_ENDPOINTS.USER_TOKEN_REFRESH)
          return {
               data: response.data,
               status: response.status,
          }
     },

     async logOut() {
          const response = await api.post(API_ENDPOINTS.USER_LOGOUT)

          return {
               data: response.data as { detail: string },
               status: response.status,
          }
     },
}

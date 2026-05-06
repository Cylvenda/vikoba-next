// src/store/auth/userAuth.store.ts
import { create } from "zustand"
import type { User } from "./auth.types"
import { userServices } from "@/api/services/user.service"
import { authUserService } from "@/api/services/auth.service"

type AuthState = {
     loading: boolean
     error: string | null
     user: User | null
     isAuthenticated: boolean
     isLoggedIn: boolean

     fetchUser: () => Promise<User | null>
     updateUserProfile: (payload: { first_name?: string; last_name?: string }) => Promise<{ success: boolean; message: string; user?: User }>
     checkAuth: () => Promise<boolean>
     resendRefreshToken: () => Promise<boolean>
     logout: () => Promise<void>
     initAuth: () => Promise<boolean>
}

export const useAuthUserStore = create<AuthState>((set, get) => ({
     loading: false,
     error: null,
     user: null,
     isAuthenticated: false,
     isLoggedIn: false,

     fetchUser: async (): Promise<User | null> => {
          set({ loading: true, error: null })
          try {
               const res = await userServices.getUserMe()
               const userData: User = {
                    uuid: res.data.uuid,
                    firstName: res.data.first_name || "",
                    lastName: res.data.last_name || "",
                    email: res.data.email,
                    phone: res.data.phone,
                    username: res.data.username || "",
                    isActive: res.data.is_active,
                    isAdmin: res.data.is_admin,
                    isStaff: res.data.is_staff,
               }
               set({
                    user: userData,
                    isAuthenticated: true,
                    isLoggedIn: true,
                    loading: false,
               })
               return userData
          } catch (err: unknown) {
               const message = err instanceof Error ? err.message : "Failed to fetch user"
               set({
                    user: null,
                    isAuthenticated: false,
                    isLoggedIn: false,
                    loading: false,
                    error: message,
               })
               return null
          }
     },

     updateUserProfile: async (payload) => {
          set({ loading: true, error: null })
          try {
               const res = await userServices.updateUserMe(payload)
               const userData: User = {
                    uuid: res.data.uuid,
                    firstName: res.data.first_name || "",
                    lastName: res.data.last_name || "",
                    email: res.data.email,
                    phone: res.data.phone,
                    username: res.data.username || "",
                    isActive: res.data.is_active,
                    isAdmin: res.data.is_admin,
                    isStaff: res.data.is_staff,
               }
               set({
                    user: userData,
                    isAuthenticated: true,
                    isLoggedIn: true,
                    loading: false,
               })
               return { success: true, message: "Profile updated successfully.", user: userData }
          } catch (err: unknown) {
               const message = err instanceof Error ? err.message : "Failed to update profile"
               set({
                    loading: false,
                    error: message,
               })
               return { success: false, message }
          }
     },

     resendRefreshToken: async (): Promise<boolean> => {
          try {
               const res = await authUserService.refreshAccessToken()
               return res.status === 200
          } catch {
               return false
          }
     },

     checkAuth: async (): Promise<boolean> => {
          const currentUser = await get().fetchUser()
          if (currentUser) return true

          const refreshed = await get().resendRefreshToken()
          if (!refreshed) return false

          const refreshedUser = await get().fetchUser()
          return Boolean(refreshedUser)
     },

     logout: async (): Promise<void> => {
          set({ loading: true, error: null })
          try {
               await authUserService.logOut()
               set({
                    user: null,
                    isAuthenticated: false,
                    isLoggedIn: false,
                    loading: false,
               })
          } catch (err: unknown) {
               const message = err instanceof Error ? err.message : "Logout failed"
               set({
                    user: null,
                    isAuthenticated: false,
                    isLoggedIn: false,
                    loading: false,
                    error: message,
               })
          }
     },

     initAuth: async () => {
          return get().checkAuth()
     },
}))

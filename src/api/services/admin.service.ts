import type { UserMeResponse } from "@/store/auth/auth.types"
import api from "../axios"
import { API_ENDPOINTS } from "../endpoints"
import type { Group } from "@/store/group/group.types"

export type AdminUser = UserMeResponse & {
     id: number
}


export const AdminService = {

     // get all users
     async getAllUsers() {
          const response = await api.get<AdminUser[]>(API_ENDPOINTS.ADMIN_USERS)
          return {
               status: response.status,
               data: response.data
          }
     },

     async updateUser(id: string | number, data: Partial<AdminUser>) {
          const response = await api.patch<AdminUser>(`${API_ENDPOINTS.ADMIN_USERS}${id}/`, data)
          return {
               status: response.status,
               data: response.data,
          }
     },

     async getAllGroups() {
          const response = await api.get<Group[]>(API_ENDPOINTS.ADMIN_GROUPS)
          return {
               status: response.status,
               data: response.data,
          }
     },

     async updateGroup(id: string | number, data: Partial<Group>) {
          const response = await api.patch<Group>(`${API_ENDPOINTS.ADMIN_GROUPS}${id}/`, data)
          return {
               status: response.status,
               data: response.data,
          }
     },
}

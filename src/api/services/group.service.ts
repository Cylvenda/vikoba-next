
import { Group, GroupInvitation, GroupMembership } from "@/store/group/group.types"
import api from "../axios"
import { API_ENDPOINTS } from "../endpoints"
import { ApiResponse } from "../types"

export const groupServices = {
     async createGroup(payload: {
          name: string
          description?: string
          is_private?: boolean
          is_active?: boolean
     }): Promise<ApiResponse<Group>> {
          const response = await api.post<Group>(API_ENDPOINTS.USER_GROUPS, payload)
          return {
               status: response.status,
               data: response.data,
          }
     },

     async getGroups() {
          const response = await api.get<Group[]>(API_ENDPOINTS.USER_GROUPS)
          return {
               status: response.status,
               data: response.data,
          }
     },

     async getGroupById(uuid: string): Promise<ApiResponse<Group>> {
          const response = await api.get<Group>(`${API_ENDPOINTS.GET_GROUP}${uuid}/`)
          return {
               status: response.status,
               data: response.data,
          }
     },

     async getGroupMembers(uuid: string): Promise<ApiResponse<GroupMembership[]>> {
          const response = await api.get<GroupMembership[]>(`${API_ENDPOINTS.GET_GROUP_MEMBERS}${uuid}/members/`)
          return {
               status: response.status,
               data: response.data
          }
     },

     async sendGroupInvitation(
          groupUuid: string,
          payload: { email: string; message?: string }
     ): Promise<ApiResponse<{ detail: string }>> {
          const response = await api.post<{ detail: string }>(
               `${API_ENDPOINTS.GET_GROUP}${groupUuid}/invitations/send/`,
               payload
          )
          return {
               status: response.status,
               data: response.data,
          }
     },

     async getMyGroupInvitations(): Promise<ApiResponse<GroupInvitation[]>> {
          const response = await api.get<GroupInvitation[]>(API_ENDPOINTS.MY_GROUP_INVITATIONS)
          return {
               status: response.status,
               data: response.data,
          }
     },

     async respondToInvitation(
          invitationUuid: string,
          action: "accept" | "decline"
     ): Promise<ApiResponse<{ detail: string }>> {
          const response = await api.post<{ detail: string }>(
               `${API_ENDPOINTS.GROUP_RESPOND_INVITATION}${invitationUuid}/respond/`,
               { action }
          )
          return {
               status: response.status,
               data: response.data,
          }
     },

     async verifyGroupMember(groupUuid: string, membershipUuid: string): Promise<ApiResponse<GroupMembership>> {
          const response = await api.patch<GroupMembership>(
               `${API_ENDPOINTS.GET_GROUP}${groupUuid}/members/${membershipUuid}/verify/`
          )
          return {
               status: response.status,
               data: response.data,
          }
     },

     async toggleGroupMember(
          groupUuid: string,
          membershipUuid: string
     ): Promise<ApiResponse<{ detail: string; data: GroupMembership }>> {
          const response = await api.patch<{ detail: string; data: GroupMembership }>(
               `${API_ENDPOINTS.GET_GROUP}${groupUuid}/members/${membershipUuid}/activate/`
          )
          return {
               status: response.status,
               data: response.data,
          }
     },
}

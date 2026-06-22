
import { Group, GroupInvitation, GroupMembership } from "@/store/group/group.types"
import api from "../axios"
import { API_ENDPOINTS } from "../endpoints"
import { ApiResponse } from "../types"

export const groupServices = {
     async updateGroup(
          groupUuid: string,
          payload: Partial<Group>
     ): Promise<ApiResponse<Group>> {
          const response = await api.patch<Group>(
               `${API_ENDPOINTS.GET_GROUP}${groupUuid}/`,
               payload
          )
          return {
               status: response.status,
               data: response.data,
          }
     },

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

     async joinGroupByCode(join_code: string): Promise<ApiResponse<{ detail: string; membership: GroupMembership }>> {
          const response = await api.post<{ detail: string; membership: GroupMembership }>(
               API_ENDPOINTS.JOIN_GROUP_BY_CODE,
               { join_code }
          )
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

     async getGroupInvitations(groupUuid: string): Promise<ApiResponse<GroupInvitation[]>> {
          const response = await api.get<GroupInvitation[]>(`${API_ENDPOINTS.GET_GROUP}${groupUuid}/invitations/`)
          return {
               status: response.status,
               data: response.data,
          }
     },

     async adminRespondJoinRequest(
          groupUuid: string,
          invitationUuid: string,
          action: "accept" | "decline"
     ): Promise<ApiResponse<{ detail: string }>> {
          const response = await api.post<{ detail: string }>(
               `${API_ENDPOINTS.ADMIN_RESPOND_JOIN_REQUEST}${groupUuid}/join-requests/${invitationUuid}/respond/`,
               { action }
          )
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

     async removeGroupMember(
          groupUuid: string,
          membershipUuid: string
     ): Promise<ApiResponse<{ detail: string }>> {
          const response = await api.delete<{ detail: string }>(
               `${API_ENDPOINTS.GET_GROUP}${groupUuid}/members/${membershipUuid}/remove/`
          )
          return {
               status: response.status,
               data: response.data,
          }
     },

     async changeGroupMemberRole(
          groupUuid: string,
          membershipUuid: string,
          role: string
     ): Promise<ApiResponse<{ detail: string; data: GroupMembership }>> {
          const response = await api.patch<{ detail: string; data: GroupMembership }>(
               `${API_ENDPOINTS.GET_GROUP}${groupUuid}/members/${membershipUuid}/change-role/`,
               { role }
          )
          return {
               status: response.status,
               data: response.data,
          }
     },
}

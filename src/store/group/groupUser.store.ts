
import { create } from "zustand"
import { Group, GroupInvitation, GroupMembership } from './group.types';
import { groupServices } from "@/api/services/group.service"

type GroupState = {
     groups: Group[]
     selectedGroup: Group | null
     selectedGroupMembers: GroupMembership[]
     invitations: GroupInvitation[]
     groupInvitations: GroupInvitation[] // Invitations sent for the selected group
     loading: boolean
     invitationLoading: boolean
     error: string | null

     createGroup: (payload: {
          name: string
          description?: string
          is_private?: boolean
     }) => Promise<{ success: boolean; message: string }>
     fetchGroups: () => Promise<void>
     fetchGroupById: (uuid: string) => Promise<void>
     setSelectedGroup: (group: Group) => void
     fetchSelectedGroupMembers: (uuid: string) => Promise<void>
     fetchMyInvitations: () => Promise<void>
     fetchGroupInvitations: (groupUuid: string) => Promise<void>
     joinGroupByCode: (code: string) => Promise<{ success: boolean; message: string }>
     adminRespondToJoinRequest: (groupUuid: string, invitationUuid: string, action: "accept" | "decline") => Promise<{ success: boolean; message: string }>
     respondToInvitation: (invitationUuid: string, action: "accept" | "decline") => Promise<{ success: boolean; message: string }>
     verifyGroupMember: (groupUuid: string, membershipUuid: string) => Promise<{ success: boolean; message: string }>
     toggleGroupMember: (groupUuid: string, membershipUuid: string) => Promise<{ success: boolean; message: string }>
     removeGroupMember: (groupUuid: string, membershipUuid: string) => Promise<{ success: boolean; message: string }>
     changeGroupMemberRole: (groupUuid: string, membershipUuid: string, role: string) => Promise<{ success: boolean; message: string }>
     sendGroupInvitation: (groupUuid: string, email: string, message?: string) => Promise<{ success: boolean; message: string }>
     clearSelectedGroup: () => void
}

export const useGroupStore = create<GroupState>((set) => ({
     groups: [],
     selectedGroup: null,
     selectedGroupMembers: [],
     invitations: [],
     groupInvitations: [],
     loading: false,
     invitationLoading: false,
     error: null,

     createGroup: async (payload) => {
          set({ loading: true, error: null })
          try {
               const res = await groupServices.createGroup({
                    ...payload,
                    is_active: true,
               })
               set((state) => ({
                    groups: [res.data, ...state.groups],
                    loading: false,
               }))
               return { success: true, message: "Group created successfully." }
          } catch (err: unknown) {
               const message = err instanceof Error ? err.message : "Failed to create group"
               set({ loading: false, error: message })
               return { success: false, message }
          }
     },

     //  Fetch all groups
     fetchGroups: async () => {
          set({ loading: true, error: null })
          try {
               const res = await groupServices.getGroups()

               set({
                    groups: res.data, // assuming API returns Group[]
                    loading: false,
               })
          } catch (err: unknown) {
               set({
                    loading: false,
                    error: err instanceof Error ? err.message : "Failed to fetch groups",
               })
          }
     },

     fetchMyInvitations: async () => {
          set({ loading: true, error: null })

          try {
               const res = await groupServices.getMyGroupInvitations()
               set({
                    invitations: res.data,
                    loading: false,
               })
          } catch (err: unknown) {
               set({
                    loading: false,
                    error: err instanceof Error ? err.message : "Failed to fetch invitations",
               })
          }
     },

     fetchGroupInvitations: async (groupUuid: string) => {
          set({ loading: true, error: null })
          try {
               const res = await groupServices.getGroupInvitations(groupUuid)
               set({
                    groupInvitations: res.data,
                    loading: false,
               })
          } catch (err: unknown) {
               set({
                    loading: false,
                    error: err instanceof Error ? err.message : "Failed to fetch group invitations",
               })
          }
     },

     joinGroupByCode: async (code) => {
          set({ loading: true, error: null })
          try {
               const res = await groupServices.joinGroupByCode(code)
               set({ loading: false })
               return { success: true, message: res.data.detail }
          } catch (err: unknown) {
               const errorData = (err as any)?.response?.data
               const errorMessage = errorData?.detail || errorData?.join_code?.[0] || "Failed to join group."
               set({ loading: false, error: errorMessage })
               return { success: false, message: errorMessage }
          }
     },

     adminRespondToJoinRequest: async (groupUuid, invitationUuid, action) => {
          set({ invitationLoading: true, error: null })
          try {
               const res = await groupServices.adminRespondJoinRequest(groupUuid, invitationUuid, action)
               
               // Remove the invitation from the list after successful response
               set((state) => ({
                    groupInvitations: state.groupInvitations.filter((inv) => inv.invitation_uuid !== invitationUuid),
                    invitationLoading: false,
               }))
               
               return { success: true, message: res.data.detail || `Request ${action}ed successfully.` }
          } catch (err: unknown) {
               const errorData = (err as any)?.response?.data
               const errorMessage = errorData?.detail || `Failed to ${action} request.`
               set({ invitationLoading: false, error: errorMessage })
               return { success: false, message: errorMessage }
          }
     },

     respondToInvitation: async (invitationUuid, action) => {
          set({ invitationLoading: true, error: null })
          try {
               const res = await groupServices.respondToInvitation(invitationUuid, action)
               set((state) => ({
                    invitations: state.invitations.filter(
                         (invitation) => invitation.invitation_uuid !== invitationUuid
                    ),
                    invitationLoading: false,
               }))
               return { success: true, message: res.data.detail }
          } catch (err: unknown) {
               const message = err instanceof Error ? err.message : "Failed to respond to invitation"
               set({ invitationLoading: false, error: message })
               return { success: false, message }
          }
     },

     fetchGroupById: async (uuid) => {

          set({ loading: true, error: null })

          try {
               const res = await groupServices.getGroupById(uuid)

               set({
                    selectedGroup: res.data,
                    loading: false,
               })
          } catch (err: unknown) {
               set({
                    loading: false,
                    error: err instanceof Error ? err.message : "Failed to fetch group",
               })
          }
     },

     // fetching selected group members
     fetchSelectedGroupMembers: async (uuid) => {

          set({ loading: true, error: null })

          try {
               const res = await groupServices.getGroupMembers(uuid)

               set({
                    selectedGroupMembers: res.data,
                    loading: false,
               })
          } catch (err: unknown) {
               set({
                    loading: false,
                    error: err instanceof Error ? err.message : "Failed to fetch group",
               })
          }

     },

     sendGroupInvitation: async (groupUuid, email, message) => {
          set({ invitationLoading: true, error: null })

          try {
               const res = await groupServices.sendGroupInvitation(groupUuid, { email, message })
               const detail = res.data?.detail || "Invitation sent successfully."
               set({ invitationLoading: false })
               return { success: true, message: detail }
          } catch (err: unknown) {
               const errorData = (err as { response?: { data?: { detail?: string; email?: string[] } } })?.response?.data
               const errorMessage = errorData?.detail || errorData?.email?.[0] || "Failed to send invitation."

               set({
                    invitationLoading: false,
                    error: errorMessage,
               })
               return { success: false, message: errorMessage }
          }
     },

     verifyGroupMember: async (groupUuid, membershipUuid) => {
          set({ invitationLoading: true, error: null })
          try {
               const res = await groupServices.verifyGroupMember(groupUuid, membershipUuid)
               set((state) => ({
                    selectedGroupMembers: state.selectedGroupMembers.map((member) =>
                         member.membership_id === membershipUuid ? res.data : member
                    ),
                    invitationLoading: false,
               }))
               return { success: true, message: "Member verified successfully." }
          } catch (err: unknown) {
               const message = err instanceof Error ? err.message : "Failed to verify member"
               set({ invitationLoading: false, error: message })
               return { success: false, message }
          }
     },

     toggleGroupMember: async (groupUuid, membershipUuid) => {
          set({ invitationLoading: true, error: null })
          try {
               const res = await groupServices.toggleGroupMember(groupUuid, membershipUuid)
               set((state) => ({
                    selectedGroupMembers: state.selectedGroupMembers.map((member) =>
                         member.membership_id === membershipUuid ? res.data.data : member
                    ),
                    invitationLoading: false,
               }))
               return { success: true, message: res.data.detail }
          } catch (err: unknown) {
               const message = err instanceof Error ? err.message : "Failed to update member"
               set({ invitationLoading: false, error: message })
               return { success: false, message }
          }
     },

     removeGroupMember: async (groupUuid, membershipUuid) => {
          set({ invitationLoading: true, error: null })
          try {
               const res = await groupServices.removeGroupMember(groupUuid, membershipUuid)
               set((state) => ({
                    selectedGroupMembers: state.selectedGroupMembers.filter(
                         (member) => member.membership_id !== membershipUuid
                    ),
                    invitationLoading: false,
               }))
               return { success: true, message: res.data.detail }
          } catch (err: unknown) {
               const message = err instanceof Error ? err.message : "Failed to remove member"
               set({ invitationLoading: false, error: message })
               return { success: false, message }
          }
     },

     changeGroupMemberRole: async (groupUuid, membershipUuid, role) => {
          set({ invitationLoading: true, error: null })
          try {
               const res = await groupServices.changeGroupMemberRole(groupUuid, membershipUuid, role)
               set((state) => ({
                    selectedGroupMembers: state.selectedGroupMembers.map((member) =>
                         member.membership_id === membershipUuid ? res.data.data : member
                    ),
                    invitationLoading: false,
               }))
               return { success: true, message: res.data.detail }
          } catch (err: unknown) {
               const message = err instanceof Error ? err.message : "Failed to change role"
               set({ invitationLoading: false, error: message })
               return { success: false, message }
          }
     },

     // Select a group (for UI / navigation)
     setSelectedGroup: (group) => {
          set({ selectedGroup: group })
     },

     // Clear selected group
     clearSelectedGroup: () => {
          set({ selectedGroup: null, selectedGroupMembers: [] })
     },
}))

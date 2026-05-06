"use client"

import { Button } from "@/components/ui/button";
import { useAuthUserStore } from "@/store/auth/userAuth.store";
import { useGroupStore } from "@/store/group/groupUser.store";
import { toast } from "react-toastify";


export default function MembersList() {
     const { user } = useAuthUserStore()
     const { selectedGroupMembers, selectedGroup, loading, invitationLoading, verifyGroupMember, toggleGroupMember } = useGroupStore()
     const isHost = user?.email === selectedGroup?.created_by

     const handleVerify = async (membershipId: string) => {
          if (!selectedGroup?.id) return
          const result = await verifyGroupMember(selectedGroup.id, membershipId)
          if (result.success) {
               toast.success(result.message)
          } else {
               toast.error(result.message)
          }
     }

     const handleToggle = async (membershipId: string) => {
          if (!selectedGroup?.id) return
          const result = await toggleGroupMember(selectedGroup.id, membershipId)
          if (result.success) {
               toast.success(result.message)
          } else {
               toast.error(result.message)
          }
     }

     if (loading && selectedGroupMembers.length === 0) {
          return (
               <div className="sticky top-20 h-96 overflow-y-auto rounded-2xl bg-card p-4 shadow">
                    <h3 className="text-lg font-bold mb-4">Members</h3>
                    <div className="animate-pulse space-y-3">
                         {[1, 2, 3, 4].map((i) => (
                              <div key={i} className="flex justify-between items-center py-2">
                                   <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                        <div className="space-y-1">
                                             <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                                             <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                                        </div>
                                   </div>
                              </div>
                         ))}
                    </div>
               </div>
          )
     }

     return (
          <div className="sticky top-20 h-96 overflow-y-auto rounded-2xl bg-card p-4 shadow">
               <h3 className="text-lg font-bold mb-4">Members</h3>
               <div className="divide-y">
                    {selectedGroupMembers.map((member) => (
                         <div key={member.membership_id} className="flex justify-between items-center py-2 border-b-2">
                              <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-chart-2 text-white rounded-full flex items-center justify-center">
                                        {[member.first_name, member.last_name]
                                             .join(" ")
                                             .split(' ')
                                             .filter(Boolean)
                                             .map(word => word[0])
                                             .slice(0, 2)
                                             .join('')
                                        }
                                   </div>
                                   <div>
                                        <p className="font-medium">
                                             {[member.first_name, member.last_name].join(" ").trim() || member.email}
                                        </p>
                                        <p className="text-xs font-light">{member.role} • {member.is_verified ? "verified" : "pending verification"}</p>
                                   </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                   <p className={`text-sm ${member.is_active ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                                        {member.is_active ? "active" : "inactive"}
                                   </p>
                                   {isHost && member.role !== "HOST" && (
                                        <div className="flex gap-2">
                                             {!member.is_verified && (
                                                  <Button size="sm" className="bg-chart-3" disabled={invitationLoading} onClick={() => handleVerify(member.membership_id)}>
                                                       Verify
                                                  </Button>
                                             )}
                                             <Button size="sm" variant="outline" disabled={invitationLoading} onClick={() => handleToggle(member.membership_id)}>
                                                  {member.is_active ? "Deactivate" : "Activate"}
                                             </Button>
                                        </div>
                                   )}
                              </div>
                         </div>
                    ))}
                    {!loading && selectedGroupMembers.length === 0 && (
                         <p className="py-2 text-sm text-muted-foreground">No members found for this group.</p>
                    )}
               </div>
          </div>
     )
}

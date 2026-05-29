"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAuthUserStore } from "@/store/auth/userAuth.store"
import { useGroupStore } from "@/store/group/groupUser.store"
import { toast } from "react-toastify"
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  UserX,
  UserCheck,
  UserMinus,
  UserPlus,
  User,
  Mail,
  MoreHorizontal,
  CheckCircle2,
  Send,
  X,
  Search,
  Users,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// ── Invite Modal ──────────────────────────────────────────────────────────────
function InviteModal({ groupId, onClose }: { groupId: string; onClose: () => void }) {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const { sendGroupInvitation, invitationLoading } = useGroupStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    const result = await sendGroupInvitation(groupId, email.trim(), message.trim() || undefined)
    if (result.success) {
      toast.success(result.message)
      onClose()
    } else {
      toast.error(result.message)
    }
  }

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md p-6 sm:p-8">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-chart-3/15 text-chart-3 rounded-2xl flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-extrabold text-left">Invite New Member</DialogTitle>
              <DialogDescription className="text-xs text-left mt-1">Send an invitation via email</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="member@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border/60 rounded-xl text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-chart-3/40 focus:border-chart-3/60 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Personal Message <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Add a personal note to your invitation..."
              className="w-full px-4 py-2.5 bg-muted/50 border border-border/60 rounded-xl text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-chart-3/40 focus:border-chart-3/60 transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-border mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl font-bold border-border/80"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={invitationLoading || !email.trim()}
              className="flex-1 bg-chart-3 hover:bg-chart-3/90 text-primary-foreground rounded-xl font-bold shadow-sm gap-2"
            >
              <Send className="w-4 h-4" />
              {invitationLoading ? "Sending..." : "Send Invite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Confirm Remove Modal ───────────────────────────────────────────────────────
function ConfirmRemoveModal({
  memberName,
  onConfirm,
  onClose,
  loading,
}: {
  memberName: string
  onConfirm: () => void
  onClose: () => void
  loading: boolean
}) {
  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-sm p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center shrink-0">
              <UserMinus className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground text-left">Remove Member</DialogTitle>
              <DialogDescription className="text-xs text-left mt-1">This action cannot be undone</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-2">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to permanently remove{" "}
            <span className="font-bold text-foreground">{memberName}</span> from the group?
          </p>
        </div>

        <div className="flex gap-3 pt-4 border-t border-border mt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl font-bold border-border/80">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-bold"
          >
            {loading ? "Removing..." : "Yes, Remove"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Role Badge ─────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const config: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    CHAIRPERSON: {
      label: "Chairperson",
      icon: <Shield className="w-3 h-3" />,
      className: "bg-chart-3/15 text-chart-3 border-chart-3/25",
    },
    SECRETARY: {
      label: "Secretary",
      icon: <ShieldCheck className="w-3 h-3" />,
      className: "bg-chart-4/15 text-chart-4 border-chart-4/25",
    },
    TREASURER: {
      label: "Treasurer",
      icon: <ShieldCheck className="w-3 h-3" />,
      className: "bg-purple-500/15 text-purple-500 border-purple-500/25",
    },
    MEMBER: {
      label: "Member",
      icon: null,
      className: "bg-muted text-muted-foreground border-border/60",
    },
  }
  const c = config[role] ?? config.MEMBER
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${c.className}`}>
      {c.icon}
      {c.label}
    </span>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function MembersList() {
  const { user } = useAuthUserStore()
  const {
    selectedGroupMembers,
    selectedGroup,
    loading,
    invitationLoading,
    verifyGroupMember,
    toggleGroupMember,
    removeGroupMember,
    changeGroupMemberRole,
    groupInvitations,
    fetchGroupInvitations,
    adminRespondToJoinRequest,
  } = useGroupStore()

  const [showInvite, setShowInvite] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (selectedGroup?.id) {
      fetchGroupInvitations(selectedGroup.id)
    }
  }, [selectedGroup?.id, fetchGroupInvitations])

  // Determine current user's role
  const currentMembership = selectedGroupMembers.find((m) => m.user_id === user?.uuid)
  const isLeader =
    (currentMembership?.role === "CHAIRPERSON" || currentMembership?.role === "SECRETARY") &&
    currentMembership?.is_verified &&
    currentMembership?.is_active

  const isChairperson =
    currentMembership?.role === "CHAIRPERSON" &&
    currentMembership?.is_verified &&
    currentMembership?.is_active

  const filteredMembers = selectedGroupMembers.filter((m) => {
    const name = [m.first_name, m.last_name].join(" ").toLowerCase()
    const email = (m.email ?? "").toLowerCase()
    return name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase())
  }).sort((a, b) => {
    if (a.is_verified === b.is_verified) return 0;
    return a.is_verified ? 1 : -1;
  });

  const handleVerify = async (membershipId: string) => {
    if (!selectedGroup?.id) return
    const result = await verifyGroupMember(selectedGroup.id, membershipId)
    if (result.success) {
      toast.success(result.message)
      return
    }
    toast.error(result.message)
  }

  const handleRespondToJoinRequest = async (invitationId: string, action: "accept" | "decline") => {
    if (!selectedGroup?.id) return
    const result = await adminRespondToJoinRequest(selectedGroup.id, invitationId, action)
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
      return
    }
    toast.error(result.message)
  }

  const handleRoleChange = async (membershipId: string, role: string) => {
    if (!selectedGroup?.id) return
    const result = await changeGroupMemberRole(selectedGroup.id, membershipId, role)
    if (result.success) {
      toast.success(result.message)
      return
    }
    toast.error(result.message)
  }

  const handleRemoveConfirm = async () => {
    if (!selectedGroup?.id || !removeTarget) return
    const result = await removeGroupMember(selectedGroup.id, removeTarget.id)
    if (result.success) {
      toast.success(result.message)
      setRemoveTarget(null)
    } else {
      toast.error(result.message)
    }
  }

  if (loading && selectedGroupMembers.length === 0) {
    return (
      <div className="rounded-2xl border border-border/50 overflow-hidden">
        <div className="animate-pulse divide-y divide-border/30">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 bg-muted rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
              <div className="h-5 bg-muted rounded-full w-20" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Modals */}
      {showInvite && selectedGroup && (
        <InviteModal groupId={selectedGroup.id} onClose={() => setShowInvite(false)} />
      )}
      {removeTarget && (
        <ConfirmRemoveModal
          memberName={removeTarget.name}
          onConfirm={handleRemoveConfirm}
          onClose={() => setRemoveTarget(null)}
          loading={invitationLoading}
        />
      )}

      {/* Bento Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Total Members</span>
          </div>
          <p className="text-2xl font-extrabold text-foreground">{selectedGroupMembers.length}</p>
        </div>
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-chart-3">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Verified</span>
          </div>
          <p className="text-2xl font-extrabold text-foreground">{selectedGroupMembers.filter(m => m.is_verified).length}</p>
        </div>
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-green-500">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Active</span>
          </div>
          <p className="text-2xl font-extrabold text-foreground">{selectedGroupMembers.filter(m => m.is_active).length}</p>
        </div>
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-chart-4">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Pending</span>
          </div>
          <p className="text-2xl font-extrabold text-foreground">{selectedGroupMembers.filter(m => !m.is_verified).length}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-card/40 p-2 rounded-[1.25rem] border border-border/60">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search roster..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border-none rounded-xl text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-chart-3/30 transition-all shadow-sm"
          />
        </div>
        {isLeader && (
          <Button
            onClick={() => setShowInvite(true)}
            className="bg-chart-3 hover:bg-chart-3/90 text-primary-foreground rounded-xl font-bold shadow-sm gap-2 shrink-0 h-9"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Pending Join Requests (for Leaders) */}
      {isLeader && groupInvitations.filter(inv => inv.status === "pending").length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-chart-4" />
            Pending Join Requests ({groupInvitations.filter(inv => inv.status === "pending").length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupInvitations.filter(inv => inv.status === "pending").map((invitation) => (
              <div
                key={invitation.invitation_uuid}
                className="flex flex-col gap-3 p-4 rounded-2xl border border-chart-4/30 bg-chart-4/5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-background/50 text-chart-4 text-sm font-extrabold flex items-center justify-center shrink-0 border border-chart-4/20">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{invitation.email}</p>
                  </div>
                </div>
                <p className="text-xs font-medium text-muted-foreground line-clamp-2 min-h-[32px] bg-background/40 p-2 rounded-lg">
                  {invitation.message || "Requested to join via short code"}
                </p>
                <div className="flex items-center gap-2 mt-auto pt-2">
                  <Button
                    onClick={() => handleRespondToJoinRequest(invitation.invitation_uuid, "accept")}
                    disabled={invitationLoading}
                    size="sm"
                    className="flex-1 bg-chart-3/15 text-chart-3 hover:bg-chart-3/25 border border-chart-3/20 rounded-xl font-bold"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleRespondToJoinRequest(invitation.invitation_uuid, "decline")}
                    disabled={invitationLoading}
                    size="sm"
                    variant="outline"
                    className="flex-1 text-destructive hover:bg-destructive/10 border-destructive/20 rounded-xl font-bold bg-background/50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm">
            <UserX className="w-10 h-10 mb-3 opacity-25" />
            <p className="text-sm font-medium">
              {searchQuery ? "No members match your search." : "No members found for this group."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredMembers.map((member, idx) => {
              const fullName = [member.first_name, member.last_name].join(" ").trim() || member.email
              const initials = fullName
                .split(" ")
                .filter(Boolean)
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()
              const isSelf = member.user_id === user?.uuid
              const canActOn = isLeader && !isSelf && member.role !== "CHAIRPERSON"
              const canRemove = isLeader && !isSelf && member.role !== "CHAIRPERSON"
              const canChangeRole = isChairperson && !isSelf && member.role !== "CHAIRPERSON"

              return (
                <div
                  key={member.membership_id}
                  className="group flex flex-row items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                >
                  {/* Row number */}
                  <span className="text-xs font-bold text-muted-foreground/40 w-5 text-right shrink-0 tabular-nums">
                    {idx + 1}
                  </span>

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-chart-4/15 text-chart-4 text-sm font-extrabold flex items-center justify-center shrink-0 border border-chart-4/20">
                    {initials}
                  </div>

                  {/* Name & Email */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground truncate">
                        {fullName}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-chart-3 bg-chart-3/10 px-1.5 py-0.5 rounded-full border border-chart-3/20">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  </div>

                  {/* Role badge */}
                  <div className="hidden sm:block shrink-0">
                    <RoleBadge role={member.role} />
                  </div>

                  {/* Verified status */}
                  <div className="hidden md:flex items-center gap-1 shrink-0">
                    {member.is_verified ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-chart-3">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-orange-500">
                        <ShieldAlert className="w-3.5 h-3.5" /> Pending
                      </span>
                    )}
                  </div>

                  {/* Active badge */}
                  <div className="hidden lg:block shrink-0">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      member.is_active
                        ? "bg-green-500/10 text-green-600 border-green-500/25"
                        : "bg-muted text-muted-foreground border-border/60"
                    }`}>
                      {member.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Actions dropdown — only for leaders acting on non-chairpersons */}
                  {canActOn ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-xl opacity-100"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 rounded-2xl border border-border/80 shadow-xl">
                        {/* Verify */}
                        {!member.is_verified && (
                          <DropdownMenuItem
                            onClick={() => handleVerify(member.membership_id)}
                            className="rounded-xl gap-2 cursor-pointer font-medium"
                          >
                            <UserCheck className="w-4 h-4 text-chart-3" />
                            Verify Member
                          </DropdownMenuItem>
                        )}
                        {/* Toggle active */}
                        <DropdownMenuItem
                          onClick={() => handleToggle(member.membership_id)}
                          className="rounded-xl gap-2 cursor-pointer font-medium"
                        >
                          {member.is_active ? (
                            <>
                              <ShieldOff className="w-4 h-4 text-orange-500" />
                              Deactivate Member
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4 text-chart-4" />
                              Activate Member
                            </>
                          )}
                        </DropdownMenuItem>

                        {/* Change Role — Chairperson only */}
                        {canChangeRole && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="rounded-xl gap-2 font-medium cursor-pointer">
                                <Shield className="w-4 h-4 text-chart-3" />
                                Change Role
                              </DropdownMenuSubTrigger>
                              <DropdownMenuPortal>
                                <DropdownMenuSubContent className="rounded-2xl border border-border/80 shadow-xl min-w-[160px]">
                                  {(["SECRETARY", "TREASURER", "MEMBER"] as const).map((role) => (
                                    <DropdownMenuItem
                                      key={role}
                                      disabled={member.role === role}
                                      onClick={() => handleRoleChange(member.membership_id, role)}
                                      className={`rounded-xl gap-2 cursor-pointer font-medium capitalize ${member.role === role ? "opacity-40" : ""}`}
                                    >
                                      {role === "SECRETARY" && <ShieldCheck className="w-4 h-4 text-chart-4" />}
                                      {role === "TREASURER" && <ShieldCheck className="w-4 h-4 text-purple-500" />}
                                      {role === "MEMBER" && <User className="w-4 h-4 text-muted-foreground" />}
                                      {role.charAt(0) + role.slice(1).toLowerCase()}
                                      {member.role === role && <span className="ml-auto text-[10px] text-muted-foreground">current</span>}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuSubContent>
                              </DropdownMenuPortal>
                            </DropdownMenuSub>
                          </>
                        )}

                        {/* Remove — Chairperson only */}
                        {canRemove && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setRemoveTarget({ id: member.membership_id, name: fullName })}
                              className="rounded-xl gap-2 cursor-pointer font-medium text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <UserMinus className="w-4 h-4" />
                              Remove from Group
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <div className="w-8 shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

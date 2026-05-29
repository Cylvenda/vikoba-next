"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "react-toastify"
import { BadgeCheck, FolderKanban, LockKeyhole, Plus, UserPlus, Users } from "lucide-react"
import GroupList from "@/components/dashboard/GroupList"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuthUserStore } from "@/store/auth/userAuth.store"
import { useGroupStore } from "@/store/group/groupUser.store"

export default function GroupsPage() {
  const { user } = useAuthUserStore()
  const { groups, fetchGroups, fetchMyInvitations, loading } = useGroupStore()
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        await Promise.allSettled([fetchGroups(), fetchMyInvitations()])
      } catch {
        toast.error("We could not load your groups right now.")
      }
    }

    void load()
  }, [fetchGroups, fetchMyInvitations])

  const displayName = useMemo(
    () => `${user?.firstName || "Member"} ${user?.lastName || ""}`.trim(),
    [user?.firstName, user?.lastName],
  )

  const overview = useMemo(() => {
    const activeGroups = groups.filter((group) => group.is_active).length
    const privateGroups = groups.filter((group) => group.is_private).length
    const totalMembers = groups.reduce((total, group) => total + (group.members_count || 0), 0)

    return {
      totalGroups: groups.length,
      activeGroups,
      privateGroups,
      totalMembers,
    }
  }, [groups])

  return (
    <div className="w-full bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-screen-3xl space-y-8">
        <section className="rounded-[2rem] border border-border/60 bg-card/60 p-6 shadow-sm backdrop-blur-sm md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-chart-4">My Groups</p>
              <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                <FolderKanban className="size-8 text-chart-3" />
                Group workspace
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                Hello {displayName}, browse and manage the groups you belong to from one clean workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full px-3 py-1.5 text-xs font-semibold">
                {groups.length} groups
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1.5 text-xs font-semibold">
                {overview.activeGroups} active
              </Badge>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5"
              onClick={() => setJoinOpen(true)}
            >
              <UserPlus size={16} /> <span className="hidden sm:inline">Join Group</span>
            </Button>
            <Button
              size="sm"
              className="flex items-center gap-1.5"
              onClick={() => setCreateOpen(true)}
            >
              <Plus size={16} /> <span className="hidden sm:inline">Add New Group</span>
            </Button>
            <Button asChild variant="ghost" size="sm" className="ml-auto hidden sm:inline-flex">
              <Link href="/home">Back to dashboard</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-none bg-card/70 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <Users className="size-4 text-chart-3" />
                Total groups
              </div>
              <p className="mt-3 text-3xl font-bold text-foreground">{overview.totalGroups}</p>
            </CardContent>
          </Card>
          <Card className="border-none bg-card/70 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <BadgeCheck className="size-4 text-green-500" />
                Active groups
              </div>
              <p className="mt-3 text-3xl font-bold text-foreground">{overview.activeGroups}</p>
            </CardContent>
          </Card>
          <Card className="border-none bg-card/70 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <LockKeyhole className="size-4 text-chart-2" />
                Private groups
              </div>
              <p className="mt-3 text-3xl font-bold text-foreground">{overview.privateGroups}</p>
            </CardContent>
          </Card>
          <Card className="border-none bg-card/70 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <Users className="size-4 text-chart-4" />
                Total members
              </div>
              <p className="mt-3 text-3xl font-bold text-foreground">{overview.totalMembers}</p>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-[2rem] border border-border/60 bg-card/50 p-4 shadow-sm md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-chart-4">Groups list</p>
              <h2 className="mt-1 text-xl font-bold text-foreground">All your groups</h2>
            </div>
            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-semibold">
              {groups.length} total
            </Badge>
          </div>

          {loading && groups.length === 0 ? (
            <Card className="border-none bg-card shadow-sm">
              <CardContent className="p-8 text-sm text-muted-foreground">Loading groups...</CardContent>
            </Card>
          ) : (
            <GroupList
              groups={groups}
              createOpen={createOpen}
              joinOpen={joinOpen}
              onCreateOpenChange={setCreateOpen}
              onJoinOpenChange={setJoinOpen}
            />
          )}
        </section>
      </div>
    </div>
  )
}

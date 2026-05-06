"use client"

import { useState } from "react"
import { Search, Shield, UserRound } from "lucide-react"
import { toast } from "react-toastify"
import { AdminService, type AdminUser } from "@/api/services/admin.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatUTCDate } from "@/hooks/formatted-date"

type EditableUser = AdminUser & { id: number }

export function AdminUsersManager({ initialUsers }: { initialUsers: AdminUser[] }) {
  const [users, setUsers] = useState<EditableUser[]>(initialUsers)
  const [query, setQuery] = useState("")
  const [loadingId, setLoadingId] = useState<number | null>(null)

  const updateUser = async (userId: number, data: Partial<EditableUser>, successMessage: string) => {
    setLoadingId(userId)
    try {
      const response = await AdminService.updateUser(userId, data)
      setUsers((current) =>
        current.map((user) => (user.id === response.data.id ? { ...user, ...response.data } : user))
      )
      toast.success(successMessage)
    } catch {
      toast.error("Failed to update user.")
    } finally {
      setLoadingId(null)
    }
  }

  const filteredUsers = users.filter((user) => {
    const searchTarget = [
      user.email,
      user.username,
      user.first_name,
      user.last_name,
      user.phone,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    return searchTarget.includes(query.toLowerCase())
  })

  return (
    <Card className="border-none bg-card shadow-sm">
      <CardHeader className="gap-4 border-b">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Users</CardTitle>
            <CardDescription>Search users, update profile details, and control access.</CardDescription>
          </div>

          <label className="relative block w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by email, username, or name"
              className="h-10 rounded-2xl pl-9"
            />
          </label>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        {filteredUsers.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No users match your search.
          </div>
        ) : (
          filteredUsers.map((user) => {
            const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ")
            const isSaving = loadingId === user.id

            return (
              <div key={user.id} className="rounded-3xl border border-border bg-muted/30 p-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-chart-2/15 text-chart-3">
                        <UserRound className="size-5" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{fullName || "No name set"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        value={user.first_name || ""}
                        onChange={(event) =>
                          setUsers((current) =>
                            current.map((entry) =>
                              entry.id === user.id ? { ...entry, first_name: event.target.value } : entry
                            )
                          )
                        }
                        placeholder="First name"
                        className="h-10 rounded-2xl"
                      />
                      <Input
                        value={user.last_name || ""}
                        onChange={(event) =>
                          setUsers((current) =>
                            current.map((entry) =>
                              entry.id === user.id ? { ...entry, last_name: event.target.value } : entry
                            )
                          )
                        }
                        placeholder="Last name"
                        className="h-10 rounded-2xl"
                      />
                      <Input
                        value={user.username || ""}
                        onChange={(event) =>
                          setUsers((current) =>
                            current.map((entry) =>
                              entry.id === user.id ? { ...entry, username: event.target.value } : entry
                            )
                          )
                        }
                        placeholder="Username"
                        className="h-10 rounded-2xl"
                      />
                      <Input
                        value={user.phone || ""}
                        onChange={(event) =>
                          setUsers((current) =>
                            current.map((entry) =>
                              entry.id === user.id ? { ...entry, phone: event.target.value } : entry
                            )
                          )
                        }
                        placeholder="Phone number"
                        className="h-10 rounded-2xl"
                      />
                    </div>
                  </div>

                  <div className="min-w-full space-y-3 xl:min-w-[280px]">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border">
                        {user.is_active ? "Active" : "Disabled"}
                      </span>
                      <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border">
                        {user.is_staff ? "Staff" : "Standard"}
                      </span>
                      <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border">
                        {user.is_admin ? "Admin" : "Member"}
                      </span>
                    </div>

                    <div className="rounded-2xl bg-background p-4 text-sm text-muted-foreground ring-1 ring-border">
                      <p className="font-medium text-foreground">Account details</p>
                      <p className="mt-2">UUID: {user.uuid}</p>
                      <p>Joined: {user.date_joined ? formatUTCDate(user.date_joined) : "Unavailable"}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={isSaving}
                        onClick={() =>
                          updateUser(
                            user.id,
                            {
                              first_name: user.first_name,
                              last_name: user.last_name,
                              username: user.username,
                              phone: user.phone,
                            },
                            "User profile updated."
                          )
                        }
                      >
                        Save details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isSaving}
                        onClick={() => updateUser(user.id, { is_active: !user.is_active }, "User access updated.")}
                      >
                        {user.is_active ? "Disable access" : "Enable access"}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isSaving}
                        onClick={() => updateUser(user.id, { is_staff: !user.is_staff }, "Staff role updated.")}
                      >
                        <Shield className="size-4" />
                        {user.is_staff ? "Remove staff" : "Make staff"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { Search, Shield, UserRound } from "lucide-react"
import { toast } from "react-toastify"
import { AdminService, type AdminUser } from "@/api/services/admin.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatUTCDate } from "@/hooks/formatted-date"
import { useLanguage } from "@/components/language/language-provider"

type EditableUser = AdminUser & { id: number }

export function AdminUsersManager({ initialUsers }: { initialUsers: AdminUser[] }) {
  const [users, setUsers] = useState<EditableUser[]>(initialUsers)
  const [query, setQuery] = useState("")
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const { language } = useLanguage()
  const tt = (en: string, sw: string) => language === "sw" ? sw : en

  const updateUser = async (userId: number, data: Partial<EditableUser>, successMessage: string) => {
    setLoadingId(userId)
    try {
      const response = await AdminService.updateUser(userId, data)
      setUsers((current) =>
        current.map((user) => (user.id === response.data.id ? { ...user, ...response.data } : user))
      )
      toast.success(successMessage)
    } catch {
      toast.error(tt("Failed to update user.", "Imeshindikana kusasisha mtumiaji."))
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
            <CardTitle>{tt("Users", "Watumiaji")}</CardTitle>
            <CardDescription>{tt("Search users, update profile details, and control access.", "Tafuta watumiaji, sasisha wasifu, na dhibiti ufikiaji.")}</CardDescription>
          </div>

          <label className="relative block w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tt("Search by email, username, or name", "Tafuta kwa barua pepe, jina la mtumiaji, au jina")}
              className="h-10 rounded-2xl pl-9"
            />
          </label>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        {filteredUsers.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            {tt("No users match your search.", "Hakuna watumiaji wanaolingana na utafutaji wako.")}
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
                        <p className="text-lg font-semibold">{fullName || tt("No name set", "Jina halijawekwa")}</p>
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
                        placeholder={tt("First name", "Jina la kwanza")}
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
                        placeholder={tt("Last name", "Jina la mwisho")}
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
                        placeholder={tt("Username", "Jina la mtumiaji")}
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
                        placeholder={tt("Phone number", "Namba ya simu")}
                        className="h-10 rounded-2xl"
                      />
                    </div>
                  </div>

                  <div className="min-w-full space-y-3 xl:min-w-[280px]">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border">
                        {user.is_active ? tt("Active", "Hai") : tt("Disabled", "Imezimwa")}
                      </span>
                      <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border">
                        {user.is_staff ? tt("Staff", "Mfanyakazi") : tt("Standard", "Kawaida")}
                      </span>
                      <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border">
                        {user.is_admin ? tt("Admin", "Msimamizi") : tt("Member", "Mwanachama")}
                      </span>
                    </div>

                    <div className="rounded-2xl bg-background p-4 text-sm text-muted-foreground ring-1 ring-border">
                      <p className="font-medium text-foreground">{tt("Account details", "Maelezo ya akaunti")}</p>
                      <p className="mt-2">UUID: {user.uuid}</p>
                      <p>{tt("Joined:", "Alijiunga:")} {user.date_joined ? formatUTCDate(user.date_joined) : tt("Unavailable", "Haipatikani")}</p>
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
                            tt("User profile updated.", "Wasifu wa mtumiaji umesasishwa.")
                          )
                        }
                      >
                        {tt("Save details", "Hifadhi maelezo")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isSaving}
                        onClick={() => updateUser(user.id, { is_active: !user.is_active }, tt("User access updated.", "Ufikiaji wa mtumiaji umesasishwa."))}
                      >
                        {user.is_active ? tt("Disable access", "Zima ufikiaji") : tt("Enable access", "Wezesha ufikiaji")}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isSaving}
                        onClick={() => updateUser(user.id, { is_staff: !user.is_staff }, tt("Staff role updated.", "Jukumu la mfanyakazi limesasishwa."))}
                      >
                        <Shield className="size-4" />
                        {user.is_staff ? tt("Remove staff", "Ondoa ufanyakazi") : tt("Make staff", "Weka mfanyakazi")}
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

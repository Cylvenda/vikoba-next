"use client";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { List, Plus, Search, UserPlus } from "lucide-react";
import Link from "next/link";
import GroupItem from "./GroupItem";
import type { Group } from "@/store/group/group.types";
import { useGroupStore } from "@/store/group/groupUser.store";
import { toast } from "react-toastify";

type GroupListProps = {
  groups: Group[];
  limit?: number;
  hideSearch?: boolean;
};

const GroupList = ({ groups, limit, hideSearch = false }: GroupListProps) => {
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const { setSelectedGroup, createGroup, joinGroupByCode, loading } = useGroupStore();

  const displayedGroups = useMemo(() => {
    let result = groups;
    if (search.trim()) {
      result = result.filter((group) =>
        group.name.toLowerCase().includes(search.toLowerCase()),
      );
    }
    if (limit) {
      result = result.slice(0, limit);
    }
    return result;
  }, [groups, search, limit]);

  const handleCreateGroup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = await createGroup({
      name: name.trim(),
      description: description.trim(),
      is_private: isPrivate,
    });

    if (result.success) {
      toast.success(result.message);
      setName("");
      setDescription("");
      setIsPrivate(true);
      setIsCreateOpen(false);
      return;
    }

    toast.error(result.message);
  };

  const handleJoinGroup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (joinCode.length !== 6) {
      toast.error("Join code must be 6 characters long.");
      return;
    }

    const result = await joinGroupByCode(joinCode.toUpperCase());

    if (result.success) {
      toast.success(result.message);
      setJoinCode("");
      setIsJoinOpen(false);
      return;
    }

    toast.error(result.message);
  };

  if (loading && groups.length === 0) {
    return (
      <div className="w-full rounded-2xl bg-card border border-border shadow-sm p-4 md:p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-8 w-1/4 bg-muted rounded mb-6"></div>
          <div className="h-16 bg-muted rounded"></div>
          <div className="h-16 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full rounded-2xl bg-card border border-border shadow-sm p-4 md:p-6 flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
             <h1 className="text-xl font-bold text-foreground">My Groups</h1>
             <p className="text-xs text-muted-foreground mt-1">Manage and access your savings groups</p>
          </div>
          <div className="flex gap-2">
            {!pathname.includes("/home/groups") && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5"
              >
                <Link href="/groups" prefetch={false}>
                  <List size={16} /> <span className="hidden sm:inline">View All</span>
                </Link>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5"
              onClick={() => setIsJoinOpen(true)}
            >
              <UserPlus size={16} /> <span className="hidden sm:inline">Join Group</span>
            </Button>
            <Button
              size="sm"
              className="flex items-center gap-1.5"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus size={16} /> <span className="hidden sm:inline">New Group</span>
            </Button>
          </div>
        </div>

        {!hideSearch && (
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Search groups..."
              className="pl-9 bg-muted/50 border-none rounded-xl"
            />
          </div>
        )}

        <div className="space-y-3">
          {displayedGroups.length === 0 ? (
            <div className="py-12 text-center rounded-xl bg-muted/30 border border-dashed border-border">
              <p className="text-sm font-medium text-foreground">No groups found</p>
              <p className="text-xs text-muted-foreground mt-1">Try creating a new one or adjusting your search.</p>
            </div>
          ) : (
            displayedGroups.map((group) => (
              <GroupItem
                key={group.id}
                group={group}
                search={search}
                onSelect={setSelectedGroup}
              />
            ))
          )}
        </div>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-card p-6 shadow-xl border border-border">
            <h2 className="text-xl font-semibold">Create a New Group</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up a new group for your host workflow.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleCreateGroup}>
              <div>
                <label
                  htmlFor="group-name"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Group name
                </label>
                <Input
                  id="group-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Engineering Leadership"
                  className="bg-background"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="group-description"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Description
                </label>
                <textarea
                  id="group-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="min-h-[120px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 resize-none"
                  placeholder="What this group is for"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(event) => setIsPrivate(event.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                />
                Private group
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Group"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isJoinOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl border border-border">
            <h2 className="text-xl font-semibold">Join a Group</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter the 6-character short code to request access.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleJoinGroup}>
              <div>
                <label
                  htmlFor="join-code"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Join Code
                </label>
                <Input
                  id="join-code"
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                  placeholder="e.g., A1B2C3"
                  className="bg-background uppercase"
                  maxLength={6}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsJoinOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Sending Request..." : "Join Group"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default GroupList;

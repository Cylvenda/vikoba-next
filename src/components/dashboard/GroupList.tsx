"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { List, Plus } from "lucide-react";
import GroupItem from "./GroupItem";
import type { Group } from "@/store/group/group.types";
import { useGroupStore } from "@/store/group/groupUser.store";
import { toast } from "react-toastify";

type GroupListProps = {
  groups: Group[];
}

const GroupList = ({ groups }: GroupListProps) => {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isPrivate, setIsPrivate] = useState(true)
  const { setSelectedGroup, createGroup, loading } = useGroupStore();

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateGroup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = await createGroup({
      name: name.trim(),
      description: description.trim(),
      is_private: isPrivate,
    })

    if (result.success) {
      toast.success(result.message)
      setName("")
      setDescription("")
      setIsPrivate(true)
      setIsCreateOpen(false)
      return
    }

    toast.error(result.message)
  }

  if (loading && groups.length === 0) {
    return (
      <Card className="h-fit w-full border-none rounded-md">
        <div className="w-full p-3 md:p-6 rounded-2xl shadow-sm">
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className="h-fit w-full border-none rounded-md flex flex-col md:flex-row justify-between">
        <div className="w-full p-3 md:p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold px-2">My Groups</h1>
            <div className="flex gap-2">
              <Button variant="link" className="flex items-center gap-2">
                <List size={18} /> View All
              </Button>
              <Button className="bg-chart-3 flex items-center gap-2" onClick={() => setIsCreateOpen(true)}>
                <Plus size={18} /> New Group
              </Button>
            </div>
          </div>

          <div className="px-2 mb-4">
            <Input
              onChange={e => setSearch(e.target.value)}
              type="text"
              placeholder="Search groups..."
              className="px-5 py-6 rounded-full"
            />
          </div>

          <div className="space-y-3 px-2">
            {(search.length > 0 ? filteredGroups : groups).map(group => (
              <GroupItem
                key={group.id}
                group={group}
                search={search}
                onSelect={setSelectedGroup}
              />
            ))}
          </div>
        </div>
      </Card>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-card p-6 shadow-xl">
            <h2 className="text-xl font-semibold">Create a New Group</h2>
            <p className="mt-1 text-sm text-muted-foreground">Set up a new group for your host workflow.</p>

            <form className="mt-5 space-y-4" onSubmit={handleCreateGroup}>
              <div>
                <label htmlFor="group-name" className="mb-1 block text-sm font-medium">Group name</label>
                <Input
                  id="group-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Engineering Leadership"
                  required
                />
              </div>

              <div>
                <label htmlFor="group-description" className="mb-1 block text-sm font-medium">Description</label>
                <textarea
                  id="group-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="min-h-28 w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  placeholder="What this group is for"
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(event) => setIsPrivate(event.target.checked)}
                />
                Private group
              </label>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-chart-3" disabled={loading}>
                  {loading ? "Creating..." : "Create Group"}
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

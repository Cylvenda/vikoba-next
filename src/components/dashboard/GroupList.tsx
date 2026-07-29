"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import GroupItem from "./GroupItem";
import type { Group } from "@/store/group/group.types";
import { useGroupStore } from "@/store/group/groupUser.store";
import { toast } from "react-toastify";
import { useLanguage } from "@/components/language/language-provider";

type GroupListProps = {
  groups: Group[];
  limit?: number;
  hideSearch?: boolean;
  createOpen?: boolean;
  joinOpen?: boolean;
  onCreateOpenChange?: (open: boolean) => void;
  onJoinOpenChange?: (open: boolean) => void;
};

const GroupList = ({
  groups,
  limit,
  hideSearch = false,
  createOpen,
  joinOpen,
  onCreateOpenChange,
  onJoinOpenChange,
}: GroupListProps) => {
  const { language } = useLanguage();
  const tt = (en: string, sw: string) => language === "sw" ? sw : en;
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [joinCode, setJoinCode] = useState("");

  const { setSelectedGroup, createGroup, joinGroupByCode, loading } = useGroupStore();
  const isCreateOpen = createOpen ?? false;
  const isJoinOpen = joinOpen ?? false;
  const setCreateOpen = onCreateOpenChange ?? (() => {});
  const setJoinOpen = onJoinOpenChange ?? (() => {});

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
      setCreateOpen(false);
      return;
    }

    toast.error(result.message);
  };

  const handleJoinGroup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (joinCode.length !== 6) {
      toast.error(tt("Join code must be 6 characters long.", "Msimbo wa kujiunga lazima uwe na herufi 6."));
      return;
    }

    const result = await joinGroupByCode(joinCode.toUpperCase());

    if (result.success) {
      toast.success(result.message);
      setJoinCode("");
      setJoinOpen(false);
      return;
    }

    toast.error(result.message);
  };

  if (loading && groups.length === 0) {
    return (
      <Card className="w-full border-border shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="animate-pulse space-y-3">
            <div className="mb-6 h-8 w-1/4 rounded bg-muted" />
            <div className="h-16 rounded bg-muted" />
            <div className="h-16 rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full border-border shadow-sm">
        <CardHeader className="space-y-4 border-b border-border/60">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-xl">{tt("My Groups", "Vikundi Vyangu")}</CardTitle>
              <CardDescription className="mt-1">{tt("Manage and access your savings groups", "Simamia na ufikie vikundi vyako vya akiba")}</CardDescription>
            </div>
          </div>

          {!hideSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder={tt("Search groups...", "Tafuta vikundi...")}
                className="pl-9 bg-muted/50 border-none rounded-xl"
              />
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-border/60">
            {displayedGroups.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-medium text-foreground">{tt("No groups found", "Hakuna vikundi vilivyopatikana")}</p>
                <p className="text-xs text-muted-foreground mt-1">{tt("Try creating a new one or adjusting your search.", "Jaribu kuunda kikundi kipya au kubadilisha utafutaji.")}</p>
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
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!open) setCreateOpen(false) }}>
        <DialogContent className="sm:max-w-xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">{tt("Create a New Group", "Unda Kikundi Kipya")}</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              {tt("Set up a new group for your host workflow.", "Anzisha kikundi kipya kwa shughuli zako.")}
            </DialogDescription>
          </DialogHeader>

          <form className="mt-4 space-y-4" onSubmit={handleCreateGroup}>
            <div>
              <label
                htmlFor="group-name"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                {tt("Group name", "Jina la kikundi")}
              </label>
              <Input
                id="group-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={tt("Community Savings Group", "Kikundi cha Akiba")}
                className="bg-background"
                required
              />
            </div>

            <div>
              <label
                htmlFor="group-description"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                {tt("Description", "Maelezo")}
              </label>
              <textarea
                id="group-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-[120px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 resize-none"
                placeholder={tt("What this group is for", "Madhumuni ya kikundi hiki")}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(event) => setIsPrivate(event.target.checked)}
                className="rounded border-input text-primary focus:ring-primary h-4 w-4"
              />
              {tt("Private group", "Kikundi binafsi")}
            </label>

            <div className="flex justify-end gap-3 pt-2 border-t border-border mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateOpen(false)}
              >
                {tt("Cancel", "Ghairi")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? tt("Creating...", "Inaunda...") : tt("Create Group", "Unda Kikundi")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isJoinOpen} onOpenChange={(open) => { if (!open) setJoinOpen(false) }}>
        <DialogContent className="sm:max-w-md p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">{tt("Join a Group", "Jiunge na Kikundi")}</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              {tt("Enter the 6-character short code to request access.", "Weka msimbo wa herufi 6 ili kuomba kujiunga.")}
            </DialogDescription>
          </DialogHeader>

          <form className="mt-4 space-y-4" onSubmit={handleJoinGroup}>
            <div>
              <label
                htmlFor="join-code"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                {tt("Join Code", "Msimbo wa Kujiunga")}
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

            <div className="flex justify-end gap-3 pt-2 border-t border-border mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setJoinOpen(false)}
              >
                {tt("Cancel", "Ghairi")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? tt("Sending Request...", "Inatuma Ombi...") : tt("Join Group", "Jiunge na Kikundi")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GroupList;

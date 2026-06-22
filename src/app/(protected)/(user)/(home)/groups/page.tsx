"use client";

import { useEffect, useMemo, useState, memo } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  FolderKanban,
  Lock,
  Globe,
  Plus,
  UserPlus,
  Users,
  Search,
  ArrowRight,
  ShieldCheck,
  SlidersHorizontal
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuthUserStore } from "@/store/auth/userAuth.store";
import { useGroupStore } from "@/store/group/groupUser.store";

const GroupsPage = () => {
  const router = useRouter();
  const { user } = useAuthUserStore();
  const { groups, fetchGroups, fetchMyInvitations, createGroup, joinGroupByCode, setSelectedGroup, loading } = useGroupStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [privacyFilter, setPrivacyFilter] = useState<"ALL" | "PRIVATE" | "PUBLIC">("ALL");

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        await Promise.allSettled([fetchGroups(), fetchMyInvitations()]);
      } catch {
        toast.error("We could not load your groups right now.");
      }
    };
    void load();
  }, [fetchGroups, fetchMyInvitations]);

  const displayName = useMemo(
    () => `${user?.firstName || "Member"} ${user?.lastName || ""}`.trim(),
    [user?.firstName, user?.lastName]
  );

  const overview = useMemo(() => {
    const activeGroups = groups.filter((group) => group.is_active).length;
    const privateGroups = groups.filter((group) => group.is_private).length;
    const totalMembers = groups.reduce((total, group) => total + (group.members_count || 0), 0);

    return {
      totalGroups: groups.length,
      activeGroups,
      privateGroups,
      totalMembers,
    };
  }, [groups]);

  // Filtered groups
  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPrivacy = privacyFilter === "ALL" ? true :
        privacyFilter === "PRIVATE" ? group.is_private : !group.is_private;

      return matchesSearch && matchesPrivacy;
    });
  }, [groups, searchQuery, privacyFilter]);

  // Create Group Handler
  const handleCreateGroup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await createGroup({
      name: name.trim(),
      description: description.trim(),
      is_private: isPrivate,
    });
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message);
      setName("");
      setDescription("");
      setIsPrivate(true);
      setCreateOpen(false);
      void fetchGroups();
      return;
    }
    toast.error(result.message);
  };

  // Join Group Handler
  const handleJoinGroup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (joinCode.length !== 6) {
      toast.error("Join code must be 6 characters long.");
      return;
    }
    setIsSubmitting(true);
    const result = await joinGroupByCode(joinCode.toUpperCase());
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message);
      setJoinCode("");
      setJoinOpen(false);
      void fetchGroups();
      return;
    }
    toast.error(result.message);
  };

  return (
    <div className="w-full bg-background p-4 md:p-6 lg:p-8 min-h-screen text-foreground space-y-8">
      <div className="mx-auto w-full max-w-screen-3xl space-y-8 animate-fade-in">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <FolderKanban className="w-8 h-8 text-primary" />
              Groups Workspace
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Browse and manage your VICOBA savings circles. Hello, <span className="font-semibold text-foreground">{displayName}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setJoinOpen(true)} className="rounded-xl">
              <UserPlus className="mr-1.5 h-4 w-4" />
              Join Group
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-1.5 h-4 w-4" />
              Add New Group
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-xl">
              <Link href="/home" className="flex items-center gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="border border-border bg-card/60 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Total Groups</p>
                  <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
                    {overview.totalGroups}
                  </h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FolderKanban className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Workspace allocations</p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card/60 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Active Groups</p>
                  <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-chart-1">
                    {overview.activeGroups}
                  </h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-1/10 text-chart-1">
                  <BadgeCheck className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Operating currently</p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card/60 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Private Circles</p>
                  <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-chart-2">
                    {overview.privateGroups}
                  </h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-2/10 text-chart-2">
                  <Lock className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Invite-only setups</p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card/60 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Total Members</p>
                  <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-chart-3">
                    {overview.totalMembers}
                  </h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-3/10 text-chart-3">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Across all circles</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Content Area */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/80 bg-card/40 backdrop-blur-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search groups by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/50 border-border/80 focus-visible:ring-primary rounded-xl"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground hidden sm:inline" />
              <div className="flex rounded-xl p-1 bg-muted/65 border border-border/80 text-xs">
                {(["ALL", "PRIVATE", "PUBLIC"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setPrivacyFilter(tab)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      privacyFilter === tab
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "ALL" ? "All Type" : tab === "PRIVATE" ? "Private" : "Public"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Group Grid list */}
          {loading && groups.length === 0 ? (
            <div className="py-20 text-center text-sm text-muted-foreground animate-pulse">
              Loading groups workspace...
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-card/20 py-20 text-center">
              <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground/35 mb-4 animate-pulse" />
              <h3 className="text-lg font-bold text-foreground">No groups found</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                No groups match your current search query or filter selection. Try adjusting your settings.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group) => (
                <Card key={group.id} className="border border-border/60 bg-card hover:border-primary/50 transition-all hover:shadow-md relative overflow-hidden group flex flex-col justify-between">
                  <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="font-extrabold text-lg text-foreground leading-snug group-hover:text-primary transition-colors">
                          {group.name}
                        </h3>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                          {group.is_private ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {group.description || "No description provided for this group workspace circle."}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex flex-wrap gap-2 items-center">
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-primary" />
                          <span className="font-semibold text-foreground">{group.members_count || 0}</span>
                        </div>
                        <span className="text-border/80">•</span>
                        <div className="flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-chart-1" />
                          <span className="font-semibold text-foreground capitalize">{group.is_active ? "Active" : "Inactive"}</span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedGroup(group);
                          router.push(`/group/${group.id}`);
                        }}
                        className="h-8 rounded-lg text-primary hover:text-primary-foreground hover:bg-primary text-xs font-semibold gap-1"
                      >
                        Open Workspace
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CREATE GROUP DIALOG */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-xl p-6 sm:p-8 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-primary" />
              Create a New Group
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Define the parameters for your VICOBA workspace.
            </DialogDescription>
          </DialogHeader>

          <form className="mt-4 space-y-4" onSubmit={handleCreateGroup}>
            <div className="space-y-1.5">
              <label htmlFor="group-name" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Group Name
              </label>
              <Input
                id="group-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Kilimanjaro Savings Circle"
                className="bg-muted/30 border-border/80 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="group-description" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Description
              </label>
              <textarea
                id="group-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] w-full rounded-xl border border-border/80 bg-muted/30 px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary resize-none"
                placeholder="Describe the target capital or goals for this circle..."
              />
            </div>

            <label className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4.5 w-4.5"
              />
              Make Group Private
            </label>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground">
                {isSubmitting ? "Creating..." : "Create Group"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* JOIN GROUP DIALOG */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="sm:max-w-md p-6 sm:p-8 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Join VICOBA Group
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Enter the 6-character short code to request member membership.
            </DialogDescription>
          </DialogHeader>

          <form className="mt-4 space-y-4" onSubmit={handleJoinGroup}>
            <div className="space-y-1.5">
              <label htmlFor="join-code" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Join Code
              </label>
              <Input
                id="join-code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g., A1B2C3"
                className="bg-muted/30 border-border/80 text-center tracking-widest uppercase text-lg font-bold rounded-xl"
                maxLength={6}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
              <Button type="button" variant="ghost" onClick={() => setJoinOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground">
                {isSubmitting ? "Requesting..." : "Join Group"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default memo(GroupsPage);

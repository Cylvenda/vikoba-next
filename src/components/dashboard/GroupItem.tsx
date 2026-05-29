"use client";

import { FC } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { highlightText } from "@/hooks/hight-text";
import { Group } from "@/store/group/group.types";
import { Users, ChevronRight } from "lucide-react";

interface GroupItemProps {
     group: Group;
     search: string;
     onSelect?: (group: Group) => void;
}

const GroupItem: FC<GroupItemProps> = ({ group, search, onSelect }) => {
     const hasGroupId = Boolean(group.id)

     return (
          <div className="flex w-full items-center justify-between gap-4 rounded-xl px-4 py-4 transition-colors hover:bg-muted/40 group">
               <div className="flex items-center gap-4">
                    <div className="h-12 w-12 flex shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                         {group.name
                              .split(' ')
                              .filter(Boolean)
                              .map(word => word[0])
                              .slice(0, 2)
                              .join('')
                         }
                    </div>
                    <div className="flex flex-col">
                         <h1 className="font-semibold text-foreground text-base">
                              {search.length > 0 ? highlightText(group.name, search) : group.name}
                         </h1>
                         <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                              <Users className="w-3.5 h-3.5" />
                              <span>{group.members_count} members</span>
                         </div>
                    </div>
               </div>
               <Button asChild variant="ghost" size="icon" className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" disabled={!hasGroupId}>
                     <Link
                         href={hasGroupId ? `/group/${group.id}` : "#"}
                         aria-disabled={!hasGroupId}
                         onClick={(event) => {
                              if (!hasGroupId) {
                                   event.preventDefault()
                                   return
                              }
                              onSelect?.(group)
                         }}
                    >
                         <ChevronRight className="w-5 h-5" />
                    </Link>
               </Button>
          </div>
     )
};

export default GroupItem;

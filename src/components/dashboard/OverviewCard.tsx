"use client";

import { FC, ReactNode } from "react";

interface OverviewCardProps {
     title: string;
     description: string;
     status: string;
     count: number;
     icons: ReactNode;
}

const OverviewCard: FC<OverviewCardProps> = ({ title, description, status, count, icons }) => {
     return (
          <div className="cursor-pointer rounded-2xl border border-border bg-card p-4 transition-all duration-100 hover:border-primary hover:shadow-sm">
               <div className="flex justify-between">
                    <div className="w-10 h-10 bg-chart-2/15 p-2 rounded-lg flex items-center justify-center text-chart-3">
                         {icons}
                    </div>
                    <div className="p-3 rounded-full bg-green-500/20 text-green-700 dark:bg-green-500/30 dark:text-green-300 text-xs font-medium">
                         {status}
                    </div>
               </div>
               <p className="text-3xl font-bold mt-3">{count}</p>
               <p className="text-lg font-semibold mt-1">{title}</p>
               <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
     );
};

export default OverviewCard;

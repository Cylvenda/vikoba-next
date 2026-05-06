"use client";

import { X } from "lucide-react";

interface MenuItem {
     icon: React.ComponentType<{ className?: string }>;
     label: string;
}

interface MobileMenuProps {
     menuItems: MenuItem[];
     onClose: () => void;
}

export default function MobileMenu({ menuItems, onClose }: MobileMenuProps) {
     return (
          <div className="fixed inset-0 z-50 bg-black/50 md:hidden">
               <div className="h-full w-64 bg-card p-4 text-foreground shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                         <h2 className="text-lg font-semibold">Menu</h2>
                         <button onClick={onClose} className="rounded-md p-2 transition hover:bg-muted">
                              <X />
                         </button>
                    </div>
                    <div className="space-y-2">
                         {menuItems.map((item, i) => (
                              <button
                                   key={i}
                                   className="flex w-full items-center gap-3 rounded-md p-3 transition hover:bg-muted"
                                   onClick={onClose}
                              >
                                   <item.icon className="w-5 h-5" />
                                   <span>{item.label}</span>
                              </button>
                         ))}
                    </div>
               </div>
          </div>
     );
}

"use client"

import Link from 'next/link'
import { BellRing, LayoutDashboard, Settings, ShieldCheck, UserRound } from 'lucide-react'
import { Button } from '../ui/button'
import { useAuthUserStore } from '@/store/auth/userAuth.store'

interface MenuItemsProps {
     isMobile?: boolean
}

const MenuItems = ({ isMobile = false }: MenuItemsProps) => {
     const { user } = useAuthUserStore()
     const items = [
          { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
          { icon: BellRing, label: "Notifications", href: "/notifications" },
          { icon: UserRound, label: "Profile", href: "/profile" },
          ...(user?.isAdmin ? [{ icon: ShieldCheck, label: "Admin", href: "/admin" }] : []),
          { icon: Settings, label: "Settings", href: "/settings" },
     ]

     return (
          <>
               {items.map((item, index) => {
                    const Element = item.icon
                    return isMobile ? (
                         <Link
                              key={index}
                              href={item.href}
                              aria-label={item.label}
                              className='hover:bg-accent'
                         >
                              <div className='flex gap-2 p-2' ><Element /> {item.label} </div>
                         </Link>
                    ) : (
                         <Button
                              key={index}
                              asChild
                              variant="default"
                              size="icon-lg"
                              className="rounded-md shadow-sm"
                         >
                              <Link
                                   href={item.href}
                                   aria-label={item.label}
                                   title={item.label}
                              >
                                   <Element />
                              </Link>
                         </Button>
                    )
               })}
          </>
     )
}

export default MenuItems

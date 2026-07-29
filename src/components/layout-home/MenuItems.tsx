"use client"

import Link from 'next/link'
import { BellRing, LayoutDashboard, Settings, ShieldCheck, UserRound } from 'lucide-react'
import { Button } from '../ui/button'
import { useAuthUserStore } from '@/store/auth/userAuth.store'
import { useLanguage } from '@/components/language/language-provider'

interface MenuItemsProps {
     isMobile?: boolean
}

const MenuItems = ({ isMobile = false }: MenuItemsProps) => {
     const { user } = useAuthUserStore()
     const { language } = useLanguage()
     const tt = (en: string, sw: string) => language === "sw" ? sw : en
     const items = [
          { icon: LayoutDashboard, label: tt("Home", "Nyumbani"), href: "/home" },
          { icon: BellRing, label: tt("Notifications", "Arifa"), href: "/home/notifications" },
          { icon: UserRound, label: tt("Profile", "Wasifu"), href: "/home/profile" },
          ...(user?.isAdmin ? [{ icon: ShieldCheck, label: tt("Admin", "Msimamizi"), href: "/admin" }] : []),
          { icon: Settings, label: tt("Settings", "Mipangilio"), href: "/home/settings" },
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

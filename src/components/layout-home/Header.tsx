"use client"

import { LayoutDashboard, Menu, X } from 'lucide-react'
import { Dispatch, SetStateAction } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import UserInfo from './UserInfo'
import MenuItems from './MenuItems'
import { useMeetingStore } from '@/store/meeting/meeting.store'
import { useAuthUserStore } from '@/store/auth/userAuth.store'
import ThemeToggle from '@/components/theme/theme-toggle'

interface HeaderProps {
     showMenu: boolean
     setShowMenu: Dispatch<SetStateAction<boolean>>
}

const Header = ({ showMenu, setShowMenu }: HeaderProps) => {
     const { user } = useAuthUserStore()
     const { meetings } = useMeetingStore()
     const meetingsToday = meetings.filter((meeting) => {
          const scheduledDate = new Date(meeting.scheduled_start)
          return scheduledDate.toDateString() === new Date().toDateString()
     }).length

     return (
          <header className='sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80'>
               <div className='flex flex-row justify-between md:justify-evenly items-center'>

                    {/* Branding */}
                    <div>
                         <h1 className='font-semibold text-2xl flex gap-3 items-center'>
                              <LayoutDashboard />
                              <Link href={user?.isAdmin ? "/admin" : "/dashboard"}>Meeting Hub</Link>
                         </h1>
                         <h2 className='text-sm'>
                              {
                                   new Date().toLocaleDateString("en-US", {
                                        weekday: "long",
                                        year: "numeric",
                                   month: "long",
                                   day: "numeric",
                                   })
                              } · {meetingsToday} meetings today
                         </h2>
                    </div>

                    {/* Mobile menu toggle */}
                    <div className='flex items-center gap-2 md:hidden'>
                         <ThemeToggle compact />
                         <Button onClick={() => setShowMenu(!showMenu)} size='icon-lg' variant='outline' className='rounded-2xl'>
                              {showMenu ? <X /> : <Menu />}
                         </Button>
                    </div>

                    {/* Desktop menu icons */}
                    <div className='hidden md:flex flex-row items-center gap-4'>
                         <MenuItems />
                         <ThemeToggle />
                    </div>

                    {/* User info */}
                    <div className='hidden md:flex'>
                         <UserInfo />
                    </div>
               </div>

               {/* Mobile dropdown */}
               {showMenu && (
                    <div className='w-full bg-background p-2 transition duration-300 ease-in-out flex flex-col'>
                         <MenuItems isMobile />
                    </div>
               )}
          </header>
     )
}

export default Header

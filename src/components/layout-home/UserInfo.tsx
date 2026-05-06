"use client"

import { useEffect, useRef, useState } from 'react'
import { useAuthUserStore } from '@/store/auth/userAuth.store'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown, LogOut, Settings, UserRound } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'react-toastify'

const UserInfo = () => {
     const router = useRouter()
     const menuRef = useRef<HTMLDivElement | null>(null)
     const [isOpen, setIsOpen] = useState(false)
     const [isLoggingOut, setIsLoggingOut] = useState(false)
     const { user, logout } = useAuthUserStore()

     const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ")
     const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.trim() || user?.email?.[0]?.toUpperCase() || "U"

     useEffect(() => {
          const handleClickOutside = (event: MouseEvent) => {
               if (!menuRef.current?.contains(event.target as Node)) {
                    setIsOpen(false)
               }
          }

          const handleEscape = (event: KeyboardEvent) => {
               if (event.key === "Escape") {
                    setIsOpen(false)
               }
          }

          document.addEventListener("mousedown", handleClickOutside)
          document.addEventListener("keydown", handleEscape)

          return () => {
               document.removeEventListener("mousedown", handleClickOutside)
               document.removeEventListener("keydown", handleEscape)
          }
     }, [])

     const handleLogout = async () => {
          setIsLoggingOut(true)

          try {
               await logout()
               toast.success("Logged out successfully.")
               router.replace("/login")
          } catch {
               toast.error("Failed to log out.")
          } finally {
               setIsLoggingOut(false)
               setIsOpen(false)
          }
     }

     return (
          <div className='relative' ref={menuRef}>
               <button
                    type='button'
                    onClick={() => setIsOpen((current) => !current)}
                    className='flex items-center gap-3 bg-card/90 px-3 py-2 text-left rounded-md transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    aria-haspopup='menu'
                    aria-expanded={isOpen}
               >
                    <div className='relative flex items-center justify-center'>
                         <Image
                              src="/meet.png"
                              alt='User avatar'
                              height={44}
                              width={44}
                              className='h-11 w-11 rounded-full object-cover shadow-xl'
                         />
                         <span className='absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-chart-3 text-[10px] font-semibold text-white ring-2 ring-background'>
                              {initials}
                         </span>
                    </div>

                    <div className='max-w-52'>
                         <p className='truncate text-sm font-semibold text-foreground'>
                              {fullName || "My account"}
                         </p>
                         <p className='truncate text-xs text-muted-foreground'>
                              {user?.email}
                         </p>
                    </div>

                    <ChevronDown className={`size-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
               </button>

               {isOpen && (
                    <div
                         role='menu'
                         className='absolute right-0 top-[calc(100%+0.75rem)] z-50 w-72 rounded-3xl border border-border bg-card p-2 shadow-2xl'
                    >
                         <div className='rounded-2xl bg-muted/70 px-4 py-3'>
                              <p className='text-sm font-semibold text-foreground'>{fullName || "Workspace member"}</p>
                              <p className='truncate text-xs text-muted-foreground'>{user?.email}</p>
                         </div>

                         <div className='mt-2 space-y-1'>
                              <Link
                                   href="/profile"
                                   role='menuitem'
                                   onClick={() => setIsOpen(false)}
                                   className='flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors hover:bg-muted'
                              >
                                   <UserRound className='size-4 text-chart-3' />
                                   Profile
                              </Link>

                              <Link
                                   href="/settings"
                                   role='menuitem'
                                   onClick={() => setIsOpen(false)}
                                   className='flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors hover:bg-muted'
                              >
                                   <Settings className='size-4 text-chart-3' />
                                   Settings
                              </Link>

                              <Button
                                   type='button'
                                   variant='ghost'
                                   className='h-auto w-full justify-start rounded-2xl px-4 py-3 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive'
                                   onClick={() => void handleLogout()}
                                   disabled={isLoggingOut}
                              >
                                   <LogOut className='size-4' />
                                   {isLoggingOut ? "Logging out..." : "Logout"}
                              </Button>
                         </div>
                    </div>
               )}
          </div>
     )
}

export default UserInfo

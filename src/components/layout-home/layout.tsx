"use client"

import { ReactNode, useState } from 'react'
import Header from './Header'

interface LayoutProps {
     children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
     const [showMenu, setShowMenu] = useState(false)

     return (
          <div className='min-h-screen bg-accent text-foreground'>
               <Header showMenu={showMenu} setShowMenu={setShowMenu} />
               <div className='flex justify-center w-full'>
                    {children}
               </div>
          </div>
     )
}

export default Layout

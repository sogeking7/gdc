'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Bell, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/lib/hooks'
import Image from 'next/image'

const navLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/explore', label: 'Explore Careers' },
  { href: '/resume', label: 'Resume Builder' },
  { href: '/interview', label: 'Mock Interview' },
  { href: '/profile', label: 'Profile' },
]

export function Navigation() {
  const pathname = usePathname()
  const user = useAppSelector((state) => state.user)

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-border bg-background/80 px-4 sm:px-8 md:px-10 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3 text-foreground">
          <Briefcase className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-bold leading-tight tracking-tight">
            Career Assistant
          </h2>
        </div>
        <nav className="hidden md:flex items-center gap-9">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium leading-normal transition-colors hover:text-foreground',
                pathname === link.href
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex flex-1 justify-end gap-3 sm:gap-4 items-center">
        <label className="hidden sm:flex flex-col min-w-40 !h-10 max-w-64">
          <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
            <div className="text-muted-foreground flex border-none bg-muted items-center justify-center pl-3 rounded-l-lg border-r-0">
              <Search className="h-4 w-4" />
            </div>
            <input
              className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-foreground focus:outline-0 focus:ring-0 border-none bg-muted focus:border-none h-full placeholder:text-muted-foreground px-4 rounded-l-none border-l-0 pl-2 text-sm font-normal leading-normal"
              placeholder="Search careers, courses..."
            />
          </div>
        </label>
        
        {/* Profile Completion Badge */}
        {user.profileCompletion >= 90 && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-medium text-green-700 dark:text-green-400">
              {user.profileCompletion}% Complete
            </span>
          </div>
        )}
        
        <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-muted text-foreground gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5 hover:bg-muted/80 transition-colors">
          <Bell className="h-4 w-4" />
        </button>
        
        {/* User Profile with Name and Role */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex flex-col items-end">
            <p className="text-sm font-medium leading-tight">{user.name?.split(' ')[0] || user.name}</p>
            <p className="text-xs text-muted-foreground leading-tight">{user.role}</p>
          </div>
          <div className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-primary/20">
            <Image
              src={user.avatar}
              alt={user.name}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  )
}


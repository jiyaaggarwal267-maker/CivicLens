import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Camera, Compass, LayoutDashboard, LogOut, Map as MapIcon, Menu, ShieldCheck, User } from 'lucide-react'
import { Logo } from './Logo'
import { DemoModeControl } from './DemoModeControl'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import { useRole } from '@/context/RoleContext'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { to: '/', label: 'Home', icon: null },
  { to: '/report', label: 'Report Issue', icon: Camera },
  { to: '/issues', label: 'Explore Issues', icon: Compass },
  { to: '/map', label: 'Map', icon: MapIcon },
]

function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

export function Navbar() {
  const { citizenSession, authoritySession, logoutCitizen } = useRole()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-white/85 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-civic-50 text-civic-700'
                      : 'text-muted-foreground hover:-translate-y-0.5 hover:bg-secondary hover:text-foreground'
                  )
                }
              >
                {link.icon && <link.icon className="h-3.5 w-3.5" />}
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <DemoModeControl />

          {citizenSession ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg border border-border py-1 pl-1 pr-3 transition-colors hover:bg-secondary">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">{initials(citizenSession.name)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">{citizenSession.name.split(' ')[0]}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{citizenSession.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate('/dashboard')} className="gap-2">
                  <LayoutDashboard className="h-4 w-4" /> My Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={logoutCitizen} className="gap-2 text-red-600">
                  <LogOut className="h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/login?tab=citizen')}>
              <User className="h-3.5 w-3.5" /> Log in
            </Button>
          )}

          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => navigate(authoritySession ? '/authority' : '/login?tab=authority')}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Authority Dashboard
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>
                <Logo />
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <SheetClose asChild key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium',
                        isActive ? 'bg-civic-50 text-civic-700' : 'text-foreground'
                      )
                    }
                  >
                    {link.icon && <link.icon className="h-4 w-4" />}
                    {link.label}
                  </NavLink>
                </SheetClose>
              ))}
              <SheetClose asChild>
                <NavLink
                  to={citizenSession ? '/dashboard' : '/login?tab=citizen'}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-foreground"
                >
                  <LayoutDashboard className="h-4 w-4" /> My Dashboard
                </NavLink>
              </SheetClose>
              <SheetClose asChild>
                <NavLink
                  to={authoritySession ? '/authority' : '/login?tab=authority'}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-foreground"
                >
                  <ShieldCheck className="h-4 w-4" /> Authority Dashboard
                </NavLink>
              </SheetClose>
            </nav>
            {citizenSession && (
              <div className="mt-6 border-t border-border pt-6">
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={logoutCitizen}>
                  <LogOut className="h-4 w-4" /> Log out of {citizenSession.name.split(' ')[0]}'s account
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

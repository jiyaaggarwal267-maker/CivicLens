import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ListChecks, LogOut, Map as MapIcon, Menu } from 'lucide-react'
import { Logo } from './Logo'
import { DemoModeControl } from './DemoModeControl'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useRole } from '@/context/RoleContext'
import { cn } from '@/lib/utils'

const LINKS = [
  { to: '/authority', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/authority/issues', label: 'Issues', icon: ListChecks, end: false },
  { to: '/map', label: 'Map', icon: MapIcon, end: false },
]

function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

function AuthoritySessionCard({ onLogout }: { onLogout: () => void }) {
  const { authoritySession } = useRole()
  if (!authoritySession) return null
  return (
    <div>
      <div className="flex items-center gap-2 rounded-lg px-2 py-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">{initials(authoritySession.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{authoritySession.name}</p>
          <p className="truncate text-xs text-muted-foreground">{authoritySession.email}</p>
        </div>
      </div>
      <Button variant="outline" size="sm" className="mt-2 w-full gap-2" onClick={onLogout}>
        <LogOut className="h-4 w-4" />
        Log out
      </Button>
    </div>
  )
}

function AuthorityNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
              isActive
                ? 'bg-civic-50 text-civic-700 shadow-[inset_2px_0_0_0_theme(colors.civic.600)]'
                : 'text-muted-foreground hover:translate-x-0.5 hover:bg-secondary hover:text-foreground'
            )
          }
        >
          <link.icon className="h-4 w-4" />
          {link.label}
        </NavLink>
      ))}
    </>
  )
}

export function AuthorityLayout() {
  const { logoutAuthority } = useRole()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logoutAuthority()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 px-3 py-6">
          <AuthorityNavLinks />
        </nav>
        <div className="border-t border-border p-3">
          <AuthoritySessionCard onLogout={handleLogout} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white/85 px-4 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open navigation">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-72 flex-col">
                <SheetHeader>
                  <SheetTitle>
                    <Logo />
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex-1 space-y-1">
                  <AuthorityNavLinks onNavigate={() => setMobileOpen(false)} />
                </nav>
                <div className="border-t border-border pt-4">
                  <AuthoritySessionCard onLogout={handleLogout} />
                </div>
              </SheetContent>
            </Sheet>
            <Logo />
          </div>
          <span className="hidden text-sm font-medium text-muted-foreground lg:inline">Authority Operations Console</span>
          <div className="flex items-center gap-3">
            <DemoModeControl />
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

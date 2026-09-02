import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <Logo className="text-base" />
        <p className="text-sm text-muted-foreground">Civic issue management, powered by AI — built for a faster, more accountable city.</p>
      </div>
    </footer>
  )
}

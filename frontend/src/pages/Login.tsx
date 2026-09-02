import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, KeyRound, Mail, ShieldCheck, Sparkles, User } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Logo } from '@/components/layout/Logo'
import { useRole } from '@/context/RoleContext'
import { cn } from '@/lib/utils'

const CITIZEN_DEMO = { name: 'Aarav Sharma', email: 'aarav@civiclens.demo', password: 'citizen123' }
const AUTHORITY_DEMO = { name: 'Authority Admin', email: 'authority@civiclens.demo', password: 'admin123' }

type Tab = 'CITIZEN' | 'AUTHORITY'

export function Login() {
  const [params] = useSearchParams()
  const initialTab: Tab = params.get('tab') === 'authority' ? 'AUTHORITY' : 'CITIZEN'
  const [tab, setTab] = useState<Tab>(initialTab)
  const [citizenEmail, setCitizenEmail] = useState(CITIZEN_DEMO.email)
  const [citizenPassword, setCitizenPassword] = useState(CITIZEN_DEMO.password)
  const [authorityEmail, setAuthorityEmail] = useState(AUTHORITY_DEMO.email)
  const [authorityPassword, setAuthorityPassword] = useState(AUTHORITY_DEMO.password)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { loginCitizen, loginAuthority } = useRole()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  const deriveName = (email: string, fallback: string) => {
    if (email.toLowerCase() === CITIZEN_DEMO.email) return CITIZEN_DEMO.name
    if (email.toLowerCase() === AUTHORITY_DEMO.email) return AUTHORITY_DEMO.name
    const local = email.split('@')[0]
    return local ? local.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : fallback
  }

  const handleSubmit = () => {
    setLoading(true)
    window.setTimeout(() => {
      if (tab === 'CITIZEN') {
        loginCitizen({ name: deriveName(citizenEmail, CITIZEN_DEMO.name), email: citizenEmail })
        toast.success('Welcome back!', { description: 'Logged in as a citizen.' })
        navigate(from ?? '/dashboard', { replace: true })
      } else {
        loginAuthority({ name: deriveName(authorityEmail, AUTHORITY_DEMO.name), email: authorityEmail })
        toast.success('Welcome back!', { description: 'Logged in to the Authority Operations Console.' })
        navigate(from ?? '/authority', { replace: true })
      }
      setLoading(false)
    }, 450)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-civic-50/70 via-white to-white px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-8 flex justify-center">
          <Logo className="text-xl" />
        </div>

        <Card className="overflow-hidden shadow-elevated">
          <div className="border-b border-border bg-secondary/40 p-6 pb-0">
            <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="CITIZEN" className="gap-1.5">
                  <User className="h-3.5 w-3.5" /> Citizen
                </TabsTrigger>
                <TabsTrigger value="AUTHORITY" className="gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" /> Authority
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <CardContent className="space-y-5 p-6 pt-5">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {tab === 'CITIZEN' ? 'Citizen sign in' : 'Authority sign in'}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-civic-500" />
                Demo credentials are pre-filled — just hit sign in.
              </p>
            </div>

            {tab === 'CITIZEN' ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="citizen-email" className="mb-1.5 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email
                  </Label>
                  <Input id="citizen-email" value={citizenEmail} onChange={(e) => setCitizenEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="citizen-password" className="mb-1.5 flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-muted-foreground" /> Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="citizen-password"
                      type={showPassword ? 'text' : 'password'}
                      value={citizenPassword}
                      onChange={(e) => setCitizenPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="authority-email" className="mb-1.5 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email
                  </Label>
                  <Input id="authority-email" value={authorityEmail} onChange={(e) => setAuthorityEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="authority-password" className="mb-1.5 flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-muted-foreground" /> Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="authority-password"
                      type={showPassword ? 'text' : 'password'}
                      value={authorityPassword}
                      onChange={(e) => setAuthorityPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <Button size="lg" className="w-full gap-2 shadow-[0_0_0_1px_rgba(37,99,235,0.15),0_8px_20px_-6px_rgba(37,99,235,0.45)] transition-transform hover:scale-[1.01]" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>

            <p
              className={cn(
                'rounded-lg border px-3 py-2 text-center text-xs text-muted-foreground',
                tab === 'AUTHORITY' ? 'border-civic-200 bg-civic-50/60' : 'border-border bg-secondary/50'
              )}
            >
              Hackathon demo — sign-in is simulated, no password is actually checked.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Role } from '@/types'

export interface CitizenSession {
  name: string
  email: string
}

export interface AuthoritySession {
  name: string
  email: string
}

interface RoleContextValue {
  role: Role
  setRole: (role: Role) => void
  citizenSession: CitizenSession | null
  authoritySession: AuthoritySession | null
  loginCitizen: (session: CitizenSession) => void
  loginAuthority: (session: AuthoritySession) => void
  logoutCitizen: () => void
  logoutAuthority: () => void
}

const RoleContext = createContext<RoleContextValue | null>(null)
const ROLE_KEY = 'civiclens-role'
const CITIZEN_KEY = 'civiclens-citizen-session'
const AUTHORITY_KEY = 'civiclens-authority-session'

function readSession<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => {
    if (typeof window === 'undefined') return 'CITIZEN'
    const stored = window.localStorage.getItem(ROLE_KEY)
    return stored === 'AUTHORITY' ? 'AUTHORITY' : 'CITIZEN'
  })
  const [citizenSession, setCitizenSession] = useState<CitizenSession | null>(() => readSession(CITIZEN_KEY))
  const [authoritySession, setAuthoritySession] = useState<AuthoritySession | null>(() => readSession(AUTHORITY_KEY))

  useEffect(() => {
    window.localStorage.setItem(ROLE_KEY, role)
  }, [role])

  const setRole = (next: Role) => setRoleState(next)

  const loginCitizen = (session: CitizenSession) => {
    window.localStorage.setItem(CITIZEN_KEY, JSON.stringify(session))
    setCitizenSession(session)
    setRoleState('CITIZEN')
  }

  const loginAuthority = (session: AuthoritySession) => {
    window.localStorage.setItem(AUTHORITY_KEY, JSON.stringify(session))
    setAuthoritySession(session)
    setRoleState('AUTHORITY')
  }

  const logoutCitizen = () => {
    window.localStorage.removeItem(CITIZEN_KEY)
    setCitizenSession(null)
  }

  const logoutAuthority = () => {
    window.localStorage.removeItem(AUTHORITY_KEY)
    setAuthoritySession(null)
  }

  return (
    <RoleContext.Provider
      value={{ role, setRole, citizenSession, authoritySession, loginCitizen, loginAuthority, logoutCitizen, logoutAuthority }}
    >
      {children}
    </RoleContext.Provider>
  )
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used within RoleProvider')
  return ctx
}

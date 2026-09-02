import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useRole } from '@/context/RoleContext'

export function RequireCitizen() {
  const { citizenSession } = useRole()
  const location = useLocation()
  if (!citizenSession) {
    return <Navigate to="/login?tab=citizen" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

export function RequireAuthority() {
  const { authoritySession } = useRole()
  const location = useLocation()
  if (!authoritySession) {
    return <Navigate to="/login?tab=authority" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthorityLayout } from '@/components/layout/AuthorityLayout'
import { RequireAuthority, RequireCitizen } from '@/components/layout/RequireAuth'
import { Landing } from '@/pages/Landing'
import { Report } from '@/pages/Report'
import { Issues } from '@/pages/Issues'
import { IssueDetail } from '@/pages/IssueDetail'
import { MapPage } from '@/pages/MapPage'
import { Login } from '@/pages/Login'
import { CitizenDashboard } from '@/pages/citizen/CitizenDashboard'
import { AuthorityDashboard } from '@/pages/authority/AuthorityDashboard'
import { AuthorityIssues } from '@/pages/authority/AuthorityIssues'
import { AuthorityIssueDetail } from '@/pages/authority/AuthorityIssueDetail'
import { NotFound } from '@/pages/NotFound'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/report" element={<Report />} />
        <Route path="/issues" element={<Issues />} />
        <Route path="/issues/:id" element={<IssueDetail />} />
        <Route path="/map" element={<MapPage />} />

        <Route element={<RequireCitizen />}>
          <Route path="/dashboard" element={<CitizenDashboard />} />
        </Route>
      </Route>

      <Route element={<RequireAuthority />}>
        <Route element={<AuthorityLayout />}>
          <Route path="/authority" element={<AuthorityDashboard />} />
          <Route path="/authority/issues" element={<AuthorityIssues />} />
          <Route path="/authority/issues/:id" element={<AuthorityIssueDetail />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App

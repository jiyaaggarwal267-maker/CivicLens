import type {
  CreateReportResponse,
  Department,
  IssueDetail,
  IssueStatus,
  MapIssue,
  ReportWithIssue,
  Resolution,
  Stats,
  IssueSummary,
} from '@/types'

const BASE = '/api'

class ApiClientError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init)
  if (!res.ok) {
    let message = 'Something went wrong. Please try again.'
    try {
      const body = await res.json()
      if (body?.error) message = body.error
    } catch {
      // ignore parse failure, use default message
    }
    throw new ApiClientError(message)
  }
  return res.json() as Promise<T>
}

export interface SubmitReportInput {
  image: File
  description?: string
  latitude: number
  longitude: number
  locationName: string
  reporterName?: string
}

function toFormData(input: SubmitReportInput): FormData {
  const fd = new FormData()
  fd.append('image', input.image)
  if (input.description) fd.append('description', input.description)
  fd.append('latitude', String(input.latitude))
  fd.append('longitude', String(input.longitude))
  fd.append('locationName', input.locationName)
  if (input.reporterName) fd.append('reporterName', input.reporterName)
  return fd
}

export const api = {
  submitReport: (input: SubmitReportInput) =>
    request<CreateReportResponse>('/reports', { method: 'POST', body: toFormData(input) }),

  listIssues: (params?: { status?: IssueStatus; sort?: 'priority' | 'recent' }) => {
    const qs = new URLSearchParams()
    if (params?.status) qs.set('status', params.status)
    if (params?.sort === 'recent') qs.set('sort', 'recent')
    const query = qs.toString()
    return request<{ issues: IssueSummary[] }>(`/issues${query ? `?${query}` : ''}`)
  },

  getIssue: (id: string) => request<{ issue: IssueDetail }>(`/issues/${id}`),

  getStats: () => request<Stats>('/issues/stats'),

  addReportToIssue: (issueId: string, input: SubmitReportInput) =>
    request<{ report: unknown; issue: IssueSummary; reportCount: number }>(`/issues/${issueId}/reports`, {
      method: 'POST',
      body: toFormData(input),
    }),

  assignDepartment: (issueId: string, department: Department) =>
    request<{ issue: IssueSummary }>(`/issues/${issueId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ department }),
    }),

  updateStatus: (issueId: string, status: IssueStatus) =>
    request<{ issue: IssueSummary }>(`/issues/${issueId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }),

  uploadResolution: (issueId: string, image: File) => {
    const fd = new FormData()
    fd.append('image', image)
    return request<{ resolution: Resolution }>(`/issues/${issueId}/resolution`, { method: 'POST', body: fd })
  },

  runVerification: (issueId: string) =>
    request<{ resolution: Resolution }>(`/issues/${issueId}/verify`, { method: 'POST' }),

  submitFeedback: (issueId: string, resolved: boolean) =>
    request<{ issue: IssueSummary }>(`/issues/${issueId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolved }),
    }),

  getMapIssues: () => request<{ issues: MapIssue[] }>('/map/issues'),

  getMyReports: (reporterName: string) =>
    request<{ reports: ReportWithIssue[] }>(`/reports?reporterName=${encodeURIComponent(reporterName)}`),

  resetDemo: () => request<{ message: string; mainDemoIssueId?: string }>('/demo/reset', { method: 'POST' }),
}

export { ApiClientError }

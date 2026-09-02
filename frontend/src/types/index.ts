export type Category =
  | 'POTHOLE'
  | 'STREETLIGHT'
  | 'GARBAGE'
  | 'WATER_LEAKAGE'
  | 'DAMAGED_FOOTPATH'
  | 'OPEN_DRAIN'
  | 'OTHER'

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH'
export type TrafficExposure = 'LOW' | 'MEDIUM' | 'HIGH'
export type IssueStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'REOPENED'
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH'
export type VerificationStatus = 'PENDING' | 'LIKELY_RESOLVED' | 'UNCLEAR' | 'NOT_RESOLVED'
export type Department = 'ROAD_MAINTENANCE' | 'SANITATION' | 'ELECTRICAL' | 'WATER_WORKS' | 'PARKS_HORTICULTURE'
export type Role = 'CITIZEN' | 'AUTHORITY'

export interface IssueSummary {
  id: string
  code: string
  title: string
  category: Category
  severity: Severity
  status: IssueStatus
  priorityScore: number
  priorityLevel: PriorityLevel
  trafficExposure: TrafficExposure
  department: Department | null
  latitude: number
  longitude: number
  locationName: string
  reportCount: number
  createdAt: string
  updatedAt: string
}

export interface Report {
  id: string
  issueId: string
  reporterName: string
  imageUrl: string
  description: string | null
  latitude: number
  longitude: number
  aiCategory: Category
  aiSeverity: Severity
  aiConfidence: number
  createdAt: string
}

export interface ReportWithIssue extends Report {
  issue: IssueSummary
}

export interface Resolution {
  id: string
  issueId: string
  beforeImageUrl: string
  afterImageUrl: string
  verificationStatus: VerificationStatus
  verificationConfidence: number
  verificationNotes: string | null
  verifiedAt: string | null
  createdAt: string
}

export interface CitizenFeedback {
  id: string
  issueId: string
  resolved: boolean
  createdAt: string
}

export interface IssueEvent {
  id: string
  issueId: string
  type: string
  message: string
  createdAt: string
}

export interface IssueDetail extends IssueSummary {
  description: string | null
  reports: Report[]
  resolutions: Resolution[]
  feedbacks: CitizenFeedback[]
  events: IssueEvent[]
}

export interface Classification {
  category: Category
  severity: Severity
  confidence: number
  label: string
  source: 'gemini' | 'fallback'
}

export interface DuplicateMatch {
  issueId: string
  distanceMeters: number
  textSimilarity: number
}

export interface CreateReportResponse {
  report: Report
  issue: IssueSummary
  isDuplicate: boolean
  reportCount: number
  duplicateMatch: DuplicateMatch | null
  classification: Classification
}

export interface Stats {
  openIssues: number
  highPriority: number
  inProgress: number
  resolved: number
  reopened: number
  total: number
  resolutionRate: number
  byCategory: Array<{ category: Category; count: number }>
  byStatus: Array<{ status: IssueStatus; count: number }>
}

export interface MapIssue {
  id: string
  code: string
  title: string
  category: Category
  severity: Severity
  status: IssueStatus
  priorityScore: number
  priorityLevel: PriorityLevel
  latitude: number
  longitude: number
  locationName: string
  reportCount: number
}

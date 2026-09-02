import type { Category, Department, IssueStatus, PriorityLevel, Severity, VerificationStatus } from '@/types'

export const CATEGORY_LABELS: Record<Category, string> = {
  POTHOLE: 'Pothole',
  STREETLIGHT: 'Broken Streetlight',
  GARBAGE: 'Garbage Accumulation',
  WATER_LEAKAGE: 'Water Leakage',
  DAMAGED_FOOTPATH: 'Damaged Footpath',
  OPEN_DRAIN: 'Open Drain',
  OTHER: 'Civic Issue',
}

export const DEPARTMENT_LABELS: Record<Department, string> = {
  ROAD_MAINTENANCE: 'Road Maintenance Department',
  SANITATION: 'Sanitation Department',
  ELECTRICAL: 'Electrical Department',
  WATER_WORKS: 'Water Works Department',
  PARKS_HORTICULTURE: 'Parks & Horticulture Department',
}

export const STATUS_LABELS: Record<IssueStatus, string> = {
  OPEN: 'Open',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  REOPENED: 'Reopened',
}

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  PENDING: 'Verification Pending',
  LIKELY_RESOLVED: 'Likely Resolved',
  UNCLEAR: 'Unclear',
  NOT_RESOLVED: 'Not Resolved',
}

const DEPARTMENT_BY_CATEGORY: Record<Category, Department> = {
  POTHOLE: 'ROAD_MAINTENANCE',
  DAMAGED_FOOTPATH: 'ROAD_MAINTENANCE',
  STREETLIGHT: 'ELECTRICAL',
  GARBAGE: 'SANITATION',
  WATER_LEAKAGE: 'WATER_WORKS',
  OPEN_DRAIN: 'WATER_WORKS',
  OTHER: 'ROAD_MAINTENANCE',
}

export function recommendDepartment(category: Category): Department {
  return DEPARTMENT_BY_CATEGORY[category]
}

export function severityRank(s: Severity): number {
  return { LOW: 0, MEDIUM: 1, HIGH: 2 }[s]
}

export function priorityLevelFromScore(score: number): PriorityLevel {
  if (score >= 70) return 'HIGH'
  if (score >= 40) return 'MEDIUM'
  return 'LOW'
}

export function formatRelativeAge(dateIso: string): string {
  const ms = Date.now() - new Date(dateIso).getTime()
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'Today'
  if (days === 1) return '1 day'
  return `${days} days`
}

export function formatDate(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

export function formatDateTime(dateIso: string): string {
  return new Date(dateIso).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

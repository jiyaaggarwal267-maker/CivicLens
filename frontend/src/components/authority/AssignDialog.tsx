import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api, ApiClientError } from '@/lib/api'
import { DEPARTMENT_LABELS } from '@/lib/format'
import type { Department } from '@/types'

const DEPARTMENTS = Object.keys(DEPARTMENT_LABELS) as Department[]

export function AssignDialog({
  issueId,
  currentDepartment,
  recommended,
  onAssigned,
}: {
  issueId: string
  currentDepartment: Department | null
  recommended: Department
  onAssigned: () => void
}) {
  const [open, setOpen] = useState(false)
  const [department, setDepartment] = useState<Department>(currentDepartment ?? recommended)
  const [loading, setLoading] = useState(false)

  const handleAssign = async () => {
    setLoading(true)
    try {
      await api.assignDepartment(issueId, department)
      toast.success(`Assigned to ${DEPARTMENT_LABELS[department]}.`)
      setOpen(false)
      onAssigned()
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Could not assign department.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Building2 className="h-4 w-4" /> {currentDepartment ? 'Reassign' : 'Assign'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Department</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Recommended: <span className="font-medium text-foreground">{DEPARTMENT_LABELS[recommended]}</span>
          </p>
          <Select value={department} onValueChange={(v) => setDepartment(v as Department)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {DEPARTMENT_LABELS[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={loading}>
            {loading ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

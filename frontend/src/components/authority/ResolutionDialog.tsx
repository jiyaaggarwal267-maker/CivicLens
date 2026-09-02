import { useState } from 'react'
import { CheckCircle2, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { UploadDropzone } from '@/components/report/UploadDropzone'
import { BeforeAfterSlider } from '@/components/issue/BeforeAfterSlider'
import { api, ApiClientError } from '@/lib/api'
import { VERIFICATION_LABELS } from '@/lib/format'
import type { Resolution } from '@/types'
import { cn } from '@/lib/utils'

type Step = 'upload' | 'verifying' | 'result'

export function ResolutionDialog({
  issueId,
  beforeImageUrl,
  onConfirmed,
}: {
  issueId: string
  beforeImageUrl: string
  onConfirmed: () => void
}) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [resolution, setResolution] = useState<Resolution | null>(null)
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setStep('upload')
    setFile(null)
    setResolution(null)
  }

  const handleUploadAndVerify = async () => {
    if (!file) {
      toast.error('Please upload a photo of the repaired issue.')
      return
    }
    setLoading(true)
    try {
      const { resolution: uploaded } = await api.uploadResolution(issueId, file)
      setStep('verifying')
      const { resolution: verified } = await api.runVerification(issueId)
      setResolution({ ...uploaded, ...verified })
      setStep('result')
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Could not verify resolution.')
      setStep('upload')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await api.updateStatus(issueId, 'RESOLVED')
      toast.success('Issue marked Resolved.', { description: 'The citizen will be asked to confirm the fix.' })
      setOpen(false)
      reset()
      onConfirmed()
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Could not confirm resolution.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="success" className="gap-2">
          <CheckCircle2 className="h-4 w-4" /> Mark Resolved
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Resolution Evidence</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Upload a photo of the repaired issue to run AI-assisted verification.</p>
            <UploadDropzone file={file} onChange={setFile} />
          </div>
        )}

        {step === 'verifying' && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-civic-600" />
            <p className="font-medium text-foreground">Running AI-assisted verification...</p>
            <p className="text-sm text-muted-foreground">Comparing the before and after photos.</p>
          </div>
        )}

        {step === 'result' && resolution && (
          <div className="space-y-4">
            <BeforeAfterSlider beforeSrc={beforeImageUrl} afterSrc={resolution.afterImageUrl} className="h-48 border border-border" />
            <div
              className={cn(
                'rounded-lg border p-4',
                resolution.verificationStatus === 'LIKELY_RESOLVED' && 'border-green-200 bg-green-50',
                resolution.verificationStatus === 'UNCLEAR' && 'border-amber-200 bg-amber-50',
                resolution.verificationStatus === 'NOT_RESOLVED' && 'border-red-200 bg-red-50'
              )}
            >
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> AI-assisted verification
              </p>
              <p className="mt-1 text-lg font-bold text-foreground">
                {VERIFICATION_LABELS[resolution.verificationStatus]}
                {resolution.verificationStatus === 'LIKELY_RESOLVED' && ' ✓'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{Math.round(resolution.verificationConfidence * 100)}% confidence</p>
              <p className="mt-2 text-xs text-muted-foreground">This is AI-assisted, not a guarantee — confirm before closing.</p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button className="w-full gap-2" onClick={handleUploadAndVerify} disabled={loading || !file}>
              <Sparkles className="h-4 w-4" /> Upload & Run Verification
            </Button>
          )}
          {step === 'result' && (
            <Button className="w-full" variant="success" onClick={handleConfirm} disabled={loading}>
              {loading ? 'Confirming...' : 'Confirm Resolution'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

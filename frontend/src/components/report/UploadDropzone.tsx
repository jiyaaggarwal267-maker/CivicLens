import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, ImageOff, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

export function UploadDropzone({
  file,
  onChange,
}: {
  file: File | null
  onChange: (file: File | null) => void
}) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const validateAndSet = useCallback(
    (candidate: File | undefined) => {
      if (!candidate) return
      if (!ACCEPTED.includes(candidate.type)) {
        setError('Please upload a JPG, PNG, or WEBP image.')
        return
      }
      setError(null)
      onChange(candidate)
    },
    [onChange]
  )

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragActive(false)
          validateAndSet(e.dataTransfer.files?.[0])
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        className={cn(
          'flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-secondary/40 p-6 text-center transition-colors hover:border-civic-400 hover:bg-civic-50/50',
          dragActive && 'border-civic-500 bg-civic-50'
        )}
      >
        {preview ? (
          <div className="relative w-full max-w-sm">
            <img src={preview} alt="Uploaded evidence preview" className="mx-auto max-h-56 w-full rounded-lg object-cover shadow-card" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange(null)
              }}
              className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-600 shadow-elevated hover:text-red-600"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-civic-100 text-civic-600">
              <Camera className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                <span className="text-civic-600">Click to upload</span> or drag and drop
              </p>
              <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, or WEBP</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Upload className="h-3.5 w-3.5" />
              Evidence photo of the issue
            </div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={(e) => validateAndSet(e.target.files?.[0])}
        />
      </div>
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-destructive">
          <ImageOff className="h-4 w-4" /> {error}
        </p>
      )}
    </div>
  )
}

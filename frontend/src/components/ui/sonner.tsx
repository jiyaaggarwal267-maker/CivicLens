import { Toaster as Sonner } from 'sonner'
import type { ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-right"
      toastOptions={{
        classNames: {
          toast: 'rounded-lg border border-border bg-white shadow-elevated text-sm',
          title: 'font-semibold text-foreground',
          description: 'text-muted-foreground',
          actionButton: 'bg-civic-600 text-white',
          success: 'border-green-200',
          error: 'border-red-200',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

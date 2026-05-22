import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-300">{label}</label>}
      <input
        ref={ref}
        className={cn(
          'bg-gray-700 border rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors min-h-[44px]',
          'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
          error ? 'border-red-500' : 'border-gray-600',
          className
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, className, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-300">{label}</label>}
      <textarea
        ref={ref}
        className={cn(
          'bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none',
          className
        )}
        {...props}
      />
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'

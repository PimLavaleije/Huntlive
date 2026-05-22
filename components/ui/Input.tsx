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
      {label && <label className="text-xs font-bold tracking-widest uppercase text-gray-400">{label}</label>}
      <input
        ref={ref}
        className={cn(
          'rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none transition-colors min-h-[44px]',
          'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
          error ? 'border-red-500' : 'border-[#1e2d45]',
          className
        )}
        style={{ background: '#0b1120', border: `1px solid ${error ? '#ef4444' : '#1e2d45'}` }}
        {...props}
      />
      {hint && !error && <p className="text-xs text-gray-600">{hint}</p>}
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
      {label && <label className="text-xs font-bold tracking-widest uppercase text-gray-400">{label}</label>}
      <textarea
        ref={ref}
        className={cn(
          'rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none transition-colors focus:ring-2 focus:ring-blue-500/20 resize-none',
          className
        )}
        style={{ background: '#0b1120', border: '1px solid #1e2d45' }}
        {...props}
      />
      {hint && <p className="text-xs text-gray-600">{hint}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'

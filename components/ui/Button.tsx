import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'orange'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
}

const variants = {
  primary:   'text-white font-black tracking-widest',
  secondary: 'text-gray-200 font-semibold',
  danger:    'bg-red-600 hover:bg-red-700 text-white font-bold',
  ghost:     'bg-transparent text-gray-400 font-medium',
  orange:    'bg-orange-500 hover:bg-orange-600 text-white font-bold',
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary:   { background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', border: '1px solid #3b82f6', boxShadow: '0 0 20px rgba(37,99,235,0.3)' },
  secondary: { background: '#0d1018', border: '1px solid #1a2540' },
  danger:    {},
  ghost:     { border: '1px solid #1a2540' },
  orange:    {},
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-base',
  xl: 'px-8 py-5 text-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className, disabled, style, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'rounded-xl transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]',
        variants[variant],
        sizes[size],
        className
      )}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    >
      {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  )
)
Button.displayName = 'Button'

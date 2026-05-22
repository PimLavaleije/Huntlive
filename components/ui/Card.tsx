import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, children, style, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-2xl p-4', className)}
      style={{ background: '#0d1018', border: '1px solid #1a2540', ...style }}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-3 font-semibold text-gray-200', className)} {...props}>
      {children}
    </div>
  )
}

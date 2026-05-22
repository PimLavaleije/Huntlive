import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('bg-gray-800 border border-gray-700 rounded-2xl p-4', className)} {...props}>
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

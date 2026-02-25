'use client'

import { useState, useRef, useEffect, ReactNode, createContext, useContext } from 'react'

interface DropdownContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DropdownContext = createContext<DropdownContextValue | null>(null)

interface DropdownMenuProps {
  children: ReactNode
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  
  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

interface DropdownMenuTriggerProps {
  children: ReactNode
  asChild?: boolean
}

export function DropdownMenuTrigger({ children, asChild }: DropdownMenuTriggerProps) {
  const context = useContext(DropdownContext)
  if (!context) return null
  
  return (
    <div onClick={() => context.setOpen(!context.open)}>
      {children}
    </div>
  )
}

interface DropdownMenuContentProps {
  children: ReactNode
  align?: 'start' | 'center' | 'end'
  className?: string
}

export function DropdownMenuContent({ children, align = 'start', className = '' }: DropdownMenuContentProps) {
  const context = useContext(DropdownContext)
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        context?.setOpen(false)
      }
    }
    
    if (context?.open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [context])
  
  if (!context?.open) return null
  
  const alignClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0'
  }
  
  return (
    <div 
      ref={ref}
      className={`absolute mt-2 min-w-[180px] bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 ${alignClasses[align]} ${className}`}
    >
      {children}
    </div>
  )
}

interface DropdownMenuItemProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}

export function DropdownMenuItem({ children, onClick, className = '', disabled }: DropdownMenuItemProps) {
  const context = useContext(DropdownContext)
  
  return (
    <button
      className={`w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      onClick={() => {
        if (!disabled) {
          onClick?.()
          context?.setOpen(false)
        }
      }}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export function DropdownMenuSeparator() {
  return <div className="my-1 border-t border-gray-100" />
}

interface DropdownMenuLabelProps {
  children: ReactNode
  className?: string
}

export function DropdownMenuLabel({ children, className = '' }: DropdownMenuLabelProps) {
  return (
    <div className={`px-4 py-2 text-xs font-semibold text-gray-500 uppercase ${className}`}>
      {children}
    </div>
  )
}

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PopoverContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null)

interface PopoverProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function Popover({ open: controlledOpen, defaultOpen, onOpenChange, children }: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen || false)
  
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
  
  const setOpen = React.useCallback((newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }, [controlledOpen, onOpenChange])
  
  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

interface PopoverTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean
  children: React.ReactNode
}

const PopoverTrigger = React.forwardRef<HTMLElement, PopoverTriggerProps>(
  ({ asChild, children, onClick, ...props }, ref) => {
    const context = React.useContext(PopoverContext)
    if (!context) throw new Error('PopoverTrigger must be used within Popover')
    
    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
      context.setOpen(!context.open)
      onClick?.(e as any)
    }
    
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref,
        onClick: handleClick,
        ...props,
      })
    }
    
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    )
  }
)
PopoverTrigger.displayName = "PopoverTrigger"

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'bottom' | 'left' | 'right'
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, children, align = 'center', side = 'bottom', ...props }, ref) => {
    const context = React.useContext(PopoverContext)
    if (!context) throw new Error('PopoverContent must be used within Popover')
    
    if (!context.open) return null
    
    const alignClasses = {
      start: 'left-0',
      center: 'left-1/2 -translate-x-1/2',
      end: 'right-0',
    }
    
    const sideClasses = {
      top: 'bottom-full mb-2',
      bottom: 'top-full mt-2',
      left: 'right-full mr-2 top-0',
      right: 'left-full ml-2 top-0',
    }
    
    return (
      <>
        {/* Backdrop to close on click outside */}
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => context.setOpen(false)}
        />
        <div
          ref={ref}
          className={cn(
            "absolute z-50 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95",
            sideClasses[side],
            alignClasses[align],
            className
          )}
          {...props}
        >
          {children}
        </div>
      </>
    )
  }
)
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }

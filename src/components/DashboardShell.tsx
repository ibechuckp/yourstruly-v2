'use client'

interface DashboardShellProps {
  children: React.ReactNode
}

export default function DashboardShell({ children }: DashboardShellProps) {
  // Simple wrapper - no animation (let pages handle their own content)
  // This prevents the black flash between page transitions
  return (
    <div className="ml-56 min-h-screen">
      {children}
    </div>
  )
}

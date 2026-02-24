'use client'

import Link from 'next/link'

interface SlideUpLinkProps {
  href: string
  children: string
  isActive?: boolean
  onClick?: () => void
  className?: string
}

export default function SlideUpLink({ 
  href, 
  children, 
  isActive = false, 
  onClick,
  className = ''
}: SlideUpLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`slide-up-link ${isActive ? 'active' : ''} ${className}`}
    >
      {/* Text container with overflow hidden */}
      <span className="slide-up-text-wrapper">
        <span className="slide-up-text slide-up-text-top">{children}</span>
        <span className="slide-up-text slide-up-text-bottom">{children}</span>
      </span>
      {/* Underline */}
      <span className="slide-up-underline" />
    </Link>
  )
}

// Button variant for dropdowns
export function SlideUpButton({ 
  children, 
  isActive = false, 
  onClick,
  className = '',
  suffix
}: {
  children: string
  isActive?: boolean
  onClick?: () => void
  className?: string
  suffix?: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`slide-up-link ${isActive ? 'active' : ''} ${className}`}
    >
      <span className="slide-up-text-wrapper">
        <span className="slide-up-text slide-up-text-top">{children}</span>
        <span className="slide-up-text slide-up-text-bottom">{children}</span>
      </span>
      {suffix}
      <span className="slide-up-underline" />
    </button>
  )
}

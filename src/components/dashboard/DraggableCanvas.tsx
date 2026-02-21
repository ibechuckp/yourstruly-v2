'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import { createClient } from '@/lib/supabase/client'
import DraggableWidget from './DraggableWidget'

interface WidgetPosition {
  widget_id: string
  x: number
  y: number
  locked: boolean
}

interface DraggableCanvasProps {
  children?: React.ReactNode
  widgets: {
    id: string
    component: React.ReactNode
    defaultPosition: { x: number; y: number }
  }[]
}

// Default positions for widgets - balanced spacing in single viewport
// Left column starts at x=32, right column at viewport - 300
const DEFAULT_POSITIONS: Record<string, { x: number; y: number }> = {
  // Left column
  interests: { x: 32, y: 72 },
  skills: { x: 32, y: 210 },
  personality: { x: 32, y: 340 },
  credo: { x: 32, y: 450 },
  lifeGoals: { x: 32, y: 545 },
  // Right column (negative = from right edge)
  contacts: { x: -300, y: 72 },
  onThisDay: { x: -300, y: 230 },
  gender: { x: -300, y: 370 },
  religion: { x: -300, y: 460 },
  address: { x: -300, y: 550 },
}

export default function DraggableCanvas({ children, widgets }: DraggableCanvasProps) {
  const [positions, setPositions] = useState<Record<string, WidgetPosition>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [windowWidth, setWindowWidth] = useState(1440)
  const supabase = createClient()

  // Track window width for positioning - must be before callbacks that use it
  useEffect(() => {
    setWindowWidth(window.innerWidth)
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Configure sensors for better drag experience
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    })
  )

  // Load saved positions
  useEffect(() => {
    const loadPositions = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('widget_positions')
        .select('widget_id, x, y, locked')
        .eq('user_id', user.id)

      if (data) {
        const posMap: Record<string, WidgetPosition> = {}
        data.forEach(p => {
          posMap[p.widget_id] = p
        })
        setPositions(posMap)
      }
      setIsLoading(false)
    }

    loadPositions()
  }, [])

  // Save position to database
  const savePosition = useCallback(async (widgetId: string, x: number, y: number, locked: boolean) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('widget_positions')
      .upsert({
        user_id: user.id,
        widget_id: widgetId,
        x,
        y,
        locked,
      }, {
        onConflict: 'user_id,widget_id'
      })
  }, [supabase])

  // Get position for a widget (must be before handleDragEnd)
  const getPosition = useCallback((widgetId: string): { x: number; y: number; locked?: boolean } => {
    const saved = positions[widgetId]
    if (saved) {
      return { x: saved.x, y: saved.y, locked: saved.locked }
    }
    const defaultPos = DEFAULT_POSITIONS[widgetId]
    if (defaultPos) {
      // Convert negative x values (from right) to actual position
      if (defaultPos.x < 0) {
        return { x: windowWidth + defaultPos.x, y: defaultPos.y }
      }
      return defaultPos
    }
    return { x: 100, y: 100 }
  }, [positions, windowWidth])

  // Handle drag end - clamp to viewport bounds
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, delta } = event
    const widgetId = active.id as string
    
    const currentPos = getPosition(widgetId)
    
    // Calculate new position
    let newX = (currentPos.x || 0) + delta.x
    let newY = (currentPos.y || 0) + delta.y
    
    // Clamp to viewport bounds (with padding for widget size ~320px wide, ~200px tall max)
    const minX = 16
    const maxX = windowWidth - 336  // 320px widget + 16px padding
    const minY = 70  // Below navbar
    const maxY = window.innerHeight - 180  // Above command bar
    
    newX = Math.max(minX, Math.min(maxX, newX))
    newY = Math.max(minY, Math.min(maxY, newY))

    setPositions(prev => ({
      ...prev,
      [widgetId]: { 
        widget_id: widgetId,
        x: newX, 
        y: newY, 
        locked: currentPos.locked || false
      }
    }))

    savePosition(widgetId, newX, newY, currentPos.locked || false)
  }, [getPosition, savePosition, windowWidth])

  // Handle lock toggle
  const handleLockToggle = useCallback((widgetId: string, locked: boolean) => {
    // Get current position - check saved positions first, then calculate from defaults
    let currentX: number
    let currentY: number
    
    if (positions[widgetId]) {
      currentX = positions[widgetId].x
      currentY = positions[widgetId].y
    } else {
      const defaultPos = DEFAULT_POSITIONS[widgetId]
      if (defaultPos) {
        // Convert negative x values (from right edge) to actual position
        currentX = defaultPos.x < 0 
          ? (typeof window !== 'undefined' ? window.innerWidth + defaultPos.x : 1000 + defaultPos.x)
          : defaultPos.x
        currentY = defaultPos.y
      } else {
        currentX = 100
        currentY = 100
      }
    }

    setPositions(prev => ({
      ...prev,
      [widgetId]: { 
        widget_id: widgetId,
        x: currentX, 
        y: currentY, 
        locked 
      }
    }))

    savePosition(widgetId, currentX, currentY, locked)
  }, [positions, savePosition, windowWidth])

  // Reset all positions to defaults
  const resetPositions = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Delete all saved positions
    await supabase
      .from('widget_positions')
      .delete()
      .eq('user_id', user.id)

    // Clear local state
    setPositions({})
  }, [supabase])

  if (isLoading) {
    return <div className="min-h-screen">{children}</div>
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      {/* Fixed viewport - no scroll, widgets must fit */}
      <div className="relative h-[calc(100vh-56px)] overflow-hidden">
        {/* Reset button - bottom left */}
        {Object.keys(positions).length > 0 && (
          <button
            onClick={resetPositions}
            className="fixed bottom-24 left-4 z-50 px-3 py-1.5 bg-gray-900/80 hover:bg-gray-800 backdrop-blur-sm rounded-full text-xs text-white/60 hover:text-white border border-white/10 transition-all flex items-center gap-1.5"
            title="Reset widget positions"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            Reset Layout
          </button>
        )}

        {/* Render draggable widgets */}
        {widgets.map(widget => (
          <DraggableWidget
            key={widget.id}
            id={widget.id}
            position={getPosition(widget.id)}
            locked={positions[widget.id]?.locked || false}
            onLockToggle={handleLockToggle}
          >
            {widget.component}
          </DraggableWidget>
        ))}
        
        {/* Other children (ProfileCard, etc.) */}
        {children}
      </div>
    </DndContext>
  )
}

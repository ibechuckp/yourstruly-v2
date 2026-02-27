/**
 * PostScript Life Event Configuration
 * Lucide icons for all delivery events
 */
import {
  Cake,
  Church,
  GraduationCap,
  Heart,
  Baby,
  PartyPopper,
  Wine,
  Palmtree,
  HandHeart,
  Star,
  TreePine,
  Sparkles,
  Calendar,
  Clock,
  Send,
  CheckCircle,
  LucideIcon
} from 'lucide-react'

export interface EventOption {
  key: string
  label: string
  Icon: LucideIcon
}

export const EVENT_OPTIONS: EventOption[] = [
  { key: 'birthday', label: 'Birthday', Icon: Cake },
  { key: 'wedding', label: 'Wedding', Icon: Church },
  { key: 'graduation', label: 'Graduation', Icon: GraduationCap },
  { key: 'anniversary', label: 'Anniversary', Icon: Heart },
  { key: 'first_child', label: 'First Child', Icon: Baby },
  { key: '18th_birthday', label: '18th Birthday', Icon: PartyPopper },
  { key: '21st_birthday', label: '21st Birthday', Icon: Wine },
  { key: 'retirement', label: 'Retirement', Icon: Palmtree },
  { key: 'tough_times', label: 'When Times Are Tough', Icon: HandHeart },
  { key: 'proud_moment', label: "When You're Proud", Icon: Star },
  { key: 'christmas', label: 'Christmas', Icon: TreePine },
  { key: 'new_year', label: 'New Year', Icon: Sparkles },
]

export const EVENT_LABELS: Record<string, string> = EVENT_OPTIONS.reduce(
  (acc, event) => ({ ...acc, [event.key]: event.label }),
  {}
)

export const EVENT_ICONS: Record<string, LucideIcon> = EVENT_OPTIONS.reduce(
  (acc, event) => ({ ...acc, [event.key]: event.Icon }),
  {} as Record<string, LucideIcon>
)

// Get icon for an event key
export function getEventIcon(eventKey: string | null | undefined): LucideIcon {
  if (!eventKey) return Calendar
  return EVENT_ICONS[eventKey] || Calendar
}

// Status icons for postscripts
export const STATUS_ICONS = {
  draft: Clock,
  scheduled: Calendar,
  sent: Send,
  opened: CheckCircle,
} as const

export function getStatusIcon(status: string): LucideIcon {
  return STATUS_ICONS[status as keyof typeof STATUS_ICONS] || Clock
}

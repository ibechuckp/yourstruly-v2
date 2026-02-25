/**
 * Photobook Layout Templates
 * 
 * All positions are in percentages (0-100) relative to page dimensions.
 * This allows layouts to scale to any page size while maintaining proportions.
 */

export interface SlotPosition {
  x: number      // Left edge (percentage)
  y: number      // Top edge (percentage)
  width: number  // Width (percentage)
  height: number // Height (percentage)
}

export interface LayoutSlot {
  id: string
  type: 'photo' | 'text' | 'qr'
  position: SlotPosition
  required: boolean
  /** Optional styling hints */
  style?: {
    objectFit?: 'cover' | 'contain' | 'fill'
    borderRadius?: number // percentage of slot width
    fontSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
    textAlign?: 'left' | 'center' | 'right'
    fontWeight?: 'normal' | 'medium' | 'bold'
    padding?: number // percentage
  }
  /** Placeholder text for text slots */
  placeholder?: string
}

export interface LayoutTemplate {
  id: string
  name: string
  description: string
  category: 'single' | 'multi' | 'special'
  slots: LayoutSlot[]
  background?: string
  thumbnail: string
  /** Minimum photos required for this layout */
  minPhotos: number
  /** Maximum photos this layout can hold */
  maxPhotos: number
}

// =============================================================================
// SINGLE PHOTO LAYOUTS
// =============================================================================

export const fullPhoto: LayoutTemplate = {
  id: 'full-photo',
  name: 'Full Photo',
  description: 'One photo fills the entire page',
  category: 'single',
  minPhotos: 1,
  maxPhotos: 1,
  thumbnail: '/templates/full-photo.svg',
  slots: [
    {
      id: 'photo-1',
      type: 'photo',
      position: { x: 0, y: 0, width: 100, height: 100 },
      required: true,
      style: { objectFit: 'cover' }
    }
  ]
}

export const photoWithCaption: LayoutTemplate = {
  id: 'photo-with-caption',
  name: 'Photo with Caption',
  description: 'Photo on top with text caption below',
  category: 'single',
  minPhotos: 1,
  maxPhotos: 1,
  thumbnail: '/templates/photo-with-caption.svg',
  background: '#ffffff',
  slots: [
    {
      id: 'photo-1',
      type: 'photo',
      position: { x: 5, y: 5, width: 90, height: 70 },
      required: true,
      style: { objectFit: 'cover', borderRadius: 1 }
    },
    {
      id: 'caption',
      type: 'text',
      position: { x: 5, y: 78, width: 90, height: 17 },
      required: false,
      placeholder: 'Add a caption...',
      style: { 
        fontSize: 'md', 
        textAlign: 'center',
        padding: 2
      }
    }
  ]
}

export const centeredPhoto: LayoutTemplate = {
  id: 'centered-photo',
  name: 'Centered Photo',
  description: 'Photo centered with white border frame',
  category: 'single',
  minPhotos: 1,
  maxPhotos: 1,
  thumbnail: '/templates/centered-photo.svg',
  background: '#ffffff',
  slots: [
    {
      id: 'photo-1',
      type: 'photo',
      position: { x: 10, y: 10, width: 80, height: 80 },
      required: true,
      style: { objectFit: 'contain', borderRadius: 0.5 }
    }
  ]
}

// =============================================================================
// MULTI-PHOTO LAYOUTS
// =============================================================================

export const twoHorizontal: LayoutTemplate = {
  id: 'two-horizontal',
  name: 'Two Horizontal',
  description: 'Two photos side by side',
  category: 'multi',
  minPhotos: 2,
  maxPhotos: 2,
  thumbnail: '/templates/two-horizontal.svg',
  background: '#ffffff',
  slots: [
    {
      id: 'photo-1',
      type: 'photo',
      position: { x: 3, y: 10, width: 45, height: 80 },
      required: true,
      style: { objectFit: 'cover', borderRadius: 1 }
    },
    {
      id: 'photo-2',
      type: 'photo',
      position: { x: 52, y: 10, width: 45, height: 80 },
      required: true,
      style: { objectFit: 'cover', borderRadius: 1 }
    }
  ]
}

export const twoVertical: LayoutTemplate = {
  id: 'two-vertical',
  name: 'Two Vertical',
  description: 'Two photos stacked vertically',
  category: 'multi',
  minPhotos: 2,
  maxPhotos: 2,
  thumbnail: '/templates/two-vertical.svg',
  background: '#ffffff',
  slots: [
    {
      id: 'photo-1',
      type: 'photo',
      position: { x: 5, y: 3, width: 90, height: 45 },
      required: true,
      style: { objectFit: 'cover', borderRadius: 1 }
    },
    {
      id: 'photo-2',
      type: 'photo',
      position: { x: 5, y: 52, width: 90, height: 45 },
      required: true,
      style: { objectFit: 'cover', borderRadius: 1 }
    }
  ]
}

export const grid4: LayoutTemplate = {
  id: 'grid-4',
  name: '2x2 Grid',
  description: 'Four photos in a 2x2 grid',
  category: 'multi',
  minPhotos: 4,
  maxPhotos: 4,
  thumbnail: '/templates/grid-4.svg',
  background: '#ffffff',
  slots: [
    {
      id: 'photo-1',
      type: 'photo',
      position: { x: 3, y: 3, width: 45, height: 45 },
      required: true,
      style: { objectFit: 'cover', borderRadius: 1 }
    },
    {
      id: 'photo-2',
      type: 'photo',
      position: { x: 52, y: 3, width: 45, height: 45 },
      required: true,
      style: { objectFit: 'cover', borderRadius: 1 }
    },
    {
      id: 'photo-3',
      type: 'photo',
      position: { x: 3, y: 52, width: 45, height: 45 },
      required: true,
      style: { objectFit: 'cover', borderRadius: 1 }
    },
    {
      id: 'photo-4',
      type: 'photo',
      position: { x: 52, y: 52, width: 45, height: 45 },
      required: true,
      style: { objectFit: 'cover', borderRadius: 1 }
    }
  ]
}

export const feature2Small: LayoutTemplate = {
  id: 'feature-2-small',
  name: 'Feature + 2 Small',
  description: 'One large featured photo with two smaller ones',
  category: 'multi',
  minPhotos: 3,
  maxPhotos: 3,
  thumbnail: '/templates/feature-2-small.svg',
  background: '#ffffff',
  slots: [
    {
      id: 'photo-1',
      type: 'photo',
      position: { x: 3, y: 3, width: 60, height: 94 },
      required: true,
      style: { objectFit: 'cover', borderRadius: 1 }
    },
    {
      id: 'photo-2',
      type: 'photo',
      position: { x: 66, y: 3, width: 31, height: 45 },
      required: true,
      style: { objectFit: 'cover', borderRadius: 1 }
    },
    {
      id: 'photo-3',
      type: 'photo',
      position: { x: 66, y: 52, width: 31, height: 45 },
      required: true,
      style: { objectFit: 'cover', borderRadius: 1 }
    }
  ]
}

export const collage3: LayoutTemplate = {
  id: 'collage-3',
  name: 'Collage (3 Photos)',
  description: 'Three photos in an artistic collage arrangement',
  category: 'multi',
  minPhotos: 3,
  maxPhotos: 3,
  thumbnail: '/templates/collage-3.svg',
  background: '#f8f8f8',
  slots: [
    {
      id: 'photo-1',
      type: 'photo',
      position: { x: 5, y: 5, width: 55, height: 55 },
      required: true,
      style: { objectFit: 'cover', borderRadius: 2 }
    },
    {
      id: 'photo-2',
      type: 'photo',
      position: { x: 50, y: 35, width: 45, height: 35 },
      required: true,
      style: { objectFit: 'cover', borderRadius: 2 }
    },
    {
      id: 'photo-3',
      type: 'photo',
      position: { x: 15, y: 55, width: 40, height: 40 },
      required: true,
      style: { objectFit: 'cover', borderRadius: 2 }
    }
  ]
}

// =============================================================================
// SPECIAL LAYOUTS
// =============================================================================

export const qrPage: LayoutTemplate = {
  id: 'qr-page',
  name: 'QR Code Page',
  description: 'QR code with a small photo and caption',
  category: 'special',
  minPhotos: 0,
  maxPhotos: 1,
  thumbnail: '/templates/qr-page.svg',
  background: '#ffffff',
  slots: [
    {
      id: 'qr-code',
      type: 'qr',
      position: { x: 25, y: 10, width: 50, height: 40 },
      required: true
    },
    {
      id: 'photo-1',
      type: 'photo',
      position: { x: 30, y: 55, width: 40, height: 25 },
      required: false,
      style: { objectFit: 'cover', borderRadius: 50 } // Circle crop
    },
    {
      id: 'caption',
      type: 'text',
      position: { x: 10, y: 82, width: 80, height: 15 },
      required: false,
      placeholder: 'Scan to watch the video',
      style: { 
        fontSize: 'lg', 
        textAlign: 'center',
        fontWeight: 'medium'
      }
    }
  ]
}

export const wisdomQuote: LayoutTemplate = {
  id: 'wisdom-quote',
  name: 'Wisdom Quote',
  description: 'Quote text with decorative background',
  category: 'special',
  minPhotos: 0,
  maxPhotos: 0,
  thumbnail: '/templates/wisdom-quote.svg',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  slots: [
    {
      id: 'quote',
      type: 'text',
      position: { x: 10, y: 25, width: 80, height: 40 },
      required: true,
      placeholder: '"Add your wisdom quote here..."',
      style: { 
        fontSize: '2xl', 
        textAlign: 'center',
        fontWeight: 'medium',
        padding: 5
      }
    },
    {
      id: 'attribution',
      type: 'text',
      position: { x: 20, y: 68, width: 60, height: 10 },
      required: false,
      placeholder: '— Attribution',
      style: { 
        fontSize: 'md', 
        textAlign: 'center',
        fontWeight: 'normal'
      }
    }
  ]
}

export const titlePage: LayoutTemplate = {
  id: 'title-page',
  name: 'Title Page',
  description: 'Title, subtitle, and optional photo',
  category: 'special',
  minPhotos: 0,
  maxPhotos: 1,
  thumbnail: '/templates/title-page.svg',
  background: '#ffffff',
  slots: [
    {
      id: 'title',
      type: 'text',
      position: { x: 10, y: 15, width: 80, height: 15 },
      required: true,
      placeholder: 'Book Title',
      style: { 
        fontSize: '2xl', 
        textAlign: 'center',
        fontWeight: 'bold'
      }
    },
    {
      id: 'subtitle',
      type: 'text',
      position: { x: 15, y: 32, width: 70, height: 10 },
      required: false,
      placeholder: 'Subtitle or dedication',
      style: { 
        fontSize: 'lg', 
        textAlign: 'center',
        fontWeight: 'normal'
      }
    },
    {
      id: 'photo-1',
      type: 'photo',
      position: { x: 20, y: 45, width: 60, height: 45 },
      required: false,
      style: { objectFit: 'cover', borderRadius: 2 }
    }
  ]
}

export const dedication: LayoutTemplate = {
  id: 'dedication',
  name: 'Dedication',
  description: 'Text-only dedication or message page',
  category: 'special',
  minPhotos: 0,
  maxPhotos: 0,
  thumbnail: '/templates/dedication.svg',
  background: '#faf9f6', // Warm off-white
  slots: [
    {
      id: 'heading',
      type: 'text',
      position: { x: 20, y: 20, width: 60, height: 10 },
      required: false,
      placeholder: 'For You',
      style: { 
        fontSize: 'xl', 
        textAlign: 'center',
        fontWeight: 'medium'
      }
    },
    {
      id: 'message',
      type: 'text',
      position: { x: 10, y: 35, width: 80, height: 50 },
      required: true,
      placeholder: 'Write your heartfelt message here...',
      style: { 
        fontSize: 'md', 
        textAlign: 'center',
        fontWeight: 'normal',
        padding: 5
      }
    },
    {
      id: 'signature',
      type: 'text',
      position: { x: 50, y: 88, width: 40, height: 8 },
      required: false,
      placeholder: 'With love,',
      style: { 
        fontSize: 'md', 
        textAlign: 'right',
        fontWeight: 'normal'
      }
    }
  ]
}

// =============================================================================
// TEMPLATE REGISTRY
// =============================================================================

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  // Single layouts
  fullPhoto,
  photoWithCaption,
  centeredPhoto,
  // Multi-photo layouts
  twoHorizontal,
  twoVertical,
  grid4,
  feature2Small,
  collage3,
  // Special layouts
  qrPage,
  wisdomQuote,
  titlePage,
  dedication,
]

export const TEMPLATES_BY_ID = LAYOUT_TEMPLATES.reduce((acc, template) => {
  acc[template.id] = template
  return acc
}, {} as Record<string, LayoutTemplate>)

export const TEMPLATES_BY_CATEGORY = {
  single: LAYOUT_TEMPLATES.filter(t => t.category === 'single'),
  multi: LAYOUT_TEMPLATES.filter(t => t.category === 'multi'),
  special: LAYOUT_TEMPLATES.filter(t => t.category === 'special'),
}

/**
 * Find templates that can accommodate a specific number of photos
 */
export function findTemplatesForPhotoCount(count: number): LayoutTemplate[] {
  return LAYOUT_TEMPLATES.filter(t => count >= t.minPhotos && count <= t.maxPhotos)
}

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): LayoutTemplate | undefined {
  return TEMPLATES_BY_ID[id]
}

/**
 * Get the photo slots from a template
 */
export function getPhotoSlots(template: LayoutTemplate): LayoutSlot[] {
  return template.slots.filter(slot => slot.type === 'photo')
}

/**
 * Get the text slots from a template
 */
export function getTextSlots(template: LayoutTemplate): LayoutSlot[] {
  return template.slots.filter(slot => slot.type === 'text')
}

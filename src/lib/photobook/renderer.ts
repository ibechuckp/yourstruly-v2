/**
 * Photobook Page Renderer
 * 
 * Renders photobook pages to canvas for preview and export.
 * Works in both browser (Canvas API) and server (node-canvas) environments.
 */

import type { LayoutTemplate, LayoutSlot, SlotPosition } from './templates'

// =============================================================================
// TYPES
// =============================================================================

export interface PageContent {
  /** Content for each slot, keyed by slot ID */
  slots: Record<string, SlotContent>
  /** Optional page-level background override */
  background?: string
}

export interface SlotContent {
  type: 'photo' | 'text' | 'qr'
  /** Photo: URL or data URI. Text: string content. QR: URL to encode */
  value: string
  /** Optional text styling overrides */
  style?: {
    color?: string
    fontFamily?: string
  }
}

export interface RenderOptions {
  /** Output width in pixels */
  width: number
  /** Output height in pixels */
  height: number
  /** Device pixel ratio for high-DPI rendering */
  devicePixelRatio?: number
  /** Whether to render slot borders (for editing) */
  showSlotBorders?: boolean
  /** Border color for empty slots */
  emptySlotColor?: string
  /** Whether to render placeholder text */
  showPlaceholders?: boolean
}

export interface RenderedPage {
  /** Canvas element (browser) or Canvas object (node) */
  canvas: HTMLCanvasElement | OffscreenCanvas
  /** Data URL of the rendered image */
  dataUrl: string
  /** Dimensions used */
  width: number
  height: number
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Convert percentage-based position to pixel coordinates
 */
function percentToPixels(
  position: SlotPosition,
  pageWidth: number,
  pageHeight: number
): { x: number; y: number; width: number; height: number } {
  return {
    x: (position.x / 100) * pageWidth,
    y: (position.y / 100) * pageHeight,
    width: (position.width / 100) * pageWidth,
    height: (position.height / 100) * pageHeight,
  }
}

/**
 * Load an image from URL
 */
async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Get font size in pixels based on slot height and size hint
 */
function getFontSize(
  slotHeight: number,
  sizeHint?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
): number {
  const ratios: Record<string, number> = {
    'sm': 0.12,
    'md': 0.18,
    'lg': 0.25,
    'xl': 0.32,
    '2xl': 0.4,
  }
  const ratio = ratios[sizeHint || 'md'] || 0.18
  return Math.max(12, Math.round(slotHeight * ratio))
}

/**
 * Wrap text to fit within a given width
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const metrics = ctx.measureText(testLine)
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  
  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

// =============================================================================
// SLOT RENDERERS
// =============================================================================

/**
 * Render a photo slot
 */
async function renderPhotoSlot(
  ctx: CanvasRenderingContext2D,
  slot: LayoutSlot,
  content: SlotContent | undefined,
  bounds: { x: number; y: number; width: number; height: number },
  options: RenderOptions
): Promise<void> {
  const { x, y, width, height } = bounds

  if (!content?.value) {
    // Render empty slot placeholder
    if (options.showSlotBorders) {
      ctx.strokeStyle = options.emptySlotColor || '#e0e0e0'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(x, y, width, height)
      ctx.setLineDash([])
      
      // Draw placeholder icon
      ctx.fillStyle = '#d0d0d0'
      ctx.font = `${Math.min(width, height) * 0.3}px system-ui`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('📷', x + width / 2, y + height / 2)
    }
    return
  }

  try {
    const img = await loadImage(content.value)
    const objectFit = slot.style?.objectFit || 'cover'
    
    let sx = 0, sy = 0, sw = img.width, sh = img.height
    let dx = x, dy = y, dw = width, dh = height

    if (objectFit === 'cover') {
      // Calculate crop to cover the slot
      const imgRatio = img.width / img.height
      const slotRatio = width / height

            if (imgRatio > slotRatio) {
        // Image is wider - crop horizontally
        sw = img.height * slotRatio
        sx = (img.width - sw) / 2
      } else {
        // Image is taller - crop vertically
        sh = img.width / slotRatio
        sy = (img.height - sh) / 2
      }
    } else if (objectFit === 'contain') {
      // Calculate fit within slot
      const imgRatio = img.width / img.height
      const slotRatio = width / height

      if (imgRatio > slotRatio) {
        // Image is wider - fit to width
        dh = width / imgRatio
        dy = y + (height - dh) / 2
      } else {
        // Image is taller - fit to height
        dw = height * imgRatio
        dx = x + (width - dw) / 2
      }
    }

    // Apply border radius if specified
    const borderRadius = slot.style?.borderRadius 
      ? (slot.style.borderRadius / 100) * Math.min(width, height)
      : 0

    if (borderRadius > 0) {
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(dx, dy, dw, dh, borderRadius)
      ctx.clip()
    }

    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)

    if (borderRadius > 0) {
      ctx.restore()
    }
  } catch (error) {
    console.error('Failed to load image:', error)
    // Draw error placeholder
    ctx.fillStyle = '#ffebee'
    ctx.fillRect(x, y, width, height)
    ctx.fillStyle = '#ef5350'
    ctx.font = '14px system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('⚠️ Image failed', x + width / 2, y + height / 2)
  }
}

/**
 * Render a text slot
 */
function renderTextSlot(
  ctx: CanvasRenderingContext2D,
  slot: LayoutSlot,
  content: SlotContent | undefined,
  bounds: { x: number; y: number; width: number; height: number },
  options: RenderOptions
): void {
  const { x, y, width, height } = bounds
  const padding = slot.style?.padding ? (slot.style.padding / 100) * width : 0
  
  const innerX = x + padding
  const innerY = y + padding
  const innerWidth = width - padding * 2
  const innerHeight = height - padding * 2

  // Get text content
  let text = content?.value
  if (!text && options.showPlaceholders) {
    text = slot.placeholder || ''
    ctx.globalAlpha = 0.5
  }

  if (!text) {
    if (options.showSlotBorders) {
      ctx.strokeStyle = options.emptySlotColor || '#e0e0e0'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.strokeRect(x, y, width, height)
      ctx.setLineDash([])
    }
    return
  }

  // Set up text styling
  const fontSize = getFontSize(innerHeight, slot.style?.fontSize)
  const fontWeight = slot.style?.fontWeight === 'bold' 
    ? 'bold' 
    : slot.style?.fontWeight === 'medium' 
    ? '500' 
    : 'normal'
  const fontFamily = content?.style?.fontFamily || 'system-ui, -apple-system, sans-serif'
  
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
  ctx.fillStyle = content?.style?.color || '#333333'
  ctx.textAlign = slot.style?.textAlign || 'left'
  ctx.textBaseline = 'top'

  // Wrap text
  const lines = wrapText(ctx, text, innerWidth)
  const lineHeight = fontSize * 1.4
  const totalTextHeight = lines.length * lineHeight

  // Vertical centering
  let textY = innerY + (innerHeight - totalTextHeight) / 2

  // Draw each line
  for (const line of lines) {
    let textX = innerX
    if (ctx.textAlign === 'center') {
      textX = innerX + innerWidth / 2
    } else if (ctx.textAlign === 'right') {
      textX = innerX + innerWidth
    }
    
    ctx.fillText(line, textX, textY)
    textY += lineHeight
  }

  ctx.globalAlpha = 1
}

/**
 * Render a QR code slot
 */
async function renderQRSlot(
  ctx: CanvasRenderingContext2D,
  slot: LayoutSlot,
  content: SlotContent | undefined,
  bounds: { x: number; y: number; width: number; height: number },
  options: RenderOptions
): Promise<void> {
  const { x, y, width, height } = bounds
  const size = Math.min(width, height)
  const centerX = x + (width - size) / 2
  const centerY = y + (height - size) / 2

  if (!content?.value) {
    // Draw placeholder
    if (options.showSlotBorders) {
      ctx.strokeStyle = options.emptySlotColor || '#e0e0e0'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(centerX, centerY, size, size)
      ctx.setLineDash([])
      
      ctx.fillStyle = '#d0d0d0'
      ctx.font = `${size * 0.2}px system-ui`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('QR', centerX + size / 2, centerY + size / 2)
    }
    return
  }

  // Generate QR code using a service or library
  // Using a QR code API for simplicity - in production, use a library like 'qrcode'
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${Math.round(size)}x${Math.round(size)}&data=${encodeURIComponent(content.value)}`
  
  try {
    const img = await loadImage(qrUrl)
    ctx.drawImage(img, centerX, centerY, size, size)
  } catch (error) {
    console.error('Failed to generate QR code:', error)
    ctx.fillStyle = '#ffebee'
    ctx.fillRect(centerX, centerY, size, size)
    ctx.fillStyle = '#ef5350'
    ctx.font = '14px system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('QR Error', centerX + size / 2, centerY + size / 2)
  }
}

// =============================================================================
// MAIN RENDERER
// =============================================================================

/**
 * Render a photobook page to canvas
 */
export async function renderPage(
  template: LayoutTemplate,
  content: PageContent,
  options: RenderOptions
): Promise<RenderedPage> {
  const dpr = options.devicePixelRatio || 1
  const width = options.width
  const height = options.height
  const scaledWidth = width * dpr
  const scaledHeight = height * dpr

  // Create canvas
  const canvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(scaledWidth, scaledHeight)
    : document.createElement('canvas')
  
  if (canvas instanceof HTMLCanvasElement) {
    canvas.width = scaledWidth
    canvas.height = scaledHeight
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
  }

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  if (!ctx) {
    throw new Error('Failed to get 2D context')
  }

  // Scale for DPR
  ctx.scale(dpr, dpr)

  // Draw background
  const background = content.background || template.background || '#ffffff'
  
  if (background.startsWith('linear-gradient')) {
    // Parse gradient (simplified - assumes 2-stop linear gradient)
    const match = background.match(/linear-gradient\((\d+)deg,\s*(.+)\s+\d+%,\s*(.+)\s+\d+%\)/)
    if (match) {
      const angle = parseInt(match[1]) * (Math.PI / 180)
      const color1 = match[2]
      const color2 = match[3]
      
      const x1 = width / 2 - Math.cos(angle) * width
      const y1 = height / 2 - Math.sin(angle) * height
      const x2 = width / 2 + Math.cos(angle) * width
      const y2 = height / 2 + Math.sin(angle) * height
      
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
      gradient.addColorStop(0, color1)
      gradient.addColorStop(1, color2)
      ctx.fillStyle = gradient
    } else {
      ctx.fillStyle = '#ffffff'
    }
  } else {
    ctx.fillStyle = background
  }
  
  ctx.fillRect(0, 0, width, height)

  // Render each slot
  for (const slot of template.slots) {
    const bounds = percentToPixels(slot.position, width, height)
    const slotContent = content.slots[slot.id]

    switch (slot.type) {
      case 'photo':
        await renderPhotoSlot(ctx, slot, slotContent, bounds, options)
        break
      case 'text':
        renderTextSlot(ctx, slot, slotContent, bounds, options)
        break
      case 'qr':
        await renderQRSlot(ctx, slot, slotContent, bounds, options)
        break
    }
  }

  // Generate data URL
  let dataUrl: string
  if (canvas instanceof OffscreenCanvas) {
    const blob = await canvas.convertToBlob({ type: 'image/png' })
    dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } else {
    dataUrl = canvas.toDataURL('image/png')
  }

  return {
    canvas: canvas as HTMLCanvasElement | OffscreenCanvas,
    dataUrl,
    width,
    height,
  }
}

/**
 * Render a page thumbnail (smaller preview)
 */
export async function renderThumbnail(
  template: LayoutTemplate,
  content: PageContent,
  maxSize: number = 200
): Promise<RenderedPage> {
  // Assume 3:4 aspect ratio for book pages
  const aspectRatio = 3 / 4
  const width = maxSize * aspectRatio
  const height = maxSize

  return renderPage(template, content, {
    width,
    height,
    showSlotBorders: true,
    showPlaceholders: true,
    emptySlotColor: '#e0e0e0',
  })
}

/**
 * Render a high-quality export page
 */
export async function renderExport(
  template: LayoutTemplate,
  content: PageContent,
  dpi: number = 300
): Promise<RenderedPage> {
  // Standard photobook page size: 8x10 inches
  const widthInches = 8
  const heightInches = 10
  
  return renderPage(template, content, {
    width: widthInches * dpi,
    height: heightInches * dpi,
    devicePixelRatio: 1,
    showSlotBorders: false,
    showPlaceholders: false,
  })
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Create empty content for a template
 */
export function createEmptyContent(template: LayoutTemplate): PageContent {
  const slots: Record<string, SlotContent> = {}
  
  for (const slot of template.slots) {
    if (slot.placeholder && slot.type === 'text') {
      slots[slot.id] = {
        type: 'text',
        value: '',
      }
    }
  }

  return { slots }
}

/**
 * Validate that content meets template requirements
 */
export function validateContent(
  template: LayoutTemplate,
  content: PageContent
): { valid: boolean; missing: string[] } {
  const missing: string[] = []

  for (const slot of template.slots) {
    if (slot.required) {
      const slotContent = content.slots[slot.id]
      if (!slotContent?.value) {
        missing.push(slot.id)
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

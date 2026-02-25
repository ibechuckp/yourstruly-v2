/**
 * Types for QR-Linked Photobook feature
 */

export interface PhotobookProject {
  id: string
  user_id: string
  title: string
  description?: string
  status: 'draft' | 'published' | 'ordered' | 'delivered'
  cover_image_url?: string
  cover_memory_id?: string
  page_count: number
  prodigi_order_id?: string
  prodigi_status?: string
  tracking_number?: string
  print_config: PhotobookPrintConfig
  delivery_address?: Record<string, any>
  estimated_price?: number
  final_price?: number
  created_at: string
  updated_at: string
  ordered_at?: string
  delivered_at?: string
}

export interface PhotobookPrintConfig {
  size: '6x6' | '8x8' | '10x10' | '8x11' | '11x8' | '12x12'
  paper: 'matte' | 'glossy' | 'premium'
  binding: 'softcover' | 'hardcover' | 'layflat'
  copies: number
}

export interface PhotobookPage {
  id: string
  project_id: string
  page_number: number
  page_type: 'cover' | 'content' | 'back_cover'
  layout_type: PhotobookLayoutType
  content_json: PageContent
  linked_memory_id?: string
  linked_wisdom_id?: string
  qr_token_id?: string
  created_at: string
  updated_at: string
}

export type PhotobookLayoutType = 
  | 'single'           // One photo full page
  | 'double'           // Two photos side by side
  | 'triple'           // Three photos
  | 'quad'             // Four photo grid
  | 'with_text'        // Photo(s) with text area
  | 'full_bleed'       // Photo bleeds to edges
  | 'full-bleed'       // Alias with dash
  | 'qr_only'          // QR code centered (for linking)
  | 'qr_with_photo'    // Photo with QR code overlay
  | 'text_only'        // Text/dedication page
  // Extended layout types for PageEditor
  | 'two-horizontal'   // Two photos stacked horizontally
  | 'two-vertical'     // Two photos side by side
  | 'three-top-heavy'  // One large top, two small bottom
  | 'three-bottom-heavy' // Two small top, one large bottom
  | 'grid-2x2'         // 2x2 grid
  | 'collage-5'        // 5 photo collage
  | 'hero-left'        // Large left, small stacked right
  | 'hero-right'       // Small stacked left, large right
  | 'text-left'        // Text left, photo right
  | 'text-bottom'      // Photo top, text bottom

export interface PageContent {
  photos?: PagePhoto[]
  text?: PageText
  qr_code?: QRCodeConfig
  background?: PageBackground
}

export interface PagePhoto {
  memory_id: string
  media_id: string
  file_url: string
  file_type?: string
  width?: number
  height?: number
  position?: number  // slot index
  crop?: {
    x: number
    y: number
    width: number
    height: number
  }
  scale?: number
  rotation?: number
}

export interface PageText {
  content?: string
  title?: string
  body?: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  font?: 'serif' | 'sans' | 'handwriting'
  fontSize?: 'small' | 'medium' | 'large'
  color?: string
  alignment?: 'left' | 'center' | 'right'
}

export interface QRCodeConfig {
  token: string
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  size: 'small' | 'medium' | 'large'
  style?: 'classic' | 'rounded' | 'dots'
}

export interface PageBackground {
  color?: string
  image_url?: string
  gradient?: string
}

export interface QRAccessToken {
  id: string
  memory_id?: string
  wisdom_id?: string
  photobook_page_id?: string
  token: string
  created_by_user_id: string
  allowed_contact_ids: string[]
  allowed_user_ids: string[]
  is_public: boolean
  view_count: number
  max_views?: number
  expires_at?: string
  is_active: boolean
  revoked_at?: string
  revoked_reason?: string
  created_at: string
  updated_at: string
}

export interface PhotobookMemorySelection {
  id: string
  project_id: string
  memory_id: string
  selected_at: string
  sort_order: number
  qr_token_id?: string
  memory?: {
    id: string
    title: string
    description?: string
    memory_date?: string
    memory_media?: {
      id: string
      file_url: string
      file_type: string
      is_cover: boolean
    }[]
  }
}

export interface LayoutTemplate {
  id: string
  name: string
  photoSlots: number
  hasTextArea: boolean
}

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  { id: 'single', name: 'Single Photo', photoSlots: 1, hasTextArea: false },
  { id: 'two-horizontal', name: 'Two Horizontal', photoSlots: 2, hasTextArea: false },
  { id: 'two-vertical', name: 'Two Vertical', photoSlots: 2, hasTextArea: false },
  { id: 'three-top-heavy', name: 'Hero Top', photoSlots: 3, hasTextArea: false },
  { id: 'three-bottom-heavy', name: 'Hero Bottom', photoSlots: 3, hasTextArea: false },
  { id: 'grid-2x2', name: 'Grid 2x2', photoSlots: 4, hasTextArea: false },
  { id: 'collage-5', name: 'Collage', photoSlots: 5, hasTextArea: false },
  { id: 'hero-left', name: 'Hero Left', photoSlots: 3, hasTextArea: false },
  { id: 'hero-right', name: 'Hero Right', photoSlots: 3, hasTextArea: false },
  { id: 'full-bleed', name: 'Full Bleed', photoSlots: 1, hasTextArea: false },
  { id: 'text-left', name: 'Text Left', photoSlots: 1, hasTextArea: true },
  { id: 'text-bottom', name: 'Text Bottom', photoSlots: 1, hasTextArea: true },
]

// Prodigi configuration
export interface ProdigiConfig {
  sku: string
  title: string
  description: string
  attributes: {
    size?: string
    paperType?: string
    binding?: string
  }
  pages: {
    fileUrl: string
    type: 'cover' | 'content'
  }[]
  shippingAddress: {
    name: string
    addressLine1: string
    addressLine2?: string
    city: string
    state?: string
    postalCode: string
    country: string
  }
}

export const PRODIGI_PHOTOBOOK_SKUS: Record<string, { name: string; sku: string; basePrice: number }> = {
  '8x8_hardcover': { name: '8x8 Hardcover', sku: 'PHOTOBOOK-8X8-HC', basePrice: 24.99 },
  '8x8_softcover': { name: '8x8 Softcover', sku: 'PHOTOBOOK-8X8-SC', basePrice: 19.99 },
  '10x10_hardcover': { name: '10x10 Hardcover', sku: 'PHOTOBOOK-10X10-HC', basePrice: 34.99 },
  '11x8_hardcover': { name: '11x8 Landscape Hardcover', sku: 'PHOTOBOOK-11X8-HC', basePrice: 29.99 },
  '12x12_hardcover': { name: '12x12 Hardcover', sku: 'PHOTOBOOK-12X12-HC', basePrice: 44.99 },
}

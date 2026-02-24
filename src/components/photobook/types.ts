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
  | 'qr_only'          // QR code centered (for linking)
  | 'qr_with_photo'    // Photo with QR code overlay
  | 'text_only'        // Text/dedication page

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
  crop?: {
    x: number
    y: number
    width: number
    height: number
  }
  position?: {
    x: number
    y: number
  }
  scale?: number
  rotation?: number
}

export interface PageText {
  title?: string
  body?: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
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
  type: PhotobookLayoutType
  icon: string
  description: string
  preview: string
  maxPhotos: number
  supportsText: boolean
  supportsQR: boolean
}

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    id: 'single',
    name: 'Single Photo',
    type: 'single',
    icon: 'Square',
    description: 'One photo fills the entire page',
    preview: 'single.svg',
    maxPhotos: 1,
    supportsText: false,
    supportsQR: true
  },
  {
    id: 'double',
    name: 'Double Photo',
    type: 'double',
    icon: 'Columns',
    description: 'Two photos side by side',
    preview: 'double.svg',
    maxPhotos: 2,
    supportsText: false,
    supportsQR: true
  },
  {
    id: 'triple',
    name: 'Triple Photo',
    type: 'triple',
    icon: 'LayoutGrid',
    description: 'Three photos in a grid',
    preview: 'triple.svg',
    maxPhotos: 3,
    supportsText: false,
    supportsQR: true
  },
  {
    id: 'quad',
    name: 'Quad Grid',
    type: 'quad',
    icon: 'LayoutGrid',
    description: 'Four photos in a 2x2 grid',
    preview: 'quad.svg',
    maxPhotos: 4,
    supportsText: false,
    supportsQR: true
  },
  {
    id: 'with_text',
    name: 'Photo with Text',
    type: 'with_text',
    icon: 'Type',
    description: 'Photo with space for caption or story',
    preview: 'with_text.svg',
    maxPhotos: 1,
    supportsText: true,
    supportsQR: true
  },
  {
    id: 'full_bleed',
    name: 'Full Bleed',
    type: 'full_bleed',
    icon: 'Maximize',
    description: 'Photo extends to page edges',
    preview: 'full_bleed.svg',
    maxPhotos: 1,
    supportsText: false,
    supportsQR: false
  },
  {
    id: 'qr_only',
    name: 'QR Code Only',
    type: 'qr_only',
    icon: 'QrCode',
    description: 'Centered QR code with optional text',
    preview: 'qr_only.svg',
    maxPhotos: 0,
    supportsText: true,
    supportsQR: true
  },
  {
    id: 'qr_with_photo',
    name: 'Photo with QR',
    type: 'qr_with_photo',
    icon: 'ImagePlus',
    description: 'Photo with embedded QR code',
    preview: 'qr_with_photo.svg',
    maxPhotos: 1,
    supportsText: false,
    supportsQR: true
  },
  {
    id: 'text_only',
    name: 'Text Only',
    type: 'text_only',
    icon: 'FileText',
    description: 'Dedication or story page',
    preview: 'text_only.svg',
    maxPhotos: 0,
    supportsText: true,
    supportsQR: false
  }
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

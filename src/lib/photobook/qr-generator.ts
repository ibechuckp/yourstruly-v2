import QRCode from 'qrcode'
import { createCanvas, loadImage, type Canvas, type CanvasRenderingContext2D } from 'canvas'

// YoursTruly brand color
const BRAND_GREEN = '#406A56'

// Simple YT heart logo as SVG data URI (scannable QR-friendly size)
const YT_LOGO_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="20" r="18" fill="white" stroke="${BRAND_GREEN}" stroke-width="2"/>
  <path d="M20 32C20 32 8 24 8 16C8 12 11 8 15 8C17.5 8 19.5 9.5 20 11C20.5 9.5 22.5 8 25 8C29 8 32 12 32 16C32 24 20 32 20 32Z" fill="${BRAND_GREEN}"/>
</svg>
`)}`

export interface QRCodeOptions {
  /** QR code size in pixels (default: 200) */
  size?: number
  /** Margin around QR code in modules (default: 2) */
  margin?: number
  /** Foreground color (default: brand green #406A56) */
  color?: string
  /** Background color (default: white) */
  backgroundColor?: string
  /** Include YT logo in center (default: true) */
  includeLogo?: boolean
  /** Error correction level - higher = more redundancy for logo overlay */
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

export interface QRCodeResult {
  /** PNG image as Buffer */
  pngBuffer: Buffer
  /** SVG markup as string */
  svg: string
  /** Data URL for embedding in HTML/img tags */
  dataUrl: string
  /** The URL encoded in the QR code */
  url: string
}

/**
 * Generate QR code for a photobook/memory/wisdom access token
 * Links to: https://yourstruly.love/view/{token}
 */
export async function generateQRCode(
  token: string,
  options: QRCodeOptions = {}
): Promise<QRCodeResult> {
  const {
    size = 200,
    margin = 2,
    color = BRAND_GREEN,
    backgroundColor = '#FFFFFF',
    includeLogo = true,
    errorCorrectionLevel = 'H' // High error correction for logo overlay
  } = options

  const url = `https://yourstruly.love/view/${token}`

  // Generate base SVG (no logo - for clean SVG output)
  const svg = await QRCode.toString(url, {
    type: 'svg',
    width: size,
    margin,
    color: {
      dark: color,
      light: backgroundColor
    },
    errorCorrectionLevel
  })

  // Generate PNG with optional logo overlay
  let pngBuffer: Buffer
  let dataUrl: string

  if (includeLogo) {
    // Generate QR code as canvas data URL first
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: size,
      margin,
      color: {
        dark: color,
        light: backgroundColor
      },
      errorCorrectionLevel
    })

    // Create canvas and add logo overlay
    const canvas = createCanvas(size, size)
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

    // Draw QR code
    const qrImage = await loadImage(qrDataUrl)
    ctx.drawImage(qrImage, 0, 0, size, size)

    // Draw logo in center (keep it small - ~15% of QR size)
    const logoSize = Math.floor(size * 0.15)
    const logoX = (size - logoSize) / 2
    const logoY = (size - logoSize) / 2

    try {
      const logoImage = await loadImage(YT_LOGO_SVG)
      ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize)
    } catch (err) {
      // If logo fails to load, continue without it
      console.warn('Failed to load QR logo:', err)
    }

    pngBuffer = canvas.toBuffer('image/png')
    dataUrl = canvas.toDataURL('image/png')
  } else {
    // No logo - direct generation
    pngBuffer = await QRCode.toBuffer(url, {
      width: size,
      margin,
      color: {
        dark: color,
        light: backgroundColor
      },
      errorCorrectionLevel
    })

    dataUrl = await QRCode.toDataURL(url, {
      width: size,
      margin,
      color: {
        dark: color,
        light: backgroundColor
      },
      errorCorrectionLevel
    })
  }

  return {
    pngBuffer,
    svg,
    dataUrl,
    url
  }
}

/**
 * Generate QR code as PNG buffer only (lightweight)
 */
export async function generateQRCodePNG(
  token: string,
  options: Omit<QRCodeOptions, 'includeLogo'> = {}
): Promise<Buffer> {
  const result = await generateQRCode(token, { ...options, includeLogo: false })
  return result.pngBuffer
}

/**
 * Generate QR code as SVG string only (lightweight, no logo)
 */
export async function generateQRCodeSVG(
  token: string,
  options: Omit<QRCodeOptions, 'includeLogo'> = {}
): Promise<string> {
  const {
    size = 200,
    margin = 2,
    color = BRAND_GREEN,
    backgroundColor = '#FFFFFF',
    errorCorrectionLevel = 'M' // Medium is fine for SVG without logo
  } = options

  const url = `https://yourstruly.love/view/${token}`

  return QRCode.toString(url, {
    type: 'svg',
    width: size,
    margin,
    color: {
      dark: color,
      light: backgroundColor
    },
    errorCorrectionLevel
  })
}

/**
 * Generate QR code as data URL only (for embedding)
 */
export async function generateQRCodeDataURL(
  token: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const result = await generateQRCode(token, options)
  return result.dataUrl
}

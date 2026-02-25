/**
 * Photobook Module
 * 
 * Layout templates and rendering for photobook creation.
 */

// Templates
export type {
  LayoutTemplate,
  LayoutSlot,
  SlotPosition,
} from './templates'

export {
  LAYOUT_TEMPLATES,
  TEMPLATES_BY_ID,
  TEMPLATES_BY_CATEGORY,
  findTemplatesForPhotoCount,
  getTemplateById,
  getPhotoSlots,
  getTextSlots,
  // Individual templates
  fullPhoto,
  photoWithCaption,
  centeredPhoto,
  twoHorizontal,
  twoVertical,
  grid4,
  feature2Small,
  collage3,
  qrPage,
  wisdomQuote,
  titlePage,
  dedication,
} from './templates'

// Renderer
export type {
  PageContent,
  SlotContent,
  RenderOptions,
  RenderedPage,
} from './renderer'

export {
  renderPage,
  renderThumbnail,
  renderExport,
  createEmptyContent,
  validateContent,
} from './renderer'

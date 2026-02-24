/**
 * Dashboard Tile Icon Mapping
 * Line-art style icons for engagement tiles and category labels
 */

// Icon paths (relative to /public)
export const TILE_ICONS = {
  // Content types
  photo_backstory: '/images/icons/camera.png',
  highlight: '/images/icons/camera.png',
  
  // Contact/People related
  tag_person: '/images/icons/teddy-bears.png',
  connect_dots: '/images/icons/children-playing.png',
  contact_info: '/images/icons/teddy-bears.png',
  
  // Questions/Wisdom
  missing_info: '/images/icons/thinking-question.png',
  quick_question: '/images/icons/thinking-question.png',
  knowledge: '/images/icons/writing-hand.png',
  
  // Memory/Stories
  memory_prompt: '/images/icons/notepad-hands.png',
  postscript: '/images/icons/winged-envelope.png',
  
  // Favorites
  favorites_firsts: '/images/icons/heart-hand.png',
  recipes_wisdom: '/images/icons/flowers.png',
} as const;

// Category to icon mapping for tile labels
export const CATEGORY_ICONS = {
  wisdom: '/images/icons/writing-hand.png',
  favorites: '/images/icons/heart-hand.png',
  contact: '/images/icons/teddy-bears.png',
  photo_story: '/images/icons/camera.png',
  memories: '/images/icons/notepad-hands.png',
  messages: '/images/icons/winged-envelope.png',
  media: '/images/icons/clapperboard.png',
} as const;

// Helper to get icon for a tile type
export function getTileIcon(type: string): string {
  return TILE_ICONS[type as keyof typeof TILE_ICONS] || '/images/icons/thinking-question.png';
}

// Helper to get icon for a category
export function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || '/images/icons/thinking-question.png';
}

export type TileType = keyof typeof TILE_ICONS;
export type CategoryType = keyof typeof CATEGORY_ICONS;

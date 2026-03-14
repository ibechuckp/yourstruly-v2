/**
 * Design Tokens - YoursTruly V2
 * Centralized design system tokens for consistency across the app
 * Based on HeroUI theme with purple primary + semantic color roles
 */

export const colors = {
  // Semantic color roles (use these in components, not raw hex)
  primary: {
    50: '#F2EAFA',
    100: '#E4D4F4',
    200: '#C9A9E9',
    300: '#AE7EDE',
    400: '#9353D3',
    500: '#7828C8', // Main brand purple
    600: '#6020A0',
    700: '#481878',
    800: '#301050',
    900: '#180828',
    DEFAULT: '#7828C8',
  },
  
  // Functional colors
  success: {
    light: '#D1FAE5',
    DEFAULT: '#17C964',
    dark: '#10B981',
  },
  warning: {
    light: '#FEF3C7',
    DEFAULT: '#F5A524',
    dark: '#F59E0B',
  },
  error: {
    light: '#FEE2E2',
    DEFAULT: '#F31260',
    dark: '#EF4444',
  },
  info: {
    light: '#DBEAFE',
    DEFAULT: '#006FEE',
    dark: '#3B82F6',
  },
  
  // Prompt type colors (semantic, not raw hex)
  promptTypes: {
    photo: {
      bg: '#FEF3C7', // yellow-100
      text: '#78350F', // yellow-900
      border: '#FCD34D', // yellow-400
    },
    memory: {
      bg: '#F3E8FF', // purple-100
      text: '#581C87', // purple-900
      border: '#C084FC', // purple-400
    },
    wisdom: {
      bg: '#FEE2E2', // red-100
      text: '#7F1D1D', // red-900
      border: '#F87171', // red-400
    },
    contact: {
      bg: '#D1FAE5', // green-100
      text: '#14532D', // green-900
      border: '#34D399', // green-400
    },
    connect: {
      bg: '#DBEAFE', // blue-100
      text: '#1E3A8A', // blue-900
      border: '#60A5FA', // blue-400
    },
  },
  
  // Neutral scale
  neutral: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
  },
  
  // Background & Surface
  background: {
    DEFAULT: '#FFFFFF',
    secondary: '#FAFAFA',
    tertiary: '#F4F4F5',
  },
  
  // Text colors
  text: {
    primary: '#2D2D2D',
    secondary: '#71717A',
    muted: '#A1A1AA',
    inverse: '#FFFFFF',
  },
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
} as const;

export const radius = {
  sm: '8px',
  md: '12px',
  lg: '14px',
  xl: '20px',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 12px rgba(82, 50, 93, 0.08)',
  lg: '0 8px 40px rgba(82, 50, 93, 0.12)',
  xl: '0 12px 48px rgba(82, 50, 93, 0.16)',
} as const;

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// Touch target minimum (44x44pt for iOS, 48x48dp for Android)
export const touchTarget = {
  min: '44px',
  comfortable: '48px',
} as const;

export const breakpoints = {
  sm: '375px',
  md: '768px',
  lg: '1024px',
  xl: '1440px',
} as const;

/**
 * Helper to get prompt type color config
 */
export function getPromptTypeColors(type: string) {
  const typeMap: Record<string, keyof typeof colors.promptTypes> = {
    photo_backstory: 'photo',
    memory_prompt: 'memory',
    knowledge: 'wisdom',
    favorites_firsts: 'wisdom',
    recipes_wisdom: 'wisdom',
    missing_info: 'contact',
    quick_question: 'contact',
    contact_info: 'contact',
    tag_person: 'connect',
    connect_dots: 'connect',
    highlight: 'photo',
    postscript: 'memory',
  };
  
  return colors.promptTypes[typeMap[type] || 'contact'];
}

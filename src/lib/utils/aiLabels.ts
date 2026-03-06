/**
 * AI Labels Utility Functions
 * 
 * The ai_labels field in the database is JSONB and can have multiple formats:
 * 1. Simple array: ["tag1", "tag2"]
 * 2. Structured object: { allTags: ["tag1"], category: "family", ... }
 * 3. null or undefined
 * 
 * These utilities safely extract data regardless of format.
 */

export interface StructuredAiLabels {
  allTags?: string[];
  category?: string;
  labels?: Array<{ name: string; confidence: number }>;
  faces?: unknown[];
  text?: unknown[];
}

export type AiLabelsField = string[] | StructuredAiLabels | null | undefined;

/**
 * Safely extract tags array from ai_labels field
 */
export function getTagsFromAiLabels(aiLabels: AiLabelsField): string[] {
  if (!aiLabels) return [];
  
  // If it's already an array, return it
  if (Array.isArray(aiLabels)) {
    return aiLabels.filter(tag => typeof tag === 'string');
  }
  
  // If it's an object with allTags
  if (typeof aiLabels === 'object' && 'allTags' in aiLabels) {
    return Array.isArray(aiLabels.allTags) 
      ? aiLabels.allTags.filter(tag => typeof tag === 'string')
      : [];
  }
  
  // If it's an object with labels (Rekognition format)
  if (typeof aiLabels === 'object' && 'labels' in aiLabels && Array.isArray(aiLabels.labels)) {
    return aiLabels.labels
      .filter(l => l && typeof l.name === 'string')
      .map(l => l.name);
  }
  
  return [];
}

/**
 * Safely get category from ai_labels
 */
export function getCategoryFromAiLabels(aiLabels: AiLabelsField): string | undefined {
  if (!aiLabels || Array.isArray(aiLabels)) return undefined;
  
  if (typeof aiLabels === 'object' && 'category' in aiLabels) {
    return typeof aiLabels.category === 'string' ? aiLabels.category : undefined;
  }
  
  return undefined;
}

/**
 * Check if search query matches any tag in ai_labels
 */
export function aiLabelsMatchQuery(aiLabels: AiLabelsField, query: string): boolean {
  const tags = getTagsFromAiLabels(aiLabels);
  const q = query.toLowerCase();
  return tags.some(tag => tag.toLowerCase().includes(q));
}

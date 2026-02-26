/**
 * Smart Image Tagging with Gemini Vision
 * 
 * Generates intuitive, searchable tags for images.
 * These tags help users find their memories using natural language search.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface SmartTags {
  // Scene & setting
  scene: string[]      // beach, mountain, city, home, restaurant, park
  setting: string[]    // indoor, outdoor, daytime, nighttime, sunset
  
  // Activities & events
  activities: string[] // birthday, wedding, hiking, dinner, playing
  
  // Objects & subjects
  objects: string[]    // cake, dog, car, flowers, food
  
  // People descriptors (not faces, but context)
  people: string[]     // family, friends, group, couple, solo, children
  
  // Mood & atmosphere
  mood: string[]       // joyful, peaceful, adventurous, nostalgic, celebratory
  
  // Seasons & weather
  weather: string[]    // sunny, rainy, snowy, autumn leaves
  
  // All combined for search
  allTags: string[]
  
  // AI-generated caption (one line)
  caption: string
  
  // Primary category
  category: 'family' | 'travel' | 'celebration' | 'everyday' | 'nature' | 'food' | 'pets' | 'work' | 'sports' | 'art'
}

const TAG_PROMPT = `Analyze this image and generate smart tags that would help someone find this photo later using intuitive search terms.

Return a JSON object with these fields (all arrays except caption and category):
- scene: descriptive locations/settings (beach, kitchen, backyard, mountains, office, cafe, street)
- setting: environmental context (indoor, outdoor, daytime, nighttime, sunset, sunrise, golden hour)
- activities: what's happening (birthday party, hiking, cooking, playing, graduation, working, traveling)
- objects: notable items visible (cake, dog, laptop, christmas tree, car, bicycle, food dish names)
- people: people context without identifying anyone (family gathering, friends, couple, solo portrait, children playing, group photo)
- mood: emotional atmosphere (joyful, peaceful, adventurous, nostalgic, celebratory, cozy, romantic, energetic)
- weather: weather/season if visible (sunny, cloudy, rainy, snowy, autumn, spring blooms, summer)
- caption: one natural sentence describing the photo (e.g., "A family celebrates a birthday with cake in the backyard")
- category: primary category, must be one of: family, travel, celebration, everyday, nature, food, pets, work, sports, art

Guidelines:
- Use lowercase for all tags
- Be specific but also include broader terms (e.g., both "golden retriever" and "dog")
- Include searchable terms people would actually type
- For food, include cuisine type if identifiable (italian, mexican, sushi)
- For locations, include general type (beach, mountain) not specific names
- Keep each array to 3-7 most relevant tags
- The caption should be warm and descriptive, not clinical

Return ONLY valid JSON, no markdown.`

/**
 * Analyze an image and generate smart searchable tags
 */
export async function generateSmartTags(
  imageBuffer: Buffer | Uint8Array,
  mimeType: string = 'image/jpeg'
): Promise<SmartTags> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not set, returning default tags')
    return getDefaultTags()
  }

  try {
    const model = gemini.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      }
    })

    // Convert buffer to base64
    const base64 = Buffer.from(imageBuffer).toString('base64')

    const result = await model.generateContent([
      TAG_PROMPT,
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
    ])

    const text = result.response.text()
    
    // Parse JSON from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No JSON found in Gemini response:', text)
      return getDefaultTags()
    }

    const parsed = JSON.parse(jsonMatch[0])
    
    // Combine all tags for easy searching
    const allTags = [
      ...(parsed.scene || []),
      ...(parsed.setting || []),
      ...(parsed.activities || []),
      ...(parsed.objects || []),
      ...(parsed.people || []),
      ...(parsed.mood || []),
      ...(parsed.weather || []),
    ].map((t: string) => t.toLowerCase().trim())
    
    // Deduplicate
    const uniqueTags = [...new Set(allTags)]

    return {
      scene: (parsed.scene || []).map((t: string) => t.toLowerCase()),
      setting: (parsed.setting || []).map((t: string) => t.toLowerCase()),
      activities: (parsed.activities || []).map((t: string) => t.toLowerCase()),
      objects: (parsed.objects || []).map((t: string) => t.toLowerCase()),
      people: (parsed.people || []).map((t: string) => t.toLowerCase()),
      mood: (parsed.mood || []).map((t: string) => t.toLowerCase()),
      weather: (parsed.weather || []).map((t: string) => t.toLowerCase()),
      allTags: uniqueTags,
      caption: parsed.caption || 'A captured moment',
      category: validateCategory(parsed.category),
    }
  } catch (error) {
    console.error('Smart tag generation failed:', error)
    return getDefaultTags()
  }
}

function validateCategory(category: string): SmartTags['category'] {
  const validCategories: SmartTags['category'][] = [
    'family', 'travel', 'celebration', 'everyday', 'nature', 'food', 'pets', 'work', 'sports', 'art'
  ]
  const lower = (category || '').toLowerCase()
  return validCategories.includes(lower as SmartTags['category']) 
    ? (lower as SmartTags['category']) 
    : 'everyday'
}

function getDefaultTags(): SmartTags {
  return {
    scene: [],
    setting: [],
    activities: [],
    objects: [],
    people: [],
    mood: [],
    weather: [],
    allTags: [],
    caption: 'A captured moment',
    category: 'everyday',
  }
}

/**
 * Process multiple images efficiently (batch with concurrency limit)
 */
export async function generateSmartTagsBatch(
  images: Array<{ id: string; buffer: Buffer | Uint8Array; mimeType: string }>,
  concurrency = 3
): Promise<Map<string, SmartTags>> {
  const results = new Map<string, SmartTags>()
  
  // Process in batches to avoid rate limits
  for (let i = 0; i < images.length; i += concurrency) {
    const batch = images.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map(async (img) => {
        const tags = await generateSmartTags(img.buffer, img.mimeType)
        return { id: img.id, tags }
      })
    )
    
    for (const { id, tags } of batchResults) {
      results.set(id, tags)
    }
    
    // Small delay between batches to be nice to the API
    if (i + concurrency < images.length) {
      await new Promise(r => setTimeout(r, 200))
    }
  }
  
  return results
}

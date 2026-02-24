import { NextRequest, NextResponse } from 'next/server';
import { 
  getFeaturedProducts,
  type ProductProvider,
} from '@/lib/marketplace';
import { type GiftSelectionContext } from '@/types/marketplace';

/**
 * POST /api/marketplace/suggestions
 * Get AI-powered gift suggestions based on context
 * 
 * Request body:
 * {
 *   context: {
 *     eventType?: string;
 *     budget?: { min: number; max: number };
 *     relationship?: string;
 *     contactId?: string;
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { context } = body;

    if (!context) {
      return NextResponse.json(
        { error: 'Context is required' },
        { status: 400 }
      );
    }

    // Get featured products from all enabled providers
    const featuredProducts = await getFeaturedProducts(20);
    
    // Score and rank products based on context
    const scoredProducts = scoreProductsForContext(featuredProducts, context);
    
    // Return top suggestions with reasons
    const suggestions = scoredProducts
      .filter(s => s.score > 0.3) // Only return products with decent match
      .slice(0, 6);

    return NextResponse.json({
      suggestions: suggestions.map(s => ({
        ...s.product,
        suggestionReason: s.reason,
        matchScore: s.score,
      })),
      context,
    });

  } catch (error) {
    console.error('Gift suggestions API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

interface ScoredProduct {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    provider: string;
    category?: string;
    thumbnail: string;
    tags?: string[];
  };
  score: number;
  reason: string;
}

/**
 * Score products based on gift selection context
 */
function scoreProductsForContext(
  featuredProducts: { provider: ProductProvider; products: any[] }[],
  context: GiftSelectionContext
): ScoredProduct[] {
  const scored: ScoredProduct[] = [];
  
  const eventType = context.eventType?.toLowerCase() || '';
  const relationship = context.relationship?.toLowerCase() || '';
  const budgetMin = context.budget?.min || 0;
  const budgetMax = context.budget?.max || Infinity;

  // Provider preferences based on event type
  const providerPreferences: Record<string, ProductProvider[]> = {
    'birthday': ['spocket', 'floristone', 'prodigi'],
    'anniversary': ['floristone', 'prodigi', 'spocket'],
    'sympathy': ['floristone', 'prodigi'],
    'get-well': ['floristone', 'spocket'],
    'congratulations': ['floristone', 'spocket', 'prodigi'],
    'love': ['floristone', 'prodigi', 'spocket'],
    'thank-you': ['floristone', 'spocket'],
    'new-baby': ['spocket', 'prodigi'],
    'wedding': ['floristone', 'prodigi', 'spocket'],
    'graduation': ['spocket', 'prodigi'],
    'housewarming': ['spocket', 'prodigi'],
  };

  const preferredProviders = providerPreferences[eventType] || ['floristone', 'spocket', 'prodigi'];

  // Keywords for different occasions
  const occasionKeywords: Record<string, string[]> = {
    'birthday': ['birthday', 'celebration', 'party', 'gift', 'special', 'fun'],
    'anniversary': ['anniversary', 'romance', 'love', 'elegant', 'classic'],
    'sympathy': ['sympathy', 'funeral', 'memorial', 'white', 'peaceful', 'comfort'],
    'get-well': ['get well', 'recovery', 'cheerful', 'bright', 'comfort'],
    'congratulations': ['congratulations', 'success', 'achievement', 'celebration'],
    'love': ['love', 'romance', 'rose', 'heart', 'passion', 'sweet'],
    'thank-you': ['thank you', 'gratitude', 'appreciation', 'thoughtful'],
    'new-baby': ['baby', 'newborn', 'nursery', 'soft', 'cute', 'toy'],
    'wedding': ['wedding', 'bridal', 'elegant', 'white', 'romance'],
    'graduation': ['graduation', 'achievement', 'success', 'future', 'inspirational'],
    'housewarming': ['home', 'decor', 'housewarming', 'kitchen', 'cozy'],
  };

  // Relationship adjustments
  const relationshipBoosts: Record<string, { providers?: ProductProvider[]; keywords?: string[] }> = {
    'spouse': { providers: ['floristone', 'prodigi'], keywords: ['romance', 'love', 'anniversary'] },
    'partner': { providers: ['floristone', 'prodigi'], keywords: ['romance', 'love'] },
    'parent': { providers: ['floristone', 'prodigi'], keywords: ['classic', 'elegant'] },
    'mother': { providers: ['floristone'], keywords: ['mom', 'mother', 'love'] },
    'father': { providers: ['spocket', 'prodigi'], keywords: ['dad', 'father'] },
    'child': { providers: ['spocket', 'prodigi'], keywords: ['fun', 'colorful'] },
    'friend': { providers: ['spocket', 'floristone'], keywords: ['fun', 'thoughtful'] },
    'colleague': { providers: ['spocket', 'floristone'], keywords: ['professional', 'classic'] },
    'sibling': { providers: ['spocket', 'floristone'], keywords: ['fun', 'personal'] },
  };

  const keywords = occasionKeywords[eventType] || [];
  const relationshipBoost = relationshipBoosts[relationship] || {};

  for (const { provider, products } of featuredProducts) {
    // Provider score based on preference order
    const providerScore = preferredProviders.indexOf(provider);
    const providerWeight = providerScore >= 0 ? 1 - (providerScore * 0.15) : 0.5;
    
    // Relationship provider boost
    let relationshipProviderBoost = 1;
    if (relationshipBoost.providers?.includes(provider)) {
      relationshipProviderBoost = 1.3;
    }

    for (const product of products) {
      let score = 0;
      const reasons: string[] = [];

      // Budget match (highest weight)
      if (product.price >= budgetMin && product.price <= budgetMax) {
        score += 0.4;
        reasons.push('Within your budget');
      } else if (product.price <= budgetMax * 1.2) {
        score += 0.2; // Slightly over budget but close
        reasons.push('Slightly above budget but worth it');
      }

      // Provider preference
      score += providerWeight * 0.2 * relationshipProviderBoost;
      if (relationshipProviderBoost > 1) {
        reasons.push(`Perfect for ${relationship}`);
      }

      // Keyword matching in name and description
      const text = `${product.name} ${product.description}`.toLowerCase();
      let keywordMatches = 0;
      
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          keywordMatches++;
        }
      }
      
      // Relationship keyword boost
      if (relationshipBoost.keywords) {
        for (const keyword of relationshipBoost.keywords) {
          if (text.includes(keyword.toLowerCase())) {
            keywordMatches += 2; // Higher weight for relationship keywords
          }
        }
      }

      const keywordScore = Math.min(keywordMatches / Math.max(keywords.length * 0.5, 1), 1) * 0.25;
      score += keywordScore;
      
      if (keywordMatches > 0) {
        reasons.push('Great match for the occasion');
      }

      // Tag matching
      if (product.tags) {
        const tagMatches = product.tags.filter((tag: string) => 
          keywords.some(k => tag.toLowerCase().includes(k.toLowerCase()))
        ).length;
        score += Math.min(tagMatches * 0.05, 0.1);
      }

      // Event-specific provider recommendations
      if (eventType === 'sympathy' && provider === 'floristone') {
        score += 0.15;
        reasons.push('Traditional choice for sympathy');
      }
      
      if (eventType === 'new-baby' && provider === 'spocket') {
        score += 0.1;
        reasons.push('Curated baby gifts');
      }

      // Select the best reason
      const primaryReason = reasons[0] || 
        (score > 0.5 ? 'Popular choice for this occasion' : 'Consider this option');

      scored.push({
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          provider,
          category: product.category,
          thumbnail: product.thumbnail,
          tags: product.tags,
        },
        score: Math.min(score, 1),
        reason: primaryReason,
      });
    }
  }

  // Sort by score descending
  return scored.sort((a, b) => b.score - a.score);
}

/**
 * GET /api/marketplace/suggestions
 * Returns simple suggestions based on event type query param
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventType = searchParams.get('eventType') || '';
    const budgetMin = parseInt(searchParams.get('budgetMin') || '0');
    const budgetMax = parseInt(searchParams.get('budgetMax') || '500');
    const relationship = searchParams.get('relationship') || '';

    const context: GiftSelectionContext = {
      eventType,
      budget: { min: budgetMin, max: budgetMax },
      relationship,
    };

    // Get featured products
    const featuredProducts = await getFeaturedProducts(20);
    
    // Score and rank
    const scoredProducts = scoreProductsForContext(featuredProducts, context);
    
    const suggestions = scoredProducts
      .filter(s => s.score > 0.3)
      .slice(0, 6);

    return NextResponse.json({
      suggestions: suggestions.map(s => ({
        ...s.product,
        suggestionReason: s.reason,
        matchScore: s.score,
      })),
      context,
    });

  } catch (error) {
    console.error('Gift suggestions API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

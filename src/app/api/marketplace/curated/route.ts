import { NextRequest, NextResponse } from 'next/server';
import { CURATED_CATALOG, CURATED_CATEGORIES, getProductsByCollection, getProductsByCategory, getProductsByOccasion, getStaffPicks, type CuratedProduct } from '@/lib/marketplace/curated-catalog';

/**
 * GET /api/marketplace/curated
 * Get curated products from our hand-picked catalog
 * 
 * Query parameters:
 * - provider: 'floristone' | 'prodigi' | 'all' (default: all)
 * - category: Category slug (e.g., 'flowers-occasions')
 * - collection: 'staff-picks' | 'perfect-for-memories' | 'heirloom-quality' | 'thoughtful-gestures'
 * - occasion: Occasion tag (e.g., 'sympathy', 'birthday', 'anniversary')
 * - search: Search term (searches name, description, tags)
 * - page: Page number (default: 1)
 * - perPage: Items per page (default: 50, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse filters
    const provider = searchParams.get('provider') || 'all';
    const category = searchParams.get('category');
    const collection = searchParams.get('collection') as CuratedProduct['collections'][number] | null;
    const occasion = searchParams.get('occasion');
    const search = searchParams.get('search')?.toLowerCase();
    
    // Parse pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('perPage') || '50')));
    
    // Start with full catalog
    let products: CuratedProduct[] = [...CURATED_CATALOG];
    
    // Filter by provider
    if (provider !== 'all') {
      products = products.filter(p => p.provider === provider);
    }
    
    // Filter by category
    if (category) {
      products = products.filter(p => p.category === category);
    }
    
    // Filter by collection
    if (collection) {
      products = getProductsByCollection(collection);
      if (provider !== 'all') {
        products = products.filter(p => p.provider === provider);
      }
    }
    
    // Filter by occasion
    if (occasion) {
      products = products.filter(p => p.occasions.includes(occasion));
    }
    
    // Search filter
    if (search) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search) ||
        p.occasions.some(o => o.includes(search)) ||
        p.whyWeLoveIt.toLowerCase().includes(search)
      );
    }
    
    // Sort by curated score (highest first)
    products.sort((a, b) => b.curatedScore - a.curatedScore);
    
    // Calculate pagination
    const total = products.length;
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedProducts = products.slice(start, end);
    
    return NextResponse.json({
      products: paginatedProducts,
      total,
      page,
      perPage,
      hasMore: end < total,
      categories: CURATED_CATEGORIES,
    });
    
  } catch (error) {
    console.error('Curated products API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

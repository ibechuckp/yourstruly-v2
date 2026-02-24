import { NextRequest, NextResponse } from 'next/server';
import { 
  MarketplaceService, 
  isValidProvider, 
  type ProductProvider,
  getFeaturedProducts,
} from '@/lib/marketplace';

/**
 * GET /api/marketplace/products
 * Get products from a marketplace provider
 * 
 * Query parameters:
 * - provider: 'floristone' | 'spocket' | 'prodigi'
 * - category: Category ID (provider-specific)
 * - search: Search term (Floristone & Spocket)
 * - tag: Tag for Spocket (optional)
 * - page: Page number (default: 1)
 * - perPage: Items per page (default: 50, max: 100)
 * - featured: If true, returns featured products from all providers
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Check if featured products requested
    const featured = searchParams.get('featured') === 'true';
    if (featured) {
      const perProvider = parseInt(searchParams.get('perProvider') || '10');
      const featuredProducts = await getFeaturedProducts(perProvider);
      return NextResponse.json({ featured: featuredProducts });
    }
    
    // Validate provider
    const providerParam = searchParams.get('provider');
    if (!providerParam) {
      return NextResponse.json(
        { error: 'Provider parameter is required' },
        { status: 400 }
      );
    }
    
    if (!isValidProvider(providerParam)) {
      return NextResponse.json(
        { error: `Invalid provider: ${providerParam}. Must be floristone, spocket, or prodigi.` },
        { status: 400 }
      );
    }
    
    const provider = providerParam as ProductProvider;
    
    // Check if provider is configured
    if (!process.env[`${provider.toUpperCase()}_API_KEY`] && 
        !process.env[`${provider.toUpperCase()}_APP_KEY`]) {
      return NextResponse.json(
        { error: `Provider ${provider} is not configured` },
        { status: 503 }
      );
    }
    
    // Parse pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('perPage') || '50')));
    
    // Parse filters
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const tag = searchParams.get('tag') || undefined;
    
    // Initialize service
    const service = new MarketplaceService(provider);
    
    // Get products
    const result = await service.getProducts(
      category,
      search,
      tag,
      page,
      perPage
    );
    
    return NextResponse.json({
      provider,
      ...result,
    });
    
  } catch (error) {
    console.error('Marketplace products API error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not configured')) {
        return NextResponse.json(
          { error: 'Service not configured', message: error.message },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

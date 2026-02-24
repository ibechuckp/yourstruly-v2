import { NextRequest, NextResponse } from 'next/server';
import { 
  MarketplaceService, 
  isValidProvider, 
  type ProductProvider,
  getAllCategories,
} from '@/lib/marketplace';

/**
 * GET /api/marketplace/categories
 * Get categories from marketplace providers
 * 
 * Query parameters:
 * - provider: 'floristone' | 'spocket' | 'prodigi' (optional, if not provided returns all)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerParam = searchParams.get('provider');
    
    // If no provider specified, return categories from all providers
    if (!providerParam) {
      const allCategories = await getAllCategories();
      return NextResponse.json({ categories: allCategories });
    }
    
    // Validate provider
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
    
    // Initialize service and get categories
    const service = new MarketplaceService(provider);
    const categories = await service.getCategories();
    
    return NextResponse.json({
      provider,
      categories,
    });
    
  } catch (error) {
    console.error('Marketplace categories API error:', error);
    
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

import { NextRequest, NextResponse } from 'next/server';
import { 
  MarketplaceService, 
  isValidProvider, 
  type ProductProvider,
} from '@/lib/marketplace';

/**
 * GET /api/marketplace/products/[id]
 * Get details for a specific product
 * 
 * Query parameters:
 * - provider: 'floristone' | 'spocket' | 'prodigi' (required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    
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
    
    // Initialize service
    const service = new MarketplaceService(provider);
    
    // Get product details
    const product = await service.getProductDetails(id);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      provider,
      product,
    });
    
  } catch (error) {
    console.error('Marketplace product details API error:', error);
    
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

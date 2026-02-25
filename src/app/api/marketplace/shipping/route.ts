import { NextRequest, NextResponse } from 'next/server';
import { 
  MarketplaceService, 
  isValidProvider, 
  type ProductProvider,
  type ShippingItem,
  type ShippingAddress,
} from '@/lib/marketplace';

/**
 * POST /api/marketplace/shipping
 * Calculate shipping rates for items from a provider
 * 
 * Request body:
 * {
 *   provider: 'floristone' | 'spocket' | 'prodigi',
 *   items: [
 *     {
 *       productId: string,
 *       variantId?: string,
 *       quantity: number
 *     }
 *   ],
 *   address: {
 *     name: string,
 *     address1: string,
 *     address2?: string,
 *     city: string,
 *     state: string,
 *     stateCode: string,
 *     zip: string,
 *     country: string,
 *     countryCode: string,
 *     phone?: string,
 *     email?: string
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider: providerParam, items, address } = body;
    
    // Validate provider
    if (!providerParam) {
      return NextResponse.json(
        { error: 'Provider is required' },
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
    
    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required and must not be empty' },
        { status: 400 }
      );
    }
    
    // Validate each item
    for (const item of items) {
      if (!item.productId) {
        return NextResponse.json(
          { error: 'Each item must have a productId' },
          { status: 400 }
        );
      }
      if (!item.quantity || item.quantity < 1) {
        return NextResponse.json(
          { error: 'Each item must have a valid quantity' },
          { status: 400 }
        );
      }
    }
    
    // Validate address
    if (!address) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      );
    }
    
    const requiredAddressFields = ['name', 'address1', 'city', 'stateCode', 'zip', 'countryCode'];
    const missingFields = requiredAddressFields.filter(field => !address[field as keyof ShippingAddress]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required address fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    const shippingAddress: ShippingAddress = {
      name: address.name,
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      state: address.state || address.stateCode,
      stateCode: address.stateCode,
      zip: address.zip,
      country: address.country || address.countryCode,
      countryCode: address.countryCode,
      phone: address.phone,
      email: address.email,
    };
    
    const shippingItems: ShippingItem[] = items.map((item: { productId: string; variantId?: string; quantity: number }) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
    }));
    
    // Initialize service
    const service = new MarketplaceService(provider);
    
    // Calculate shipping
    const rates = await service.calculateShipping(shippingItems, shippingAddress);
    
    // For Prodigi, also get full order estimate
    let estimate = null;
    if (provider === 'prodigi') {
      estimate = await service.estimateOrder(shippingItems, shippingAddress);
    }
    
    return NextResponse.json({
      provider,
      rates,
      estimate,
      items: shippingItems,
      address: {
        city: shippingAddress.city,
        stateCode: shippingAddress.stateCode,
        zip: shippingAddress.zip,
        countryCode: shippingAddress.countryCode,
      },
    });
    
  } catch (error) {
    console.error('Marketplace shipping API error:', error);
    
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

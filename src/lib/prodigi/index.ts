/**
 * Prodigi API Integration
 * 
 * Print-on-demand service for photobooks and calendars.
 * 
 * Usage:
 * ```ts
 * import { ProdigiClient, SUPPORTED_SKUS } from '@/lib/prodigi';
 * 
 * const client = new ProdigiClient(); // Uses env vars
 * 
 * // Get a quote
 * const quote = await client.createQuote(
 *   [{ sku: SUPPORTED_SKUS.BOOK_HARD_A4, copies: 1, assets: [{ printArea: 'default' }] }],
 *   { countryCode: 'US' }
 * );
 * 
 * // Create an order
 * const order = await client.createOrder(
 *   [client.createPhotobookItem({
 *     sku: SUPPORTED_SKUS.BOOK_HARD_A4,
 *     coverImageUrl: 'https://...',
 *     pdfUrl: 'https://...',
 *     pageCount: 24,
 *   })],
 *   {
 *     name: 'John Doe',
 *     address: {
 *       line1: '123 Main St',
 *       townOrCity: 'New York',
 *       stateOrCounty: 'NY',
 *       postalOrZipCode: '10001',
 *       countryCode: 'US',
 *     },
 *   }
 * );
 * ```
 */

export {
  // Client
  ProdigiClient,
  getProdigiClient,
  
  // Constants
  SUPPORTED_SKUS,
  
  // Core types
  type SupportedSku,
  type ProdigiCost,
  type ProdigiAddress,
  type ProdigiRecipient,
  
  // Product types
  type ProdigiProduct,
  type ProdigiProductVariant,
  type ProdigiPrintArea,
  type ProdigiProductDimensions,
  type ProdigiProductsResponse,
  type ProdigiProductDetailsResponse,
  
  // Order types
  type ProdigiOrder,
  type ProdigiOrderItem,
  type ProdigiOrderStatus,
  type ProdigiOrderStatusDetails,
  type ProdigiOrderIssue,
  type ProdigiShipment,
  type ProdigiCharge,
  type ProdigiTracking,
  type ProgidiFulfillmentLocation,
  type ProdigiShippingMethod,
  type ProdigiAsset,
  type ProgidiBranding,
  type ProgidiBrandingAsset,
  type ProdigiOrderResponse,
  type ProdigiOrdersListResponse,
  type ProdigiCancelResponse,
  
  // Quote types
  type ProdigiQuote,
  type ProdigiQuoteItem,
  type ProdigiQuoteShipment,
  type ProdigiQuoteResponse,
  type ProdigiQuoteWithMarkup,
  type ProdigiQuoteResponseWithMarkup,
  
  // Request types
  type CreateOrderRequest,
  type CreateQuoteRequest,
  
  // Error types
  ProdigiError,
  ProdigiValidationError,
  ProdigiAuthenticationError,
  ProdigiNotFoundError,
} from './client';

export { default } from './client';

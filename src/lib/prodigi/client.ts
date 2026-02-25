/**
 * Prodigi API Client for YoursTruly V2
 * 
 * Handles print-on-demand orders for photobooks and calendars.
 * API Documentation: https://www.prodigi.com/print-api/docs/reference/
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const PRODIGI_SANDBOX_URL = 'https://api.sandbox.prodigi.com/v4.0';
const PRODIGI_PRODUCTION_URL = 'https://api.prodigi.com/v4.0';
const MARKUP_PERCENTAGE = 0.30; // 30% markup on base prices

// Supported product SKUs for YoursTruly
export const SUPPORTED_SKUS = {
  // Photobooks
  BOOK_HARD_A4: 'BOOK-HARD-A4',
  BOOK_HARD_A5: 'BOOK-HARD-A5',
  BOOK_SOFT_A4: 'BOOK-SOFT-A4',
  BOOK_LAYFLAT_A4: 'BOOK-LAYFLAT-A4',
  // Calendars
  CALENDAR_WALL_A3: 'CALENDAR-WALL-A3',
  CALENDAR_DESK: 'CALENDAR-DESK',
} as const;

export type SupportedSku = typeof SUPPORTED_SKUS[keyof typeof SUPPORTED_SKUS];

// ============================================================================
// TYPES - Core
// ============================================================================

export interface ProdigiCost {
  amount: string;
  currency: string;
}

export interface ProdigiAddress {
  line1: string;
  line2?: string | null;
  postalOrZipCode: string;
  countryCode: string;
  townOrCity: string;
  stateOrCounty?: string | null;
}

export interface ProdigiRecipient {
  name: string;
  email?: string | null;
  phoneNumber?: string | null;
  address: ProdigiAddress;
}

// ============================================================================
// TYPES - Products
// ============================================================================

export interface ProdigiPrintArea {
  name: string;
  required: boolean;
}

export interface ProdigiProductDimensions {
  width: number;
  height: number;
  units: string;
}

export interface ProdigiProduct {
  sku: string;
  description: string;
  productDimensions?: ProdigiProductDimensions;
  printAreas?: ProdigiPrintArea[];
  attributes?: Record<string, string[]>;
  variants?: ProdigiProductVariant[];
}

export interface ProdigiProductVariant {
  attributes: Record<string, string>;
  shipsTo: string[];
}

export interface ProdigiProductsResponse {
  outcome: string;
  products: ProdigiProduct[];
}

export interface ProdigiProductDetailsResponse {
  outcome: string;
  product: ProdigiProduct;
}

// ============================================================================
// TYPES - Orders
// ============================================================================

export interface ProdigiAsset {
  id?: string;
  printArea: string;
  url: string;
  md5Hash?: string | null;
  pageCount?: number;
  status?: string;
  thumbnailUrl?: string;
}

export interface ProdigiOrderItem {
  id?: string;
  merchantReference?: string;
  sku: string;
  copies: number;
  sizing: 'fillPrintArea' | 'fitPrintArea' | 'stretchToPrintArea';
  attributes?: Record<string, string>;
  assets: ProdigiAsset[];
  recipientCost?: ProdigiCost;
  status?: string;
}

export interface ProdigiOrderStatusDetails {
  downloadAssets: string;
  printReadyAssetsPrepared: string;
  allocateProductionLocation: string;
  inProduction: string;
  shipping: string;
}

export interface ProdigiOrderStatus {
  stage: 'Draft' | 'AwaitingPayment' | 'InProgress' | 'Complete' | 'Cancelled';
  issues: ProdigiOrderIssue[];
  details: ProdigiOrderStatusDetails;
}

export interface ProdigiOrderIssue {
  objectId: string;
  errorCode: string;
  description: string;
  authorizationDetails?: {
    authorisationUrl: string;
  };
}

export interface ProdigiTracking {
  url: string;
  number: string;
}

export interface ProgidiFulfillmentLocation {
  countryCode: string;
  labCode: string;
}

export interface ProdigiShipmentItem {
  itemId: string;
}

export interface ProdigiShipment {
  id: string;
  status: 'Processing' | 'Cancelled' | 'Shipped';
  carrier: {
    name: string;
    service: string;
  };
  dispatchDate?: string;
  items: ProdigiShipmentItem[];
  tracking?: ProdigiTracking;
  fulfillmentLocation?: ProgidiFulfillmentLocation;
}

export interface ProdigiChargeItem {
  id: string;
  shipmentId?: string | null;
  itemId?: string | null;
  cost: ProdigiCost;
}

export interface ProdigiCharge {
  id: string;
  chargeType: 'Item' | 'Shipping' | 'Refund' | 'Other';
  prodigiInvoiceNumber?: string | null;
  totalCost: ProdigiCost;
  items: ProdigiChargeItem[];
}

export interface ProgidiBrandingAsset {
  url: string;
}

export interface ProgidiBranding {
  postcard?: ProgidiBrandingAsset;
  flyer?: ProgidiBrandingAsset;
  packing_slip_bw?: ProgidiBrandingAsset;
  packing_slip_color?: ProgidiBrandingAsset;
  sticker_exterior_round?: ProgidiBrandingAsset;
  sticker_exterior_rectangle?: ProgidiBrandingAsset;
  sticker_interior_round?: ProgidiBrandingAsset;
  sticker_interior_rectangle?: ProgidiBrandingAsset;
}

export interface ProdigiOrder {
  id: string;
  created: string;
  lastUpdated: string;
  callbackUrl?: string | null;
  merchantReference?: string | null;
  shippingMethod: ProdigiShippingMethod;
  idempotencyKey?: string | null;
  status: ProdigiOrderStatus;
  charges: ProdigiCharge[];
  shipments: ProdigiShipment[];
  recipient: ProdigiRecipient;
  branding?: ProgidiBranding;
  items: ProdigiOrderItem[];
  packingSlip?: { url: string; status: string } | null;
  metadata?: Record<string, unknown>;
}

export type ProdigiShippingMethod = 
  | 'Budget' 
  | 'Standard' 
  | 'StandardPlus' 
  | 'Express' 
  | 'Overnight';

export interface ProdigiOrderResponse {
  outcome: 'Created' | 'OnHold' | 'CreatedWithIssues' | 'AlreadyExists' | 'Ok';
  order: ProdigiOrder;
  traceParent?: string;
}

export interface ProdigiOrdersListResponse {
  outcome: string;
  orders: ProdigiOrder[];
  hasMore: boolean;
  nextUrl?: string;
  traceParent?: string;
}

export interface ProdigiCancelResponse {
  outcome: 'Cancelled' | 'FailedToCancel' | 'ActionNotAvailable';
  order: ProdigiOrder;
  traceParent?: string;
}

// ============================================================================
// TYPES - Quotes
// ============================================================================

export interface ProdigiQuoteItem {
  sku: string;
  copies: number;
  attributes?: Record<string, string>;
  assets: { printArea: string }[];
}

export interface ProdigiQuoteShipment {
  carrier: {
    name: string;
    service: string;
  };
  fulfillmentLocation: ProgidiFulfillmentLocation;
  cost: ProdigiCost;
  items: string[];
}

export interface ProdigiQuoteItemResult {
  id: string;
  sku: string;
  copies: number;
  unitCost: ProdigiCost;
  attributes: Record<string, string>;
  assets: { printArea: string }[];
}

export interface ProdigiQuote {
  shipmentMethod: ProdigiShippingMethod;
  costSummary: {
    items: ProdigiCost;
    shipping: ProdigiCost;
  };
  shipments: ProdigiQuoteShipment[];
  items: ProdigiQuoteItemResult[];
}

export interface ProdigiQuoteResponse {
  outcome: string;
  quotes: ProdigiQuote[];
  traceParent?: string;
}

// ============================================================================
// TYPES - Request payloads
// ============================================================================

export interface CreateOrderRequest {
  merchantReference?: string;
  shippingMethod: ProdigiShippingMethod;
  idempotencyKey?: string;
  callbackUrl?: string;
  recipient: ProdigiRecipient;
  branding?: ProgidiBranding;
  items: Omit<ProdigiOrderItem, 'id' | 'status'>[];
  metadata?: Record<string, unknown>;
}

export interface CreateQuoteRequest {
  shippingMethod?: ProdigiShippingMethod;
  destinationCountryCode: string;
  currencyCode: string;
  items: ProdigiQuoteItem[];
}

// ============================================================================
// TYPES - With Markup (Customer-facing prices)
// ============================================================================

export interface ProdigiQuoteWithMarkup extends ProdigiQuote {
  costSummaryWithMarkup: {
    items: ProdigiCost;
    shipping: ProdigiCost;
    total: ProdigiCost;
  };
}

export interface ProdigiQuoteResponseWithMarkup {
  outcome: string;
  quotes: ProdigiQuoteWithMarkup[];
  traceParent?: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class ProdigiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public outcome?: string,
    public traceParent?: string,
    public issues?: ProdigiOrderIssue[]
  ) {
    super(message);
    this.name = 'ProdigiError';
  }
}

export class ProdigiValidationError extends ProdigiError {
  constructor(message: string, issues?: ProdigiOrderIssue[]) {
    super(message, 400, 'ValidationFailed', undefined, issues);
    this.name = 'ProdigiValidationError';
  }
}

export class ProdigiAuthenticationError extends ProdigiError {
  constructor() {
    super('Invalid or missing API key', 401, 'Unauthorized');
    this.name = 'ProdigiAuthenticationError';
  }
}

export class ProdigiNotFoundError extends ProdigiError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 404, 'NotFound');
    this.name = 'ProdigiNotFoundError';
  }
}

// ============================================================================
// CLIENT
// ============================================================================

export class ProdigiClient {
  private apiKey: string;
  private baseUrl: string;
  private sandbox: boolean;

  constructor(options?: { apiKey?: string; sandbox?: boolean }) {
    const apiKey = options?.apiKey ?? process.env.PRODIGI_API_KEY;
    if (!apiKey) {
      throw new Error('PRODIGI_API_KEY is required');
    }
    
    this.apiKey = apiKey;
    this.sandbox = options?.sandbox ?? process.env.PRODIGI_SANDBOX === 'true';
    this.baseUrl = this.sandbox ? PRODIGI_SANDBOX_URL : PRODIGI_PRODUCTION_URL;
  }

  /**
   * Get environment info for debugging
   */
  getEnvironment(): { sandbox: boolean; baseUrl: string } {
    return {
      sandbox: this.sandbox,
      baseUrl: this.baseUrl,
    };
  }

  // ==========================================================================
  // PRODUCTS
  // ==========================================================================

  /**
   * List available products
   * Note: Prodigi doesn't have a direct "list all products" endpoint,
   * so this returns our supported SKUs with their details
   */
  async getProducts(): Promise<ProdigiProduct[]> {
    const products: ProdigiProduct[] = [];
    
    for (const sku of Object.values(SUPPORTED_SKUS)) {
      try {
        const product = await this.getProductDetails(sku);
        products.push(product);
      } catch (error) {
        // Skip products that fail to load (may not be available in current region)
        console.warn(`Failed to load product ${sku}:`, error);
      }
    }
    
    return products;
  }

  /**
   * Get details for a specific product SKU
   */
  async getProductDetails(sku: string): Promise<ProdigiProduct> {
    const response = await this.request<ProdigiProductDetailsResponse>(
      'GET',
      `/products/${encodeURIComponent(sku)}`
    );
    return response.product;
  }

  // ==========================================================================
  // QUOTES
  // ==========================================================================

  /**
   * Get a price quote for items without creating an order
   * Returns quotes for all shipping methods if not specified
   */
  async createQuote(
    items: ProdigiQuoteItem[],
    address: { countryCode: string },
    options?: {
      shippingMethod?: ProdigiShippingMethod;
      currencyCode?: string;
    }
  ): Promise<ProdigiQuoteResponseWithMarkup> {
    const payload: CreateQuoteRequest = {
      destinationCountryCode: address.countryCode,
      currencyCode: options?.currencyCode ?? 'USD',
      items,
    };
    
    if (options?.shippingMethod) {
      payload.shippingMethod = options.shippingMethod;
    }

    const response = await this.request<ProdigiQuoteResponse>(
      'POST',
      '/quotes',
      payload
    );

    // Apply markup to all quotes
    const quotesWithMarkup: ProdigiQuoteWithMarkup[] = response.quotes.map(quote => {
      const itemsWithMarkup = this.applyMarkup(quote.costSummary.items);
      const shippingWithMarkup = this.applyMarkup(quote.costSummary.shipping);
      
      const totalAmount = (
        parseFloat(itemsWithMarkup.amount) + 
        parseFloat(shippingWithMarkup.amount)
      ).toFixed(2);

      return {
        ...quote,
        costSummaryWithMarkup: {
          items: itemsWithMarkup,
          shipping: shippingWithMarkup,
          total: {
            amount: totalAmount,
            currency: itemsWithMarkup.currency,
          },
        },
      };
    });

    return {
      outcome: response.outcome,
      quotes: quotesWithMarkup,
      traceParent: response.traceParent,
    };
  }

  // ==========================================================================
  // ORDERS
  // ==========================================================================

  /**
   * Create a new order
   */
  async createOrder(
    items: Omit<ProdigiOrderItem, 'id' | 'status'>[],
    recipient: ProdigiRecipient,
    options?: {
      shippingMethod?: ProdigiShippingMethod;
      merchantReference?: string;
      idempotencyKey?: string;
      callbackUrl?: string;
      branding?: ProgidiBranding;
      metadata?: Record<string, unknown>;
    }
  ): Promise<ProdigiOrderResponse> {
    const payload: CreateOrderRequest = {
      shippingMethod: options?.shippingMethod ?? 'Standard',
      recipient,
      items,
    };

    if (options?.merchantReference) payload.merchantReference = options.merchantReference;
    if (options?.idempotencyKey) payload.idempotencyKey = options.idempotencyKey;
    if (options?.callbackUrl) payload.callbackUrl = options.callbackUrl;
    if (options?.branding) payload.branding = options.branding;
    if (options?.metadata) payload.metadata = options.metadata;

    const response = await this.request<ProdigiOrderResponse>(
      'POST',
      '/orders',
      payload
    );

    // Check for issues in the response
    if (response.outcome === 'CreatedWithIssues' && response.order.status.issues.length > 0) {
      console.warn('Order created with issues:', response.order.status.issues);
    }

    return response;
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<ProdigiOrder> {
    const response = await this.request<ProdigiOrderResponse>(
      'GET',
      `/orders/${encodeURIComponent(orderId)}`
    );
    return response.order;
  }

  /**
   * Get list of orders with optional filters
   */
  async getOrders(options?: {
    top?: number;
    skip?: number;
    createdFrom?: Date;
    createdTo?: Date;
    status?: 'draft' | 'awaitingPayment' | 'inProgress' | 'complete' | 'cancelled';
    orderIds?: string[];
    merchantReferences?: string[];
  }): Promise<ProdigiOrdersListResponse> {
    const params = new URLSearchParams();
    
    if (options?.top) params.set('top', options.top.toString());
    if (options?.skip) params.set('skip', options.skip.toString());
    if (options?.createdFrom) params.set('createdFrom', options.createdFrom.toISOString());
    if (options?.createdTo) params.set('createdTo', options.createdTo.toISOString());
    if (options?.status) params.set('status', options.status);
    if (options?.orderIds) {
      options.orderIds.forEach(id => params.append('orderIds', id));
    }
    if (options?.merchantReferences) {
      options.merchantReferences.forEach(ref => params.append('merchantReferences', ref));
    }

    const queryString = params.toString();
    const path = queryString ? `/orders?${queryString}` : '/orders';
    
    return this.request<ProdigiOrdersListResponse>('GET', path);
  }

  /**
   * Cancel an order (if still possible)
   */
  async cancelOrder(orderId: string): Promise<ProdigiCancelResponse> {
    return this.request<ProdigiCancelResponse>(
      'POST',
      `/orders/${encodeURIComponent(orderId)}/actions/cancel`
    );
  }

  /**
   * Get available actions for an order
   */
  async getOrderActions(orderId: string): Promise<{
    cancel: { isAvailable: string };
    changeRecipientDetails: { isAvailable: string };
    changeShippingMethod: { isAvailable: string };
    changeMetaData: { isAvailable: string };
  }> {
    return this.request<{
      outcome: string;
      cancel: { isAvailable: string };
      changeRecipientDetails: { isAvailable: string };
      changeShippingMethod: { isAvailable: string };
      changeMetaData: { isAvailable: string };
    }>('GET', `/orders/${encodeURIComponent(orderId)}/actions`);
  }

  /**
   * Update order shipping method
   */
  async updateOrderShipping(
    orderId: string,
    shippingMethod: ProdigiShippingMethod
  ): Promise<ProdigiOrderResponse> {
    return this.request<ProdigiOrderResponse>(
      'POST',
      `/orders/${encodeURIComponent(orderId)}/actions/updateShippingMethod`,
      { shippingMethod }
    );
  }

  /**
   * Update order recipient details
   */
  async updateOrderRecipient(
    orderId: string,
    recipient: ProdigiRecipient
  ): Promise<ProdigiOrderResponse> {
    return this.request<ProdigiOrderResponse>(
      'POST',
      `/orders/${encodeURIComponent(orderId)}/actions/updateRecipient`,
      recipient
    );
  }

  /**
   * Update order metadata
   */
  async updateOrderMetadata(
    orderId: string,
    metadata: Record<string, unknown>
  ): Promise<ProdigiOrderResponse> {
    return this.request<ProdigiOrderResponse>(
      'POST',
      `/orders/${encodeURIComponent(orderId)}/actions/updateMetadata`,
      { metadata }
    );
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Calculate customer price with 30% markup
   */
  applyMarkup(cost: ProdigiCost): ProdigiCost {
    const baseAmount = parseFloat(cost.amount);
    const markedUpAmount = baseAmount * (1 + MARKUP_PERCENTAGE);
    return {
      amount: markedUpAmount.toFixed(2),
      currency: cost.currency,
    };
  }

  /**
   * Create a photobook order item
   */
  createPhotobookItem(options: {
    sku: SupportedSku;
    coverImageUrl: string;
    pdfUrl: string;
    pageCount: number;
    copies?: number;
    merchantReference?: string;
  }): Omit<ProdigiOrderItem, 'id' | 'status'> {
    return {
      sku: options.sku,
      copies: options.copies ?? 1,
      sizing: 'fillPrintArea',
      merchantReference: options.merchantReference,
      assets: [
        {
          printArea: 'cover',
          url: options.coverImageUrl,
        },
        {
          printArea: 'default',
          url: options.pdfUrl,
          pageCount: options.pageCount,
        },
      ],
    };
  }

  /**
   * Create a calendar order item
   */
  createCalendarItem(options: {
    sku: SupportedSku;
    pdfUrl: string;
    copies?: number;
    merchantReference?: string;
  }): Omit<ProdigiOrderItem, 'id' | 'status'> {
    return {
      sku: options.sku,
      copies: options.copies ?? 1,
      sizing: 'fillPrintArea',
      merchantReference: options.merchantReference,
      assets: [
        {
          printArea: 'default',
          url: options.pdfUrl,
        },
      ],
    };
  }

  // ==========================================================================
  // PRIVATE
  // ==========================================================================

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    
    const headers: HeadersInit = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      this.handleErrorResponse(response.status, data);
    }

    return data as T;
  }

  private handleErrorResponse(statusCode: number, data: unknown): never {
    const errorData = data as { 
      outcome?: string; 
      traceParent?: string;
      issues?: ProdigiOrderIssue[];
      message?: string;
    } | null;

    switch (statusCode) {
      case 400:
        throw new ProdigiValidationError(
          errorData?.message ?? 'Validation failed',
          errorData?.issues
        );
      case 401:
        throw new ProdigiAuthenticationError();
      case 404:
        throw new ProdigiNotFoundError('Resource', 'unknown');
      default:
        throw new ProdigiError(
          errorData?.message ?? `API request failed with status ${statusCode}`,
          statusCode,
          errorData?.outcome,
          errorData?.traceParent,
          errorData?.issues
        );
    }
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

// Create a singleton instance using environment variables
let defaultClient: ProdigiClient | null = null;

export function getProdigiClient(): ProdigiClient {
  if (!defaultClient) {
    defaultClient = new ProdigiClient();
  }
  return defaultClient;
}

export default ProdigiClient;

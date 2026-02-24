/**
 * Test script for marketplace provider configuration
 * Run with: npx tsx src/lib/marketplace/test-config.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { Floristone, Prodigi, Spocket } from './providers';

console.log('=== Marketplace Provider Configuration Test ===\n');

console.log('Prodigi:');
console.log('  isConfigured:', Prodigi.isConfigured());
console.log('  API Key exists:', !!process.env.PRODIGI_API_KEY);
console.log('  Sandbox mode:', process.env.PRODIGI_SANDBOX);

console.log('\nSpocket:');
console.log('  isConfigured:', Spocket.isConfigured());
console.log('  API Key exists:', !!process.env.SPOCKET_API_KEY);

console.log('\nFloristone:');
console.log('  isConfigured:', Floristone.isConfigured());
console.log('  API Key exists:', !!process.env.FLORISTONE_API_KEY);
console.log('  API Password exists:', !!process.env.FLORISTONE_API_PASSWORD);

console.log('\n=== End Configuration Test ===');

// Test Prodigi API if configured
async function testProdigi() {
  if (!Prodigi.isConfigured()) {
    console.log('\n⚠️ Prodigi not configured, skipping API test');
    return;
  }

  console.log('\n=== Testing Prodigi API ===');
  try {
    const categories = await Prodigi.getCategories();
    console.log('✅ Categories fetched:', categories.length, 'categories');
    console.log('  Sample:', categories.slice(0, 3).map(c => c.name).join(', '));

    const products = await Prodigi.getProducts(undefined, 1, 5);
    console.log('✅ Products fetched:', products.products.length, 'products');
    console.log('  Total available:', products.total);
    
    if (products.products.length > 0) {
      console.log('  Sample product:', products.products[0].name);
    }
  } catch (error) {
    console.error('❌ Prodigi API error:', error instanceof Error ? error.message : error);
  }
}

// Test Floristone API if configured
async function testFloristone() {
  if (!Floristone.isConfigured()) {
    console.log('\n⚠️ Floristone not configured, skipping API test');
    return;
  }

  console.log('\n=== Testing Floristone API ===');
  try {
    const products = await Floristone.getProducts('bs', undefined, 1, 5);
    console.log('✅ Products fetched:', products.products.length, 'products');
    console.log('  Total available:', products.total);
    
    if (products.products.length > 0) {
      console.log('  Sample product:', products.products[0].name);
    }
  } catch (error) {
    console.error('❌ Floristone API error:', error instanceof Error ? error.message : error);
  }
}

// Run tests
testProdigi().then(() => testFloristone());

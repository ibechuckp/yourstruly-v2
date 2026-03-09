#!/usr/bin/env node
/**
 * sync-goody-products.mjs
 * 
 * Syncs Goody product catalog → Supabase marketplace_products table.
 * 
 * Usage:
 *   node scripts/sync-goody-products.mjs              # Sync first 500 active products
 *   node scripts/sync-goody-products.mjs --all        # Sync full catalog (~5400 products)
 *   node scripts/sync-goody-products.mjs --limit 100  # Sync specific count
 *   node scripts/sync-goody-products.mjs --dry-run    # Preview without writing to DB
 * 
 * Products are upserted by external_id (Goody product ID), so safe to re-run.
 */

import { createClient } from '@supabase/supabase-js';

const GOODY_API_KEY = process.env.GOODY_COMMERCE_API_KEY || 'goody_token_commerce_ibZgiPoB6JOqGVtEnDzGTlKUxRspY7ih_U10YEgWQiMeKUJmtajg5EbH5AY73cqQn';
const GOODY_BASE = 'https://api.ongoody.com';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ffgetlejrwhpwvwtviqm.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZ2V0bGVqcndocHd2d3R2aXFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTU0OTMzNiwiZXhwIjoyMDg3MTI1MzM2fQ.N0T8rpaPAYSXERkv1GO05g_-1iYfgd0FeT_VNODu27w';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SYNC_ALL = args.includes('--all');
const limitIdx = args.indexOf('--limit');
const limitVal = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : null;
const LIMIT = limitVal ? limitVal : SYNC_ALL ? Infinity : 500;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Map Goody brand/product attributes to our occasion tags
function inferOccasions(product) {
  const name = (product.name || '').toLowerCase();
  const desc = (product.subtitle || '').toLowerCase();
  const brand = (product.brand?.name || '').toLowerCase();
  const combined = `${name} ${desc} ${brand}`;

  const occasions = [];

  if (/chocolate|candy|sweet|cookie|cake|dessert|treat|snack|food|coffee|tea|wine|whiskey|bourbon|spa|bath|candle/.test(combined)) {
    occasions.push('birthday', 'thank-you', 'thinking-of-you');
  }
  if (/spa|bath|candle|relax|wellness|yoga|meditation|skin|lotion|scent|aroma/.test(combined)) {
    occasions.push('get-well', 'mothers-day');
  }
  if (/tech|electronic|gadget|speaker|headphone|earbud|charger|cable|bluetooth|device/.test(combined)) {
    occasions.push('birthday', 'graduation', 'fathers-day');
  }
  if (/home|decor|kitchen|pillow|throw|blanket|plant|vase|frame/.test(combined)) {
    occasions.push('new-home', 'wedding', 'housewarming');
  }
  if (/book|journal|notebook|stationery|pen|planner/.test(combined)) {
    occasions.push('birthday', 'graduation', 'new-job');
  }
  if (/coffee|tea/.test(combined)) {
    occasions.push('thank-you', 'new-job', 'fathers-day');
  }
  if (/flower|rose|romantic|love|heart/.test(combined)) {
    occasions.push('anniversary', 'valentines-day', 'love-romance');
  }
  if (/baby|infant|newborn|kid|child|toy/.test(combined)) {
    occasions.push('new-baby', 'birthday');
  }

  // Ensure at least one occasion
  if (occasions.length === 0) {
    occasions.push('birthday', 'thank-you');
  }

  return [...new Set(occasions)];
}

function inferCategory(product) {
  const name = (product.name || '').toLowerCase();
  const desc = (product.subtitle || '').toLowerCase();
  const combined = `${name} ${desc}`;

  if (/food|chocolate|cookie|candy|coffee|tea|wine|snack|gourmet|chocolate|cheese/.test(combined)) return 'food';
  if (/tech|electronic|gadget|speaker|headphone|phone|device|bluetooth|charger/.test(combined)) return 'electronics';
  if (/spa|bath|wellness|skin|lotion|candle|scent|yoga|beauty/.test(combined)) return 'wellness';
  if (/home|decor|pillow|throw|blanket|kitchen|plant|vase|frame|furniture/.test(combined)) return 'home';
  return 'home'; // default
}

async function fetchGoodyProducts(page = 1, perPage = 100) {
  const res = await fetch(`${GOODY_BASE}/v1/products?per_page=${perPage}&page=${page}`, {
    headers: { 'Authorization': `Bearer ${GOODY_API_KEY}` }
  });
  if (!res.ok) throw new Error(`Goody API error ${res.status}`);
  return res.json();
}

function mapToDbRow(product) {
  const images = [];
  
  // Primary images
  if (product.images?.length > 0) {
    for (const img of product.images) {
      if (img.image_large?.url) images.push(img.image_large.url);
    }
  }
  
  // Variant images as fallback
  if (images.length === 0 && product.variants?.length > 0) {
    for (const v of product.variants) {
      if (v.image_large?.url) images.push(v.image_large.url);
    }
  }

  const price = product.price || 0; // already in cents
  let priceRange = 'under50';
  const dollars = price / 100;
  if (dollars >= 200) priceRange = 'over200';
  else if (dollars >= 100) priceRange = '100to200';
  else if (dollars >= 50) priceRange = '50to100';

  return {
    external_id: product.id,
    name: product.name,
    description: product.subtitle || product.subtitle_short || '',
    provider: product.brand?.name || 'goody',
    base_price_cents: price,
    sale_price_cents: null,
    currency: 'USD',
    images: images.slice(0, 8), // cap at 8 images
    in_stock: product.status === 'active',
    is_curated: false,
    is_active: product.status === 'active',
    occasions: inferOccasions(product),
    category_id: inferCategory(product),
    emotional_impact: null,
    why_we_love_it: null,
    curated_score: null,
  };
}

async function run() {
  console.log(`🛍️  Goody → Supabase Product Sync`);
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'} | Limit: ${LIMIT === Infinity ? 'all' : LIMIT}`);
  console.log('');

  let page = 1;
  let totalFetched = 0;
  let totalUpserted = 0;
  let totalErrors = 0;

  // First fetch to get total count
  const first = await fetchGoodyProducts(1, 1);
  const totalAvailable = first.list_meta?.total_count || 0;
  console.log(`📦 Goody catalog: ${totalAvailable} products available`);

  const effectiveLimit = Math.min(LIMIT, totalAvailable);
  console.log(`   Syncing: ${effectiveLimit} products\n`);

  const BATCH_SIZE = 100;

  while (totalFetched < effectiveLimit) {
    const remaining = effectiveLimit - totalFetched;
    const perPage = Math.min(BATCH_SIZE, remaining);

    process.stdout.write(`  Fetching page ${page} (${perPage}/page)... `);
    const data = await fetchGoodyProducts(page, perPage);
    const products = data.data || [];

    if (products.length === 0) break;

    totalFetched += products.length;

    const rows = products.map(mapToDbRow);

    if (!DRY_RUN) {
      // Fetch existing external_ids to determine insert vs update
      const externalIds = rows.map(r => r.external_id);
      const { data: existing } = await supabase
        .from('marketplace_products')
        .select('id, external_id')
        .in('external_id', externalIds);

      const existingIds = new Set((existing || []).map(r => r.external_id));
      const toInsert = rows.filter(r => !existingIds.has(r.external_id));
      const toUpdate = rows.filter(r => existingIds.has(r.external_id));

      let batchErrors = 0;

      if (toInsert.length > 0) {
        const { error } = await supabase.from('marketplace_products').insert(toInsert);
        if (error) { console.log(`\n  ❌ Insert error: ${error.message}`); batchErrors++; }
        else totalUpserted += toInsert.length;
      }

      if (toUpdate.length > 0) {
        // Update in small batches
        for (const row of toUpdate) {
          const { error } = await supabase
            .from('marketplace_products')
            .update(row)
            .eq('external_id', row.external_id);
          if (error) { batchErrors++; }
          else totalUpserted++;
        }
      }

      if (batchErrors > 0) {
        totalErrors += batchErrors;
        console.log(`⚠️  ${rows.length - batchErrors} ok, ${batchErrors} errors (total: ${totalUpserted})`);
      } else {
        console.log(`✅ +${toInsert.length} new, ~${toUpdate.length} updated (total: ${totalUpserted})`);
      }
    } else {
      console.log(`[dry] Would upsert ${rows.length} products`);
      console.log(`  Sample: ${rows[0].name} (${rows[0].provider}) $${(rows[0].base_price_cents/100).toFixed(2)} → occasions: ${rows[0].occasions.join(', ')}`);
    }

    page++;
    if (products.length < perPage) break; // end of catalog
  }

  console.log('');
  console.log(`✨ Sync complete`);
  console.log(`   Fetched: ${totalFetched}`);
  if (!DRY_RUN) {
    console.log(`   Upserted: ${totalUpserted}`);
    console.log(`   Errors: ${totalErrors}`);
  }
}

run().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

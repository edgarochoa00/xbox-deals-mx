import test from 'node:test';
import assert from 'node:assert/strict';
import { extractDeals } from '../scripts/catalog-policy.js';
import { buildCatalog, discoverProducts } from '../scripts/update-deals.js';
import { isActiveDeal, MAX_AGE_MS, priceBreakdown } from '../src/deal-policy.js';

const NOW = Date.parse('2026-09-25T00:00:00Z');
function product() {
  return {
    ProductId: 'BQ1W1T1FC14W', ProductType: 'Game',
    Properties: { XboxConsoleGenOptimized: ['ConsoleGen8'], XboxConsoleGenCompatible: ['ConsoleGen8', 'ConsoleGen9'] },
    LocalizedProperties: [{ ProductTitle: 'Modern Warfare 2 Remastered Bundle', Markets: ['MX'], Images: [] }],
    DisplaySkuAvailabilities: [{
      Sku: { SkuId: '0001', SkuType: 'full', Properties: { IsTrial: false, IsPreOrder: false } },
      Availabilities: [{
        AvailabilityId: 'GIFT123', Actions: ['Gift'], Markets: ['MX'],
        Conditions: { StartDate: '2026-09-24T00:00:00Z', EndDate: '2026-09-29T00:00:00Z',
          ClientConditions: { AllowedPlatforms: [{ PlatformName: 'Windows.Xbox' }] } },
        OrderManagementData: { Price: { CurrencyCode: 'MXN', ListPrice: 199.75, MSRP: 799 } },
      }],
    }],
  };
}
const availability = p => p.DisplaySkuAvailabilities[0].Availabilities[0];
const price = p => availability(p).OrderManagementData.Price;

test('accepts real discounted gifts, including remasters and full-game bundles', () => {
  const [deal] = extractDeals(product(), NOW);
  assert.equal(deal.id, 'BQ1W1T1FC14W:0001');
  assert.equal(deal.originalSalePrice, 199.75);
  assert.equal(isActiveDeal(deal, NOW), true);
  const ui = priceBreakdown(deal);
  assert.equal(ui.finalPrice, 147.82);
  assert.equal(ui.fullPrice, 799);
  assert.equal(ui.discountPct, 75);
});

const rejections = {
  'same normal and sale price': p => { price(p).MSRP = 199.75; },
  'missing original price': p => { delete price(p).MSRP; },
  'numeric strings': p => { price(p).ListPrice = '199.75'; },
  'over 500 even if extra discount would put it under': p => { price(p).ListPrice = 500.01; },
  'free product': p => { price(p).ListPrice = 0; },
  'not MXN': p => { price(p).CurrencyCode = 'USD'; },
  'other market': p => { availability(p).Markets = ['US']; },
  'purchase without gift': p => { availability(p).Actions = ['Purchase']; },
  'expired offer': p => { availability(p).Conditions.EndDate = new Date(NOW).toISOString(); },
  'future offer': p => { availability(p).Conditions.StartDate = '2026-09-26T00:00:00Z'; },
  'unknown end date': p => { delete availability(p).Conditions.EndDate; },
  'Xbox 360 backwards compatible on One': p => { p.Properties.XboxConsoleGenOptimized = ['ConsoleGen7']; },
  'unknown native generation': p => { delete p.Properties.XboxConsoleGenOptimized; },
  'legacy fulfillment': p => { p.DisplaySkuAvailabilities[0].Sku.Properties.FulfillmentType = 'Xbox360'; },
  'addon even when giftable': p => { p.ProductType = 'Durable'; },
  'currency': p => { p.ProductType = 'Consumable'; },
  'PC only': p => { availability(p).Conditions.ClientConditions.AllowedPlatforms = [{ PlatformName: 'Windows.Desktop' }]; },
  'membership requirement': p => { availability(p).RemediationRequired = true; },
  'affirmation required': p => { availability(p).AffirmationId = 'membership'; },
  'trial': p => { p.DisplaySkuAvailabilities[0].Sku.Properties.IsTrial = true; },
  'preorder': p => { p.DisplaySkuAvailabilities[0].Sku.Properties.IsPreOrder = true; },
};
for (const [name, mutate] of Object.entries(rejections)) {
  test(`rejects ${name}`, () => { const p = product(); mutate(p); assert.deepEqual(extractDeals(p, NOW), []); });
}
test('accepts prices below 50 and exactly 500', () => {
  for (const amount of [1, 26.7, 500]) {
    const p = product(); price(p).ListPrice = amount;
    assert.equal(extractDeals(p, NOW)[0].originalSalePrice, amount);
  }
});
test('does not use cheap self-purchase prices for a full-price gift', () => {
  const p = product(); const purchase = structuredClone(availability(p)); purchase.Actions = ['Purchase'];
  price(p).ListPrice = 799;
  p.DisplaySkuAvailabilities[0].Availabilities.push(purchase);
  assert.deepEqual(extractDeals(p, NOW), []);
});
test('does not combine prices across SKUs', () => {
  const p = product(); const other = structuredClone(p.DisplaySkuAvailabilities[0]);
  other.Sku.SkuId = '0002'; other.Availabilities[0].OrderManagementData.Price = { CurrencyCode: 'MXN', ListPrice: 100, MSRP: 100 };
  p.DisplaySkuAvailabilities.push(other);
  assert.equal(extractDeals(p, NOW).length, 1);
});
test('rejects add-on-only bundles even when Microsoft classifies them as Game', () => {
  const p = product();
  p.DisplaySkuAvailabilities[0].Sku.Properties = { IsBundle: true, BundledSkus: [{ BigId: '9NP83DTS8T4W' }] };
  const addon = product(); addon.ProductId = '9NP83DTS8T4W'; addon.ProductType = 'Durable';
  assert.deepEqual(extractDeals(p, NOW, new Map([[addon.ProductId, addon]])), []);
  assert.deepEqual(extractDeals(p, NOW), []);
  const base = product(); base.ProductId = addon.ProductId;
  assert.equal(extractDeals(p, NOW, new Map([[base.ProductId, base]])).length, 1);
  base.Properties.XboxConsoleGenOptimized = ['ConsoleGen7'];
  assert.deepEqual(extractDeals(p, NOW, new Map([[base.ProductId, base]])), []);
});
test('bundle cycles cannot masquerade as a base game', () => {
  const p = product();
  p.DisplaySkuAvailabilities[0].Sku.Properties = { IsBundle: true, BundledSkus: [{ BigId: p.ProductId }] };
  assert.deepEqual(extractDeals(p, NOW, new Map([[p.ProductId, p]])), []);
});
test('digital artbook apps inside premium upgrades are not base games', () => {
  const p = product();
  p.DisplaySkuAvailabilities[0].Sku.Properties = { IsBundle: true, BundledSkus: [{ BigId: '9NP83DTS8T4W' }] };
  const art = product(); art.ProductId = '9NP83DTS8T4W';
  for (const title of ['Starfield Digital Artbook & Original Soundtrack', 'Historia digital y colección de arte - Halo']) {
    art.LocalizedProperties[0].ProductTitle = title;
    assert.deepEqual(extractDeals(p, NOW, new Map([[art.ProductId, art]])), []);
  }
  art.LocalizedProperties[0].ProductTitle = 'The Artful Escape';
  assert.equal(extractDeals(p, NOW, new Map([[art.ProductId, art]])).length, 1);
});
test('giftable console subscriptions require the same discount and date rules', () => {
  const p = product(); p.ProductType = 'PASS'; p.Properties = {};
  p.DisplaySkuAvailabilities[0].Sku.RecurrencePolicy = { InitialDuration: { Units: 3, UnitType: 'Month' } };
  assert.equal(extractDeals(p, NOW)[0].kind, 'subscription');
  assert.match(extractDeals(p, NOW)[0].title, /3 mes/);
  price(p).MSRP = price(p).ListPrice;
  assert.deepEqual(extractDeals(p, NOW), []);
});
test('browser hides old, legacy, unverifiable and expired entries', () => {
  const [g] = extractDeals(product(), NOW);
  assert.equal(isActiveDeal(g, NOW + MAX_AGE_MS), false);
  assert.equal(isActiveDeal({ ...g, verifiedAt: undefined }, NOW), false);
  assert.equal(isActiveDeal({ ...g, offerEndsAt: new Date(NOW).toISOString() }, NOW), false);
  assert.equal(isActiveDeal({ ...g, url: 'javascript:alert(1)' }, NOW), false);
  assert.equal(isActiveDeal({ ...g, giftable: undefined }, NOW), false);
});

const KEY = 'BROWSE_CHANNELID=DYNAMICCHANNEL.GAMEDEALS_FILTERS=';
const channel = (ids, token) => ({ channels: { [KEY]: { products: ids.map(productId => ({ productId })), encodedCT: token } } });
test('discovery follows all pages, deduplicates and detects broken pagination', async () => {
  let calls = 0;
  const ids = await discoverProducts(async (_url, options) => {
    const request = JSON.parse(options.body);
    if (calls++ === 0) { assert.equal(request.EncodedCT, undefined); return channel(['BQ1W1T1FC14W'], 'next'); }
    assert.equal(request.EncodedCT, 'next');
    return channel(['BQ1W1T1FC14W', '9NP83DTS8T4W']);
  });
  assert.equal(ids.length, 2);
  await assert.rejects(discoverProducts(async () => channel(['BQ1W1T1FC14W'], 'repeated')), /repitió/);
  await assert.rejects(discoverProducts(async () => ({ channels: {} })), /vacío/);
});
test('valid refresh with no eligible deals produces an empty catalog, not old offers', async () => {
  const p = product(); price(p).ListPrice = 799;
  const catalog = await buildCatalog(async url => url.includes('/browse?') ? channel([p.ProductId]) : { Products: [p] }, NOW);
  assert.deepEqual(catalog.games, []);
  assert.equal(catalog.schemaVersion, 2);
});
test('upstream failure rejects the refresh instead of marking old data fresh', async () => {
  await assert.rejects(buildCatalog(async url => {
    if (url.includes('/browse?')) return channel(['BQ1W1T1FC14W']);
    throw new Error('Microsoft unavailable');
  }, NOW), /Microsoft unavailable/);
});

import { isActiveDeal } from '../src/deal-policy.js';

function includesBaseGame(product, sku, products, seen = new Set()) {
  if (product.ProductType?.toLowerCase() !== 'game' || product.Properties?.IsDemo) return false;
  // Digital art/soundtrack apps can also be typed Game and bundled with DLC.
  // These precise content labels supplement metadata; never ban generic
  // words like "pack", "pass", or a franchise name.
  const titles = (product.LocalizedProperties || []).map(p => p.ProductTitle || '').join(' ');
  if (/\b(?:artbook|art book|soundtrack|banda sonora|libro de arte|colección de arte|coleccion de arte)\b/i.test(titles)) return false;
  const native = product.Properties?.XboxConsoleGenOptimized || [];
  if (!native.some(g => ['ConsoleGen8', 'ConsoleGen9'].includes(g)) ||
      native.some(g => !['ConsoleGen8', 'ConsoleGen9'].includes(g))) return false;
  const sp = sku.Properties || {};
  if (sp.IsTrial || sp.IsPreOrder || sku.SkuType?.toLowerCase() !== 'full' ||
      /360|legacy/i.test(sp.FulfillmentType || '') ||
      sp.Packages?.some(p => p.MainPackageFamilyNameForDlc)) return false;
  if (!sp.IsBundle && !sp.BundledSkus?.length) return true;
  if (seen.has(product.ProductId)) return false;
  const visited = new Set([...seen, product.ProductId]);
  return (sp.BundledSkus || []).some(item => {
    const [id, skuId] = (item.BigId || '').split('/');
    const child = products.get(id);
    return child?.DisplaySkuAvailabilities?.some(entry =>
      (!skuId || entry.Sku.SkuId === skuId) && includesBaseGame(child, entry.Sku, products, visited));
  });
}

export function extractDeals(product, now = Date.now(), products = new Map()) {
  const props = product.Properties || {};
  const type = product.ProductType?.toLowerCase();
  if (!['game', 'pass'].includes(type) || props.IsDemo) return [];
  const generations = props.XboxConsoleGenCompatible || [];
  const native = props.XboxConsoleGenOptimized || [];
  // Backwards compatibility alone does not make a 360 title an Xbox One game.
  if (type === 'game' && (!native.some(g => ['ConsoleGen8', 'ConsoleGen9'].includes(g)) ||
      native.some(g => !['ConsoleGen8', 'ConsoleGen9'].includes(g)))) return [];
  const localized = product.LocalizedProperties?.find(p => p.Markets?.includes('MX')) || product.LocalizedProperties?.[0];
  if (!localized?.ProductTitle) return [];
  const image = ['TitledHeroArt', 'SuperHeroArt', 'BoxArt'].map(purpose =>
    localized.Images?.find(i => i.ImagePurpose === purpose)?.Uri).find(Boolean);
  const results = [];
  for (const { Sku: sku, Availabilities: availabilities = [] } of product.DisplaySkuAvailabilities || []) {
    const sp = sku?.Properties || {};
    if (sku?.SkuType?.toLowerCase() !== 'full' || sp.IsTrial || sp.IsPreOrder ||
        sku.RecurrencePolicy?.HasTrial || /360|legacy/i.test(sp.FulfillmentType || '')) continue;
    if (type === 'game' && !includesBaseGame(product, sku, products)) continue;
    const gifts = [];
    for (const a of availabilities) {
      const conditions = a.Conditions || {};
      const price = a.OrderManagementData?.Price;
      if (!a.Actions?.includes('Gift') || !a.Markets?.includes('MX') || !price) continue;
      // Membership, ownership and targeted offers cannot be promised to everyone.
      if (a.RemediationRequired || a.Remediations?.length || a.AffirmationId || conditions.AffirmationId ||
          conditions.ClientConditions?.EligibilityConditions || conditions.ClientConditions?.EntitlementKeys) continue;
      const allowed = conditions.ClientConditions?.AllowedPlatforms || [];
      if (!allowed.some(p => p.PlatformName === 'Windows.Xbox')) continue;
      const platforms = type === 'pass' ? ['Xbox One', 'Xbox Series X|S'] :
        generations.filter(g => ['ConsoleGen8', 'ConsoleGen9'].includes(g))
          .map(g => g === 'ConsoleGen8' ? 'Xbox One' : 'Xbox Series X|S');
      const duration = sku.RecurrencePolicy?.InitialDuration;
      const suffix = type === 'pass' && duration ? ` · ${duration.Units} ${duration.UnitType === 'Month' ? 'mes(es)' : duration.UnitType === 'Day' ? 'día(s)' : duration.UnitType}` : '';
      const deal = {
        id: `${product.ProductId}:${sku.SkuId}`, productId: product.ProductId, skuId: sku.SkuId,
        title: localized.ProductTitle + suffix,
        url: `https://www.xbox.com/es-MX/games/store/-/${product.ProductId}/${sku.SkuId}`,
        image: image ? `${image.startsWith('//') ? 'https:' : ''}${image}?w=640&h=360&q=85` : '',
        originalSalePrice: price.ListPrice, originalFullPrice: price.MSRP,
        discount: `-${Math.round((1 - price.ListPrice / price.MSRP) * 100)}%`,
        platform: platforms.join(' · '), platforms, kind: type === 'pass' ? 'subscription' : 'game',
        market: 'MX', currency: price.CurrencyCode, giftable: true,
        giftAvailabilityId: a.AvailabilityId,
        offerStartsAt: conditions.StartDate, offerEndsAt: conditions.EndDate,
        verifiedAt: new Date(now).toISOString(), source: 'Microsoft Display Catalog',
      };
      if (isActiveDeal(deal, now)) gifts.push(deal);
    }
    // Keep each duration/edition separate, and never combine prices from different SKUs.
    gifts.sort((a, b) => a.originalSalePrice - b.originalSalePrice);
    if (gifts.length) results.push(gifts[0]);
  }
  return results;
}

export const MAX_PRICE = 500;
export const MAX_AGE_MS = 30 * 60 * 60 * 1000;
export const EXTRA_DISCOUNT = 0.26;

// The browser and updater use the same fail-closed rules.
export function isActiveDeal(game, now = Date.now()) {
  if (!game || game.market !== 'MX' || game.currency !== 'MXN' || game.giftable !== true) return false;
  if (!['game', 'subscription'].includes(game.kind)) return false;
  if (!Array.isArray(game.platforms) || !game.platforms.length ||
      game.platforms.some(p => !['Xbox One', 'Xbox Series X|S'].includes(p))) return false;
  if (!Number.isFinite(game.originalSalePrice) || game.originalSalePrice <= 0 || game.originalSalePrice > MAX_PRICE) return false;
  if (!Number.isFinite(game.originalFullPrice) || game.originalFullPrice <= game.originalSalePrice) return false;
  const checked = Date.parse(game.verifiedAt);
  if (!Number.isFinite(checked) || checked > now || now - checked >= MAX_AGE_MS) return false;
  if (!(Date.parse(game.offerStartsAt) <= now && now < Date.parse(game.offerEndsAt))) return false;
  if (!/^[A-Z0-9]{12}:[A-Z0-9]+$/.test(game.id || '') || !game.giftAvailabilityId) return false;
  try {
    const url = new URL(game.url);
    if (url.protocol !== 'https:' || url.hostname !== 'www.xbox.com' || !url.pathname.toLowerCase().startsWith('/es-mx/games/store/')) return false;
  } catch { return false; }
  return true;
}

export function priceBreakdown(game) {
  const finalPrice = Math.round(game.originalSalePrice * (1 - EXTRA_DISCOUNT) * 100) / 100;
  return {
    ...game,
    finalPrice,
    fullPrice: game.originalFullPrice,
    savings: Math.round((game.originalFullPrice - finalPrice) * 100) / 100,
    discountPct: Math.round((1 - game.originalSalePrice / game.originalFullPrice) * 100),
  };
}

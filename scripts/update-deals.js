import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { extractDeals } from './catalog-policy.js';
import { MAX_AGE_MS } from '../src/deal-policy.js';

const CHANNEL = 'DynamicChannel.GameDeals';
const KEY = 'BROWSE_CHANNELID=DYNAMICCHANNEL.GAMEDEALS_FILTERS=';

export async function requestJSON(url, options = {}, fetcher = fetch) {
  let error;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetcher(url, { ...options, signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`HTTP ${response.status} (${new URL(url).hostname})`);
      return await response.json();
    } catch (e) {
      error = e;
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** attempt));
    }
  }
  throw error;
}

export async function discoverProducts(request = requestJSON) {
  const ids = new Set();
  const tokens = new Set();
  let token;
  for (let page = 0; page < 200; page++) {
    const data = await request('https://emerald.xboxservices.com/xboxcomfd/browse?locale=es-MX', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ms-api-version': '1.1',
        'ms-cv': `${crypto.randomBytes(16).toString('base64').replace(/=+$/, '')}.0` },
      body: JSON.stringify({ Filters: 'e30=', ReturnFilters: false,
        ChannelKeyToBeUsedInResponse: KEY, ChannelId: CHANNEL, ...(token ? { EncodedCT: token } : {}) }),
    });
    const channel = data.channels?.[KEY];
    if (!Array.isArray(channel?.products) || !channel.products.length) throw new Error('El canal de ofertas está vacío o cambió de formato.');
    for (const product of channel.products) {
      if (!/^[A-Z0-9]{12}$/.test(product.productId)) throw new Error('Identificador de producto inválido.');
      ids.add(product.productId);
    }
    // Discover subscription IDs from Microsoft's own game/pass relationships.
    for (const product of data.productSummaries || []) {
      for (const id of product.includedWithPassesProductIds || []) {
        if (/^[A-Z0-9]{12}$/.test(id)) ids.add(id);
      }
    }
    token = channel.encodedCT;
    if (!token) return [...ids];
    if (tokens.has(token)) throw new Error('La paginación de Xbox se repitió.');
    tokens.add(token);
  }
  throw new Error('El catálogo excedió el límite de páginas; no se publicará una lista parcial.');
}

export async function buildCatalog(request = requestJSON, now = Date.now()) {
  const ids = await discoverProducts(request);
  console.log(`Verificando ${ids.length} productos y sus opciones de regalo en México…`);
  const games = new Map();
  const products = new Map();
  const missing = [];
  for (let i = 0; i < ids.length; i += 20) {
    const batch = ids.slice(i, i + 20);
    const data = await request(`https://displaycatalog.mp.microsoft.com/v7.0/products?bigIds=${batch.join(',')}&market=MX&languages=es-mx`);
    if (!Array.isArray(data.Products) || !data.Products.length) throw new Error('Respuesta de catálogo vacía o inválida.');
    const found = new Set(data.Products.map(p => p.ProductId));
    missing.push(...batch.filter(id => !found.has(id)));
    for (const p of data.Products) products.set(p.ProductId, p);
  }
  if (missing.length > Math.max(5, ids.length * 0.05)) throw new Error('Faltan demasiados productos; se conserva la última verificación sin renovar su fecha.');

  // Some add-on-only bundles are classified as Game. Resolve their contents
  // instead of treating that label or words in the title as proof of a base game.
  const attempted = new Set(ids);
  for (let depth = 0; depth < 6; depth++) {
    const children = new Set();
    for (const p of products.values()) {
      if (p.ProductType?.toLowerCase() !== 'game') continue;
      for (const entry of p.DisplaySkuAvailabilities || []) {
        for (const item of entry.Sku?.Properties?.BundledSkus || []) {
          const id = item.BigId?.split('/')[0];
          if (/^[A-Z0-9]{12}$/.test(id) && !attempted.has(id)) children.add(id);
        }
      }
    }
    if (!children.size) break;
    if (depth === 5 || attempted.size + children.size > 5000) throw new Error('No se pudo completar la verificación de los paquetes.');
    console.log(`Comprobando el contenido de paquetes: ${children.size} productos adicionales…`);
    const childIds = [...children];
    for (let i = 0; i < childIds.length; i += 20) {
      const batch = childIds.slice(i, i + 20);
      batch.forEach(id => attempted.add(id));
      const data = await request(`https://displaycatalog.mp.microsoft.com/v7.0/products?bigIds=${batch.join(',')}&market=MX&languages=es-mx`);
      if (!Array.isArray(data.Products)) throw new Error('Respuesta inválida al verificar el contenido de paquetes.');
      for (const p of data.Products) products.set(p.ProductId, p);
    }
  }
  for (const id of ids) {
    const product = products.get(id);
    if (product) for (const game of extractDeals(product, now, products)) games.set(game.id, game);
  }
  return {
    schemaVersion: 2, checkedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + MAX_AGE_MS).toISOString(),
    source: 'Xbox México / Microsoft Display Catalog',
    examinedProducts: ids.length, unavailableProducts: missing,
    games: [...games.values()].sort((a, b) => a.title.localeCompare(b.title, 'es') || a.id.localeCompare(b.id)),
  };
}

export async function main() {
  const catalog = await buildCatalog();
  const output = fileURLToPath(new URL('../public/data/games.json', import.meta.url));
  const temp = `${output}.${process.pid}.tmp`;
  await fs.writeFile(temp, JSON.stringify(catalog, null, 2) + '\n');
  await fs.rename(temp, output);
  console.log(`${catalog.games.length} ofertas con regalo confirmado. Catálogo guardado de forma completa.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.resolve(__dirname, '../public/data/games.json');

const RETRO_360_KEYWORDS = [
  '360', 'frontlines', 'alive', 'sacred 2', 'sacred 3', 'risen (2009)', 'risen 2', 
  'full spectrum warrior', 'baja: edge of control', 'fallout 3', 'fallout: new vegas',
  'gears of war 2', 'gears of war 3', 'gears of war: judgment', 'skate 2', 'skate 3',
  'fable ii', 'fable iii', 'bioshock 2', 'mass effect 2', 'mass effect 3', 'dead space 2',
  'left 4 dead', 'portal 2', 'call of duty 4', 'call of duty: black ops', 'modern warfare 2',
  'banjo-kazooie', 'banjo-tooie', 'perfect dark', 'kameo', 'crackdown 2', 'blue dragon',
  'lost odyssey', 'dragon age: origins', 'dragon age ii', 'spec ops: the line', 'max payne 3',
  'alice: madness returns', 'dante\'s inferno', 'asura\'s wrath', 'fight night'
];

const VIRTUAL_CURRENCY_KEYWORDS = [
  'monedas', 'points', 'créditos', 'virtual currency', 'puntos', 'stubs', 
  'coins', 'gems', 'gemas', 'bucks', 'v-bucks'
];

async function syncVerifiedDeals() {
  console.log('🚀 Conectando a Xbox Store México para extraer EXCLUSIVAMENTE ofertas reales activas con URL directa...');

  const browser = await puppeteer.launch({ 
    headless: "new",
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  });
  const page = await browser.newPage();
  
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1440, height: 900 });

  try {
    await page.goto('https://www.xbox.com/es-MX/games/browse/DynamicChannel.GameDeals', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log('📖 Cargando lista completa de ofertas en la store...');

    const MAX_CLICKS = 15;
    for (let i = 0; i < MAX_CLICKS; i++) {
      const clicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.innerText && b.innerText.toLowerCase().includes('cargar más'));
        if (btn) {
          btn.scrollIntoView();
          btn.click();
          return true;
        }
        return false;
      });

      if (clicked) {
        await new Promise(r => setTimeout(r, 2000));
      } else {
        break;
      }
    }

    console.log('🔍 Extrayendo juegos con DESCUENTO REAL VERIFICADO y URL DIRECTA...');

    const verifiedDeals = await page.evaluate((currencyKeywords, retroKeywords) => {
      const items = [];
      const seenTitles = new Set();
      
      const links = Array.from(document.querySelectorAll('a[href*="/games/store/"]'));

      links.forEach((a) => {
        const text = a.innerText || '';
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) return;

        const title = lines[0];
        const titleLower = title.toLowerCase();
        const fullTextLower = text.toLowerCase();

        // 1. REGLA 3: EXCLUIR XBOX 360 / ORIGINAL
        for (const rKw of retroKeywords) {
          if (titleLower.includes(rKw) || fullTextLower.includes(rKw)) return;
        }

        // 2. REGLA 4: EXCLUIR MONEDAS VIRTUALES
        for (const kw of currencyKeywords) {
          if (titleLower.includes(kw) || fullTextLower.includes(kw)) return;
        }

        // 3. EXTRAER PRECIOS
        const priceMatches = text.match(/MXN\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?/gi);
        if (!priceMatches) return;

        const numericPrices = priceMatches.map(p => parseFloat(p.replace(/[^0-9.]/g, ''))).filter(n => !isNaN(n) && n > 0);
        if (numericPrices.length === 0) return;

        const discMatch = text.match(/-\d{1,2}%/);
        
        let salePrice = 0;
        let fullPrice = 0;
        let hasRealDiscount = false;

        if (discMatch) {
          hasRealDiscount = true;
          salePrice = Math.min(...numericPrices);
          fullPrice = Math.max(...numericPrices);
        } else if (numericPrices.length >= 2) {
          salePrice = Math.min(...numericPrices);
          fullPrice = Math.max(...numericPrices);
          if (fullPrice > salePrice && (fullPrice - salePrice) >= 10) {
            hasRealDiscount = true;
          }
        }

        // SI NO TIENE DESCUENTO VERIFICADO, SE DESCARTA
        if (!hasRealDiscount) return;

        // 4. REGLA 1: PRECIO DE OFERTA ENTRE $50 Y $500 MXN
        if (salePrice < 50 || salePrice > 500) return;

        // Calcular % de descuento para mostrar
        let discountPct = discMatch ? discMatch[0] : `-${Math.round((1 - (salePrice / fullPrice)) * 100)}%`;

        // Extraer Imagen
        const imgEl = a.querySelector('img');
        let image = imgEl ? (imgEl.src || imgEl.getAttribute('data-src') || imgEl.srcset || '') : '';
        if (image) {
          image = image.split('?')[0] + '?q=90&w=480&h=270';
        }

        const href = a.href;

        if (!seenTitles.has(titleLower)) {
          seenTitles.add(titleLower);
          items.push({
            id: String(items.length + 1),
            title,
            url: href,
            image: image || '/placeholder.png',
            originalSalePrice: salePrice,
            originalFullPrice: fullPrice > salePrice ? fullPrice : salePrice,
            discount: discountPct,
            platform: "Xbox One, Series X|S"
          });
        }
      });

      return items;
    }, VIRTUAL_CURRENCY_KEYWORDS, RETRO_360_KEYWORDS);

    console.log(`✅ ¡Obtenidos ${verifiedDeals.length} JUEGOS EN OFERTA REAL VERIFICADA CON URL DIRECTA ($50 - $500 MXN)!`);

    if (verifiedDeals.length > 0) {
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(verifiedDeals, null, 2), 'utf-8');
      console.log(`💾 games.json actualizado.`);
    }

  } catch (err) {
    console.error('❌ Error en el scraping:', err);
  } finally {
    await browser.close();
  }
}

syncVerifiedDeals();

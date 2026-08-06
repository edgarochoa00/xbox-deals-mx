const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

const DLC_KEYWORDS = [
  'monedas', 'points', 'créditos', 'virtual currency', 'puntos', 'stubs', 
  'coins', 'gems', 'gemas', 'bucks', 'v-bucks'
];

async function syncLiveDeals() {
  console.log('🚀 Conectando a Xbox Store México para extraer EXCLUSIVAMENTE ofertas reales activas...');

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

    let clickCount = 0;
    const MAX_CLICKS = 25;
    
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
        clickCount++;
        await new Promise(r => setTimeout(r, 2000));
      } else {
        break;
      }
    }

    console.log('🔍 Extrayendo exclusivamente juegos con DESCUENTO REAL VERIFICADO...');

    const verifiedDeals = await page.evaluate((dlcKeywords, retroKeywords) => {
      const items = [];
      const seenTitles = new Set();
      
      const cards = Array.from(document.querySelectorAll('div[class*="ProductCard-module__cardWrapper"], div[class*="productCard"]'));

      cards.forEach((card) => {
        const fullText = card.innerText || '';
        const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) return;

        const title = lines[0];
        const titleLower = title.toLowerCase();
        const fullTextLower = fullText.toLowerCase();

        // 1. REGLA 3: EXCLUIR XBOX 360 / ORIGINAL
        for (const rKw of retroKeywords) {
          if (titleLower.includes(rKw) || fullTextLower.includes(rKw)) return;
        }

        // 2. REGLA 4: EXCLUIR DLCs / COMPLEMENTOS / MONEDAS
        for (const kw of dlcKeywords) {
          if (titleLower.includes(kw) || fullTextLower.includes(kw)) return;
        }

        // 3. REQUISITO FUNDAMENTAL: DEBE TENER DESCUENTO REAL ACTIVO
        // Buscar etiqueta de descuento (-XX%) o texto de ahorro
        const discMatch = fullText.match(/-\d{1,2}%/);
        
        // Extraer Precios
        const priceMatches = fullText.match(/MXN\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?/gi);
        if (!priceMatches) return;

        const numericPrices = priceMatches.map(p => parseFloat(p.replace(/[^0-9.]/g, ''))).filter(n => !isNaN(n) && n > 0);
        
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

        // SI NO TIENE DESCUENTO VERIFICADO (-XX% O PRECIO ANTERIOR MAYOR), SE DESPORTA (NO ES OFERTA)
        if (!hasRealDiscount) return;

        // 4. REGLA 1: PRECIO DE OFERTA ENTRE $50 Y $500 MXN
        if (salePrice < 50 || salePrice > 500) return;

        // Calcular % de descuento para mostrar
        let discountPct = discMatch ? discMatch[0] : `-${Math.round((1 - (salePrice / fullPrice)) * 100)}%`;

        // Extraer Imagen
        const imgEl = card.querySelector('img');
        let image = imgEl ? (imgEl.src || imgEl.getAttribute('data-src') || imgEl.srcset || '') : '';
        if (image) {
          image = image.split('?')[0] + '?q=90&w=480&h=270';
        }

        if (!seenTitles.has(titleLower)) {
          seenTitles.add(titleLower);
          items.push({
            id: String(items.length + 1),
            title,
            image: image || '/placeholder.png',
            originalSalePrice: salePrice,
            originalFullPrice: fullPrice > salePrice ? fullPrice : undefined,
            discount: discountPct,
            platform: "Xbox One, Series X|S"
          });
        }
      });

      return items;
    }, DLC_KEYWORDS, RETRO_360_KEYWORDS);

    console.log(`✅ ¡Obtenidos ${verifiedDeals.length} JUEGOS EN OFERTA REAL VERIFICADA ($50 - $500 MXN)!`);

    if (verifiedDeals.length > 0) {
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(verifiedDeals, null, 2), 'utf-8');
      console.log(`💾 games.json actualizado.`);

      console.log('\n🎨 Auditando y reparando imágenes de las ofertas verificadas...');
      try {
        execSync('node scripts/verify_and_fix_images.cjs', { stdio: 'inherit' });
      } catch(e) {
        console.warn('Advertencia durante la verificación de imágenes:', e.message);
      }
    }

  } catch (err) {
    console.error('❌ Error en el scraping:', err);
  } finally {
    await browser.close();
  }
}

syncLiveDeals();

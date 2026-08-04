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
  'dlc', 'addon', 'add-on', 'expansion', 'pass', 'pase', 'season pass', 
  'monedas', 'points', 'créditos', 'virtual currency', 'puntos', 'stubs', 
  'paquete', 'pack', 'skin', 'outfit', 'bundle', 'kit', 'upgrade', 
  'complemento', 'item', 'coins', 'gems', 'gemas', 'bucks', 'v-bucks'
];

async function syncLiveDeals() {
  console.log('🚀 Conectando a la Tienda de Xbox México (https://www.xbox.com/es-MX/games/browse/DynamicChannel.GameDeals)...');
  
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1440, height: 900 });

  try {
    await page.goto('https://www.xbox.com/es-MX/games/browse/DynamicChannel.GameDeals', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log('📖 Página de la Store cargada. Desplegando ofertas activas...');

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

    console.log('🔍 Extrayendo exclusivamente JUEGOS BASE DIGITALES NATIVOS de Xbox One / Series X|S...');

    const liveDeals = await page.evaluate((dlcKeywords, retroKeywords) => {
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

        // REGLA 1: EXCLUIR XBOX 360 Y XBOX ORIGINAL (COMPLETAMENTE)
        for (const rKw of retroKeywords) {
          if (titleLower.includes(rKw) || fullTextLower.includes(rKw)) {
            return;
          }
        }

        // REGLA 2: EXCLUIR DLCs, COMPLEMENTOS, PASES, MONEDAS
        for (const kw of dlcKeywords) {
          if (titleLower.includes(kw) || fullTextLower.includes(kw)) {
            return;
          }
        }

        // Extraer Imagen
        const imgEl = card.querySelector('img');
        let image = imgEl ? (imgEl.src || imgEl.getAttribute('data-src') || imgEl.srcset || '') : '';
        if (image) {
          image = image.split('?')[0] + '?q=90&w=480&h=270';
        }

        // Extraer Precios
        const priceMatches = fullText.match(/MXN\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?/gi);
        if (!priceMatches) return;

        const numericPrices = priceMatches.map(p => parseFloat(p.replace(/[^0-9.]/g, ''))).filter(n => !isNaN(n) && n > 0);
        if (numericPrices.length === 0) return;

        const salePrice = Math.min(...numericPrices);
        const fullPrice = Math.max(...numericPrices);

        // REGLA 3: RANGO DE PRECIO $50 A $500 MXN
        if (salePrice < 50 || salePrice > 500) {
          return;
        }

        // Calcular Descuento de Tienda
        let discount = '';
        const discMatch = fullText.match(/-\d{1,2}%/);
        if (discMatch) {
          discount = discMatch[0];
        } else if (fullPrice > salePrice) {
          const pct = Math.round((1 - (salePrice / fullPrice)) * 100);
          if (pct >= 5) discount = `-${pct}%`;
        }

        if (!seenTitles.has(titleLower)) {
          seenTitles.add(titleLower);
          items.push({
            id: String(items.length + 1),
            title,
            image: image || '/placeholder.png',
            originalSalePrice: salePrice,
            originalFullPrice: fullPrice > salePrice ? fullPrice : undefined,
            discount: discount || undefined,
            platform: "Xbox One, Series X|S"
          });
        }
      });

      return items;
    }, DLC_KEYWORDS, RETRO_360_KEYWORDS);

    console.log(`✅ ¡Éxito! Obtenidos ${liveDeals.length} JUEGOS BASE NATIVOS de Xbox One / Series X|S sin Xbox 360.`);

    if (liveDeals.length > 0) {
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(liveDeals, null, 2), 'utf-8');
      console.log(`💾 games.json actualizado.`);

      console.log('\n🎨 Auditando imágenes de los juegos resultantes...');
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

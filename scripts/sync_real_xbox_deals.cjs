const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_FILE = path.resolve(__dirname, '../public/data/games.json');

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

    console.log('📖 Página de la Store cargada. Haciendo clic en "Cargar más" repetidamente para obtener cientos de ofertas...');

    // Loop clicking "Cargar más" up to 30 times to load hundreds of deals
    let clickCount = 0;
    const MAX_CLICKS = 30;
    
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
        console.log(`  └─> Clic en "Cargar más" (${clickCount}/${MAX_CLICKS})...`);
        await new Promise(r => setTimeout(r, 2000));
      } else {
        console.log('  └─> Se han cargado todas las ofertas disponibles.');
        break;
      }
    }

    console.log('🔍 Extrayendo información de las tarjetas de producto de Xbox Store...');

    const liveDeals = await page.evaluate(() => {
      const items = [];
      const seenTitles = new Set();
      
      const cards = Array.from(document.querySelectorAll('div[class*="ProductCard-module__cardWrapper"], div[class*="productCard"]'));

      cards.forEach((card, index) => {
        const fullText = card.innerText || '';
        const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) return;

        const title = lines[0];
        const titleLower = title.toLowerCase();

        // Exclude Non-Games (DLCs, Passes, Virtual Currencies)
        if (
          titleLower.includes('monedas') || 
          titleLower.includes('points') || 
          titleLower.includes('créditos') || 
          titleLower.includes('virtual currency') || 
          titleLower.includes('puntos') ||
          titleLower.includes('stubs') ||
          titleLower.includes('season pass') ||
          titleLower.includes('pass de temporada') ||
          fullText.toLowerCase().includes('complemento')
        ) {
          return;
        }

        // Image
        const imgEl = card.querySelector('img');
        let image = imgEl ? (imgEl.src || imgEl.getAttribute('data-src') || imgEl.srcset || '') : '';
        if (image) {
          image = image.split('?')[0] + '?q=90&w=480&h=270';
        }

        // Match Prices
        const priceMatches = fullText.match(/MXN\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?/gi);
        if (!priceMatches) return;

        const numericPrices = priceMatches.map(p => parseFloat(p.replace(/[^0-9.]/g, ''))).filter(n => !isNaN(n) && n > 0);
        if (numericPrices.length === 0) return;

        const salePrice = Math.min(...numericPrices);
        const fullPrice = Math.max(...numericPrices);

        // Filter: Sale price under $500 MXN
        if (salePrice > 500) return;

        // Calculate Store Discount
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
    });

    console.log(`✅ Extraídos ${liveDeals.length} juegos reales en oferta de xbox.com`);

    if (liveDeals.length > 0) {
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(liveDeals, null, 2), 'utf-8');
      console.log(`💾 games.json actualizado con las ${liveDeals.length} ofertas reales en tiempo real.`);

      console.log('\n🎨 Auditando y verificando portadas e imágenes de alta resolución...');
      try {
        execSync('node scripts/verify_and_fix_images.cjs', { stdio: 'inherit' });
      } catch(e) {
        console.warn('Advertencia durante la verificación de imágenes:', e.message);
      }
    } else {
      console.log('⚠️ No se hallaron ofertas con el filtro actual.');
    }

  } catch (err) {
    console.error('❌ Error en el scraping:', err);
  } finally {
    await browser.close();
  }
}

syncLiveDeals();

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

    console.log('📖 Página de la Store cargada. Desplegando ofertas activas con el botón "Cargar más"...');

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
        console.log(`  └─> Clic en "Cargar más" (${clickCount}/${MAX_CLICKS})...`);
        await new Promise(r => setTimeout(r, 2000));
      } else {
        console.log('  └─> Se han cargado todas las ofertas disponibles.');
        break;
      }
    }

    console.log('🔍 Extrayendo y aplicando estrictamente las 4 Reglas de Negocio...');

    const liveDeals = await page.evaluate(() => {
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

        // -------------------------------------------------------------
        // REGLA 3: EXCLUIR XBOX 360 Y XBOX ORIGINAL
        // -------------------------------------------------------------
        if (
          titleLower.includes('xbox 360') || 
          fullTextLower.includes('xbox 360') ||
          titleLower.includes('xbox original')
        ) {
          return;
        }

        // -------------------------------------------------------------
        // REGLA 4: SOLO JUEGOS BASE (NO DLCs, Pases, Monedas, Expansiones)
        // -------------------------------------------------------------
        if (
          titleLower.includes('monedas') || 
          titleLower.includes('points') || 
          titleLower.includes('créditos') || 
          titleLower.includes('virtual currency') || 
          titleLower.includes('puntos') ||
          titleLower.includes('stubs') ||
          titleLower.includes('season pass') ||
          titleLower.includes('pass de temporada') ||
          titleLower.includes('expansion pass') ||
          titleLower.includes('dlc') ||
          titleLower.includes('add-on') ||
          titleLower.includes('paquete de monedas') ||
          fullTextLower.includes('complemento') ||
          fullTextLower.includes('add-on')
        ) {
          return;
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

        // -------------------------------------------------------------
        // REGLA 1: RANGO DE PRECIO $50 A $500 MXN
        // -------------------------------------------------------------
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
    });

    console.log(`✅ ¡Filtro de 4 Reglas Aplicado! Extraídos ${liveDeals.length} juegos en oferta de Xbox One y Series X|S en el rango de $50 a $500 MXN.`);

    if (liveDeals.length > 0) {
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(liveDeals, null, 2), 'utf-8');
      console.log(`💾 games.json actualizado con las ${liveDeals.length} ofertas que cumplen estrictamente las 4 reglas.`);

      console.log('\n🎨 Auditando imágenes de los juegos resultantes...');
      try {
        execSync('node scripts/verify_and_fix_images.cjs', { stdio: 'inherit' });
      } catch(e) {
        console.warn('Advertencia durante la verificación de imágenes:', e.message);
      }
    } else {
      console.log('⚠️ No se hallaron ofertas con los criterios estrictos.');
    }

  } catch (err) {
    console.error('❌ Error en el scraping:', err);
  } finally {
    await browser.close();
  }
}

syncLiveDeals();

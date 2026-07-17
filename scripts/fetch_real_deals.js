import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

const OUTPUT_FILE = path.resolve('./public/data/games.json');
const MAX_PRICE = 500;

async function scrapeRealDeals() {
  console.log('Lanzando navegador para buscar ofertas reales en la tienda de Xbox...');
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (['font', 'stylesheet', 'media'].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  try {
    await page.goto('https://www.xbox.com/es-MX/games/browse/DynamicChannel.GameDeals', { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Scrollear para asegurar lazy loading
    await page.evaluate(async () => {
      window.scrollBy(0, 2000);
      await new Promise(r => setTimeout(r, 3000));
    });

    const gamesData = await page.evaluate(() => {
      const gamesList = [];
      
      // Buscar todos los enlaces que van a la tienda de un juego
      const cards = document.querySelectorAll('a[href*="/games/store/"]');
      let index = 1;
      
      // Usar un Set para evitar duplicados por titulo
      const seenTitles = new Set();

      for (const card of cards) {
        if (gamesList.length >= 15) break;

        const textContent = card.innerText || "";
        // El titulo suele ser la primera o segunda linea. Extraemos todo el texto y buscamos precios
        const lines = textContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) continue;

        const title = lines[0]; // Usualmente el primer elemento de texto es el título

        // Extraer imagen
        const imgEl = card.querySelector('img');
        let image = imgEl ? (imgEl.src || imgEl.getAttribute('data-src') || imgEl.srcset) : '';
        if (!image) continue;

        // Limpiar URL de imagen si tiene parametros (usaremos alta calidad)
        image = image.split('?')[0] + '?q=90&w=480&h=270';

        // Buscar precios en el texto
        const priceMatches = textContent.match(/\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g);
        if (!priceMatches) continue;

        // Convertir a numeros
        const prices = priceMatches.map(p => parseFloat(p.replace(/[^0-9.]/g, '')));
        const salePrice = Math.min(...prices);

        // Excluir complementos
        const isAddon = title.toLowerCase().includes('complemento') || 
                        title.toLowerCase().includes('dlc') || 
                        title.toLowerCase().includes('moneda') || 
                        title.toLowerCase().includes('pack') ||
                        title.toLowerCase().includes('season pass') ||
                        title.toLowerCase().includes('expansion pass') ||
                        title.toLowerCase().includes('stubs') ||
                        title.toLowerCase().includes('points') ||
                        title.toLowerCase().includes('coins') ||
                        title.toLowerCase().includes('credits') ||
                        title.toLowerCase().includes('virtual currency') ||
                        textContent.toLowerCase().includes('complemento');
                        
        if (isAddon || salePrice === 0 || salePrice > 500) continue;

        // Comprobar si está en oferta (múltiples precios o palabra clave)
        const hasDiscount = priceMatches.length > 1 || 
                            textContent.toLowerCase().includes('oferta') || 
                            textContent.toLowerCase().includes('ahorra') ||
                            textContent.toLowerCase().includes('descuento');

        if (hasDiscount && !seenTitles.has(title)) {
            seenTitles.add(title);
            gamesList.push({
              id: String(index++),
              title,
              image,
              originalSalePrice: salePrice,
              platform: "Xbox One, Series X|S"
            });
        }
      }
      return gamesList;
    });

    console.log(`Se encontraron ${gamesData.length} juegos en oferta real por debajo de $500.`);
    
    if (gamesData.length > 0) {
      await fs.writeFile(OUTPUT_FILE, JSON.stringify(gamesData, null, 2), 'utf-8');
      console.log('Archivo games.json sobrescrito con ofertas reales extraídas.');
    } else {
      console.log('No se encontraron suficientes juegos, el archivo se mantiene intacto.');
    }

  } catch (err) {
    console.error('Error al hacer scraping:', err);
  } finally {
    await browser.close();
  }
}

scrapeRealDeals();

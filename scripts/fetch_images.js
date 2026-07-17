import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

const GAMES_FILE = path.resolve('./public/data/games.json');

async function fetchImages() {
  console.log('📖 Leyendo games.json...');
  const gamesData = JSON.parse(await fs.readFile(GAMES_FILE, 'utf-8'));
  
  const unmatched = gamesData.filter(g => g.image === '/placeholder.png').map(g => g.title);
  
  if (unmatched.length === 0) {
    console.log('✅ Todos los juegos ya tienen imagen.');
    return;
  }
  
  console.log(`🔍 Buscando ${unmatched.length} juegos sin imagen en la tienda de Xbox...`);
  console.log('🌐 Lanzando navegador...');
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Block unnecessary resources for speed
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (['font', 'stylesheet', 'media'].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  let searchMatched = 0;
  for (let i = 0; i < unmatched.length; i++) {
    const game = gamesData.find(g => g.title === unmatched[i]);
    if (!game) continue;
    
    // Clean title for search
    const searchQuery = game.title
      .replace(/[™®©]/g, '')
      .replace(/[:–\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .slice(0, 4) // Use first 4 words for search
      .join(' ');
    
    try {
      await page.goto(`https://www.xbox.com/es-MX/Search?q=${encodeURIComponent(searchQuery)}`, { 
        waitUntil: 'networkidle2', 
        timeout: 15000 
      });
      
      await new Promise(r => setTimeout(r, 1000));
      
      const searchImage = await page.evaluate(() => {
        const firstCard = document.querySelector('a[href*="/games/store/"] img');
        if (firstCard) {
          let src = firstCard.src || firstCard.getAttribute('data-src') || '';
          if (src.includes('store-images.s-microsoft.com')) {
            return src.split('?')[0] + '?q=90&w=480&h=270';
          }
          return src;
        }
        return null;
      });
      
      if (searchImage) {
        game.image = searchImage;
        searchMatched++;
      }
      
      // Guardar progreso cada 10 juegos para que se vayan viendo en la app
      if ((i + 1) % 10 === 0 || (i + 1) === unmatched.length) {
        console.log(`   Buscados ${i + 1}/${unmatched.length}... (encontrados: ${searchMatched})`);
        await fs.writeFile(GAMES_FILE, JSON.stringify(gamesData, null, 2), 'utf-8');
      }
      
    } catch (e) {
      console.log(`   Error buscando: ${searchQuery}`);
    }
  }
  
  // Final stats
  const stillMissing = gamesData.filter(g => g.image === '/placeholder.png').length;
  console.log(`\n📊 Resultado final:`);
  console.log(`   Con imagen real: ${gamesData.length - stillMissing}/${gamesData.length}`);
  console.log(`   Sin imagen: ${stillMissing}`);
  
  await browser.close();
}

fetchImages().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

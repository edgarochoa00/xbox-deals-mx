const fs = require('fs');
const path = require('path');
const https = require('https');

const GAMES_FILE = path.resolve(__dirname, '../public/data/games.json');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', (err) => resolve(null));
  });
}

async function run() {
  console.log('📖 Leyendo games.json...');
  const gamesData = JSON.parse(fs.readFileSync(GAMES_FILE, 'utf-8'));
  
  const missing = gamesData.filter(g => g.image === '/placeholder.png' || g.image.includes('placeholder'));
  if (missing.length === 0) {
    console.log('✅ Todos los juegos ya tienen imagen.');
    return;
  }
  
  console.log(`🔍 Buscando imágenes rápidas para ${missing.length} juegos usando Steam API...`);
  
  let count = 0;
  const CONCURRENCY = 15;
  
  for (let i = 0; i < missing.length; i += CONCURRENCY) {
    const chunk = missing.slice(i, i + CONCURRENCY);
    const promises = chunk.map(async (game) => {
      // Clean title for search
      const searchQuery = game.title
        .replace(/[™®©]/g, '')
        .replace(/[:–\-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .slice(0, 3) // First 3 words is usually enough
        .join('+');
        
      const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(searchQuery)}&l=english&cc=US`;
      const data = await fetchJson(url);
      
      if (data && data.items && data.items.length > 0) {
        // Find best match if possible, else take first
        let match = data.items[0];
        // Use high-res header image
        game.image = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${match.id}/header.jpg`;
        count++;
      }
    });
    
    await Promise.all(promises);
    console.log(`Progreso: ${Math.min(i + CONCURRENCY, missing.length)}/${missing.length} (Encontrados: ${count})`);
  }
  
  fs.writeFileSync(GAMES_FILE, JSON.stringify(gamesData, null, 2), 'utf-8');
  console.log('✅ games.json actualizado.');
}

run().catch(console.error);

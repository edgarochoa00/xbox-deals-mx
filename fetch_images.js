import fs from 'fs';
import https from 'https';

const gamesFile = 'public/data/games.json';
let games = JSON.parse(fs.readFileSync(gamesFile, 'utf8'));

const fetchGameImage = (title) => {
  return new Promise((resolve) => {
    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(title)}&l=spanish&cc=MX`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.items && json.items.length > 0) {
            // filter out sound tracks or bundles if possible
            const item = json.items.find(i => i.type === 'app' && !i.name.includes('Soundtrack')) || json.items[0];
            resolve(`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`);
          } else {
            resolve(null);
          }
        } catch(e) {
          resolve(null);
        }
      });
    }).on('error', () => {
      resolve(null);
    });
  });
};

async function processGames() {
  const toProcess = games.filter(g => g.image.includes('placeholder.png') || g.image.includes('data:image'));
  console.log(`Need to fetch images for ${toProcess.length} games...`);
  
  for (let i = 0; i < toProcess.length; i++) {
    const game = toProcess[i];
    console.log(`[${i+1}/${toProcess.length}] Fetching image for: ${game.title}`);
    
    // Clean up title for search: e.g. remove Edition strings
    let searchTitle = game.title.split(' - ')[0].replace('Edition', '').trim();
    
    const imageUrl = await fetchGameImage(searchTitle);
    if (imageUrl) {
      game.image = imageUrl;
    } else {
      // Create a fallback inline SVG with the title text
      const escapedTitle = game.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='270'><rect width='480' height='270' fill='#2a2a2a'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20px' fill='#ffffff'>${escapedTitle}</text></svg>`;
      game.image = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    }
    
    // Save state every 10 items
    if (i % 10 === 0) {
      fs.writeFileSync(gamesFile, JSON.stringify(games, null, 2));
    }
    
    // Rate limit delay
    await new Promise(r => setTimeout(r, 200));
  }
  
  // Final save
  fs.writeFileSync(gamesFile, JSON.stringify(games, null, 2));
  console.log('Finished fetching images!');
}

processGames();

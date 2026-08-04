const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const GAMES_FILE = path.resolve(__dirname, '../public/data/games.json');

function checkUrl(urlStr) {
  return new Promise((resolve) => {
    if (!urlStr) return resolve({ status: 'missing', ok: false });
    if (urlStr.startsWith('data:')) return resolve({ status: 200, ok: true });

    try {
      const parsed = new URL(urlStr);
      const mod = parsed.protocol === 'https:' ? https : http;
      const req = mod.request(parsed, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
        resolve({ status: res.statusCode, ok: res.statusCode === 200 });
      });
      req.on('error', () => resolve({ status: 'error', ok: false }));
      req.setTimeout(3500, () => { req.destroy(); resolve({ status: 'timeout', ok: false }); });
      req.end();
    } catch(e) {
      resolve({ status: 'invalid', ok: false });
    }
  });
}

function fetchJson(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(4000, () => { req.destroy(); resolve(null); });
  });
}

function cleanTitle(title) {
  return title
    .replace(/\(Xbox One y Xbox Series X\|S\)/gi, '')
    .replace(/\(Xbox One\)/gi, '')
    .replace(/\(PC\)/gi, '')
    .replace(/Versión de /gi, '')
    .replace(/para Xbox One y Xbox Series X\|S/gi, '')
    .replace(/para Xbox One/gi, '')
    .replace(/para Xbox Series X\|S/gi, '')
    .replace(/Xbox One y Xbox Series X\|S/gi, '')
    .replace(/Xbox One/gi, '')
    .replace(/Xbox Series X\|S/gi, '')
    .replace(/Versión digital/gi, '')
    .replace(/Digital Deluxe Edition/gi, '')
    .replace(/Deluxe Edition/gi, '')
    .replace(/Edición Estándar/gi, '')
    .replace(/Edición Definitiva/gi, '')
    .replace(/Edición Premium/gi, '')
    .replace(/Edición Deluxe/gi, '')
    .replace(/Standard Edition/gi, '')
    .replace(/Definitive Edition/gi, '')
    .replace(/The World's Game Edition/gi, '')
    .replace(/[™®©]/g, '')
    .replace(/[:–\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateXboxCoverBase64(title) {
  const clean = (title || 'Juego Xbox')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  
  const words = clean.split(' ');
  let line1 = clean;
  let line2 = '';
  if (words.length > 3) {
    const mid = Math.ceil(words.length / 2);
    line1 = words.slice(0, mid).join(' ');
    line2 = words.slice(mid).join(' ');
  }

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='337' viewBox='0 0 600 337'>
    <defs>
      <linearGradient id='bg' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' stop-color='#06090e'/>
        <stop offset='50%' stop-color='#0d1b12'/>
        <stop offset='100%' stop-color='#06090e'/>
      </linearGradient>
      <radialGradient id='glow' cx='50%' cy='35%' r='60%'>
        <stop offset='0%' stop-color='#00e676' stop-opacity='0.22'/>
        <stop offset='100%' stop-color='#000000' stop-opacity='0'/>
      </radialGradient>
      <pattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'>
        <circle cx='2' cy='2' r='1' fill='#00e676' opacity='0.12'/>
      </pattern>
    </defs>
    <rect width='600' height='337' fill='url(#bg)'/>
    <rect width='600' height='337' fill='url(#glow)'/>
    <rect width='600' height='337' fill='url(#grid)'/>
    <circle cx='300' cy='105' r='32' fill='none' stroke='#00e676' stroke-width='3' opacity='0.85'/>
    <path d='M277 92 Q300 120 323 92 Q300 144 277 92 Z' fill='#00e676' opacity='0.85'/>
    <text x='300' y='${line2 ? 200 : 215}' text-anchor='middle' font-family='sans-serif' font-weight='800' font-size='20px' fill='#ffffff'>${line1}</text>
    ${line2 ? `<text x='300' y='230' text-anchor='middle' font-family='sans-serif' font-weight='800' font-size='20px' fill='#ffffff'>${line2}</text>` : ''}
    <rect x='220' y='260' width='160' height='24' rx='12' fill='#107c10' opacity='0.9'/>
    <text x='300' y='276' text-anchor='middle' font-family='sans-serif' font-weight='700' font-size='11px' fill='#ffffff' letter-spacing='2'>XBOX GAME</text>
  </svg>`;

  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

async function searchWorkingSteamImage(title) {
  const searchQ = cleanTitle(title);
  if (!searchQ || searchQ.length < 2) return null;

  // Try Steam search API
  const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(searchQ)}&l=spanish&cc=MX`;
  const data = await fetchJson(url);

  if (data && data.items && data.items.length > 0) {
    const mainKeyWord = searchQ.toLowerCase().split(' ')[0];
    
    for (const item of data.items) {
      if (item.type === 'app' && !item.name.toLowerCase().includes('soundtrack') && !item.name.toLowerCase().includes('dlc')) {
        const candidateUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`;
        const test = await checkUrl(candidateUrl);
        if (test.ok) return candidateUrl;
      }
    }
  }

  // Secondary try with shorter search query (first 2 words)
  const shortQ = searchQ.split(' ').slice(0, 2).join(' ');
  if (shortQ && shortQ !== searchQ) {
    const url2 = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(shortQ)}&l=spanish&cc=MX`;
    const data2 = await fetchJson(url2);
    if (data2 && data2.items && data2.items.length > 0) {
      for (const item of data2.items) {
        if (item.type === 'app') {
          const candidateUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`;
          const test = await checkUrl(candidateUrl);
          if (test.ok) return candidateUrl;
        }
      }
    }
  }

  return null;
}

async function main() {
  console.log('📖 Reading public/data/games.json...');
  const games = JSON.parse(fs.readFileSync(GAMES_FILE, 'utf-8'));
  console.log(`Auditing and fixing ${games.length} games...`);

  let fixedCount = 0;
  let validCount = 0;
  let steamFound = 0;
  let svgGenerated = 0;

  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    const check = await checkUrl(game.image);

    if (check.ok && !game.image.includes('placeholder')) {
      validCount++;
      // Convert raw url-encoded SVG data URIs to clean Base64 if needed
      if (game.image.startsWith('data:image/svg') && !game.image.includes('base64')) {
        game.image = generateXboxCoverBase64(game.title);
      }
    } else {
      console.log(`[${i + 1}/${games.length}] Fixing broken image (${check.status}) for: "${game.title}"`);
      const newSteamUrl = await searchWorkingSteamImage(game.title);
      if (newSteamUrl) {
        game.image = newSteamUrl;
        steamFound++;
        console.log(`   └─> Found Steam working image: ${newSteamUrl}`);
      } else {
        game.image = generateXboxCoverBase64(game.title);
        svgGenerated++;
        console.log(`   └─> Generated Base64 Xbox Cover SVG`);
      }
      fixedCount++;
    }

    if ((i + 1) % 25 === 0) {
      fs.writeFileSync(GAMES_FILE, JSON.stringify(games, null, 2), 'utf-8');
      console.log(`Progress: ${i + 1}/${games.length} (Valid: ${validCount}, Fixed: ${fixedCount})`);
    }
  }

  fs.writeFileSync(GAMES_FILE, JSON.stringify(games, null, 2), 'utf-8');
  console.log(`\n🎉 DONE! Valid: ${validCount}, Fixed: ${fixedCount} (New Steam URLs: ${steamFound}, Base64 Xbox Covers: ${svgGenerated})`);
}

main().catch(console.error);

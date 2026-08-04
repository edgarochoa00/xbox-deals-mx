const fs = require('fs');
const path = require('path');

const GAMES_FILE = path.resolve(__dirname, '../public/data/games.json');

const DLC_KEYWORDS = [
  'dlc', 'addon', 'add-on', 'expansion', 'pass', 'pase', 'season pass', 
  'monedas', 'points', 'créditos', 'virtual currency', 'puntos', 'stubs', 
  'paquete', 'pack', 'skin', 'outfit', 'bundle', 'kit', 'upgrade', 
  'complemento', 'item', 'coins', 'gems', 'gemas', 'bucks', 'v-bucks'
];

function isBaseGame(title, platform) {
  const t = title.toLowerCase();
  const p = (platform || '').toLowerCase();

  // Rule 1: No Xbox 360 or Xbox Original
  if (t.includes('360') || p.includes('360') || t.includes('xbox original')) {
    return false;
  }

  // Rule 2: No DLCs, expansions, season passes, virtual currencies, or addons
  for (const kw of DLC_KEYWORDS) {
    if (t.includes(kw)) {
      return false;
    }
  }

  return true;
}

function cleanCatalog() {
  console.log('📖 Leyendo public/data/games.json...');
  const games = JSON.parse(fs.readFileSync(GAMES_FILE, 'utf-8'));

  console.log(`Analizando ${games.length} elementos...`);

  const filteredGames = games.filter(g => {
    const salePrice = Number(g.originalSalePrice) || 0;
    
    // Price range: $50 to $500 MXN
    if (salePrice < 50 || salePrice > 500) return false;

    // Check base game & no 360
    return isBaseGame(g.title, g.platform);
  });

  // Re-index IDs
  const cleanedGames = filteredGames.map((g, idx) => ({
    ...g,
    id: String(idx + 1)
  }));

  console.log(`✅ Resultado: Quedan ${cleanedGames.length} JUEGOS BASE COMPLETOS para Xbox One / Series X|S ($50 - $500 MXN).`);
  console.log(`❌ Se eliminaron ${games.length - cleanedGames.length} elementos que eran 360, DLCs o estaban fuera de rango.`);

  fs.writeFileSync(GAMES_FILE, JSON.stringify(cleanedGames, null, 2), 'utf-8');
  console.log('💾 Catálogo guardado en public/data/games.json');
}

cleanCatalog();

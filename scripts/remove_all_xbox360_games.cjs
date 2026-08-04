const fs = require('fs');
const path = require('path');

const GAMES_FILE = path.resolve(__dirname, '../public/data/games.json');

// Exact list of retro Xbox 360 / Original titles & franchises found in store
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

function clean360Games() {
  const games = JSON.parse(fs.readFileSync(GAMES_FILE, 'utf-8'));
  console.log(`Auditando ${games.length} juegos en el catálogo...`);

  const purged = [];
  const kept = [];

  games.forEach(g => {
    const t = g.title.toLowerCase();
    const p = (g.platform || '').toLowerCase();

    let is360 = false;
    for (const kw of RETRO_360_KEYWORDS) {
      if (t.includes(kw) || p.includes(kw)) {
        is360 = true;
        break;
      }
    }

    if (is360) {
      purged.push(g.title);
    } else {
      kept.push(g);
    }
  });

  console.log(`❌ Eliminados ${purged.length} juegos de Xbox 360/Original:`);
  purged.forEach(t => console.log(`   - ${t}`));

  // Re-index IDs
  const cleaned = kept.map((g, idx) => ({ ...g, id: String(idx + 1) }));

  fs.writeFileSync(GAMES_FILE, JSON.stringify(cleaned, null, 2), 'utf-8');
  console.log(`\n✅ ¡Catálogo Limpio! Quedan ${cleaned.length} juegos nativos de Xbox One y Xbox Series X|S.`);
}

clean360Games();

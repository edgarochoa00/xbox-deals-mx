const fs = require('fs');

const rawData = fs.readFileSync('raw_data.txt', 'utf8').split('\n').map(l => l.trim()).filter(l => l);

const games = [];
let currentTitle = '';
let originalPrice = 0;

for (let i = 0; i < rawData.length; i++) {
  const line = rawData[i];
  if (line.includes('<USER_REQUEST>')) continue;
  if (line.includes('agrega los juegos')) continue;
  
  if (line === 'no hay ningún subtítulo disponible') continue;
  
  if (line.startsWith('MXN$')) {
    const priceStr = line.replace('MXN$', '').replace('+', '').replace(',', '');
    const price = parseFloat(priceStr);
    
    if (originalPrice === 0) {
      originalPrice = price;
    }
  } else if (line.startsWith('-') && line.endsWith('%')) {
    if (currentTitle && originalPrice > 0) {
      games.push({ title: currentTitle, originalSalePrice: originalPrice });
    }
    currentTitle = '';
    originalPrice = 0;
  } else {
    currentTitle = line;
    originalPrice = 0;
  }
}

const existingGames = JSON.parse(fs.readFileSync('public/data/games.json', 'utf8'));
const existingTitles = new Set(existingGames.map(g => g.title.toLowerCase()));

let maxId = existingGames.reduce((max, g) => Math.max(max, parseInt(g.id) || 0), 0);

const keywordsToExclude = [
  'capítulo', 'capitulo', 'pack', 'paquete', 'bundle', 'dlc', 'character', 'mapas', 
  'season pass', 'zen', 'tokens', 'monedas', 'disfraz', 'conjunto', 'traje', 'ropa', 
  'canciones', 'pase', 'expansión', 'expansion', 'upgrade', 'mejora', 'lote', 'edición jason',
  'tokyo ghoul', 'castlevania', 'a nightmare on elm street', 'silent hill', 'the saw',
  'подземелья и драконы', 'all things wicked', 'sadako rising', 'doomed course', 'end transmission',
  'the walking dead', 'sinister grace', 'alien', 'viejas heridas', 'cuentos macabros', 'cacería interminable'
];

const isAddon = (title) => {
  const lowerTitle = title.toLowerCase();
  for (const kw of keywordsToExclude) {
    if (lowerTitle.includes(kw)) return true;
  }
  return false;
};

const newGames = games.filter(g => !existingTitles.has(g.title.toLowerCase()) && !isAddon(g.title));

const finalGames = [...existingGames];

for (const ng of newGames) {
  maxId++;
  const escapedTitle = ng.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='270'><rect width='480' height='270' fill='#2a2a2a'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20px' fill='#ffffff'>${escapedTitle}</text></svg>`;
  
  finalGames.push({
    id: maxId.toString(),
    title: ng.title,
    image: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    originalSalePrice: ng.originalSalePrice,
    platform: "Xbox One, Series X|S"
  });
}

fs.writeFileSync('public/data/games.json', JSON.stringify(finalGames, null, 2));

console.log(`Added ${newGames.length} new games.`);

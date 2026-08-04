const fs = require('fs');
const path = require('path');

const GAMES_FILE = path.resolve(__dirname, '../public/data/games.json');

function purgeNonDeals() {
  console.log('📖 Leyendo public/data/games.json para auditar ofertas reales...');
  const games = JSON.parse(fs.readFileSync(GAMES_FILE, 'utf-8'));

  console.log(`Auditando ${games.length} juegos...`);

  const realDeals = [];
  const rejected = [];

  games.forEach(g => {
    const salePrice = Number(g.originalSalePrice) || 0;
    const fullPrice = Number(g.originalFullPrice) || 0;
    const discountStr = g.discount || '';

    // Extract numerical discount percentage
    const discMatch = discountStr.match(/\d+/);
    const discPct = discMatch ? parseInt(discMatch[0]) : 0;

    // Check if truly on sale:
    // Must have a discount percentage >= 5% OR fullPrice must be strictly higher than salePrice
    const isRealDeal = (discPct >= 5) || (fullPrice > salePrice && (fullPrice - salePrice) >= 5);

    if (isRealDeal && salePrice >= 50 && salePrice <= 500) {
      realDeals.push(g);
    } else {
      rejected.push({ title: g.title, discountStr, salePrice, fullPrice });
    }
  });

  console.log(`❌ Rechazados ${rejected.length} elementos que NO ESTABAN EN OFERTA REAL (0% descuento o precio regular):`);
  rejected.slice(0, 15).forEach(r => {
    console.log(`   - "${r.title}": Precio $${r.salePrice} MXN, Descuento: "${r.discountStr}"`);
  });

  // Re-index IDs
  const cleaned = realDeals.map((g, idx) => ({ ...g, id: String(idx + 1) }));

  fs.writeFileSync(GAMES_FILE, JSON.stringify(cleaned, null, 2), 'utf-8');
  console.log(`\n✅ ¡Catálogo Purificado! Quedan ${cleaned.length} JUEGOS EN OFERTA REAL ACTIVA ($50 a $500 MXN).`);
}

purgeNonDeals();

const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../raw_input.txt');
const rawData = fs.readFileSync(inputPath, 'utf8').split('\n').map(line => line.trim()).filter(line => line.length > 0);

const newGames = [];
let i = 0;

while (i < rawData.length) {
    const title = rawData[i++];
    if (!title || i >= rawData.length) break;

    const price1Str = rawData[i++];
    let originalPrice = 0;
    let salePrice = 0;
    let discount = "";

    // Parse prices
    const parsePrice = (str) => {
        return parseFloat(str.replace(/MXN\$|,|\+/g, '').trim());
    };

    if (rawData[i] && rawData[i].startsWith('MXN$')) {
        // We have two prices
        const price2Str = rawData[i++];
        originalPrice = parsePrice(price1Str);
        salePrice = parsePrice(price2Str);
        
        // Next might be discount
        if (rawData[i] && rawData[i].endsWith('%')) {
            discount = rawData[i++];
        } else {
            discount = "-0%";
        }
    } else {
        // We have only one price (no discount)
        originalPrice = parsePrice(price1Str);
        salePrice = originalPrice;
        discount = "-0%";
    }

    // Skip subtitle lines like "no hay ningún subtítulo disponible"
    while (i < rawData.length && (rawData[i].includes('subtítulo') || rawData[i].includes('disponible') || rawData[i].startsWith('Incluido con'))) {
        i++;
    }

    newGames.push({ title, originalPrice, salePrice, discount });
}

console.log(`Parsed ${newGames.length} new games.`);

// Now we need to append these to build_games_json.cjs
const buildScriptPath = path.join(__dirname, 'build_games_json.cjs');
let buildScript = fs.readFileSync(buildScriptPath, 'utf8');

// Find the start of the rawGames array
const arrayStartStr = 'const rawGames = [\n';
const arrayStartIdx = buildScript.indexOf(arrayStartStr);

if (arrayStartIdx !== -1) {
    const insertIdx = arrayStartIdx + arrayStartStr.length;
    
    // Create the string to insert
    const insertStr = newGames.map(g => {
        return `  { title: ${JSON.stringify(g.title)}, originalPrice: ${g.originalPrice}, salePrice: ${g.salePrice}, discount: "${g.discount}" },`;
    }).join('\n') + '\n';
    
    const newBuildScript = buildScript.slice(0, insertIdx) + insertStr + buildScript.slice(insertIdx);
    fs.writeFileSync(buildScriptPath, newBuildScript, 'utf8');
    console.log('Successfully injected into build_games_json.cjs');
} else {
    console.error('Could not find rawGames array in build_games_json.cjs');
}

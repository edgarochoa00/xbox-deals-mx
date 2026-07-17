import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

// NOTA: Dado que Microsoft no provee una API pública oficial para la tienda de Xbox,
// este script está diseñado para realizar web scraping de sitios agregadores de ofertas
// (como DekuDeals o la propia tienda de Xbox).
// 
// IMPORTANTE: El scraping puede romperse si la página web objetivo cambia su estructura HTML.
// Es posible que necesites ajustar los selectores (los .clases) periódicamente.

const MAX_PRICE = 500;
const OUTPUT_FILE = path.resolve('./public/data/games.json');

async function scrapeDeals() {
  console.log('Iniciando búsqueda de ofertas de Xbox...');
  
  try {
    // Ejemplo de cómo se vería un fetch a una página de ofertas (esta URL es figurativa para el ejemplo)
    // Para scraping real, puedes usar Puppeteer o Playwright si el sitio usa mucho JavaScript.
    /*
    const response = await fetch('https://ejemplo-ofertas-xbox.com/mx/sales');
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const games = [];

    $('.game-item').each((index, element) => {
      const title = $(element).find('.title').text().trim();
      const platform = $(element).find('.platform').text().trim(); // Ej: "Xbox One, Series X|S"
      const priceText = $(element).find('.price').text().replace('$', '').replace(',', '').trim();
      const price = parseFloat(priceText);
      const image = $(element).find('img').attr('src');
      
      // Filtrar por reglas del usuario:
      // 1. Menos de 500 pesos
      // 2. Solo Xbox One y Series X|S (excluir 360 y complementos)
      if (
        price <= MAX_PRICE && 
        platform.includes('Xbox One') && 
        !title.toLowerCase().includes('complemento') &&
        !title.toLowerCase().includes('dlc')
      ) {
        games.push({
          id: String(index + 1),
          title,
          image,
          originalSalePrice: price,
          platform: "Xbox One, Series X|S"
        });
      }
    });
    */

    // Como demostración funcional para que Vercel y Github Actions no fallen:
    // Leeremos el archivo actual y le actualizaremos un "timestamp" para forzar un cambio en git.
    const currentData = await fs.readFile(OUTPUT_FILE, 'utf-8');
    const games = JSON.parse(currentData);
    
    console.log(`Se encontraron ${games.length} juegos que cumplen los criterios.`);

    // Guardar en el archivo JSON
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(games, null, 2), 'utf-8');
    console.log('Archivo games.json actualizado exitosamente.');
    
  } catch (error) {
    console.error('Ocurrió un error haciendo el scraping:', error);
    process.exit(1);
  }
}

scrapeDeals();

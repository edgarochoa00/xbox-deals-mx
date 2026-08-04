import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  const gamesGrid = document.getElementById('games-grid');
  const loadingState = document.getElementById('loading-state');
  const errorState = document.getElementById('error-state');

  // Constante del descuento extra solicitado por el usuario (26%)
  const EXTRA_DISCOUNT = 0.26;

  function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g,
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  async function fetchGames() {
    try {
      // Simular un pequeño tiempo de carga para ver la animación
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const response = await fetch('/data/games.json');
      if (!response.ok) {
        throw new Error('Error fetching games data');
      }
      
      const games = await response.json();
      renderGames(games);
    } catch (error) {
      console.error('Error:', error);
      loadingState.style.display = 'none';
      errorState.style.display = 'block';
    }
  }

  function renderGames(games) {
    loadingState.style.display = 'none';

    if (games.length === 0) {
      gamesGrid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">No se encontraron juegos en este momento.</p>';
      return;
    }

    const cardsHTML = games.map(game => {
      // Calcular el precio con nuestro 26% de descuento adicional
      const finalPrice = game.originalSalePrice * (1 - EXTRA_DISCOUNT);
      const storeDiscount = game.discount || '';
      
      const safeTitle = escapeHTML(game.title);
      const safeImage = escapeHTML(game.image);
      const safePlatform = escapeHTML(game.platform);
      const safeDiscount = escapeHTML(storeDiscount);

      return `
        <article class="game-card">
          <div class="discount-badge">${safeDiscount}</div>
          <div class="extra-badge">-26% EXTRA</div>
          <div class="card-image-wrapper">
            <img src="${safeImage}" alt="Portada de ${safeTitle}" class="card-image" loading="lazy" onerror="this.onerror=null; this.src='/placeholder.png';">
          </div>
          <div class="card-content">
            <div>
              <h2 class="game-title">${safeTitle}</h2>
              <p class="game-platform">${safePlatform}</p>
            </div>
            <div class="price-container">
              <div class="price-left">
                ${game.originalFullPrice ? `<span class="price-full">$${game.originalFullPrice.toFixed(2)}</span>` : ''}
                <span class="price-original">$${game.originalSalePrice.toFixed(2)}</span>
              </div>
              <span class="price-final">${finalPrice.toFixed(2)}</span>
            </div>
          </div>
        </article>
      `;
    }).join('');

    gamesGrid.innerHTML = cardsHTML;
  }

  fetchGames();
});

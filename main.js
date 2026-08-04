import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  const gamesGrid = document.getElementById('games-grid');
  const loadingState = document.getElementById('loading-state');
  const errorState = document.getElementById('error-state');
  const emptyState = document.getElementById('empty-state');
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search');
  const totalCountEl = document.getElementById('total-count');
  const filterPills = document.querySelectorAll('.pill');

  const EXTRA_DISCOUNT = 0.26;
  let allGames = [];
  let currentFilter = 'all';
  let currentSearchQuery = '';

  async function fetchGames() {
    try {
      const response = await fetch('/data/games.json');
      if (!response.ok) throw new Error('Error fetching games data');
      
      allGames = await response.json();
      loadingState.style.display = 'none';
      
      // Update count
      totalCountEl.textContent = allGames.length;
      
      applyFiltersAndRender();
    } catch (error) {
      console.error('Error:', error);
      loadingState.style.display = 'none';
      errorState.style.display = 'block';
    }
  }

  function applyFiltersAndRender() {
    let filtered = [...allGames];

    // Search query filter
    if (currentSearchQuery.trim() !== '') {
      const query = currentSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(g => g.title.toLowerCase().includes(query));
    }

    // Filter pills logic
    if (currentFilter === 'under100') {
      filtered = filtered.filter(g => {
        const finalPrice = g.originalSalePrice * (1 - EXTRA_DISCOUNT);
        return finalPrice <= 100;
      });
    } else if (currentFilter === 'under250') {
      filtered = filtered.filter(g => {
        const finalPrice = g.originalSalePrice * (1 - EXTRA_DISCOUNT);
        return finalPrice <= 250;
      });
    } else if (currentFilter === 'topDiscounts') {
      // Sort by highest store discount percent
      filtered.sort((a, b) => {
        const getPct = (str) => parseInt((str || '0').replace(/[^0-9]/g, '')) || 0;
        return getPct(b.discount) - getPct(a.discount);
      });
    }

    renderGames(filtered);
  }

  function renderGames(games) {
    if (games.length === 0) {
      gamesGrid.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    const cardsHTML = games.map(game => {
      const finalPrice = (game.originalSalePrice * (1 - EXTRA_DISCOUNT)).toFixed(2);
      const storeDiscount = game.discount || '';
      
      return `
        <article class="game-card">
          <div class="badge-group">
            ${storeDiscount ? `<div class="discount-badge">${storeDiscount}</div>` : '<div></div>'}
            <div class="extra-badge">-26% EXTRA</div>
          </div>
          
          <div class="card-image-wrapper">
            <img src="${game.image}" alt="" class="card-image-blur" loading="lazy">
            <img src="${game.image}" alt="Portada de ${game.title}" class="card-image" loading="lazy" onerror="this.onerror=null; this.src='/placeholder.png'; this.previousElementSibling.src='/placeholder.png';">
          </div>
          
          <div class="card-content">
            <div>
              <h2 class="game-title" title="${game.title}">${game.title}</h2>
              <p class="game-platform">${game.platform || 'Xbox Series X|S / Xbox One'}</p>
            </div>
            
            <div class="price-container">
              <div class="price-stack">
                <span class="price-original">$${game.originalSalePrice.toFixed(2)}</span>
              </div>
              <div class="price-final-group">
                <span class="currency">$</span>
                <span class="price-final">${finalPrice}</span>
                <span class="mxn-tag">MXN</span>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');

    gamesGrid.innerHTML = cardsHTML;
  }

  // Event Listeners for Filters
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.dataset.filter;
      applyFiltersAndRender();
    });
  });

  // Event Listeners for Search
  searchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value;
    clearSearchBtn.style.display = currentSearchQuery.length > 0 ? 'block' : 'none';
    applyFiltersAndRender();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentSearchQuery = '';
    clearSearchBtn.style.display = 'none';
    applyFiltersAndRender();
  });

  fetchGames();
});

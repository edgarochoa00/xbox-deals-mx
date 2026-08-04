import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // UI Elements
  const gamesGrid = document.getElementById('games-grid');
  const loadingState = document.getElementById('loading-state');
  const errorState = document.getElementById('error-state');
  const emptyState = document.getElementById('empty-state');
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search');
  const totalCountEl = document.getElementById('total-count');
  const filterPills = document.querySelectorAll('.pill');
  const sortSelect = document.getElementById('sort-select');
  const viewGridBtn = document.getElementById('view-grid-btn');
  const viewListBtn = document.getElementById('view-list-btn');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const favSummaryBanner = document.getElementById('fav-summary-banner');
  const favTotalSavingsText = document.getElementById('fav-total-savings-text');

  // Stats elements
  const statTotalGames = document.getElementById('stat-total-games');
  const statMaxDiscount = document.getElementById('stat-max-discount');
  const statUnder100 = document.getElementById('stat-under-100');
  const statFavsCount = document.getElementById('stat-favs-count');
  const favCountPill = document.getElementById('fav-count-pill');
  const tickerStatus = document.getElementById('ticker-status');

  // Spotlight elements
  const spotlightSection = document.getElementById('spotlight-section');
  const spotlightBg = document.getElementById('spotlight-bg');
  const spotlightImg = document.getElementById('spotlight-img');
  const spotlightTitle = document.getElementById('spotlight-title');
  const spotlightPlatform = document.getElementById('spotlight-platform');
  const spotlightOrig = document.getElementById('spotlight-orig');
  const spotlightFinal = document.getElementById('spotlight-final');
  const spotlightSavings = document.getElementById('spotlight-savings');
  const spotlightDetailsBtn = document.getElementById('spotlight-details-btn');
  const spotlightFavBtn = document.getElementById('spotlight-fav-btn');

  // Modal elements
  const gameModal = document.getElementById('game-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalImg = document.getElementById('modal-img');
  const modalTagDiscount = document.getElementById('modal-tag-discount');
  const modalTitle = document.getElementById('modal-title');
  const modalPlatform = document.getElementById('modal-platform');
  const modalPriceOrig = document.getElementById('modal-price-orig');
  const modalPriceFinal = document.getElementById('modal-price-final');
  const modalSavingsVal = document.getElementById('modal-savings-val');
  const modalPctTag = document.getElementById('modal-pct-tag');
  const modalProgressBar = document.getElementById('modal-progress-bar');
  const modalStoreBtn = document.getElementById('modal-store-btn');
  const modalShareBtn = document.getElementById('modal-share-btn');

  const EXTRA_DISCOUNT = 0.26;
  let allGames = [];
  let currentFilter = 'all';
  let currentSearchQuery = '';
  let currentSort = 'topGames';
  let currentViewMode = 'grid';
  let favorites = JSON.parse(localStorage.getItem('xbox_deals_favs') || '[]');
  let soundEnabled = false;
  let activeSpotlightGame = null;
  let activeModalGame = null;

  // XSS Protection & Sanitization Helper
  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const TOP_KEYWORDS = [
    'red dead', 'cyberpunk', 'grand theft auto', 'gta', 'halo', 'witcher',
    'hogwarts legacy', 'ea sports fc', 'resident evil', 'star wars jedi',
    'spyro', 'mass effect', 'borderlands', 'it takes two', 'battlefield',
    'bioshock', 'mafia', 'mortal kombat', 'injustice', 'titanfall',
    'fallout', "assassin's creed", 'far cry', 'diablo', 'overcooked',
    'forza', 'gears', 'call of duty', 'nba 2k', 'lego', 'tomb raider',
    'batman', 'fifa', 'need for speed', 'naruto', 'dragon ball'
  ];

  function calculateTopScore(game) {
    let score = 0;
    const titleLower = (game.title || '').toLowerCase();
    
    TOP_KEYWORDS.forEach((kw, index) => {
      if (titleLower.includes(kw)) {
        score += (TOP_KEYWORDS.length - index) * 100;
      }
    });

    score += (game.discountPct || 0);

    if (game.image && !game.image.startsWith('data:image/svg')) {
      score += 50;
    }

    return score;
  }

  // Web Audio FX Generator for Xbox Click Chime
  function playXboxSound() {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.08); // C6

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      console.warn('Audio FX error:', e);
    }
  }

  // Toast Notification System (Safe textContent)
  function showToast(message) {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // Fetch Games Data
  async function fetchGames() {
    try {
      const response = await fetch('/data/games.json');
      if (!response.ok) throw new Error('Error fetching games data');
      
      const rawGames = await response.json();
      
      // Process and enrich game items adhering strictly to the 4 rules
      allGames = rawGames
        .filter(g => {
          const salePrice = Number(g.originalSalePrice) || 0;
          const titleLower = (g.title || '').toLowerCase();
          const platformLower = (g.platform || '').toLowerCase();

          // REGLA 1: Rango de precio $50 a $500 MXN
          if (salePrice < 50 || salePrice > 500) return false;

          // REGLA 3: No Xbox 360 / No Xbox Original
          if (titleLower.includes('xbox 360') || platformLower.includes('360') || titleLower.includes('xbox original') || titleLower.includes(' 360')) return false;

          // REGLA 4: Solo juegos base (No DLCs, no complementos, no monedas, no pases, no skins)
          const dlcKeywords = [
            'dlc', 'addon', 'add-on', 'expansion', 'pass', 'pase', 'season pass', 
            'monedas', 'points', 'créditos', 'virtual currency', 'puntos', 'stubs', 
            'paquete', 'pack', 'skin', 'outfit', 'bundle', 'kit', 'upgrade', 
            'complemento', 'item', 'coins', 'gems', 'gemas', 'bucks', 'v-bucks'
          ];

          for (const kw of dlcKeywords) {
            if (titleLower.includes(kw)) return false;
          }

          return true;
        })
        .map(g => {
          const salePrice = Number(g.originalSalePrice) || 0;
          const fullPrice = Number(g.originalFullPrice) || salePrice;
          const finalPrice = Number((salePrice * (1 - EXTRA_DISCOUNT)).toFixed(2));
          const savings = Number((fullPrice - finalPrice).toFixed(2));
          const discountPct = parseInt((g.discount || '0').replace(/[^0-9]/g, '')) || 0;

          return {
            ...g,
            finalPrice,
            savings,
            discountPct,
            fullPrice
          };
        });

      loadingState.style.display = 'none';
      
      // Compute dashboard stats
      updateDashboardStats();

      // Render Spotlight top deal
      setupSpotlight();

      // Render initial catalog
      applyFiltersAndRender();
    } catch (error) {
      console.error('Fetch error:', error);
      loadingState.style.display = 'none';
      errorState.style.display = 'block';
    }
  }

  // Dashboard Stats Computation
  function updateDashboardStats() {
    statTotalGames.textContent = allGames.length;
    totalCountEl.textContent = allGames.length;

    const maxDisc = Math.max(...allGames.map(g => g.discountPct), 0);
    statMaxDiscount.textContent = `-${maxDisc}%`;

    const under100Count = allGames.filter(g => g.finalPrice <= 100).length;
    statUnder100.textContent = under100Count;

    statFavsCount.textContent = favorites.length;
    favCountPill.textContent = favorites.length;

    tickerStatus.textContent = `${allGames.length} Ofertas activas en México`;

    // Favorites Cumulative Savings Calculation
    const favGames = allGames.filter(g => favorites.includes(g.id));
    const totalFavSavings = favGames.reduce((sum, g) => sum + g.savings, 0);

    if (currentFilter === 'favorites' && favGames.length > 0) {
      favSummaryBanner.style.display = 'block';
      favTotalSavingsText.textContent = `${favGames.length} juegos guardados · Ahorro total acumulado: $${totalFavSavings.toFixed(2)} MXN`;
    } else {
      favSummaryBanner.style.display = 'none';
    }
  }

  // Spotlight Top Deal
  function setupSpotlight() {
    if (allGames.length === 0) return;

    const topDeal = [...allGames].sort((a, b) => b.savings - a.savings)[0];
    if (!topDeal) return;

    activeSpotlightGame = topDeal;
    spotlightBg.style.backgroundImage = `url("${escapeHTML(topDeal.image)}")`;
    spotlightImg.src = topDeal.image;
    spotlightTitle.textContent = topDeal.title;
    spotlightPlatform.textContent = topDeal.platform || 'XBOX ONE / SERIES X|S';
    spotlightOrig.textContent = `$${topDeal.salePrice ? topDeal.salePrice.toFixed(2) : topDeal.originalSalePrice.toFixed(2)}`;
    spotlightFinal.textContent = topDeal.finalPrice.toFixed(2);
    spotlightSavings.textContent = `¡Ahorras $${topDeal.savings.toFixed(2)} MXN!`;

    updateSpotlightFavButton();

    spotlightDetailsBtn.onclick = () => {
      playXboxSound();
      openGameModal(topDeal);
    };

    spotlightFavBtn.onclick = () => {
      playXboxSound();
      toggleFavorite(topDeal.id);
      updateSpotlightFavButton();
    };

    spotlightSection.style.display = 'block';
  }

  function updateSpotlightFavButton() {
    if (!activeSpotlightGame) return;
    const isFav = favorites.includes(activeSpotlightGame.id);
    if (isFav) {
      spotlightFavBtn.classList.add('active');
    } else {
      spotlightFavBtn.classList.remove('active');
    }
  }

  // Filter & Sort Engine
  function applyFiltersAndRender() {
    let filtered = [...allGames];

    // Search Filter
    if (currentSearchQuery.trim() !== '') {
      const query = currentSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(g => g.title.toLowerCase().includes(query));
    }

    // Category Pill Filter
    if (currentFilter === 'under100') {
      filtered = filtered.filter(g => g.finalPrice <= 100);
    } else if (currentFilter === 'under250') {
      filtered = filtered.filter(g => g.finalPrice <= 250);
    } else if (currentFilter === 'topDiscounts') {
      filtered = filtered.filter(g => g.discountPct >= 70);
    } else if (currentFilter === 'favorites') {
      filtered = filtered.filter(g => favorites.includes(g.id));
    }

    // Update Favorites Banner visibility
    updateDashboardStats();

    // Sorting Engine
    if (currentSort === 'topGames') {
      filtered.sort((a, b) => calculateTopScore(b) - calculateTopScore(a));
    } else if (currentSort === 'discount') {
      filtered.sort((a, b) => b.discountPct - a.discountPct);
    } else if (currentSort === 'savings') {
      filtered.sort((a, b) => b.savings - a.savings);
    } else if (currentSort === 'priceAsc') {
      filtered.sort((a, b) => a.finalPrice - b.finalPrice);
    } else if (currentSort === 'priceDesc') {
      filtered.sort((a, b) => b.finalPrice - a.finalPrice);
    } else if (currentSort === 'title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    renderGames(filtered);
  }

  // Dynamic Xbox Cover Generator for Fallback (Pure Base64)
  function getFallbackSvgUrl(title) {
    const cleanTitle = (title || 'Juego Xbox')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
      
    const words = cleanTitle.split(' ');
    let line1 = cleanTitle;
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
      </defs>
      <rect width='600' height='337' fill='url(#bg)'/>
      <rect width='600' height='337' fill='url(#glow)'/>
      <circle cx='300' cy='105' r='32' fill='none' stroke='#00e676' stroke-width='3' opacity='0.85'/>
      <path d='M277 92 Q300 120 323 92 Q300 144 277 92 Z' fill='#00e676' opacity='0.85'/>
      <text x='300' y='${line2 ? 200 : 215}' text-anchor='middle' font-family='sans-serif' font-weight='800' font-size='20px' fill='#ffffff'>${line1}</text>
      ${line2 ? `<text x='300' y='230' text-anchor='middle' font-family='sans-serif' font-weight='800' font-size='20px' fill='#ffffff'>${line2}</text>` : ''}
      <rect x='220' y='260' width='160' height='24' rx='12' fill='#107c10' opacity='0.9'/>
      <text x='300' y='276' text-anchor='middle' font-family='sans-serif' font-weight='700' font-size='11px' fill='#ffffff' letter-spacing='2'>XBOX GAME</text>
    </svg>`;

    return 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svg)));
  }

  // Helper for Chollo Badges
  function getCholloBadge(discountPct) {
    if (discountPct >= 75) {
      return `<span class="chollo-badge legendary">🏆 CHOLLO LEGENDARIO</span>`;
    } else if (discountPct >= 50) {
      return `<span class="chollo-badge epic">⚡ CHOLLO ÉPICO</span>`;
    }
    return `<span class="chollo-badge recommended">🎮 OFERTA RECOMENDADA</span>`;
  }

  // Render Games with XSS Protection & UX Enhancements
  function renderGames(games) {
    if (games.length === 0) {
      gamesGrid.innerHTML = '';
      emptyState.style.display = 'block';
      if (currentFilter === 'favorites') {
        document.getElementById('empty-msg').textContent = 'Aún no has guardado ningún juego en tus favoritos. Toca el icono de corazón en cualquier tarjeta.';
      } else {
        document.getElementById('empty-msg').textContent = 'No encontramos ninguna oferta que coincida con tu búsqueda actual.';
      }
      return;
    }

    emptyState.style.display = 'none';

    const cardsHTML = games.map(game => {
      const isFav = favorites.includes(game.id);
      const safeId = escapeHTML(game.id);
      const safeTitle = escapeHTML(game.title);
      const safeImage = escapeHTML(game.image);
      const safePlatform = escapeHTML(game.platform || 'Xbox One / Series X|S');
      const safeStoreDiscount = escapeHTML(game.discount || '');
      const formattedOrig = escapeHTML(game.originalSalePrice ? game.originalSalePrice.toFixed(2) : '0.00');
      const formattedFinal = escapeHTML(game.finalPrice.toFixed(2));
      const formattedSavings = escapeHTML(game.savings.toFixed(2));
      const cholloBadge = getCholloBadge(game.discountPct);

      return `
        <article class="game-card" data-id="${safeId}">
          <div class="card-top-bar">
            <div class="badge-stack">
              ${safeStoreDiscount ? `<div class="discount-badge">${safeStoreDiscount}</div>` : ''}
              <div class="extra-badge">-26% EXTRA</div>
            </div>
            <button class="fav-btn ${isFav ? 'is-favorite' : ''}" data-id="${safeId}" title="${isFav ? 'Quitar de Favoritos' : 'Agregar a Favoritos'}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </button>
          </div>
          
          <div class="card-image-wrapper">
            <img src="${safeImage}" alt="" class="card-image-blur" loading="lazy">
            <img src="${safeImage}" alt="${safeTitle}" class="card-image" loading="lazy" data-title="${safeTitle}">
          </div>
          
          <div class="card-content">
            <div>
              <div style="margin-bottom: 6px;">${cholloBadge}</div>
              <h2 class="game-title" title="${safeTitle}">${safeTitle}</h2>
              <p class="game-platform">${safePlatform}</p>
              <div class="savings-pill">
                <span>Ahorras $${formattedSavings} MXN</span>
              </div>
            </div>
            
            <div class="price-container">
              <span class="price-original">$${formattedOrig}</span>
              <div class="price-final-group">
                <span class="currency">$</span>
                <span class="price-final">${formattedFinal}</span>
                <span class="mxn-tag">MXN</span>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');

    gamesGrid.innerHTML = cardsHTML;

    // Attach Image error handlers safely
    document.querySelectorAll('.card-image').forEach(img => {
      img.addEventListener('error', () => {
        const title = img.dataset.title || 'Juego Xbox';
        const fallback = getFallbackSvgUrl(title);
        img.src = fallback;
        if (img.previousElementSibling) {
          img.previousElementSibling.src = fallback;
        }
      });
    });

    // Attach Event Listeners to cards
    document.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.fav-btn')) return;
        
        playXboxSound();
        const id = card.dataset.id;
        const targetGame = allGames.find(g => g.id === id);
        if (targetGame) openGameModal(targetGame);
      });
    });

    // Attach Event Listeners to Favorite buttons inside cards
    document.querySelectorAll('.fav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        playXboxSound();
        const id = btn.dataset.id;
        toggleFavorite(id);
      });
    });
  }

  // Favorite Toggle Logic
  function toggleFavorite(id) {
    if (favorites.includes(id)) {
      favorites = favorites.filter(favId => favId !== id);
      showToast('Eliminado de tus Favoritos');
    } else {
      favorites.push(id);
      showToast('Guardado en tus Favoritos');
    }

    localStorage.setItem('xbox_deals_favs', JSON.stringify(favorites));
    updateDashboardStats();
    updateSpotlightFavButton();
    applyFiltersAndRender();
  }

  // Modal Open & Render with Interactive Visual Savings Bar
  function openGameModal(game) {
    activeModalGame = game;
    modalImg.src = game.image;
    modalTagDiscount.textContent = game.discount || '-0%';
    modalTitle.textContent = game.title;
    modalPlatform.textContent = (game.platform || 'XBOX ONE / SERIES X|S').toUpperCase();
    modalPriceOrig.textContent = `$${game.originalSalePrice ? game.originalSalePrice.toFixed(2) : '0.00'} MXN`;
    modalPriceFinal.textContent = game.finalPrice.toFixed(2);
    modalSavingsVal.textContent = `$${game.savings.toFixed(2)} MXN`;

    // Interactive Savings Progress Bar Calculation
    const totalSavingsPct = game.fullPrice > 0 ? Math.round((game.savings / game.fullPrice) * 100) : game.discountPct;
    modalPctTag.textContent = `-${totalSavingsPct}% Ahorro Total`;
    
    setTimeout(() => {
      modalProgressBar.style.width = `${Math.min(totalSavingsPct, 100)}%`;
    }, 50);

    const storeSearchUrl = `https://www.xbox.com/es-mx/Search/Results?q=${encodeURIComponent(game.title)}`;
    modalStoreBtn.href = storeSearchUrl;

    gameModal.style.display = 'flex';
  }

  function closeModal() {
    gameModal.style.display = 'none';
    modalProgressBar.style.width = '0%';
    activeModalGame = null;
  }

  // Filter Pills Handlers
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      playXboxSound();
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.dataset.filter;
      applyFiltersAndRender();
    });
  });

  // Sort Dropdown Handler
  sortSelect.addEventListener('change', (e) => {
    playXboxSound();
    currentSort = e.target.value;
    applyFiltersAndRender();
  });

  // View Mode Handlers
  viewGridBtn.addEventListener('click', () => {
    playXboxSound();
    viewGridBtn.classList.add('active');
    viewListBtn.classList.remove('active');
    gamesGrid.classList.remove('list-mode');
    gamesGrid.classList.add('grid-mode');
    currentViewMode = 'grid';
  });

  viewListBtn.addEventListener('click', () => {
    playXboxSound();
    viewListBtn.classList.active;
    viewListBtn.classList.add('active');
    viewGridBtn.classList.remove('active');
    gamesGrid.classList.remove('grid-mode');
    gamesGrid.classList.add('list-mode');
    currentViewMode = 'list';
  });

  // Search Input Handler
  searchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value;
    clearSearchBtn.style.display = currentSearchQuery.length > 0 ? 'block' : 'none';
    applyFiltersAndRender();
  });

  clearSearchBtn.addEventListener('click', () => {
    playXboxSound();
    searchInput.value = '';
    currentSearchQuery = '';
    clearSearchBtn.style.display = 'none';
    applyFiltersAndRender();
  });

  resetFiltersBtn.addEventListener('click', () => {
    playXboxSound();
    searchInput.value = '';
    currentSearchQuery = '';
    currentFilter = 'all';
    filterPills.forEach(p => p.classList.remove('active'));
    document.querySelector('.pill[data-filter="all"]').classList.add('active');
    applyFiltersAndRender();
  });

  // Sound FX Toggle Handler
  soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggleBtn.style.borderColor = soundEnabled ? 'var(--xbox-neon)' : 'var(--border-color)';
    soundToggleBtn.style.color = soundEnabled ? 'var(--xbox-neon)' : 'var(--text-secondary)';
    showToast(soundEnabled ? 'Sonidos de Xbox Activados' : 'Sonidos Desactivados');
    if (soundEnabled) playXboxSound();
  });

  // Modal Action Listeners
  modalCloseBtn.addEventListener('click', closeModal);
  gameModal.addEventListener('click', (e) => {
    if (e.target === gameModal) closeModal();
  });

  modalShareBtn.addEventListener('click', () => {
    playXboxSound();
    if (activeModalGame) {
      const shareUrl = window.location.origin;
      navigator.clipboard.writeText(`¡Mira este chollo en Xbox Deals! ${activeModalGame.title} a solo $${activeModalGame.finalPrice} MXN. ${shareUrl}`);
      showToast('Enlace de la oferta copiado al portapapeles');
    }
  });

  fetchGames();
});

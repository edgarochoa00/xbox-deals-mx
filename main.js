import './style.css';
import { isActiveDeal, priceBreakdown } from './src/deal-policy.js';

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

  let catalogCheckedAt = null;
  let catalogExpiresAt = null;
  let returnFocus = null;
  let allGames = [];
  let currentFilter = 'all';
  let currentSearchQuery = '';
  let currentSort = 'topGames';
  let currentViewMode = 'grid';
  let favorites = [];
  try {
    const saved = JSON.parse(localStorage.getItem('xbox_deals_favs_v2') || '[]');
    if (Array.isArray(saved)) favorites = saved.filter(id => typeof id === 'string');
  } catch { /* Storage may be unavailable or contain invalid JSON. */ }
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
    // Disabled in sleek/minimalist mode
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
      const response = await fetch('/data/games.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('Error fetching games data');
      
      const catalog = await response.json();
      if (catalog.schemaVersion !== 2 || !Array.isArray(catalog.games) ||
          !Number.isFinite(Date.parse(catalog.checkedAt)) || !Number.isFinite(Date.parse(catalog.expiresAt))) {
        throw new Error('El catálogo aún no cuenta con verificación de regalos.');
      }
      catalogCheckedAt = catalog.checkedAt;
      catalogExpiresAt = catalog.expiresAt;
      allGames = Date.now() < Date.parse(catalogExpiresAt)
        ? catalog.games.filter(g => isActiveDeal(g)).map(priceBreakdown) : [];
      document.getElementById('catalog-updated').textContent =
        `Última revisión: ${formatDate(catalogCheckedAt)} · Actualización cada 6 horas`;
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
      tickerStatus.textContent = 'Catálogo no disponible';
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

    const activeFavorites = allGames.filter(g => favorites.includes(g.id)).length;
    statFavsCount.textContent = activeFavorites;
    favCountPill.textContent = activeFavorites;

    tickerStatus.textContent = catalogExpiresAt && Date.now() >= Date.parse(catalogExpiresAt)
      ? 'Revisión pendiente' : `${allGames.length} ofertas verificadas · MX`;
    document.querySelector('.status-dot').classList.toggle('is-stale', !allGames.length);

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
    if (allGames.length === 0) { spotlightSection.style.display = 'none'; activeSpotlightGame = null; return; }

    const topDeal = [...allGames].sort((a, b) => calculateTopScore(b) - calculateTopScore(a))[0];
    if (!topDeal) return;

    activeSpotlightGame = topDeal;
    if (spotlightBg) spotlightBg.style.backgroundImage = `url("${escapeHTML(topDeal.image)}")`;
    spotlightImg.src = topDeal.image || getFallbackSvgUrl(topDeal.title);
    spotlightImg.alt = topDeal.title;
    spotlightImg.onerror = () => { spotlightImg.onerror = null; spotlightImg.src = getFallbackSvgUrl(topDeal.title); };
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
    spotlightFavBtn.setAttribute('aria-pressed', String(isFav));
    spotlightFavBtn.setAttribute('aria-label', `${isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}: ${activeSpotlightGame.title}`);
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

    document.getElementById('results-count').textContent = `${filtered.length} de ${allGames.length} ofertas`;
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
          <stop offset='0%' stop-color='#09090b'/>
          <stop offset='100%' stop-color='#18181b'/>
        </linearGradient>
      </defs>
      <rect width='600' height='337' fill='url(#bg)'/>
      <text x='300' y='${line2 ? 160 : 175}' text-anchor='middle' font-family='sans-serif' font-weight='600' font-size='24px' fill='#f4f4f5'>${line1}</text>
      ${line2 ? `<text x='300' y='195' text-anchor='middle' font-family='sans-serif' font-weight='600' font-size='24px' fill='#f4f4f5'>${line2}</text>` : ''}
      <rect x='220' y='240' width='160' height='28' rx='4' fill='#27272a' opacity='0.8'/>
      <text x='300' y='259' text-anchor='middle' font-family='sans-serif' font-weight='500' font-size='12px' fill='#a1a1aa' letter-spacing='1'>XBOX DEALS</text>
    </svg>`;

    return 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svg)));
  }

  // Render Games with XSS Protection & UX Enhancements
  function renderGames(games) {
    if (games.length === 0) {
      gamesGrid.innerHTML = '';
      emptyState.style.display = 'block';
      if (currentFilter === 'favorites') {
        document.getElementById('empty-msg').textContent = 'Aún no has guardado ningún juego en tus favoritos. Toca el icono de corazón en cualquier tarjeta.';
      } else {
        document.getElementById('empty-msg').textContent = !allGames.length
          ? 'No hay ofertas con verificación vigente. Vuelve después de la próxima actualización.'
          : 'No encontramos ninguna oferta que coincida con tu búsqueda actual.';
      }
      return;
    }

    emptyState.style.display = 'none';

    const cardsHTML = games.map(game => {
      const isFav = favorites.includes(game.id);
      const safeId = escapeHTML(game.id);
      const safeTitle = escapeHTML(game.title);
      const safeImage = escapeHTML(game.image || getFallbackSvgUrl(game.title));
      const safePlatform = escapeHTML(game.platform || 'Xbox One / Series X|S');
      const safeStoreDiscount = escapeHTML(game.discount || '');
      const formattedOrig = escapeHTML(game.originalSalePrice ? game.originalSalePrice.toFixed(2) : '0.00');
      const formattedFinal = escapeHTML(game.finalPrice.toFixed(2));
      const formattedSavings = escapeHTML(game.savings.toFixed(2));

      return `
        <article class="game-card" data-id="${safeId}">
          <div class="card-top-bar">
            <div class="badge-stack">
              ${safeStoreDiscount ? `<div class="discount-badge">${safeStoreDiscount}</div>` : ''}
              <div class="extra-badge">26% adicional</div>
            </div>
            <button class="fav-btn ${isFav ? 'is-favorite' : ''}" data-id="${safeId}" aria-pressed="${isFav}" aria-label="${isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}: ${safeTitle}" title="${isFav ? 'Quitar de Favoritos' : 'Agregar a Favoritos'}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </button>
          </div>
          
          <div class="card-image-wrapper">
            <img src="${safeImage}" alt="" class="card-image-blur" loading="lazy">
            <img src="${safeImage}" alt="${safeTitle}" class="card-image" loading="lazy" data-title="${safeTitle}">
          </div>
          
          <div class="card-content">
            <div>
              <h2 class="game-title"><button class="card-details" title="${safeTitle}">${safeTitle}</button></h2>
              <p class="game-platform">${safePlatform}</p>
              <p class="gift-label">Regalo disponible · ${game.kind === 'subscription' ? 'Suscripción' : 'Juego'}</p>
              <div class="savings-pill">
                <span>Ahorras $${formattedSavings} MXN</span>
              </div>
            </div>
            
            <div class="price-container">
              <span class="store-price-label">Xbox Store <span class="price-original">$${formattedOrig}</span></span>
              <div class="seller-price"><span class="seller-label">Nuestro precio</span><div class="price-final-group">
                <span class="currency">$</span>
                <span class="price-final">${formattedFinal}</span>
                <span class="mxn-tag">MXN</span>
              </div></div>
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
      }, { once: true });
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

    try { localStorage.setItem('xbox_deals_favs_v2', JSON.stringify(favorites)); } catch { showToast('Tu navegador no permite guardar favoritos permanentemente.'); }
    updateDashboardStats();
    updateSpotlightFavButton();
    applyFiltersAndRender();
  }

  // Modal Open & Render with Interactive Visual Savings Bar
  function openGameModal(game) {
    if (!isActiveDeal(game)) { expireDeals(); showToast('Esta oferta necesita una nueva verificación.'); return; }
    returnFocus = document.activeElement;
    activeModalGame = game;
    modalImg.src = game.image || getFallbackSvgUrl(game.title);
    modalImg.alt = game.title;
    modalImg.onerror = () => { modalImg.onerror = null; modalImg.src = getFallbackSvgUrl(game.title); };
    document.getElementById('modal-full-price').textContent = `$${game.fullPrice.toFixed(2)} MXN`;
    document.getElementById('modal-validity').textContent = `Regalo confirmado el ${formatDate(game.verifiedAt)}. Oferta hasta el ${formatDate(game.offerEndsAt)}.`;
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

    const storeSearchUrl = game.url || `https://www.xbox.com/es-mx/Search/Results?q=${encodeURIComponent(game.title)}`;
    modalStoreBtn.href = storeSearchUrl;

    gameModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    modalCloseBtn.focus();
  }

  function closeModal() {
    gameModal.style.display = 'none';
    modalProgressBar.style.width = '0%';
    activeModalGame = null;
    document.body.style.overflow = '';
    returnFocus?.focus();
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
    viewGridBtn.setAttribute('aria-pressed', 'true');
    viewListBtn.setAttribute('aria-pressed', 'false');
  });

  viewListBtn.addEventListener('click', () => {
    playXboxSound();
    viewListBtn.classList.add('active');
    viewGridBtn.classList.remove('active');
    gamesGrid.classList.remove('grid-mode');
    gamesGrid.classList.add('list-mode');
    currentViewMode = 'list';
    viewGridBtn.setAttribute('aria-pressed', 'false');
    viewListBtn.setAttribute('aria-pressed', 'true');
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
    clearSearchBtn.style.display = 'none';
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

  modalShareBtn.addEventListener('click', async () => {
    if (!activeModalGame || !isActiveDeal(activeModalGame)) { closeModal(); expireDeals(); return; }
    try {
      const game = activeModalGame;
      await navigator.clipboard.writeText(`${game.title}: $${game.originalSalePrice.toFixed(2)} MXN en Xbox Store. Nuestro precio: $${game.finalPrice.toFixed(2)} MXN con 26% adicional. ${game.url}`);
      showToast('Oferta copiada al portapapeles');
    } catch { showToast('No se pudo copiar. Abre la tienda para compartir su enlace.'); }
  });

  modalStoreBtn.addEventListener('click', e => {
    if (!activeModalGame || !isActiveDeal(activeModalGame)) { e.preventDefault(); closeModal(); expireDeals(); }
  });
  document.addEventListener('keydown', e => {
    if (!activeModalGame) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') {
      const elements = [...gameModal.querySelectorAll('button, a[href]')];
      const first = elements[0], last = elements.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  function formatDate(date) {
    return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
  }
  function expireDeals() {
    const valid = allGames.filter(g => isActiveDeal(g));
    if (valid.length === allGames.length) return;
    allGames = valid;
    if (activeModalGame && !isActiveDeal(activeModalGame)) closeModal();
    setupSpotlight();
    applyFiltersAndRender();
  }
  setInterval(expireDeals, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) expireDeals(); });
  fetchGames();
});

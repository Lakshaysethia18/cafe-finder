// ============================================
// CafeFinder Main Application Controller
// ============================================
window.CafeApp = (() => {
  let currentCafeDetail = null;
  let googleMapsLoaded = false;

  function init() {
    console.log('☕ CafeFinder initializing...');

    // Initialize 3D scene
    CafeScene.init();

    // Initialize search
    CafeSearch.init();

    // Initialize reviews
    CafeReviews.init();

    // Initialize scroll animations
    CafeUtils.initScrollAnimations();

    // Setup modal
    setupModal();

    // Setup navigation
    setupNav();

    // Setup sort dropdown
    setupSort();

    // Load Google Maps API dynamically
    loadGoogleMaps();

    // Hide loader
    setTimeout(() => {
      const loader = document.getElementById('loader');
      if (loader) {
        loader.classList.add('loaded');
        setTimeout(() => loader.style.display = 'none', 500);
      }
    }, 1500);

    // Animate stats counters
    animateCounters();

    console.log('☕ CafeFinder ready!');
  }

  function loadGoogleMaps() {
    // NOTE: For production, set your Google Maps API key in the Vercel environment variables
    // and create an endpoint that returns it, or embed it during build.
    // For development, replace 'YOUR_API_KEY' below with your actual key.
    const apiKey = '';
    
    if (apiKey === 'YOUR_API_KEY') {
      console.warn('⚠️ Google Maps API key not set. Map features will be limited.');
      console.warn('Replace YOUR_API_KEY in app.js with your actual Google Maps API key.');
      // Show a notice to the user
      const mapContainer = document.getElementById('map-container');
      if (mapContainer) {
        mapContainer.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;background:#1a1210;color:#c8956c;flex-direction:column;gap:16px;padding:40px;text-align:center;">
            <div style="font-size:48px;">🗺️</div>
            <h3>Google Maps API Key Required</h3>
            <p style="color:#c8b6a6;max-width:400px;">To enable the interactive map, add your Google Maps API key in <code>public/js/app.js</code></p>
          </div>
        `;
      }
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=onGoogleMapsLoaded`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  // Global callback for Google Maps API
  window.onGoogleMapsLoaded = function() {
    googleMapsLoaded = true;
    CafeMap.init();
    console.log('🗺️ Google Maps loaded');
  };

  function setupModal() {
    const modal = document.getElementById('cafe-modal');
    const closeBtn = modal?.querySelector('.modal-close');
    const overlay = modal?.querySelector('.modal-overlay');

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (overlay) overlay.addEventListener('click', closeModal);

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    // Tab switching in modal
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${tab}`)?.classList.add('active');
      });
    });
  }

  async function openCafeDetail(placeId) {
    const modal = document.getElementById('cafe-modal');
    if (!modal) return;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Show loading state in modal
    document.getElementById('modal-name').textContent = 'Loading...';
    document.getElementById('modal-address').textContent = '';
    document.getElementById('modal-photos').innerHTML = '<div class="skeleton" style="height:300px;"></div>';

    try {
      const data = await CafeUtils.apiCall(`/api/cafe-details?place_id=${placeId}`);
      const cafe = data.cafe;
      currentCafeDetail = cafe;

      // Populate modal
      document.getElementById('modal-name').textContent = cafe.name;
      document.getElementById('modal-address').textContent = cafe.address;
      document.getElementById('modal-rating').innerHTML = `
        ${CafeUtils.generateStars(cafe.rating)}
        <span class="total-reviews">(${cafe.user_ratings_total} reviews)</span>
        ${CafeUtils.formatPriceLevel(cafe.price_level)}
      `;

      // Phone
      const phoneEl = document.getElementById('modal-phone');
      if (phoneEl) {
        phoneEl.innerHTML = cafe.phone ? `📞 ${cafe.phone}` : '';
      }

      // Hours
      const hoursEl = document.getElementById('modal-hours');
      if (hoursEl && cafe.hours.length) {
        hoursEl.innerHTML = `
          <details class="hours-details">
            <summary>${cafe.is_open ? '<span class="open-badge">● Open Now</span>' : '<span class="closed-badge">● Closed</span>'}</summary>
            <ul class="hours-list">
              ${cafe.hours.map(h => `<li>${h}</li>`).join('')}
            </ul>
          </details>
        `;
      }

      // Photos
      const photosEl = document.getElementById('modal-photos');
      if (photosEl) {
        if (cafe.photos && cafe.photos.length > 0) {
          photosEl.innerHTML = cafe.photos.map(p => 
            `<img src="${p.url}" alt="${cafe.name}" loading="lazy" />`
          ).join('');
        } else {
          photosEl.innerHTML = `<img src="${CafeUtils.getPlaceholderPhoto(0)}" alt="${cafe.name}" />`;
        }
      }

      // Action buttons
      const directionsBtn = document.getElementById('modal-directions');
      if (directionsBtn && cafe.location) {
        directionsBtn.href = CafeMap.getDirectionsUrl(cafe.location.lat, cafe.location.lng);
      }

      const websiteBtn = document.getElementById('modal-website');
      if (websiteBtn) {
        if (cafe.website) {
          websiteBtn.href = cafe.website;
          websiteBtn.style.display = 'inline-flex';
        } else {
          websiteBtn.style.display = 'none';
        }
      }

      // Load reviews (Google + user)
      CafeReviews.loadReviews(placeId);

      // Also render Google reviews if available
      if (cafe.google_reviews && cafe.google_reviews.length > 0) {
        const reviewsList = document.getElementById('reviews-list');
        if (reviewsList) {
          // Wait briefly for user reviews to load, then merge
          setTimeout(async () => {
            try {
              const userReviewData = await CafeUtils.apiCall(`/api/reviews?cafe_id=${placeId}`);
              CafeReviews.renderGoogleAndUserReviews(cafe.google_reviews, userReviewData.reviews, reviewsList);
            } catch (e) {
              // If user reviews fail, show Google reviews only
              CafeReviews.renderGoogleAndUserReviews(cafe.google_reviews, [], reviewsList);
            }
          }, 500);
        }
      }

      // Render menu
      CafeMenu.render('menu-content', cafe.website);

    } catch (error) {
      console.error('Failed to load cafe details:', error);
      CafeUtils.showToast('Failed to load cafe details', 'error');
      closeModal();
    }
  }

  function closeModal() {
    const modal = document.getElementById('cafe-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
    currentCafeDetail = null;
  }

  function setupNav() {
    // Smooth scroll for nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('href');
        CafeUtils.scrollToElement(target);
        // Close mobile menu if open
        document.querySelector('.nav-links')?.classList.remove('active');
      });
    });

    // Mobile hamburger toggle
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
      hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
      });
    }

    // Navbar background on scroll
    window.addEventListener('scroll', CafeUtils.throttle(() => {
      const nav = document.querySelector('.navbar');
      if (nav) {
        nav.classList.toggle('scrolled', window.scrollY > 50);
      }
    }, 100));
  }

  function setupSort() {
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        CafeSearch.sortResults(e.target.value);
      });
    }
  }

  function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.target);
          const suffix = el.dataset.suffix || '';
          animateNumber(el, 0, target, 2000, suffix);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(c => observer.observe(c));
  }

  function animateNumber(el, start, end, duration, suffix) {
    const startTime = performance.now();
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.floor(start + (end - start) * eased);
      el.textContent = current.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { openCafeDetail, closeModal };
})();

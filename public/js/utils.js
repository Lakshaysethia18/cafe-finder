// ============================================
// CafeFinder Utilities
// ============================================
window.CafeUtils = (() => {

  // Haversine formula: distance between two lat/lng points in km
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function toRad(deg) {
    return deg * (Math.PI / 180);
  }

  // Format distance for display
  function formatDistance(km) {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  }

  // Generate star rating HTML
  function generateStars(rating, maxStars = 5) {
    let html = '<div class="stars">';
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.3;
    for (let i = 1; i <= maxStars; i++) {
      if (i <= fullStars) {
        html += '<span class="star filled">★</span>';
      } else if (i === fullStars + 1 && hasHalf) {
        html += '<span class="star half">★</span>';
      } else {
        html += '<span class="star empty">☆</span>';
      }
    }
    html += `<span class="rating-number">${rating.toFixed(1)}</span></div>`;
    return html;
  }

  // Price level to dollar signs
  function formatPriceLevel(level) {
    if (level === undefined || level === null) return '';
    return '<span class="price-level">' + '$'.repeat(level) + '</span>';
  }

  // Toast notification system
  function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span class="toast-message">${message}</span>
    `;
    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // Debounce function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Throttle function
  function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Format date
  function formatDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // API call helper
  async function apiCall(endpoint, options = {}) {
    try {
      const response = await fetch(endpoint, {
        headers: { 'Content-Type': 'application/json' },
        ...options
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        if (responseText.trim().startsWith('<')) {
          throw new Error('Search API is unavailable. Deploy this project on Vercel and try again.');
        }
        throw new Error('Search API returned an invalid response. Please try again.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }
      return data;
    } catch (error) {
      console.error(`API call to ${endpoint} failed:`, error);
      throw error;
    }
  }

  // Scroll to element smoothly
  function scrollToElement(selector, offset = 80) {
    const el = document.querySelector(selector);
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  // Generate a Google Maps photo URL from photo_reference
  function getPhotoUrl(photoReference, maxWidth = 400) {
    if (!photoReference) return 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop';
    return `/api/cafe-details?photo_ref=${photoReference}&maxwidth=${maxWidth}`;
  }

  // Intersection Observer for scroll animations
  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    return observer;
  }

  // Generate placeholder cafe photo using unsplash
  function getPlaceholderPhoto(index) {
    const photos = [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=400&h=300&fit=crop'
    ];
    return photos[index % photos.length];
  }

  return {
    calculateDistance,
    formatDistance,
    generateStars,
    formatPriceLevel,
    showToast,
    debounce,
    throttle,
    formatDate,
    apiCall,
    scrollToElement,
    getPhotoUrl,
    initScrollAnimations,
    getPlaceholderPhoto
  };
})();

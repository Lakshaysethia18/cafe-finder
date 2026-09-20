// ============================================
// CafeFinder Cafe Card Component
// ============================================
window.CafeCard = (() => {

  function create(cafe, index) {
    const card = document.createElement('div');
    card.className = 'cafe-card glass-card';
    card.setAttribute('data-place-id', cafe.place_id);

    // Get photo URL — use placeholder if no photo available
    const photoUrl = cafe.photo_reference
      ? `/api/cafe-details?photo_ref=${cafe.photo_reference}&maxwidth=400`
      : CafeUtils.getPlaceholderPhoto(index);

    // Open/closed badge
    let statusBadge = '';
    if (cafe.is_open !== null && cafe.is_open !== undefined) {
      statusBadge = `<span class="status-badge ${cafe.is_open ? 'open' : 'closed'}">
        ${cafe.is_open ? '● Open Now' : '● Closed'}
      </span>`;
    }

    card.innerHTML = `
      <div class="card-image">
        <img src="${photoUrl}" alt="${cafe.name}" loading="lazy" 
             onerror="this.src='${CafeUtils.getPlaceholderPhoto(index)}'" />
        <div class="card-badges">
          <span class="distance-badge">📍 ${CafeUtils.formatDistance(cafe.distance_km)}</span>
          ${statusBadge}
        </div>
      </div>
      <div class="card-body">
        <h3 class="card-title">${cafe.name}</h3>
        <p class="card-address">${cafe.address || 'Address not available'}</p>
        <div class="card-meta">
          <div class="card-rating">
            ${CafeUtils.generateStars(cafe.rating || 0)}
            <span class="review-count">(${cafe.user_ratings_total || 0})</span>
          </div>
          ${CafeUtils.formatPriceLevel(cafe.price_level)}
        </div>
        <div class="card-actions">
          <button class="btn-card btn-details" onclick="CafeApp.openCafeDetail('${cafe.place_id}')">
            View Details
          </button>
          <a class="btn-card btn-directions" href="${CafeMap.getDirectionsUrl(cafe.location.lat, cafe.location.lng)}" target="_blank" rel="noopener">
            Directions
          </a>
        </div>
      </div>
    `;

    // 3D tilt effect on hover
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / centerY * -5;
      const rotateY = (x - centerX) / centerX * 5;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });

    // Click to highlight on map
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-card')) return; // Don't pan when clicking buttons
      CafeMap.panToLocation(cafe.location.lat, cafe.location.lng);
    });

    return card;
  }

  return { create };
})();

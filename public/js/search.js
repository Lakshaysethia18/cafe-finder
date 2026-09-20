// ============================================
// CafeFinder Search Module
// ============================================
window.CafeSearch = (() => {
  let currentSearchLocation = null;
  let currentCafes = [];
  let isSearching = false;

  function init() {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('pincode-input');
    const locationBtn = document.getElementById('location-btn');

    if (searchBtn) {
      searchBtn.addEventListener('click', performSearch);
    }

    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
      });

    }

    if (locationBtn) {
      locationBtn.addEventListener('click', useMyLocation);
    }
  }

  async function performSearch() {
    if (isSearching) return;

    const input = document.getElementById('pincode-input');
    const radiusSelect = document.getElementById('radius-select');
    const searchQuery = input?.value?.trim();

    if (!searchQuery || searchQuery.length < 2) {
      CafeUtils.showToast('Please enter a pincode, city, cafe, or restaurant name', 'error');
      input?.focus();
      return;
    }

    const radius = radiusSelect?.value || '5000';
    isSearching = true;
    showLoadingState();

    try {
      // Step 1: Geocode pincode to lat/lng
      CafeUtils.showToast('Finding location...', 'info');
      const geoData = await CafeUtils.apiCall(`/api/geocode?query=${encodeURIComponent(searchQuery)}`);
      const { lat, lng } = geoData.location;
      currentSearchLocation = { lat, lng, address: geoData.formatted_address };

      // Step 2: Search for cafes
      CafeUtils.showToast('Discovering cafes...', 'info');
      const placeTypes = geoData.types || [];
      const locationTypes = ['locality', 'administrative_area_level_1', 'administrative_area_level_2', 'country', 'postal_code', 'route', 'neighborhood'];
      const isNamedPlace = !/^[0-9]+$/.test(searchQuery) && !placeTypes.some(type => locationTypes.includes(type));
      const keyword = isNamedPlace ? `&keyword=${encodeURIComponent(searchQuery)}` : '';
      const cafeData = await CafeUtils.apiCall(`/api/cafes?lat=${lat}&lng=${lng}&radius=${radius}${keyword}`);
      currentCafes = cafeData.cafes;

      // Step 3: Display results
      displayResults(currentCafes, currentSearchLocation);
      updateResultsHeader(currentCafes.length, geoData.formatted_address);

      // Step 4: Update map
      CafeMap.displayCafes(currentCafes, currentSearchLocation);

      CafeUtils.showToast(`Found ${currentCafes.length} cafes near ${geoData.formatted_address}`, 'success');

      // Scroll to results
      setTimeout(() => CafeUtils.scrollToElement('#results'), 300);

    } catch (error) {
      console.error('Search error:', error);
      CafeUtils.showToast(error.message || 'Failed to search. Please try again.', 'error');
      showEmptyState();
    } finally {
      isSearching = false;
      hideLoadingState();
    }
  }

  async function useMyLocation() {
    if (!navigator.geolocation) {
      CafeUtils.showToast('Geolocation is not supported by your browser', 'error');
      return;
    }

    const locationBtn = document.getElementById('location-btn');
    if (locationBtn) locationBtn.classList.add('loading');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        currentSearchLocation = { lat, lng, address: 'Your Location' };
        const radius = document.getElementById('radius-select')?.value || '5000';

        showLoadingState();
        try {
          const cafeData = await CafeUtils.apiCall(`/api/cafes?lat=${lat}&lng=${lng}&radius=${radius}`);
          currentCafes = cafeData.cafes;
          displayResults(currentCafes, currentSearchLocation);
          updateResultsHeader(currentCafes.length, 'Your Current Location');
          CafeMap.displayCafes(currentCafes, currentSearchLocation);
          CafeUtils.showToast(`Found ${currentCafes.length} cafes near you`, 'success');
          setTimeout(() => CafeUtils.scrollToElement('#results'), 300);
        } catch (error) {
          CafeUtils.showToast('Failed to find cafes. Please try again.', 'error');
          showEmptyState();
        } finally {
          hideLoadingState();
          if (locationBtn) locationBtn.classList.remove('loading');
        }
      },
      (error) => {
        CafeUtils.showToast('Location access denied. Please enter a pincode instead.', 'error');
        if (locationBtn) locationBtn.classList.remove('loading');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function displayResults(cafes, searchLocation) {
    const grid = document.getElementById('cafe-grid');
    if (!grid) return;

    if (cafes.length === 0) {
      showEmptyState('No cafes found in this area. Try a different search or increase the search radius.');
      return;
    }

    grid.innerHTML = '';
    cafes.forEach((cafe, index) => {
      const card = CafeCard.create(cafe, index);
      grid.appendChild(card);
    });

    // Animate cards in
    requestAnimationFrame(() => {
      grid.querySelectorAll('.cafe-card').forEach((card, i) => {
        setTimeout(() => card.classList.add('visible'), i * 80);
      });
    });
  }

  function showLoadingState() {
    const grid = document.getElementById('cafe-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'cafe-card-skeleton glass-card';
      skeleton.innerHTML = `
        <div class="skeleton skeleton-image"></div>
        <div class="skeleton-body">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text short"></div>
        </div>
      `;
      grid.appendChild(skeleton);
    }
  }

  function hideLoadingState() {
    // Loading state is replaced by actual results in displayResults
  }

  function showEmptyState(message) {
    const grid = document.getElementById('cafe-grid');
    if (!grid) return;
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">☕</div>
        <h3>${message || 'Enter a pincode, city, cafe, or restaurant name to discover places near you'}</h3>
        <p>Search by location or place name, or use your current location to get started</p>
      </div>
    `;
  }

  function updateResultsHeader(count, location) {
    const header = document.getElementById('results-header');
    if (header) {
      header.innerHTML = `
        <h2 class="section-title">Cafes Near You</h2>
        <p class="results-info">Found <strong>${count}</strong> cafes near <strong>${location}</strong></p>
      `;
    }
  }

  function sortResults(sortBy) {
    if (!currentCafes.length) return;
    let sorted = [...currentCafes];
    switch (sortBy) {
      case 'distance': sorted.sort((a, b) => a.distance_km - b.distance_km); break;
      case 'rating': sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'name': sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    displayResults(sorted, currentSearchLocation);
  }

  function getCurrentCafes() { return currentCafes; }
  function getSearchLocation() { return currentSearchLocation; }

  return { init, performSearch, useMyLocation, sortResults, getCurrentCafes, getSearchLocation };
})();

// ============================================
// CafeFinder Google Maps Integration
// ============================================
window.CafeMap = (() => {
  let map = null;
  let markers = [];
  let infoWindow = null;
  let searchCircle = null;
  let directionsService = null;
  let directionsRenderer = null;
  let mapInitialized = false;
  let pendingCafes = null;

  // Dark coffee-themed map style
  const mapStyles = [
    { elementType: 'geometry', stylers: [{ color: '#1a1210' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1210' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#c8956c' }] },
    { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#3d2b1f' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c1e14' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#3d2b1f' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#4a3728' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e0a08' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#6f4e37' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1f1510' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#c8956c' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1f1510' }] },
  ];

  function init(containerId = 'map-container') {
    const container = document.getElementById(containerId);
    if (!container || !window.google || !window.google.maps) {
      console.warn('Map container or Google Maps API not available');
      return;
    }

    map = new google.maps.Map(container, {
      center: { lat: 28.6139, lng: 77.2090 }, // Default: New Delhi
      zoom: 13,
      styles: mapStyles,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    infoWindow = new google.maps.InfoWindow();
    mapInitialized = true;

    // If cafes were queued before map init, display them now
    if (pendingCafes) {
      displayCafes(pendingCafes.cafes, pendingCafes.searchLocation);
      pendingCafes = null;
    }
  }

  function displayCafes(cafes, searchLocation) {
    if (!mapInitialized) {
      pendingCafes = { cafes, searchLocation };
      return;
    }

    clearMarkers();

    // Center map on search location
    const center = new google.maps.LatLng(searchLocation.lat, searchLocation.lng);
    map.setCenter(center);
    map.setZoom(13);

    // Add search location marker
    new google.maps.Marker({
      position: center,
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#c8956c',
        fillOpacity: 1,
        strokeColor: '#f5e6d3',
        strokeWeight: 3,
      },
      title: 'Your Location',
      zIndex: 999
    });

    // Add search radius circle
    if (searchCircle) searchCircle.setMap(null);
    searchCircle = new google.maps.Circle({
      strokeColor: '#c8956c',
      strokeOpacity: 0.3,
      strokeWeight: 2,
      fillColor: '#c8956c',
      fillOpacity: 0.05,
      map,
      center,
      radius: 5000
    });

    // Add cafe markers
    cafes.forEach((cafe, index) => {
      const marker = new google.maps.Marker({
        position: cafe.location,
        map,
        title: cafe.name,
        icon: {
          url: 'data:image/svg+xml,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="#1a0e0a" stroke="#c8956c" stroke-width="2"/>
              <text x="18" y="24" font-size="18" text-anchor="middle" fill="#c8956c">☕</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(36, 36),
          anchor: new google.maps.Point(18, 18),
        },
        animation: google.maps.Animation.DROP,
        zIndex: 100 + index
      });

      marker.addListener('click', () => {
        const content = `
          <div style="background:#1a1210;color:#f5e6d3;padding:12px;border-radius:10px;max-width:250px;font-family:'Poppins',sans-serif;">
            <h3 style="margin:0 0 6px;color:#c8956c;font-size:15px;">${cafe.name}</h3>
            <p style="margin:0 0 4px;font-size:12px;color:#c8b6a6;">${cafe.address || ''}</p>
            <div style="display:flex;align-items:center;gap:8px;margin:6px 0;">
              <span style="color:#f0c040;">★</span>
              <span style="font-size:13px;">${cafe.rating || 'N/A'}</span>
              <span style="font-size:11px;color:#c8b6a6;">(${cafe.user_ratings_total || 0} reviews)</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
              <span style="background:#c8956c;color:#1a0e0a;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">
                ${CafeUtils.formatDistance(cafe.distance_km)}
              </span>
              ${cafe.is_open !== null ? `<span style="color:${cafe.is_open ? '#4caf50' : '#e74c3c'};font-size:11px;">${cafe.is_open ? '● Open' : '● Closed'}</span>` : ''}
            </div>
            <button onclick="window.CafeApp.openCafeDetail('${cafe.place_id}')" 
              style="margin-top:8px;background:#c8956c;color:#1a0e0a;border:none;padding:6px 16px;border-radius:20px;cursor:pointer;font-weight:600;font-size:12px;width:100%;">
              View Details
            </button>
          </div>
        `;
        infoWindow.setContent(content);
        infoWindow.open(map, marker);
      });

      markers.push(marker);
    });

    // Fit map bounds to show all markers
    if (cafes.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(center);
      cafes.forEach(cafe => bounds.extend(cafe.location));
      map.fitBounds(bounds, 50);
    }
  }

  function clearMarkers() {
    markers.forEach(m => m.setMap(null));
    markers = [];
    if (infoWindow) infoWindow.close();
  }

  function panToLocation(lat, lng, zoom = 15) {
    if (!map) return;
    map.panTo({ lat, lng });
    map.setZoom(zoom);
  }

  function getDirectionsUrl(destLat, destLng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
  }

  function isReady() {
    return mapInitialized;
  }

  return { init, displayCafes, clearMarkers, panToLocation, getDirectionsUrl, isReady };
})();

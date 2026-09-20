// Vercel Serverless Function: Search nearby cafes
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lat, lng, radius = '5000', keyword = '' } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Google Maps API key not configured' });
  }

  try {
    const searchParams = new URLSearchParams({
      location: `${lat},${lng}`,
      radius,
      key: apiKey
    });
    const searchEndpoint = keyword.trim() ? 'textsearch' : 'nearbysearch';

    if (keyword.trim()) {
      searchParams.set('query', keyword.trim());
    } else {
      searchParams.set('type', 'cafe');
    }

    const url = `https://maps.googleapis.com/maps/api/place/${searchEndpoint}/json?${searchParams}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return res.status(500).json({ error: 'Places API error', status: data.status });
    }

    // Transform results to a cleaner format
    const cafes = (data.results || []).map(place => {
      // Calculate distance from search point using Haversine formula
      const distance = calculateDistance(
        parseFloat(lat), parseFloat(lng),
        place.geometry.location.lat, place.geometry.location.lng
      );

      return {
        place_id: place.place_id,
        name: place.name,
        address: place.vicinity || place.formatted_address,
        rating: place.rating || 0,
        user_ratings_total: place.user_ratings_total || 0,
        price_level: place.price_level,
        is_open: place.opening_hours?.open_now ?? null,
        photo_reference: place.photos?.[0]?.photo_reference || null,
        location: place.geometry.location,
        distance_km: Math.round(distance * 100) / 100,
        types: place.types || []
      };
    });

    // Sort by distance
    cafes.sort((a, b) => a.distance_km - b.distance_km);

    return res.status(200).json({
      success: true,
      count: cafes.length,
      cafes,
      search_location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      radius: parseInt(radius)
    });
  } catch (error) {
    console.error('Cafes search error:', error);
    return res.status(500).json({ error: 'Failed to search for cafes' });
  }
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

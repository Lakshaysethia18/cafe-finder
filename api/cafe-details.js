// Vercel Serverless Function: Get cafe details
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { place_id } = req.query;

  if (!place_id) {
    return res.status(400).json({ error: 'place_id is required' });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Google Maps API key not configured' });
  }

  try {
    const fields = [
      'name', 'formatted_address', 'formatted_phone_number',
      'geometry', 'rating', 'user_ratings_total', 'price_level',
      'opening_hours', 'photos', 'reviews', 'website', 'url',
      'types', 'business_status'
    ].join(',');

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=${fields}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return res.status(404).json({ error: 'Cafe not found', status: data.status });
    }

    const place = data.result;

    // Build photo URLs
    const photos = (place.photos || []).slice(0, 6).map(photo => ({
      url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${apiKey}`,
      attribution: photo.html_attributions?.[0] || ''
    }));

    // Format reviews
    const reviews = (place.reviews || []).map(review => ({
      author: review.author_name,
      rating: review.rating,
      text: review.text,
      time: review.relative_time_description,
      profile_photo: review.profile_photo_url
    }));

    return res.status(200).json({
      success: true,
      cafe: {
        place_id,
        name: place.name,
        address: place.formatted_address,
        phone: place.formatted_phone_number || null,
        website: place.website || null,
        google_maps_url: place.url,
        rating: place.rating || 0,
        user_ratings_total: place.user_ratings_total || 0,
        price_level: place.price_level,
        is_open: place.opening_hours?.open_now ?? null,
        hours: place.opening_hours?.weekday_text || [],
        location: place.geometry?.location,
        photos,
        google_reviews: reviews,
        business_status: place.business_status,
        types: place.types || []
      }
    });
  } catch (error) {
    console.error('Cafe details error:', error);
    return res.status(500).json({ error: 'Failed to fetch cafe details' });
  }
}

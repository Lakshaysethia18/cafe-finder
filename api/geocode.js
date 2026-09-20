// Vercel Serverless Function: Geocode pincode to lat/lng
export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const query = req.query.query || req.query.pincode;

  if (!query || query.trim().length === 0) {
    return res.status(400).json({ error: 'Search query (pincode, city, or place) is required' });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Google Maps API key not configured' });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return res.status(404).json({ error: 'Location not found for this search', status: data.status });
    }

    const result = data.results[0];
    const { lat, lng } = result.geometry.location;

    return res.status(200).json({
      success: true,
      location: { lat, lng },
      formatted_address: result.formatted_address,
      place_id: result.place_id,
      types: result.types || []
    });
  } catch (error) {
    console.error('Geocode error:', error);
    return res.status(500).json({ error: 'Failed to geocode pincode' });
  }
}

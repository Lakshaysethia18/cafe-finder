// Vercel Serverless Function: User Reviews
// In-memory store (resets on cold start — upgrade to DB for persistence)
const reviewStore = new Map();

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return handleGet(req, res);
  }

  if (req.method === 'POST') {
    return handlePost(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

function handleGet(req, res) {
  const { cafe_id } = req.query;

  if (!cafe_id) {
    return res.status(400).json({ error: 'cafe_id is required' });
  }

  const reviews = reviewStore.get(cafe_id) || [];

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  return res.status(200).json({
    success: true,
    cafe_id,
    count: reviews.length,
    average_rating: avgRating,
    reviews: reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  });
}

function handlePost(req, res) {
  const { cafe_id, author, rating, text } = req.body;

  // Validate required fields
  if (!cafe_id || !author || !rating || !text) {
    return res.status(400).json({
      error: 'Missing required fields: cafe_id, author, rating, text'
    });
  }

  // Validate rating range
  const numRating = parseFloat(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  // Validate text length
  if (text.trim().length < 5) {
    return res.status(400).json({ error: 'Review text must be at least 5 characters' });
  }

  if (text.trim().length > 1000) {
    return res.status(400).json({ error: 'Review text must be under 1000 characters' });
  }

  // Create review
  const review = {
    id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    cafe_id,
    author: author.trim().substring(0, 50),
    rating: numRating,
    text: text.trim(),
    created_at: new Date().toISOString()
  };

  // Store review
  if (!reviewStore.has(cafe_id)) {
    reviewStore.set(cafe_id, []);
  }
  reviewStore.get(cafe_id).push(review);

  return res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    review
  });
}

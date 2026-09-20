// ============================================
// CafeFinder Review System
// ============================================
window.CafeReviews = (() => {
  let selectedRating = 0;
  let currentCafeId = null;

  function init() {
    // Star rating input interaction
    const starsContainer = document.getElementById('review-stars');
    if (starsContainer) {
      starsContainer.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', () => {
          selectedRating = parseInt(star.dataset.rating);
          updateStarDisplay(selectedRating);
        });
        star.addEventListener('mouseenter', () => {
          updateStarDisplay(parseInt(star.dataset.rating));
        });
      });
      starsContainer.addEventListener('mouseleave', () => {
        updateStarDisplay(selectedRating);
      });
    }

    // Character counter
    const textarea = document.getElementById('review-text');
    const charCount = document.getElementById('char-count');
    if (textarea && charCount) {
      textarea.addEventListener('input', () => {
        charCount.textContent = `${textarea.value.length}/1000`;
      });
    }

    // Submit button
    const submitBtn = document.getElementById('submit-review');
    if (submitBtn) {
      submitBtn.addEventListener('click', submitReview);
    }
  }

  function updateStarDisplay(rating) {
    const stars = document.querySelectorAll('#review-stars .star');
    stars.forEach((star, i) => {
      star.classList.toggle('active', i < rating);
    });
  }

  async function loadReviews(cafeId) {
    currentCafeId = cafeId;
    const reviewsList = document.getElementById('reviews-list');
    if (!reviewsList) return;

    reviewsList.innerHTML = '<div class="loading-text">Loading reviews...</div>';

    try {
      // Load user reviews from our API
      const userReviews = await CafeUtils.apiCall(`/api/reviews?cafe_id=${cafeId}`);
      renderReviews(userReviews.reviews, reviewsList);
    } catch (error) {
      reviewsList.innerHTML = '<p class="error-text">Failed to load reviews</p>';
    }
  }

  function renderReviews(reviews, container) {
    if (!reviews || reviews.length === 0) {
      container.innerHTML = '<p class="no-reviews">No reviews yet. Be the first to share your experience!</p>';
      return;
    }

    container.innerHTML = reviews.map(review => `
      <div class="review-card">
        <div class="review-header">
          <div class="review-avatar">${(review.author || review.profile_photo || 'A')[0].toUpperCase()}</div>
          <div class="review-author-info">
            <span class="review-author">${review.author}</span>
            <span class="review-date">${review.time || CafeUtils.formatDate(review.created_at)}</span>
          </div>
          <div class="review-rating">
            ${CafeUtils.generateStars(review.rating)}
          </div>
        </div>
        <p class="review-text">${review.text}</p>
      </div>
    `).join('');
  }

  function renderGoogleAndUserReviews(googleReviews, userReviews, container) {
    let html = '';

    if (userReviews && userReviews.length > 0) {
      html += '<h4 class="reviews-section-title">Community Reviews</h4>';
      html += userReviews.map(r => createReviewCard(r)).join('');
    }

    if (googleReviews && googleReviews.length > 0) {
      html += '<h4 class="reviews-section-title">Google Reviews</h4>';
      html += googleReviews.map(r => createReviewCard(r)).join('');
    }

    if (!html) {
      html = '<p class="no-reviews">No reviews yet. Be the first to share your experience!</p>';
    }

    container.innerHTML = html;
  }

  function createReviewCard(review) {
    return `
      <div class="review-card">
        <div class="review-header">
          <div class="review-avatar">${(review.author || 'A')[0].toUpperCase()}</div>
          <div class="review-author-info">
            <span class="review-author">${review.author}</span>
            <span class="review-date">${review.time || CafeUtils.formatDate(review.created_at)}</span>
          </div>
          <div class="review-rating">${CafeUtils.generateStars(review.rating)}</div>
        </div>
        <p class="review-text">${review.text}</p>
      </div>
    `;
  }

  async function submitReview() {
    if (!currentCafeId) {
      CafeUtils.showToast('No cafe selected', 'error');
      return;
    }

    const author = document.getElementById('review-author')?.value?.trim();
    const text = document.getElementById('review-text')?.value?.trim();

    if (!author) {
      CafeUtils.showToast('Please enter your name', 'error');
      return;
    }
    if (selectedRating === 0) {
      CafeUtils.showToast('Please select a rating', 'error');
      return;
    }
    if (!text || text.length < 5) {
      CafeUtils.showToast('Please write a review (at least 5 characters)', 'error');
      return;
    }

    try {
      await CafeUtils.apiCall('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          cafe_id: currentCafeId,
          author,
          rating: selectedRating,
          text
        })
      });

      CafeUtils.showToast('Review submitted successfully!', 'success');

      // Reset form
      document.getElementById('review-author').value = '';
      document.getElementById('review-text').value = '';
      document.getElementById('char-count').textContent = '0/1000';
      selectedRating = 0;
      updateStarDisplay(0);

      // Reload reviews
      await loadReviews(currentCafeId);
    } catch (error) {
      CafeUtils.showToast(error.message || 'Failed to submit review', 'error');
    }
  }

  return { init, loadReviews, renderGoogleAndUserReviews };
})();

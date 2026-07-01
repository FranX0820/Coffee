const BACKEND_URL = "https://coffee-1zpr.onrender.com";

async function loadRatings() {
  try {
    // ✅ Updated to absolute live path
    const response = await fetch(`${BACKEND_URL}/api/reviews`);
    const data = await response.json();

    // Update aggregate stats
    document.getElementById("avg-rating").innerText = data.averageRating || "0";
    document.getElementById("total-count").innerText = data.totalReviews;

    // Render updated feedback lists
    const container = document.getElementById("reviews-container");
    container.innerHTML = "";

    data.reviews.forEach((review) => {
      const reviewCard = document.createElement("div");
      reviewCard.className = "review-card";

      // Generate star visual characters based on the number score
      const starVisual =
        "★".repeat(review.rating) + "☆".repeat(5 - review.rating);

      reviewCard.innerHTML = `
                <div class="stars">${starVisual}</div>
                <p class="review-text">"${review.comment || "No comment left."}"</p>
                <span class="reviewer">- ${review.name || "Anonymous"}</span>
            `;
      container.appendChild(reviewCard);
    });
  } catch (err) {
    console.error("Error loading reviews:", err);
  }
}

// Handle Form Submissions
document.getElementById("ratingForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("reviewer-name").value;
  const email = document.getElementById("reviewer-email").value;
  const rating = document.getElementById("rating-select").value;
  const comment = document.getElementById("review-msg").value;

  try {
    // ✅ Updated to absolute live path
    const response = await fetch(`${BACKEND_URL}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, rating: Number(rating), comment }),
    });

    const result = await response.json();
    if (result.success) {
      alert("Thank you for your rating!");
      document.getElementById("ratingForm").reset(); // Wipes out all inputs smoothly
      loadRatings(); // Instantly update view grid array without reloading page
    }
  } catch (err) {
    console.error("Error submitting rating:", err);
  }
});

// Run initialization code on page entry
loadRatings();
document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // HAMBURGER TOGGLE (MUST BE INSIDE HERE)
  // ==========================================
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const navLinksContainer = document.getElementById("nav-links-container");

  if (hamburgerBtn && navLinksContainer) {
    hamburgerBtn.addEventListener("click", () => {
      navLinksContainer.classList.toggle("active");
    });
  }

  // ... your existing dashboard or review code lives down here ...
});

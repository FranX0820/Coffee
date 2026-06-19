// review.js

async function loadRatings() {
  try {
    const response = await fetch("/api/reviews");
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
    const response = await fetch("/api/reviews", {
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

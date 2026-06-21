document.addEventListener('DOMContentLoaded', () => {
    const reviewForm = document.getElementById('reviewForm'); // Make sure your form tag has this ID

    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Stops the page from refreshing automatically

            // 1. Grab values from the input fields
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const rating = parseInt(document.getElementById('rating').value);
            const comment = document.getElementById('comment').value;

            // 2. Package the data payload
            const reviewData = { name, email, rating, comment };

            try {
                // 3. Ship it to the server backend route we already made
                const response = await fetch('https://coffee-1zpr.onrender.com/api/reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reviewData)
                });

                const result = await response.json();

                if (result.success) {
                    alert('Thank you! Your review has been saved, and a confirmation email has been sent.');
                    reviewForm.reset(); // Clear the form fields
                    
                    // Optional: If you have a function to load reviews live, run it here
                    if (typeof loadReviews === 'function') loadReviews(); 
                } else {
                    alert('Error saving review: ' + result.error);
                }
            } catch (error) {
                console.error('Error submitting review:', error);
                alert('Could not connect to the server. Make sure server.js is running!');
            }
        });
    }
});
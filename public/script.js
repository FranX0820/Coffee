document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. DYNAMIC ORDER PRICE CALCULATOR & SUBMIT
  // ==========================================
  const coffeeSelect = document.getElementById("coffee-type");
  const sizeSelect = document.getElementById("size");
  const formContainer = document.querySelector(".form-container form");
  const orderBtn = document.getElementById("order-click-btn");

  if (coffeeSelect && sizeSelect && formContainer && orderBtn) {
    // Create and inject a price display element into the form
    const priceDisplay = document.createElement("div");
    priceDisplay.className = "price-display";
    priceDisplay.style.cssText =
      "font-size: 20px; font-weight: bold; color: #e6b89c; margin: 20px 0; text-align: center;";

    formContainer.insertBefore(priceDisplay, orderBtn);

    function calculateTotal() {
      const selectedCoffee = coffeeSelect.options[coffeeSelect.selectedIndex];
      const basePrice = parseFloat(selectedCoffee.getAttribute("data-price"));

      const selectedSize = sizeSelect.options[sizeSelect.selectedIndex];
      const sizeExtra = parseFloat(selectedSize.getAttribute("data-extra"));

      const total = basePrice + sizeExtra;
      priceDisplay.innerHTML = `Total Amount: $${total.toFixed(2)}`;
    }

    coffeeSelect.addEventListener("change", calculateTotal);
    sizeSelect.addEventListener("change", calculateTotal);

    calculateTotal(); // Run once to set initial price

    // Click event listener to handle order creation
    orderBtn.addEventListener("click", async (e) => {
      e.preventDefault(); // Stop page flashing/reloading
      console.log("Button clicked! Gathering order details...");

      const orderData = {
        coffeeType: coffeeSelect.value,
        size: sizeSelect.value,
        notes: document.getElementById("notes").value,
        totalPrice: parseFloat(
          priceDisplay.innerText.replace("Total Amount: $", ""),
        ),
      };

      console.log("Sending data to backend:", orderData);

      try {
        const response = await fetch(
          "https://coffee-1zpr.onrender.com/api/orders",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData),
          },
        );

        const result = await response.json();
        console.log("Server response:", result);

        if (result.success) {
          // ✅ FIXED: Grab the generated ID and redirect instantly to tracker page
          const orderId = result.data._id;
          window.location.href = `track.html?id=${orderId}`;
        } else {
          alert("Server error: " + result.error);
        }
      } catch (error) {
        console.error("Error sending order to server:", error);
        alert(
          "Could not connect to the server. Make sure node server.js is running!",
        );
      }
    });
  }

  // ==========================================
  // 2. MOBILE HAMBURGER MENU INTERACTION LOGIC
  // ==========================================
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const navLinksContainer = document.getElementById("nav-links-container");

  if (hamburgerBtn && navLinksContainer) {
    hamburgerBtn.addEventListener("click", () => {
      navLinksContainer.classList.toggle("active");
      console.log("Hamburger clicked! Active class toggled.");
    });
  }
});

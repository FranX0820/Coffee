document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. MOBILE HAMBURGER MENU INTERACTION LOGIC
  // ==========================================
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const navLinksContainer = document.getElementById("nav-links-container");

  if (hamburgerBtn && navLinksContainer) {
    hamburgerBtn.addEventListener("click", () => {
      navLinksContainer.classList.toggle("active");
    });
  }

  // ==========================================
  // 2. SHOPPING CART CORE ENGINE LOGIC
  // ==========================================
  const coffeeSelect = document.getElementById("coffee-type");
  const sizeSelect = document.getElementById("size");
  const quantityInput = document.getElementById("quantity");
  const addToCartBtn = document.getElementById("add-to-cart-btn");
  const orderBtn = document.getElementById("order-click-btn");

  // Initialize cart array from localStorage (keeps items saved if page refreshes)
  let cart = JSON.parse(localStorage.getItem("coffeeCart")) || [];

  // Function to render the items inside the cart visually
  function renderCart() {
    const listContainer = document.getElementById("cart-items-list");
    const totalDisplay = document.getElementById("cart-total");
    if (!listContainer) return;

    listContainer.innerHTML = "";

    if (cart.length === 0) {
      listContainer.innerHTML = `<li style="color: #a89f91; font-style: italic;">Your basket is currently empty.</li>`;
      if (totalDisplay) totalDisplay.innerText = "Total Basket Amount: $0.00";
      return;
    }

    let overallTotal = 0;

    cart.forEach((item, index) => {
      overallTotal += item.price;
      const li = document.createElement("li");
      li.style.cssText =
        "display: flex; justify-content: space-between; margin-bottom: 8px; color: #d1bfa7; font-size: 14px;";
      li.innerHTML = `
        <span>${item.quantity}x ${item.coffeeType.toUpperCase()} (${item.size.toUpperCase()})</span>
        <span>$${item.price.toFixed(2)} <button onclick="removeFromCart(${index})" style="background: none; border: none; color: #ff6b6b; cursor: pointer; margin-left: 10px; font-weight: bold;">❌</button></span>
      `;
      listContainer.appendChild(li);
    });

    if (totalDisplay) {
      totalDisplay.innerText = `Total Basket Amount: $${overallTotal.toFixed(2)}`;
    }
  }

  // Function to remove a single item row out of the cart array
  window.removeFromCart = function (index) {
    cart.splice(index, 1);
    localStorage.setItem("coffeeCart", JSON.stringify(cart));
    renderCart();
  };

  // Listen for the "Add to Basket" click
  if (addToCartBtn && coffeeSelect && sizeSelect && quantityInput) {
    addToCartBtn.addEventListener("click", () => {
      const coffeeType = coffeeSelect.value;
      const size = sizeSelect.value;
      const quantity = parseInt(quantityInput.value) || 1;

      // Calculate individual item prices using your HTML custom attributes
      const selectedCoffee = coffeeSelect.options[coffeeSelect.selectedIndex];
      const basePrice =
        parseFloat(selectedCoffee.getAttribute("data-price")) || 0;

      const selectedSize = sizeSelect.options[sizeSelect.selectedIndex];
      const sizeExtra =
        parseFloat(selectedSize.getAttribute("data-extra")) || 0;

      const singleUnitPrice = basePrice + sizeExtra;

      // Build out item data payload object
      const cartItem = {
        coffeeType,
        size,
        quantity,
        price: singleUnitPrice * quantity,
      };

      // Push into array, update storage, and redraw UI display view
      cart.push(cartItem);
      localStorage.setItem("coffeeCart", JSON.stringify(cart));
      renderCart();

      // Reset quantity field back to 1 for the next item choice
      quantityInput.value = 1;
    });
  }

  // Render basket layout contents on page load immediately
  renderCart();
});
// ==========================================
// 3. SUBMIT THE FULL BASKET TO BACKEND
// ==========================================
if (orderBtn) {
  orderBtn.addEventListener("click", async (e) => {
    e.preventDefault(); // Stop the page from refreshing/reflashing

    // Guard check: Don't let them order an empty basket
    if (cart.length === 0) {
      alert("Your basket is empty! Add some coffee before checking out.");
      return;
    }

    const emailField = document.getElementById("user-email");
    if (!emailField || !emailField.value.trim()) {
      alert("Please enter your email address to track your order rewards.");
      return;
    }

    // Pack up our exact backend schema data payload structure
    const orderData = {
      email: emailField.value.trim(),
      notes: document.getElementById("notes")
        ? document.getElementById("notes").value
        : "",
      items: cart, // 📦 Sends the full multi-item array list directly!
      totalPrice: cart.reduce((sum, item) => sum + item.price, 0),
    };

    console.log("Sending entire basket to server:", orderData);

    try {
      orderBtn.innerText = "Processing Order...";
      orderBtn.disabled = true;

      const response = await fetch(
        "https://coffee-1zpr.onrender.com/api/orders",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        },
      );

      const result = await response.json();
      console.log("Server basket response:", result);

      if (result.success) {
        // 🧹 Clear out browser's local basket memory cache on success!
        localStorage.removeItem("coffeeCart");

        // Instantly send them to your live tracker page with the fresh order ID
        const orderId = result.data._id;
        window.location.href = `track.html?id=${orderId}`;
      } else {
        alert("Server Error: " + result.error);
        orderBtn.innerText = "Complete Order";
        orderBtn.disabled = false;
      }
    } catch (error) {
      console.error("Error sending basket to server:", error);
      alert(
        "Could not connect to the server. Make sure your backend service is awake!",
      );
      orderBtn.innerText = "Complete Order";
      orderBtn.disabled = false;
    }
  });
}

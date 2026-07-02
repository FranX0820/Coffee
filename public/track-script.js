document.addEventListener("DOMContentLoaded", () => {
  // 1. Parse out the order ID string parameter straight from the browser address bar link
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("id");

  if (!orderId) {
    document.getElementById("status-message").innerText =
      "No order ID specified.";
    return;
  }

  document.getElementById("track-id-display").innerText = `ID: ${orderId}`;

  // 2. Poll the server status endpoint automatically
  async function checkStatus() {
    try {
      // Fetch the individual order detail setup array
      const response = await fetch(
        `https://coffee-1zpr.onrender.com/api/orders`,
      );
      const result = await response.json();

      if (result.success) {
        // Find our matching current tracking order entry inside the active orders dataset array
        const activeOrders = result.data;
        const match = activeOrders.find((o) => o._id === orderId);

        const progressLine = document.getElementById("progress-line");
        const step2 = document.getElementById("step-2");
        const message = document.getElementById("status-message");

        // If it is present in the pending entries collection list -> Step 1
        if (match) {
          progressLine.style.width = "0%";
          step2.classList.remove("active");
          message.innerText = `Baristas are crafting your custom ${match.coffeeType.toUpperCase()} order right now! ☕`;
        } else {
          // If it cleared out of pending list -> Step 2 Complete!
          progressLine.style.width = "100%";
          step2.classList.add("active");
          message.innerText =
            "Your fresh brew is complete! Grab it at the pickup bar! 🎉";
        }
      }
    } catch (error) {
      console.error("Tracking status sync issue:", error);
    }
  }

  // Fire checkStatus immediately on boot and set interval update sweep every 5 seconds
  checkStatus();
  setInterval(checkStatus, 5000);
});

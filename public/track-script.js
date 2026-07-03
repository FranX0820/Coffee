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
// 1. PLACE THIS AT THE VERY BOTTOM OF YOUR track-script.js FILE:

function startPickupCountdown(targetReadyTimeStr) {
  const countdownBox = document.getElementById("countdown-box");
  const timerClock = document.getElementById("timer-clock");
  const statusText = document.getElementById("timer-status-text");

  if (!countdownBox || !timerClock) return;

  const readyAt = new Date(targetReadyTimeStr).getTime();
  countdownBox.style.display = "block"; // Turn on the hidden dark HTML box

  // Run the interval loop every 1 single second
  const timerInterval = setInterval(() => {
    const now = new Date().getTime();
    const difference = readyAt - now;

    // Convert milliseconds difference to minutes and seconds strings
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    // Format numbers cleanly to always show two digits (e.g. 05:09)
    const displayMinutes = minutes < 10 ? "0" + minutes : minutes;
    const displaySeconds = seconds < 10 ? "0" + seconds : seconds;

    if (difference <= 0) {
      // 🏁 The timer hit zero!
      clearInterval(timerInterval);
      timerClock.innerText = "00:00";
      timerClock.style.color = "#e6b89c";
      statusText.innerText =
        "☕ Your order is fresh on the counter! Ready for pickup.";
    } else {
      // Ticking... update the visual interface string live
      timerClock.innerText = `${displayMinutes}:${displaySeconds}`;
    }
  }, 1000);
}

// 2. INSIDE YOUR FETCH SUCCESS CALL (Where you get your `order` or `result.data` object),
// fire the function by passing the database timestamp:

if (order.status !== "Served" && order.estimatedReadyAt) {
  startPickupCountdown(order.estimatedReadyAt);
} else if (order.status === "Served") {
  // If the barista already clicked serve, keep the clock hidden or at zero
  const countdownBox = document.getElementById("countdown-box");
  if (countdownBox) countdownBox.style.display = "none";
}

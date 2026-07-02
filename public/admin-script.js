document.addEventListener("DOMContentLoaded", async () => {
  // ==========================================
  // 1. HAMBURGER TOGGLE (Placed right at the top so it works instantly)
  // ==========================================
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const navLinksContainer = document.getElementById("nav-links-container");

  if (hamburgerBtn && navLinksContainer) {
    hamburgerBtn.addEventListener("click", () => {
      navLinksContainer.classList.toggle("active");
    });
  }

  // ==========================================
  // 2. LIVE DATABASE ORDERS FETCH LOGIC
  // ==========================================
  const tbody = document.getElementById("orders-tbody");

  // Prompt the user for the password as soon as the page loads
  const password = prompt("Enter Admin Access Password:");

  try {
    // Send the password along inside the hidden network request headers
    const response = await fetch(
      "https://coffee-1zpr.onrender.com/api/orders",
      {
        method: "GET",
        headers: {
          "x-admin-key": password,
        },
      },
    );

    const result = await response.json();

    if (result.success) {
      const orders = result.data;
      tbody.innerHTML = "";

      orders.forEach((order) => {
        const row = document.createElement("tr");
        const orderDate = order.createdAt
          ? new Date(order.createdAt).toLocaleString()
          : "Invalid Date";

        // 📦 Safe dynamic item compiler: processes multiple basket items neatly
        let itemsSummary = "";
        if (order.items && order.items.length > 0) {
          itemsSummary = order.items
            .map((item) => `${item.quantity}x ${item.coffeeType.toUpperCase()}`)
            .join("<br>"); // Places each distinct item item on a clean new row line
        } else if (order.coffeeType) {
          itemsSummary = `1x ${order.coffeeType.toUpperCase()}`; // Fallback for your oldest single-item db entries
        } else {
          itemsSummary = "No Items Found";
        }

        // Safe size compiler fallback
        let sizeSummary = "";
        if (order.items && order.items.length > 0) {
          sizeSummary = order.items
            .map((item) => item.size.toUpperCase())
            .join("<br>");
        } else {
          sizeSummary = order.size ? order.size.toUpperCase() : "REGULAR";
        }

        row.innerHTML = `
                    <td style="font-family: monospace; font-size: 12px; color: #a89f91; padding: 14px; vertical-align: top;">${order._id}</td>
                    <td style="font-weight: bold; color: #e6b89c; padding: 14px; vertical-align: top; line-height: 1.4;">${itemsSummary}</td>
                    <td style="padding: 14px; vertical-align: top; line-height: 1.4;">${sizeSummary}</td>
                    <td style="font-style: italic; padding: 14px; vertical-align: top;">${order.notes || "None"}</td>
                    <td style="font-weight: bold; color: #e6b89c; padding: 14px; vertical-align: top;">$${(order.totalPrice || 0).toFixed(2)}</td>
                    <td style="padding: 14px; vertical-align: top;">${orderDate}</td>
                    <td style="padding: 14px; vertical-align: top;">
                        <button class="serve-btn" style="background-color: #e6b89c; color: #2c1a11; border: none; padding: 6px 12px; font-weight: bold; border-radius: 4px; cursor: pointer;">Serve</button>
                    </td>
                `;

        tbody.appendChild(row);

        // Attach click handler for serving the row
        const serveButton = row.querySelector(".serve-btn");
        serveButton.addEventListener("click", async () => {
          serveButton.innerText = "Serving...";
          serveButton.disabled = true;

          try {
            const serveResponse = await fetch(
              `https://coffee-1zpr.onrender.com/api/orders/${order._id}/serve`,
              {
                method: "PUT",
              },
            );
            const serveResult = await serveResponse.json();

            if (serveResult.success) {
              row.remove();
              if (tbody.children.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No orders found in database yet.</td></tr>`;
              }
            } else {
              alert(
                "Failed to update order status to served: " + serveResult.error,
              );
              serveButton.innerText = "Serve";
              serveButton.disabled = false;
            }
          } catch (error) {
            console.error("Serve route error:", error);
            alert("Could not connect to server.");
            serveButton.innerText = "Serve";
            serveButton.disabled = false;
          }
        });
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #ff6b6b; font-weight: bold;">Access Denied: ${result.error}</td></tr>`;
    }
  } catch (error) {
    console.error("Dashboard error:", error);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Failed to connect to the server.</td></tr>`;
  }
});

/* Get references to the page elements */
const categoryFilter = document.getElementById("categoryFilter");
const productSearch = document.getElementById("productSearch");
const productsContainer = document.getElementById("productsContainer");
const showMoreProductsButton = document.getElementById("showMoreProducts");
const selectedProductsList = document.getElementById("selectedProductsList");
const clearSelectedButton = document.getElementById("clearSelected");
const generateRoutineButton = document.getElementById("generateRoutine");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const chatInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendBtn");
const rtlToggle = document.getElementById("rtlToggle");

/* Paste the class-hosted Cloudflare Worker URL here when it is provided. */
const workerUrl = "https://lorealworker.jcwebst5.workers.dev/";

let allProducts = [];
let selectedProductIds = loadSelectedProducts();
let conversationMessages = [];
let showAllProducts = false;

/* Load saved selections from localStorage */
function loadSelectedProducts() {
  const savedIds = localStorage.getItem("lorealSelectedProducts");
  if (!savedIds) return [];

  try {
    return JSON.parse(savedIds);
  } catch (error) {
    return [];
  }
}

/* Save the selected product IDs */
function saveSelectedProducts() {
  localStorage.setItem(
    "lorealSelectedProducts",
    JSON.stringify(selectedProductIds)
  );
}

/* Load product data from the local JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  allProducts = data.products;
  updateProductDisplay();
  updateSelectedProducts();
}

/* Filter products by both category and search text */
function updateProductDisplay(resetVisibleProducts = false) {
  if (resetVisibleProducts) {
    showAllProducts = false;
  }

  const category = categoryFilter.value;
  const searchText = productSearch.value.toLowerCase().trim();

  const matchingProducts = allProducts.filter((product) => {
    const matchesCategory = !category || product.category === category;
    const searchableText =
      `${product.name} ${product.brand} ${product.category} ${product.description}`.toLowerCase();
    const matchesSearch = !searchText || searchableText.includes(searchText);
    return matchesCategory && matchesSearch;
  });

  displayProducts(matchingProducts);
}

/* Escape text before placing it into HTML */
function escapeHtml(text) {
  const element = document.createElement("div");
  element.textContent = text;
  return element.innerHTML;
}

/* Create product cards and description controls */
function displayProducts(products) {
  if (products.length === 0) {
    productsContainer.innerHTML =
      '<div class="placeholder-message">No products match your search</div>';
    showMoreProductsButton.hidden = true;
    return;
  }

  productsContainer.innerHTML = products
    .map((product) => {
      const isSelected = selectedProductIds.includes(product.id);
      return `
        <article class="product-card ${isSelected ? "selected" : ""}" data-id="${product.id}" tabindex="0" aria-label="Select ${escapeHtml(product.name)}">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
          <div class="product-info">
            <h3>${escapeHtml(product.name)}</h3>
            <p>${escapeHtml(product.brand)}</p>
            <button class="description-toggle" type="button" aria-expanded="false">
              View description
            </button>
            <p class="product-description">${escapeHtml(product.description)}</p>
          </div>
        </article>
      `;
    })
    .join("");

  updateProductVisibility();

  /* Attach card selection and description actions */
  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.classList.contains("description-toggle")) {
        event.stopPropagation();
        const description = card.querySelector(".product-description");
        const button = event.target;
        const isOpen = description.classList.toggle("open");
        button.setAttribute("aria-expanded", String(isOpen));
        button.textContent = isOpen ? "Hide description" : "View description";
        return;
      }

      toggleProduct(Number(card.dataset.id));
    });

    card.addEventListener("keydown", (event) => {
      /* Let the description button handle its own keyboard interaction. */
      if (event.target !== card) return;

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleProduct(Number(card.dataset.id));
      }
    });
  });
}

/* Initially show two complete rows, based on the responsive grid columns */
function updateProductVisibility() {
  const cards = productsContainer.querySelectorAll(".product-card");
  const columnCount = getComputedStyle(productsContainer)
    .gridTemplateColumns.trim().split(/\s+/).length;
  const initialProductCount = columnCount * 2;

  cards.forEach((card, index) => {
    card.hidden = !showAllProducts && index >= initialProductCount;
  });

  showMoreProductsButton.hidden = cards.length <= initialProductCount;
  showMoreProductsButton.setAttribute(
    "aria-expanded",
    String(showAllProducts)
  );
  showMoreProductsButton.querySelector("span").textContent = showAllProducts
    ? "Show less"
    : "Show more";
  showMoreProductsButton.querySelector("i").className = showAllProducts
    ? "fa-solid fa-chevron-up"
    : "fa-solid fa-chevron-down";
}

/* Expand or collapse the product grid */
showMoreProductsButton.addEventListener("click", () => {
  showAllProducts = !showAllProducts;
  updateProductVisibility();
});

/* Keep the two-row limit correct when the responsive grid changes columns */
window.addEventListener("resize", updateProductVisibility);

/* Add or remove a selected product */
function toggleProduct(productId) {
  if (selectedProductIds.includes(productId)) {
    selectedProductIds = selectedProductIds.filter((id) => id !== productId);
  } else {
    selectedProductIds.push(productId);
  }

  saveSelectedProducts();
  updateProductDisplay();
  updateSelectedProducts();
}

/* Show selected products and individual remove buttons */
function updateSelectedProducts() {
  const selectedProducts = allProducts.filter((product) =>
    selectedProductIds.includes(product.id)
  );

  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML =
      '<p class="selected-empty">No products selected yet</p>';
    return;
  }

  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
        <div class="selected-item">
          <span>${escapeHtml(product.name)}</span>
          <button type="button" data-id="${product.id}" aria-label="Remove ${escapeHtml(product.name)}">&times;</button>
        </div>
      `
    )
    .join("");

  document.querySelectorAll(".selected-item button").forEach((button) => {
    button.addEventListener("click", () => {
      toggleProduct(Number(button.dataset.id));
    });
  });
}

/* Clear every saved selection */
clearSelectedButton.addEventListener("click", () => {
  selectedProductIds = [];
  saveSelectedProducts();
  updateProductDisplay();
  updateSelectedProducts();
});

/* Filter products when the category or search field changes */
categoryFilter.addEventListener("change", () => updateProductDisplay(true));
productSearch.addEventListener("input", () => updateProductDisplay(true));

/* Toggle right-to-left support */
rtlToggle.addEventListener("click", () => {
  const isRtl = document.body.classList.toggle("rtl-mode");
  document.documentElement.lang = isRtl ? "ar" : "en";
  document.documentElement.dir = isRtl ? "rtl" : "ltr";
  rtlToggle.setAttribute("aria-pressed", String(isRtl));
  rtlToggle.querySelector("span").textContent = isRtl ? "LTR" : "RTL";
});

/* Add a message to the visible chat */
function addChatMessage(role, content) {
  const message = document.createElement("div");
  message.className = `chat-message ${role}`;
  message.textContent = content;
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Send a messages array to the Cloudflare Worker */
async function askWorker(messages) {
  if (!workerUrl) {
    throw new Error(
      "Cloudflare Worker URL is not set. Add the class-hosted Worker URL to workerUrl in script.js."
    );
  }

  const response = await fetch(workerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    throw new Error(`Worker request failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error("The Worker returned an unexpected response.");
  }
  return data.choices[0].message.content;
}

/* Generate a routine from only the selected products */
generateRoutineButton.addEventListener("click", async () => {
  const selectedProducts = allProducts.filter((product) =>
    selectedProductIds.includes(product.id)
  );

  if (selectedProducts.length === 0) {
    addChatMessage("assistant", "Please select at least one product first.");
    return;
  }

  const systemMessage = {
    role: "system",
    content:
      "You are a L'Oreal skincare, haircare, makeup, fragrance, and beauty advisor. " +
      "Create practical, safe routines using only the selected products when discussing their ingredients or features. " +
      "Keep answers on beauty and routine topics. If web search is available, use it for current product information and include citations or links.",
  };

  const productData = selectedProducts.map((product) => ({
    id: product.id,
    brand: product.brand,
    name: product.name,
    category: product.category,
    description: product.description,
  }));

  const userMessage = {
    role: "user",
    content:
      "Build a personalized routine using these selected L'Oreal products: " +
      JSON.stringify(productData),
  };

  conversationMessages = [systemMessage, userMessage];
  addChatMessage("user", "Build a personalized routine from my selected products.");
  generateRoutineButton.disabled = true;

  try {
    const reply = await askWorker(conversationMessages);
    conversationMessages.push({ role: "assistant", content: reply });
    addChatMessage("assistant", reply);
  } catch (error) {
    addChatMessage("assistant", error.message);
  } finally {
    generateRoutineButton.disabled = false;
  }
});

/* Send follow-up questions while preserving conversation history */
chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = chatInput.value.trim();
  if (!question) return;

  addChatMessage("user", question);
  conversationMessages.push({ role: "user", content: question });
  chatInput.value = "";
  sendButton.disabled = true;

  try {
    const reply = await askWorker(conversationMessages);
    conversationMessages.push({ role: "assistant", content: reply });
    addChatMessage("assistant", reply);
  } catch (error) {
    addChatMessage("assistant", error.message);
  } finally {
    sendButton.disabled = false;
  }
});

/* Start the app */
loadProducts();

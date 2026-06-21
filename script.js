// ========================================
// MAS TECHNOLOGIES - JAVASCRIPT
// ========================================

// --- Configuration ---
const API_URL = 'https://your-strapi-backend.onrender.com/api'; // CHANGE THIS!

// --- Cart Functions ---
let cart = JSON.parse(localStorage.getItem('cart')) || [];
updateCartCount();

function updateCartCount() {
    const countEl = document.getElementById('cartCount');
    if (countEl) countEl.innerText = cart.length;
}

function addToCart(product) {
    cart.push(product);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showToast(product.name + ' added to cart! 🛒');
}

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    if (window.location.pathname.includes('cart.html')) {
        displayCartItems();
    }
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// --- Fetch Products from Strapi ---
async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/products?populate=*`);
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

// --- Render Products ---
async function renderProducts(containerId, limit = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const products = await fetchProducts();
    const filtered = limit ? products.slice(0, limit) : products;
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="no-products">No products found. Add some in Strapi!</p>';
        return;
    }
    
    container.innerHTML = filtered.map(product => {
        const imageUrl = product.attributes.image?.data?.attributes?.url 
            ? `https://your-strapi-backend.onrender.com${product.attributes.image.data.attributes.url}`
            : 'https://placehold.co/400x400/f5f2eb/1a1a1a?text=No+Image';
        
        return `
            <div class="product-card">
                <img src="${imageUrl}" alt="${product.attributes.name}">
                <span class="category-tag">${product.attributes.category}</span>
                <h3>${product.attributes.name}</h3>
                <p>${product.attributes.description}</p>
                <div class="price">Ksh ${product.attributes.price.toLocaleString()}</div>
                <button onclick='addToCart(${JSON.stringify({
                    id: product.id,
                    name: product.attributes.name,
                    price: product.attributes.price,
                    image: imageUrl
                }).replace(/'/g, "\\'")})'>Add to Cart</button>
            </div>
        `;
    }).join('');
}

// --- Cart Page ---
function displayCartItems() {
    const container = document.getElementById('cartItems');
    if (!container) return;
    
    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
        document.getElementById('subtotal').innerText = 'Ksh 0';
        document.getElementById('total').innerText = 'Ksh 0';
        return;
    }
    
    let subtotal = 0;
    container.innerHTML = cart.map((item, index) => {
        subtotal += item.price;
        return `
            <div class="cart-item">
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">Ksh ${item.price.toLocaleString()}</div>
                </div>
                <button class="remove-btn" onclick="removeFromCart(${index})">✕</button>
            </div>
        `;
    }).join('');
    
    document.getElementById('subtotal').innerText = `Ksh ${subtotal.toLocaleString()}`;
    document.getElementById('total').innerText = `Ksh ${subtotal.toLocaleString()}`;
    
    // Delivery fee
    document.getElementById('deliveryFee').innerText = 'Ksh 0';
}

// --- Checkout Page ---
function displayCheckoutItems() {
    const container = document.getElementById('orderItems');
    if (!container) return;
    
    if (cart.length === 0) {
        container.innerHTML = '<p>Your cart is empty.</p>';
        window.location.href = 'cart.html';
        return;
    }
    
    let subtotal = 0;
    container.innerHTML = cart.map(item => {
        subtotal += item.price;
        return `
            <div class="cart-item">
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">Ksh ${item.price.toLocaleString()}</div>
                </div>
            </div>
        `;
    }).join('');
    
    document.getElementById('checkoutSubtotal').innerText = `Ksh ${subtotal.toLocaleString()}`;
    
    // Delivery calculation
    const deliverySelect = document.getElementById('deliveryOption');
    if (deliverySelect) {
        updateDeliveryFee();
        deliverySelect.addEventListener('change', updateDeliveryFee);
    }
}

function updateDeliveryFee() {
    const deliverySelect = document.getElementById('deliveryOption');
    const fee = deliverySelect.value === 'pickup' ? 0 : deliverySelect.value === 'nairobi' ? 200 : 500;
    document.getElementById('checkoutDelivery').innerText = `Ksh ${fee}`;
    
    const subtotalText = document.getElementById('checkoutSubtotal').innerText.replace('Ksh ', '');
    const subtotal = parseInt(subtotalText) || 0;
    document.getElementById('checkoutTotal').innerText = `Ksh ${subtotal + fee}`;
}

// --- Checkout Form ---
function setupCheckoutForm() {
    const form = document.getElementById('checkoutForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('fullName').value;
        const phone = document.getElementById('phoneNumber').value;
        const address = document.getElementById('deliveryAddress').value;
        const delivery = document.getElementById('deliveryOption');
        
        if (!name || !phone) {
            alert('Please fill in your name and phone number.');
            return;
        }
        
        const totalText = document.getElementById('checkoutTotal').innerText.replace('Ksh ', '');
        const total = parseInt(totalText) || 0;
        
        // Build WhatsApp message
        let message = '🛍️ *NEW ORDER - MAS Technologies* 🛍️\n\n';
        message += `👤 *Customer:* ${name}\n`;
        message += `📞 *Phone:* ${phone}\n`;
        message += `📍 *Address:* ${address || 'Shop Pickup'}\n`;
        message += `🚚 *Delivery:* ${delivery.options[delivery.selectedIndex].text}\n\n`;
        message += '📦 *ITEMS:*\n';
        
        cart.forEach(item => {
            message += `• ${item.name} - Ksh ${item.price}\n`;
        });
        
        message += `\n💰 *TOTAL:* Ksh ${total}\n`;
        message += `💳 *Payment:* M-Pesa Till 3248421 (Suhail Mohamed Hassan)`;
        
        // Send to WhatsApp
        const phoneNumber = '254746488634';
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
        
        // Clear cart
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        
        // Open WhatsApp
        alert('✅ Order placed! Redirecting to WhatsApp to confirm...');
        window.open(whatsappUrl, '_blank');
        window.location.href = 'index.html';
    });
}

// --- Mobile Menu Toggle ---
function toggleMobileMenu() {
    const nav = document.querySelector('nav');
    if (nav) nav.classList.toggle('open');
}

// --- Category Filter ---
function filterCategory(category) {
    window.location.href = `products.html?category=${category}`;
}

// --- Search Products ---
async function searchProducts() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const category = document.getElementById('categoryFilter')?.value || 'all';
    
    const products = await fetchProducts();
    const filtered = products.filter(p => {
        const matchesSearch = p.attributes.name.toLowerCase().includes(searchTerm);
        const matchesCategory = category === 'all' || p.attributes.category === category;
        return matchesSearch && matchesCategory;
    });
    
    const container = document.getElementById('productGrid');
    if (!container) return;
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="no-products">No products found.</p>';
        return;
    }
    
    container.innerHTML = filtered.map(product => {
        const imageUrl = product.attributes.image?.data?.attributes?.url 
            ? `https://your-strapi-backend.onrender.com${product.attributes.image.data.attributes.url}`
            : 'https://placehold.co/400x400/f5f2eb/1a1a1a?text=No+Image';
        
        return `
            <div class="product-card">
                <img src="${imageUrl}" alt="${product.attributes.name}">
                <span class="category-tag">${product.attributes.category}</span>
                <h3>${product.attributes.name}</h3>
                <p>${product.attributes.description}</p>
                <div class="price">Ksh ${product.attributes.price.toLocaleString()}</div>
                <button onclick='addToCart(${JSON.stringify({
                    id: product.id,
                    name: product.attributes.name,
                    price: product.attributes.price,
                    image: imageUrl
                }).replace(/'/g, "\\'")})'>Add to Cart</button>
            </div>
        `;
    }).join('');
}

// --- Go to Checkout ---
function goToCheckout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    window.location.href = 'checkout.html';
}

// --- Page Initialization ---
document.addEventListener('DOMContentLoaded', function() {
    // Home page featured products
    if (document.getElementById('featuredGrid')) {
        renderProducts('featuredGrid', 6);
    }
    
    // Products page
    if (document.getElementById('productGrid')) {
        renderProducts('productGrid');
        
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        
        if (searchInput) searchInput.addEventListener('input', searchProducts);
        if (categoryFilter) categoryFilter.addEventListener('change', searchProducts);
    }
    
    // Cart page
    if (document.getElementById('cartItems')) {
        displayCartItems();
    }
    
    // Checkout page
    if (document.getElementById('orderItems')) {
        displayCheckoutItems();
        setupCheckoutForm();
    }
    
    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Message sent! We will get back to you soon.');
            this.reset();
        });
    }
    
    // Check URL params on products page
    if (window.location.pathname.includes('products.html')) {
        const params = new URLSearchParams(window.location.search);
        const category = params.get('category');
        if (category) {
            setTimeout(() => {
                const filter = document.getElementById('categoryFilter');
                if (filter) filter.value = category;
                searchProducts();
            }, 100);
        }
    }
});
/* === SKULL FOOD MASTER SCRIPT === */

// State
let cart = JSON.parse(localStorage.getItem('skullfoodCart')) || [];
const couponRule = { code: "SKULL10", discountPercentage: 0.10, minimumSubtotal: 20.00 };
let appliedDiscount = 0.00;

document.addEventListener('DOMContentLoaded', () => {
    updateCartCounter();
    setupEventListeners();
    setupPayPal(); // Initial setup if on cart page
});

function setupEventListeners() {
    // --- 1. SLIDE PANELS (Menu, Cart, Contact) ---
    const menuBtn = document.getElementById('menuToggle');
    const closeMenu = document.getElementById('closeMenu');
    
    const cartBtn = document.getElementById('cartToggle');
    const closeCart = document.getElementById('closeCart');

    // Chat / Contact Button Logic
    const contactFab = document.getElementById('contactFab');
    const closeContact = document.getElementById('closeContact'); 
    // (Note: In the about page code, the ID might be 'closeContact'. 
    // In the slide-out panels, ensure the close button has id="closeContact")

    // Menu Events
    if(menuBtn) menuBtn.addEventListener('click', (e) => { e.preventDefault(); togglePanel('slideMenu'); });
    if(closeMenu) closeMenu.addEventListener('click', (e) => { e.preventDefault(); togglePanel('slideMenu'); });

    // Cart Events
    if(cartBtn) cartBtn.addEventListener('click', (e) => { e.preventDefault(); togglePanel('slideCart'); });
    if(closeCart) closeCart.addEventListener('click', (e) => { e.preventDefault(); togglePanel('slideCart'); });

    // Contact/Chat Events
    if(contactFab) contactFab.addEventListener('click', (e) => { 
        e.preventDefault(); 
        togglePanel('contactPanel'); 
    });
    
    // We need to find the close button inside the contact panel dynamically if ID is missing
    const contactPanel = document.getElementById('contactPanel');
    if(contactPanel) {
        const closeBtn = contactPanel.querySelector('.close-panel');
        if(closeBtn) closeBtn.addEventListener('click', (e) => { e.preventDefault(); togglePanel('contactPanel'); });
    }

    // --- 2. ADD TO CART BUTTONS ---
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const product = {
                id: e.target.dataset.id,
                name: e.target.dataset.name,
                price: parseFloat(e.target.dataset.price),
                image: e.target.dataset.image
            };
            addToCart(product);
        });
    });

    // --- 3. COUPON LOGIC ---
    const applyCouponBtn = document.getElementById('applyCouponBtn');
    if(applyCouponBtn) applyCouponBtn.addEventListener('click', applyCoupon);

    // --- 4. REMOVE ITEMS FROM CART ---
    const cartItemsContainer = document.getElementById('cartItems');
    if(cartItemsContainer) {
        cartItemsContainer.addEventListener('click', (e) => {
            if(e.target.closest('.cart-remove')) {
                const id = e.target.closest('.cart-remove').dataset.id;
                removeFromCart(id);
            }
        });
    }

    // --- 5. WAITLIST MODAL (If exists) ---
    const waitlistBtn = document.getElementById('waitlistBtn');
    const waitlistModal = document.getElementById('waitlistModal');
    if(waitlistBtn && waitlistModal) {
        waitlistBtn.addEventListener('click', () => {
            waitlistModal.classList.add('active');
        });
        // Find close button inside waitlist modal
        const closeWaitlist = waitlistModal.querySelector('.close-panel');
        if(closeWaitlist) {
            closeWaitlist.addEventListener('click', () => waitlistModal.classList.remove('active'));
        }
    }
}

// --- HELPER FUNCTIONS ---

function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    
    // Close other panels first to avoid overlap
    const allPanels = document.querySelectorAll('.slide-panel');
    allPanels.forEach(p => {
        if(p.id !== panelId) p.classList.remove('active');
    });

    if(panel) panel.classList.toggle('active');
}

function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if(existing) {
        existing.quantity++;
    } else {
        cart.push({...product, quantity: 1});
    }
    saveCart();
    // Open the cart to show the user
    const cartPanel = document.getElementById('slideCart');
    if(cartPanel) {
        // Close others
        document.querySelectorAll('.slide-panel').forEach(p => p.classList.remove('active'));
        cartPanel.classList.add('active');
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
}

function saveCart() {
    localStorage.setItem('skullfoodCart', JSON.stringify(cart));
    updateCartCounter();
    renderCart();
}

function updateCartCounter() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cartCounter');
    if(badge) badge.innerText = count;
}

function applyCoupon() {
    const input = document.getElementById('couponCode');
    const msg = document.getElementById('couponMessage');
    if(!input) return;

    const code = input.value.trim().toUpperCase();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (code === couponRule.code && subtotal >= couponRule.minimumSubtotal) {
        appliedDiscount = subtotal * couponRule.discountPercentage;
        if(msg) {
            msg.innerText = "10% Discount Applied!";
            msg.style.color = "#00ffff";
        }
    } else {
        appliedDiscount = 0;
        if(msg) {
            msg.innerText = "Invalid Code or Minimum not met.";
            msg.style.color = "#ff4136";
        }
    }
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cartItems');
    if(!container) return;

    container.innerHTML = '';
    let subtotal = 0;

    if(cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888;">Cart is empty.</p>';
    } else {
        cart.forEach(item => {
            subtotal += item.price * item.quantity;
            container.innerHTML += `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-info">
                        <h4>${item.name}</h4>
                        <p>$${item.price.toFixed(2)} x ${item.quantity}</p>
                    </div>
                    <button class="cart-remove" data-id="${item.id}">&times;</button>
                </div>
            `;
        });
    }

    // Calculations
    if(appliedDiscount > 0) {
         // Re-validate coupon minimum
         if(subtotal < couponRule.minimumSubtotal) appliedDiscount = 0;
         else appliedDiscount = subtotal * couponRule.discountPercentage;
    }

    const discountedSubtotal = subtotal - appliedDiscount;
    const shipping = (discountedSubtotal > 0 && discountedSubtotal < 65) ? 20.00 : 0.00;
    const total = discountedSubtotal + shipping;

    // Update UI
    if(document.getElementById('cartSubtotal')) document.getElementById('cartSubtotal').innerText = `$${subtotal.toFixed(2)}`;
    if(document.getElementById('cartShipping')) document.getElementById('cartShipping').innerText = `$${shipping.toFixed(2)}`;
    if(document.getElementById('cartTotal')) document.getElementById('cartTotal').innerText = `$${total.toFixed(2)}`;
    
    // Render PayPal
    renderPayPal(total);
}

function renderPayPal(amount) {
    const container = document.getElementById('paypal-button-container');
    if(!container) return;
    container.innerHTML = ''; // Clear old buttons

    if(amount <= 0) return;

    if(window.paypal) {
        paypal.Buttons({
            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{ amount: { value: amount.toFixed(2) } }]
                });
            },
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    alert('Transaction completed by ' + details.payer.name.given_name);
                    cart = [];
                    saveCart();
                    // Close cart
                    const cartPanel = document.getElementById('slideCart');
                    if(cartPanel) cartPanel.classList.remove('active');
                });
            }
        }).render('#paypal-button-container');
    }
}

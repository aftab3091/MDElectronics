document.addEventListener('DOMContentLoaded', () => {
    // CSRF Utility
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    const csrftoken = getCookie('csrftoken') || '';

    // State management using localStorage
    let cart = JSON.parse(localStorage.getItem('md_cart')) || [];
    let wishlist = JSON.parse(localStorage.getItem('md_wishlist')) || [];
    let compareList = []; // Kept in-memory during session

    // Selectors
    const cartOverlay = document.getElementById('cartOverlay');
    const cartPanel = document.getElementById('cartPanel');
    const openCartBtn = document.getElementById('openCartBtn');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartBadge = document.getElementById('cartBadge');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');

    const wishlistOverlay = document.getElementById('wishlistOverlay');
    const wishlistPanel = document.getElementById('wishlistPanel');
    const openWishlistBtn = document.getElementById('openWishlistBtn');
    const closeWishlistBtn = document.getElementById('closeWishlistBtn');
    const wishlistBadge = document.getElementById('wishlistBadge');
    const wishlistItemsContainer = document.getElementById('wishlistItems');

    const compareTray = document.getElementById('compareTray');
    const compareTrayItems = document.getElementById('compareTrayItems');
    const runCompareBtn = document.getElementById('runCompareBtn');
    const compareModalOverlay = document.getElementById('compareModalOverlay');
    const closeCompareModal = document.getElementById('closeCompareModal');
    const compareTableBody = document.getElementById('compareTableBody');

    const checkoutModal = document.getElementById('checkoutModal');
    const closeCheckoutModal = document.getElementById('closeCheckoutModal');

    // 1. Scroll Effect on Navbar
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            navbar.style.background = 'rgba(11, 15, 25, 0.95)';
            navbar.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
        } else {
            navbar.style.background = 'rgba(11, 15, 25, 0.7)';
            navbar.style.boxShadow = 'none';
        }
    });

    // 2. Active Link Highlighting
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (currentPath === linkPath || (linkPath !== '/' && currentPath.startsWith(linkPath))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // 3. TOAST SYSTEM
    function showToast(message, type = 'success') {
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        const toast = document.createElement('div');
        toast.className = 'toast';
        if (type === 'error') {
            toast.style.borderColor = 'var(--accent-red)';
        } else if (type === 'info') {
            toast.style.borderColor = 'var(--accent-blue)';
        }
        const icon = type === 'success' ? '✓' : (type === 'info' ? 'ℹ' : '✗');
        toast.innerHTML = `<span style="font-weight:bold; color: ${type === 'success' ? 'var(--accent-green)' : (type === 'info' ? 'var(--accent-blue)' : 'var(--accent-red)')}">${icon}</span> <span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => { toast.remove(); }, 300);
        }, 4000);
    }

    // 4. CART SYSTEM LOGIC
    function saveCart() {
        localStorage.setItem('md_cart', JSON.stringify(cart));
        updateCartUI();
    }

    function updateCartUI() {
        // Update badge counts
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartBadge) {
            cartBadge.textContent = totalItems;
            cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
        }

        // Render Cart Items
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = '';
            if (cart.length === 0) {
                cartItemsContainer.innerHTML = `<p style="text-align:center; color:var(--text-secondary); margin-top:2rem;">Your cart is empty.</p>`;
                if (checkoutBtn) checkoutBtn.style.display = 'none';
            } else {
                if (checkoutBtn) checkoutBtn.style.display = 'block';
                cart.forEach(item => {
                    const itemEl = document.createElement('div');
                    itemEl.className = 'cart-item';
                    itemEl.innerHTML = `
                        <img src="${item.image || 'https://via.placeholder.com/70'}" class="cart-item-img" alt="${item.name}">
                        <div class="cart-item-info">
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')}</div>
                            <div class="cart-item-qty">
                                <button class="qty-btn minus" data-id="${item.id}">-</button>
                                <span>${item.quantity}</span>
                                <button class="qty-btn plus" data-id="${item.id}">+</button>
                                <button class="cart-item-remove" data-id="${item.id}">Remove</button>
                            </div>
                        </div>
                    `;
                    cartItemsContainer.appendChild(itemEl);
                });
            }
        }

        // Calculate Subtotal
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (cartTotal) {
            cartTotal.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
        }
    }

    // Handle Add to Cart Clicks
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('product-btn') || e.target.classList.contains('buy-btn')) {
            // Allow navigation links with this class to function normally
            if (e.target.tagName === 'A' && e.target.getAttribute('href') && e.target.getAttribute('href') !== '#') {
                return;
            }
            e.preventDefault();
            const btn = e.target;
            const id = parseInt(btn.getAttribute('data-id'));
            const name = btn.getAttribute('data-name');
            const price = parseFloat(btn.getAttribute('data-price'));
            const image = btn.getAttribute('data-image');

            if (!id || !name || isNaN(price)) return;

            const existingItem = cart.find(item => item.id === id);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ id, name, price, image, quantity: 1 });
            }
            saveCart();
            showToast(`Added "${name}" to cart!`);
            
            // Auto open cart drawer
            if (cartOverlay && cartPanel) {
                cartOverlay.classList.add('active');
                cartPanel.classList.add('active');
            }
        }
    });

    // Cart Panel interactions (Plus, Minus, Remove)
    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            if (!id) return;

            if (e.target.classList.contains('plus')) {
                const item = cart.find(item => item.id === id);
                if (item) {
                    item.quantity += 1;
                    saveCart();
                }
            } else if (e.target.classList.contains('minus')) {
                const item = cart.find(item => item.id === id);
                if (item) {
                    item.quantity -= 1;
                    if (item.quantity <= 0) {
                        cart = cart.filter(item => item.id !== id);
                    }
                    saveCart();
                }
            } else if (e.target.classList.contains('cart-item-remove')) {
                cart = cart.filter(item => item.id !== id);
                saveCart();
                showToast("Item removed from cart.", "info");
            }
        });
    }

    // Drawers Open & Close
    if (openCartBtn) {
        openCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            cartOverlay.classList.add('active');
            cartPanel.classList.add('active');
        });
    }
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', () => {
            cartOverlay.classList.remove('active');
            cartPanel.classList.remove('active');
        });
    }
    if (cartOverlay) {
        cartOverlay.addEventListener('click', () => {
            cartOverlay.classList.remove('active');
            cartPanel.classList.remove('active');
        });
    }

    // 5. WISHLIST SYSTEM
    function saveWishlist() {
        localStorage.setItem('md_wishlist', JSON.stringify(wishlist));
        updateWishlistUI();
    }

    function updateWishlistUI() {
        // Badge count
        if (wishlistBadge) {
            wishlistBadge.textContent = wishlist.length;
            wishlistBadge.style.display = wishlist.length > 0 ? 'flex' : 'none';
        }

        // Active state of buttons on catalog cards
        document.querySelectorAll('.wishlist-btn').forEach(btn => {
            const id = parseInt(btn.getAttribute('data-id'));
            if (wishlist.some(item => item.id === id)) {
                btn.classList.add('active');
                btn.innerHTML = '❤️';
            } else {
                btn.classList.remove('active');
                btn.innerHTML = '🤍';
            }
        });

        // Render Wishlist Drawer
        if (wishlistItemsContainer) {
            wishlistItemsContainer.innerHTML = '';
            if (wishlist.length === 0) {
                wishlistItemsContainer.innerHTML = `<p style="text-align:center; color:var(--text-secondary); margin-top:2rem;">Your wishlist is empty.</p>`;
            } else {
                wishlist.forEach(item => {
                    const itemEl = document.createElement('div');
                    itemEl.className = 'cart-item';
                    itemEl.innerHTML = `
                        <img src="${item.image || 'https://via.placeholder.com/70'}" class="cart-item-img" alt="${item.name}">
                        <div class="cart-item-info">
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')}</div>
                            <div style="margin-top:0.5rem; display:flex; gap:0.5rem;">
                                <button class="product-btn" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}" data-image="${item.image}" style="background:var(--accent-blue); color:white; border:none; padding:0.25rem 0.5rem; border-radius:4px; font-size:0.8rem; cursor:pointer;">Add to Cart</button>
                                <button class="cart-item-remove wish-remove" data-id="${item.id}">Remove</button>
                            </div>
                        </div>
                    `;
                    wishlistItemsContainer.appendChild(itemEl);
                });
            }
        }
    }

    // Toggle Wishlist actions
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('wishlist-btn')) {
            e.preventDefault();
            const btn = e.target;
            const id = parseInt(btn.getAttribute('data-id'));
            const name = btn.getAttribute('data-name');
            const price = parseFloat(btn.getAttribute('data-price'));
            const image = btn.getAttribute('data-image');

            if (!id) return;

            const index = wishlist.findIndex(item => item.id === id);
            if (index > -1) {
                wishlist.splice(index, 1);
                showToast(`Removed "${name}" from wishlist.`, "info");
            } else {
                wishlist.push({ id, name, price, image });
                showToast(`Added "${name}" to wishlist!`);
            }
            saveWishlist();
        }
    });

    if (wishlistItemsContainer) {
        wishlistItemsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('wish-remove')) {
                const id = parseInt(e.target.getAttribute('data-id'));
                if (id) {
                    wishlist = wishlist.filter(item => item.id !== id);
                    saveWishlist();
                    showToast("Removed from wishlist.", "info");
                }
            }
        });
    }

    // Open/Close Wishlist Panel
    if (openWishlistBtn) {
        openWishlistBtn.addEventListener('click', (e) => {
            e.preventDefault();
            wishlistOverlay.classList.add('active');
            wishlistPanel.classList.add('active');
        });
    }
    if (closeWishlistBtn) {
        closeWishlistBtn.addEventListener('click', () => {
            wishlistOverlay.classList.remove('active');
            wishlistPanel.classList.remove('active');
        });
    }
    if (wishlistOverlay) {
        wishlistOverlay.addEventListener('click', () => {
            wishlistOverlay.classList.remove('active');
            wishlistPanel.classList.remove('active');
        });
    }

    // 6. PRODUCT COMPARISON SYSTEM
    document.body.addEventListener('change', (e) => {
        if (e.target.classList.contains('compare-checkbox')) {
            const checkbox = e.target;
            const id = parseInt(checkbox.getAttribute('data-id'));
            const name = checkbox.getAttribute('data-name');
            const brand = checkbox.getAttribute('data-brand');
            const category = checkbox.getAttribute('data-category');
            const price = parseFloat(checkbox.getAttribute('data-price'));
            const desc = checkbox.getAttribute('data-description');

            if (checkbox.checked) {
                if (compareList.length >= 3) {
                    checkbox.checked = false;
                    showToast("You can compare a maximum of 3 products.", "error");
                    return;
                }
                compareList.push({ id, name, brand, category, price, desc });
            } else {
                compareList = compareList.filter(item => item.id !== id);
            }
            updateCompareTray();
        }
    });

    function updateCompareTray() {
        if (!compareTray) return;

        if (compareList.length > 0) {
            compareTray.classList.add('active');
            compareTrayItems.innerHTML = '';
            compareList.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'compare-tray-item';
                itemEl.innerHTML = `
                    <span>${item.name}</span>
                    <span class="compare-remove" data-id="${item.id}">×</span>
                `;
                compareTrayItems.appendChild(itemEl);
            });
        } else {
            compareTray.classList.remove('active');
        }
    }

    if (compareTray) {
        compareTray.addEventListener('click', (e) => {
            if (e.target.classList.contains('compare-remove')) {
                const id = parseInt(e.target.getAttribute('data-id'));
                compareList = compareList.filter(item => item.id !== id);
                
                // Uncheck catalog checkboxes
                document.querySelectorAll(`.compare-checkbox[data-id="${id}"]`).forEach(cb => {
                    cb.checked = false;
                });
                updateCompareTray();
            }
        });
    }

    // Trigger specifications matrix Modal
    if (runCompareBtn) {
        runCompareBtn.addEventListener('click', () => {
            if (compareList.length < 2) {
                showToast("Please select at least 2 products to compare.", "info");
                return;
            }
            
            // Build Comparison Matrix table
            if (compareTableBody) {
                compareTableBody.innerHTML = '';
                
                // Headers row
                let nameRowHtml = '<th>Product Name</th>';
                let brandRowHtml = '<th>Brand</th>';
                let catRowHtml = '<th>Category</th>';
                let priceRowHtml = '<th>Price</th>';
                let descRowHtml = '<th>Overview</th>';
                
                compareList.forEach(item => {
                    nameRowHtml += `<td style="font-weight:700;">${item.name}</td>`;
                    brandRowHtml += `<td>${item.brand}</td>`;
                    catRowHtml += `<td>${item.category}</td>`;
                    priceRowHtml += `<td style="color:var(--accent-cyan); font-weight:700;">₹${item.price.toLocaleString('en-IN')}</td>`;
                    descRowHtml += `<td style="font-size:0.85rem; color:var(--text-secondary); line-height:1.4;">${item.desc}</td>`;
                });

                compareTableBody.innerHTML = `
                    <tr>${nameRowHtml}</tr>
                    <tr>${brandRowHtml}</tr>
                    <tr>${catRowHtml}</tr>
                    <tr>${priceRowHtml}</tr>
                    <tr>${descRowHtml}</tr>
                `;
            }
            
            compareModalOverlay.classList.add('active');
        });
    }

    if (closeCompareModal) {
        closeCompareModal.addEventListener('click', () => {
            compareModalOverlay.classList.remove('active');
        });
    }

    // 7. CHECKOUT WIZARD MULTI-STEP LOGIC
    let currentStep = 1;

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            // Close Cart drawer
            cartOverlay.classList.remove('active');
            cartPanel.classList.remove('active');

            // Set up wizard items review
            const itemsSummary = document.getElementById('checkoutItemsList');
            const summarySubtotal = document.getElementById('checkoutSummarySubtotal');
            const finalSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            if (itemsSummary) {
                itemsSummary.innerHTML = cart.map(item => `
                    <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:0.5rem; color:var(--text-secondary);">
                        <span>${item.name} (x${item.quantity})</span>
                        <span>₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                `).join('');
            }
            if (summarySubtotal) {
                summarySubtotal.textContent = `₹${finalSubtotal.toLocaleString('en-IN')}`;
            }

            // Open Modal
            goToStep(1);
            checkoutModal.classList.add('active');
        });
    }

    if (closeCheckoutModal) {
        closeCheckoutModal.addEventListener('click', () => {
            checkoutModal.classList.remove('active');
        });
    }

    function goToStep(step) {
        currentStep = step;
        
        // Update Step classes
        document.querySelectorAll('.wizard-step').forEach((el, index) => {
            const stepNum = index + 1;
            el.classList.remove('active', 'completed');
            if (stepNum === currentStep) {
                el.classList.add('active');
            } else if (stepNum < currentStep) {
                el.classList.add('completed');
            }
        });

        // Toggle visibility
        document.querySelectorAll('.wizard-content-step').forEach((el, index) => {
            if (index + 1 === currentStep) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }

    // Handle Wizard buttons
    const nextToStep2 = document.getElementById('nextToStep2');
    if (nextToStep2) {
        nextToStep2.addEventListener('click', (e) => {
            e.preventDefault();
            // Validate Delivery form
            const name = document.getElementById('deliveryName').value.trim();
            const phone = document.getElementById('deliveryPhone').value.trim();
            const address = document.getElementById('deliveryAddress').value.trim();
            const city = document.getElementById('deliveryCity').value.trim();
            const zip = document.getElementById('deliveryZip').value.trim();

            if (!name || !phone || !address || !city || !zip) {
                showToast("Please fill in all delivery details.", "error");
                return;
            }
            goToStep(2);
        });
    }

    const backToStep1 = document.getElementById('backToStep1');
    if (backToStep1) {
        backToStep1.addEventListener('click', () => { goToStep(1); });
    }

    const submitPayment = document.getElementById('submitPayment');
    if (submitPayment) {
        submitPayment.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Check payment selection
            const selectedPayment = document.querySelector('input[name="payment_option"]:checked');
            if (!selectedPayment) {
                showToast("Please select a payment option.", "error");
                return;
            }

            const name = document.getElementById('deliveryName').value.trim();
            const phone = document.getElementById('deliveryPhone').value.trim();
            const address = document.getElementById('deliveryAddress').value.trim();
            const city = document.getElementById('deliveryCity').value.trim();
            const zip = document.getElementById('deliveryZip').value.trim();

            if (!name || !phone || !address || !city || !zip) {
                showToast("Please fill in all delivery details on Step 1.", "error");
                goToStep(1);
                return;
            }

            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const orderPayload = {
                customer_name: name,
                customer_phone: phone,
                customer_address: `${address}, ${city} - ${zip}`,
                items: cart,
                total_amount: total,
                payment_method: selectedPayment.value
            };

            fetch('/api/admin/orders/save/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify(orderPayload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Caching order ID to local storage for user's order history tab
                    let myOrders = JSON.parse(localStorage.getItem('my_orders') || '[]');
                    myOrders.push(data.order_id);
                    localStorage.setItem('my_orders', JSON.stringify(myOrders));

                    // Step 3 - Receipt setup
                    const orderNumber = document.getElementById('orderNumber');
                    const receiptSubtotal = document.getElementById('receiptSubtotal');
                    if (orderNumber) orderNumber.textContent = data.order_id;
                    if (receiptSubtotal) receiptSubtotal.textContent = `₹${total.toLocaleString('en-IN')}`;

                    // Clear Cart
                    cart = [];
                    saveCart();

                    goToStep(3);
                    showToast("Order submitted successfully!", "success");
                    loadMyOrdersHistory();
                } else {
                    showToast(data.message || "Failed to submit order.", "error");
                }
            })
            .catch(err => {
                showToast("Error connecting to server.", "error");
            });
        });
    }

    const finishCheckout = document.getElementById('finishCheckout');
    if (finishCheckout) {
        finishCheckout.addEventListener('click', () => {
            checkoutModal.classList.remove('active');
        });
    }

    // 8. PRICE RANGE SLIDER LOGIC
    const priceSlider = document.getElementById('priceSlider');
    const priceSliderValue = document.getElementById('priceSliderValue');
    const priceFilterForm = document.getElementById('priceFilterForm');

    if (priceSlider && priceSliderValue) {
        priceSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            priceSliderValue.textContent = `₹${val.toLocaleString('en-IN')}`;
        });
    }

    // 9. SCROLL FADE-IN observer
    const observerOptions = {
        threshold: 0.05,
        rootMargin: "0px 0px -40px 0px"
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const fadeSections = document.querySelectorAll('.fade-in-section');
    fadeSections.forEach(section => {
        sectionObserver.observe(section);
    });

    // 10. TRACK & MY ORDERS LOGIC
    const openTrackOrderBtn = document.getElementById('openTrackOrderBtn');
    const closeTrackOrderBtn = document.getElementById('closeTrackOrderBtn');
    const trackOrderPanel = document.getElementById('trackOrderPanel');
    const trackOrderOverlay = document.getElementById('trackOrderOverlay');
    const trackOrderSearchBtn = document.getElementById('trackOrderSearchBtn');
    const trackOrderIdInput = document.getElementById('trackOrderIdInput');
    const trackOrderResult = document.getElementById('trackOrderResult');
    const trackOrderError = document.getElementById('trackOrderError');
    const myOrdersList = document.getElementById('myOrdersList');

    function toggleTrackOrder(show = true) {
        if (show) {
            trackOrderPanel.classList.add('active');
            trackOrderOverlay.classList.add('active');
            loadMyOrdersHistory();
        } else {
            trackOrderPanel.classList.remove('active');
            trackOrderOverlay.classList.remove('active');
        }
    }

    if (openTrackOrderBtn) {
        openTrackOrderBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleTrackOrder(true);
        });
    }

    if (closeTrackOrderBtn) {
        closeTrackOrderBtn.addEventListener('click', () => toggleTrackOrder(false));
    }
    if (trackOrderOverlay) {
        trackOrderOverlay.addEventListener('click', () => toggleTrackOrder(false));
    }

    function loadMyOrdersHistory() {
        if (!myOrdersList) return;
        const myOrders = JSON.parse(localStorage.getItem('my_orders') || '[]');
        myOrdersList.innerHTML = '';
        if (myOrders.length === 0) {
            myOrdersList.innerHTML = '<div style="font-size:0.85rem; color:var(--text-muted);">No booking requests found.</div>';
            return;
        }
        myOrders.forEach(orderId => {
            const item = document.createElement('div');
            item.className = 'compare-tray-item';
            item.style.cursor = 'pointer';
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.width = '100%';
            item.innerHTML = `
                <span>${orderId}</span>
                <span style="color:var(--accent-cyan); font-weight:700;">Track &rarr;</span>
            `;
            item.addEventListener('click', () => {
                trackOrderIdInput.value = orderId;
                runTrackOrderQuery(orderId);
            });
            myOrdersList.appendChild(item);
        });
    }

    function runTrackOrderQuery(orderId) {
        if (!orderId || orderId.trim() === '') return;
        
        fetch(`/api/order/track/?id=${orderId}`)
        .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(data => {
            trackOrderError.style.display = 'none';
            trackOrderResult.style.display = 'block';
            
            const header = document.getElementById('trackOrderHeader');
            const statusLabel = document.getElementById('trackOrderStatus');
            if (header) header.textContent = `Order: ${data.id}`;
            if (statusLabel) {
                statusLabel.textContent = data.status;
                if (data.status === 'Pending') statusLabel.style.color = 'var(--accent-cyan)';
                else if (data.status === 'Accepted') statusLabel.style.color = 'var(--accent-purple)';
                else if (data.status === 'Delivered') statusLabel.style.color = 'var(--accent-green)';
                else statusLabel.style.color = 'var(--accent-red)';
            }
            
            // Adjust step indicators based on status
            const acceptedInd = document.getElementById('trackStepAcceptedIndicator');
            const acceptedTitle = document.getElementById('trackStepAcceptedTitle');
            const deliveredInd = document.getElementById('trackStepDeliveredIndicator');
            const deliveredTitle = document.getElementById('trackStepDeliveredTitle');
            
            // Reset to defaults
            acceptedInd.style.background = 'var(--border-color)';
            acceptedTitle.style.color = 'var(--text-secondary)';
            deliveredInd.style.background = 'var(--border-color)';
            deliveredTitle.style.color = 'var(--text-secondary)';
            
            if (data.status === 'Accepted') {
                acceptedInd.style.background = 'var(--accent-purple)';
                acceptedTitle.style.color = 'white';
            } else if (data.status === 'Delivered') {
                acceptedInd.style.background = 'var(--accent-green)';
                acceptedTitle.style.color = 'white';
                deliveredInd.style.background = 'var(--accent-green)';
                deliveredTitle.style.color = 'white';
            }
        })
        .catch(() => {
            trackOrderResult.style.display = 'none';
            trackOrderError.style.display = 'block';
        });
    }

    if (trackOrderSearchBtn) {
        trackOrderSearchBtn.addEventListener('click', () => {
            runTrackOrderQuery(trackOrderIdInput.value.trim());
        });
    }

    // Initialize UI on load
    updateCartUI();
    updateWishlistUI();
});

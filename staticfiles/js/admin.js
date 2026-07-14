// admin.js - Interactive Control Logic for MD Electronics Admin Dashboard

document.addEventListener('DOMContentLoaded', () => {
    // Selectors
    const loginOverlay = document.getElementById('login-overlay');
    const dashboardLayout = document.getElementById('dashboard-layout');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error-msg');
    
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const activeTabTitle = document.getElementById('active-tab-title');
    const displayEmail = document.getElementById('admin-display-email');
    
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
    const csrftoken = getCookie('csrftoken');

    // Toast Notifications
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type === 'error' ? 'active' : ''}`;
        toast.style.background = '#1e293b';
        toast.style.borderLeft = `4px solid ${type === 'success' ? 'var(--success)' : (type === 'error' ? 'var(--danger)' : 'var(--accent)')}`;
        toast.style.color = '#fff';
        toast.style.padding = '1rem 1.5rem';
        toast.style.borderRadius = '8px';
        toast.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.3)';
        toast.style.marginTop = '0.5rem';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '0.75rem';
        toast.style.animation = 'slideIn 0.3s ease-out forwards';
        
        const icon = type === 'success' ? '✓' : (type === 'error' ? '✗' : 'ℹ');
        toast.innerHTML = `<span style="font-weight:bold; color:${type === 'success' ? 'var(--success)' : 'var(--danger)'}">${icon}</span> <span>${message}</span>`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => { toast.remove(); }, 300);
        }, 4000);
    }

    // Tab Switching Logic
    const menuItems = document.querySelectorAll('.menu-item[data-tab]');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');
            
            menuItems.forEach(el => el.classList.remove('active'));
            tabPanels.forEach(el => el.classList.remove('active'));
            
            item.classList.add('active');
            const activePanel = document.getElementById(targetTab);
            if (activePanel) activePanel.classList.add('active');
            
            activeTabTitle.textContent = item.textContent.trim();
            
            // Reload specific tab data on switch
            if (targetTab === 'tab-overview') loadStats();
            else if (targetTab === 'tab-products') loadProducts();
            else if (targetTab === 'tab-shop') loadShopSettings();
            else if (targetTab === 'tab-gallery') loadGallery();
            else if (targetTab === 'tab-ledger') loadLedger();
            else if (targetTab === 'tab-offers') loadOffers();
            else if (targetTab === 'tab-instagram') loadInstagramLinks();
            else if (targetTab === 'tab-orders') loadAdminOrders();
        });
    });

    // Theme Toggle Logic
    const currentTheme = localStorage.getItem('admin_theme') || 'dark';
    if (currentTheme === 'light') {
        document.body.classList.add('light-mode');
        document.querySelector('.sun-icon').style.display = 'none';
        document.querySelector('.moon-icon').style.display = 'block';
        themeToggleBtn.querySelector('span').textContent = 'Dark Mode';
    }
    
    themeToggleBtn.addEventListener('click', () => {
        const bodyClass = document.body.classList;
        bodyClass.toggle('light-mode');
        const isLight = bodyClass.contains('light-mode');
        
        localStorage.setItem('admin_theme', isLight ? 'light' : 'dark');
        
        document.querySelector('.sun-icon').style.display = isLight ? 'none' : 'block';
        document.querySelector('.moon-icon').style.display = isLight ? 'block' : 'none';
        themeToggleBtn.querySelector('span').textContent = isLight ? 'Dark Mode' : 'Light Mode';
    });

    // Authentication Session Check
    function checkSession() {
        // Quick session endpoint check
        fetch('/api/admin/stats/')
            .then(res => {
                if (res.status === 200) {
                    loginOverlay.style.display = 'none';
                    dashboardLayout.style.display = 'grid';
                    loadStats();
                } else {
                    loginOverlay.style.display = 'flex';
                    dashboardLayout.style.display = 'none';
                }
            })
            .catch(() => {
                loginOverlay.style.display = 'flex';
                dashboardLayout.style.display = 'none';
            });
    }
    checkSession();

    // Login Form Submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        loginError.style.display = 'none';
        
        fetch('/api/admin/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({ username, password })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                loginOverlay.style.display = 'none';
                dashboardLayout.style.display = 'grid';
                displayEmail.textContent = username;
                showToast("Logged in successfully!");
                loadStats();
            } else {
                loginError.textContent = data.message || "Invalid credentials.";
                loginError.style.display = 'block';
            }
        })
        .catch(() => {
            loginError.textContent = "Server connection refused.";
            loginError.style.display = 'block';
        });
    });

    // Logout Trigger
    logoutBtn.addEventListener('click', () => {
        fetch('/api/admin/logout/', {
            method: 'POST',
            headers: { 'X-CSRFToken': csrftoken }
        })
        .then(() => {
            loginOverlay.style.display = 'flex';
            dashboardLayout.style.display = 'none';
            loginForm.reset();
            showToast("Logged out successfully.", "info");
        });
    });

    // ==========================================
    // 1. STATS / OVERVIEW TAB
    // ==========================================
    function loadStats() {
        fetch('/api/admin/stats/')
            .then(res => res.json())
            .then(data => {
                document.getElementById('stat-total-sales').textContent = `₹${data.total_sales.toLocaleString('en-IN')}`;
                document.getElementById('stat-total-dues').textContent = `₹${data.total_dues.toLocaleString('en-IN')}`;
                document.getElementById('stat-total-customers').textContent = data.total_customers;
                document.getElementById('stat-total-products').textContent = data.total_products;
                
                // Populate overview ledger table
                const tableBody = document.getElementById('overview-recent-transactions');
                tableBody.innerHTML = '';
                if (data.recent_ledger && data.recent_ledger.length > 0) {
                    data.recent_ledger.forEach(item => {
                        const tr = document.createElement('tr');
                        const statusClass = item.due <= 0 ? 'success' : (item.paid > 0 ? 'warning' : 'danger');
                        const statusText = item.due <= 0 ? 'Fully Paid' : 'Pending Dues';
                        tr.innerHTML = `
                            <td><strong>${item.name}</strong></td>
                            <td>${item.items}</td>
                            <td>₹${item.total.toLocaleString('en-IN')}</td>
                            <td style="color:${item.due > 0 ? 'var(--danger)' : 'inherit'}">₹${item.due.toLocaleString('en-IN')}</td>
                            <td><span class="status-pill ${statusClass}">${statusText}</span></td>
                        `;
                        tableBody.appendChild(tr);
                    });
                } else {
                    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No transactions recorded.</td></tr>`;
                }
            });
    }

    // ==========================================
    // 2. PRODUCTS TAB (CRUD)
    // ==========================================
    const productForm = document.getElementById('product-form');
    const cancelProdEditBtn = document.getElementById('cancel-prod-edit-btn');
    const productFormTitle = document.getElementById('product-form-title');
    const editImgPreviewContainer = document.getElementById('edit-img-preview-container');
    const editImgPreview = document.getElementById('edit-img-preview');
    
    function loadProducts() {
        fetch('/api/admin/products/')
            .then(res => res.json())
            .then(products => {
                const tableBody = document.getElementById('admin-product-table-body');
                tableBody.innerHTML = '';
                products.forEach(p => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><img src="${p.image_url || 'https://via.placeholder.com/50'}" style="width:40px; height:40px; border-radius:6px; object-fit:cover;"></td>
                        <td><strong>${p.name}</strong><br><small style="color:var(--text-secondary)">${p.brand || 'Generic'}</small></td>
                        <td>${p.category}</td>
                        <td style="font-weight:700; color:var(--accent)">₹${p.price.toLocaleString('en-IN')}</td>
                        <td>${p.stock || '10'}</td>
                        <td style="text-align:right;">
                            <button class="action-icon-btn edit" data-id="${p.id}">✏️</button>
                            <button class="action-icon-btn delete" data-id="${p.id}">🗑️</button>
                        </td>
                    `;
                    tableBody.appendChild(tr);
                });
            });
    }

    // Handle Edit / Delete Product Click Actions
    document.getElementById('admin-product-table-body').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = parseInt(btn.getAttribute('data-id'));
        if (!id) return;

        if (btn.classList.contains('edit')) {
            // Edit mode: fetch product and populate form
            fetch(`/api/admin/products/?id=${id}`)
                .then(res => res.json())
                .then(p => {
                    document.getElementById('product-edit-id').value = p.id;
                    document.getElementById('prod-name').value = p.name;
                    document.getElementById('prod-brand').value = p.brand || '';
                    document.getElementById('prod-category').value = p.category;
                    document.getElementById('prod-discountedPrice').value = p.price;
                    document.getElementById('prod-originalPrice').value = p.original_price || p.price;
                    document.getElementById('prod-stock').value = p.stock || 10;
                    document.getElementById('prod-badge').value = p.badge || '';
                    document.getElementById('prod-desc').value = p.description || '';
                    document.getElementById('prod-specs').value = p.specs_json ? JSON.stringify(p.specs_json) : '{}';
                    
                    productFormTitle.textContent = "Edit Product Properties";
                    cancelProdEditBtn.style.display = 'block';
                    
                    if (p.image_url) {
                        editImgPreview.src = p.image_url;
                        editImgPreviewContainer.style.display = 'flex';
                    } else {
                        editImgPreviewContainer.style.display = 'none';
                    }
                    
                    // Scroll form into view
                    document.getElementById('tab-products').scrollIntoView({ behavior: 'smooth' });
                });
        } else if (btn.classList.contains('delete')) {
            if (confirm("Are you sure you want to delete this product?")) {
                fetch(`/api/admin/products/delete/${id}/`, {
                    method: 'POST',
                    headers: { 'X-CSRFToken': csrftoken }
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        showToast("Product deleted successfully.");
                        loadProducts();
                    } else {
                        showToast(data.message || "Failed to delete product.", "error");
                    }
                });
            }
        }
    });

    cancelProdEditBtn.addEventListener('click', () => {
        productForm.reset();
        document.getElementById('product-edit-id').value = '';
        productFormTitle.textContent = "Add New Product";
        cancelProdEditBtn.style.display = 'none';
        editImgPreviewContainer.style.display = 'none';
    });

    // Save/Submit Product
    productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const editId = document.getElementById('product-edit-id').value;
        const formData = new FormData();
        
        formData.append('id', editId);
        formData.append('name', document.getElementById('prod-name').value.trim());
        formData.append('brand', document.getElementById('prod-brand').value.trim());
        formData.append('category', document.getElementById('prod-category').value);
        formData.append('price', document.getElementById('prod-discountedPrice').value);
        formData.append('original_price', document.getElementById('prod-originalPrice').value);
        formData.append('stock', document.getElementById('prod-stock').value);
        formData.append('badge', document.getElementById('prod-badge').value.trim());
        formData.append('description', document.getElementById('prod-desc').value.trim());
        formData.append('specs', document.getElementById('prod-specs').value.trim());
        
        const fileInput = document.getElementById('prod-image');
        if (fileInput.files.length > 0) {
            formData.append('image', fileInput.files[0]);
        }
        
        const removeImage = document.getElementById('prod-remove-image');
        if (removeImage && removeImage.checked) {
            formData.append('remove_image', 'true');
        }

        fetch('/api/admin/products/save/', {
            method: 'POST',
            headers: { 'X-CSRFToken': csrftoken },
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast("Product saved successfully!");
                productForm.reset();
                cancelProdEditBtn.click();
                loadProducts();
            } else {
                showToast(data.message || "Failed to save product.", "error");
            }
        })
        .catch(() => {
            showToast("Server connection error while saving.", "error");
        });
    });

    // ==========================================
    // 3. SHOP CONFIGURATION TAB
    // ==========================================
    const shopDetailsForm = document.getElementById('shop-details-form');
    const shopAchievementsForm = document.getElementById('shop-achievements-form');
    const shopAboutForm = document.getElementById('shop-about-form');
    const ownerAvatarPreviewContainer = document.getElementById('owner-avatar-preview-container');
    const ownerAvatarPreview = document.getElementById('owner-avatar-preview');

    function loadShopSettings() {
        fetch('/api/admin/shop/')
            .then(res => res.json())
            .then(data => {
                // Identity
                document.getElementById('shop-name-input').value = data.name || 'MD Electronics';
                document.getElementById('shop-tagline-input').value = data.tagline || '';
                document.getElementById('shop-desc-input').value = data.description || '';
                document.getElementById('shop-phone-input').value = data.phone || '';
                document.getElementById('shop-hours-input').value = data.hours || '';
                document.getElementById('shop-address-input').value = data.address || '';
                
                // Achievements
                document.getElementById('ach-experience-input').value = data.experience_years || 15;
                document.getElementById('ach-customers-input').value = data.customers_count || 10000;
                document.getElementById('ach-awards-input').value = data.awards ? data.awards.join(', ') : '';
                
                // Bio / Owner
                document.getElementById('about-owner-name').value = data.owner_name || '';
                document.getElementById('about-owner-bio').value = data.owner_bio || '';
                
                if (data.owner_photo_url) {
                    ownerAvatarPreview.src = data.owner_photo_url;
                    ownerAvatarPreviewContainer.style.display = 'flex';
                } else {
                    ownerAvatarPreviewContainer.style.display = 'none';
                }
            });
    }

    // Save Identity Details
    shopDetailsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const payload = {
            type: 'identity',
            name: document.getElementById('shop-name-input').value.trim(),
            tagline: document.getElementById('shop-tagline-input').value.trim(),
            description: document.getElementById('shop-desc-input').value.trim(),
            phone: document.getElementById('shop-phone-input').value.trim(),
            hours: document.getElementById('shop-hours-input').value.trim(),
            address: document.getElementById('shop-address-input').value.trim()
        };
        saveShopPayload(payload);
    });

    // Save Achievements Stats
    shopAchievementsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const payload = {
            type: 'achievements',
            experience_years: document.getElementById('ach-experience-input').value,
            customers_count: document.getElementById('ach-customers-input').value,
            awards: document.getElementById('ach-awards-input').value.trim()
        };
        saveShopPayload(payload);
    });

    // Save Owner About details
    shopAboutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('type', 'about');
        formData.append('owner_name', document.getElementById('about-owner-name').value.trim());
        formData.append('owner_bio', document.getElementById('about-owner-bio').value.trim());
        
        const photoInput = document.getElementById('about-owner-photo');
        if (photoInput.files.length > 0) {
            formData.append('owner_photo', photoInput.files[0]);
        }

        fetch('/api/admin/shop/', {
            method: 'POST',
            headers: { 'X-CSRFToken': csrftoken },
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast("Proprietor biography saved!");
                loadShopSettings();
            } else {
                showToast(data.message || "Failed to save biography.", "error");
            }
        });
    });

    function saveShopPayload(payload) {
        fetch('/api/admin/shop/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast("Store settings saved successfully!");
                loadShopSettings();
            } else {
                showToast(data.message || "Failed to save settings.", "error");
            }
        });
    }

    // ==========================================
    // 4. SHOWROOM GALLERY TAB
    // ==========================================
    const galleryUploadForm = document.getElementById('gallery-upload-form');
    
    function loadGallery() {
        fetch('/api/admin/gallery/')
            .then(res => res.json())
            .then(photos => {
                const grid = document.getElementById('admin-gallery-grid');
                grid.innerHTML = '';
                if (photos.length > 0) {
                    photos.forEach(p => {
                        const card = document.createElement('div');
                        card.className = 'admin-gallery-card';
                        card.innerHTML = `
                            <img src="${p.url}">
                            <div class="admin-gallery-card-actions">
                                <button class="delete-gallery-btn" data-name="${p.name}">Delete</button>
                            </div>
                        `;
                        grid.appendChild(card);
                    });
                } else {
                    grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:2rem 0;">No showroom pictures uploaded yet.</p>`;
                }
            });
    }

    galleryUploadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('gallery-image-file');
        if (fileInput.files.length === 0) return;
        
        const formData = new FormData();
        formData.append('image', fileInput.files[0]);

        fetch('/api/admin/gallery/', {
            method: 'POST',
            headers: { 'X-CSRFToken': csrftoken },
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast("Photo uploaded successfully!");
                galleryUploadForm.reset();
                loadGallery();
            } else {
                showToast(data.message || "Failed to upload image.", "error");
            }
        });
    });

    document.getElementById('admin-gallery-grid').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-gallery-btn')) {
            const name = e.target.getAttribute('data-name');
            if (confirm("Delete this picture from gallery?")) {
                fetch(`/api/admin/gallery/?name=${name}`, {
                    method: 'DELETE',
                    headers: { 'X-CSRFToken': csrftoken }
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        showToast("Photo deleted.");
                        loadGallery();
                    }
                });
            }
        }
    });

    // ==========================================
    // 5. LEDGER SHEET TAB
    // ==========================================
    const ledgerModalOverlay = document.getElementById('ledger-modal-overlay');
    const openLedgerModalBtn = document.getElementById('open-ledger-modal-btn');
    const ledgerModalCloseBtn = document.getElementById('ledger-modal-close-btn');
    const ledgerForm = document.getElementById('ledger-form');
    const ledgerModalTitle = document.getElementById('ledger-modal-title');
    
    openLedgerModalBtn.addEventListener('click', () => {
        ledgerForm.reset();
        document.getElementById('ledger-edit-id').value = '';
        ledgerModalTitle.textContent = "Record New Customer Ledger";
        ledgerModalOverlay.classList.add('active');
    });
    
    ledgerModalCloseBtn.addEventListener('click', () => {
        ledgerModalOverlay.classList.remove('active');
    });

    function loadLedger() {
        fetch('/api/admin/ledger/')
            .then(res => res.json())
            .then(ledger => {
                const tableBody = document.getElementById('ledger-table-body');
                tableBody.innerHTML = '';
                ledger.forEach(item => {
                    const tr = document.createElement('tr');
                    const statusClass = item.due <= 0 ? 'success' : (item.paid > 0 ? 'warning' : 'danger');
                    const statusText = item.due <= 0 ? 'Fully Paid' : 'Pending Dues';
                    tr.innerHTML = `
                        <td><strong>${item.name}</strong></td>
                        <td>${item.phone}</td>
                        <td>${item.items}</td>
                        <td>₹${item.total.toLocaleString('en-IN')}</td>
                        <td>₹${item.paid.toLocaleString('en-IN')}</td>
                        <td style="color:${item.due > 0 ? 'var(--danger)' : 'inherit'}">₹${item.due.toLocaleString('en-IN')}</td>
                        <td><span class="status-pill ${statusClass}">${statusText}</span></td>
                        <td style="text-align:right;">
                            <button class="action-icon-btn edit-ledger" data-id="${item.id}">✏️</button>
                            <button class="action-icon-btn delete-ledger" data-id="${item.id}">🗑️</button>
                        </td>
                    `;
                    tableBody.appendChild(tr);
                });
            });
    }

    // Handle Ledger Forms Submit
    ledgerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const payload = {
            id: document.getElementById('ledger-edit-id').value,
            name: document.getElementById('led-name').value.trim(),
            phone: document.getElementById('led-phone').value.trim(),
            items: document.getElementById('led-items').value.trim(),
            total: parseFloat(document.getElementById('led-total').value),
            paid: parseFloat(document.getElementById('led-paid').value || 0)
        };

        fetch('/api/admin/ledger/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast("Ledger entry saved!");
                ledgerModalOverlay.classList.remove('active');
                loadLedger();
            } else {
                showToast(data.message || "Failed to save entry.", "error");
            }
        });
    });

    document.getElementById('ledger-table-body').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.getAttribute('data-id');
        if (!id) return;

        if (btn.classList.contains('edit-ledger')) {
            fetch(`/api/admin/ledger/?id=${id}`)
                .then(res => res.json())
                .then(item => {
                    document.getElementById('ledger-edit-id').value = item.id;
                    document.getElementById('led-name').value = item.name;
                    document.getElementById('led-phone').value = item.phone;
                    document.getElementById('led-items').value = item.items;
                    document.getElementById('led-total').value = item.total;
                    document.getElementById('led-paid').value = item.paid;
                    
                    ledgerModalTitle.textContent = "Edit Ledger Entry";
                    ledgerModalOverlay.classList.add('active');
                });
        } else if (btn.classList.contains('delete-ledger')) {
            if (confirm("Delete this ledger record?")) {
                fetch(`/api/admin/ledger/?id=${id}`, {
                    method: 'DELETE',
                    headers: { 'X-CSRFToken': csrftoken }
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        showToast("Ledger entry deleted.");
                        loadLedger();
                    }
                });
            }
        }
    });

    // ==========================================
    // 6. OFFERS & SALES TAB
    // ==========================================
    const offerForm = document.getElementById('offer-form');
    const cancelOfferEditBtn = document.getElementById('cancel-offer-edit-btn');
    const offerFormTitle = document.getElementById('offer-form-title');

    function loadOffers() {
        fetch('/api/admin/offers/')
            .then(res => res.json())
            .then(offers => {
                const tableBody = document.getElementById('admin-offers-table-body');
                tableBody.innerHTML = '';
                offers.forEach(o => {
                    const tr = document.createElement('tr');
                    const statusClass = o.active ? 'success' : 'danger';
                    const statusText = o.active ? 'Active' : 'Disabled';
                    tr.innerHTML = `
                        <td><strong>${o.title}</strong><br><small style="color:var(--text-secondary)">${o.description}</small></td>
                        <td><code>${o.promocode || 'None'}</code></td>
                        <td><span style="display:inline-block; width:15px; height:15px; border-radius:50%; background-color:${o.color}"></span></td>
                        <td><span class="status-pill ${statusClass}">${statusText}</span></td>
                        <td style="text-align:right;">
                            <button class="action-icon-btn edit-offer" data-id="${o.id}">✏️</button>
                            <button class="action-icon-btn delete-offer" data-id="${o.id}">🗑️</button>
                        </td>
                    `;
                    tableBody.appendChild(tr);
                });
            });
    }

    offerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const payload = {
            id: document.getElementById('offer-edit-id').value,
            title: document.getElementById('offer-title').value.trim(),
            description: document.getElementById('offer-desc').value.trim(),
            promocode: document.getElementById('offer-promocode').value.trim(),
            color: document.getElementById('offer-color').value,
            active: document.getElementById('offer-active').checked
        };

        fetch('/api/admin/offers/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast("Promo offer saved!");
                offerForm.reset();
                cancelOfferEditBtn.click();
                loadOffers();
            } else {
                showToast(data.message || "Failed to save offer.", "error");
            }
        });
    });

    cancelOfferEditBtn.addEventListener('click', () => {
        offerForm.reset();
        document.getElementById('offer-edit-id').value = '';
        offerFormTitle.textContent = "Create New Promo Offer";
        cancelOfferEditBtn.style.display = 'none';
    });

    document.getElementById('admin-offers-table-body').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.getAttribute('data-id');
        if (!id) return;

        if (btn.classList.contains('edit-offer')) {
            fetch(`/api/admin/offers/?id=${id}`)
                .then(res => res.json())
                .then(o => {
                    document.getElementById('offer-edit-id').value = o.id;
                    document.getElementById('offer-title').value = o.title;
                    document.getElementById('offer-desc').value = o.description;
                    document.getElementById('offer-promocode').value = o.promocode || '';
                    document.getElementById('offer-color').value = o.color;
                    document.getElementById('offer-active').checked = o.active;
                    
                    offerFormTitle.textContent = "Edit Promo Offer";
                    cancelOfferEditBtn.style.display = 'block';
                });
        } else if (btn.classList.contains('delete-offer')) {
            if (confirm("Delete this promo offer?")) {
                fetch(`/api/admin/offers/?id=${id}`, {
                    method: 'DELETE',
                    headers: { 'X-CSRFToken': csrftoken }
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        showToast("Offer deleted.");
                        loadOffers();
                    }
                });
            }
        }
    });

    // ==========================================
    // 7. INSTAGRAM FEED TAB
    // ==========================================
    const instaForm = document.getElementById('insta-form');
    const cancelInstaEditBtn = document.getElementById('cancel-insta-edit-btn');
    let editInstaId = null;

    if (cancelInstaEditBtn) {
        cancelInstaEditBtn.addEventListener('click', () => {
            instaForm.reset();
            document.getElementById('insta-id').value = '';
            document.getElementById('insta-form-title').textContent = "Link New Instagram Post";
            document.getElementById('insta-submit-btn').textContent = "Add Instagram Post";
            cancelInstaEditBtn.style.display = 'none';
            editInstaId = null;
        });
    }

    function loadInstagramLinks() {
        fetch('/api/admin/instagram/')
            .then(res => res.json())
            .then(links => {
                const tableBody = document.getElementById('admin-insta-table-body');
                tableBody.innerHTML = '';
                links.forEach(item => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><a href="${item.url}" target="_blank">${item.url}</a></td>
                        <td style="white-space: nowrap;">${item.added_on || 'N/A'}</td>
                        <td style="text-align:right; white-space: nowrap;">
                            <button class="action-icon-btn edit-insta" data-id="${item.id}" style="margin-right: 6px;">✏️</button>
                            <button class="action-icon-btn delete-insta" data-id="${item.id}">🗑️</button>
                        </td>
                    `;
                    tableBody.appendChild(tr);
                });
            });
    }

    instaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const payload = {
            url: document.getElementById('insta-url').value.trim()
        };
        if (editInstaId) {
            payload.id = editInstaId;
        }

        fetch('/api/admin/instagram/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast(editInstaId ? "Instagram link updated!" : "Instagram link added!");
                instaForm.reset();
                if (cancelInstaEditBtn) cancelInstaEditBtn.click();
                loadInstagramLinks();
            } else {
                showToast(data.message || "Failed to save link.", "error");
            }
        });
    });

    document.getElementById('admin-insta-table-body').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.getAttribute('data-id');
        if (!id) return;

        if (btn.classList.contains('edit-insta')) {
            fetch('/api/admin/instagram/')
                .then(res => res.json())
                .then(links => {
                    const item = links.find(x => x.id === id);
                    if (item) {
                        document.getElementById('insta-url').value = item.url;
                        document.getElementById('insta-id').value = item.id;
                        document.getElementById('insta-form-title').textContent = "Edit Instagram Post";
                        document.getElementById('insta-submit-btn').textContent = "Update Instagram Post";
                        if (cancelInstaEditBtn) cancelInstaEditBtn.style.display = 'block';
                        editInstaId = item.id;
                    }
                });
        } else if (btn.classList.contains('delete-insta')) {
            if (confirm("Delete this instagram link?")) {
                fetch(`/api/admin/instagram/?id=${id}`, {
                    method: 'DELETE',
                    headers: { 'X-CSRFToken': csrftoken }
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        showToast("Link deleted.");
                        if (editInstaId === id && cancelInstaEditBtn) cancelInstaEditBtn.click();
                        loadInstagramLinks();
                    }
                });
            }
        }
    });

    // 10. ORDER MANAGEMENT LOGIC
    function loadAdminOrders() {
        const tbody = document.getElementById('admin-orders-table-body');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Loading customer bookings...</td></tr>';
        
        fetch('/api/admin/orders/')
        .then(res => res.json())
        .then(data => {
            tbody.innerHTML = '';
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted);">No orders recorded yet.</td></tr>';
                return;
            }
            // Reverse so recent bookings are at the top
            data.reverse().forEach(o => {
                const tr = document.createElement('tr');
                
                // Status badge HTML
                let statusBadge = '';
                let actions = '';
                
                if (o.status === 'Pending') {
                    statusBadge = `<span style="background:rgba(6, 182, 212, 0.12); color:var(--accent-cyan); padding:0.25rem 0.6rem; border-radius:30px; font-size:0.75rem; font-weight:700;">Pending</span>`;
                    actions = `
                        <button class="action-btn accept-order-btn" data-id="${o.id}" style="background:var(--accent); color:white; border:none; border-radius:6px; padding:0.25rem 0.6rem; font-size:0.75rem; cursor:pointer; margin-right:4px; font-weight:600;">Accept</button>
                        <button class="action-btn cancel-order-btn" data-id="${o.id}" style="background:var(--danger); color:white; border:none; border-radius:6px; padding:0.25rem 0.6rem; font-size:0.75rem; cursor:pointer; font-weight:600;">Cancel</button>
                    `;
                } else if (o.status === 'Accepted') {
                    statusBadge = `<span style="background:rgba(124, 58, 237, 0.12); color:var(--accent-purple); padding:0.25rem 0.6rem; border-radius:30px; font-size:0.75rem; font-weight:700;">Accepted</span>`;
                    actions = `
                        <button class="action-btn deliver-order-btn" data-id="${o.id}" style="background:var(--success); color:white; border:none; border-radius:6px; padding:0.25rem 0.6rem; font-size:0.75rem; cursor:pointer; margin-right:4px; font-weight:600;">Deliver</button>
                        <button class="action-btn cancel-order-btn" data-id="${o.id}" style="background:var(--danger); color:white; border:none; border-radius:6px; padding:0.25rem 0.6rem; font-size:0.75rem; cursor:pointer; font-weight:600;">Cancel</button>
                    `;
                } else if (o.status === 'Delivered') {
                    statusBadge = `<span style="background:rgba(16, 185, 129, 0.12); color:var(--success); padding:0.25rem 0.6rem; border-radius:30px; font-size:0.75rem; font-weight:700;">Delivered</span>`;
                    actions = `<span style="font-size:0.8rem; color:var(--text-muted);">No action</span>`;
                } else {
                    statusBadge = `<span style="background:rgba(239, 68, 68, 0.12); color:var(--danger); padding:0.25rem 0.6rem; border-radius:30px; font-size:0.75rem; font-weight:700;">Cancelled</span>`;
                    actions = `<span style="font-size:0.8rem; color:var(--text-muted);">No action</span>`;
                }
                
                tr.innerHTML = `
                    <td style="font-weight:700; color:white; min-width: 90px; white-space: nowrap;">${o.id}</td>
                    <td style="min-width: 130px;">${o.customer_name}</td>
                    <td style="min-width: 100px; white-space: nowrap;">${o.customer_phone}</td>
                    <td style="font-size:0.8rem; max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${o.customer_address}">${o.customer_address}</td>
                    <td style="font-weight:700; color:var(--accent-cyan); min-width: 95px; white-space: nowrap;">₹${o.total_amount.toLocaleString('en-IN')}</td>
                    <td style="text-transform:uppercase; font-size:0.75rem; font-weight:700; min-width: 90px; white-space: nowrap;">${o.payment_method}</td>
                    <td style="min-width: 100px; white-space: nowrap;">${statusBadge}</td>
                    <td style="text-align:right; min-width: 150px; white-space: nowrap;">${actions}</td>
                `;
                tbody.appendChild(tr);
            });
        });
    }

    function updateOrderStatus(orderId, newStatus) {
        fetch('/api/admin/orders/update/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({ id: orderId, status: newStatus })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast(`Order status updated to "${newStatus}"!`);
                loadAdminOrders();
            } else {
                showToast(data.message || "Failed to update order status.", "error");
            }
        });
    }

    const ordersTable = document.getElementById('admin-orders-table-body');
    if (ordersTable) {
        ordersTable.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const id = btn.getAttribute('data-id');
            if (!id) return;
            
            if (btn.classList.contains('accept-order-btn')) {
                updateOrderStatus(id, 'Accepted');
            } else if (btn.classList.contains('deliver-order-btn')) {
                updateOrderStatus(id, 'Delivered');
            } else if (btn.classList.contains('cancel-order-btn')) {
                if (confirm(`Cancel order ${id}?`)) {
                    updateOrderStatus(id, 'Cancelled');
                }
            }
        });
    }

});

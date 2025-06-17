// Global variables
let allProducts = [];
let filteredProducts = [];

// Category mapping for display names
const categoryNames = {
    'dulceturi': 'Dulcețuri & Miere',
    'conserve': 'Conserve & Murături',
    'mezeluri': 'Mezeluri',
    'branza': 'Brânzeturi',
    'bauturi': 'Băuturi'
};

// Current filters and sorting
let currentFilters = {
    categories: [],
    regions: [],
    tags: []
};
let currentSort = 'recommended';
let urlCategory = null; // Category from URL parameter

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Load products data
        await loadProducts();
        
        // Check for category parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        urlCategory = urlParams.get('category');
        
        if (urlCategory && categoryNames[urlCategory]) {
            // Apply category filter from URL
            applyCategoryFromURL(urlCategory);
        }
        
        setupEventListeners();
        applyFiltersAndSort();
        
        // Update cart count
        updateCartCount();
        
    } catch (error) {
        console.error('Error initializing products page:', error);
        showError('A apărut o eroare la încărcarea produselor. Vă rugăm să încercați din nou.');
    }
});

// Load products from JSON file
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        allProducts = await response.json();
        filteredProducts = [...allProducts];
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
}

function applyCategoryFromURL(category) {
    // Check the corresponding category checkbox
    const categoryCheckbox = document.getElementById(`cat-${category}`);
    if (categoryCheckbox) {
        categoryCheckbox.checked = true;
        
        // Add visual highlight to the category filter
        categoryCheckbox.closest('.form-check').classList.add('bg-light', 'rounded', 'p-2');
    }
    
    // Show category breadcrumb
    const breadcrumb = document.getElementById('category-breadcrumb');
    const currentCategory = document.getElementById('current-category');
    
    if (breadcrumb && currentCategory) {
        currentCategory.textContent = categoryNames[category];
        breadcrumb.style.display = 'block';
    }
    
    // Update page title
    document.title = `${categoryNames[category]} - Gusturi Românești`;
    
    // Update current filters
    currentFilters.categories = [category];
    
    // Show notification about applied filter
    setTimeout(() => {
        showNotification(`Filtrare aplicată: ${categoryNames[category]}`, 'info');
    }, 500);
}

function setupEventListeners() {
    // Category filters
    document.querySelectorAll('input[id^="cat-"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleFilterChange);
    });

    // Region filters
    document.querySelectorAll('input[id^="reg-"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleFilterChange);
    });

    // Tag filters
    document.querySelectorAll('input[id^="tag-"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleFilterChange);
    });

    // Sort dropdown
    document.getElementById('sortSelect').addEventListener('change', handleSortChange);
}

function handleFilterChange() {
    updateCurrentFilters();
    updateBreadcrumb();
    applyFiltersAndSort();
}

function handleSortChange(e) {
    currentSort = e.target.value;
    applyFiltersAndSort();
}

function updateCurrentFilters() {
    // Update categories
    currentFilters.categories = Array.from(document.querySelectorAll('input[id^="cat-"]:checked'))
        .map(cb => cb.value);

    // Update regions
    currentFilters.regions = Array.from(document.querySelectorAll('input[id^="reg-"]:checked'))
        .map(cb => cb.value);

    // Update tags
    currentFilters.tags = Array.from(document.querySelectorAll('input[id^="tag-"]:checked'))
        .map(cb => cb.value);
}

function updateBreadcrumb() {
    const breadcrumb = document.getElementById('category-breadcrumb');
    const currentCategory = document.getElementById('current-category');
    
    if (currentFilters.categories.length === 1) {
        // Show breadcrumb for single category
        const category = currentFilters.categories[0];
        currentCategory.textContent = categoryNames[category];
        breadcrumb.style.display = 'block';
        
        // Update URL without page reload
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('category', category);
        window.history.replaceState({}, '', newUrl);
    } else {
        // Hide breadcrumb for multiple or no categories
        breadcrumb.style.display = 'none';
        
        // Remove category parameter from URL
        const newUrl = new URL(window.location);
        newUrl.searchParams.delete('category');
        window.history.replaceState({}, '', newUrl);
    }
}

function applyFiltersAndSort() {
    // Start with all products
    filteredProducts = [...allProducts];

    // Apply category filters
    if (currentFilters.categories.length > 0) {
        filteredProducts = filteredProducts.filter(product => 
            currentFilters.categories.includes(product.category)
        );
    }

    // Apply region filters
    if (currentFilters.regions.length > 0) {
        filteredProducts = filteredProducts.filter(product => 
            currentFilters.regions.includes(product.region)
        );
    }

    // Apply tag filters
    if (currentFilters.tags.length > 0) {
        filteredProducts = filteredProducts.filter(product => 
            currentFilters.tags.some(tag => product.tags.includes(tag))
        );
    }

    // Apply sorting
    sortProducts();

    // Render products
    renderProducts();
    updateResultsCount();
}

function sortProducts() {
    switch (currentSort) {
        case 'price-asc':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'recommended':
        default:
            filteredProducts.sort((a, b) => {
                if (a.recommended && !b.recommended) return -1;
                if (!a.recommended && b.recommended) return 1;
                return a.price - b.price; // Secondary sort by price
            });
            break;
    }
}

function renderProducts() {
    const container = document.getElementById('products-container');
    const noResults = document.getElementById('no-results');

    if (filteredProducts.length === 0) {
        container.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';
    container.innerHTML = '';
    
    filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        container.appendChild(productCard);
    });
}

function createProductCard(product) {
    const tagBadges = product.tags.map(tag => {
        const tagLabels = {
            'produs-de-post': { text: 'Produs de post', class: 'bg-success' },
            'fara-zahar': { text: 'Fără zahăr', class: 'bg-info' },
            'artizanal': { text: 'Artizanal', class: 'bg-warning text-dark' },
            'fara-aditivi': { text: 'Fără aditivi', class: 'bg-primary' },
            'ambalat-manual': { text: 'Ambalat manual', class: 'bg-secondary' }
        };
        const tagInfo = tagLabels[tag] || { text: tag, class: 'bg-light text-dark' };
        return `<span class="badge ${tagInfo.class} me-1 mb-1">${tagInfo.text}</span>`;
    }).join('');

    const recommendedBadge = product.recommended ? 
        '<span class="badge bg-danger position-absolute top-0 end-0 m-2">Recomandat</span>' : '';

    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    
    col.innerHTML = `
        <div class="card product-card h-100 shadow-sm position-relative">
            ${recommendedBadge}
            <a href="product.html?id=${product.id}" class="text-decoration-none">
                <img src="${product.image}" class="card-img-top" alt="${product.name}" style="height: 200px; object-fit: cover;">
            </a>
            <div class="card-body d-flex flex-column">
                <span class="badge region-badge mb-2 align-self-start">Produs local din ${product.region}</span>
                <div class="mb-2">
                    ${tagBadges}
                </div>
                <h5 class="card-title">
                    <a href="product.html?id=${product.id}" class="text-decoration-none text-dark">${product.name}</a>
                </h5>
                <p class="card-text text-muted small">${product.description.substring(0, 100)}...</p>
                <div class="mt-auto">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="price">${product.price.toFixed(2)} RON</span>
                        <span class="text-muted small">${product.weight}</span>
                    </div>
                    <button class="btn btn-add-to-cart w-100" onclick="addToCart(${product.id}, '${product.name}', ${product.price}, '${product.image}', '${product.weight}')" aria-label="Adaugă ${product.name} în coș">
                        <i class="bi bi-basket"></i> Adaugă în Coș
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return col;
}

function updateResultsCount() {
    const count = filteredProducts.length;
    const total = allProducts.length;
    
    let resultsText;
    if (urlCategory && currentFilters.categories.length === 1 && currentFilters.categories[0] === urlCategory) {
        // Show category-specific count
        resultsText = `Afișez ${count} produse din categoria "${categoryNames[urlCategory]}"`;
    } else if (count === total) {
        resultsText = `Afișez toate cele ${total} produse`;
    } else {
        resultsText = `Afișez ${count} din ${total} produse`;
    }
    
    document.getElementById('results-count').textContent = resultsText;
}

function clearAllFilters() {
    // Clear all checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
        // Remove visual highlights
        cb.closest('.form-check').classList.remove('bg-light', 'rounded', 'p-2');
    });

    // Reset sort to recommended
    document.getElementById('sortSelect').value = 'recommended';
    currentSort = 'recommended';

    // Reset filters
    currentFilters = {
        categories: [],
        regions: [],
        tags: []
    };

    // Clear URL category
    urlCategory = null;
    
    // Update URL to remove category parameter
    const newUrl = new URL(window.location);
    newUrl.searchParams.delete('category');
    window.history.replaceState({}, '', newUrl);
    
    // Hide breadcrumb
    document.getElementById('category-breadcrumb').style.display = 'none';
    
    // Reset page title
    document.title = 'Produse Tradiționale - Gusturi Românești';

    // Apply changes
    applyFiltersAndSort();
    
    // Show notification
    showNotification('Toate filtrele au fost șterse', 'info');
}

// Show error message
function showError(message) {
    const container = document.getElementById('products-container');
    container.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger text-center my-5">
                <i class="bi bi-exclamation-triangle-fill fs-1 d-block mb-3"></i>
                <h3>Eroare</h3>
                <p>${message}</p>
                <button class="btn btn-primary mt-3" onclick="location.reload()">
                    <i class="bi bi-arrow-clockwise"></i> Reîncarcă Pagina
                </button>
            </div>
        </div>
    `;
}

// Generic notification function (if not already defined in main.js)
function showNotification(message, type = 'info') {
    // Check if the function is already defined in main.js
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }
    
    // If not defined, create our own implementation
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-custom position-fixed`;
    notification.style.cssText = 'top: 100px; right: 20px; z-index: 1050; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 4000);
}
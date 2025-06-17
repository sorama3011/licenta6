// Authentication System for Gusturi Românești
// Handles login, registration, and role-based access control

// Mock user database (will be replaced with backend)
const users = [
    {
        id: 1,
        firstName: 'Maria',
        lastName: 'Popescu',
        email: 'client@example.com',
        password: 'password123',
        phone: '+40721234567',
        role: 'client',
        points: 320,
        totalOrders: 12,
        totalSpent: 1247,
        favoriteProducts: 8
    },
    {
        id: 2,
        firstName: 'Admin',
        lastName: 'Administrator',
        email: 'admin@example.com',
        password: 'admin123',
        phone: '+40722345678',
        role: 'admin'
    },
    {
        id: 3,
        firstName: 'Elena',
        lastName: 'Ionescu',
        email: 'employee@example.com',
        password: 'employee123',
        phone: '+40723456789',
        role: 'employee'
    }
];

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    checkAuthStatus();
    
    // Update navigation based on user role
    updateNavigation();
});

// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.className = 'bi bi-eye-slash';
    } else {
        passwordInput.type = 'password';
        toggleIcon.className = 'bi bi-eye';
    }
}

// Show register form
function showRegisterForm() {
    document.getElementById('registerCard').style.display = 'block';
    document.getElementById('registerCard').scrollIntoView({ behavior: 'smooth' });
}

// Show login form
function showLoginForm() {
    document.getElementById('registerCard').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Handle login form submission
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('loginError');
    
    // Reset error message
    errorElement.style.display = 'none';
    
    // Find user
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        // Login successful
        const userData = {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: user.role,
            loggedIn: true
        };
        
        // Add client-specific data if applicable
        if (user.role === 'client') {
            userData.points = user.points;
            userData.totalOrders = user.totalOrders;
            userData.totalSpent = user.totalSpent;
            userData.favoriteProducts = user.favoriteProducts;
        }
        
        // Store user session
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // Show success message
        showNotification(`Autentificare reușită! Bun venit, ${user.firstName}!`, 'success');
        
        // Redirect based on role
        setTimeout(() => {
            redirectBasedOnRole(user.role);
        }, 1500);
        
        return true;
    } else {
        // Login failed
        errorElement.textContent = 'Email sau parolă incorectă. Vă rugăm să încercați din nou.';
        errorElement.style.display = 'block';
        return false;
    }
}

// Redirect user based on role
function redirectBasedOnRole(role) {
    switch(role) {
        case 'admin':
            window.location.href = 'admin-dashboard.html';
            break;
        case 'employee':
            window.location.href = 'employee-dashboard.html';
            break;
        case 'client':
        default:
            // Check if there's a redirect URL stored
            const redirectUrl = localStorage.getItem('redirectAfterLogin');
            if (redirectUrl) {
                localStorage.removeItem('redirectAfterLogin');
                window.location.href = redirectUrl;
            } else {
                window.location.href = 'client-dashboard.html';
            }
            break;
    }
}

// Handle register form submission
function handleRegister(event) {
    event.preventDefault();
    
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('registerEmail').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const newsletter = document.getElementById('newsletter').checked;
    const errorElement = document.getElementById('registerError');
    
    // Reset error message
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    
    // Validate password
    if (password !== confirmPassword) {
        if (errorElement) {
            errorElement.textContent = 'Parolele nu se potrivesc!';
            errorElement.style.display = 'block';
        } else {
            showNotification('Parolele nu se potrivesc!', 'danger');
        }
        return false;
    }
    
    if (password.length < 8) {
        if (errorElement) {
            errorElement.textContent = 'Parola trebuie să aibă cel puțin 8 caractere!';
            errorElement.style.display = 'block';
        } else {
            showNotification('Parola trebuie să aibă cel puțin 8 caractere!', 'danger');
        }
        return false;
    }
    
    // Check if email already exists
    if (users.some(user => user.email === email)) {
        if (errorElement) {
            errorElement.textContent = 'Această adresă de email este deja înregistrată!';
            errorElement.style.display = 'block';
        } else {
            showNotification('Această adresă de email este deja înregistrată!', 'danger');
        }
        return false;
    }
    
    // In a real application, this would send data to the server
    // For now, we'll just simulate a successful registration
    
    // Create new user (client role by default)
    const newUser = {
        id: users.length + 1,
        firstName,
        lastName,
        email,
        password,
        phone,
        role: 'client',
        points: 0,
        totalOrders: 0,
        totalSpent: 0,
        favoriteProducts: 0
    };
    
    // Add to mock database
    users.push(newUser);
    
    // Show success message
    showNotification('Contul a fost creat cu succes! Te poți autentifica acum.', 'success');
    
    // Reset form and show login
    document.getElementById('registerForm').reset();
    showLoginForm();
    
    return true;
}

// Show forgot password dialog
function showForgotPassword() {
    const email = prompt('Introdu adresa de email pentru resetarea parolei:');
    if (email && email.includes('@')) {
        showNotification('Instrucțiunile pentru resetarea parolei au fost trimise pe email.', 'info');
    }
}

// Check authentication status
function checkAuthStatus() {
    const userData = getUserData();
    
    // If on login page and already logged in, redirect to appropriate dashboard
    if (window.location.pathname.includes('login.html') && userData.loggedIn) {
        redirectBasedOnRole(userData.role);
    }
    
    // If on a protected page and not logged in, redirect to login
    if (isProtectedPage() && !userData.loggedIn) {
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = 'login.html';
    }
    
    // If on a role-specific page and wrong role, redirect to appropriate dashboard
    if (userData.loggedIn && !hasAccessToPage(userData.role)) {
        redirectBasedOnRole(userData.role);
    }
}

// Check if current page is protected (requires login)
function isProtectedPage() {
    const protectedPages = [
        'client-dashboard.html',
        'admin-dashboard.html',
        'employee-dashboard.html',
        'account.html'
    ];
    
    return protectedPages.some(page => window.location.pathname.includes(page));
}

// Check if user has access to current page based on role
function hasAccessToPage(role) {
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('admin-dashboard.html') && role !== 'admin') {
        return false;
    }
    
    if (currentPage.includes('employee-dashboard.html') && role !== 'employee') {
        return false;
    }
    
    if (currentPage.includes('client-dashboard.html') && role !== 'client') {
        return false;
    }
    
    return true;
}

// Get user data from localStorage
function getUserData() {
    return JSON.parse(localStorage.getItem('userData') || '{"loggedIn": false}');
}

// Check if user is logged in
function isUserLoggedIn() {
    const userData = getUserData();
    return userData.loggedIn === true;
}

// Check if user has specific role
function hasRole(role) {
    const userData = getUserData();
    return userData.loggedIn && userData.role === role;
}

// Update navigation based on authentication status
function updateNavigation() {
    const userData = getUserData();
    const accountLinks = document.querySelectorAll('a[href="login.html"]');
    
    accountLinks.forEach(link => {
        const parentLi = link.closest('li');
        if (parentLi) {
            if (userData.loggedIn) {
                // User is logged in - show account menu with role-specific options
                let dashboardLink = 'client-dashboard.html';
                let dashboardText = 'Contul Meu';
                
                if (userData.role === 'admin') {
                    dashboardLink = 'admin-dashboard.html';
                    dashboardText = 'Panou Admin';
                } else if (userData.role === 'employee') {
                    dashboardLink = 'employee-dashboard.html';
                    dashboardText = 'Panou Angajat';
                }
                
                parentLi.innerHTML = `
                    <div class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi bi-person-check"></i> ${userData.name}
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="${dashboardLink}">
                                <i class="bi bi-speedometer2 me-2"></i>${dashboardText}
                            </a></li>
                            ${userData.role === 'client' ? `
                            <li><a class="dropdown-item" href="client-dashboard.html#order-history">
                                <i class="bi bi-clock-history me-2"></i>Istoric Comenzi
                            </a></li>
                            <li><a class="dropdown-item" href="client-dashboard.html#wishlist">
                                <i class="bi bi-heart me-2"></i>Lista de Dorințe
                            </a></li>
                            ` : ''}
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item" href="#" onclick="logout()">
                                <i class="bi bi-box-arrow-right me-2"></i>Deconectare
                            </a></li>
                        </ul>
                    </div>
                `;
            } else {
                // User is not logged in - show login link
                parentLi.innerHTML = `
                    <a class="nav-link" href="login.html">
                        <i class="bi bi-person"></i> Cont
                    </a>
                `;
            }
        }
    });
    
    // Show/hide admin/employee elements based on role
    if (userData.loggedIn) {
        document.querySelectorAll('[data-role]').forEach(element => {
            const requiredRole = element.getAttribute('data-role');
            if (requiredRole === 'any' || requiredRole === userData.role) {
                element.style.display = '';
            } else {
                element.style.display = 'none';
            }
        });
    }
}

// Logout function
function logout() {
    localStorage.removeItem('userData');
    localStorage.removeItem('redirectAfterLogin');
    
    showNotification('Te-ai deconectat cu succes!', 'info');
    
    // Redirect to home page
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// Require login for certain actions
function requireLogin(redirectUrl = null) {
    if (!isUserLoggedIn()) {
        if (redirectUrl) {
            localStorage.setItem('redirectAfterLogin', redirectUrl);
        }
        window.location.href = 'login.html';
        return false;
    }
    return true;
}
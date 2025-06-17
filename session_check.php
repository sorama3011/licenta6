<?php
// Include database configuration
require_once 'db-config.php';

// Start session
session_start();

// Initialize response array
$response = [
    'loggedIn' => false,
    'user' => null,
    'redirect' => null
];

// Check if user is logged in
if (isset($_SESSION['user_id'])) {
    $response['loggedIn'] = true;
    
    // Get user data
    $user_id = $_SESSION['user_id'];
    $user_role = $_SESSION['user_role'];
    
    $response['user'] = [
        'id' => $user_id,
        'name' => $_SESSION['user_name'],
        'email' => $_SESSION['user_email'],
        'role' => $user_role,
        'phone' => $_SESSION['user_phone'] ?? ''
    ];
    
    // Add loyalty points for clients
    if ($user_role == 'client' && isset($_SESSION['loyalty_points'])) {
        $response['user']['loyalty_points'] = $_SESSION['loyalty_points'];
    }
    
    // Check if page requires specific role
    if (isset($_GET['page'])) {
        $page = sanitize_input($_GET['page']);
        
        // Define page access rules
        $page_access = [
            'admin-dashboard.html' => ['administrator'],
            'employee-dashboard.html' => ['angajat'],
            'client-dashboard.html' => ['client']
        ];
        
        // Check if page has access restrictions
        if (isset($page_access[$page]) && !in_array($user_role, $page_access[$page])) {
            // User doesn't have access to this page, redirect to appropriate dashboard
            switch ($user_role) {
                case 'administrator':
                    $response['redirect'] = 'admin-dashboard.html';
                    break;
                case 'angajat':
                    $response['redirect'] = 'employee-dashboard.html';
                    break;
                case 'client':
                default:
                    $response['redirect'] = 'client-dashboard.html';
                    break;
            }
        }
    }
} else {
    // Check if page requires authentication
    if (isset($_GET['page'])) {
        $page = sanitize_input($_GET['page']);
        
        // Define pages that require authentication
        $auth_required = [
            'admin-dashboard.html',
            'employee-dashboard.html',
            'client-dashboard.html',
            'cart.html',
            'checkout.html'
        ];
        
        // Check if current page requires authentication
        if (in_array($page, $auth_required)) {
            $response['redirect'] = 'login.php?redirect=' . urlencode($page);
        }
    }
}

// Return response
header('Content-Type: application/json');
echo json_encode($response);
exit;
?>
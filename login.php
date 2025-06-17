<?php
// Include database configuration
require_once 'db-config.php';

// Start session
session_start();

// Check if user is already logged in
if (isset($_SESSION['user_id'])) {
    // Redirect based on role
    switch ($_SESSION['user_role']) {
        case 'administrator':
            header("Location: admin-dashboard.html");
            break;
        case 'angajat':
            header("Location: employee-dashboard.html");
            break;
        case 'client':
        default:
            header("Location: client-dashboard.html");
            break;
    }
    exit;
}

// Initialize variables
$error = '';
$email = '';

// Check if form is submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get form data
    $email = sanitize_input($_POST['email']);
    $password = $_POST['password'];
    
    // Validate input
    if (empty($email) || empty($password)) {
        $error = "Toate câmpurile sunt obligatorii.";
    } else {
        // Prepare SQL statement
        $sql = "SELECT id, prenume, nume, email, parola, telefon, rol FROM utilizatori WHERE email = '$email' AND activ = 1";
        $result = mysqli_query($conn, $sql);
        
        if (mysqli_num_rows($result) == 1) {
            $user = mysqli_fetch_assoc($result);
            
            // Verify password
            if (password_verify($password, $user['parola'])) {
                // Password is correct, start a new session
                session_regenerate_id();
                
                // Store data in session variables
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_name'] = $user['prenume'] . ' ' . $user['nume'];
                $_SESSION['user_email'] = $user['email'];
                $_SESSION['user_role'] = $user['rol'];
                $_SESSION['user_phone'] = $user['telefon'];
                
                // Update last login time
                $user_id = $user['id'];
                $update_sql = "UPDATE utilizatori SET ultima_autentificare = NOW() WHERE id = $user_id";
                mysqli_query($conn, $update_sql);
                
                // Log the action
                log_action($user_id, 'autentificare', 'Autentificare reușită');
                
                // Get loyalty points for clients
                if ($user['rol'] == 'client') {
                    $points_sql = "SELECT puncte FROM puncte_fidelitate WHERE user_id = $user_id";
                    $points_result = mysqli_query($conn, $points_sql);
                    
                    if (mysqli_num_rows($points_result) == 1) {
                        $points_row = mysqli_fetch_assoc($points_result);
                        $_SESSION['loyalty_points'] = $points_row['puncte'];
                    } else {
                        $_SESSION['loyalty_points'] = 0;
                    }
                }
                
                // Redirect based on role
                switch ($user['rol']) {
                    case 'administrator':
                        header("Location: admin-dashboard.html");
                        break;
                    case 'angajat':
                        header("Location: employee-dashboard.html");
                        break;
                    case 'client':
                    default:
                        // Check if there's a redirect URL
                        if (isset($_SESSION['redirect_url'])) {
                            $redirect = $_SESSION['redirect_url'];
                            unset($_SESSION['redirect_url']);
                            header("Location: $redirect");
                        } else {
                            header("Location: client-dashboard.html");
                        }
                        break;
                }
                exit;
            } else {
                $error = "Email sau parolă incorectă.";
                
                // Log failed login attempt
                log_action(0, 'autentificare_esuata', "Încercare eșuată pentru email: $email");
            }
        } else {
            $error = "Email sau parolă incorectă.";
            
            // Log failed login attempt
            log_action(0, 'autentificare_esuata', "Încercare eșuată pentru email: $email");
        }
    }
}

// Store redirect URL if provided
if (isset($_GET['redirect'])) {
    $_SESSION['redirect_url'] = $_GET['redirect'];
}

// Return JSON response for AJAX requests
if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
    $response = ['success' => empty($error), 'message' => $error];
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}
?>

<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Autentificare - Gusturi Românești</title>
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container mt-5">
        <div class="row justify-content-center">
            <div class="col-md-8 col-lg-6 col-xl-5">
                <div class="card shadow-lg">
                    <div class="card-header bg-primary text-white text-center py-4">
                        <h3 class="mb-0">
                            <i class="bi bi-person-circle me-2"></i>
                            Autentificare
                        </h3>
                    </div>
                    <div class="card-body p-5">
                        <?php if (!empty($error)): ?>
                            <div class="alert alert-danger" role="alert">
                                <?php echo $error; ?>
                            </div>
                        <?php endif; ?>
                        
                        <!-- Login Form -->
                        <form id="loginForm" method="post" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>">
                            <div class="mb-3">
                                <label for="email" class="form-label">Adresa de email</label>
                                <div class="input-group">
                                    <span class="input-group-text">
                                        <i class="bi bi-envelope"></i>
                                    </span>
                                    <input type="email" class="form-control" id="email" name="email" required placeholder="exemplu@email.com" value="<?php echo $email; ?>">
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label">Parola</label>
                                <div class="input-group">
                                    <span class="input-group-text">
                                        <i class="bi bi-lock"></i>
                                    </span>
                                    <input type="password" class="form-control" id="password" name="password" required placeholder="Introdu parola">
                                    <button class="btn btn-outline-secondary" type="button" onclick="togglePassword()">
                                        <i class="bi bi-eye" id="toggleIcon"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="mb-3 form-check">
                                <input type="checkbox" class="form-check-input" id="rememberMe" name="rememberMe">
                                <label class="form-check-label" for="rememberMe">
                                    Ține-mă minte
                                </label>
                            </div>
                            <button type="submit" class="btn btn-primary btn-lg w-100 mb-3">
                                <i class="bi bi-box-arrow-in-right"></i> Autentifică-te
                            </button>
                        </form>

                        <div class="text-center">
                            <a href="forgot-password.php" class="text-decoration-none">
                                Ai uitat parola?
                            </a>
                        </div>

                        <hr class="my-4">

                        <!-- Register Section -->
                        <div class="text-center">
                            <p class="mb-3">Nu ai un cont încă?</p>
                            <a href="signup.php" class="btn btn-outline-primary btn-lg w-100">
                                <i class="bi bi-person-plus"></i> Creează Cont Nou
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
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
    </script>
</body>
</html>
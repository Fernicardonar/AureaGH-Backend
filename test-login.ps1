# Script de prueba para Login y Auth
Write-Host "🔐 Probando sistema de autenticación..." -ForegroundColor Cyan

# Test 1: Registro de usuario de prueba
Write-Host "`n1️⃣ Registrando usuario de prueba..." -ForegroundColor Yellow
$registerBody = @{
    nombre = "Usuario Demo"
    email = "demo@test.com"
    password = "123456"
    telefono = "3001234567"
} | ConvertTo-Json

try {
    $headers = @{ "Content-Type" = "application/json" }
    $register = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" -Method Post -Body $registerBody -Headers $headers
    Write-Host "✅ Usuario registrado: $($register.nombre)" -ForegroundColor Green
    Write-Host "   Email: $($register.email)" -ForegroundColor Gray
    Write-Host "   Role: $($register.role)" -ForegroundColor Gray
    Write-Host "   Token generado: $($register.token.Substring(0,20))..." -ForegroundColor Gray
    $token = $register.token
} catch {
    if ($_.Exception.Message -like "*400*" -or $_.Exception.Message -like "*ya está registrado*") {
        Write-Host "⚠️  Usuario ya existe, intentando login..." -ForegroundColor Yellow
    } else {
        Write-Host "❌ Error en registro: $_" -ForegroundColor Red
    }
}

# Test 2: Login con usuario demo
Write-Host "`n2️⃣ Probando login..." -ForegroundColor Yellow
$loginBody = @{
    email = "demo@test.com"
    password = "123456"
} | ConvertTo-Json

try {
    $headers = @{ "Content-Type" = "application/json" }
    $login = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -Body $loginBody -Headers $headers
    Write-Host "✅ Login exitoso: $($login.nombre)" -ForegroundColor Green
    Write-Host "   Email: $($login.email)" -ForegroundColor Gray
    Write-Host "   Role: $($login.role)" -ForegroundColor Gray
    Write-Host "   Token: $($login.token.Substring(0,20))..." -ForegroundColor Gray
    $token = $login.token
} catch {
    Write-Host "❌ Error en login: $_" -ForegroundColor Red
    exit
}

# Test 3: Obtener perfil con token
Write-Host "`n3️⃣ Obteniendo perfil de usuario..." -ForegroundColor Yellow
try {
    $headers = @{ 
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $token"
    }
    $profile = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/me" -Method Get -Headers $headers
    Write-Host "✅ Perfil obtenido:" -ForegroundColor Green
    Write-Host "   Nombre: $($profile.nombre)" -ForegroundColor Gray
    Write-Host "   Email: $($profile.email)" -ForegroundColor Gray
    Write-Host "   Teléfono: $($profile.telefono)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error obteniendo perfil: $_" -ForegroundColor Red
}

# Test 4: Acceso sin token (debe fallar)
Write-Host "`n4️⃣ Probando acceso sin token (debe fallar)..." -ForegroundColor Yellow
try {
    $headers = @{ "Content-Type" = "application/json" }
    $noauth = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/me" -Method Get -Headers $headers
    Write-Host "❌ ERROR: Accedió sin token (problema de seguridad!)" -ForegroundColor Red
} catch {
    Write-Host "✅ Correctamente rechazado (401 esperado)" -ForegroundColor Green
}

Write-Host "`n✨ Pruebas de autenticación completadas" -ForegroundColor Cyan

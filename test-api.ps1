# Script de prueba para validar API
Write-Host "🧪 Probando API del Backend..." -ForegroundColor Cyan

# Test 1: Endpoint raíz
Write-Host "`n1️⃣ Probando endpoint raíz..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api" -Method Get
    Write-Host "✅ API responde: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

# Test 2: Productos
Write-Host "`n2️⃣ Probando endpoint de productos..." -ForegroundColor Yellow
try {
    $products = Invoke-RestMethod -Uri "http://localhost:3001/api/products" -Method Get
    Write-Host "✅ Productos obtenidos: $($products.Count)" -ForegroundColor Green
    if ($products.Count -gt 0) {
        Write-Host "`nPrimer producto:" -ForegroundColor Cyan
        $products[0] | Select-Object name, price, category, stock, active | Format-List
    } else {
        Write-Host "⚠️  Base de datos vacía - ejecutar: npm run seed" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

# Test 3: Productos destacados
Write-Host "`n3️⃣ Probando productos destacados..." -ForegroundColor Yellow
try {
    $featured = Invoke-RestMethod -Uri "http://localhost:3001/api/products/featured" -Method Get
    Write-Host "✅ Productos destacados: $($featured.Count)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

# Test 4: Promociones
Write-Host "`n4️⃣ Probando promociones..." -ForegroundColor Yellow
try {
    $promos = Invoke-RestMethod -Uri "http://localhost:3001/api/products/promotions" -Method Get
    Write-Host "✅ Productos en promoción: $($promos.Count)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

Write-Host "`n✨ Pruebas completadas" -ForegroundColor Cyan

# 🔧 Backend - Áurea Virtual Shop API

API REST desarrollada con Node.js + Express + MongoDB

## 🚀 Inicio Rápido

```bash
npm install
npm run dev
```

## 📦 Scripts Disponibles

- `npm run dev` - Ejecutar con nodemon (desarrollo)
- `npm start` - Ejecutar en producción
- `npm run test:email` - Probar configuración de email OAuth2
- Seed (catálogo embebido en código)
  - `npm run seed` (por defecto aditivo)
  - `npm run seed:additive`
  - `npm run seed:overwrite`
  - `npm run seed:reset`
- Seed desde JSON (lee `src/seeds/products.json`)
  - `npm run seed:from-json:additive`
  - `npm run seed:from-json:overwrite`
  - `npm run seed:from-json:reset`
- Export/Import (round-trip admin ⇄ seed JSON)
  - `npm run export:products` (DB → `src/seeds/products.json`)
  - `npm run import:products:additive` (JSON → DB)
  - `npm run import:products:overwrite` (JSON → DB)
  - `npm run import:products:reset` (JSON → DB)

## 🏗️ Arquitectura MVC

```
src/
├── config/
│   └── database.js       # Conexión MongoDB
├── models/               # Modelos Mongoose
│   ├── User.model.js
│   ├── Product.model.js
│   ├── Order.model.js
│   └── Newsletter.model.js
├── controllers/          # Lógica de negocio
│   ├── auth.controller.js
│   ├── product.controller.js
│   ├── order.controller.js
│   ├── newsletter.controller.js
│   └── contact.controller.js
├── routes/               # Rutas API
│   ├── auth.routes.js
│   ├── product.routes.js
│   ├── order.routes.js
│   ├── newsletter.routes.js
│   └── contact.routes.js
├── middleware/           # Middlewares
│   ├── auth.middleware.js
│   └── validation.middleware.js
├── seeds/                # Scripts de seed
│   └── seedProducts.js
└── server.js             # Punto de entrada
```

## 📡 API Endpoints

### 🔐 Autenticación (`/api/auth`)

| Método | Endpoint | Descripción | Protegido |
|--------|----------|-------------|-----------|
| POST | `/register` | Registrar usuario | No |
| POST | `/login` | Iniciar sesión | No |
| GET | `/me` | Usuario actual | Sí |
| PUT | `/profile` | Actualizar perfil | Sí |

### 🛍️ Productos (`/api/products`)

| Método | Endpoint | Descripción | Protegido |
|--------|----------|-------------|-----------|
| GET | `/` | Todos los productos | No |
| GET | `/all` | Todos (incluye inactivos) | Admin |
| GET | `/:id` | Producto por ID | No |
| GET | `/category/:category` | Por categoría | No |
| GET | `/featured` | Destacados | No |
| GET | `/promotions` | Promociones | No |
| GET | `/search?q=query` | Buscar | No |
| POST | `/` | Crear producto | Admin |
| PUT | `/:id` | Actualizar | Admin |
| DELETE | `/:id` | Eliminar | Admin |
| POST | `/:id/reviews` | Crear/actualizar calificación | Usuario |
| POST | `/:id/favorite` | Marcar/desmarcar favorito | Usuario |

### 📦 Órdenes (`/api/orders`)

| Método | Endpoint | Descripción | Protegido |
|--------|----------|-------------|-----------|
| POST | `/` | Crear orden | Usuario |
| GET | `/my-orders` | Mis órdenes | Usuario |
| GET | `/:id` | Orden por ID | Usuario |
| GET | `/` | Todas las órdenes | Admin |
| PUT | `/:id/status` | Actualizar estado | Admin |

### 📧 Newsletter (`/api/newsletter`)

| Método | Endpoint | Descripción | Protegido |
|--------|----------|-------------|-----------|
| POST | `/subscribe` | Suscribirse | No |
| POST | `/unsubscribe` | Desuscribirse | No |
| GET | `/subscribers` | Ver suscriptores | Admin |

### 📬 Contacto (`/api/contact`)

| Método | Endpoint | Descripción | Protegido |
|--------|----------|-------------|-----------|
| POST | `/send` | Enviar mensaje | No |

## 🔒 Autenticación JWT

### Registro de Usuario

```bash
POST /api/auth/register
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "email": "juan@email.com",
  "password": "123456",
  "telefono": "+57 300 123 4567"
}
```

**Respuesta:**
```json
{
  "_id": "...",
  "nombre": "Juan Pérez",
  "email": "juan@email.com",
  "telefono": "+57 300 123 4567",
  "role": "user",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "juan@email.com",
  "password": "123456"
}
```

### Usar Token

```bash
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📊 Modelos de Datos

### User
- nombre, email, password (encriptado), telefono
- role (user/admin)
- direccion (opcional)
- timestamps

### Product
- name, description, price, originalPrice
- category (mujer/hombre/accesorios)
- image, images[], stock, sku
- rating, reviews, badge
- featured, onSale, active
- sizes[], colors[]
- timestamps

Notas del modelo y lógica:
- SKU único (índice `unique` + `sparse`).
- Variantes por talla y color: `variants[]` con `{ size, color, stock, sku }`.
- El `stock` total del producto se recalcula como la suma de `variants[].stock` en create/update.
- Si `image` está vacío pero `images[]` tiene elementos, se toma la primera como imagen principal.

### Order
- user (ref User)
- orderItems[] (product, name, quantity, price)
- shippingAddress
- paymentMethod
- itemsPrice, shippingPrice, totalPrice
- status, isPaid, isDelivered
- timestamps

### Newsletter
- email (único)
- active
- subscribedAt

## 🔧 Configuración

### Variables de Entorno (`.env`)

```env
PORT=3001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/liliamboutique
JWT_SECRET=mi_secreto_super_seguro
JWT_EXPIRE=30d

# Email - Método 1: Contraseña de aplicación (simple pero menos seguro)
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=contraseña_aplicacion_gmail

# Email - Método 2: OAuth2 (RECOMENDADO - más seguro)
# Sigue la guía en src/config/OAUTH2_SETUP.md
GMAIL_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=tu_client_secret
GMAIL_REFRESH_TOKEN=tu_refresh_token

FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Configuración de Email

La aplicación soporta dos métodos de autenticación de email:

#### Método 1: Contraseña de Aplicación (Rápido)
1. Habilitar verificación en 2 pasos en Gmail
2. Generar contraseña de aplicación
3. Configurar `EMAIL_PASS` en `.env`

#### Método 2: OAuth2 (Recomendado - Más Seguro) ⭐
1. Sigue la guía detallada en: `src/config/OAUTH2_SETUP.md`
2. Configura las 3 variables OAuth2 en `.env`
3. Ejecuta `npm run test:email` para verificar

**Ventajas de OAuth2:**
- ✅ Más seguro (no expones contraseñas)
- ✅ Tokens temporales que se renuevan automáticamente
- ✅ Revocable desde Google Cloud Console
- ✅ Recomendado por Google para producción

La aplicación usa OAuth2 automáticamente si las credenciales están configuradas, de lo contrario usa contraseña de aplicación como fallback.

## 🌱 Seed de Datos y Round‑Trip con JSON

Tienes dos fuentes para poblar/actualizar el catálogo:

1) Catálogo embebido en código (`src/seeds/seedProducts.js`)

- Aditivo (inserta solo lo que no existe por SKU):
  ```bash
  npm run seed:additive
  ```
- Overwrite (actualiza por SKU, no borra otros registros):
  ```bash
  npm run seed:overwrite
  ```
- Reset (BORRA todo y deja exactamente lo del seed):
  ```bash
  npm run seed:reset
  ```

2) Catálogo en JSON (`src/seeds/products.json`)

- Generar el JSON desde tu base actual (admin → JSON):
  ```bash
  npm run export:products
  ```
  Crea/actualiza `src/seeds/products.json` con los productos de la DB (excluye `_id`, `__v`, timestamps y `reviews`).

- Importar el JSON a la DB:
  - Aditivo:
    ```bash
    npm run import:products:additive
    ```
  - Overwrite:
    ```bash
    npm run import:products:overwrite
    ```
  - Reset:
    ```bash
    npm run import:products:reset
    ```

- Usar el seed pero leyendo el JSON (misma semántica que arriba):
  ```bash
  npm run seed:from-json:additive
  npm run seed:from-json:overwrite
  npm run seed:from-json:reset
  ```

Notas clave:
- Identidad por SKU: todos los modos usan `sku` para insertar/actualizar.
- Overwrite pisa campos existentes del producto para ese SKU.
- Reset borra el catálogo y lo repuebla según la fuente elegida.
- Cambios hechos desde el admin afectan directamente la DB y NO cambian el seed de código. Usa `export:products` cuando quieras convertir el estado actual en tu “nuevo seed JSON”.

## 🛡️ Seguridad

- ✅ Contraseñas encriptadas con bcrypt
- ✅ JWT para autenticación
- ✅ Validación de datos con express-validator
- ✅ CORS configurado
- ✅ Variables de entorno
- ✅ Middleware de protección de rutas
- ✅ Roles de usuario (user/admin)

## 📝 Ejemplo de Peticiones

### Crear Producto (Admin)

```bash
POST /api/products
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Vestido Rojo",
  "description": "Hermoso vestido rojo",
  "price": 199900,
  "category": "mujer",
  "stock": 10,
  "featured": true,
  "sizes": ["S", "M", "L"],
  "colors": ["Rojo"]
}
```

### Crear Orden

```bash
POST /api/orders
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "orderItems": [
    {
      "product": "product_id",
      "name": "Vestido Negro",
      "quantity": 1,
      "price": 269900
    }
  ],
  "shippingAddress": {
    "calle": "Cra 50 #52-13",
    "ciudad": "Bello",
    "departamento": "Antioquia",
    "codigoPostal": "051050"
  },
  "paymentMethod": "whatsapp",
  "itemsPrice": 269900,
  "shippingPrice": 0,
  "totalPrice": 269900
}
```

## 🐛 Manejo de Errores

La API retorna respuestas consistentes:

**Error:**
```json
{
  "message": "Descripción del error"
}
```

**Validación:**
```json
{
  "message": "Errores de validación",
  "errors": [
    {
      "msg": "Email inválido",
      "param": "email",
      "location": "body"
    }
  ]
}
```

---

Desarrollado con 💚 usando Node.js + Express + MongoDB

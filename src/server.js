require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/database')

// Log de variables de entorno críticas
console.log('[Server Init]')
console.log('  NODE_ENV:', process.env.NODE_ENV)
console.log('  JWT_SECRET definido:', !!process.env.JWT_SECRET)
console.log('  MONGODB_URI definido:', !!process.env.MONGODB_URI)
console.log('  PORT:', process.env.PORT || 3001)

// Importar rutas
const authRoutes = require('./routes/auth.routes')
const productRoutes = require('./routes/product.routes')
const orderRoutes = require('./routes/order.routes')
const newsletterRoutes = require('./routes/newsletter.routes')
const contactRoutes = require('./routes/contact.routes')

// Conectar a la base de datos
connectDB()

const app = express()

// Middlewares
// CORS: permite localhost para desarrollo y Vercel para producción
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL?.trim(),
  'https://aureaghf-frontend.vercel.app', // legacy domain (por si persiste en caché)
  'https://aureaghf-frontend-n18i.vercel.app' // nuevo dominio explícito
].filter(Boolean)

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    return cb(new Error('Origen no permitido por CORS: ' + origin))
  },
  credentials: true,
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rutas
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/newsletter', newsletterRoutes)
app.use('/api/contact', contactRoutes)

// Ruta de prueba
app.get('/api', (req, res) => {
  res.json({ message: 'API de Áurea Virtual Shop funcionando correctamente' })
})

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ 
    message: 'Error en el servidor', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  })
})

const PORT = process.env.PORT || 3001

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`)
  console.log(`📍 URL: http://localhost:${PORT}/api`)
})

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason)
})

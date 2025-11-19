require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/database')

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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
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

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`)
  console.log(`📍 URL: http://localhost:${PORT}/api`)
})

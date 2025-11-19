const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del producto es requerido'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'El precio es requerido'],
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  category: {
    type: String,
    required: [true, 'La categoría es requerida'],
    enum: ['mujer', 'hombre', 'accesorios'],
    lowercase: true
  },
  image: {
    type: String,
    default: '/images/placeholder.jpg'
  },
  images: [{
    type: String
  }],
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewsCount: {
    type: Number,
    default: 0
  },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now }
  }],
  badge: {
    type: String,
    enum: ['Nuevo', 'Trending', 'Oferta', ''],
    default: ''
  },
  featured: {
    type: Boolean,
    default: false
  },
  onSale: {
    type: Boolean,
    default: false
  },
  sizes: [{
    type: String,
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  }],
  colors: [{
    type: String
  }],
  // Stock por variante (talla + color)
  variants: [{
    size: { type: String },
    color: { type: String },
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String }
  }],
  // Detalles adicionales del producto
  details: {
    materials: { type: String, trim: true },
    care: { type: String, trim: true },
    features: [{ type: String, trim: true }],
    fit: { type: String, trim: true }
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Índices para búsquedas eficientes
productSchema.index({ name: 'text', description: 'text' })
productSchema.index({ category: 1, featured: 1 })
productSchema.index({ onSale: 1 })

module.exports = mongoose.model('Product', productSchema)

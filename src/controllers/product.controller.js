const Product = require('../models/Product.model')
const User = require('../models/User.model')

// @desc    Obtener todos los productos
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ active: true })
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos', error: error.message })
  }
}

// @desc    Obtener todos los productos (incluye inactivos) - Admin
// @route   GET /api/products/all
// @access  Private/Admin
exports.getAllProductsAdmin = async (req, res) => {
  try {
    const products = await Product.find({})
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos (admin)', error: error.message })
  }
}

// @desc    Obtener producto por ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    
    if (product) {
      res.json(product)
    } else {
      res.status(404).json({ message: 'Producto no encontrado' })
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener producto', error: error.message })
  }
}

// @desc    Obtener productos por categoría
// @route   GET /api/products/category/:category
// @access  Public
exports.getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({ 
      category: req.params.category.toLowerCase(),
      active: true 
    })
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos', error: error.message })
  }
}

// @desc    Obtener productos destacados
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ featured: true, active: true })
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos destacados', error: error.message })
  }
}

// @desc    Obtener promociones
// @route   GET /api/products/promotions
// @access  Public
exports.getPromotions = async (req, res) => {
  try {
    const products = await Product.find({ onSale: true, active: true })
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener promociones', error: error.message })
  }
}

// @desc    Buscar productos
// @route   GET /api/products/search?q=query
// @access  Public
exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query
    const products = await Product.find({
      $text: { $search: q },
      active: true
    })
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar productos', error: error.message })
  }
}

// @desc    Crear producto (Admin)
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    const body = { ...req.body }
    if (Array.isArray(body.variants)) {
      body.stock = body.variants.reduce((acc, v) => acc + Math.max(0, Number(v?.stock || 0)), 0)
    }
    if ((!body.image || body.image === '/images/placeholder.jpg') && Array.isArray(body.images) && body.images.length) {
      body.image = body.images[0]
    }
    const product = await Product.create(body)
    res.status(201).json(product)
  } catch (error) {
    res.status(500).json({ message: 'Error al crear producto', error: error.message })
  }
}

// @desc    Actualizar producto (Admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    const body = { ...req.body }
    if (Array.isArray(body.variants)) {
      body.stock = body.variants.reduce((acc, v) => acc + Math.max(0, Number(v?.stock || 0)), 0)
    }
    if ((!body.image || body.image === '/images/placeholder.jpg') && Array.isArray(body.images) && body.images.length) {
      body.image = body.images[0]
    }
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      body,
      { new: true, runValidators: true }
    )
    
    if (product) {
      res.json(product)
    } else {
      res.status(404).json({ message: 'Producto no encontrado' })
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar producto', error: error.message })
  }
}

// @desc    Eliminar producto (Admin)
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    
    if (product) {
      res.json({ message: 'Producto eliminado' })
    } else {
      res.status(404).json({ message: 'Producto no encontrado' })
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar producto', error: error.message })
  }
}

// @desc    Crear o actualizar reseña/calificación del producto
// @route   POST /api/products/:id/reviews
// @access  Private
exports.addOrUpdateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' })
    }

    const parsedRating = Number(rating)
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: 'La calificación debe ser un número entre 1 y 5' })
    }

    // Buscar si ya existe reseña del usuario
    const existing = product.reviews.find(r => r.user.toString() === req.user._id.toString())
    if (existing) {
      existing.rating = parsedRating
      if (comment !== undefined) existing.comment = comment
      existing.createdAt = new Date()
    } else {
      product.reviews.push({ user: req.user._id, rating: parsedRating, comment })
    }

    // Recalcular promedio y conteo
    product.reviewsCount = product.reviews.length
    const sum = product.reviews.reduce((acc, r) => acc + r.rating, 0)
    product.rating = product.reviewsCount ? (sum / product.reviewsCount) : 0

    await product.save()

    const userReview = product.reviews.find(r => r.user.toString() === req.user._id.toString())
    res.json({ rating: product.rating, reviewsCount: product.reviewsCount, userReview })
  } catch (error) {
    res.status(500).json({ message: 'Error al guardar reseña', error: error.message })
  }
}

// @desc    Marcar/Desmarcar favorito para el usuario actual
// @route   POST /api/products/:id/favorite
// @access  Private
exports.toggleFavorite = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) return res.status(401).json({ message: 'Usuario no autorizado' })

    const productId = req.params.id
    const index = (user.favorites || []).findIndex(p => p.toString() === productId)
    let favorited = false
    if (index >= 0) {
      user.favorites.splice(index, 1)
      favorited = false
    } else {
      user.favorites = user.favorites || []
      user.favorites.push(productId)
      favorited = true
    }
    await user.save()
    res.json({ favorited, favorites: user.favorites })
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar favorito', error: error.message })
  }
}

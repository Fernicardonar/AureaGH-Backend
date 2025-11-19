const express = require('express')
const router = express.Router()
const { protect, admin } = require('../middleware/auth.middleware')
const {
  getAllProducts,
  getAllProductsAdmin,
  getProductById,
  getProductsByCategory,
  getFeaturedProducts,
  getPromotions,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  addOrUpdateReview,
  toggleFavorite
} = require('../controllers/product.controller')

// Rutas públicas
router.get('/', getAllProducts)
router.get('/all', protect, admin, getAllProductsAdmin)
router.get('/search', searchProducts)
router.get('/featured', getFeaturedProducts)
router.get('/promotions', getPromotions)
router.get('/category/:category', getProductsByCategory)
router.get('/:id', getProductById)

// Rutas protegidas (Admin)
router.post('/', protect, admin, createProduct)
router.put('/:id', protect, admin, updateProduct)
router.delete('/:id', protect, admin, deleteProduct)

// Rutas protegidas (Usuario)
router.post('/:id/reviews', protect, addOrUpdateReview)
router.post('/:id/favorite', protect, toggleFavorite)

module.exports = router

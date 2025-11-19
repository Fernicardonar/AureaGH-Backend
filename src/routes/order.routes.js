const express = require('express')
const router = express.Router()
const { protect, admin } = require('../middleware/auth.middleware')
const {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders
} = require('../controllers/order.controller')

// Rutas protegidas
router.post('/', protect, createOrder)
router.get('/my-orders', protect, getMyOrders)
router.get('/:id', protect, getOrderById)

// Rutas admin
router.get('/', protect, admin, getAllOrders)
router.put('/:id/status', protect, admin, updateOrderStatus)

module.exports = router

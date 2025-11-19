const express = require('express')
const router = express.Router()
const { protect, admin } = require('../middleware/auth.middleware')
const {
  subscribe,
  unsubscribe,
  getAllSubscribers
} = require('../controllers/newsletter.controller')

// Rutas públicas
router.post('/subscribe', subscribe)
router.post('/unsubscribe', unsubscribe)

// Rutas admin
router.get('/subscribers', protect, admin, getAllSubscribers)

module.exports = router

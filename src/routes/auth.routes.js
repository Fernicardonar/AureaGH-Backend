const express = require('express')
const router = express.Router()
const { body } = require('express-validator')
const { validate } = require('../middleware/validation.middleware')
const { protect } = require('../middleware/auth.middleware')
const {
  register,
  login,
  getMe,
  updateProfile,
  getMyFavorites,
  forgotPassword,
  resetPassword
} = require('../controllers/auth.controller')

// Validaciones
const registerValidation = [
  body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
]

const loginValidation = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es requerida')
]

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Email inválido')
]

const resetPasswordValidation = [
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
]

// Rutas públicas
router.post('/register', registerValidation, validate, register)
router.post('/login', loginValidation, validate, login)
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword)
router.put('/reset-password/:resetToken', resetPasswordValidation, validate, resetPassword)

// Rutas protegidas
router.get('/me', protect, getMe)
router.put('/profile', protect, updateProfile)
router.get('/favorites', protect, getMyFavorites)

module.exports = router

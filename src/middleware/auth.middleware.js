const jwt = require('jsonwebtoken')
const User = require('../models/User.model')

// Proteger rutas - verificar JWT
exports.protect = async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Obtener token del header
      token = req.headers.authorization.split(' ')[1]

      console.log('[Auth Middleware] Token recibido:', token.substring(0, 20) + '...')
      console.log('[Auth Middleware] JWT_SECRET definido:', !!process.env.JWT_SECRET)

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      console.log('[Auth Middleware] Token decodificado:', decoded)

      // Obtener usuario del token
      req.user = await User.findById(decoded.id).select('-password')

      console.log('[Auth Middleware] Usuario encontrado:', req.user ? req.user._id : 'NO ENCONTRADO')

      if (!req.user) {
        return res.status(401).json({ message: 'Usuario no encontrado' })
      }

      next()
    } catch (error) {
      console.error('[Auth Middleware] Error:', error.message)
      return res.status(401).json({ message: 'No autorizado, token inválido', error: error.message })
    }
  }

  if (!token) {
    console.error('[Auth Middleware] No hay token en headers')
    return res.status(401).json({ message: 'No autorizado, no hay token' })
  }
}

// Verificar si el usuario es admin
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next()
  } else {
    res.status(403).json({ message: 'No autorizado, se requiere rol de administrador' })
  }
}

// Generar JWT
exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  })
}

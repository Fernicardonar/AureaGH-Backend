const jwt = require('jsonwebtoken')
const User = require('../models/User.model')

// Proteger rutas - verificar JWT
exports.protect = async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Obtener token del header
      token = req.headers.authorization.split(' ')[1]

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Obtener usuario del token
      req.user = await User.findById(decoded.id).select('-password')

      if (!req.user) {
        return res.status(401).json({ message: 'Usuario no encontrado' })
      }

      next()
    } catch (error) {
      console.error(error)
      return res.status(401).json({ message: 'No autorizado, token inválido' })
    }
  }

  if (!token) {
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

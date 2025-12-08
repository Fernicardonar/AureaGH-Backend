const User = require('../models/User.model')
const { generateToken } = require('../middleware/auth.middleware')
const { sendEmail } = require('../config/email')
const crypto = require('crypto')

// @desc    Registrar nuevo usuario
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { nombre, email, password, telefono } = req.body

    // Normalizar email para evitar problemas de unicidad (Mongoose lo guarda en lowercase)
    const normalizedEmail = (email || '').toLowerCase().trim()

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ email: normalizedEmail })
    if (userExists) {
      return res.status(400).json({ message: 'El email ya está registrado' })
    }

    // Crear usuario
    const user = await User.create({
      nombre,
      email: normalizedEmail,
      password,
      telefono
    })

    if (user) {
      // Validar que exista JWT_SECRET para generar el token
      if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: 'Configuración inválida del servidor: falta JWT_SECRET' })
      }
      res.status(201).json({
        _id: user._id,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        role: user.role,
        token: generateToken(user._id)
      })
    } else {
      return res.status(400).json({ message: 'No se pudo crear el usuario. Revisa los datos enviados.' })
    }
  } catch (error) {
    // Manejo especial de error por duplicado de email (índice único)
    if (error && (error.code === 11000 || (error.message || '').includes('E11000'))) {
      return res.status(400).json({ message: 'El email ya está registrado' })
    }
    res.status(500).json({ message: 'Error al registrar usuario', error: error.message })
  }
}

// @desc    Login de usuario
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Normalizar email (coherente con registro y esquema lowercase)
    const normalizedEmail = (email || '').toLowerCase().trim()

    // Buscar usuario y incluir password
    const user = await User.findOne({ email: normalizedEmail }).select('+password')

    if (user && (await user.matchPassword(password))) {
      if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: 'Configuración inválida del servidor: falta JWT_SECRET' })
      }
      res.json({
        _id: user._id,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        role: user.role,
        token: generateToken(user._id)
      })
    } else {
      res.status(401).json({ message: 'Email o contraseña incorrectos' })
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al iniciar sesión', error: error.message })
  }
}

// @desc    Obtener usuario actual
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuario', error: error.message })
  }
}

// @desc    Actualizar perfil de usuario
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (user) {
      user.nombre = req.body.nombre || user.nombre
      user.email = req.body.email || user.email
      user.telefono = req.body.telefono || user.telefono
      
      if (req.body.direccion) {
        user.direccion = req.body.direccion
      }

      if (req.body.password) {
        user.password = req.body.password
      }

      const updatedUser = await user.save()

      res.json({
        _id: updatedUser._id,
        nombre: updatedUser.nombre,
        email: updatedUser.email,
        telefono: updatedUser.telefono,
        role: updatedUser.role,
        direccion: updatedUser.direccion
      })
    } else {
      res.status(404).json({ message: 'Usuario no encontrado' })
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar perfil', error: error.message })
  }
}

// @desc    Obtener favoritos del usuario actual
// @route   GET /api/auth/favorites
// @access  Private
exports.getMyFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'favorites',
      select: 'name price image category rating reviewsCount'
    })
    res.json({ favorites: user.favorites || [] })
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener favoritos', error: error.message })
  }
}

// @desc    Solicitar recuperación de contraseña
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: 'Por favor proporciona un email' })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const user = await User.findOne({ email: normalizedEmail })

    if (!user) {
      return res.status(404).json({ message: 'No existe usuario con ese email' })
    }

    // Generar token de reset
    const resetToken = user.getResetPasswordToken()
    await user.save({ validateBeforeSave: false })

    // URL de reset - en desarrollo usa localhost, en producción usa FRONTEND_URL
    const frontendUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:5173' 
      : (process.env.FRONTEND_URL || 'http://localhost:5173')
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`

    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Recuperación de Contraseña</h2>
        <p>Has solicitado recuperar tu contraseña.</p>
        <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 12px 24px; margin: 20px 0; 
                  background-color: #000; color: #fff; text-decoration: none; 
                  border-radius: 4px;">
          Restablecer Contraseña
        </a>
        <p style="color: #666; font-size: 14px;">
          Este enlace expirará en 10 minutos.
        </p>
        <p style="color: #666; font-size: 14px;">
          Si no solicitaste este cambio, ignora este mensaje.
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          AureaGH - Tu tienda de moda
        </p>
      </div>
    `

    try {
      await sendEmail({
        to: user.email,
        subject: 'Recuperación de Contraseña - AureaGH',
        html: message
      })

      res.json({ 
        success: true, 
        message: 'Email de recuperación enviado. Revisa tu bandeja de entrada.' 
      })
    } catch (error) {
      console.error('Error al enviar email:', error)
      user.resetPasswordToken = undefined
      user.resetPasswordExpire = undefined
      await user.save({ validateBeforeSave: false })

      return res.status(500).json({ 
        message: 'Error al enviar el email de recuperación. Intenta nuevamente.' 
      })
    }
  } catch (error) {
    console.error('Error en forgotPassword:', error)
    res.status(500).json({ message: 'Error al procesar la solicitud', error: error.message })
  }
}

// @desc    Restablecer contraseña
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body

    if (!password) {
      return res.status(400).json({ message: 'La contraseña es requerida' })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' })
    }

    // Hashear el token recibido para comparar con el DB
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex')

    // Buscar usuario con token válido y no expirado
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpire')

    if (!user) {
      return res.status(400).json({ 
        message: 'Token inválido o expirado. Solicita un nuevo enlace de recuperación.' 
      })
    }

    // Actualizar password
    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save()

    res.json({ 
      success: true,
      message: 'Contraseña actualizada exitosamente' 
    })
  } catch (error) {
    console.error('Error en resetPassword:', error)
    res.status(500).json({ message: 'Error al restablecer contraseña', error: error.message })
  }
}

const User = require('../models/User.model')
const { generateToken } = require('../middleware/auth.middleware')

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

    // Buscar usuario y incluir password
    const user = await User.findOne({ email }).select('+password')

    if (user && (await user.matchPassword(password))) {
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

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const userSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: 6,
    select: false
  },
  telefono: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  direccion: {
    calle: String,
    ciudad: String,
    departamento: String,
    codigoPostal: String
  },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpire: {
    type: Date,
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Encriptar password antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next()
  }
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Método para comparar passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// Generar token de reset de password
userSchema.methods.getResetPasswordToken = function() {
  // Generar token aleatorio
  const resetToken = crypto.randomBytes(32).toString('hex')
  
  // Hashear y guardar en DB
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')
  
  // Establecer expiración (10 minutos)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000
  
  return resetToken
}

module.exports = mongoose.model('User', userSchema)

const Newsletter = require('../models/Newsletter.model')

// @desc    Suscribirse al newsletter
// @route   POST /api/newsletter/subscribe
// @access  Public
exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body

    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Email inválido' })
    }

    // Verificar si ya existe
    const existingSubscriber = await Newsletter.findOne({ email })
    
    if (existingSubscriber) {
      if (existingSubscriber.active) {
        return res.status(200).json({ message: 'Ya estás suscrito a nuestro newsletter' })
      } else {
        // Reactivar suscripción
        existingSubscriber.active = true
        await existingSubscriber.save()
        return res.json({ message: 'Suscripción reactivada exitosamente' })
      }
    }

    // Crear nueva suscripción
    await Newsletter.create({ email })
    res.status(201).json({ message: '¡Gracias por suscribirte! Recibirás nuestras últimas novedades.' })
  } catch (error) {
    res.status(500).json({ message: 'Error al suscribirse', error: error.message })
  }
}

// @desc    Desuscribirse del newsletter
// @route   POST /api/newsletter/unsubscribe
// @access  Public
exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.body
    
    const subscriber = await Newsletter.findOne({ email })
    
    if (subscriber) {
      subscriber.active = false
      await subscriber.save()
      res.json({ message: 'Te has desuscrito del newsletter' })
    } else {
      res.status(404).json({ message: 'Email no encontrado' })
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al desuscribirse', error: error.message })
  }
}

// @desc    Obtener todos los suscriptores (Admin)
// @route   GET /api/newsletter/subscribers
// @access  Private/Admin
exports.getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Newsletter.find({ active: true }).sort('-subscribedAt')
    res.json(subscribers)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener suscriptores', error: error.message })
  }
}

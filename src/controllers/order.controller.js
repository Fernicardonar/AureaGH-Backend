const Order = require('../models/Order.model')

// @desc    Crear nueva orden
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice
    } = req.body

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({ message: 'No hay items en la orden' })
    }

    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice
    })

    res.status(201).json(order)
  } catch (error) {
    res.status(500).json({ message: 'Error al crear orden', error: error.message })
  }
}

// @desc    Obtener órdenes del usuario
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('orderItems.product', 'name image price')
      .sort('-createdAt')
    res.json(orders)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener órdenes', error: error.message })
  }
}

// @desc    Obtener orden por ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'nombre email')
      .populate('orderItems.product', 'name image price')

    if (order) {
      // Verificar que la orden pertenezca al usuario o sea admin
      if (order.user._id.toString() === req.user._id.toString() || req.user.role === 'admin') {
        res.json(order)
      } else {
        res.status(403).json({ message: 'No autorizado para ver esta orden' })
      }
    } else {
      res.status(404).json({ message: 'Orden no encontrada' })
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener orden', error: error.message })
  }
}

// @desc    Actualizar estado de orden (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)

    if (order) {
      order.status = req.body.status || order.status
      
      if (req.body.status === 'entregado') {
        order.isDelivered = true
        order.deliveredAt = Date.now()
      }

      const updatedOrder = await order.save()
      res.json(updatedOrder)
    } else {
      res.status(404).json({ message: 'Orden no encontrada' })
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar orden', error: error.message })
  }
}

// @desc    Obtener todas las órdenes (Admin)
// @route   GET /api/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'nombre email')
      .sort('-createdAt')
    res.json(orders)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener órdenes', error: error.message })
  }
}

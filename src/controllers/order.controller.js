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

// @desc    Crear orden por WhatsApp (carrito + guardar en BD)
// @route   POST /api/orders/whatsapp/create
// @access  Private
exports.createWhatsAppOrder = async (req, res) => {
  try {
    const { cartItems, total, shippingAddress } = req.body

    console.log('[createWhatsAppOrder] Datos recibidos:')
    console.log('  cartItems:', cartItems)
    console.log('  total:', total)
    console.log('  shippingAddress:', shippingAddress)
    console.log('  user._id:', req.user._id)

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: 'Carrito vacío' })
    }

    // Preparar items de la orden
    const orderItems = cartItems.map(item => ({
      product: item.productId || item._id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      size: item.selectedSize || item.size || 'Sin especificar',
      color: item.selectedColor || item.color || 'Sin especificar'
    }))

    console.log('[createWhatsAppOrder] orderItems mapeados:', JSON.stringify(orderItems, null, 2))

    // Crear orden con estado "pendiente_confirmacion"
    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress: {
        calle: 'Por confirmar en WhatsApp',
        ciudad: 'Por confirmar',
        departamento: 'Por confirmar'
      },
      paymentMethod: 'whatsapp',
      itemsPrice: total,
      shippingPrice: 0,
      totalPrice: total,
      status: 'pendiente_confirmacion',
      isPaid: false
    })

    // Retornar orden creada para que el frontend pueda usar el ID
    res.status(201).json({
      success: true,
      orderId: order._id,
      message: 'Orden registrada. Por favor, envía tu comprobante de pago en WhatsApp.',
      order
    })
  } catch (error) {
    console.error('[createWhatsAppOrder] Error:', error.message)
    console.error('[createWhatsAppOrder] Stack:', error.stack)
    res.status(500).json({ 
      success: false,
      message: 'Error al crear orden', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

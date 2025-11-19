require('dotenv').config()
const connectDB = require('../config/database')
const Product = require('../models/Product.model')

;(async () => {
  try {
    await connectDB()
    const res = await Product.updateMany(
      { active: { $exists: false } },
      { $set: { active: true } }
    )
    console.log(`✅ Productos actualizados: ${res.modifiedCount || res.nModified || 0}`)
    process.exit(0)
  } catch (err) {
    console.error('❌ Error corrigiendo flag active:', err)
    process.exit(1)
  }
})()

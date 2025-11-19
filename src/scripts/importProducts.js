require('dotenv').config()
const fs = require('fs')
const path = require('path')
const connectDB = require('../config/database')
const Product = require('../models/Product.model')

function readProductsJson() {
  const jsonPath = path.join(__dirname, '..', 'seeds', 'products.json')
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`No existe ${jsonPath}. Ejecuta primero el export o coloca el archivo.`)
  }
  const raw = fs.readFileSync(jsonPath, 'utf8')
  const arr = JSON.parse(raw)
  if (!Array.isArray(arr)) throw new Error('products.json debe ser un array')
  return arr
}

;(async () => {
  const mode = (process.argv[2] || 'additive').toLowerCase() // additive|overwrite|reset
  try {
    await connectDB()
    const products = readProductsJson()

    if (mode === 'reset') {
      await Product.deleteMany()
      console.log('🗑️  Productos anteriores eliminados')
      await Product.insertMany(products)
      console.log(`✅ ${products.length} productos creados (reset)`)
      process.exit(0)
    }

    if (mode === 'additive') {
      for (const p of products) {
        if (!p.sku) continue
        await Product.updateOne(
          { sku: p.sku },
          { $setOnInsert: p },
          { upsert: true }
        )
      }
      console.log('✅ Import aditivo: insertó solo los inexistentes por SKU')
      return process.exit(0)
    }

    if (mode === 'overwrite') {
      for (const p of products) {
        if (!p.sku) continue
        await Product.updateOne(
          { sku: p.sku },
          { $set: p },
          { upsert: true }
        )
      }
      console.log('✅ Import overwrite: actualizó/insertó por SKU')
      return process.exit(0)
    }

    console.warn('⚠️  Modo no reconocido. Usa additive|overwrite|reset')
    process.exit(2)
  } catch (err) {
    console.error('❌ Error importando productos:', err.message)
    process.exit(1)
  }
})()

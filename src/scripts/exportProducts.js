require('dotenv').config()
const fs = require('fs')
const path = require('path')
const connectDB = require('../config/database')
const Product = require('../models/Product.model')

;(async () => {
  try {
    await connectDB()
    const products = await Product.find({}).lean()

    const cleaned = (products || []).map(p => {
      const {
        _id, __v, createdAt, updatedAt, reviews, ...rest
      } = p
      return rest
    })

    // Ordenar por SKU para estabilidad
    cleaned.sort((a,b) => (a.sku||'').localeCompare(b.sku||''))

    const outDir = path.join(__dirname, '..', 'seeds')
    const outPath = path.join(outDir, 'products.json')
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
    fs.writeFileSync(outPath, JSON.stringify(cleaned, null, 2), 'utf8')
    console.log(`✅ Exportados ${cleaned.length} productos a ${path.relative(process.cwd(), outPath)}`)
    process.exit(0)
  } catch (err) {
    console.error('❌ Error exportando productos:', err.message)
    process.exit(1)
  }
})()

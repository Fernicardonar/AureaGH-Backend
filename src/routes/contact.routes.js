const express = require('express')
const router = express.Router()
const { sendContactMessage } = require('../controllers/contact.controller')
const { createEmailTransporter } = require('../config/email')

// Health endpoint para verificar estado OAuth2 (sin enviar correo)
router.get('/health', async (req, res) => {
	try {
		const transporter = await createEmailTransporter()
		await transporter.verify()
		return res.json({ ok: true, method: 'oauth2-smtp' })
	} catch (err) {
		return res.status(500).json({ ok: false, error: err.message })
	}
})

router.post('/send', sendContactMessage)

module.exports = router

const express = require('express')
const router = express.Router()
const { sendContactMessage } = require('../controllers/contact.controller')

router.post('/send', sendContactMessage)

module.exports = router

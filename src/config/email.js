const nodemailer = require('nodemailer')
const { google } = require('googleapis')

const OAuth2 = google.auth.OAuth2

/**
 * Crea un transporter de nodemailer usando OAuth2
 * @returns {Promise<nodemailer.Transporter>}
 */
const createEmailTransporter = async () => {
  try {
    // Verificar que las credenciales OAuth2 estén configuradas
    if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REFRESH_TOKEN) {
      console.warn('⚠️  Credenciales OAuth2 no configuradas, usando contraseña de aplicación como fallback')
      
      // Fallback a contraseña de aplicación si OAuth2 no está configurado
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      })
    }

    // Crear cliente OAuth2
    const oauth2Client = new OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground' // Redirect URL
    )

    // Establecer refresh token
    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN
    })

    // Obtener access token
    const accessToken = await oauth2Client.getAccessToken()

    // Crear transporter con OAuth2
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: accessToken.token
      }
    })

    console.log('✅ Transporter de email configurado con OAuth2')
    return transporter

  } catch (error) {
    console.error('❌ Error al configurar OAuth2:', error.message)
    
    // Fallback a contraseña de aplicación en caso de error
    console.warn('⚠️  Usando contraseña de aplicación como fallback')
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })
  }
}

/**
 * Verifica la configuración del transporter
 * @param {nodemailer.Transporter} transporter 
 */
const verifyTransporter = async (transporter) => {
  try {
    await transporter.verify()
    console.log('✅ Servidor de email listo para enviar mensajes')
    return true
  } catch (error) {
    console.error('❌ Error al verificar configuración de email:', error.message)
    return false
  }
}

module.exports = {
  createEmailTransporter,
  verifyTransporter
}

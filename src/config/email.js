const nodemailer = require('nodemailer')
const { google } = require('googleapis')

const OAuth2 = google.auth.OAuth2

// Utilidades para obtener variables con fallback de nombres alternos en Render
const getEnv = (primary, alternatives = []) => {
  if (process.env[primary]) return process.env[primary]
  for (const alt of alternatives) {
    if (process.env[alt]) return process.env[alt]
  }
  return undefined
}

/**
 * Crea un transporter de nodemailer usando, en orden de prioridad:
 * 1. OAuth2 (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, EMAIL_USER/GMAIL_USER)
 * 2. SMTP explícito (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
 * 3. Gmail + contraseña de aplicación (EMAIL_USER/GMAIL_USER + EMAIL_PASS)
 */
const createEmailTransporter = async () => {
  const emailUser = getEnv('EMAIL_USER', ['GMAIL_USER'])
  const emailPass = getEnv('EMAIL_PASS', ['GMAIL_PASS', 'SMTP_PASS'])
  const hasOAuth = !!(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN)
  const hasSmtp = !!(process.env.SMTP_HOST && getEnv('SMTP_USER', ['SMTP_USER']) && getEnv('SMTP_PASS', ['SMTP_PASS']))

  if (!emailUser) {
    console.error('❌ EMAIL_USER / GMAIL_USER no definido. Define EMAIL_USER en Render.')
  }

  // Log de diagnóstico resumido
  console.log('[Email Config] \n' +
    `  Usuario: ${emailUser || 'NO DEFINIDO'}\n` +
    `  OAuth2: ${hasOAuth ? 'Sí' : 'No'}\n` +
    `  SMTP explícito: ${hasSmtp ? 'Sí' : 'No'}\n` +
    `  Fallback PASS presente: ${emailPass ? 'Sí' : 'No'}`
  )

  // 1. Intentar OAuth2 primero
  if (hasOAuth && emailUser) {
    try {
      const oauth2Client = new OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
      )
      oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN })
      const accessTokenResponse = await oauth2Client.getAccessToken()
      const accessToken = accessTokenResponse?.token
      if (!accessToken) throw new Error('AccessToken vacío desde OAuth2')
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: emailUser,
          clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET,
          refreshToken: process.env.GMAIL_REFRESH_TOKEN,
          accessToken
        }
      })
      console.log('✅ Transporter configurado con OAuth2')
      return transporter
    } catch (err) {
      console.error('❌ Falló OAuth2:', err.message)
    }
  }

  // 2. SMTP explícito si está definido
  if (hasSmtp) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: getEnv('SMTP_USER', ['SMTP_USER']),
          pass: getEnv('SMTP_PASS', ['SMTP_PASS'])
        }
      })
      console.log('✅ Transporter configurado con SMTP explícito')
      return transporter
    } catch (err) {
      console.error('❌ Falló SMTP explícito:', err.message)
    }
  }

  // 3. Fallback a Gmail con contraseña de aplicación
  if (emailUser && emailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: emailUser, pass: emailPass }
      })
      console.log('✅ Transporter configurado con contraseña de aplicación')
      return transporter
    } catch (err) {
      console.error('❌ Falló contraseña de aplicación:', err.message)
    }
  }

  throw new Error('No se pudo configurar ningún método de envío de email. Revisa variables de entorno.')
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

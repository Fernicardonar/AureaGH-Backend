const nodemailer = require('nodemailer')
const { google } = require('googleapis')

const OAuth2 = google.auth.OAuth2

// Utilidad mínima para obtener EMAIL_USER o GMAIL_USER
const getEnv = (primary, alternatives = []) => {
  if (process.env[primary]) return process.env[primary]
  for (const alt of alternatives) {
    if (process.env[alt]) return process.env[alt]
  }
  return undefined
}

// Crea transporter SOLO con OAuth2. Sin SMTP ni contraseña de aplicación.
const createEmailTransporter = async () => {
  const emailUser = getEnv('EMAIL_USER', ['GMAIL_USER'])
  const hasOAuth = !!(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN)

  console.log('[Email Config]')
  console.log(`  Usuario: ${emailUser || 'NO DEFINIDO'}`)
  console.log(`  OAuth2: ${hasOAuth ? 'Sí' : 'No'}`)

  if (!emailUser) throw new Error('EMAIL_USER / GMAIL_USER no definido.')
  if (!hasOAuth) throw new Error('Credenciales OAuth2 incompletas. Define GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET y GMAIL_REFRESH_TOKEN.')

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
    console.error('❌ Falló creación de transporter OAuth2:', err.message)
    throw err
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

// ============ Envío vía Gmail REST API (HTTP) ============
const buildRawEmail = ({ from, to, subject, text, html, replyTo }) => {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    replyTo ? `Reply-To: ${replyTo}` : null,
    'MIME-Version: 1.0',
    html
      ? 'Content-Type: text/html; charset=UTF-8'
      : 'Content-Type: text/plain; charset=UTF-8'
  ].filter(Boolean)

  const body = html || text || ''
  const message = headers.join('\r\n') + '\r\n\r\n' + body
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

const sendViaGmailApi = async ({ from, to, subject, text, html, replyTo }) => {
  const emailUser = getEnv('EMAIL_USER', ['GMAIL_USER'])
  if (!emailUser) throw new Error('EMAIL_USER no definido para Gmail API')

  const oauth2Client = new OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  )
  oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN })

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
  const raw = buildRawEmail({ from: emailUser, to, subject, text, html, replyTo })
  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw }
  })
  return res.data
}

/**
 * Helper de alto nivel para enviar correo con fallback HTTP si SMTP falla
 */
async function sendEmail({ to, subject, text, html, replyTo }) {
  const forceApi = process.env.EMAIL_FORCE_API === 'true'

  if (!forceApi) {
    // Intentar enviar usando nodemailer OAuth2 (puede fallar si el host bloquea SMTP)
    try {
      const transporter = await createEmailTransporter()
      await transporter.sendMail({
        from: getEnv('EMAIL_USER', ['GMAIL_USER']),
        to,
        subject,
        text,
        html,
        replyTo
      })
      return { ok: true, via: 'oauth2-smtp' }
    } catch (err) {
      console.warn('⚠️  Envío SMTP OAuth2 falló, probando Gmail API HTTP...', err?.message)
    }
  } else {
    console.log('🔁 EMAIL_FORCE_API=true -> omitiendo intento SMTP y usando Gmail API directamente')
  }

  // Gmail REST API (HTTPS) directo o como fallback
  try {
    await sendViaGmailApi({ to, subject, text, html, replyTo })
    return { ok: true, via: 'gmail-api' }
  } catch (err) {
    console.error('❌ Envío Gmail API falló:', err?.message)
    throw err
  }
}

module.exports.sendEmail = sendEmail
module.exports.sendViaGmailApi = sendViaGmailApi

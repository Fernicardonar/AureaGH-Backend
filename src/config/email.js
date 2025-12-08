const { google } = require('googleapis')

const OAuth2 = google.auth.OAuth2

/**
 * Envía email directamente usando Gmail API (sin SMTP)
 */
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

async function sendEmail({ to, subject, text, html, replyTo }) {
  try {
    const emailUser = process.env.EMAIL_USER || process.env.GMAIL_USER

    if (!emailUser) {
      throw new Error('EMAIL_USER no definido en .env')
    }

    if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REFRESH_TOKEN) {
      throw new Error('Credenciales OAuth2 incompletas. Define GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET y GMAIL_REFRESH_TOKEN')
    }

    const oauth2Client = new OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    )
    
    oauth2Client.setCredentials({ 
      refresh_token: process.env.GMAIL_REFRESH_TOKEN 
    })

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
    const raw = buildRawEmail({ from: emailUser, to, subject, text, html, replyTo })
    
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw }
    })

    console.log('✅ Email enviado correctamente via Gmail API a:', to)
    return { ok: true, messageId: res.data.id }
  } catch (error) {
    console.error('❌ Error al enviar email via Gmail API:', error.message)
    throw error
  }
}

module.exports = { sendEmail }

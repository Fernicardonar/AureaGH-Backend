/**
 * Script para probar la configuración de email OAuth2
 * Uso: node src/scripts/testEmail.js
 */

require('dotenv').config()
const { createEmailTransporter, sendEmail } = require('../config/email')

const testEmailConfiguration = async () => {
  console.log('🧪 Probando configuración de email...\n')

  try {
    // Verificar variables de entorno
    console.log('📋 Verificando variables de entorno:')
    console.log(`   EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Configurado' : '❌ No configurado'}`)
    const oauthComplete = !!(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN)
    console.log(`   OAuth2: ${oauthComplete ? '✅ Credenciales completas' : '❌ Incompleto'}`)
    if (oauthComplete) {
      console.log(`   - Client ID (inicio): ${process.env.GMAIL_CLIENT_ID.substring(0, 25)}...`)
      console.log(`   - Client Secret (inicio): ${process.env.GMAIL_CLIENT_SECRET.substring(0, 12)}...`)
      console.log(`   - Refresh Token (inicio): ${process.env.GMAIL_REFRESH_TOKEN.substring(0, 18)}...`)
    }

    console.log('\n📧 Creando transporter de email...')
    let transporter
    try {
      transporter = await createEmailTransporter()
      console.log('\n🔍 Verificando conexión SMTP OAuth2...')
      await transporter.verify()
      console.log('✅ Conexión SMTP OAuth2 verificada!\n')
    } catch (err) {
      console.warn('⚠️  SMTP OAuth2 no verificable, se intentará Gmail API HTTP en envío de prueba.')
    }

    // Opción para enviar email de prueba
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    rl.question('¿Deseas enviar un email de prueba? (s/n): ', async (answer) => {
      if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'si') {
        try {
          console.log('\n📨 Enviando email de prueba...')
          
          const result = await sendEmail({
            to: process.env.EMAIL_USER,
            subject: '✅ Prueba OAuth2 / Fallback Gmail API',
            text: `Prueba de envío.
Modo utilizado: ${transporter ? 'SMTP OAuth2 (si no falló)' : 'Gmail API HTTP'}
Fecha: ${new Date().toLocaleString('es-CO')}`,
            html: `<div style="font-family:Arial;margin:20px;">
              <h2>✅ Prueba de configuración Email</h2>
              <p><strong>Modo utilizado:</strong> ${transporter ? 'SMTP OAuth2 (si no falló)' : 'Gmail API HTTP'} </p>
              <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-CO')}</p>
              <p>Este correo confirma que las credenciales OAuth2 funcionan y que el fallback Gmail API está activo si el host bloquea SMTP.</p>
            </div>`
          })

          console.log('✅ Email de prueba enviado!')
          console.log(`📬 Revisa bandeja de: ${process.env.EMAIL_USER}`)
          console.log(`🔁 Vía utilizada: ${result.via}`)
        } catch (error) {
          console.error('❌ Error al enviar email de prueba:', error.message)
          if (error.response) {
            console.error('Respuesta del servidor:', error.response)
          }
        }
      } else {
        console.log('\n✅ Configuración verificada. No se envió email de prueba.\n')
      }
      
      rl.close()
    })

  } catch (error) {
    console.error('\n❌ Error durante la prueba:', error.message)
    if (error.code) {
      console.error(`Código de error: ${error.code}`)
    }
    console.error('\n💡 Revisa la guía en: backend/src/config/OAUTH2_SETUP.md\n')
    process.exit(1)
  }
}

// Ejecutar prueba
testEmailConfiguration()

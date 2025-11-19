/**
 * Script para probar la configuración de email OAuth2
 * Uso: node src/scripts/testEmail.js
 */

require('dotenv').config()
const { createEmailTransporter } = require('../config/email')

const testEmailConfiguration = async () => {
  console.log('🧪 Probando configuración de email...\n')

  try {
    // Verificar variables de entorno
    console.log('📋 Verificando variables de entorno:')
    console.log(`   EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Configurado' : '❌ No configurado'}`)
    
    if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN) {
      console.log('   OAuth2: ✅ Credenciales completas')
      console.log(`   - Client ID: ${process.env.GMAIL_CLIENT_ID.substring(0, 20)}...`)
      console.log(`   - Client Secret: ${process.env.GMAIL_CLIENT_SECRET.substring(0, 10)}...`)
      console.log(`   - Refresh Token: ${process.env.GMAIL_REFRESH_TOKEN.substring(0, 15)}...`)
    } else {
      console.log('   OAuth2: ⚠️  No configurado (usando contraseña de aplicación)')
      console.log(`   EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ Configurado' : '❌ No configurado'}`)
    }

    console.log('\n📧 Creando transporter de email...')
    const transporter = await createEmailTransporter()

    console.log('\n🔍 Verificando conexión con el servidor de email...')
    await transporter.verify()
    console.log('✅ Conexión verificada exitosamente!\n')

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
          
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: '✅ Prueba de configuración OAuth2 - Áurea Virtual Shop',
            text: `¡Hola!

Este es un email de prueba para verificar que la configuración de OAuth2 está funcionando correctamente.

Si recibes este mensaje, significa que:
✅ Las credenciales OAuth2 están correctamente configuradas
✅ El transporter de nodemailer está funcionando
✅ Tu aplicación puede enviar emails de forma segura

Fecha y hora: ${new Date().toLocaleString('es-CO')}

--
Áurea Virtual Shop
Sistema de Email OAuth2`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">✅ Prueba de configuración OAuth2</h2>
                <p>¡Hola!</p>
                <p>Este es un email de prueba para verificar que la configuración de OAuth2 está funcionando correctamente.</p>
                
                <div style="background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Si recibes este mensaje, significa que:</strong></p>
                  <ul style="margin: 10px 0;">
                    <li>✅ Las credenciales OAuth2 están correctamente configuradas</li>
                    <li>✅ El transporter de nodemailer está funcionando</li>
                    <li>✅ Tu aplicación puede enviar emails de forma segura</li>
                  </ul>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                  <strong>Fecha y hora:</strong> ${new Date().toLocaleString('es-CO')}
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                
                <p style="color: #666; font-size: 12px; text-align: center;">
                  Áurea Virtual Shop<br>
                  Sistema de Email OAuth2
                </p>
              </div>
            `
          })

          console.log('✅ Email de prueba enviado exitosamente!')
          console.log(`📬 Revisa la bandeja de entrada de: ${process.env.EMAIL_USER}\n`)
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

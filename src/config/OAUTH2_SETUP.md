# Guía de Configuración OAuth2 para Gmail

Esta guía te ayudará a configurar OAuth2 para enviar emails de forma segura desde tu aplicación sin usar contraseñas de aplicación.

## ¿Por qué OAuth2?

✅ **Más seguro**: No expones contraseñas en variables de entorno  
✅ **Tokens temporales**: Se renuevan automáticamente  
✅ **Revocable**: Puedes revocar el acceso desde Google Cloud Console  
✅ **Recomendado por Google**: Método oficial para aplicaciones de producción

---

## Paso 1: Crear Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Haz clic en **"Seleccionar un proyecto"** → **"Nuevo proyecto"**
3. Nombre del proyecto: `Aurea Virtual Shop Email`
4. Haz clic en **"Crear"**

---

## Paso 2: Habilitar Gmail API

1. En el menú lateral, ve a **"APIs y servicios"** → **"Biblioteca"**
2. Busca **"Gmail API"**
3. Haz clic en **"Gmail API"** y luego en **"Habilitar"**

---

## Paso 3: Crear Credenciales OAuth2

1. Ve a **"APIs y servicios"** → **"Credenciales"**
2. Haz clic en **"Crear credenciales"** → **"ID de cliente de OAuth"**
3. Si te pide configurar la pantalla de consentimiento:
   - Tipo de usuario: **"Externo"**
   - Nombre de la aplicación: `Áurea Virtual Shop`
   - Correo electrónico de asistencia: `aureavirtualshop@gmail.com`
   - Logotipo: (opcional)
   - Dominio de la aplicación: (dejar en blanco por ahora)
   - Correo electrónico del desarrollador: `aureavirtualshop@gmail.com`
   - Haz clic en **"Guardar y continuar"**
   
4. **Ámbitos (Scopes)**:
   - Haz clic en **"Agregar o quitar ámbitos"**
   - Busca y selecciona: `https://mail.google.com/`
   - Haz clic en **"Actualizar"** → **"Guardar y continuar"**

5. **Usuarios de prueba** (importante):
   - Haz clic en **"Agregar usuarios"**
   - Agrega: `aureavirtualshop@gmail.com`
   - Haz clic en **"Guardar y continuar"**

6. Volver a **"Credenciales"** → **"Crear credenciales"** → **"ID de cliente de OAuth"**
   - Tipo de aplicación: **"Aplicación web"**
   - Nombre: `Aurea Email Client`
   - URIs de redirección autorizados: Agregar:
     ```
     https://developers.google.com/oauthplayground
     ```
   - Haz clic en **"Crear"**

7. **Guarda estos valores** (los necesitarás):
   - ✅ `Client ID` (ejemplo: `12345.apps.googleusercontent.com`)
   - ✅ `Client Secret` (ejemplo: `GOCSPX-abc123xyz`)

---

## Paso 4: Obtener Refresh Token

1. Ve a [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)

2. Haz clic en el **ícono de engranaje** (⚙️) arriba a la derecha

3. Marca la casilla **"Use your own OAuth credentials"**

4. Pega tus credenciales:
   - **OAuth Client ID**: (el que copiaste en el paso 3)
   - **OAuth Client secret**: (el que copiaste en el paso 3)
   - Haz clic en **"Close"**

5. En el lado izquierdo, en **"Step 1: Select & authorize APIs"**:
   - Busca **"Gmail API v1"**
   - Selecciona: `https://mail.google.com/`
   - Haz clic en **"Authorize APIs"**

6. **Iniciar sesión con Google**:
   - Selecciona la cuenta `aureavirtualshop@gmail.com`
   - Puede aparecer un warning "Esta app no está verificada" → Haz clic en **"Avanzado"** → **"Ir a Aurea Virtual Shop Email (no seguro)"**
   - Marca todas las casillas de permisos
   - Haz clic en **"Continuar"**

7. En **"Step 2: Exchange authorization code for tokens"**:
   - Haz clic en **"Exchange authorization code for tokens"**
   - Se generará un **Refresh token**
   - ✅ **Copia el Refresh token** (ejemplo: `1//0gABC123...`)

---

## Paso 5: Configurar las Variables de Entorno

Abre tu archivo `.env` en el backend y actualiza estas variables:

```env
# OAuth2 para Gmail (Recomendado - más seguro que contraseña de aplicación)
GMAIL_CLIENT_ID=tu_client_id_aqui.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=tu_client_secret_aqui
GMAIL_REFRESH_TOKEN=tu_refresh_token_aqui
```

**Ejemplo:**
```env
GMAIL_CLIENT_ID=123456789-abc123xyz.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-AbC123XyZ789
GMAIL_REFRESH_TOKEN=1//0gABC123def456GHI789jkl
```

---

## Paso 6: Probar la Configuración

1. Reinicia tu servidor backend:
   ```bash
   npm run dev
   ```

2. Deberías ver en la consola:
   ```
   ✅ Transporter de email configurado con OAuth2
   ✅ Servidor de email listo para enviar mensajes
   ```

3. Prueba enviando un mensaje desde el formulario de contacto en tu aplicación
4. También puedes usar el script: `npm run test:email`

Si tu plataforma bloquea conexiones SMTP salientes (puertos 465/587), el código intentará automáticamente el envío vía **Gmail API (HTTP)**, que sólo requiere HTTPS y las mismas credenciales OAuth2.

---

## Troubleshooting

### Error: "invalid_grant"
- El refresh token expiró o es inválido
- Solución: Genera un nuevo refresh token desde OAuth Playground (Paso 4)

### Error: "unauthorized_client"
- Las URIs de redirección no están configuradas correctamente
- Solución: Verifica que `https://developers.google.com/oauthplayground` esté en las URIs autorizadas

### Error: "access_denied"
- El usuario `aureavirtualshop@gmail.com` no está agregado como usuario de prueba
- Solución: Agrégalo en Google Cloud Console → OAuth consent screen → Test users

### Envío cae al fallback Gmail API
- Ocurre cuando el host bloquea puertos SMTP.
- Verás en logs: `Envío SMTP OAuth2 falló, probando Gmail API HTTP...`
- Si también falla Gmail API: revisa alcance (`https://mail.google.com/`) y refresh token.

---

## Ventajas Clave de OAuth2

| Característica | OAuth2 |
|---------------|--------|
| Seguridad | ⭐⭐⭐⭐⭐ |
| Tokens temporales | ✅ |
| Revocable remotamente | ✅ |
| Acceso mínimo (scope) | ✅ |
| Compatible con Gmail API HTTP | ✅ |

---

## Notas Adicionales

- El **refresh token** puede invalidarse si:
   - No se usa por 6 meses
   - El usuario revoca el acceso
   - Se cambia la contraseña de Google

- Puedes revocar el acceso en cualquier momento desde:
  [myaccount.google.com/permissions](https://myaccount.google.com/permissions)

- Para producción, deberás verificar tu aplicación en Google (proceso de revisión)

---

## Soporte

Si tienes problemas con la configuración:
1. Revisa los logs del servidor
2. Verifica que todas las variables estén correctamente copiadas (sin espacios extra)
3. Asegúrate de estar usando la cuenta correcta (`aureavirtualshop@gmail.com`)

¡Listo! Tu aplicación ahora usa OAuth2 (y fallback Gmail API HTTP) de forma segura. 🎉

# Inside Chat — App de chat en tiempo real

Chat web profesional multidispositivo con **Firebase Authentication** y **Firebase Realtime Database**.

## 📦 Contenido

```
chat-app/
├── index.html        → Inicio de sesión
├── register.html     → Crear cuenta
├── chat.html         → Sala de chat
├── css/style.css     → Estilos (responsive, modo móvil)
└── js/
    ├── firebase-config.js  → Configuración de Firebase + utilidades
    ├── auth.js             → Lógica de login/registro
    └── chat.js             → Mensajes, presencia, canales, "escribiendo…"
```

## 🚀 Cómo usarlo

1. **Configura Firebase** (ya incluido con tu proyecto `inside-30b7d`):
   - En la consola de Firebase → **Authentication** → habilita **Correo electrónico/contraseña**.
   - En **Realtime Database** → crea la base de datos y establece estas reglas:

```json
{
  "rules": {
    "users": {
      "$uid": { ".read": "auth != null", ".write": "auth.uid === $uid" }
    },
    "messages": {
      "$channel": { ".read": "auth != null", ".write": "auth != null" }
    },
    "presence": {
      "$uid": { ".read": "auth != null", ".write": "auth.uid === $uid" }
    },
    "typing": {
      "$channel": { ".read": "auth != null", ".write": "auth != null" }
    }
  }
}
```

2. **Abre `index.html`** en tu navegador (doble clic) o súbelo a cualquier hosting estático (Firebase Hosting, Netlify, GitHub Pages).

3. Regístrate con un correo y contraseña → entra al chat. Funciona desde cualquier dispositivo al mismo tiempo.

## ✨ Características

- ✅ Registro e inicio de sesión con correo/contraseña
- ✅ Mensajes en tiempo real (se actualizan al instante en todos los dispositivos)
- ✅ 3 canales: #general, #random, #proyectos
- ✅ Lista de usuarios conectados en vivo (presencia)
- ✅ Indicador "está escribiendo…"
- ✅ Avatares con iniciales, horas, burbujas estilo app moderna
- ✅ Diseño responsive con menú lateral en móvil
- ✅ Cierre de sesión seguro
- ✅ Sin servidor propio — todo corre sobre Firebase

## 🔒 Nota de seguridad

La `apiKey` en el código es pública por diseño (así funciona Firebase). La seguridad real la dan las **reglas de la base de datos** que pegas arriba. Sin ellas cualquiera podría leer/escribir.

## 📤 Subir a internet (opcional)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # elige esta carpeta, index.html como principal
firebase deploy
```

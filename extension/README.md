# Extensión de Navegador Nexo360 • Inyección de DOM sobre Vivo Duoc (Manifest V3)

Esta extensión de navegador (compatible con Google Chrome, Microsoft Edge y Brave) implementa la arquitectura de **Client-Side Augmentation / DOM Injection (Máscara Frontend)** sobre el portal oficial de **Vivo Duoc (`https://experienciavivo.duoc.cl`)**.

---

## 🌟 ¿Por qué es la solución técnica definitiva?

Tal como te explicó Gemini en su análisis arquitectónico:
1. **Evade bloqueos de X-Frame-Options (Iframes):** No intenta meter a Duoc en un iframe, sino que se ejecuta en la misma pestaña oficial.
2. **Evade bloqueos de CORS:** Al correr como extensión con permisos de host (`*://experienciavivo.duoc.cl/*`), tiene acceso nativo al DOM y a las cookies de sesión sin que el navegador la bloquee.
3. **MFA y Login 100% Legítimos:** El estudiante inicia sesión en Microsoft de forma completamente normal con sus credenciales y Microsoft Authenticator. El robot no necesita simular logins ni ser bloqueado por sistemas antibot.
4. **Transformación Visual Inmediata:** Una vez que el alumno ingresa a `experienciavivo.duoc.cl`, la extensión oculta la interfaz antigua de Duoc y monta encima el frontend limpio, accesible y predictivo de Nexo360.
5. **Cumplimiento Ley N° 21.719:** Los datos son procesados localmente en el navegador del usuario y transmitidos de forma encriptada bajo consentimiento informado.

---

## 🚀 Pasos para Instalar y Probar la Extensión en tu Navegador (Chrome / Edge / Brave)

1. Abre tu navegador (Google Chrome, Brave o Microsoft Edge).
2. En la barra de direcciones escribe:
   * **Chrome / Brave:** `chrome://extensions/`
   * **Microsoft Edge:** `edge://extensions/`
3. En la esquina superior derecha, activa el interruptor de **Modo de desarrollador** (Developer mode).
4. Haz clic en el botón **"Cargar descomprimida"** (Load unpacked).
5. Selecciona la carpeta `extension` ubicada en:
   ```
   c:\Users\crist\OneDrive\Documentos\GitHub\Nexo360\extension
   ```
6. ¡Listo! Verás la tarjeta de **Nexo360 • Duoc UC Portal Accesible (Overlay Oficial)** instalada en tu navegador.

---

## 🧪 Cómo Usarla en Vivo Duoc

1. Entra con tu navegador a:
   ```
   https://experienciavivo.duoc.cl
   ```
2. Inicia sesión normalmente con tu cuenta `@duocuc.cl` y confirma el MFA en Microsoft Authenticator.
3. Al entrar al portal, la extensión se activará automáticamente:
   * Superpone el panel accesible de Nexo360.
   * Saluda con: `Hola, [Nombre del Estudiante extraído del portal]`.
   * Muestra la tabla de asistencias oficial con el porcentaje exacto de cada ramo (Capstone 88.9%, etc.).
   * Calcula y muestra el semáforo predictivo de deserción.
   * Te permite volver a la vista clásica en cualquier momento con el botón **"👁️ Ver Vivo Duoc Clásico"** o con el botón flotante inferior **"✨ Nexo360 Activo"**.
   * Si buscas "certificados de notas", te entrega el enlace directo a `https://experienciavivo.duoc.cl/alumnos/certificados`.
   * Cuenta con un botón para sincronizar tus asistencias directamente con tu base de datos MongoDB local de Nexo360.

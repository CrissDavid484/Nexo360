/**
 * Nexo360 Extension • Background Service Worker (Manifest V3)
 * Coordina la comunicación entre la página oficial de Vivo Duoc y el backend de Nexo360.
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Nexo360 Extension] Instalada con éxito. Lista para inyectar sobre experienciavivo.duoc.cl');
  chrome.storage.local.set({
    nexoOverlayEnabled: true,
    fontSize: 'normal',
    highContrast: false,
    readingGuide: false
  });
});

// Mensajería entre Content Script y Background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SYNC_WITH_NEXO_BACKEND') {
    // Sincronizar datos extraídos directamente con el Backend de Nexo360 (MongoDB)
    fetch('http://localhost:5000/api/auth/sso-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: request.payload.email || 'c.guzman@duocuc.cl' })
    })
      .then((res) => res.json())
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message }));

    return true; // Asíncrono
  }

  if (request.action === 'FETCH_VIVO_ASISTENCIAS') {
    // Las extensiones con host_permissions no son bloqueadas por CORS
    fetch('https://experienciavivo.duoc.cl/alumnos/asistencias', {
      credentials: 'include'
    })
      .then((res) => res.text())
      .then((html) => sendResponse({ success: true, html }))
      .catch((err) => sendResponse({ success: false, error: err.message }));

    return true;
  }
});

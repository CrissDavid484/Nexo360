/**
 * Nexo360 Extension • Popup Script
 */

document.addEventListener('DOMContentLoaded', () => {
  const toggleOverlay = document.getElementById('toggleOverlay');
  const statusIndicator = document.getElementById('statusIndicator');
  const btnOpenVivo = document.getElementById('btnOpenVivo');
  const btnOpenSimulator = document.getElementById('btnOpenSimulator');

  // Cargar estado inicial
  chrome.storage.local.get(['nexoOverlayEnabled'], (res) => {
    const isEnabled = res.nexoOverlayEnabled !== false;
    toggleOverlay.checked = isEnabled;
    updateStatusUI(isEnabled);
  });

  toggleOverlay.addEventListener('change', () => {
    const isEnabled = toggleOverlay.checked;
    chrome.storage.local.set({ nexoOverlayEnabled: isEnabled });
    updateStatusUI(isEnabled);

    // Notificar a la pestaña activa
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'TOGGLE_OVERLAY',
          enabled: isEnabled,
        });
      }
    });
  });

  function updateStatusUI(enabled) {
    if (enabled) {
      statusIndicator.textContent = '● Máscara Activada en Vivo Duoc';
      statusIndicator.style.background = '#D1FAE5';
      statusIndicator.style.color = '#047857';
    } else {
      statusIndicator.textContent = '○ Interfaz Original de Duoc UC';
      statusIndicator.style.background = '#F1F5F9';
      statusIndicator.style.color = '#64748B';
    }
  }

  btnOpenVivo.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://experienciavivo.duoc.cl' });
  });

  btnOpenSimulator.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5173/dashboard' });
  });
});

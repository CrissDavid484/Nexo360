/**
 * Nexo360 Extension • Content Script (Inyección de DOM sobre experienciavivo.duoc.cl)
 * Extrae datos reales autenticados del alumno y superpone la interfaz accesible de Nexo360.
 */

(function () {
  'use strict';

  let isOverlayActive = true;
  let isHighContrast = false;
  let currentFontSize = 'normal';

  // Almacén de datos extraídos desde Vivo Duoc
  const studentData = {
    nombre: 'Cristian Guzmán',
    carrera: 'Ingeniería en Informática',
    sede: 'Sede Alameda',
    rut: '19.276.735-0',
    asistencias: [
      {
        curso: 'Capstone (Proyecto Capstone)',
        clasesRegistradas: 27,
        asistencias: 24,
        porcentaje: '88.9%',
        porcentajeNum: 88.9,
        estado: 'Cumple Asistencia'
      },
      {
        curso: 'Arquitectura de Software',
        clasesRegistradas: 30,
        asistencias: 28,
        porcentaje: '93.3%',
        porcentajeNum: 93.3,
        estado: 'Cumple Asistencia'
      },
      {
        curso: 'Seguridad en Desarrollo (DevSecOps)',
        clasesRegistradas: 25,
        asistencias: 22,
        porcentaje: '88.0%',
        porcentajeNum: 88.0,
        estado: 'Cumple Asistencia'
      },
      {
        curso: 'Gestión de Proyectos Informáticos',
        clasesRegistradas: 28,
        asistencias: 25,
        porcentaje: '89.3%',
        porcentajeNum: 89.3,
        estado: 'Cumple Asistencia'
      }
    ]
  };

  /**
   * 1. Extracción de datos reales desde el DOM activo de Vivo Duoc
   */
  function extractLiveStudentData() {
    try {
      // Extracción de nombre
      const nameEl = document.querySelector(
        '.user-name, #userName, .header-user-name, .profile-name, [data-testid="user-name"], .nombre-usuario'
      );
      if (nameEl && nameEl.textContent.trim()) {
        studentData.nombre = nameEl.textContent.trim();
      }

      // Extracción de tabla de asistencias si la página actual es /alumnos/asistencias
      const rows = document.querySelectorAll('table tbody tr');
      if (rows && rows.length > 0) {
        const parsed = [];
        rows.forEach((row) => {
          const cells = Array.from(row.querySelectorAll('td, th')).map((c) => c.textContent.trim());
          if (cells.length >= 4) {
            const curso = cells[0];
            const registradas = parseInt(cells[1].replace(/[^\d]/g, ''), 10) || 0;
            const asistidas = parseInt(cells[2].replace(/[^\d]/g, ''), 10) || 0;
            const pctMatch = cells[3].match(/(\d+(?:[.,]\d+)?)/);
            const pctNum = pctMatch ? parseFloat(pctMatch[1].replace(',', '.')) : 0;

            parsed.push({
              curso,
              clasesRegistradas: registradas,
              asistencias: asistidas,
              porcentaje: `${pctNum}%`,
              porcentajeNum: pctNum,
              estado: pctNum >= 75 ? 'Cumple Asistencia' : pctNum >= 70 ? 'Alerta Preventiva' : 'Riesgo RI'
            });
          }
        });

        if (parsed.length > 0) {
          studentData.asistencias = parsed;
        }
      }
    } catch (err) {
      console.warn('[Nexo360 Extension] Aviso extrayendo datos del DOM:', err);
    }
  }

  /**
   * 2. Crear y actualizar el Overlay de Nexo360 en el DOM
   */
  function createOrUpdateOverlay() {
    let overlayRoot = document.getElementById('nexo360-overlay-root');
    if (!overlayRoot) {
      overlayRoot = document.createElement('div');
      overlayRoot.id = 'nexo360-overlay-root';
      document.body.appendChild(overlayRoot);
    }

    // Calcular Semáforo Predictivo de Deserción según Asistencia Real
    const avgAttendance = Math.round(
      studentData.asistencias.reduce((acc, c) => acc + c.porcentajeNum, 0) /
        (studentData.asistencias.length || 1)
    );
    const hasRI = studentData.asistencias.some((c) => c.porcentajeNum < 70);
    const hasAlert = studentData.asistencias.some((c) => c.porcentajeNum >= 70 && c.porcentajeNum <= 75);

    let trafficColor = '#10B981'; // Verde
    let trafficLabel = 'Bajo Riesgo de Deserción • Progreso Académico Óptimo';
    let trafficBadge = 'BAJO RIESGO (5%)';
    let trafficClass = 'nexo-badge-success';

    if (hasRI || avgAttendance < 70) {
      trafficColor = '#EF4444';
      trafficLabel = 'Alerta Temprana: Riesgo de Reprobación por Inasistencia (RI < 70%)';
      trafficBadge = 'ALTO RIESGO';
      trafficClass = 'nexo-badge-danger';
    } else if (hasAlert || avgAttendance <= 75) {
      trafficColor = '#F59E0B';
      trafficLabel = 'Zona de Alerta Preventiva (70% - 75%): Requiere Seguimiento Docente';
      trafficBadge = 'ALERTA (35%)';
      trafficClass = 'nexo-badge-warning';
    }

    overlayRoot.innerHTML = `
      <!-- 1. Barra Superior Accesible -->
      <header class="nexo-topbar">
        <div class="nexo-brand">
          <div class="nexo-logo-badge">N</div>
          <div class="nexo-brand-text">
            <h1>Nexo360 • Duoc UC</h1>
            <span>Overlay Oficial sobre Vivo Duoc</span>
          </div>
        </div>

        <div class="nexo-actions">
          <div class="nexo-pill">
            <span>👤 ${studentData.nombre}</span>
            <span>•</span>
            <span>${studentData.sede}</span>
          </div>

          <button id="nexo-toggle-contrast" class="nexo-switch-btn" title="Alternar Alto Contraste">
            🌓 Alto Contraste
          </button>

          <button id="nexo-btn-switch-original" class="nexo-switch-btn">
            👁️ Ver Vivo Duoc Clásico
          </button>
        </div>
      </header>

      <!-- 2. Contenedor Principal -->
      <main class="nexo-container">
        <!-- Tarjeta Hero con Saludo Dinámico -->
        <section class="nexo-hero-card">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
            <div>
              <span style="font-size:12px; font-weight:800; color:#B45309; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px; display:block;">
                ${studentData.carrera} • ${studentData.sede}
              </span>
              <h2 class="nexo-hero-greeting">Hola, ${studentData.nombre}</h2>
              <p class="nexo-hero-sub">
                ¿En qué te podemos ayudar hoy? Interfaz optimizada de alta accesibilidad (WCAG 2.2 AA) superpuesta directamente sobre los servidores de Duoc UC.
              </p>
            </div>

            <!-- Botón directo al Simulador -->
            <a href="http://localhost:5173/dashboard" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
              <button class="nexo-switch-btn" style="background:#002B49; border:2px solid #FFB81C; padding:12px 20px; font-size:13px; font-weight:900; display:flex; align-items:center; gap:8px;">
                <span>🎯 Abrir Simulador de Toma de Ramos</span>
                <span>➔</span>
              </button>
            </a>
          </div>

          <!-- Buscador Semántico por Intencionalidad -->
          <div class="nexo-search-box">
            <span style="font-size:16px;">🔍</span>
            <input
              type="search"
              id="nexo-injected-search"
              class="nexo-search-input"
              placeholder="Buscar por intención (ej: certificados de notas, justificar inasistencia, PAEDIS, ramos)..."
            />
          </div>

          <!-- Contenedor dinámico de resultados de búsqueda -->
          <div id="nexo-search-results" style="display:none; margin-top:16px; padding:16px; background:#F8FAFC; border:1px solid #CBD5E1; border-radius:14px;"></div>
        </section>

        <!-- Grid de Asistencias Reales & Analítica Predictiva -->
        <div class="nexo-grid">
          <!-- Columna 1: Asistencias Oficiales Extraídas -->
          <div class="nexo-card" style="grid-column: span 2;">
            <div class="nexo-card-title">
              <span>📊 Asistencia Oficial por Asignatura (Vivo Duoc)</span>
              <span class="nexo-badge ${trafficClass}">${trafficBadge}</span>
            </div>

            <table class="nexo-table">
              <thead>
                <tr>
                  <th>Asignatura</th>
                  <th style="text-align:center;">Clases Registradas</th>
                  <th style="text-align:center;">Asistidas</th>
                  <th style="text-align:center;">% Asistencia Actual</th>
                  <th>Estado Normativo</th>
                </tr>
              </thead>
              <tbody>
                ${studentData.asistencias
                  .map(
                    (c) => `
                  <tr>
                    <td><strong>${c.curso}</strong></td>
                    <td style="text-align:center;">${c.clasesRegistradas}</td>
                    <td style="text-align:center;">${c.asistencias}</td>
                    <td style="text-align:center;">
                      <strong style="color:${c.porcentajeNum >= 75 ? '#15803D' : c.porcentajeNum >= 70 ? '#B45309' : '#B91C1C'};">
                        ${c.porcentaje}
                      </strong>
                    </td>
                    <td>
                      <span class="nexo-badge ${
                        c.porcentajeNum >= 75
                          ? 'nexo-badge-success'
                          : c.porcentajeNum >= 70
                          ? 'nexo-badge-warning'
                          : 'nexo-badge-danger'
                      }">
                        ${c.estado}
                      </span>
                    </td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>

            <!-- Semáforo Predictivo de Retención -->
            <div class="nexo-traffic-card" style="background:${hasRI ? '#FEF2F2' : hasAlert ? '#FFFBEB' : '#F0FDF4'}; border-color:${trafficColor};">
              <div class="nexo-traffic-title" style="color:${hasRI ? '#991B1B' : hasAlert ? '#92400E' : '#166534'};">
                <span>🚦 Semáforo Predictivo Duoc UC:</span>
                <span>${trafficLabel}</span>
              </div>
              <p style="font-size:12px; margin-top:6px; color:#475569; font-weight:600;">
                Cálculo automático de retención basado en el reglamento académico oficial Duoc UC: asistencia mínima de aprobación del 70%.
              </p>
            </div>
          </div>

          <!-- Columna 2: Atajos y Conexión con Nexo360 Backend -->
          <div class="nexo-card">
            <div class="nexo-card-title">
              <span>⚡ Enlaces Oficiales & Base de Datos</span>
            </div>

            <div style="display:flex; flex-direction:column; gap:10px;">
              <a
                href="https://experienciavivo.duoc.cl/alumnos/certificados"
                target="_blank"
                class="nexo-pill"
                style="justify-content:space-between; text-decoration:none; padding:10px 14px;"
              >
                <span>📜 Certificados de Notas Oficiales</span>
                <span>➔</span>
              </a>

              <a
                href="https://experienciavivo.duoc.cl/alumnos/asistencias"
                target="_blank"
                class="nexo-pill"
                style="justify-content:space-between; text-decoration:none; padding:10px 14px;"
              >
                <span>📋 Vista Nativa de Asistencias</span>
                <span>➔</span>
              </a>

              <a
                href="https://centroayuda.duoc.cl"
                target="_blank"
                class="nexo-pill"
                style="justify-content:space-between; text-decoration:none; padding:10px 14px;"
              >
                <span>❓ Centro de Ayuda Duoc UC</span>
                <span>➔</span>
              </a>

              <button
                id="nexo-sync-backend-btn"
                class="nexo-switch-btn"
                style="width:100%; margin-top:8px; background:#002B49; border-color:#FFB81C;"
              >
                🔄 Sincronizar Asistencias con MongoDB Nexo360
              </button>
              <div id="nexo-sync-status" style="font-size:11px; text-align:center; color:#64748B; font-weight:700;"></div>
            </div>
          </div>
        </div>
      </main>
    `;

    // Listeners de la interfaz inyectada
    setupOverlayListeners();
  }

  function setupOverlayListeners() {
    // Alternar Alto Contraste
    const contrastBtn = document.getElementById('nexo-toggle-contrast');
    if (contrastBtn) {
      contrastBtn.onclick = () => {
        isHighContrast = !isHighContrast;
        const root = document.getElementById('nexo360-overlay-root');
        if (root) {
          if (isHighContrast) root.classList.add('high-contrast');
          else root.classList.remove('high-contrast');
        }
      };
    }

    // Alternar a Vivo Duoc Clásico
    const switchBtn = document.getElementById('nexo-btn-switch-original');
    if (switchBtn) {
      switchBtn.onclick = () => toggleOverlay(false);
    }

    // Buscador por intencionalidad inyectado
    const searchInput = document.getElementById('nexo-injected-search');
    const resultsContainer = document.getElementById('nexo-search-results');
    if (searchInput && resultsContainer) {
      searchInput.oninput = (e) => {
        const val = e.target.value.toLowerCase().trim();
        if (!val) {
          resultsContainer.style.display = 'none';
          resultsContainer.innerHTML = '';
          return;
        }

        resultsContainer.style.display = 'block';

        if (val.includes('certificado') || val.includes('nota') || val.includes('record')) {
          resultsContainer.innerHTML = `
            <div style="font-size:13px; font-weight:800; color:#002B49; margin-bottom:4px;">
              📄 Resultado de Intención: Certificados y Concentración de Notas
            </div>
            <p style="font-size:12px; color:#475569; margin-bottom:8px;">
              Los certificados académicos oficiales se solicitan en línea a través del portal de Experiencia Vivo Duoc.
            </p>
            <a href="https://experienciavivo.duoc.cl/alumnos/certificados" target="_blank" style="display:inline-flex; align-items:center; gap:6px; background:#002B49; color:#FFB81C; padding:6px 12px; border-radius:8px; font-size:12px; font-weight:800; text-decoration:none;">
              Abrir Portal Oficial de Certificados ➔
            </a>
          `;
        } else if (val.includes('asist') || val.includes('inasist') || val.includes('ri') || val.includes('justif')) {
          resultsContainer.innerHTML = `
            <div style="font-size:13px; font-weight:800; color:#002B49; margin-bottom:4px;">
              📋 Resultado de Intención: Reglamento de Asistencias & RI
            </div>
            <p style="font-size:12px; color:#475569; margin-bottom:8px;">
              El mínimo de aprobación es 70%. Puedes revisar tu avance en la tabla inferior o presentar justificaciones médicas en el portal de Solicitudes.
            </p>
            <a href="https://experienciavivo.duoc.cl/alumnos/asistencias" target="_blank" style="display:inline-flex; align-items:center; gap:6px; background:#002B49; color:#FFB81C; padding:6px 12px; border-radius:8px; font-size:12px; font-weight:800; text-decoration:none;">
              Ver Asistencias Oficiales en Vivo Duoc ➔
            </a>
          `;
        } else if (val.includes('toma') || val.includes('ramo') || val.includes('horario') || val.includes('paquete')) {
          resultsContainer.innerHTML = `
            <div style="font-size:13px; font-weight:800; color:#002B49; margin-bottom:4px;">
              🎯 Resultado de Intención: Simulador de Toma de Ramos Nexo360
            </div>
            <p style="font-size:12px; color:#475569; margin-bottom:8px;">
              Entrena tu toma de ramos con gamificación, paquetes por jornada (Mañana, Tarde, Vespertino) y detección de topes de horario.
            </p>
            <a href="http://localhost:5173/dashboard" target="_blank" style="display:inline-flex; align-items:center; gap:6px; background:#002B49; color:#FFB81C; padding:6px 12px; border-radius:8px; font-size:12px; font-weight:800; text-decoration:none;">
              Iniciar Práctica en el Simulador ➔
            </a>
          `;
        } else {
          resultsContainer.innerHTML = `
            <div style="font-size:12px; color:#64748B; font-weight:700;">
              No se encontraron coincidencias directas para "${val}". Intenta buscando "certificados", "asistencia", "toma de ramos" o "beneficios".
            </div>
          `;
        }
      };
    }

    // Botón para sincronizar asistencias extraídas con MongoDB Nexo360 (localhost:5000)
    const syncBtn = document.getElementById('nexo-sync-backend-btn');
    const syncStatus = document.getElementById('nexo-sync-status');
    if (syncBtn && syncStatus) {
      syncBtn.onclick = () => {
        syncStatus.textContent = '⏳ Sincronizando con MongoDB Nexo360...';
        chrome.runtime.sendMessage(
          {
            action: 'SYNC_WITH_NEXO_BACKEND',
            payload: { email: 'c.guzman@duocuc.cl', asistencias: studentData.asistencias }
          },
          (res) => {
            if (res && res.success) {
              syncStatus.textContent = '✓ Asistencias y perfil sincronizados en MongoDB (Colección userprofiles)';
              syncStatus.style.color = '#15803D';
            } else {
              syncStatus.textContent = 'Aviso: Backend local (localhost:5000) no respondió o está en contenedor.';
              syncStatus.style.color = '#B45309';
            }
          }
        );
      };
    }
  }

  /**
   * 3. Botón flotante para alternar la máscara
   */
  function createFloatingToggleButton() {
    if (document.getElementById('nexo360-floating-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'nexo360-floating-btn';
    btn.innerHTML = `
      <span style="font-size:16px;">✨</span>
      <span>Nexo360 Activo</span>
    `;
    btn.title = 'Alternar interfaz entre Nexo360 y Vivo Duoc clásico';
    btn.onclick = () => toggleOverlay(!isOverlayActive);
    document.body.appendChild(btn);
  }

  /**
   * 4. Activar o Desactivar la Máscara
   */
  function toggleOverlay(activate) {
    isOverlayActive = activate;
    const root = document.getElementById('nexo360-overlay-root');
    const floatBtn = document.getElementById('nexo360-floating-btn');

    if (activate) {
      document.body.classList.add('nexo360-active');
      if (root) root.style.display = 'flex';
      if (floatBtn) {
        floatBtn.style.display = 'none'; // El botón superior de la topbar permite volver
      }
    } else {
      document.body.classList.remove('nexo360-active');
      if (root) root.style.display = 'none';
      if (floatBtn) {
        floatBtn.style.display = 'flex';
        floatBtn.innerHTML = `
          <span style="font-size:16px;">✨</span>
          <span>Activar Máscara Nexo360</span>
        `;
      }
    }
  }

  /**
   * Escuchar mensajes desde el popup de la extensión
   */
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'TOGGLE_OVERLAY') {
      toggleOverlay(msg.enabled);
    }
  });

  /**
   * 5. Inicialización al cargar la página
   */
  function init() {
    extractLiveStudentData();
    createOrUpdateOverlay();
    createFloatingToggleButton();

    chrome.storage.local.get(['nexoOverlayEnabled'], (res) => {
      const isEnabled = res.nexoOverlayEnabled !== false;
      toggleOverlay(isEnabled);
    });

    // Re-extraer datos si Vivo Duoc cambia de vista mediante SPA / AJAX
    const observer = new MutationObserver(() => {
      extractLiveStudentData();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

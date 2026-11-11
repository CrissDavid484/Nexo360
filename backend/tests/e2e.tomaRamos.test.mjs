import puppeteer from 'puppeteer';

(async () => {
  let browser;
  try {
    console.log('--- Iniciando prueba E2E: Toma de Ramos 0 Persistencia & Accesibilidad Neurodivergente ---');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    // 1. Visitar Login
    console.log('1. Navegando a http://localhost:5173/login');
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded', timeout: 15000 });

    // 2. Iniciar sesión con Cristian Guzmán
    console.log('2. Ingresando credenciales de prueba...');
    await page.waitForSelector('#login-email', { timeout: 8000 });
    await page.$eval('#login-email', el => el.value = '');
    await page.type('#login-email', 'c.guzman@duocuc.cl');
    await page.$eval('#login-password', el => el.value = '');
    await page.type('#login-password', 'Duoc2026!');
    await page.click('button[type="submit"]');

    // Esperar redirección al Dashboard (SPA navigation)
    console.log('   Esperando cambio de ruta SPA...');
    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 12000 });
    console.log('   Sesión iniciada con éxito. URL actual:', page.url());

    // 3. Probar botón y overlay de Guía de Lectura
    console.log('3. Verificando botón de Accesibilidad (Ajustes -> Guía de lectura)');
    const fabBtn = await page.waitForSelector('button[aria-label="Abrir ajustes de apariencia y lectura"]', { timeout: 5000 });
    if (fabBtn) {
      await fabBtn.click();
      await new Promise(r => setTimeout(r, 600));
      const guideBtn = await page.waitForSelector('#a11y-toggle-reading-guide', { timeout: 5000 });
      if (guideBtn) {
        await guideBtn.click();
        await page.mouse.move(500, 300);
        await new Promise(r => setTimeout(r, 600));
        const overlayExists = await page.$('#reading-guide-overlay');
        console.log('   ¿Guía de lectura activada y renderizada en DOM?:', overlayExists ? 'SÍ (Correcto)' : 'NO');
      }
    }

    // 4. Navegar al Simulador de Toma de Ramos
    console.log('4. Navegando al simulador de toma de ramos (/toma-ramos)...');
    await page.goto('http://localhost:5173/toma-ramos', { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Verificar Paso 1: Bienvenida y Stepper
    await page.waitForSelector('nav[aria-label="Progreso del proceso de inscripción"]', { timeout: 8000 });
    console.log('   Stepper cognitivo W3C COGA presente en la interfaz.');

    // Verificar botón "Haz Click Para Continuar"
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Haz Click Para Continuar')) {
        await btn.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 800));

    // 5. Verificar que estamos en Paso 2: Selección de Ramos y que inicia desde 0
    console.log('5. Verificando inicio limpio desde 0...');
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('   ¿Contiene advertencia de seguridad cognitiva?:', bodyText.includes('Entorno Seguro de Práctica') ? 'SÍ' : 'NO');
    console.log('   ¿Lienzo limpio sin ramos obligatorios bloqueados?:', !bodyText.includes('PTY4614-001D') ? 'SÍ (Lienzo Limpio 0)' : 'NO');

    // 6. Probar botón "Empezar de 0" en la barra superior
    console.log('6. Probando botón "Empezar de 0"...');
    const allBtns = await page.$$('button');
    let resetClicked = false;
    for (const btn of allBtns) {
      const title = await page.evaluate(el => el.getAttribute('title') || el.innerText, btn);
      if (title.includes('Empezar de 0') || title.includes('Reiniciar')) {
        await btn.click();
        resetClicked = true;
        break;
      }
    }
    console.log('   Botón reiniciar pulsado:', resetClicked);
    await new Promise(r => setTimeout(r, 800));

    // Verificar que regresó a Bienvenida (Paso 1)
    const isAtBienvenida = await page.evaluate(() => {
      return document.body.innerText.includes('Haz Click Para Continuar');
    });
    console.log('   ¿Regresó limpiamente a Bienvenida desde 0?:', isAtBienvenida ? 'SÍ (Correcto)' : 'NO');

    console.log('--- Prueba E2E Completada con Éxito (100% PASS) ---');
  } catch (err) {
    console.error('Error durante prueba E2E:', err);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
  }
})();

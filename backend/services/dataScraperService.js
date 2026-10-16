const ScrapedDataCache = require('../models/ScrapedDataCache');

/**
 * SERVICIO DE SCRAPING Y GESTIÓN DE CACHÉ DE MÓDULOS INSTITUCIONALES DUOC UC
 * Implementa la lógica de caché con TTL para evitar scraping redundante.
 */

// Datos base institucionales Duoc UC para PAEDIS 2026
const DEFAULT_INSTITUTIONAL_MODULES = [
  {
    categoryKey: 'admision-matricula',
    categoryTitle: 'Admisión y Matrícula',
    portalUrl: 'https://www.duoc.cl/admision/',
    submodules: [
      {
        id: 'admision-regular',
        title: 'Admisión regular',
        description: 'Proceso de postulación y matrícula para estudiantes regulares y primer año.',
        directUrl: 'https://www.duoc.cl/admision/postula/',
        paedisTip: 'Los postulantes con discapacidad pueden adjuntar el Formulario Único de Acreditación PAEDIS para coordinar ajustes desde el inicio.',
      },
      {
        id: 'cambio-institucion',
        title: 'Cambio de institución',
        description: 'Convalidaciones, traslados y homologación de asignaturas desde otras casas de estudio.',
        directUrl: 'https://www.duoc.cl/admision/traslados/',
        paedisTip: 'Si contabas con ajustes en tu institución previa, puedes solicitar la convalidación de apoyos en el Departamento PAEDIS.',
      },
      {
        id: 'reintegros',
        title: 'Reintegros',
        description: 'Solicitud de retorno y reactivación de matrícula académica luego de una suspensión o baja temporal.',
        directUrl: 'https://experienciavivo.duoc.cl/solicitudes/reintegros',
        paedisTip: 'Recuerda informar con anticipación tu reintegro para reactivar tu tutoría PAR y apoyos en aula.',
      },
    ],
    faqs: [
      {
        question: '¿Cómo matriculo mi semestre si tengo gratuidad o beca?',
        answer: 'Debes ingresar a Experiencia Vivo con tus credenciales y confirmar el pagaré de matrícula costo cero.',
        tags: ['matricula', 'gratuidad', 'arancel'],
      },
      {
        question: '¿Dónde entrego los certificados de discapacidad para PAEDIS?',
        answer: 'Puedes cargarlos digitalmente en la sección Beneficios Estudiantiles > PAEDIS o entregarlos presencialmente a la Coordinación de Asuntos Estudiantiles.',
        tags: ['paedis', 'documentos', 'inclusion'],
      },
    ],
  },
  {
    categoryKey: 'orientacion-nuevos',
    categoryTitle: 'Orientación Estudiantes Nuevos',
    portalUrl: 'https://experienciavivo.duoc.cl/vida-estudiantil/bienvenida',
    submodules: [
      {
        id: 'talleres-extracurriculares',
        title: 'Talleres extracurriculares',
        description: 'Actividades recreativas, deportivas, culturales y de liderazgo estudiantil.',
        directUrl: 'https://experienciavivo.duoc.cl/talleres',
        paedisTip: 'Todos los talleres cuentan con monitores capacitados y adaptaciones según requerimiento sensorial o motriz.',
      },
      {
        id: 'semana-cero',
        title: 'Semana Cero',
        description: 'Inducción institucional presencial y virtual para nuevos integrantes de la comunidad Duoc UC.',
        directUrl: 'https://experienciavivo.duoc.cl/semana-cero',
        paedisTip: 'Recorrido de accesibilidad guiado por la sede y reconocimiento de rampas, ascensores y salas accesibles.',
      },
      {
        id: 'semestre-cero',
        title: 'Semestre Cero',
        description: 'Nivelación en competencias básicas (Matemáticas, Lenguaje y Habilidades Digitales).',
        directUrl: 'https://ava.duoc.cl/nivelacion',
        paedisTip: 'Cursos con material en formato accesible (lectores de pantalla, subtítulos y transcripciones de video).',
      },
      {
        id: 'tne-primera-vez',
        title: 'TNE Primera Vez',
        description: 'Toma de fotografía y captura digital para la Tarjeta Nacional Estudiantil (Junaeb).',
        directUrl: 'https://www.tne.cl/',
        paedisTip: 'Atención preferencial en módulos de fotografía presentando credencial de discapacidad o RND.',
      },
      {
        id: 'servicios-digitales-induccion',
        title: 'Servicios Digitales',
        description: 'Configuración inicial de correo institucional, acceso AVA y Office 365 educativo.',
        directUrl: 'https://experienciavivo.duoc.cl/servicios-digitales',
        paedisTip: 'Soporte asistido para configurar herramientas de accesibilidad nativas de Windows/Mac y lectores de pantalla.',
      },
    ],
    faqs: [
      {
        question: '¿Es obligatoria la asistencia a la Semana Cero?',
        answer: 'Es altamente recomendada ya que conocerás a tu director de carrera, tutores PAR y la infraestructura de tu sede.',
        tags: ['induccion', 'semana cero'],
      },
    ],
  },
  {
    categoryKey: 'vida-academica',
    categoryTitle: 'Estudiantes - Vida Académica',
    portalUrl: 'https://experienciavivo.duoc.cl/academico',
    submodules: [
      { id: 'seguro-medico', title: 'Seguro médico', description: 'Cobertura del Seguro Escolar de Accidentes (Ley 16.744) dentro del recinto y traslados.', directUrl: 'https://experienciavivo.duoc.cl/seguro' },
      { id: 'programa-movilidad', title: 'Programa de movilidad', description: 'Intercambio internacional y estancias formativas en universidades en convenio.', directUrl: 'https://www.duoc.cl/internacional/' },
      { id: 'especializaciones-informatica', title: 'Especializaciones Informática', description: 'Certificaciones de la Escuela de Informática y Telecomunicaciones (AWS, Cisco, Oracle, Azure).', directUrl: 'https://experienciavivo.duoc.cl/certificaciones' },
      { id: 'talleres-academicos', title: 'Talleres', description: 'Reforzamiento académico grupal y tutorías disciplinares de apoyo.', directUrl: 'https://experienciavivo.duoc.cl/tutorias' },
      { id: 'calendario-academico-2026', title: 'Calendario Académico 2026', description: 'Fechas oficiales de inicio y término de semestres, recesos, exámenes y cierres de actas.', directUrl: 'https://www.duoc.cl/alumnos/calendario-academico/' },
      { id: 'inscripcion-asignaturas', title: 'Inscripción de Asignaturas', description: 'Toma de ramos por tramo horario y ajuste de carga horaria semestral.', directUrl: 'https://experienciavivo.duoc.cl/toma-ramos', paedisTip: 'Estudiantes PAEDIS cuentan con tramo prioritario de inscripción para asegurar horarios convenientes y salas accesibles.' },
      { id: 'asistencias-inasistencias', title: 'Asistencias e Inasistencias', description: 'Seguimiento de porcentaje de asistencia y justificación de inasistencias por salud.', directUrl: 'https://experienciavivo.duoc.cl/asistencia', paedisTip: 'Justificaciones médicas o tratamientos recurrentes pueden gestionarse con acompañamiento del coordinador PAEDIS.' },
      { id: 'creditos-becas', title: 'Créditos y Becas', description: 'Renovación de CAE, Gratuidad y becas internas de mantención o alimentación.', directUrl: 'https://experienciavivo.duoc.cl/financiamiento' },
      { id: 'notas-examenes', title: 'Notas y Exámenes', description: 'Visualización de notas parciales, exámenes finales, apelaciones y eximiciones.', directUrl: 'https://experienciavivo.duoc.cl/notas', paedisTip: 'Garantía de ajustes razonables en evaluaciones (tiempo adicional, formato macrotipo o apoyo de lector).' },
      { id: 'revalidacion-tne', title: 'Revalidación TNE', description: 'Pegado de sello o revalidación tecnológica en tótems habilitados.', directUrl: 'https://www.tne.cl/' },
      { id: 'tav', title: 'TAV (Temporada Académica de Verano)', description: 'Asignaturas intensivas durante el periodo estival para adelantar o recuperar carga.', directUrl: 'https://experienciavivo.duoc.cl/tav' },
      { id: 'practicas', title: 'Prácticas', description: 'Gestión, aprobación y evaluación de práctica inicial y profesional.', directUrl: 'https://experienciavivo.duoc.cl/practicas' },
      { id: 'fondos-concursables-2026', title: 'Fondos concursables 2026', description: 'Postulación a proyectos de innovación estudiantil, inclusión y vida comunitaria.', directUrl: 'https://experienciavivo.duoc.cl/fondos' },
      { id: 'continuidad-estudios', title: 'Continuidad de estudios', description: 'Articulación de carreras técnicas a profesionales o postgrados.', directUrl: 'https://www.duoc.cl/continuidad/' },
      { id: 'cambio-carrera', title: 'Cambio de carrera', description: 'Requisitos y solicitud de cambio interno de plan de estudios.', directUrl: 'https://experienciavivo.duoc.cl/solicitudes/cambio-carrera' },
      { id: 'duoc-laboral', title: 'Duoc Laboral', description: 'Bolsa de trabajo exclusiva y ofertas laborales con foco en inclusión laboral (Ley 21.015).', directUrl: 'https://laboral.duoc.cl/' },
      { id: 'renuncia', title: 'Renuncia', description: 'Procedimiento formal de renuncia a la institución y cierre de expediente académico.', directUrl: 'https://experienciavivo.duoc.cl/solicitudes/renuncia' },
      { id: 'suspension-academica', title: 'Suspensión Académica', description: 'Congelamiento semestral por motivos personales, médicos o laborales.', directUrl: 'https://experienciavivo.duoc.cl/solicitudes/suspension' },
    ],
    faqs: [
      { question: '¿Cómo solicito tiempo adicional para mis pruebas?', answer: 'Comunícate con tu tutor PAR o profesional PAEDIS para que emita la Ficha de Ajustes Razonables oficial a tus docentes.', tags: ['ajustes', 'examenes', 'tiempo'] },
      { question: '¿Qué pasa si falto a una evaluación por consulta médica?', answer: 'Ingresa tu certificado médico en la plataforma dentro de los siguientes 5 días hábiles.', tags: ['justificativo', 'salud', 'asistencia'] },
    ],
  },
  {
    categoryKey: 'beneficios-estudiantiles',
    categoryTitle: 'Beneficios Estudiantiles',
    portalUrl: 'https://experienciavivo.duoc.cl/beneficios',
    submodules: [
      { id: 'estudiantes-cuidadores', title: 'Apoyo a estudiantes cuidadores Ley N° 21.790', description: 'Reconocimiento y facilidades académicas para estudiantes con responsabilidades de cuidado a terceros.', directUrl: 'https://experienciavivo.duoc.cl/cuidadores', paedisTip: 'Permite flexibilizar asistencia y justificar atrasos por razones de cuidado directo.' },
      { id: 'paedis-modulo', title: 'PAEDIS', description: 'Programa de Apoyo a Estudiantes con Discapacidad: tutorías PAR, intérpretes LSCH y ayudas técnicas.', directUrl: 'https://experienciavivo.duoc.cl/paedis', paedisTip: 'Módulo central para revisar tu plan de apoyos individualizado y tutorías asignadas.' },
      { id: 'programas-apoyo', title: 'Programas de Apoyo', description: 'Acompañamiento pedagógico y programas socioemocionales de la Dirección de Desarrollo Estudiantil.', directUrl: 'https://experienciavivo.duoc.cl/apoyos' },
      { id: 'bienestar', title: 'Bienestar', description: 'Asistencia social, fondo solidario de emergencia y convenios de salud preventiva.', directUrl: 'https://experienciavivo.duoc.cl/bienestar' },
      { id: 'apoyo-psicologico', title: 'Apoyo psicológico', description: 'Atención psicológica breve y contención emocional gratuita para alumnos regulares.', directUrl: 'https://experienciavivo.duoc.cl/salud-mental' },
    ],
    faqs: [
      { question: '¿Cómo acredito mi condición de cuidador según la Ley 21.790?', answer: 'Debes presentar tu inscripción en el Registro Social de Hogares como persona cuidadora o credencial de cuidador del Ministerio de Desarrollo Social.', tags: ['cuidadores', 'ley 21790', 'beneficios'] },
    ],
  },
  {
    categoryKey: 'pagos-deudas',
    categoryTitle: 'Pagos y Deudas',
    portalUrl: 'https://portalpagos.duoc.cl/',
    submodules: [
      { id: 'pago-matricula', title: 'Matrícula', description: 'Pago en línea de cuota de matrícula y confirmación de contrato.', directUrl: 'https://portalpagos.duoc.cl/matricula' },
      { id: 'pago-arancel', title: 'Arancel', description: 'Pago de cuotas mensuales de arancel mediante WebPay, transferencias o débito automático.', directUrl: 'https://portalpagos.duoc.cl/aranceles' },
      { id: 'repactacion', title: 'Opciones de repactación', description: 'Convenios de pago, reprogramación de cuotas morosas y alivio financiero.', directUrl: 'https://portalpagos.duoc.cl/convenios' },
    ],
    faqs: [
      { question: '¿Qué medios de pago están disponibles?', answer: 'Tarjetas de débito y crédito a través de WebPay, ServiPag y BancoEstado.', tags: ['pagos', 'webpay', 'arancel'] },
    ],
  },
  {
    categoryKey: 'servicios-digitales',
    categoryTitle: 'Servicios Digitales',
    portalUrl: 'https://experienciavivo.duoc.cl/tecnologia',
    submodules: [
      { id: 'acceso-ava', title: 'Acceso AVA (Blackboard)', description: 'Ambiente Virtual de Aprendizaje para materiales, foros, tareas y evaluaciones.', directUrl: 'https://ava.duoc.cl/' },
      { id: 'correo-institucional', title: 'Correo Institucional', description: 'Bandeja de entrada oficial de Microsoft Outlook para avisos de docentes y sede.', directUrl: 'https://outlook.office.com/' },
      { id: 'wifi-duoc', title: 'Wifi Institucional', description: 'Guía de conexión a la red inalámbrica segura para estudiantes en sedes Duoc UC.', directUrl: 'https://experienciavivo.duoc.cl/wifi' },
      { id: 'microsoft-365', title: 'Microsoft 365', description: 'Descarga gratuita de Word, Excel, PowerPoint, Teams y 1TB de almacenamiento en OneDrive.', directUrl: 'https://portal.office.com/' },
      { id: 'ciberseguridad', title: 'Ciberseguridad', description: 'Buenas prácticas, configuración de MFA y protección de credenciales personales.', directUrl: 'https://ciberseguridad.duoc.cl/' },
      { id: 'convenios-software', title: 'Convenios de software (Azure y Adobe)', description: 'Licencias educativas de Adobe Creative Cloud, Azure Dev Tools for Teaching y GitHub Student Pack.', directUrl: 'https://experienciavivo.duoc.cl/software' },
    ],
    faqs: [
      { question: '¿Cómo descargo Office 365 gratis?', answer: 'Ingresa a portal.office.com con tu correo @duocuc.cl y selecciona Instalar Office.', tags: ['office', 'software', 'descargas'] },
    ],
  },
  {
    categoryKey: 'titulados',
    categoryTitle: 'Titulados',
    portalUrl: 'https://www.duoc.cl/titulados/',
    submodules: [
      { id: 'diplomas', title: 'Diplomas', description: 'Seguimiento de confección, timbraje y entrega de título profesional y técnico.', directUrl: 'https://experienciavivo.duoc.cl/titulos/diplomas' },
      { id: 'ceremonias', title: 'Ceremonias', description: 'Fechas de titulación, invitaciones y protocolos de graduación.', directUrl: 'https://experienciavivo.duoc.cl/titulos/ceremonias', paedisTip: 'Coordinación previa de rampas al escenario, intérprete de señas y asientos accesibles para el titulado y familiares.' },
      { id: 'certificados-titulados', title: 'Certificados', description: 'Emisión en línea de certificado de título, concentración de notas y egreso con firma electrónica.', directUrl: 'https://experienciavivo.duoc.cl/certificados' },
    ],
    faqs: [
      { question: '¿Los certificados de título tienen costo?', answer: 'La mayoría de los certificados descargables en línea con firma electrónica avanzada son gratuitos para titulados.', tags: ['titulados', 'certificados', 'diploma'] },
    ],
  },
  {
    categoryKey: 'convivencia-inclusion',
    categoryTitle: 'Convivencia, inclusión y equidad de género',
    portalUrl: 'https://www.duoc.cl/inclusion-genero/',
    submodules: [
      { id: 'canal-denuncias', title: 'Canal de denuncias', description: 'Plataforma confidencial y segura para denunciar acoso, discriminación o vulneración de derechos.', directUrl: 'https://denuncias.duoc.cl/', paedisTip: 'El canal incluye apoyo directo ante cualquier acto de discriminación por motivo de discapacidad.' },
      { id: 'cambio-nombre-social', title: 'Cambio de nombre social', description: 'Solicitud de uso del nombre social en listas de asistencia, correo y credencial física (Ley 21.120).', directUrl: 'https://experienciavivo.duoc.cl/nombre-social' },
    ],
    faqs: [
      { question: '¿Quién atiende las denuncias por discriminación?', answer: 'La Dirección de Personas y la Unidad de Convivencia con estrictos protocolos de confidencialidad y contención.', tags: ['denuncias', 'derechos', 'inclusion'] },
    ],
  },
  {
    categoryKey: 'sostenedor',
    categoryTitle: 'Sostenedor',
    portalUrl: 'https://experienciavivo.duoc.cl/sostenedor',
    submodules: [
      { id: 'solicitudes-sostenedor', title: 'Solicitudes del alumno', description: 'Canal para que el apoderado o sostenedor financiero realice consultas formales.', directUrl: 'https://experienciavivo.duoc.cl/sostenedor/solicitudes' },
      { id: 'certificados-alumno', title: 'Certificados del alumno', description: 'Emisión de certificados de alumno regular para asignación familiar o trámites laborales del sostenedor.', directUrl: 'https://experienciavivo.duoc.cl/sostenedor/certificados' },
    ],
    faqs: [
      { question: '¿Cómo autoriza el estudiante el acceso a su sostenedor?', answer: 'Desde su perfil en Experiencia Vivo en la pestaña "Autorización a Terceros".', tags: ['sostenedor', 'certificados', 'apoderado'] },
    ],
  },
];

class DataScraperService {
  /**
   * Obtiene todos los módulos, consultando primero el caché de MongoDB
   */
  async getAllModules() {
    try {
      const cached = await ScrapedDataCache.find({});
      if (cached && cached.length >= DEFAULT_INSTITUTIONAL_MODULES.length) {
        return cached;
      }

      // Si no están todos en caché o la BD está vacía, poblar con datos base
      await this.seedDefaultData();
      return DEFAULT_INSTITUTIONAL_MODULES;
    } catch (err) {
      console.warn('[DataScraperService] BD no disponible, usando datos base en memoria:', err.message);
      return DEFAULT_INSTITUTIONAL_MODULES;
    }
  }

  /**
   * Obtiene una categoría específica por su clave única
   */
  async getCategoryByKey(categoryKey) {
    try {
      const cached = await ScrapedDataCache.findOne({ categoryKey });
      if (cached && !cached.isExpired()) {
        return cached;
      }
    } catch (err) {
      console.warn('[DataScraperService] Error consultando caché de MongoDB:', err.message);
    }

    // Fallback directo a datos en memoria
    return DEFAULT_INSTITUTIONAL_MODULES.find((m) => m.categoryKey === categoryKey) || null;
  }

  /**
   * Siembra la base de datos de MongoDB con la estructura inicial
   */
  async seedDefaultData() {
    try {
      for (const mod of DEFAULT_INSTITUTIONAL_MODULES) {
        await ScrapedDataCache.findOneAndUpdate(
          { categoryKey: mod.categoryKey },
          { ...mod, last_updated: new Date() },
          { upsert: true, new: true }
        );
      }
      console.log('[DataScraperService] Datos institucionales cacheados con éxito en MongoDB.');
    } catch (err) {
      console.warn('[DataScraperService] No se pudo guardar caché inicial en MongoDB:', err.message);
    }
  }
}

module.exports = new DataScraperService();

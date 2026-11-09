/**
 * ESTRUCTURA COMPLETA Y ENRIQUECIDA DEL CENTRO DE AYUDA DUOC UC PARA NEXO360
 * Extraída directamente de https://centroayuda.duoc.cl/hc/es-419
 * Incluye:
 * - 9 Categorías Oficiales con sus descripciones íntegras y URLs.
 * - 44 Apartados / Secciones Oficiales con instrucciones accionables, consejos PAEDIS y etiquetas de intención.
 * - 129 Artículos Oficiales con resúmenes legibles y enlaces directos verificados.
 * - 8 Rutas de Intención Rápida ("¿Qué necesitas resolver hoy?") para acceso sin fricción.
 */

export const INTENT_SHORTCUTS = [
  {
    "id": "intent-inasistencia",
    "question": "Falté a clases o a una evaluación",
    "subtitle": "Justificar con certificado médico (5 días), revisar 70% o apelar RI",
    "badge": "Urgente Académico",
    "categoryId": "vida-academica",
    "submoduleId": "asistencias-inasistencias",
    "iconName": "CheckSquare",
    "colorTheme": "emerald"
  },
  {
    "id": "intent-paedis-cuidadores",
    "question": "Necesito Apoyo PAEDIS o soy Cuidador/a",
    "subtitle": "Ajustes razonables por discapacidad y flexibilidad Ley N° 21.790",
    "badge": "Inclusión & Apoyo",
    "categoryId": "beneficios-estudiantiles",
    "submoduleId": "paedis-discapacidad",
    "iconName": "HeartHandshake",
    "colorTheme": "amber"
  },
  {
    "id": "intent-toma-ramos",
    "question": "Quiero inscribir ramos o ver mi horario",
    "subtitle": "Fechas de inscripción, ramos pendientes y Simulador de Toma de Ramos",
    "badge": "Con Simulador",
    "categoryId": "vida-academica",
    "submoduleId": "inscripcion-asignaturas",
    "iconName": "Calendar",
    "colorTheme": "blue"
  },
  {
    "id": "intent-acceso-mfa-ava",
    "question": "Problemas con Clave, MFA, AVA o WiFi",
    "subtitle": "Recuperar contraseña, Microsoft Authenticator, Blackboard y red de sede",
    "badge": "Soporte Digital",
    "categoryId": "servicios-digitales",
    "submoduleId": "seguridad-autenticacion-mfa-clave",
    "iconName": "Laptop",
    "colorTheme": "purple"
  },
  {
    "id": "intent-gratuidad-pagos",
    "question": "Gratuidad, CAE, Matrícula o Repactar Deuda",
    "subtitle": "Exención de pago con beneficios, firma de contrato y reprogramación",
    "badge": "Finanzas",
    "categoryId": "pagos-deudas",
    "submoduleId": "matricula-arancel-pagos",
    "iconName": "CreditCard",
    "colorTheme": "slate"
  },
  {
    "id": "intent-tne-seguro",
    "question": "Perdí mi TNE, Revalidación o Seguro Médico",
    "subtitle": "Reposición de Pase Escolar, sello en Tótem Bip! y cobertura de accidentes",
    "badge": "Beneficios y TNE",
    "categoryId": "vida-academica",
    "submoduleId": "revalidacion-reposicion-tne",
    "iconName": "Award",
    "colorTheme": "blue"
  },
  {
    "id": "intent-notas-examenes",
    "question": "Fechas de Exámenes, Notas o Nota Pendiente",
    "subtitle": "Plazos de publicación de notas, recalendarizar examen y solicitudes",
    "badge": "Evaluaciones",
    "categoryId": "vida-academica",
    "submoduleId": "notas-examenes",
    "iconName": "BookOpen",
    "colorTheme": "emerald"
  },
  {
    "id": "intent-congelar-bienestar",
    "question": "Apoyo Psicológico, Congelar o Denuncias",
    "subtitle": "Salud mental gratuita, suspensión temporal de semestre y canal de apoyo",
    "badge": "Bienestar Integral",
    "categoryId": "beneficios-estudiantiles",
    "submoduleId": "bienestar-salud-mental",
    "iconName": "ShieldAlert",
    "colorTheme": "amber"
  }
];

export const DUOC_CATEGORIES = [
  {
    "id": "admision-matricula",
    "zendeskCategoryId": 30141678666125,
    "title": "Admisión y Matrícula",
    "officialCategoryUrl": "https://centroayuda.duoc.cl/hc/es-419/categories/30141678666125-Admisi%C3%B3n-y-Matr%C3%ADcula",
    "iconName": "GraduationCap",
    "highlight": false,
    "badge": "4 Apartados • 11 Guías",
    "sectionsCount": 4,
    "articlesCount": 11,
    "shortIntent": "Postulación, traslados desde otra institución, cambios de carrera/jornada y reintegros.",
    "description": "Descubre toda la información sobre las diversas opciones de admisión en Duoc UC, incluyendo el proceso de admisión para nuevos estudiantes, el ingreso para quienes provienen de otras instituciones, los cambios de carrera para estudiantes actuales o los procesos de reintegros y reincorporaciones a Duoc UC.",
    "submodules": [
      {
        "id": "admision-regular",
        "zendeskSectionId": 30173709001613,
        "title": "Admisión Regular",
        "description": "¡Aquí tienes todo lo que necesitas para postularte, cumplir con los requisitos y comenzar tu formación en el programa que más te interesa! Explora las opciones disponibles y encuentra fácilmente lo que buscas para dar el siguiente paso en tu camino.",
        "intentGoal": "Postular por primera vez, conocer fechas de matrícula, requisitos y sostenedor.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/30173709001613-Admisi%C3%B3n-Regular",
        "link": "https://www.duoc.cl/admision/postula/",
        "actionLabel": "Ir al Portal de Admisión Duoc UC",
        "instructions": "1. Revisa las fechas del proceso de admisión y carreras disponibles por sede.\n2. Reúne tu Licencia de Enseñanza Media, Cédula de Identidad y datos de tu sostenedor financiero.\n3. Completa tu postulación y firma el contrato de matrícula en línea.",
        "paedisTip": "Si eres postulante en situación de discapacidad, declara tu condición al matricularte para activar el acompañamiento temprano de PAEDIS en tu sede.",
        "intentTags": [
          "postular",
          "matricula nuevo",
          "requisitos admision",
          "sostenedor",
          "primer año",
          "ingreso"
        ],
        "articlesCount": 3,
        "articles": [
          {
            "id": 30173827568013,
            "title": "¿Cuándo inicia el proceso de admisión?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30173827568013--Cu%C3%A1ndo-inicia-el-proceso-de-admisi%C3%B3n",
            "summary": "Para saber cuándo inicia el proceso de admisión, te invitamos a revisar nuestro sitio web , también puedes ponerte en contacto con el servicio de atención a usuarios de Admisión en los siguientes canales: 🗣️ Llámanos al (+56) 2 2712 0640. Nuestro equipo amigable está listo para atenderte y resolver todas tus dudas sobre el proceso de admisión y matrícula. 📱 ¿Prefieres mensajear? Envíanos un mensaje al +56 958142089...",
            "externalLinks": [
              "https://www.duoc.cl/admision/"
            ]
          },
          {
            "id": 30203991504653,
            "title": "¿Cuáles son los requisitos para postularme?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30203991504653--Cu%C3%A1les-son-los-requisitos-para-postularme",
            "summary": "Aquí encontrarás los principales documentos y requisitos que debes considerar para realizar tu proceso de admisión y matrícula en Duoc UC. Revisa con anticipación cuáles aplican en tu caso. 👇 1. Licencia de Educación Media (LEM) La Licencia de Educación Media (LEM) acredita que completaste tu enseñanza media y es un requisito para ingresar a la educación superior. Puedes obtenerla en el sitio de Certificados del Min...",
            "externalLinks": [
              "https://certificados.mineduc.cl/mvc/home/index"
            ]
          },
          {
            "id": 30204419750925,
            "title": "¿Quién puede ser mi sostenedor?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30204419750925--Qui%C3%A9n-puede-ser-mi-sostenedor",
            "summary": "El sostenedor es la persona que asume la responsabilidad económica asociada a tu contrato de prestación de servicios educacionales en Duoc UC. 💰 Puede ser un familiar, otra persona que cumpla con los requisitos establecidos por Duoc UC o tú mismo , siempre que cumplas con las condiciones necesarias para ser sostenedor. ¿Qué requisitos debe cumplir un sostenedor? Para ser sostenedor en Duoc UC, la persona debe: Ser m...",
            "externalLinks": []
          }
        ]
      },
      {
        "id": "cambio-carrera-jornada-sede",
        "zendeskSectionId": 32251435844365,
        "title": "Cambio de Carrera, Jornada o Sede",
        "description": "Si eres estudiante de Duoc UC y estás considerando realizar un cambio en tu vida estudiantil, como: cambiar de carrera, sede o jornada, aquí encontrarás toda la información necesaria para realizar el proceso de manera clara y eficiente.",
        "intentGoal": "Cambiar de carrera (Admisión Especial Interna), pasar de diurno a vespertino o trasladarme de sede.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/32251435844365-Cambio-de-Carrera-Jornada-o-Sede",
        "link": "https://experienciavivo.duoc.cl/alumnos/solicitudes",
        "actionLabel": "Solicitar Cambio en Vivo Duoc",
        "instructions": "1. Ingresa al Portal Experiencia Vivo > Solicitudes.\n2. Selecciona \"Cambio de Jornada o Sede\" o postula por \"Admisión Especial Interna\" para cambio de carrera.\n3. Verifica cómo aplica tu beneficio de Gratuidad o beca antes de confirmar el cambio.",
        "paedisTip": "Los estudiantes PAEDIS pueden solicitar cambio de jornada (diurna/vespertina) con prioridad si requieren compatibilizar tratamientos médicos o terapias.",
        "intentTags": [
          "cambio de carrera",
          "cambio de jornada",
          "cambio de sede",
          "diurno a vespertino",
          "traslado interno",
          "gratuidad cambio"
        ],
        "articlesCount": 3,
        "articles": [
          {
            "id": 32251820558221,
            "title": "Admisión Especial Interna: cambio de carrera",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/32251820558221-Admisi%C3%B3n-Especial-Interna-cambio-de-carrera",
            "summary": "¿Qué es la Admisión Especial Interna? La Admisión Especial Interna es un proceso que te permite, siendo estudiante regular, solicitar un cambio de carrera dentro de DUOC UC . Fechas claves: Inicio del período de postulación y matrícula : 28 de diciembre de 2026 Cierre del período de postulación: 6 de marzo de 2027 Cierre del período de matrícula: 8 de marzo de 2027 ¿Cómo realizar el proceso para el primer semestre de...",
            "externalLinks": [
              "https://admision.duoc.cl/cargando-estados?flujo=rap",
              "https://www.duoc.cl/reintegros/",
              "https://experienciavivo.duoc.cl/alumnos/solicitudes"
            ]
          },
          {
            "id": 30308211391629,
            "title": "¿Cómo realizar una solicitud de cambio de jornada o sede?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30308211391629--C%C3%B3mo-realizar-una-solicitud-de-cambio-de-jornada-o-sede",
            "summary": "Si eres alumno regular de Duoc UC y estás pensando en cambiarte de sede y/o jornada , puedes realizarlo desde tu portal VIVO o aquí . Este proceso te permite realizar los cambios que necesitas para avanzar en tu formación. Fechas claves: Inicio del período de postulación y matrícula : 28 de diciembre de 2026 Cierre del período de postulación : 6 de marzo de 2027 Cierre del período de matrícula: 8 de marzo de 2027 ¿Qu...",
            "externalLinks": [
              "https://movimientosinternos.duoc.cl/",
              "https://experienciavivo.duoc.cl/alumnos/solicitudes"
            ]
          },
          {
            "id": 30338284908429,
            "title": "¿Puedo postular si tengo gratuidad?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30338284908429--Puedo-postular-si-tengo-gratuidad",
            "summary": "Sí. La Gratuidad contempla la posibilidad de realizar un cambio, ya sea de carrera o de institución. Por lo tanto, si aún no has utilizado esta opción, puedes postular a Duoc UC y mantener tu beneficio, siempre que cumplas con los requisitos establecidos por el Ministerio de Educación. Es importante considerar que la duración de la Gratuidad se recalcula al momento del cambio. Esto significa que, de la duración forma...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/requests/new/"
            ]
          }
        ]
      },
      {
        "id": "cambio-otra-institucion",
        "zendeskSectionId": 32251449954061,
        "title": "Cambio desde otra institución a Duoc UC",
        "description": "Aquí encontrarás toda la información que necesitan los estudiantes que provienen de otra institución y desean continuar su formación en Duoc UC. Te proporcionamos todo lo necesario para que el proceso sea claro y sencillo.",
        "intentGoal": "Trasladarme desde otra universidad o instituto y convalidar ramos aprobados.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/32251449954061-Cambio-desde-otra-instituci%C3%B3n-a-Duoc-UC",
        "link": "https://www.duoc.cl/admision/admision-especial/",
        "actionLabel": "Ir a Admisión Especial y Convalidaciones",
        "instructions": "1. Solicita en tu institución de origen los certificados de notas oficiales y programas de asignaturas timbrados.\n2. Postula por vía de Admisión Especial Externa en el portal de Duoc UC.\n3. Presenta tus antecedentes para la resolución de convalidación de asignaturas.",
        "paedisTip": "Puedes presentar tu historial de ajustes razonables previos ante la coordinación PAEDIS de tu nueva sede para dar continuidad a tus apoyos.",
        "intentTags": [
          "convalidar ramos",
          "convalidacion",
          "otra universidad",
          "otro instituto",
          "traslado externo",
          "homologar"
        ],
        "articlesCount": 2,
        "articles": [
          {
            "id": 32251993548429,
            "title": "¿Cuándo inicia el proceso de postulación?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/32251993548429--Cu%C3%A1ndo-inicia-el-proceso-de-postulaci%C3%B3n",
            "summary": "Si actualmente estudias o estudiaste en otra Institución de Educación Superior y quieres continuar tus estudios en Duoc UC, puedes realizar tu proceso de Admisión Especial y solicitar el reconocimiento de asignaturas previamente cursadas, cuando corresponda. 🎓 Para el proceso de Admisión 2027 , revisa los requisitos, documentación necesaria, fechas y pasos que debes seguir para ingresar a Duoc UC a través de esta ví...",
            "externalLinks": [
              "https://www.duoc.cl/admision/especial"
            ]
          },
          {
            "id": 30336761739149,
            "title": "¿Cómo puedo convalidar asignaturas DUOC?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30336761739149--C%C3%B3mo-puedo-convalidar-asignaturas-DUOC",
            "summary": "Luego de completar tu matrícula en la nueva sede, carrera o jornada, podrás hacer una solicitud en línea a través del Portal Experiencia Vivo Alumnos . Solo tienes que seleccionar la opción \"Convalidación\" y luego elegir el servicio \"Convalidación de asignaturas\" . Ahí, puedes agregar los detalles de las asignaturas que deseas convalidar. Si tienes a mano las siglas de las asignaturas, ¡no dudes en incluirlas en tu s...",
            "externalLinks": [
              "https://experienciavivo.duoc.cl/alumnos"
            ]
          }
        ]
      },
      {
        "id": "reintegros-reincorporaciones",
        "zendeskSectionId": 32251450605837,
        "title": "Reintegros y Reincorporaciones",
        "description": "Si has tenido un retiro temporal o definitivo de Duoc UC y deseas retomar tus estudios, esta sección es para ti. Aquí encontrarás toda la información y los pasos que necesitas para realizar tu reintegro o reincorporación de forma clara y sencilla.",
        "intentGoal": "Retomar mis estudios en Duoc UC después de haber congelado, suspendido o abandonado.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/32251450605837-Reintegros-y-Reincorporaciones",
        "link": "https://experienciavivo.duoc.cl/alumnos/solicitudes",
        "actionLabel": "Gestionar Reintegro en Vivo Duoc",
        "instructions": "1. Verifica los plazos oficiales de postulación al Reintegro antes del inicio del semestre.\n2. Ingresa a Experiencia Vivo o al formulario oficial de Reintegro.\n3. Si tu carrera actualizó su malla o no aparece en el formulario, contacta a tu coordinación académica.",
        "paedisTip": "Al reincorporarte, notifica a tu coordinador/a PAEDIS para reactivar de inmediato tu Ficha de Ajustes Razonables y tutorías.",
        "intentTags": [
          "reintegro",
          "reincorporacion",
          "volver a estudiar",
          "retomar estudios",
          "regresar a duoc"
        ],
        "articlesCount": 3,
        "articles": [
          {
            "id": 30204892289549,
            "title": "¿Cuándo inicia el proceso de Reintegro?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30204892289549--Cu%C3%A1ndo-inicia-el-proceso-de-Reintegro",
            "summary": "El proceso de reintegro se realiza en los períodos definidos en el Calendario Académico de Duoc UC. Durante estas fechas, si deseas reincorporarte a la institución, podrás iniciar tu solicitud a través del formulario disponible en la sección de Reintegros. Inicio periodo de postulación y matrícula: 02 de noviembre de 2026 Fin periodo de postulación : 06 de marzo de 2027 Fin periodo de matrícula : 08 de marzo de 2027 ...",
            "externalLinks": [
              "https://www.duoc.cl/reintegros/#formulario"
            ]
          },
          {
            "id": 30141693699981,
            "title": "¿Cómo puedo postular al Reintegro?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30141693699981--C%C3%B3mo-puedo-postular-al-Reintegro",
            "summary": "Puedes realizar tu postulación en nuestro sitio web siguiendo estos pasos: Completa el formulario de solicitud de reintegro. Tu postulación será evaluada por nuestro equipo, que revisará los antecedentes y preparará la mejor propuesta de reintegro para tu situación. Recibirás las indicaciones necesarias para concretar tu matrícula en el período académico correspondiente. Documentación requerida Al momento de gestiona...",
            "externalLinks": [
              "https://www.duoc.cl/reintegros/#formulario"
            ]
          },
          {
            "id": 30141678814349,
            "title": "¿Qué hago si la carrera a la que quiero postular no está en el formulario?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30141678814349--Qu%C3%A9-hago-si-la-carrera-a-la-que-quiero-postular-no-est%C3%A1-en-el-formulario",
            "summary": "Si la carrera, jornada o sede que te interesa no aparece en el formulario, no te preocupes. Esto puede deberse a que actualmente no se encuentra disponible en la oferta vigente. Te recomendamos completar igualmente tu postulación e indicar en la sección de Comentarios la carrera, sede o jornada de tu interés. Nuestro equipo revisará tu solicitud y evaluará los antecedentes presentados. Si la opción solicitada no se e...",
            "externalLinks": []
          }
        ]
      }
    ]
  },
  {
    "id": "orientacion-nuevos",
    "zendeskCategoryId": 30142028615565,
    "title": "Orientación Estudiantes Nuevos",
    "officialCategoryUrl": "https://centroayuda.duoc.cl/hc/es-419/categories/30142028615565-Orientaci%C3%B3n-Estudiantes-Nuevos",
    "iconName": "Compass",
    "highlight": false,
    "badge": "7 Apartados • 14 Guías",
    "sectionsCount": 7,
    "articlesCount": 14,
    "shortIntent": "Kit de bienvenida, primer horario, Semana Cero, Semestre Cero, TNE 1ª vez y activación digital.",
    "description": "Guía práctica para nuevos estudiantes: conoce cómo acceder a la plataforma, organizar tus horarios y entender los procesos fundamentales de inicio en el instituto, incluyendo opciones de retiro temprano.",
    "submodules": [
      {
        "id": "talleres-extracurriculares-inicio",
        "zendeskSectionId": 35332912860301,
        "title": "Inscripción de Talleres Extracurriculares para Alumnos de Inicio 🌱",
        "description": "Aprende cómo inscribir talleres por primera vez 💪",
        "intentGoal": "Inscribirme en talleres deportivos, culturales o recreativos siendo estudiante de primer año.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/35332912860301-Inscripci%C3%B3n-de-Talleres-Extracurriculares-para-Alumnos-de-Inicio",
        "link": "https://experienciavivo.duoc.cl/alumnos/actividades/posts",
        "actionLabel": "Inscribir Talleres en Vivo Duoc",
        "instructions": "1. Ingresa a Experiencia Vivo Duoc con tu cuenta institucional.\n2. Revisa la oferta de Talleres Extracurriculares de tu sede e inscríbete en los cupos habilitados.\n3. Si presentas inconvenientes, genera una Solicitud en Línea en el portal.",
        "paedisTip": "Consulta en Punto Estudiantil por las adaptaciones de accesibilidad en talleres deportivos y culturales de tu sede.",
        "intentTags": [
          "talleres primer año",
          "deportes",
          "cultura",
          "extracurriculares inicio",
          "actividades"
        ],
        "articlesCount": 2,
        "articles": [
          {
            "id": 35528298183949,
            "title": "¿Cómo crear una Solicitud en Línea si tengo problemas con la inscripción de Talleres Extracurriculares?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/35528298183949--C%C3%B3mo-crear-una-Solicitud-en-L%C3%ADnea-si-tengo-problemas-con-la-inscripci%C3%B3n-de-Talleres-Extracurriculares",
            "summary": "⚠️ Importante: debes iniciar sesión en el Centro de Ayuda para poder crear una solicitud Si tienes problemas con la inscripción y/o desinscripción de Talleres Extracurriculares, puedes crear una Solicitud en Línea para que el equipo de tu sede pueda atenderla. Te dejamos un tutorial express para que aprendas cómo crear una solicitud: Puedes crear una Solicitud en Línea en este link 🔗",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/requests/new?ticket_form_id=30932214164365"
            ]
          },
          {
            "id": 35344976808589,
            "title": "¿Cómo inscribir Talleres Extracurriculares?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/35344976808589--C%C3%B3mo-inscribir-Talleres-Extracurriculares",
            "summary": "¡Atención alumnos de inicio! 🐣 Desde el jueves 3 de septiembre podrán inscribir Talleres Extracurriculares en el portal de Inscripción de Asignaturas. Inscribir talleres extracurriculares es voluntario , pero si te inscribes deberás cumplir con asistencia tal como si fuese una asignatura curricular. ¿Tienes preguntas? 🤔 Puedes visitar este artículo y resolver tus dudas sobre las condiciones, requisitos y responsabi...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/articles/35461158393357",
              "https://portalinsc.duoc.cl/webdynpro/dispatcher/duoc.com.student/sicol/StudentSicol?inportal=xi",
              "https://centroayuda.duoc.cl/hc/es-419/requests/new?ticket_form_id=30932214164365",
              "https://centroayuda.duoc.cl/hc/es-419/articles/35528298183949--C%C3%B3mo-crear-una-Solicitud-en-L%C3%ADnea-si-tengo-problemas-con-la-inscripci%C3%B3n-de-Talleres-Extracurriculares"
            ]
          }
        ]
      },
      {
        "id": "ingreso-primeros-pasos",
        "zendeskSectionId": 30202289601293,
        "title": "Ingreso",
        "description": "Aquí encontrarás toda la información que necesitas para comenzar tu vida estudiantil en Duoc UC. Te ayudamos a dar los primeros pasos de manera clara y sencilla. ¡Bienvenido!",
        "intentGoal": "Revisar mi Kit/Correo de Bienvenida y encontrar mi primer horario de clases.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/30202289601293-Ingreso",
        "link": "https://experienciavivo.duoc.cl/alumnos/horarios",
        "actionLabel": "Ver Mi Horario en Vivo Duoc",
        "instructions": "1. Revisa tu bandeja de entrada y carpeta de spam para localizar tu Correo de Bienvenida con credenciales.\n2. Una vez activada tu cuenta, ingresa a Experiencia Vivo > Horarios para conocer tus salas y bloques de clases.",
        "paedisTip": "Si necesitas cambio de sala a primer piso o acceso por ascensor, revísalo con anticipación junto al equipo PAEDIS antes del primer día.",
        "intentTags": [
          "kit de bienvenida",
          "correo de bienvenida",
          "primer horario",
          "donde ver mi horario",
          "alumno nuevo"
        ],
        "articlesCount": 2,
        "articles": [
          {
            "id": 30202470432013,
            "title": "No recibí mi Kit de Bienvenida / Correo de Bienvenida",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30202470432013-No-recib%C3%AD-mi-Kit-de-Bienvenida-Correo-de-Bienvenida",
            "summary": "El Correo de Bienvenida se envía automáticamente después de que completes el pago de la matrícula. Te sugerimos que revises la carpeta de spam de tu correo. Si aún no has recibido tu kit, contacta al área de admisión para resolver cualquier inconveniente. Puedes llamarlos al (+56) 227 120 640 o enviar un mensaje por WhatsApp al +56 9 47995454. 📞💬 Una vez que tengas tus accesos, podrás ingresar a los siguientes serv...",
            "externalLinks": [
              "https://login.microsoftonline.com/72fd0b5a-8a6a-4cff-89f6-bde961f7e250/saml2?SAMLRequest=fVLLTsMwELwj8Q%2BW73kVCYHVpCqgikoFojZw4OY4m9SqYwev3cLfk6ZFhQO9jmfnsd7x5LNVZAsWpdEpTcKYEtDCVFI3KX0tZsENnWSXF2PkrerY1Lu1XsKHB3Skn9TIhoeUequZ4SiRad4CMifYavq0YKMwZp01zgijKJk%2FpFRJ6BrTikbXm7YRDej1puKlakSptYGyUqXs6m5DydtPrNE%2B1hzRw1yj49r1UDy6CpIkSOIiuWbJiMW375TkR6c7qQ8NzsUqDyRkj0WRB%2FnLqhgEtrIC%2B9yzU9oY0ygIhWn39jlHlNserrlCoGSKCNb1Ae%2BNRt%2BCXYHdSgGvy0VK1851yKJot9uFJ5mIR5U3wotQqIgLpNmwWDZ0s782ej45%2F3Gm2Ul7HP2Syo4ftu8xf8iNkuKLTJUyu3sL3PUlnPV9h5mxLXf%2FuyVhMiCyCuqByrzGDoSsJVSURNnB9e9l9PfyDQ%3D%3D&amp;RelayState=https%3A%2F%2Fwww.google.com%2Fa%2Falumnos.duoc.cl%2FServiceLogin%3Fservice%3Dmail%26passive%3Dtrue%26rm%3Dfalse%26continue%3Dhttps%253A%252F%252Fmail.google.com%252Fmail%252F%26ss%3D1%26ltmpl%3Ddefault%26ltmplcache%3D2%26emr%3D1%26osid%3D1",
              "https://experienciavivo.duoc.cl",
              "https://www.duoc.cl/alumnos/servicios-digitales/guia-de-inicio/"
            ]
          },
          {
            "id": 30202376543117,
            "title": "¿Dónde puedo conseguir mi horario de clases?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30202376543117--D%C3%B3nde-puedo-conseguir-mi-horario-de-clases",
            "summary": "Lo primero es lo primero 🏁 Como estudiante, puede que estés acostumbrado un horario de clases \"estático\" durante todo el año: la misma clase, el mismo día de la semana, a la misma hora. Sin embargo, la programación de las clases no siempre es regular : puede que algunas clases ocurran semana por medio, o que a veces la clase cambie de locación (instancias teóricas en sala y luego instancias prácticas en terreno). A ...",
            "externalLinks": [
              "https://auth.duoc.cl/auth/realms/Postulantes/protocol/openid-connect/auth?client_id=modyo&amp;nonce=3868c4e1e6ff4ff0538e61be2659cedd&amp;redirect_uri=https%3A%2F%2Fplataforma.duoc.cl%2Frealms%2Fadmision-produccion%2Fauth%2Fopenidc%2Fcallback&amp;response_type=code&amp;scope=openid%20email%20profile%20web-origins&amp;state=f7131854855f29faf19bbebbca0bd970",
              "https://portalinsc.duoc.cl/irj/portal",
              "https://experienciavivo.duoc.cl",
              "https://www.duoc.cl/appvivoduocuc/"
            ]
          }
        ]
      },
      {
        "id": "semana-cero-jornada-inicio",
        "zendeskSectionId": 30209665855117,
        "title": "Semana Cero y Jornada de Inicio",
        "description": "Aquí tienes toda la información que necesitas para comenzar con éxito tu primera semana como estudiante.",
        "intentGoal": "Saber cuándo es la Semana Cero o Jornada de Inicio y qué actividades incluye.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/30209665855117-Semana-Cero-y-Jornada-de-Inicio",
        "link": "https://experienciavivo.duoc.cl/alumnos/actividades/posts",
        "actionLabel": "Ver Actividades de Bienvenida",
        "instructions": "1. Revisa la fecha de tu Jornada de Inicio según tu sede y carrera.\n2. Asiste a la bienvenida para conocer a tu Director/a de Carrera, coordinadores y recorrer las instalaciones de tu sede.",
        "paedisTip": "Durante la Semana Cero puedes solicitar un recorrido guiado de accesibilidad para ubicar ascensores, baños accesibles, biblioteca y oficinas PAEDIS.",
        "intentTags": [
          "semana cero",
          "jornada de inicio",
          "induccion",
          "bienvenida duoc",
          "primer dia de clases"
        ],
        "articlesCount": 2,
        "articles": [
          {
            "id": 30209840642317,
            "title": "¿Qué es la Semana Cero o Jornada de Inicio?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30209840642317--Qu%C3%A9-es-la-Semana-Cero-o-Jornada-de-Inicio",
            "summary": "La Jornada de Inicio es la semana previa al inicio de clases y es una excelente oportunidad para ti como alumno nuevo 🎓. Durante esta semana, podrás conocer a tus docentes, coordinadores, directores y jefes de carrera, así como explorar las instalaciones de tu sede 🏫 Es el momento perfecto para familiarizarte con tu nuevo entorno y empezar a descubrir todo lo que Duoc UC tiene para ofrecerte. ¡Importante! Consulta ...",
            "externalLinks": [
              "https://www.duoc.cl/jornada-de-inicio/"
            ]
          },
          {
            "id": 30209966086669,
            "title": "¿Cuándo es la Jornada de Inicio?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30209966086669--Cu%C3%A1ndo-es-la-Jornada-de-Inicio",
            "summary": "Puedes conocer todos los detalles sobre tu Jornada de Inicio visitando nuestro sitio web Jornadas de Inicio Duoc . Allí encontrarás toda la información que necesitas según tu sede para planificar tu participación y aprovechar al máximo esta instancia. 🏫",
            "externalLinks": [
              "https://www.duoc.cl/jornada-de-inicio/"
            ]
          }
        ]
      },
      {
        "id": "servicios-digitales-nuevos",
        "zendeskSectionId": 33730428242189,
        "title": "Servicios Digitales",
        "description": "Aquí encontrarás toda la información que necesitas para activar y acceder a las plataformas digitales que apoyarán tu experiencia académica. Desde el acceso a tu cuenta institucional hasta el uso de herramientas para la gestión de tu aprendizaje.",
        "intentGoal": "Activar mi cuenta institucional @duocuc.cl y conocer las plataformas digitales (AVA, Vivo Duoc).",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/33730428242189-Servicios-Digitales",
        "link": "https://centroayuda.duoc.cl/hc/es-419/sections/33730428242189-Servicios-Digitales",
        "actionLabel": "Ver Guía de Activación Digital",
        "instructions": "1. Activa tu cuenta institucional siguiendo el enlace enviado a tu correo personal al matricularte.\n2. Configura tu contraseña y el segundo factor de autenticación (Microsoft Authenticator).\n3. Explora Experiencia Vivo, AVA Blackboard y tu correo @duocuc.cl.",
        "paedisTip": "Todas las cuentas @duocuc.cl incluyen licencias de Microsoft 365 con lector inmersivo, dictado por voz y herramientas de lectura accesible.",
        "intentTags": [
          "activar cuenta",
          "plataformas duoc",
          "cuenta nueva",
          "activar correo",
          "servicios digitales inicio"
        ],
        "articlesCount": 2,
        "articles": [
          {
            "id": 33730691064973,
            "title": "Activación de Servicios Digitales",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/33730691064973-Activaci%C3%B3n-de-Servicios-Digitales",
            "summary": "¡Bienvenido a Duoc UC! Sabemos que comenzar tu vida académica en una nueva institución puede ser un proceso emocionante, pero también desafiante, sobre todo cuando se trata de activación de servicios digitales. Por eso, hemos preparado esta guía amigable para ayudarte a activar tus cuentas que te acompañarán en tu experiencia como estudiante. 1. Revisa tu Correo Personal y Activa tu Cuenta y Contraseña Una vez que te...",
            "externalLinks": [
              "https://www.duoc.cl/alumnos/servicios-digitales/cuentas-y-accesos/"
            ]
          },
          {
            "id": 33731062285197,
            "title": "Explora las Plataformas de Duoc UC",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/33731062285197-Explora-las-Plataformas-de-Duoc-UC",
            "summary": "Ahora que ya tienes acceso a tus credenciales, es momento de comenzar a explorar las diferentes plataformas digitales que te ayudarán a gestionar tu experiencia académica. A continuación, te presentamos un resumen de las plataformas más importantes a las que podrás acceder, todas ellas diseñadas para facilitarte la vida estudiantil. Correo Institucional Tu correo institucional es una herramienta clave para mantenerte...",
            "externalLinks": [
              "https://www.duoc.cl/alumnos/servicios-digitales/correo-institucional/",
              "https://www.duoc.cl/alumnos/ava-blackboard/",
              "https://bibliotecas.duoc.cl/inicio",
              "https://experienciavivo.duoc.cl/alumnos/finanzas",
              "https://experienciavivo.duoc.cl/alumnos/certificados",
              "https://experienciavivo.duoc.cl/alumnos/Solicitudes",
              "https://experienciavivo.duoc.cl/alumnos/progreso-academico",
              "https://inscripciones.duoc.cl/IA/",
              "https://inscripciones.duoc.cl/TAV/",
              "https://portafolio.duoc.cl/",
              "http://www.duoc.cl/practica",
              "https://seiduoc.integridadcorporativa.cl/",
              "https://centroayuda.duoc.cl/"
            ]
          }
        ]
      },
      {
        "id": "semestre-cero",
        "zendeskSectionId": 30174262169357,
        "title": "Semestre Cero",
        "description": "Aquí encontrarás toda la información que necesitas sobre el programa, desde los plazos hasta los procesos de convalidación.",
        "intentGoal": "Realizar o convalidar los cursos de nivelación del programa Semestre Cero.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/30174262169357-Semestre-Cero",
        "link": "https://ava.duoc.cl",
        "actionLabel": "Ingresar a Semestre Cero en AVA",
        "instructions": "1. Ingresa al Ambiente Virtual de Aprendizaje (AVA) con tus credenciales.\n2. Completa los módulos diagnósticos y de nivelación dentro del plazo establecido.\n3. Revisa si cumples requisitos para convalidar asignaturas iniciales a través de tu resultado.",
        "paedisTip": "Si requieres tiempo adicional en las evaluaciones diagnósticas del Semestre Cero, infórmalo a tu coordinación PAEDIS.",
        "intentTags": [
          "semestre cero",
          "nivelacion",
          "convalidar semestre cero",
          "cursos iniciales"
        ],
        "articlesCount": 3,
        "articles": [
          {
            "id": 30141678699533,
            "title": "¿Qué es el Semestre Cero?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30141678699533--Qu%C3%A9-es-el-Semestre-Cero",
            "summary": "Semestre Cero es una oferta académica online y abierta que te ayudará a potenciar tus habilidades en áreas clave 📚. Este programa incluye una variedad de cursos diseñados para mejorar tus competencias en cuatro áreas transversales: Desarrollo de Capacidades y Competencias Globales 🌍 Cursos de Especialidad 🎓 Introducción a la Innovación y el Emprendimiento 🚀 Nivelación de Aprendizajes : Cursos de Lenguaje y Comuni...",
            "externalLinks": [
              "https://accesotodotp.duoc.cl/alumnos",
              "https://duoc.blackboard.com/"
            ]
          },
          {
            "id": 30208969193869,
            "title": "¿Cuánto tiempo tengo para completar los cursos?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30208969193869--Cu%C3%A1nto-tiempo-tengo-para-completar-los-cursos",
            "summary": "Una vez realizada tu inscripción en EMTP , tendrás un plazo de hasta 30 días para completar cada curso , dependiendo de tu fecha de inscripción ⏳.",
            "externalLinks": [
              "https://accesotodotp.duoc.cl/alumnos"
            ]
          },
          {
            "id": 30209100867341,
            "title": "¿Puedo convalidar las asignaturas de Semestre Cero?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30209100867341--Puedo-convalidar-las-asignaturas-de-Semestre-Cero",
            "summary": "Si completas los cursos de nivelación en Lenguaje, Matemática, Álgebra y/o Inglés Básico I y II, y apruebas la evaluación final con al menos un 70% en cada parte, podrás convalidar esas asignaturas de tu carrera. Además, recibirás un Certificado de Aprobación directamente en la plataforma 📜. La convalidación se realizará durante el primer mes de clases, lo que te ayudará a avanzar más ágilmente en tu programa de est...",
            "externalLinks": []
          }
        ]
      },
      {
        "id": "tne-primera-vez",
        "zendeskSectionId": 30209368710925,
        "title": "TNE - Primera Vez",
        "description": "Esta sección está pensada para los estudiantes que quieren sacar su pase escolar por primera vez. Aquí encontrarás todo lo que necesitas saber para obtenerlo fácilmente.",
        "intentGoal": "Obtener mi Pase Escolar (TNE) por primera vez y tomarme la fotografía.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/30209368710925-TNE-Primera-Vez",
        "link": "https://www.tne.cl/",
        "actionLabel": "Ir al Portal Oficial TNE Junaeb",
        "instructions": "1. Tómate la fotografía oficial en el capturador online de Junaeb o en los módulos presenciales de tu sede.\n2. Verifica que Duoc UC haya informado tu calidad de alumno regular de primer año.\n3. Haz seguimiento del estado de impresión y entrega de tu tarjeta.",
        "paedisTip": "Los módulos de captura fotográfica en sede cuentan con atención preferencial para estudiantes en situación de discapacidad.",
        "intentTags": [
          "tne primera vez",
          "sacar pase escolar",
          "foto tne",
          "junaeb tne nuevo"
        ],
        "articlesCount": 2,
        "articles": [
          {
            "id": 30209507090189,
            "title": "¿Qué es la TNE?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30209507090189--Qu%C3%A9-es-la-TNE",
            "summary": "La TNE (Tarjeta Nacional Estudiantil) es un documento personal e intransferible que te ofrece tarifas rebajadas en el transporte público de todo el país durante todo el año 🚍. Es muy útil para ahorrar en tus viajes diarios. Recuerda que cada vez que pases por primera vez a 5º básico, 1º medio o ingreses a la educación superior, necesitarás sacarte una nueva foto para confeccionar tu tarjeta 📸. Esta TNE te acompañar...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/requests/new/"
            ]
          },
          {
            "id": 30209661545997,
            "title": "¿Cómo es el proceso de solicitud de la TNE?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30209661545997--C%C3%B3mo-es-el-proceso-de-solicitud-de-la-TNE",
            "summary": "Puedes solicitarla en una oficina TNE o módulo habilitado . Si ingresaste por primera vez a la educación superior, tómate la foto con el capturador en línea usando tu celular o computador ( revisa el tutorial ). Accede al capturador online para la TNE 2025 a través del sitio web de Junaeb . Fechas importantes: Para la educación superior: desde el 2 de enero. Para rezagados de la educación básica, media y superior: du...",
            "externalLinks": [
              "https://www.junaeb.cl/oficinas-tne/",
              "https://mapdrive.equifax.com/#/widget/ba32c7f08f7684dd172ba24cbf6896d587c5ee5f25b64a4f305c5e706a907a3dd0beba62a29ab8c819e0f290967e5cb6236de37f63753c5fa5434d3c228510d6fad7c67f3328ec122608be4dee3d504a8a113e380673893c21181b0e48fd89b7e6965ba0213156ef1cf19a93273fa159a5f19f25820d35990e/cl/-70.65068000000122/-33.439411999999244/12.624671302635006",
              "https://youtu.be/EsPeLu0J1PY?si=Leu9sm0GbTMDUg7y",
              "https://capturadortne.cl/",
              "https://www.chileatiende.gob.cl/fichas/3430-cedula-de-identidad",
              "https://www.chileatiende.gob.cl/fichas/9380-certificado-de-nacimiento",
              "https://www.chileatiende.gob.cl/fichas/33265-certificado-de-alumno-regular",
              "https://www.junaeb.cl/contactanos/"
            ]
          }
        ]
      },
      {
        "id": "interrupcion-semestre-nuevos",
        "zendeskSectionId": 30224494352525,
        "title": "Interrupción del Semestre",
        "description": "Interrumpir el semestre o ejercer retracto/renuncia siendo estudiante de primer año.",
        "intentGoal": "Interrumpir el semestre o ejercer retracto/renuncia siendo estudiante de primer año.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/30224494352525-Interrupci%C3%B3n-del-Semestre",
        "link": "https://experienciavivo.duoc.cl/alumnos/solicitudes",
        "actionLabel": "Solicitar Retiro o Renuncia",
        "instructions": "1. Revisa los plazos legales de retracto o renuncia temprana en el calendario académico.\n2. Ingresa tu solicitud formal en Experiencia Vivo > Solicitudes o acude a Financiamiento en tu sede.",
        "paedisTip": "Antes de desertar por barreras académicas o de salud, conversa con el equipo PAEDIS o Bienestar para evaluar ajustes o suspensión temporal.",
        "intentTags": [
          "interrupcion semestre",
          "retracto",
          "renunciar primer año",
          "dejar la carrera nuevo"
        ],
        "articlesCount": 1,
        "articles": [
          {
            "id": 30226515469837,
            "title": "¿Qué es la renuncia y cómo puedo solicitarla?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30226515469837--Qu%C3%A9-es-la-renuncia-y-c%C3%B3mo-puedo-solicitarla",
            "summary": "La renuncia es la pérdida definitiva de la calidad de Alumno/a Regular o Provisional realizada de manera voluntaria por el estudiante a través de los canales formales establecidos por Duoc UC. Puedes solicitar la renuncia en cualquier momento del periodo académico. Aspectos importantes de la renuncia Anulación de la carga académica 📚: La carga académica inscrita en el periodo en el que estás renunciando será anulada...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/requests/new/"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "vida-academica",
    "zendeskCategoryId": 30142067755277,
    "title": "Estudiantes",
    "officialCategoryUrl": "https://centroayuda.duoc.cl/hc/es-419/categories/30142067755277-Estudiantes",
    "iconName": "BookOpen",
    "highlight": true,
    "badge": "18 Apartados • 54 Guías",
    "sectionsCount": 18,
    "articlesCount": 54,
    "shortIntent": "Toma de ramos, inasistencias (RI), notas, exámenes, TNE, prácticas, contrato de continuidad y congelar.",
    "description": "Recursos y orientación para cada paso de tu vida académica: una guía para organizar tus cursos, mantenerte al tanto de tus evaluaciones, y gestionar tu experiencia estudiantil de manera integral",
    "submodules": [
      {
        "id": "seguro-medico",
        "zendeskSectionId": 38480011211917,
        "title": "Seguro médico 🏥",
        "description": "Beneficio que asegura a alumnos regulares frente a cualquier accidente dentro o fuera de sede.",
        "intentGoal": "Activar el seguro médico estudiantil o descargar el Certificado de Cobertura ante un accidente.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/38480011211917-Seguro-m%C3%A9dico",
        "link": "https://centroayuda.duoc.cl/hc/es-419/articles/38480036969997-Certificado-de-Cobertura-de-Accidentes",
        "actionLabel": "Descargar Certificado y Cobertura de Accidentes",
        "instructions": "1. El seguro escolar protege a todos los alumnos regulares ante accidentes sufridos dentro de la sede, en actividades académicas o en el trayecto directo.\n2. Descarga el Certificado de Cobertura de Accidentes y preséntalo en el centro asistencial en convenio.",
        "paedisTip": "Guarda el Certificado de Cobertura en tu teléfono para acceso inmediato en caso de urgencia en sede o trayecto.",
        "intentTags": [
          "seguro medico",
          "accidente",
          "cobertura de accidentes",
          "seguro escolar",
          "urgencia medica"
        ],
        "articlesCount": 1,
        "articles": [
          {
            "id": 38480036969997,
            "title": "Certificado de Cobertura de Accidentes 🆘",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/38480036969997-Certificado-de-Cobertura-de-Accidentes",
            "summary": "¿Sabías que como estudiante regular de Duoc UC cuentas con un seguro de accidentes que te protege las 24 horas del día, dentro y fuera de la sede? Este beneficio institucional te entrega asistencia médica en caso de accidentes personales, cubriéndote los 365 días del año, sin importar si estás en clases, de camino o en otra actividad personal. ¿Para qué sirve el Certificado de Cobertura? 📄 El Certificado de Cobertur...",
            "externalLinks": [
              "https://certcobertura.contemporaseguros.com/"
            ]
          }
        ]
      },
      {
        "id": "programa-movilidad",
        "zendeskSectionId": 36572556072717,
        "title": "Programa de Movilidad Académica Saliente ✈️",
        "description": "Todo lo que necesitas saber sobre estudiar durante un semestre en el exterior 😎",
        "intentGoal": "Postular a un semestre de intercambio en el extranjero (PMAS) o a la Beca Santander.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/36572556072717-Programa-de-Movilidad-Acad%C3%A9mica-Saliente",
        "link": "https://www.duoc.cl/vida-estudiantil/intercambio-y-movilidad/",
        "actionLabel": "Explorar Movilidad e Intercambio",
        "instructions": "1. Revisa los requisitos del Programa de Movilidad Académica Saliente (PMAS): avance curricular, promedio mínimo y no tener sanciones.\n2. Consulta las convocatorias vigentes y la Beca Santander de Movilidad Internacional.",
        "paedisTip": "El área de Relaciones Internacionales asesora sobre las condiciones de accesibilidad de las instituciones extranjeras en convenio.",
        "intentTags": [
          "intercambio",
          "movilidad academica",
          "pmas",
          "beca santander",
          "estudiar en el extranjero"
        ],
        "articlesCount": 3,
        "articles": [
          {
            "id": 37306026855437,
            "title": "Beca Santander de Movilidad Internacional ✈️ 🗺️",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/37306026855437-Beca-Santander-de-Movilidad-Internacional",
            "summary": "La Oficina de Relaciones Internacionales de Duoc UC anuncia la apertura de la convocatoria para las Becas Santander de Movilidad Internacional , una valiosa oportunidad para que estudiantes de todas las escuelas y carreras realicen un semestre de intercambio académico en el extranjero el próximo año. Este programa de movilidad internacional busca fortalecer la formación académica y profesional de los y las estudiante...",
            "externalLinks": [
              "https://www.duoc.cl/internacionalizacion/",
              "https://app.santanderopenacademy.com/es/program/movilidad-internacional-pregrado-2025?utm_source=whatsapp&amp;utm_medium=social_share&amp;utm_campaign=share_button_preview",
              "https://www.duoc.cl/internacionalizacion-convenios/"
            ]
          },
          {
            "id": 36572716737421,
            "title": "Preguntas frecuentes: Programa de Movilidad Académica Saliente (PMAS)",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/36572716737421-Preguntas-frecuentes-Programa-de-Movilidad-Acad%C3%A9mica-Saliente-PMAS",
            "summary": "1. ¿Quiénes pueden postular al PMAS? Estudiantes de Duoc UC con buen rendimiento académico, sin deudas ni sanciones, y que cumplan con los requisitos específicos de su carrera y escuela. 2. ¿Puedo realizar mi intercambio en cualquier semestre o año de mi carrera? No. Para evitar retrasos en su proceso académico y de titulación, Duoc UC ha definido que los estudiantes sólo podrán realizar tu intercambio durante el últ...",
            "externalLinks": [
              "https://www.duoc.cl/internacionalizacion-movilidad-duocuc/#1716785910286-4441a18a-b27e",
              "https://forms.office.com/pages/responsepage.aspx?id=Wgv9cmqK_0yJ9r3pYffiUHPveiZdwrpJgrbNP8F4rHdUMUpTQUFGMlgxUUM1TDRHVFZHTUJKN0lCTC4u&amp;route=shorturl",
              "https://www.duoc.cl/internacionalizacion-convenios/"
            ]
          },
          {
            "id": 36572656502285,
            "title": "¿Qué es el Programa de Movilidad Académica Saliente (PMAS)?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/36572656502285--Qu%C3%A9-es-el-Programa-de-Movilidad-Acad%C3%A9mica-Saliente-PMAS",
            "summary": "El PMAS es un programa de internacionalización de Duoc UC que permite a los estudiantes realizar un semestre en una Institución de Educación Superior (IES) extranjera con la que haya un convenio bilateral. Su objetivo es fortalecer competencias globales, interculturales y mejorar la empleabilidad de los participantes. Requisitos Para postular, los estudiantes deben: Tener avance curricular al día. No tener deudas ni ...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/articles/36572716737421"
            ]
          }
        ]
      },
      {
        "id": "especializaciones-informatica",
        "zendeskSectionId": 36569484399117,
        "title": "Especializaciones: Escuela de Informática 👩🏻‍💻",
        "description": "Conoce todo lo que necesitas saber sobre las especializaciones de Ingeniería Informática",
        "intentGoal": "Elegir y postular a las salidas de especialización de Ingeniería en Informática.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/36569484399117-Especializaciones-Escuela-de-Inform%C3%A1tica",
        "link": "https://centroayuda.duoc.cl/hc/es-419/sections/36569484399117-Especializaciones-Escuela-de-Inform%C3%A1tica",
        "actionLabel": "Ver Oferta de Especializaciones Informática",
        "instructions": "1. Revisa el catálogo de Oferta de Especializaciones de la Escuela de Informática y Telecomunicaciones.\n2. Verifica los prerrequisitos aprobados en tu malla y postula dentro de las fechas del Proceso de Selección.",
        "paedisTip": "Como estudiante de Informática en Sede Alameda, puedes consultar con tu Director de Carrera qué ruta de especialización se adapta mejor a tu perfil profesional.",
        "intentTags": [
          "especializaciones informatica",
          "ingenieria informatica",
          "menciones informatica",
          "escuela de informatica"
        ],
        "articlesCount": 3,
        "articles": [
          {
            "id": 36570582060301,
            "title": "Oferta de Especializaciones",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/36570582060301-Oferta-de-Especializaciones",
            "summary": "Sobre las especializaciones La carrera Ingeniería en Informática, está diseñada para formar profesionales con una sólida preparación práctica, capacidad de adaptación a tecnologías emergentes y habilidades para contribuir efectivamente a la sociedad en un entorno digital en constante cambio. Además de competencias técnicas, se enfatiza el pensamiento crítico, la resolución de problemas y el trabajo en equipo. Esta ca...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/articles/36569577051661",
              "https://centroayuda.duoc.cl/hc/es-419/articles/36569900047885"
            ]
          },
          {
            "id": 36569900047885,
            "title": "Proceso de Selección de Especialización 2025 - Ingeniería Informática ⭐️",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/36569900047885-Proceso-de-Selecci%C3%B3n-de-Especializaci%C3%B3n-2025-Ingenier%C3%ADa-Inform%C3%A1tica",
            "summary": "¿Cómo saber si debo elegir una especialización? Debes elegir tu especialización si: Eres alumno regular de Ingeniería de Informática ( Currículum 1446115) Estás cursando tu segundo año de la carrera. Para la elección de la especialización, d ebes considerar que algunas asignaturas de inicio de la especialización cuentan con requisitos de aprobación de asignaturas previas. ¿Cuándo puedo elegir la especialización? El p...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/articles/36569577051661"
            ]
          },
          {
            "id": 36569577051661,
            "title": "Preguntas frecuentes - Especializaciones de Ingeniería Informática",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/36569577051661-Preguntas-frecuentes-Especializaciones-de-Ingenier%C3%ADa-Inform%C3%A1tica",
            "summary": "Contexto La Escuela de Informática y Telecomunicaciones de Duoc UC, a partir del año 2024 en la carrera de Ingeniería de Informática (Currículum 1446115) contempla un plan común de dos años y, durante su tercer y cuarto debe cursar alguna de las cinco especializaciones ofrecidas . Los y las estudiantes de esta carrera/currículum deben escoger, durante su segundo año, alguna de estas especializaciones. ¿Cuál es el tít...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/articles/36569900047885"
            ]
          }
        ]
      },
      {
        "id": "talleres-extracurriculares-continuidad",
        "zendeskSectionId": 35332260906125,
        "title": "Inscripción de Talleres Extracurriculares para alumnos de continuidad 🌳",
        "description": "Todo lo que necesitas saber sobre el nuevo proceso de inscripción de talleres extracurriculares 🏀",
        "intentGoal": "Inscribirme en talleres deportivos, artísticos o culturales como alumno antiguo (continuidad).",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/35332260906125-Inscripci%C3%B3n-de-Talleres-Extracurriculares-para-alumnos-de-continuidad",
        "link": "https://experienciavivo.duoc.cl/alumnos/actividades/posts",
        "actionLabel": "Inscribir Talleres en Vivo Duoc",
        "instructions": "1. Ingresa al portal Experiencia Vivo durante el periodo de inscripción de talleres para alumnos de continuidad.\n2. Selecciona el taller de tu interés verificando que no exista tope con tu horario académico.",
        "paedisTip": "Participar en talleres extracurriculares fortalece la inclusión y vida universitaria en tu sede.",
        "intentTags": [
          "talleres continuidad",
          "deportes",
          "talleres extracurriculares",
          "inscribir taller"
        ],
        "articlesCount": 1,
        "articles": [
          {
            "id": 35461158393357,
            "title": "Preguntas frecuentes: Inscripción de Talleres Extracurriculares ⛹🏻‍♀️",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/35461158393357-Preguntas-frecuentes-Inscripci%C3%B3n-de-Talleres-Extracurriculares",
            "summary": "¿Cuándo puedo inscribir Talleres Extracurriculares? 🗓️ Desde el 06 de abril a las 9:00 y hasta el 06 de julio podrás inscribir tus talleres extracurriculares en línea directamente desde el Portal de Inscripción de Asignaturas . ¿Cuáles son los requisitos para inscribir un Taller Extracurricular? 👩🏻‍⚖️ Ser alumno regular. Tener carga académica para el 1° semestre 2026 (es decir, tener asignaturas inscritas en el pe...",
            "externalLinks": [
              "https://portalinsc.duoc.cl/webdynpro/dispatcher/duoc.com.student/sicol/StudentSicol?inportal=xi#",
              "https://centroayuda.duoc.cl/hc/es-419/articles/35344976808589",
              "https://inscripciones.duoc.cl/talleres-extracurriculares/",
              "https://centroayuda.duoc.cl/hc/es-419/requests/new?ticket_form_id=30932214164365",
              "https://centroayuda.duoc.cl/hc/es-419/articles/35528298183949--C%C3%B3mo-crear-una-Solicitud-en-L%C3%ADnea-si-tengo-problemas-con-la-inscripci%C3%B3n-de-Talleres-Extracurriculares"
            ]
          }
        ]
      },
      {
        "id": "calendario-academico-2026",
        "zendeskSectionId": 33718683091469,
        "title": "Calendario académico y reglamentos 👩🏻‍⚖️",
        "description": "Encuentra toda la información sobre el calendario académico, reglamentos y normativas vigentes de Duoc UC. Conoce las fechas de períodos de evaluación, procesos académicos y documentos oficiales que rigen tu vida estudiantil.",
        "intentGoal": "Conocer las fechas de inicio de clases, feriados, semanas de exámenes y plazos reglamentarios 2026.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/33718683091469-Calendario-acad%C3%A9mico-y-reglamentos",
        "link": "https://centroayuda.duoc.cl/hc/es-419/articles/33719813119245-Calendario-acad%C3%A9mico-2026",
        "actionLabel": "Ver Calendario Académico 2026 Oficial",
        "instructions": "1. Revisa el Calendario Académico 2026 oficial de Duoc UC.\n2. Anota las fechas límite de inscripción de asignaturas, término de clases, temporada de exámenes y solicitudes académicas.",
        "paedisTip": "Planificar tus evaluaciones con el calendario oficial permite coordinar a tiempo el uso de salas silenciosas o tiempo extra con tus docentes.",
        "intentTags": [
          "calendario academico 2026",
          "fechas importantes",
          "cuando empiezan las clases",
          "vacaciones invierno",
          "reglamento academico"
        ],
        "articlesCount": 1,
        "articles": [
          {
            "id": 33719813119245,
            "title": "Calendario académico 2026",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/33719813119245-Calendario-acad%C3%A9mico-2026",
            "summary": "Próximas fechas importantes 📣 Matrículas ✍️ Período de Matrícula para Estudiantes de Continuidad: 1 de julio - 27 de julio 2026 ⭐️ Período Extraordinario de Matrícula para Estudiantes de Continuidad: 28 de julio - 31 de agosto 🚨 Atención: si estuviste matriculado con gratuidad durante el 2° semestre de 2025, y cumples con los requisitos para mantener el beneficio este 1° semestre, la renovación de matrícula es auto...",
            "externalLinks": [
              "https://inscripciones.duoc.cl/IA/",
              "https://www.duoc.cl/calendario-academico/"
            ]
          }
        ]
      },
      {
        "id": "inscripcion-asignaturas",
        "zendeskSectionId": 30498564570381,
        "title": "Inscripción de Asignaturas 📓",
        "description": "Aquí encontrarás toda la información que necesitas sobre cómo inscribir tus asignaturas de manera fácil y rápida.",
        "intentGoal": "Inscribir mis asignaturas (Toma de Ramos), revisar mi ventana horaria o resolver ramos pendientes.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/30498564570381-Inscripci%C3%B3n-de-Asignaturas",
        "link": "https://experienciavivo.duoc.cl/alumnos/horarios",
        "actionLabel": "Ir a Toma de Ramos en Vivo Duoc",
        "instructions": "1. Revisa tu fecha y tramo horario asignado para la Inscripción de Asignaturas.\n2. Practica previamente en el Simulador de Toma de Ramos de Nexo360.\n3. Ingresa a Experiencia Vivo y confirma tus secciones. Si te quedaron ramos sin inscribir, ingresa una solicitud académica en línea.",
        "paedisTip": "Los estudiantes adscritos a PAEDIS pueden gestionar apoyo en la toma de ramos cuando requieren horarios compatibles con terapias médicas o transporte accesible.",
        "intentTags": [
          "toma de ramos",
          "inscripcion de asignaturas",
          "inscribir ramos",
          "tope de horario",
          "ramos pendientes",
          "simulador"
        ],
        "articlesCount": 5,
        "articles": [
          {
            "id": 30499055520525,
            "title": "¿Cuándo es la inscripción de asignaturas?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30499055520525--Cu%C3%A1ndo-es-la-inscripci%C3%B3n-de-asignaturas",
            "summary": "¡Te invitamos a prepararte para el segundo semestre en Duoc UC! A partir del 21 de julio, podrás revisar la oferta de asignaturas disponible para tu sede, jornada y escuela. ¡Importante! El período de inscripción de asignaturas se realizará a partir del 29 de julio, pero las fechas exactas varían para cada sede. Para saber qué día te corresponde, es fundamental que revises el calendario publicado con el listado de se...",
            "externalLinks": [
              "https://inscripciones.duoc.cl/IA/#inicio"
            ]
          },
          {
            "id": 30499255339149,
            "title": "¿Cómo puedo inscribir mis asignaturas?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30499255339149--C%C3%B3mo-puedo-inscribir-mis-asignaturas",
            "summary": "Puedes inscribir tus asignaturas ingresando al siguiente enlace 🌐 y siguiendo los pasos que encontrarás a continuación: Ve a la sección \"Inscripción por sedes en línea\" y selecciona tu sede. 🏢 Haz clic en el botón \"Inscribir asignaturas\" . Ten en cuenta que los botones de inscripción se activarán en el horario asignado a tu escuela, sede y jornada. ⏰ Ingresa con tu usuario (sin el @duocuc.cl) y tu clave institucion...",
            "externalLinks": [
              "http://inscripciones.duoc.cl/IA/",
              "https://www.youtube.com/watch?v=-0GIpCwrCzg",
              "https://experienciavivo.duoc.cl"
            ]
          },
          {
            "id": 30500028878093,
            "title": "¿Qué hacer si me quedaron asignaturas pendientes por inscribir?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30500028878093--Qu%C3%A9-hacer-si-me-quedaron-asignaturas-pendientes-por-inscribir",
            "summary": "Si ya inscribiste algunas asignaturas pero otras quedaron pendientes Podrás acceder el día siguiente al Portal de Inscripción de Asignaturas en una ventana extraordinaria desde las 7:00 a 9:00 horas e intentar inscribir las asignaturas que quedaron pendientes. En el caso de que no queden vacantes disponibles o que el tope de horario se haya mantenido, podrás elevar una solicitud en línea como “Modificación de Carga A...",
            "externalLinks": [
              "https://experienciavivo.duoc.cl/alumnos/"
            ]
          },
          {
            "id": 30500558619021,
            "title": "¿Qué hacer si no puedo ingresar al Portal Experiencia Vivo Duoc?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30500558619021--Qu%C3%A9-hacer-si-no-puedo-ingresar-al-Portal-Experiencia-Vivo-Duoc",
            "summary": "Si estás teniendo dificultades para acceder a tu Portal Experiencia Vivo Duoc, tienes dos alternativas para solucionar el problema: • Puedes actualizar o cambiar tu clave en el siguiente enlace: Actualiza o recupera tu clave 🔑 • Llama a la Mesa de Servicio al teléfono (+56 4) 4220 1098 - (+56) 227 120 245 o envía un mensaje por WhatsApp al +56 93663 9565 📞 💬 Recuerda que debes utilizar el mismo usuario y clave de ...",
            "externalLinks": [
              "https://ssoprd.duoc.cl/auth/realms/WEB_APPS_PRD/login-actions/reset-credentials?"
            ]
          },
          {
            "id": 38053897518477,
            "title": "Preguntas Frecuentes: Inscripción de Asignaturas",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/38053897518477-Preguntas-Frecuentes-Inscripci%C3%B3n-de-Asignaturas",
            "summary": "Fechas del proceso 1. ¿Qué pasa si no ingreso en mi horario asignado? Podrás inscribir asignaturas en una ventana extraordinaria habilitada al día siguiente de tu horario oficial, entre las 07:00 y las 09:00 hrs. 2. ¿Cuándo puedo modificar o eliminar las asignaturas inscritas? Del 01 al 09 de agosto, la plataforma estará habilitada para: Modificar y/o eliminar asignaturas inscritas. Inscribir asignaturas por primera ...",
            "externalLinks": [
              "http://www.duoc.cl/alumnos",
              "https://www.duoc.cl/alumnos/servicios-digitales/cuentas-y-accesos/"
            ]
          }
        ]
      },
      {
        "id": "asistencias-inasistencias",
        "zendeskSectionId": 32252809336717,
        "title": "Asistencias e inasistencias 👩🏻‍🏫",
        "description": "Aquí encontrarás toda la información sobre los requisitos de asistencia, qué hacer si te ausentaste a alguna evaluación y los pasos a seguir si reprobaste por inasistencia.",
        "intentGoal": "Justificar una inasistencia a prueba/examen, revisar mi porcentaje (mínimo 70%) o apelar Reprobación por Inasistencia (RI).",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/32252809336717-Asistencias-e-inasistencias",
        "link": "https://experienciavivo.duoc.cl/alumnos/asistencias",
        "actionLabel": "Revisar Asistencia y Justificar en Vivo Duoc",
        "instructions": "1. El porcentaje mínimo de asistencia para aprobar en Duoc UC es de 70%.\n2. Si faltaste a una evaluación por motivos médicos o fuerza mayor, presenta tu justificativo en un plazo máximo de 5 días hábiles desde la evaluación.\n3. Si estás en riesgo de Reprobación por Inasistencia (RI) por salud o trabajo, o crees que tu RI es un error, ingresa una solicitud en Experiencia Vivo > Solicitudes adjuntando tus respaldos.",
        "paedisTip": "Si tienes una condición de salud crónica o discapacidad acreditada en PAEDIS que afecte tu asistencia, coordina oportunamente tus respaldos médicos con tu jefatura de carrera y PAEDIS.",
        "intentTags": [
          "falte a una prueba",
          "justificar inasistencia",
          "certificado medico",
          "licencia medica",
          "reprobe por inasistencia",
          "ri",
          "70% asistencia",
          "calculo asistencia"
        ],
        "articlesCount": 7,
        "articles": [
          {
            "id": 30503353480589,
            "title": "¿Cómo se realiza el cálculo de asistencia?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30503353480589--C%C3%B3mo-se-realiza-el-c%C3%A1lculo-de-asistencia",
            "summary": "Tu asistencia se calcula desde la primera sesión de clases de cada asignatura , independiente de cuándo te hayas inscrito en ella. Debes considerar que: Se exige un mínimo de 70% de asistencia en actividades teóricas Se exige un mínimo de 70% en actividades prácticas No se incluyen en este cálculo: Prácticas Laborales Prácticas Profesionales Clínicas e Internados 👉 Si no cumples con este requisito, puedes reprobar p...",
            "externalLinks": []
          },
          {
            "id": 30504203276173,
            "title": "¿Qué pasa si no alcanzo el porcentaje mínimo de asistencia?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30504203276173--Qu%C3%A9-pasa-si-no-alcanzo-el-porcentaje-m%C3%ADnimo-de-asistencia",
            "summary": "Si no cumples con el 70% de asistencia requerido: Reprobarás la asignatura por Reprobación por Inasistencia (RI) Esto ocurre independiente de tus calificaciones 👉 En caso de RI, no podrás rendir el Examen Transversal de la asignatura. 👉 Encuentra más información revisando el Reglamento Académico de Duoc UC.",
            "externalLinks": [
              "https://www.duoc.cl/reglamento-academico/"
            ]
          },
          {
            "id": 30503605299213,
            "title": "¿Cómo puedo justificar inasistencias a evaluaciones?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30503605299213--C%C3%B3mo-puedo-justificar-inasistencias-a-evaluaciones",
            "summary": "Debes realizar una solicitud en línea a través de Vivo Duoc : Ruta: Portal → Solicitudes → Académico → Justificación de inasistencia a evaluaciones Requisitos: Adjuntar respaldo (certificado médico o laboral) Indicar en el comentario de la solicitud las evaluaciones afectadas Plazo: Máximo 3 días hábiles desde el término del período de inasistencia 👉 Si no realizas la solicitud dentro del plazo, se te calificaré con...",
            "externalLinks": [
              "http://experienciavivo.duoc.cl/alumnos"
            ]
          },
          {
            "id": 30503808459149,
            "title": "¿Qué razones son válidas para justificar inasistencias a evaluaciones?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30503808459149--Qu%C3%A9-razones-son-v%C3%A1lidas-para-justificar-inasistencias-a-evaluaciones",
            "summary": "Puedes justificar tu inasistencia en los siguientes casos: Salud: Debes presentar un certificado médico que acredite tu condición y el período en que estuviste impedido de asistir. Laboral: Si tu ausencia se debe a una situación laboral extraordinaria, debes presentar un certificado emitido por el área de Personas o Recursos Humanos de tu empleador, que detalle la causa y el período afectado. Deporte: Si formas parte...",
            "externalLinks": []
          },
          {
            "id": 30535023293837,
            "title": "¿Cómo puedo saber si Reprobé por Inasistencia (RI)?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30535023293837--C%C3%B3mo-puedo-saber-si-Reprob%C3%A9-por-Inasistencia-RI",
            "summary": "Si repruebas por inasistencia: Podrás verificar tu estado al cierre del semestre en Vivo Duoc, sección Asistencia. Recibirás una notificación en tu correo institucional 👉 Recuerda: si estás en estado RI, no podrás rendir o presentar el Examen Transversal.",
            "externalLinks": []
          },
          {
            "id": 30535267721869,
            "title": "¿Qué hago si creo que mi Reprobación por Inasistencia (RI) es incorrecto?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30535267721869--Qu%C3%A9-hago-si-creo-que-mi-Reprobaci%C3%B3n-por-Inasistencia-RI-es-incorrecto",
            "summary": "Si consideras que existe un error: Revisa tu registro de asistencia Contacta a: Tu docente, o Tu coordinador/a de carrera 👉 Ellos revisarán tu caso según el reglamento académico.",
            "externalLinks": []
          },
          {
            "id": 45628967424525,
            "title": "¿Qué puedo hacer si una situación de salud o laboral afecta mi asistencia y me pone en riesgo de Reprobación por Inasistencia (RI)?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/45628967424525--Qu%C3%A9-puedo-hacer-si-una-situaci%C3%B3n-de-salud-o-laboral-afecta-mi-asistencia-y-me-pone-en-riesgo-de-Reprobaci%C3%B3n-por-Inasistencia-RI",
            "summary": "Si enfrentas una situación grave, prolongada y debidamente respaldada que afecta tu asistencia, puedes solicitar una: 👉 “Revisión de asistencia y posible estado RI” 👤 ¿Quiénes pueden solicitarla? Estudiantes con situaciones: De salud física o mental, o Laborales que sean sostenidas en el tiempo y acreditables con documentación formal . 📅 ¿Cuándo puedo enviar la solicitud? Entre las semanas 6 y 16 del semestre . 💻...",
            "externalLinks": []
          }
        ]
      },
      {
        "id": "creditos-becas",
        "zendeskSectionId": 32253954109837,
        "title": "Créditos y Becas",
        "description": "Aquí encontrarás toda la información que necesitas para solicitar ayudas financieras, desde la gratuidad hasta el CAE. Te explicamos los requisitos y el proceso de manera clara y sencilla, para que puedas aprovechar las opciones disponibles.",
        "intentGoal": "Postular o mantener la Gratuidad, Crédito CAE y becas de financiamiento.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/32253954109837-Cr%C3%A9ditos-y-Becas",
        "link": "https://experienciavivo.duoc.cl/alumnos/finanzas",
        "actionLabel": "Revisar Beneficios en Vivo Duoc",
        "instructions": "1. Postula al FUAS dentro de los plazos oficiales del Mineduc para acceder a Gratuidad, becas estatales o CAE.\n2. Revisa el estado de asignación de tu beneficio en los portales oficiales (Resultados Beneficios Estudiantiles / Ingresa.cl) y en Finanzas de Vivo Duoc.",
        "paedisTip": "Recuerda que Mineduc dispone de cupos especiales de Becas de Discapacidad; consulta en Financiamiento de tu sede cómo complementarlas.",
        "intentTags": [
          "gratuidad",
          "cae",
          "credito con aval del estado",
          "becas",
          "fuas",
          "financiamiento"
        ],
        "articlesCount": 2,
        "articles": [
          {
            "id": 30564834218381,
            "title": "¿Cómo postular a la Gratuidad?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30564834218381--C%C3%B3mo-postular-a-la-Gratuidad",
            "summary": "Si quieres acceder a los beneficios de Gratuidad en Duoc UC , debes postular a las ayudas estudiantiles a través del FUAS (Formulario Único de Acreditación Socioeconómica) 🏫. ¡Recuerda que para postular debes estar matriculado! Durante el mes de diciembre , podrás encontrar en el sitio oficial del Ministerio de Educación los resultados del nivel socioeconómico de tu postulación. Ahí se indicará si eres uno de los af...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/requests/new/"
            ]
          },
          {
            "id": 30565508314509,
            "title": "¿Qué es el CAE y cómo puedo solicitarlo?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30565508314509--Qu%C3%A9-es-el-CAE-y-c%C3%B3mo-puedo-solicitarlo",
            "summary": "Es un beneficio del Estado diseñado para ayudar a estudiantes con buen rendimiento académico que necesitan apoyo financiero para comenzar o continuar su carrera de pregrado en una institución acreditada. ¿El crédito se otorga solo por un año o por toda la carrera? 💵 El CAE cubre todas las asignaturas que necesites según la malla curricular de tu carrera. Así que, si obtienes el financiamiento, no necesitarás postula...",
            "externalLinks": [
              "http://www.ingresa.cl",
              "https://portal.ingresa.cl/como-renovar/situaciones-especiales/cambio-de-carrera-y-o-institucion/",
              "https://centroayuda.duoc.cl/hc/es-419/requests/new/"
            ]
          }
        ]
      },
      {
        "id": "notas-examenes",
        "zendeskSectionId": 32253086608525,
        "title": "Notas y Exámenes ✅",
        "description": "Aquí encontrarás toda la información sobre tus calificaciones y exámenes, desde cómo dejar una asignatura con Nota Pendiente hasta cómo solicitar nuevas fechas para rendir exámenes.",
        "intentGoal": "Consultar mis calificaciones, fechas de exámenes finales, recalendarizar un examen o pedir Nota Pendiente.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/32253086608525-Notas-y-Ex%C3%A1menes",
        "link": "https://experienciavivo.duoc.cl/alumnos/notas",
        "actionLabel": "Ver Mis Notas en Vivo Duoc",
        "instructions": "1. Revisa tus notas parciales y promedio de presentación en Experiencia Vivo > Notas.\n2. Los docentes cuentan con el plazo reglamentario para publicar tus calificaciones en el sistema.\n3. Si por razones médicas graves no puedes terminar el semestre o rendir un examen en su fecha, solicita \"Nota Pendiente\" o una nueva fecha de examen con respaldo documentado.",
        "paedisTip": "En cada evaluación parcial y examen transversal tienes derecho a que se apliquen tus Ajustes Razonables PAEDIS (ej. tiempo adicional, lector de pantalla o adecuación de formato).",
        "intentTags": [
          "notas",
          "examenes",
          "nota pendiente",
          "cambiar fecha examen",
          "cuando suben las notas",
          "calificaciones"
        ],
        "articlesCount": 5,
        "articles": [
          {
            "id": 30535739956749,
            "title": "¿Qué es una Nota Pendiente?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30535739956749--Qu%C3%A9-es-una-Nota-Pendiente",
            "summary": "Según el Artículo N°48 del Reglamento Académico, la Nota Pendiente es la postergación de la calificación final de una o incluso de todas las asignaturas que hayas inscrito, esta debe hacerse con motivos justificados y deben estar debidamente acreditados. 📄 Esta solicitud debe ser aprobada por la Dirección de Carrera respectiva y debe ser validada por escrito por la Subdirección Académica ✅. Mientras un/a estudiante ...",
            "externalLinks": []
          },
          {
            "id": 30536145938573,
            "title": "¿Cómo puedo solicitar dejar una asignatura con Nota Pendiente?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30536145938573--C%C3%B3mo-puedo-solicitar-dejar-una-asignatura-con-Nota-Pendiente",
            "summary": "Puedes realizar la solicitud mediante tu Portal de alumnos Vivo Duoc, debes acceder a la categoría ''Académico'' y seleccionar el servicio ''Nota Pendiente''. Esta solicitud debes realizarla dentro de los plazos establecidos en el Calendario Académico. Deberás adjuntar la documentación que acredite tu situación que impide que puedas dar la asignatura durante este semestre y deberás esperar la resolución de tu Directo...",
            "externalLinks": []
          },
          {
            "id": 30559867922317,
            "title": "¿Cuándo es el período de exámenes?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30559867922317--Cu%C3%A1ndo-es-el-per%C3%ADodo-de-ex%C3%A1menes",
            "summary": "Para conocer todos los detalles, te invitamos a revisar el Calendario Académico . Allí encontrarás las fechas importantes , como el inicio y el fin de los exámenes, así como otros eventos relevantes del semestre. Si requieres apoyo o aún tienes dudas, puedes acercarte al Centro Académico de tu sede 🏫",
            "externalLinks": [
              "https://www.duoc.cl/calendario-academico/"
            ]
          },
          {
            "id": 30560018504333,
            "title": "¿Puedo solicitar una nueva fecha para dar el examen?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30560018504333--Puedo-solicitar-una-nueva-fecha-para-dar-el-examen",
            "summary": "Si necesitas cambiar la fecha de tu examen, podrás solicitar una nueva fecha a tu docente y él determinará si es posible la reprogramación. Recuerda que comunicarte con tiempo puede facilitar este proceso 📚",
            "externalLinks": []
          },
          {
            "id": 30560132677901,
            "title": "¿Cuánto tiempo tengo para saber mis notas?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30560132677901--Cu%C3%A1nto-tiempo-tengo-para-saber-mis-notas",
            "summary": "Según el Artículo N°28 del Reglamento, los alumnos tienen derecho a conocer sus notas y las correcciones de cada evaluación dentro de un plazo máximo de ocho días hábiles desde la fecha en que se rindió la evaluación. 🗓️ Recuerda que podrás acceder a toda esta información desde el Portal Experiencia Vivo Alumnos. Es una forma fácil y rápida de mantenerte actualizado sobre tu desempeño.",
            "externalLinks": [
              "https://experienciavivo.duoc.cl/"
            ]
          }
        ]
      },
      {
        "id": "revalidacion-reposicion-tne",
        "zendeskSectionId": 32253988346765,
        "title": "TNE",
        "description": "Aquí encontrarás toda la información que necesitas sobre el pase escolar, ya sea para recuperarlo o revalidarlo. Te explicamos los pasos de manera clara y sencilla para que puedas hacerlo sin problemas.",
        "intentGoal": "Revalidar mi pase escolar TNE con sello/tótem o sacar reposición si perdí o me robaron la TNE.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/32253988346765-TNE",
        "link": "https://www.tne.cl/",
        "actionLabel": "Gestionar TNE en Portal Junaeb",
        "instructions": "1. Para revalidar tu TNE en Región Metropolitana, inserta tu tarjeta en un Tótem Bip! hasta que indique \"Pase Extendido\".\n2. Si perdiste, se dañó o te robaron tu TNE, realiza el trámite de Reposición en las oficinas TNE o portal web de Junaeb presentando constancia, cédula y certificado de alumno regular.",
        "paedisTip": "Puedes descargar tu Certificado de Alumno Regular gratis y al instante desde Experiencia Vivo > Certificados para tramitar la reposición de tu TNE.",
        "intentTags": [
          "perdi mi tne",
          "revalidar tne",
          "robo tne",
          "reposicion tne",
          "pase escolar",
          "totem bip"
        ],
        "articlesCount": 2,
        "articles": [
          {
            "id": 32254519997453,
            "title": "¿Qué hacer si perdí mi TNE?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/32254519997453--Qu%C3%A9-hacer-si-perd%C3%AD-mi-TNE",
            "summary": "Si has perdido tu TNE , te la han robado o está en mal estado , puedes seguir estos pasos: Acércate a una sucursal de TNE para realizar el trámite, ten en cuenta que tiene un costo de $3.600 . En la sucursal te indicarán la cuenta para que hagas el pago. Descarga tu certificado de alumno regular en tu plataforma Vivo Duoc. Deja constancia de la pérdida o robo en Carabineros de Chile o en la Comisaría Virtual. Es impo...",
            "externalLinks": [
              "https://www.tne.cl/",
              "https://centroayuda.duoc.cl/hc/es-419/requests/new/"
            ]
          },
          {
            "id": 32254548506765,
            "title": "¿Cómo revalidar mi TNE?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/32254548506765--C%C3%B3mo-revalidar-mi-TNE",
            "summary": "Para revalidar tu TNE, solo necesitas acercarte a Punto Estudiantil y solicitar un ticket de pago por $1.100 pesos, que es el costo de la revalidación. Después, paga en Caja Sede. Ten en cuenta que en sede no podrás hacer el pago en efectivo. Si prefieres hacerlo de manera presencial y en efectivo, puedes visitar un Servipag e indicar el nombre de la institución y tu rut. Una vez que tengas tu comprobante de pago , e...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/requests/new/"
            ]
          }
        ]
      },
      {
        "id": "tav-verano",
        "zendeskSectionId": 30561863525773,
        "title": "TAV (Temporada Académica de Verano) ⛱",
        "description": "Aquí encontrarás toda la información que necesitas sobre la Temporada Académica de Verano, desde cómo inscribirte hasta los detalles sobre los pagos.",
        "intentGoal": "Adelantar o recuperar ramos en la Temporada Académica de Verano (TAV) y saber si tiene costo.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/30561863525773-TAV-Temporada-Acad%C3%A9mica-de-Verano",
        "link": "https://experienciavivo.duoc.cl/alumnos/horarios",
        "actionLabel": "Consultar TAV en Vivo Duoc",
        "instructions": "1. Revisa la oferta de asignaturas y fechas de inscripción para la Temporada Académica de Verano (TAV) en enero/febrero.\n2. Verifica en las condiciones financieras si tu beneficio cubre el TAV o los aranceles por asignatura.",
        "paedisTip": "Considera que el TAV es intensivo (concentra el semestre en pocas semanas); evalúa la carga horaria junto a tu tutor/a PAEDIS antes de inscribirlo.",
        "intentTags": [
          "tav",
          "temporada academica de verano",
          "ramos en verano",
          "adelantar ramos",
          "recuperar ramo verano"
        ],
        "articlesCount": 4,
        "articles": [
          {
            "id": 30562090473613,
            "title": "¿Qué es la Temporada Académica de Verano?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30562090473613--Qu%C3%A9-es-la-Temporada-Acad%C3%A9mica-de-Verano",
            "summary": "La Temporada Académica de Verano (TAV) es un programa intensivo y gratuito que brinda a los estudiantes la oportunidad de recuperar o adelantar asignaturas de manera presencial durante el mes de enero . 🌞 TAV ofrece los mismos contenidos y la misma cantidad de horas que las asignaturas en un semestre normal, pero de una manera más concentrada , abarcando un periodo de 4 a 5 semanas, dependiendo del curso. ⏳ Esto per...",
            "externalLinks": []
          },
          {
            "id": 30562254077837,
            "title": "¿Quiénes pueden participar en el TAV?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30562254077837--Qui%C3%A9nes-pueden-participar-en-el-TAV",
            "summary": "Todos los alumnos regulares de Duoc UC matriculados en el segundo semestre que cumplan con los requisitos de avance curricular establecidos en el reglamento académico y deseen recuperar o adelantar asignaturas, podrán participar en la Temporada Académica de Verano 🌞📚. Los alumnos que no sean regulares, también tienen la posibilidad de reincorporarse durante este período académico a través de Admisión Especial . Así...",
            "externalLinks": []
          },
          {
            "id": 30562575366925,
            "title": "¿Debo pagar para participar en el TAV?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30562575366925--Debo-pagar-para-participar-en-el-TAV",
            "summary": "La Temporada Académica de Verano (TAV) es un programa completamente gratuito para todos los alumnos de Duoc UC 😁. Si ya no cuentas con el beneficio de gratuidad y no estás matriculado como alumno regular de Duoc UC, no te preocupes. Puedes reincorporarte durante la Temporada Académica de Verano, pero necesitarás pagar la matrícula del primer semestre del año. Una vez que hayas hecho esto, podrás ingresar una solicit...",
            "externalLinks": [
              "https://experienciavivo.duoc.cl/",
              "https://www.duoc.cl/reintegros/"
            ]
          },
          {
            "id": 30562710185869,
            "title": "¿Cuándo puedo inscribirme a la Temporada Académica de Verano?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30562710185869--Cu%C3%A1ndo-puedo-inscribirme-a-la-Temporada-Acad%C3%A9mica-de-Verano",
            "summary": "Podrás encontrar las fechas de inscripción de asignaturas para la Temporada Académica de Verano (TAV) en el siguiente enlace . Recuerda que podrás hacer la inscripción mediante una solicitud en línea en el Portal Experiencia Vivo Duoc 💻.",
            "externalLinks": [
              "https://inscripciones.duoc.cl/TAV",
              "https://experienciavivo.duoc.cl"
            ]
          }
        ]
      },
      {
        "id": "practicas-profesionales",
        "zendeskSectionId": 30560219943181,
        "title": "Prácticas 🧑🏻‍🔬",
        "description": "Aquí encontrarás toda la información sobre la última etapa de tu vida académica, incluyendo los procesos para la realización de exámenes o cómo hacer solicitudes de convalidación.",
        "intentGoal": "Conocer las horas de práctica, validar mi empresa/centro de práctica, convalidar trabajo o descargar el seguro.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/30560219943181-Pr%C3%A1cticas",
        "link": "https://experienciavivo.duoc.cl/alumnos/progreso-academico",
        "actionLabel": "Gestionar Práctica en Vivo Duoc",
        "instructions": "1. Revisa en tu malla cuántas horas exige tu Práctica Laboral o Profesional.\n2. Inscribe y valida los datos de tu Centro de Práctica antes de comenzar.\n3. Descarga el Certificado de Seguro de Accidentes para entregarlo a la empresa, o solicita Convalidación de Práctica si ya trabajas en el área.",
        "paedisTip": "El Programa de Acompañamiento Laboral y PAEDIS asesoran en prácticas inclusivas y ajustes en el puesto de trabajo (Ley de Inclusión Laboral N° 21.015).",
        "intentTags": [
          "practica profesional",
          "practica laboral",
          "horas de practica",
          "validar centro de practica",
          "seguro practica",
          "convalidar practica"
        ],
        "articlesCount": 5,
        "articles": [
          {
            "id": 30560828266509,
            "title": "¿Cuántas horas de práctica debo realizar?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30560828266509--Cu%C3%A1ntas-horas-de-pr%C3%A1ctica-debo-realizar",
            "summary": "En Duoc UC existen dos tipos de Asignatura de Práctica: Práctica Laboral💡 Está diseñada para que puedas adquirir experiencia inicial en el mundo laboral, lo que te permitirá reflexionar sobre tu desempeño en el centro de práctica. Normalmente, se realiza alrededor del 4° semestre de las carreras profesionales y tiene una duración de 180 horas ⏰. Práctica Profesional 💼 Busca ofrecerte experiencias más avanzadas que ...",
            "externalLinks": [
              "https://www.duoc.cl/alumnos/proceso-practicas/realizacion/"
            ]
          },
          {
            "id": 30560550053517,
            "title": "¿Cómo puedo validar mi Centro de Práctica?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30560550053517--C%C3%B3mo-puedo-validar-mi-Centro-de-Pr%C3%A1ctica",
            "summary": "Debes ingresar a la plataforma de Prácticas Duoc y tendrás que descargar el formulario de validación . En el formulario tendrás que completar información sobre la empresa en la que realizarás tu práctica, luego de completarlo deberás asegurarte de que tu Centro de Práctica lo firme y timbre ✍🏻 . Te recomendamos que ingreses correctamente el correo de la empresa y que mantengas tus datos de contacto actualizados ya q...",
            "externalLinks": [
              "https://www2.duoc.cl/practica/login"
            ]
          },
          {
            "id": 30561303734797,
            "title": "¿Puedo realizar la Práctica si está como Nota Pendiente?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30561303734797--Puedo-realizar-la-Pr%C3%A1ctica-si-est%C3%A1-como-Nota-Pendiente",
            "summary": "Si dejaste tu práctica con nota pendiente (nota P) para el próximo semestre, ¡no te preocupes! 😊 No necesitas volver a inscribirla . Solo recuerda que es importante regularizar tu práctica antes de que termine el próximo semestre. ⏰📅 Si cuentas con beneficios BAES , te recomendamos que hables con el equipo de Financiamiento. 💰 Ellos podrán asesorarte sobre cómo la nota pendiente podría afectar tu beneficio. Si tie...",
            "externalLinks": []
          },
          {
            "id": 30561140196109,
            "title": "¿Cómo puedo Convalidar mi Práctica Laboral?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30561140196109--C%C3%B3mo-puedo-Convalidar-mi-Pr%C3%A1ctica-Laboral",
            "summary": "Para realizar la convalidación de tu Práctica Laboral, solo necesitas ingresar al Portal Experiencia Vivo Duoc y dirigirte a la sección de Solicitud . Haz clic en “ Nuevo ” y completa los campos requeridos 💻. Matrícula: Corresponde a la carrera que estás cursando. Categoría: ''Académico'' Servicio: ''Convalidación de asignaturas'' Sub-Servicio: Debes elegir ''Práctica Laboral'' o ''Práctica Profesional'', según corr...",
            "externalLinks": [
              "https://www.duoc.cl/alumnos/proceso-practicas/convalidar-practica/"
            ]
          },
          {
            "id": 30561028818445,
            "title": "¿Cómo consigo el Seguro de Accidentes a la empresa?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30561028818445--C%C3%B3mo-consigo-el-Seguro-de-Accidentes-a-la-empresa",
            "summary": "Luego de que tu Centro de Práctica haya sido validado ☑️ , se enviará de manera automática la ''Carta de Validación'' y la información sobre los seguros correspondientes al correo electrónico 📧 que hayas registrado en la Plataforma de Prácticas , también se le enviará una copia a tu Centro de Práctica y a tu docente Guía Asignado. Tanto el Seguro de DuocUC como el Seguro Escolar de Accidentes 🛡️ , según lo estipula...",
            "externalLinks": [
              "https://www.duoc.cl/seguro"
            ]
          }
        ]
      },
      {
        "id": "fondos-concursables-2026",
        "zendeskSectionId": 45786656132877,
        "title": "Fondos Concursables para proyectos estudiantiles 2026 💡💪",
        "description": "Conoce más sobre los Fondos Concursables, descubre cómo postular y participa para obtener financiamiento para tus proyectos",
        "intentGoal": "Obtener financiamiento de Duoc UC para liderar un proyecto estudiantil en 2026.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/45786656132877-Fondos-Concursables-para-proyectos-estudiantiles-2026",
        "link": "https://experienciavivo.duoc.cl/alumnos/actividades/posts",
        "actionLabel": "Postular a Fondos Concursables 2026",
        "instructions": "1. Revisa las bases de los Fondos Concursables para Proyectos Estudiantiles 2026.\n2. Formula tu iniciativa estudiantil (inclusión, sustentabilidad, tecnología, cultura o comunidad) y postula en los plazos oficiales.",
        "paedisTip": "¡Los proyectos enfocados en inclusión, accesibilidad y comunidad estudiantil tienen un alto impacto en los Fondos Concursables!",
        "intentTags": [
          "fondos concursables 2026",
          "proyectos estudiantiles",
          "financiamiento proyectos"
        ],
        "articlesCount": 2,
        "articles": [
          {
            "id": 45786806466573,
            "title": "¿Qué son los Fondos Concursables para Proyectos Estudiantiles?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/45786806466573--Qu%C3%A9-son-los-Fondos-Concursables-para-Proyectos-Estudiantiles",
            "summary": "Los Fondos Concursables son aportes en dinero que entrega Duoc UC a grupos de estudiantes que presenten Proyectos Estudiantiles. Son una herramienta de apoyo directo para el desarrollo y ejecución de proyectos desarrollados por los estudiantes en la Institución. Esta guía explica cómo postular a los Fondos Concursables 2026 para Proyectos Estudiantiles Duoc UC: requisitos, plazos y documentación. ¿Qué requisitos debo...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/articles/45786980309005--C%C3%B3mo-postular-a-los-Fondos-concursables-2026"
            ]
          },
          {
            "id": 45786980309005,
            "title": "¿Cómo postular a los Fondos concursables 2026?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/45786980309005--C%C3%B3mo-postular-a-los-Fondos-concursables-2026",
            "summary": "En este artículo te explicamos paso a paso cómo postular a los Fondos Concursables 2026 de Duoc UC, desde leer las bases, formar equipo, elegir la dimensión del proyecto, completar formularios, armar cronogramas y presupuestos, hasta revisar la viabilidad y enviar tu postulación mediante el Centro de Ayuda. Paso a paso: 0) Leer las bases 🤓 Lo primero es lo primero. Para que tu proyecto pueda concursar, debe seguir l...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/requests/new?ticket_form_id=45775075616909"
            ]
          }
        ]
      },
      {
        "id": "continuidad-estudios-contrato",
        "zendeskSectionId": 32253440361485,
        "title": "Continuidad de estudios 🛣",
        "description": "Si estás en tercer semestre o más, esta información es clave para seguir adelante con tus estudios y renovar tu contrato.",
        "intentGoal": "Firmar mi Contrato de Continuidad anual (alumnos de 3° semestre en adelante) y verificar su estado.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/32253440361485-Continuidad-de-estudios",
        "link": "https://experienciavivo.duoc.cl/alumnos/finanzas",
        "actionLabel": "Firmar Contrato de Continuidad",
        "instructions": "1. Si pasas a 3° semestre o superior, es obligatorio firmar tu Contrato de Prestación de Servicios Educacionales (Contrato de Continuidad) para poder inscribir asignaturas.\n2. Ingresa al portal de matrícula/finanzas, firma electrónicamente y verifica que quede en estado confirmado.",
        "paedisTip": "Sin el Contrato de Continuidad firmado el sistema bloquea la Toma de Ramos, incluso si cuentas con Gratuidad. ¡Fírmalo con anticipación!",
        "intentTags": [
          "contrato de continuidad",
          "firmar contrato",
          "renovacion matricula",
          "tercer semestre",
          "no puedo tomar ramos contrato"
        ],
        "articlesCount": 4,
        "articles": [
          {
            "id": 30497397424141,
            "title": "¿Dónde puedo firmar mi Contrato de Continuidad?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30497397424141--D%C3%B3nde-puedo-firmar-mi-Contrato-de-Continuidad",
            "summary": "Puedes hacerlo de manera fácil y rápida desde tu portal Experiencia Vivo Duoc 🖊️ También puedes ingresar al portal dec5 con tu clave única. Una vez dentro, dirígete a la sección de documentos pendientes y podrás firmar tu contrato de Duoc UC sin problemas. 📄👍 Recuerda que debes firmar tu contrato una vez al año . Este documento es un respaldo para ti y nosotros sobre el cumplimiento de la educación y servicios que...",
            "externalLinks": [
              "https://firmadecontrato.duoc.cl/",
              "https://5.dec.cl/"
            ]
          },
          {
            "id": 30497615264909,
            "title": "¿Por qué es importante firmar el Contrato de Continuidad?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30497615264909--Por-qu%C3%A9-es-importante-firmar-el-Contrato-de-Continuidad",
            "summary": "Firmar el contrato de continuidad es un paso importante que beneficia tanto a ti como a nosotros. Este documento actúa como un respaldo , garantizando que ambos estemos en la misma sintonía sobre la educación y los servicios que ofrecemos como Institución de Educación Superior. 🎓✨ Al firmar, estás asegurando que tendrás acceso a todo lo que necesitas para avanzar en tu formación y aprovechar al máximo tu experiencia...",
            "externalLinks": []
          },
          {
            "id": 30497967554189,
            "title": "¿Cómo saber si mi Contrato de Continuidad está firmado?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30497967554189--C%C3%B3mo-saber-si-mi-Contrato-de-Continuidad-est%C3%A1-firmado",
            "summary": "Si quieres asegurarte de que tu contrato de prestación de servicios de Duoc esté al día, solo debes ingresar al portal 5dec utilizando tus credenciales de acceso. Una vez dentro, dirígete a la sección de documentos firmados . Ahí podrás revisar si tu contrato está firmado con la fecha de este año.📄 También puedes contactarte con la Mesa de Servicios y ellos pueden ayudarte a validar el estado de tu Contrato de Conti...",
            "externalLinks": [
              "https://5.dec.cl/"
            ]
          },
          {
            "id": 30498494223373,
            "title": "¿Qué hacer si tengo problemas para firmar mi Contrato de Continuidad?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30498494223373--Qu%C3%A9-hacer-si-tengo-problemas-para-firmar-mi-Contrato-de-Continuidad",
            "summary": "Si estás teniendo inconvenientes para firmar tu Contrato de Continuidad, revisa las posibles condicionantes que pueden generar errores a la hora de firmar tu contrato ✍🏻 1. Estudiante Chileno con Cédula de Identidad Vencida Si tu carnet está vencido, tendrás que renovar tu carnet de identidad y luego deberás firmar tu contrato de manera online a través del Portal Experiencia Vivo Duoc o a través del siguiente link ,...",
            "externalLinks": [
              "https://experienciavivo.duoc.cl/alumnos",
              "https://firmadecontrato.duoc.cl/home/seleccion_de_proceso"
            ]
          }
        ]
      },
      {
        "id": "cambio-carrera-sede-estudiantes",
        "zendeskSectionId": 30307549420045,
        "title": "Cambio de Carrera o Sede 🔁",
        "description": "Aquí encontrarás toda la información que necesitas para solicitar un cambio de carrera o sede. Te explicamos los requisitos, los pasos a seguir y todo lo que debes saber para hacer el proceso de manera sencilla y sin complicaciones.",
        "intentGoal": "Resolver dudas sobre toma de ramos y pago de matrícula mientras espero respuesta de Cambio de Carrera o Sede.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/30307549420045-Cambio-de-Carrera-o-Sede",
        "link": "https://experienciavivo.duoc.cl/alumnos/solicitudes",
        "actionLabel": "Ver Estado de Solicitud en Vivo Duoc",
        "instructions": "1. Revisa si debes inscribir asignaturas mientras se resuelve tu postulación de Admisión Especial.\n2. Verifica cómo opera la exención de pago de matrícula si cuentas con Gratuidad vigente.",
        "paedisTip": "Si te cambias de sede, tu expediente PAEDIS se transfiere internamente al equipo de inclusión de la nueva sede.",
        "intentTags": [
          "admision especial pendiente",
          "cambio de sede gratuidad",
          "cambio de carrera"
        ],
        "articlesCount": 2,
        "articles": [
          {
            "id": 30308979503117,
            "title": "Aún no responden mi Admisión Especial, ¿Debo tomar asignaturas?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30308979503117-A%C3%BAn-no-responden-mi-Admisi%C3%B3n-Especial-Debo-tomar-asignaturas",
            "summary": "Si tu postulación para la Admisión Especial está pendiente de respuesta por parte de la sede, te recomendamos que esperes a recibir una respuesta antes de inscribir nuevas asignaturas. Mientras tanto, si tienes alguna duda o necesitas más información sobre tu caso, puedes hablar con tu Coordinador de Carrera .",
            "externalLinks": []
          },
          {
            "id": 30338529409805,
            "title": "¿Debo pagar mi matrícula si tengo gratuidad?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30338529409805--Debo-pagar-mi-matr%C3%ADcula-si-tengo-gratuidad",
            "summary": "Si estás ingresando a Duoc UC a través de Admisión Especial , es importante que estés muy atento a la respuesta de tu postulación . Esta respuesta te proporcionará todos los detalles sobre los pasos a seguir para completar tu proceso de matrícula 📋. Asegúrate de revisar cuidadosamente toda la información que te envíen, ya que te indicarán cómo proceder y qué necesitas hacer para finalizar tu inscripción exitosamente...",
            "externalLinks": []
          }
        ]
      },
      {
        "id": "duoc-laboral",
        "zendeskSectionId": 30561342601101,
        "title": "Duoc Laboral 👩🏻‍💻",
        "description": "Aquí encontrarás toda la información clave sobre Duoc Laboral, para que puedas dar el siguiente paso en tu vida profesional después de tus estudios. Te ayudamos a conectar con oportunidades y a prepararte para lo que viene.",
        "intentGoal": "Buscar ofertas de trabajo o práctica en Duoc Laboral y participar en la Feria Laboral Virtual 2026.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/30561342601101-Duoc-Laboral",
        "link": "https://duoclaboral.cl/",
        "actionLabel": "Ir al Portal Duoc Laboral",
        "instructions": "1. Ingresa a DuocLaboral.cl con tus credenciales institucionales.\n2. Completa tu CV y postula a ofertas de prácticas y empleos exclusivos, incluyendo la Feria Laboral Virtual 2026.",
        "paedisTip": "En tu perfil de Duoc Laboral puedes indicar si cuentas con Credencial de Discapacidad (RND) para acceder a ofertas acogidas a la Ley de Inclusión Laboral 21.015.",
        "intentTags": [
          "duoc laboral",
          "feria laboral 2026",
          "buscar trabajo",
          "ofertas de empleo",
          "bolsa de trabajo"
        ],
        "articlesCount": 4,
        "articles": [
          {
            "id": 49302100037133,
            "title": "Feria Laboral Virtual 2026",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/49302100037133-Feria-Laboral-Virtual-2026",
            "summary": "¡Conéctate al lanzamiento de la FLV 2026 y participa por una camiseta autografiada por Nicolás Massú! Este miércoles 7 de octubre, a las 12:00 horas, comienza oficialmente la Feria Laboral Virtual Duoc UC 2026 , y quienes se conecten al streaming del lanzamiento tendrán una motivación extra: podrán participar en el sorteo de camisetas autografiadas por Nicolás Massú . El destacado extenista y doble medallista de oro ...",
            "externalLinks": []
          },
          {
            "id": 50006627301901,
            "title": "Guía de buenas prácticas post Feria Laboral Virtual Duoc UC",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/50006627301901-Gu%C3%ADa-de-buenas-pr%C3%A1cticas-post-Feria-Laboral-Virtual-Duoc-UC",
            "summary": "La feria terminó, pero las oportunidades siguen abiertas. Estas recomendaciones te ayudarán a fortalecer tu perfil, mantener contactos y avanzar en tu búsqueda laboral. Escenario 1: Conseguiste entrevistas Haz seguimiento: agradece el contacto dentro de 24 a 48 horas y personaliza tu mensaje. Prepárate para la entrevista: investiga la empresa y practica cómo comunicar tus logros con ejemplos concretos. Muestra lo que...",
            "externalLinks": [
              "https://duoclaboral.cl/",
              "https://videosduoc.duoc.cl/channel/Centro+de+Desarrollo+Profesional/393963653",
              "https://laboral.geasa.cl/login",
              "https://centroayuda.duoc.cl/hc/es-419/articles/45592321890317-Programa-de-Acompa%C3%B1amiento-Laboral",
              "https://laboral.geasa.cl/registro"
            ]
          },
          {
            "id": 30561483805837,
            "title": "¿Qué es Duoc Laboral?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30561483805837--Qu%C3%A9-es-Duoc-Laboral",
            "summary": "Duoc Laboral es una plataforma de desarrollo laboral donde puedes registrarte o designar a alguien de tu equipo como punto de contacto para publicar ofertas laborales o de prácticas . Para comenzar, solo sigue estos pasos: Ingresa a www.duoclaboral.cl y dirígete a la sección Acceso Empresas . Completa el registro de tu empresa. ¡Es rápido y fácil! 🕒 Para publicar una oferta, haz clic en PROCESOS y luego en “ Nuevo p...",
            "externalLinks": [
              "http://www.duoclaboral.cl/"
            ]
          },
          {
            "id": 30561591358477,
            "title": "¿Cómo solucionar problemas de acceso a Duoc Laboral?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30561591358477--C%C3%B3mo-solucionar-problemas-de-acceso-a-Duoc-Laboral",
            "summary": "Si necesitas restablecer tus accesos, te sugerimos que te comuniques con el Coordinador de Desarrollo Laboral en tu sede 📨.",
            "externalLinks": []
          }
        ]
      },
      {
        "id": "renuncia-caducidad",
        "zendeskSectionId": 30336842601869,
        "title": "Renuncia 🖋",
        "description": "Si por alguna razón necesitas interrumpir tus estudios, aquí te brindamos toda la información que necesitas para hacerlo de manera clara y sencilla. Te explicamos los requisitos, los pasos a seguir y el proceso de solicitud para que puedas tomar decisiones informadas.",
        "intentGoal": "Solicitar la Renuncia definitiva a mi carrera o entender qué es la Caducidad de alumno regular.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/30336842601869-Renuncia",
        "link": "https://experienciavivo.duoc.cl/alumnos/solicitudes",
        "actionLabel": "Gestionar en Portal de Solicitudes",
        "instructions": "1. Revisa las implicancias académicas y financieras de la Renuncia antes de ingresarla.\n2. Si perdiste la calidad de alumno regular por Caducidad (abandono sin trámite formal), revisa el procedimiento de reincorporación.",
        "paedisTip": "Si estás pensando en renunciar por dificultades de accesibilidad o salud, solicita antes una entrevista de orientación con PAEDIS; existen alternativas como la Suspensión Académica.",
        "intentTags": [
          "renuncia",
          "abandonar carrera",
          "caducidad alumno regular",
          "retiro definitivo"
        ],
        "articlesCount": 2,
        "articles": [
          {
            "id": 30337653041165,
            "title": "¿Qué es la Renuncia y cómo solicitarla?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30337653041165--Qu%C3%A9-es-la-Renuncia-y-c%C3%B3mo-solicitarla",
            "summary": "La Renuncia es el proceso mediante el cual decides abandonar tu calidad de Alumno/a Regular o Provisional de forma definitiva, y se realiza a través de los canales formales de Duoc UC. Al optar por la renuncia, toda la carga académica inscrita para el período en cuestión se cancelará por completo 📚🚫. Puedes solicitar la renuncia en cualquier momento durante el semestre , pero ten en cuenta que no podrás hacerlo si ...",
            "externalLinks": [
              "https://experienciavivo.duoc.cl/index",
              "https://centroayuda.duoc.cl/hc/es-419/requests/new/"
            ]
          },
          {
            "id": 30337967320461,
            "title": "¿Qué es la Caducidad de alumno/a regular y cómo reincorporarme?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30337967320461--Qu%C3%A9-es-la-Caducidad-de-alumno-a-regular-y-c%C3%B3mo-reincorporarme",
            "summary": "La caducidad ocurre cuando pierdes tu calidad de Alumno/a Regular porque, siendo un estudiante de continuidad, no inscribes ninguna asignatura ni solicitas una inscripción especial durante el período asignado para la anulación de semestre y retiro de asignaturas, según el Calendario Académico 📅. ¿Cómo puedo reincorporarme? 🤔 Si te encuentras en esta situación y quieres reincorporarte a la institución, tendrás que h...",
            "externalLinks": []
          }
        ]
      },
      {
        "id": "suspension-academica",
        "zendeskSectionId": 30338643009165,
        "title": "Suspensión Académica ⏯",
        "description": "Aquí encontrarás toda la información que necesitas para suspender tus estudios de manera temporal. Te explicamos los requisitos y los pasos a seguir para que el proceso sea fácil y claro.",
        "intentGoal": "Congelar o suspender temporalmente mi semestre o año académico conservando mi cupo.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/30338643009165-Suspensi%C3%B3n-Acad%C3%A9mica",
        "link": "https://experienciavivo.duoc.cl/alumnos/solicitudes",
        "actionLabel": "Solicitar Suspensión en Vivo Duoc",
        "instructions": "1. Ingresa a Experiencia Vivo > Solicitudes > Suspensión Académica dentro de los plazos del Calendario Académico.\n2. Adjunta la documentación de respaldo y revisa cómo se gestiona la suspensión de tus beneficios estudiantiles (Gratuidad/Becas/CAE).",
        "paedisTip": "Recuerda que si tienes Gratuidad o becas Mineduc, debes tramitar también la suspensión del beneficio para no perder meses de cobertura.",
        "intentTags": [
          "congelar",
          "suspension academica",
          "suspender semestre",
          "pausar estudios",
          "postergar"
        ],
        "articlesCount": 1,
        "articles": [
          {
            "id": 30337233746317,
            "title": "¿Qué es la Suspensión Académica y cómo solicitarla?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30337233746317--Qu%C3%A9-es-la-Suspensi%C3%B3n-Acad%C3%A9mica-y-c%C3%B3mo-solicitarla",
            "summary": "La Suspensión del semestre es una opción que te permite perder temporalmente tu calidad de Alumno/a Regular o Provisional , si así lo solicitas. Esto significa que puedes pausar tu progreso académico por un tiempo, por motivos que necesites. Requisitos para solicitar la Suspensión 📋 Haber cursado al menos un semestre académico: Debes haber completado al menos un semestre antes de poder solicitar la suspensión. 📚 No...",
            "externalLinks": [
              "https://www.duoc.cl/calendario-academico/",
              "https://centroayuda.duoc.cl/hc/es-419/requests/new/"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "beneficios-estudiantiles",
    "zendeskCategoryId": 31889884698637,
    "title": "Beneficios estudiantiles",
    "officialCategoryUrl": "https://centroayuda.duoc.cl/hc/es-419/categories/31889884698637-Beneficios-estudiantiles",
    "iconName": "HeartHandshake",
    "highlight": true,
    "badge": "4 Apartados • 12 Guías",
    "sectionsCount": 4,
    "articlesCount": 12,
    "shortIntent": "Programa PAEDIS (Discapacidad), Estudiantes Cuidadores (Ley 21.790), Apoyo Psicológico y Emergencia.",
    "description": "Conoce los beneficios que tienes a tu alcance como estudiante: opciones de financiamiento, becas, créditos, y programas de apoyo diseñados para acompañarte en tu camino académico.",
    "submodules": [
      {
        "id": "apoyo-estudiantes-cuidadores",
        "zendeskSectionId": 44620494835597,
        "title": "Apoyo a estudiantes cuidadores",
        "description": "Aquí encontrarás información sobre los derechos y medidas de flexibilidad académica establecidos por la Ley N.° 21.790 para estudiantes cuidadores. Conoce quiénes pueden acreditarse, qué documentación necesitas, cómo solicitar la acreditación y cómo acceder a las medidas que correspondan.",
        "intentGoal": "Acreditarme como Estudiante Cuidador/a (Ley N° 21.790) y acceder a medidas de flexibilidad académica.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/44620494835597-Apoyo-a-estudiantes-cuidadores",
        "link": "https://experienciavivo.duoc.cl/alumnos/solicitudes",
        "actionLabel": "Acreditar Condición de Cuidador en Vivo Duoc",
        "instructions": "1. Revisa el alcance de la Ley N° 21.790 que protege a estudiantes que ejercen labores de cuidado de personas con discapacidad, dependencia severa o niños/as.\n2. Presenta tu credencial o certificado de persona cuidadora del Registro Social de Hogares.\n3. Conoce y activa tus medidas de flexibilidad académica (justificación de asistencia, reprogramación de evaluaciones y prioridad en toma de ramos).",
        "paedisTip": "La Ley N° 21.790 garantiza que ningún estudiante cuidador acreditado sea perjudicado académicamente por asistir a urgencias o controles de la persona a su cuidado.",
        "intentTags": [
          "estudiante cuidador",
          "ley 21790",
          "ley 21.790",
          "cuidadores",
          "flexibilidad academica",
          "hijo o familiar dependiente"
        ],
        "articlesCount": 4,
        "articles": [
          {
            "id": 44621145254669,
            "title": "Ley N° 21.790: Apoyo para estudiantes cuidadores",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/44621145254669-Ley-N-21-790-Apoyo-para-estudiantes-cuidadores",
            "summary": "La Ley N° 21.790 reconoce derechos para estudiantes de educación superior que se encuentran en situaciones de cuidado, con el objetivo de facilitar la continuidad de sus estudios. En Duoc UC , esta ley se implementa mediante medidas de flexibilidad académica que permiten compatibilizar las responsabilidades personales con el proceso formativo. 👥 ¿Quiénes pueden acceder? Pueden acceder estudiantes regulares que acred...",
            "externalLinks": []
          },
          {
            "id": 44620980041741,
            "title": "Soy estudiante cuidador/a acreditado/a: ¿qué debo saber?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/44620980041741-Soy-estudiante-cuidador-a-acreditado-a-qu%C3%A9-debo-saber",
            "summary": "Si tu solicitud de acreditación como estudiante cuidador/a fue aprobada, cuentas con una acreditación vigente que te permite acceder a las medidas de flexibilidad académica que correspondan a tu situación. ¿Desde cuándo puedo acceder a las medidas de flexibilidad académica? Puedes acceder a las medidas correspondientes una vez aprobada tu acreditación , considerando las condiciones y procedimientos establecidos para ...",
            "externalLinks": []
          },
          {
            "id": 44620862854797,
            "title": "Soy estudiante cuidador/a acreditado/a: conoce las medidas de flexibilidad académica",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/44620862854797-Soy-estudiante-cuidador-a-acreditado-a-conoce-las-medidas-de-flexibilidad-acad%C3%A9mica",
            "summary": "Si cuentas con una acreditación vigente como estudiante cuidador/a , puedes acceder a las medidas de flexibilidad académica que correspondan a tu situación. Estas medidas buscan facilitar la compatibilización de tus responsabilidades de cuidado con tu proceso formativo, sin modificar los resultados de aprendizaje ni eliminar las exigencias académicas de tu carrera . 🎓 ¿Qué medidas puedo utilizar? Las medidas de flex...",
            "externalLinks": []
          },
          {
            "id": 44626042247309,
            "title": "Información sobre tratamiento de datos personales de estudiantes cuidadores",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/44626042247309-Informaci%C3%B3n-sobre-tratamiento-de-datos-personales-de-estudiantes-cuidadores",
            "summary": "Los datos personales que usted proporcione en la solicitud serán tratados por Duoc UC con la finalidad de gestionar el proceso de acreditación de condiciones y solicitudes de flexibilidad académica en el marco de la Ley N°21.790. La información proporcionada podrá incluir antecedentes que constituyan datos personales sensibles, particularmente información relativa a la salud, así como datos personales de niños, niñas...",
            "externalLinks": []
          }
        ]
      },
      {
        "id": "programas-apoyo-estudiante",
        "zendeskSectionId": 42864810050957,
        "title": "Programas de Apoyo al Estudiante 🫂",
        "description": "Aquí encontrarás toda la información sobre los distintos apoyos económicos que Duoc UC tiene para ti. Te contamos todo lo que necesitas saber para que puedas aprovechar las opciones disponibles y seguir adelante con tus estudios.",
        "intentGoal": "Postular al Programa de Emergencia económica o al Programa de Acompañamiento Laboral.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/42864810050957-Programas-de-Apoyo-al-Estudiante",
        "link": "https://experienciavivo.duoc.cl/alumnos/solicitudes",
        "actionLabel": "Postular a Programas de Apoyo",
        "instructions": "1. Si enfrentas una situación socioeconómica imprevista grave (cesantía del sostenedor, siniestro o enfermedad), revisa los requisitos del Programa de Emergencia.\n2. Si buscas inserción laboral acompañada, revisa el Programa de Acompañamiento Laboral.",
        "paedisTip": "El Programa de Acompañamiento Laboral brinda preparación de entrevistas y vinculación inclusiva para estudiantes con discapacidad.",
        "intentTags": [
          "programa de emergencia",
          "apoyo economico urgente",
          "acompañamiento laboral",
          "cesantia sostenedor",
          "ayuda social"
        ],
        "articlesCount": 2,
        "articles": [
          {
            "id": 45592321890317,
            "title": "Programa de Acompañamiento Laboral",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/45592321890317-Programa-de-Acompa%C3%B1amiento-Laboral",
            "summary": "¿Qué es el Programa de Acompañamiento Laboral? Es un servicio online personalizado que te ayuda a prepararte mejor para el mundo laboral. A través de sesiones individuales con psicólogos laborales, se te entregará apoyo práctico para enfrentar la búsqueda de empleo, la inserción laboral y el desarrollo profesional con mayor seguridad y claridad. Pasos para registrarte y agendar sesiones. ¿Cómo me registro? Ingresa a ...",
            "externalLinks": [
              "https://laboral.geasa.cl/registro",
              "https://laboral.geasa.cl/login"
            ]
          },
          {
            "id": 30307126308109,
            "title": "Programa de Emergencia 🆘",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30307126308109-Programa-de-Emergencia",
            "summary": "Importante: Dado los incendios ocurridos en la Región del Biobío (VIII Región), se habilitó de manera excepcional la categoría 3: Daños a la vivienda del Programa de Apoyo Estudiantil de Emergencia (PAE Emergencia) , permitiendo que los y las estudiantes afectados/as puedan postular a este beneficio, conforme a los requisitos y documentación señalados a continuación. El Programa de Emergencia de Duoc UC está pensado ...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/requests/new?ticket_form_id=35449975765133",
              "https://www.duoc.cl/wp-content/uploads/2026/01/RES-RECTORIA-04-2026-REGLAMENTO-PROGRAMA-DE-EMRGENCIA-2026-VF.pdf"
            ]
          }
        ]
      },
      {
        "id": "paedis-discapacidad",
        "zendeskSectionId": 38323361292941,
        "title": "Programa de Acompañamiento Estudiantes en situación de Discapacidad (PAEDIS)",
        "description": "Programa orientado al acompañamiento de estudiantes en situación de discapacidad (EsD)",
        "intentGoal": "Ingresar al Programa PAEDIS, conocer los requisitos de acreditación y solicitar mis Ajustes Razonables.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/38323361292941-Programa-de-Acompa%C3%B1amiento-Estudiantes-en-situaci%C3%B3n-de-Discapacidad-PAEDIS",
        "link": "https://centroayuda.duoc.cl/hc/es-419/sections/38323361292941-Programa-de-Acompa%C3%B1amiento-Estudiantes-en-situaci%C3%B3n-de-Discapacidad-PAEDIS",
        "actionLabel": "Ver Requisitos y Apoyos Oficiales PAEDIS",
        "instructions": "1. ¿Qué es PAEDIS?: Es el Programa de Acompañamiento a Estudiantes en situación de Discapacidad de Duoc UC, orientado a asegurar la inclusión y equidad en tu trayectoria formativa.\n2. Requisitos de ingreso: Ser estudiante matriculado en Duoc UC y presentar Credencial de Discapacidad (RND / COMPIN), certificado médico especialista o informe diagnóstico actualizado.\n3. Apoyos que entrega: Diseño de Ficha de Ajustes Razonables para tus docentes, adecuaciones en evaluaciones (tiempo adicional, formatos accesibles), acompañamiento psicoeducativo y orientación durante toda tu carrera.",
        "paedisTip": "En Sede Alameda puedes coordinar tu entrevista inicial PAEDIS directamente en Punto Estudiantil o escribiendo a la coordinación de inclusión de tu sede.",
        "intentTags": [
          "paedis",
          "discapacidad",
          "ajustes razonables",
          "inclusion",
          "tea",
          "neurodivergencia",
          "credencial discapacidad",
          "apoyos paedis"
        ],
        "articlesCount": 3,
        "articles": [
          {
            "id": 34877482210189,
            "title": "¿Qué es el Programa de Acompañamiento Estudiantes con Discapacidad (PAEDIS)? 🙋",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/34877482210189--Qu%C3%A9-es-el-Programa-de-Acompa%C3%B1amiento-Estudiantes-con-Discapacidad-PAEDIS",
            "summary": "El PAEDIS es un programa orientado al acompañamiento de estudiantes en situación de discapacidad (EsD) que, de forma voluntaria, deseen participar en el programa y que presenten necesidades de apoyo permanentes derivadas de una condición de salud sensorial, física, intelectual, psicosocial u otra. Estas necesidades surgen en la interacción con el entorno y pueden requerir apoyos o ajustes para acceder y/o participar ...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/articles/38323485720589--Qu%C3%A9-requisitos-debo-cumplir-para-ingresar-al-PAEDIS"
            ]
          },
          {
            "id": 38323485720589,
            "title": "¿Qué requisitos debo cumplir para ingresar al PAEDIS? ✅",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/38323485720589--Qu%C3%A9-requisitos-debo-cumplir-para-ingresar-al-PAEDIS",
            "summary": "Para acceder a los servicios del Programa de Acompañamiento a Estudiantes en Situación de Discapacidad (PAEDIS), es necesario acreditar formalmente una condición de discapacidad de origen permanente, que constituya el principal motivo de requerimiento de apoyos educativos. Esta condición se denomina discapacidad primaria. El documento de respaldo debe indicar el diagnóstico correspondiente y debe ser emitido por un p...",
            "externalLinks": []
          },
          {
            "id": 38323557074573,
            "title": "¿Qué apoyos entrega el PAEDIS? 🧑🏼‍🏫",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/38323557074573--Qu%C3%A9-apoyos-entrega-el-PAEDIS",
            "summary": "El PAEDIS ofrece apoyos personalizados según lo que necesites para estudiar en igualdad de condiciones. Estos apoyos son gratuitos y deben ser solicitados a la Coordinación de Inclusión Académica de tu sede. Aquí te explicamos algunos de los apoyos disponibles: 👂 Intérprete de Lengua de Señas Chilena Si eres una persona Sorda, puedes contar con un intérprete certificado que te acompañe en clases y traduzca todo lo q...",
            "externalLinks": []
          }
        ]
      },
      {
        "id": "bienestar-salud-mental",
        "zendeskSectionId": 34877029895181,
        "title": "Bienestar 🫰",
        "description": "En esta sección encontrarás información y recursos sobre apoyo psicológico, apoyo para potenciar tu aprendizaje, beneficios estudiantiles y más. Descubre las herramientas que ofrece Duoc UC para equilibrar tu vida académica y personal.",
        "intentGoal": "Solicitar sesiones de Apoyo Psicológico gratuito, salud mental o recursos del Centro Virtual de Aprendizaje.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/34877029895181-Bienestar",
        "link": "https://experienciavivo.duoc.cl/alumnos/actividades/posts",
        "actionLabel": "Acceder a Bienestar y Apoyo Psicológico",
        "instructions": "1. Solicita atención en el programa de Apoyo Psicológico gratuito y confidencial para estudiantes de Duoc UC.\n2. Participa en las actividades de la Semana del Bienestar y Salud Mental.\n3. Utiliza el Centro Virtual de Aprendizaje para fortalecer tus hábitos de estudio y manejo del estrés académico.",
        "paedisTip": "Las atenciones psicológicas están disponibles en modalidad online y presencial, adaptándose a tus necesidades de comunicación y confort sensorial.",
        "intentTags": [
          "apoyo psicologico",
          "psicologo gratis",
          "salud mental",
          "ansiedad",
          "estres",
          "bienestar",
          "centro virtual de aprendizaje"
        ],
        "articlesCount": 3,
        "articles": [
          {
            "id": 39803077294733,
            "title": "Semana del Bienestar y Salud Mental Duoc UC ✨🧘🏻‍♀️",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/39803077294733-Semana-del-Bienestar-y-Salud-Mental-Duoc-UC",
            "summary": "¿Qué es la semana del Bienestar y Salud mental de Duoc UC? La Semana del Bienestar y Salud Mental de Duoc UC, una iniciativa pionera en instituciones de educación superior que se repite cada año desde el 2019, especialmente diseñada para ti y tu desarrollo integral. ✨ Durante esta semana, encontrarás un espacio seguro donde podrás reconectar contigo mismo, aprender herramientas para gestionar el estrés y fortalecer t...",
            "externalLinks": [
              "https://www.duoc.cl/vida-estudiantil/unidad-de-apoyo-y-bienestar-estudiantil/"
            ]
          },
          {
            "id": 34879018776205,
            "title": "Centro Virtual de Aprendizaje",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/34879018776205-Centro-Virtual-de-Aprendizaje",
            "summary": "El Centro Virtual de Aprendizaje busca ser un espacio interactivo que provee diversos videos y recursos online para apoyar el aprendizaje de los estudiantes con tips para técnicas de estudios, organización del tiempo, y el desarrollo de habilidades para el cumplimiento de metas y mantener la motivación en el estudio. ¿Quiénes pueden acceder? 🎯 Todos los estudiantes de Duoc UC con su cuenta @duocuc.cl ¿En qué consist...",
            "externalLinks": [
              "https://cva.duoc.cl/"
            ]
          },
          {
            "id": 34877114417165,
            "title": "Apoyo psicológico",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/34877114417165-Apoyo-psicol%C3%B3gico",
            "summary": "El Programa de Salud Mental DUOC UC está enfocado en entregar Contención, apoyo y terapia psicológica breve enfocada en trastornos de salud mental en general y específicos como depresión, ansiedad, estrés, entre otros. ¿Quiénes pueden acceder? ✅ Todos los estudiantes regulares de Duoc UC mayores de 18 años se pueden atender en el programa. ¿En qué consiste? 📝 La atención es entregada de forma virtual por videollamad...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/sections/32253086608525-Notas-y-Ex%C3%A1menes",
              "https://agenda.achs.cl/booking/step-1",
              "https://www.duoc.cl/vida-estudiantil/unidad-de-apoyo-y-bienestar-estudiantil/"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "pagos-deudas",
    "zendeskCategoryId": 31890014969229,
    "title": "Pagos y Deudas",
    "officialCategoryUrl": "https://centroayuda.duoc.cl/hc/es-419/categories/31890014969229-Pagos-y-Deudas",
    "iconName": "CreditCard",
    "highlight": false,
    "badge": "2 Apartados • 7 Guías",
    "sectionsCount": 2,
    "articlesCount": 7,
    "shortIntent": "Pago de matrícula y arancel, exención con Gratuidad/CAE y convenios de repactación de deuda.",
    "description": "Toda la información sobre tus pagos académicos: conoce los plazos, métodos y opciones disponibles para matrícula, aranceles, y el manejo de deudas, incluyendo alternativas de repactación y beneficios aplicables.",
    "submodules": [
      {
        "id": "matricula-arancel-pagos",
        "zendeskSectionId": 32254690156429,
        "title": "Matrícula y Arancel",
        "description": "Aquí encontrarás toda la información que necesitas sobre los pagos de tu matrícula, incluyendo los métodos disponibles y los pasos a seguir si cuentas con algún tipo de financiamiento.",
        "intentGoal": "Pagar mi matrícula o mensualidad, conocer medios de pago o saber si debo pagar teniendo Gratuidad o CAE.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/32254690156429-Matr%C3%ADcula-y-Arancel",
        "link": "https://experienciavivo.duoc.cl/alumnos/finanzas",
        "actionLabel": "Ir al Portal de Finanzas y Pagos",
        "instructions": "1. Revisa las fechas de vencimiento de matrícula y arancel mensual en Experiencia Vivo > Finanzas.\n2. Si tienes Gratuidad asignada, estás exento de pago de matrícula y arancel durante la duración formal de la carrera.\n3. Si tienes CAE, revisa los plazos y el copago o pago de matrícula según corresponda.",
        "paedisTip": "El portal de Finanzas permite pagar en línea sin necesidad de hacer filas presenciales en caja.",
        "intentTags": [
          "pagar matricula",
          "pagar arancel",
          "mensualidad",
          "pago con gratuidad",
          "pago con cae",
          "metodos de pago"
        ],
        "articlesCount": 4,
        "articles": [
          {
            "id": 30340202002061,
            "title": "¿Cuándo tengo que pagar mi matrícula y qué pasa si no lo hago a tiempo?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30340202002061--Cu%C3%A1ndo-tengo-que-pagar-mi-matr%C3%ADcula-y-qu%C3%A9-pasa-si-no-lo-hago-a-tiempo",
            "summary": "El pago de la matrícula es semestral , es decir, debes realizarlo dos veces al año, al inicio de cada semestre. Asegúrate de cumplir con estos pagos para mantener tu inscripción activa y poder continuar con tus estudios sin inconvenientes. ¿Qué pasa si no pago la matrícula en los plazos establecidos? 🤔 Si no realizas el pago de la matrícula dentro de los plazos establecidos, es posible que enfrentes problemas al mom...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/requests/new/"
            ]
          },
          {
            "id": 30339840062989,
            "title": "¿Cuáles son los métodos de pago de las mensualidades y matrículas?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30339840062989--Cu%C3%A1les-son-los-m%C3%A9todos-de-pago-de-las-mensualidades-y-matr%C3%ADculas",
            "summary": "A continuación podrás encontrar un listado sobre los métodos de pago de mensualidades y matrículas: Para pagos en línea 🌐 Portal de Alumnos 🎒 Banco Santander 🏦 Banco Estado 🏦 Banco de Chile 🏦 Transbank Webpay 💳 Para pagos presenciales 🏫 Caja de las distintas sedes Duoc UC 🏢 Caja Vecina 🏬 Estado Express 🏠 Si estás en proceso de pre-inscripción para Admisión 2025 , el pago de la matrícula se realiza de forma ...",
            "externalLinks": [
              "https://admision.duoc.cl/",
              "https://centroayuda.duoc.cl/hc/es-419/requests/new/"
            ]
          },
          {
            "id": 30339209797005,
            "title": "¿Tengo que pagar matrícula si tengo gratuidad?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30339209797005--Tengo-que-pagar-matr%C3%ADcula-si-tengo-gratuidad",
            "summary": "Si cuentas con gratuidad, no tendrás que preocuparte por el pago de matrícula, ya que el proceso se realiza de forma automática para ti 🎉 Solo necesitas firmar tu contrato de continuidad una vez al año para confirmar tu lugar. Este documento es un respaldo para ti y para nosotros sobre el cumplimiento de la educación y servicios que ofrecemos como Institución de Educación Superior. Puedes firmar tu contrato fácilmen...",
            "externalLinks": [
              "https://experienciavivo.duoc.cl/",
              "https://firmadecontrato.duoc.cl/",
              "https://centroayuda.duoc.cl/hc/es-419/requests/new/"
            ]
          },
          {
            "id": 30339510172301,
            "title": "¿Tengo que pagar matrícula si tengo CAE?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30339510172301--Tengo-que-pagar-matr%C3%ADcula-si-tengo-CAE",
            "summary": "Si cuentas con el CAE, debes pagar la matrícula por separado. Aunque el Crédito con Garantía Estatal (CAE) cubre el % del arancel que hayas solicitado a la hora de postular para tu carrera 🎓💰, este no incluye el costo de la matrícula. Así que, asegúrate de realizar este pago adicional para poder participar del proceso de inscripción de asignaturas. Puedes realizar el pago de la matrícula de las siguientes maneras: ...",
            "externalLinks": [
              "https://www.duoc.cl/portal-de-pago/",
              "https://centroayuda.duoc.cl/hc/es-419/requests/new/"
            ]
          }
        ]
      },
      {
        "id": "deudas-repactacion",
        "zendeskSectionId": 32254699120397,
        "title": "Deudas",
        "description": "En esta sección te proporcionamos toda la información que necesitas para gestionar tus deudas de manera sencilla. Desde cómo repactar tus deudas hasta los diferentes métodos de pago disponibles, te explicamos todo lo que debes saber para que puedas tomar el control de tu situación financiera.",
        "intentGoal": "Repactar una deuda atrasada o solucionar problemas al firmar mi Contrato de Deuda.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/32254699120397-Deudas",
        "link": "https://experienciavivo.duoc.cl/alumnos/finanzas",
        "actionLabel": "Gestionar Deudas y Repactación",
        "instructions": "1. Si mantienes cuotas morosas, consulta las opciones de Repactación disponibles en el portal de Finanzas.\n2. Incluso si no recibiste notificación previa, puedes consultar si cumples condiciones para reprogramar.\n3. Si el sistema arroja error al firmar el Contrato de Deuda, revisa la guía paso a paso de solución.",
        "paedisTip": "Regularizar o repactar a tiempo evita bloqueos administrativos en el periodo de inscripción de asignaturas.",
        "intentTags": [
          "repactar deuda",
          "repactacion",
          "morosidad",
          "contrato de deuda",
          "deuda arancel",
          "atraso cuotas"
        ],
        "articlesCount": 3,
        "articles": [
          {
            "id": 30564079648269,
            "title": "¿Puedo repactar mi deuda?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30564079648269--Puedo-repactar-mi-deuda",
            "summary": "En Duoc UC tenemos el Plan de Flexibilización , la cual es una opción diseñada para ayudar a los estudiantes que lo necesiten, ¡pero no todos los alumnos pueden optar por este plan! 🚫 La repactación de deuda permite que los estudiantes puedan comprometerse a pagar su deuda en hasta 7 cuotas con montos iguales. Esta opción es especialmente útil para quienes tienen entre 3 y 5 aranceles deudores. 💸 Las condiciones de...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/requests/new/"
            ]
          },
          {
            "id": 30564160769421,
            "title": "¿Puedo pedir repactación si no me notificaron?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30564160769421--Puedo-pedir-repactaci%C3%B3n-si-no-me-notificaron",
            "summary": "Sólo los estudiantes que hayan sido notificados por el área de Financiamiento pueden solicitar la repactación , ya que deben cumplir ciertos requisitos, como tener una carga académica vigente de continuidad, entre otros. 📚✨ Sin embargo, puedes consultar al área de Financiamiento de tu sede para aclarar cualquier duda o recibir más información sobre tu situación😊💼. ¿Necesitas crear una solicitud en línea relacionad...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/requests/new/"
            ]
          },
          {
            "id": 30564443937549,
            "title": "¿Cómo soluciono los problemas al firmar mi Contrato de Deuda?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30564443937549--C%C3%B3mo-soluciono-los-problemas-al-firmar-mi-Contrato-de-Deuda",
            "summary": "Si tienes problemas para firmar tu contrato, puedes intentar acceder al siguiente enlace. Es importante que verifiques que todos los datos en el documento sean correctos 📝. Si encuentras errores en la información del documento , debes contactar al área de Financiamiento de tu sede para que puedan gestionar la corrección de estos datos 💼. En el caso de que tu cédula esté vencida o bloqueada y estén en trámite, deber...",
            "externalLinks": [
              "https://login.microsoftonline.com/72fd0b5a-8a6a-4cff-89f6-bde961f7e250/oauth2/v2.0/authorize?response_type=code&amp;client_id=17c230a9-f532-4df7-83e4-ce6408ae2b42&amp;scope=openid&amp;redirect_uri=https://firmadecontrato.duoc.cl"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "servicios-digitales",
    "zendeskCategoryId": 31265973977357,
    "title": "Servicios Digitales",
    "officialCategoryUrl": "https://centroayuda.duoc.cl/hc/es-419/categories/31265973977357-Servicios-Digitales",
    "iconName": "Laptop",
    "highlight": false,
    "badge": "4 Apartados • 19 Guías",
    "sectionsCount": 4,
    "articlesCount": 19,
    "shortIntent": "Acceso AVA, WiFi sede, cambio de clave, MFA Authenticator, Office 365 gratis y licencias Azure/Adobe.",
    "description": "Aquí encontrarás ayuda e información de tus accesos, plataformas, cuentas, software, recursos de ciberseguridad, y todas las herramientas digitales que usas a diario.",
    "submodules": [
      {
        "id": "cuentas-accesos-correo-ava-wifi",
        "zendeskSectionId": 31266022889997,
        "title": "Cuentas, accesos y correo",
        "description": "Aquí encontrarás información o ayuda para gestionar tus cuentas y accesos, tu correo institucional y la conexión a la red de Duoc UC.",
        "intentGoal": "Resolver problemas de ingreso a AVA Blackboard, conectarme al WiFi de la sede o usar mi correo @duocuc.cl.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/31266022889997-Cuentas-accesos-y-correo",
        "link": "https://ava.duoc.cl",
        "actionLabel": "Acceder a AVA / Correo Institucional",
        "instructions": "1. Para ingresar a AVA Blackboard y a tu Correo Institucional, utiliza siempre tu usuario completo (@duocuc.cl).\n2. Si el WiFi de la sede no conecta en tu notebook o celular, sigue el Checklist WiFi oficial configurando la seguridad de red.",
        "paedisTip": "Si tienes problemas técnicos persistentes, puedes abrir un Ticket directamente en la pestaña \"Tickets Servicios Digitales\" de Nexo360.",
        "intentTags": [
          "ava",
          "blackboard",
          "wifi duoc",
          "no conecta wifi",
          "correo institucional",
          "outlook",
          "problemas acceso ava"
        ],
        "articlesCount": 5,
        "articles": [
          {
            "id": 47336422285709,
            "title": "Ambiente Virtual de Aprendizaje (AVA): acceso y problemas frecuentes",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/47336422285709-Ambiente-Virtual-de-Aprendizaje-AVA-acceso-y-problemas-frecuentes",
            "summary": "El Ambiente Virtual de Aprendizaje (AVA) utiliza la tecnología de Blackboard como plataforma de aprendizaje en línea. Para ingresar, debes validar tu identidad mediante el servicio de autenticación de Microsoft. ¿Cómo acceder? El acceso se realiza introduciendo la cuenta institucional completa con el dominio @duocuc.cl y tu contraseña respectiva. Problemas frecuentes y soluciones 1. Error de autenticación o contraseñ...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/requests/new?ticket_form_id=31306954742157"
            ]
          },
          {
            "id": 47127375730445,
            "title": "Checklist WiFi",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/47127375730445-Checklist-WiFi",
            "summary": "¿Sientes que falla el wifi? Haz este chequeo rápido antes de reportarlo. Muchas veces el problema está en tu equipo y se resuelve en un minuto. 1. ¿Hace cuánto que no apagas o reinicias tu computador? Con los días, el equipo acumula procesos y caché de red que degradan la conexión. Una gran parte de las \"caídas de wifi\" se debe a esto, no a la red. Recomendación: Apágalo por completo (no solo lo suspendas) y vuelve a...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/requests/new?ticket_form_id=31306954742157"
            ]
          },
          {
            "id": 31266236046477,
            "title": "¿Cómo puedo gestionar mi cuenta y accesos en Duoc UC?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/31266236046477--C%C3%B3mo-puedo-gestionar-mi-cuenta-y-accesos-en-Duoc-UC",
            "summary": "Tu cuenta de usuario y contraseña de Duoc UC son la llave para acceder a todos los portales institucionales y servicios digitales que ofrece la institución. Aquí te explicamos paso a paso cómo aprovechar las funcionalidades, gestionar tu contraseña y recuperar tu cuenta en caso de que olvides tu acceso. Principales funcionalidades y beneficios 🎉 Con tu cuenta de Duoc UC, podrás: Acceder a los portales institucionale...",
            "externalLinks": [
              "https://cambiatuclave.duoc.cl/",
              "https://passwordreset.microsoftonline.com/",
              "https://centroayuda.duoc.cl/hc/es-419/requests/new?ticket_form_id=31306954742157"
            ]
          },
          {
            "id": 31266797493773,
            "title": "Correo Institucional Duoc UC: ¡Tu clave para estar al día!",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/31266797493773-Correo-Institucional-Duoc-UC-Tu-clave-para-estar-al-d%C3%ADa",
            "summary": "Tu correo institucional es la forma principal de comunicación dentro de Duoc UC. Desde mensajes importantes de tus docentes, coordinadores y directores de carrera, hasta novedades sobre la vida estudiantil y anuncios oficiales de Duoc UC, todo lo recibirás en tu bandeja de entrada @duocuc.cl. 📨 Por eso, es clave que lo revises con regularidad para que no se te escape ninguna noticia importante. Principales funcional...",
            "externalLinks": [
              "https://experienciavivo.duoc.cl/",
              "https://drive.google.com/settings/storage",
              "https://centroayuda.duoc.cl/hc/es-419/requests/new?ticket_form_id=31306954742157"
            ]
          },
          {
            "id": 31266352064525,
            "title": "¿Cómo puedo conectarme a la red Wifi de Duoc UC?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/31266352064525--C%C3%B3mo-puedo-conectarme-a-la-red-Wifi-de-Duoc-UC",
            "summary": "¡Sabemos lo importante que es estar conectado! En todas las sedes de Duoc UC, puedes acceder fácilmente a la red inalámbrica de manera segura utilizando tu cuenta institucional. Aquí te explicamos cómo hacerlo paso a paso. 😉 Red disponible 🌐 DUOC_ACADEMIC 🚀 disponible en todas las sedes. Esta red ofrece la última tecnología en conexión para una navegación rápida y segura. Beneficios y funcionalidades 🎯 Acceso a I...",
            "externalLinks": [
              "https://cambiatuclave.duoc.cl/",
              "http://DUOC.cl",
              "https://centroayuda.duoc.cl/hc/es-419/requests/new?ticket_form_id=31306954742157"
            ]
          }
        ]
      },
      {
        "id": "seguridad-autenticacion-mfa-clave",
        "zendeskSectionId": 31266086162189,
        "title": "Seguridad y autenticación",
        "description": "Aquí encontrarás ayuda para activar tu verificación en dos pasos (MFA), proteger tu información y saber qué hacer ante una amenaza o problema de seguridad.",
        "intentGoal": "Cambiar mi contraseña olvidada o configurar/recuperar la verificación en dos pasos (MFA Microsoft Authenticator).",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/31266086162189-Seguridad-y-autenticaci%C3%B3n",
        "link": "https://mysignins.microsoft.com/security-info",
        "actionLabel": "Configurar MFA y Contraseña Microsoft 365",
        "instructions": "1. Para cambiar tu contraseña de Microsoft Office 365, ingresa al portal de seguridad de tu cuenta institucional.\n2. Configura MFA (Verificación en dos pasos) con la app Microsoft Authenticator para aprobar los números de inicio de sesión.\n3. Si cambiaste de teléfono y perdiste el MFA, solicita el reseteo de MFA en Mesa de Servicios Digitales.",
        "paedisTip": "Recuerda que Nexo360 cuenta con pantalla de Número Gigante para facilitar la lectura del código de 2 dígitos de Microsoft Authenticator.",
        "intentTags": [
          "cambiar contraseña",
          "olvide mi clave",
          "mfa",
          "microsoft authenticator",
          "verificacion en dos pasos",
          "ciberseguridad"
        ],
        "articlesCount": 7,
        "articles": [
          {
            "id": 49737690078733,
            "title": "Cómo cambiar tu contraseña: Plataforma Microsoft Office 365",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/49737690078733-C%C3%B3mo-cambiar-tu-contrase%C3%B1a-Plataforma-Microsoft-Office-365",
            "summary": "Sigue estos pasos para cambiar tu contraseña de correo institucional desde el portal de Microsoft 365. Cambia la contraseña de tu cuenta Duoc UC o recupérala si la olvidaste o perdiste acceso a tu verificación en dos pasos. En resumen Recuerdas tu contraseña actual: cámbiala tú mismo desde tu cuenta Microsoft siguiendo los 5 pasos de este artículo. La olvidaste: recupérala desde la pantalla de inicio de sesión o pide...",
            "externalLinks": [
              "https://%E2%80%AFhttps://centroayuda.duoc.cl/hc/es-419/requests/new?ticket_form_id=31306954742157%E2%80%AF"
            ]
          },
          {
            "id": 35999617868813,
            "title": "MFA: Verificación en dos pasos",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/35999617868813-MFA-Verificaci%C3%B3n-en-dos-pasos",
            "summary": "Cuando intentes acceder a cualquier plataforma digital de Duoc UC, además de tu usuario y contraseña, se te pedirá completar un segundo paso desde tu teléfono para confirmar que eres tú quien está ingresando. Esto se conoce como MFA (Autenticación Multifactor) y es una medida de seguridad que protege tu cuenta y tu información. Podrás validar tu identidad mediante alguna de estas opciones: 1.-App Microsoft Authentica...",
            "externalLinks": [
              "https://www.duoc.cl/wp-content/uploads/2025/05/Manual-MFA-2025_v3.pdf"
            ]
          },
          {
            "id": 31267135379725,
            "title": "Tips para proteger mi información y la de Duoc UC",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/31267135379725-Tips-para-proteger-mi-informaci%C3%B3n-y-la-de-Duoc-UC",
            "summary": "La seguridad de la información es fundamental para proteger no solo tus datos personales, sino también los de nuestra comunidad. Aquí te dejamos algunos tips súper útiles para que mantengas a salvo tu información y evites caer en trampas cibernéticas. 🚀 1. No Hagas Clic en Links Sospechosos 🚫🔗 Siempre ten cuidado con los enlaces que recibes de remitentes desconocidos. Al hacer clic en un enlace falso, podrías roba...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/requests/new?ticket_form_id=31306954742157"
            ]
          },
          {
            "id": 31267096941837,
            "title": "¿Qué hacer si enfrento un problema de seguridad de la información?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/31267096941837--Qu%C3%A9-hacer-si-enfrento-un-problema-de-seguridad-de-la-informaci%C3%B3n",
            "summary": "La seguridad de la información es fundamental para proteger tus datos y los de Duoc UC. Si te encuentras ante un problema de seguridad, ¡no te preocupes! Aquí tienes una guía rápida para saber cómo actuar. 👇 1. Desconecta tu dispositivo 🔌 Si sospechas que tu dispositivo está comprometido, lo primero que debes hacer es desconectarlo de la red . Esto ayudará a prevenir que cualquier amenaza se propague o que tu infor...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/requests/new?ticket_form_id=31306954742157"
            ]
          },
          {
            "id": 31267244645773,
            "title": "¿Cuáles son las amenazas cibernéticas más comunes?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/31267244645773--Cu%C3%A1les-son-las-amenazas-cibern%C3%A9ticas-m%C3%A1s-comunes",
            "summary": "En el mundo digital actual, es fundamental estar al tanto de las amenazas cibernéticas que pueden comprometer nuestra seguridad en línea. Aquí te presentamos las más comunes y cómo puedes protegerte. 💻🔒 1. Malware 🦠 El malware es un término que se refiere a diferentes tipos de software malicioso, como gusanos, virus, troyanos y programas espías. Estos programas buscan explotar vulnerabilidades en tus dispositivos,...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/requests/new?ticket_form_id=31306954742157"
            ]
          },
          {
            "id": 31267000686733,
            "title": "¿Qué es la Seguridad de la Información?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/31267000686733--Qu%C3%A9-es-la-Seguridad-de-la-Informaci%C3%B3n",
            "summary": "La Seguridad de la Información es el conjunto de medidas que se toman para proteger los bienes de información de Duoc UC . Esto incluye prevenir la pérdida, uso indebido, divulgación no autorizada, daño, destrucción o robo de los datos que manejan estudiantes, docentes y colaboradores. Veamos de qué se trata y por qué es tan importante para ti como estudiante. ¿Qué protege la Seguridad de la Información? 🛡️ La segur...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/requests/new?ticket_form_id=31306954742157"
            ]
          },
          {
            "id": 31267327822861,
            "title": "¿Cuál es mi responsabilidad como alumno de Duoc UC?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/31267327822861--Cu%C3%A1l-es-mi-responsabilidad-como-alumno-de-Duoc-UC",
            "summary": "En Duoc UC, cada uno de nosotros tiene un papel importante en la seguridad de la información y el uso responsable de los recursos. Aquí te dejamos un resumen de tus responsabilidades y lo que debes evitar para asegurar un entorno académico seguro y productivo. 🌟 ¿Qué debo hacer como Alumno? 🤔 Como parte de la comunidad de Duoc UC, tienes algunas responsabilidades clave que debes seguir: Uso adecuado de recursos : U...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/requests/new?ticket_form_id=31306954742157"
            ]
          }
        ]
      },
      {
        "id": "plataformas-herramientas-m365-teams-vivo",
        "zendeskSectionId": 31266025601293,
        "title": "Plataformas y herramientas digitales",
        "description": "Aquí encontrarás cómo acceder y sacarle provecho a las plataformas y herramientas digitales que Duoc UC pone a tu disposición para estudiar.",
        "intentGoal": "Descargar Microsoft 365 gratis (Word, Excel, Teams) o solucionar cuando la App Vivo no muestra mis datos.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/31266025601293-Plataformas-y-herramientas-digitales",
        "link": "https://www.office.com/",
        "actionLabel": "Abrir Portal Microsoft 365 Gratis",
        "instructions": "1. Inicia sesión en office.com con tu correo @duocuc.cl para descargar gratis Word, Excel, PowerPoint, OneNote y Microsoft Teams.\n2. Si la App Vivo Duoc no muestra tus horarios o notas, sigue el tutorial oficial de sincronización y limpieza de caché.",
        "paedisTip": "Microsoft 365 incluye de forma nativa el Lector Inmersivo (Immersive Reader) ideal para dislexia, baja visión y lectura en voz alta.",
        "intentTags": [
          "microsoft 365",
          "office gratis",
          "word excel gratis",
          "microsoft teams",
          "app vivo no muestra datos"
        ],
        "articlesCount": 3,
        "articles": [
          {
            "id": 31266478943757,
            "title": "Microsoft 365: ¡Todo lo que necesitas para estudiar en Duoc UC!",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/31266478943757-Microsoft-365-Todo-lo-que-necesitas-para-estudiar-en-Duoc-UC",
            "summary": "En Duoc UC, tienes acceso gratuito a la suite de Microsoft 365 , que incluye herramientas super útiles como Word, Excel, PowerPoint y muchas más. ¡Aquí te contamos cómo sacarle el máximo provecho! 🚀 ¿Qué es Microsoft 365? 🛠️ Microsoft 365 es una colección de aplicaciones y servicios de uso libre para todos los estudiantes de Duoc UC. Algunas de las herramientas más populares que puedes usar son: Outlook : Envía cor...",
            "externalLinks": [
              "https://www.office.com/",
              "https://www.duoc.cl/inicia-microsoft-365/",
              "https://centroayuda.duoc.cl/hc/es-419/requests/new?ticket_form_id=31306954742157"
            ]
          },
          {
            "id": 31266905697037,
            "title": "Microsoft Teams en Duoc UC: ¡Colabora y comunícate fácilmente!",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/31266905697037-Microsoft-Teams-en-Duoc-UC-Colabora-y-comun%C3%ADcate-f%C3%A1cilmente",
            "summary": "Microsoft Teams es una herramienta increíble para la comunicación y colaboración en equipo, disponible para ti gracias al convenio de Microsoft 365 con Duoc UC . Desde chats y videollamadas hasta compartir archivos y trabajar en equipo, Teams es el lugar perfecto para organizar tus actividades académicas. Principales funcionalidades y beneficios 🛠️🌟 Con Microsoft Teams puedes: Interactuar con tus compañeros y docen...",
            "externalLinks": [
              "https://www.office.com/",
              "https://www.duoc.cl/inicia-microsoft-365/",
              "https://centroayuda.duoc.cl/hc/es-419/requests/new?ticket_form_id=31306954742157"
            ]
          },
          {
            "id": 39006227790733,
            "title": "App Vivo: ¿Qué pasa si no veo mis datos? 🫣 [con tutorial]",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/39006227790733-App-Vivo-Qu%C3%A9-pasa-si-no-veo-mis-datos-con-tutorial",
            "summary": "Si estás experimentando problemas para ver tus datos en la aplicación Vivo Duoc, sigue estos pasos para resolverlo: Cierra sesión y vuelve a iniciarla Paso 1: Abre la aplicación Vivo Duoc en tu dispositivo móvil. Paso 2: Dirígete a la sección de \"Menú\" de la app (en la parte inferior derecha de la pantalla). Paso 3: Navega hasta la opción \"Cerrar Sesión\" y selecciónala. Paso 4: Confirma que deseas cerrar la sesión ac...",
            "externalLinks": [
              "https://wa.me/56936639565"
            ]
          }
        ]
      },
      {
        "id": "convenios-software-carrera",
        "zendeskSectionId": 31266044583181,
        "title": "Convenios y software para tu carrera",
        "description": "Aquí encontrarás el software profesional disponible para tu carrera a través de los convenios de Duoc UC, como Adobe, Autodesk y Azure, con los pasos para acceder a cada uno.",
        "intentGoal": "Activar licencias gratuitas para mi carrera: Microsoft Azure Dev Tools, Adobe Creative Cloud, Suite Autodesk o Toon Boom.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/31266044583181-Convenios-y-software-para-tu-carrera",
        "link": "https://azureforeducation.microsoft.com/devtools",
        "actionLabel": "Acceder a Licencias Azure / Software",
        "instructions": "1. Como estudiante de Informática tienes acceso gratuito a Microsoft Azure Dev Tools for Teaching (software profesional, servidores y recursos cloud).\n2. Según las asignaturas que curses, también dispones de licencias educativas de Adobe, Autodesk y Toon Boom Harmony.",
        "paedisTip": "Aprovecha Azure Dev Tools para descargar herramientas de desarrollo oficiales en tu computador personal sin costo.",
        "intentTags": [
          "software gratis",
          "azure dev tools",
          "convenio adobe",
          "autodesk",
          "toon boom",
          "licencias informatica"
        ],
        "articlesCount": 4,
        "articles": [
          {
            "id": 46924588307213,
            "title": "Toon Boom Harmony: licencia para carrera de animación Digital",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/46924588307213-Toon-Boom-Harmony-licencia-para-carrera-de-animaci%C3%B3n-Digital",
            "summary": "Toon Boom Harmony y Storyboard Pro es un software profesional utilizado en la Carrera de Animación Digital. Esta guía explica cómo activar la licencia gratuita y resolver problemas comunes de acceso. ¿Quiénes pueden utilizarlo? El acceso está destinado a estudiantes y docentes de las carreras o asignaturas que contemplan el uso de esta herramienta. ¿Cómo obtengo la licencia? Existen dos tipos de licencias asociadas a...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/requests/new?ticket_form_id=31306954742157"
            ]
          },
          {
            "id": 31266577241229,
            "title": "Microsoft Azure Dev Tools for Teaching: ¡Herramientas Pro para tu carrera!",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/31266577241229-Microsoft-Azure-Dev-Tools-for-Teaching-Herramientas-Pro-para-tu-carrera",
            "summary": "Si eres estudiante de Duoc UC, ¡tienes acceso a Microsoft Azure Dev Tools for Teaching de forma gratuita! Esta plataforma te ofrece un montón de herramientas de desarrollo profesional que puedes descargar tanto en los laboratorios de Duoc UC como en tus propios dispositivos. ¡Ideal para quienes quieren aprender con lo mejor en tecnología! 💻🔧 ¿Qué es Microsoft Azure Dev Tools for Teaching? 🌐 Azure Dev Tools for Tea...",
            "externalLinks": [
              "https://aka.ms/devtoolsforteaching",
              "https://centroayuda.duoc.cl/hc/es-419/requests/new?ticket_form_id=31306954742157"
            ]
          },
          {
            "id": 31266635809549,
            "title": "Convenio Adobe - Duoc UC. ¡Creatividad sin límites!",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/31266635809549-Convenio-Adobe-Duoc-UC-Creatividad-sin-l%C3%ADmites",
            "summary": "Si estudias en la Escuela de Comunicación o la Escuela de Diseño de Duoc UC, ¡tienes acceso gratuito a la plataforma Adobe Creative Cloud ! Con este convenio, puedes usar algunas de las mejores herramientas creativas del mundo, perfectas para tus proyectos académicos y profesionales. Aquí te contamos todo lo que necesitas saber para empezar a usar estas aplicaciones. 🚀✨ Principales funcionalidades y beneficios 📸🎥 ...",
            "externalLinks": [
              "http://www.adobe.com/",
              "https://creativecloud.adobe.com/apps/all/desktop?promoid=3X72B2M4&amp;mv=other",
              "https://helpx.adobe.com/cl/support/support-new/resolve-di-issues",
              "https://centroayuda.duoc.cl/hc/es-419/requests/new?ticket_form_id=31306954742157"
            ]
          },
          {
            "id": 31266713854221,
            "title": "Convenio Suite Autodesk – Duoc UC: ¡Herramientas para diseñar tu futuro!",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/31266713854221-Convenio-Suite-Autodesk-Duoc-UC-Herramientas-para-dise%C3%B1ar-tu-futuro",
            "summary": "¿Sabías que como estudiante de Duoc UC tienes acceso gratuito a los programas de la Suite Autodesk ? Con este convenio, podrás utilizar herramientas de diseño, construcción y comunicación utilizadas por profesionales a nivel mundial. Si estudias en áreas relacionadas al diseño o construcción, este beneficio es para ti. ¡Aquí te contamos cómo acceder y sacar el máximo provecho de estas potentes herramientas! 🚀🎨 Prin...",
            "externalLinks": [
              "https://www.autodesk.com/education/support",
              "https://centroayuda.duoc.cl/hc/es-419/requests/new?ticket_form_id=31306954742157"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "titulados",
    "zendeskCategoryId": 30142093504141,
    "title": "Titulados",
    "officialCategoryUrl": "https://centroayuda.duoc.cl/hc/es-419/categories/30142093504141-Titulados",
    "iconName": "Award",
    "highlight": false,
    "badge": "3 Apartados • 6 Guías",
    "sectionsCount": 3,
    "articlesCount": 6,
    "shortIntent": "Fechas de ceremonia de titulación, retiro de diploma, certificado de título y cuenta de titulados.",
    "description": "Accede a todo lo necesario para tu post-graduación: desde la obtención de tu diploma y certificado, hasta la participación en ceremonias y la gestión de tu cuenta de titulados para seguir conectado con Duoc UC.",
    "submodules": [
      {
        "id": "diploma-ceremonia-titulos",
        "zendeskSectionId": 30224571877005,
        "title": "Diploma y Ceremonia de Títulos",
        "description": "Aquí encontrarás toda la información importante sobre la Ceremonia de Titulación y la entrega de tu Título. Te contamos todo lo que necesitas saber para que este momento tan especial sea inolvidable.",
        "intentGoal": "Conocer la fecha de mi Ceremonia de Titulación o saber dónde retirar mi Diploma si no pude asistir.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/30224571877005-Diploma-y-Ceremonia-de-T%C3%ADtulos",
        "link": "https://centroayuda.duoc.cl/hc/es-419/sections/30224571877005-Diploma-y-Ceremonia-de-T%C3%ADtulos",
        "actionLabel": "Ver Información de Ceremonia y Diploma",
        "instructions": "1. Revisa el calendario de Ceremonias de Titulación de tu sede.\n2. Si no pudiste asistir a tu ceremonia, consulta el procedimiento y horarios de Punto Estudiantil para retirar tu diploma físico.",
        "paedisTip": "En la confirmación de asistencia a la Ceremonia de Titulación puedes indicar requerimientos de accesibilidad (intérprete de lengua de señas, rampa en escenario o asientos reservados).",
        "intentTags": [
          "ceremonia de titulacion",
          "retirar titulo",
          "diploma",
          "graduacion"
        ],
        "articlesCount": 2,
        "articles": [
          {
            "id": 30597192092813,
            "title": "¿Cómo puedo saber la fecha de mi Ceremonia de Titulación?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30597192092813--C%C3%B3mo-puedo-saber-la-fecha-de-mi-Ceremonia-de-Titulaci%C3%B3n",
            "summary": "Las Ceremonias son organizadas por el Área de Extensión de cada sede , ellos son los encargados de gestionar todos los detalles relacionados con tu ceremonia y la entrega de tu título, si tienes dudas específicas sobre la fecha, horario o cualquier otro aspecto relacionado, te recomendamos contactar al Equipo de Extensión de tu sede . Ellos podrán proporcionarte la información más precisa y actualizada que necesitas....",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/requests/new/"
            ]
          },
          {
            "id": 30597500129933,
            "title": "¿Dónde puedo retirar mi Título si no asistí a mi Ceremonia de Títulación?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30597500129933--D%C3%B3nde-puedo-retirar-mi-T%C3%ADtulo-si-no-asist%C3%AD-a-mi-Ceremonia-de-T%C3%ADtulaci%C3%B3n",
            "summary": "Para retirar tu diploma , puedes acudir a las Oficinas DARA de tu sede. Es importante que te contactes con ellos mediante la casilla de correo correspondiente para agendar una hora para el retiro 📅. Si un tercero va a retirar tu diploma en tu nombre, deberá presentar la siguiente documentación: Poder Notarial : Este documento debe ser realizado por ti, el titulado, autorizando el retiro del diploma. Asegúrate de que...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/requests/new/"
            ]
          }
        ]
      },
      {
        "id": "certificados-titulados",
        "zendeskSectionId": 30224535234573,
        "title": "Certificados",
        "description": "Aquí encontrarás toda la información sobre los certificados que recibirás a lo largo de tu vida académica. Te explicamos qué son, cómo obtenerlos y para qué puedes usarlos.",
        "intentGoal": "Descargar mi Certificado de Título oficial en formato digital.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/30224535234573-Certificados",
        "link": "https://experienciavivo.duoc.cl/alumnos/certificados",
        "actionLabel": "Descargar Certificado de Título",
        "instructions": "1. Ingresa al portal de Certificados con tu cuenta de titulado o alumno.\n2. Descarga tu Certificado de Título con código de verificación electrónica.",
        "paedisTip": "Los certificados digitales emitidos por Duoc UC son 100% accesibles por lectores de pantalla y tienen plena validez legal.",
        "intentTags": [
          "certificado de titulo",
          "descargar titulo",
          "certificado egreso"
        ],
        "articlesCount": 1,
        "articles": [
          {
            "id": 30595674827149,
            "title": "¿Cómo puedo descargar mi Certificado de Título?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30595674827149--C%C3%B3mo-puedo-descargar-mi-Certificado-de-T%C3%ADtulo",
            "summary": "Para descargar el Certificado de Título desde el Portal de Titulados debes dirigirte a la sección ''Certificados en Línea' ' y descargar tu Título. En el caso de que lo desees descargar desde el celular , te recomendamos cambiar la vista a Modo Escritorio y así podrás visualizar sin problemas el botón para realizar la descarga 📱. Para cambiar a Modo Escritorio en tu navegador de celular debes seguir los siguientes p...",
            "externalLinks": [
              "https://experienciavivo.duoc.cl/titulados",
              "https://centroayuda.duoc.cl/hc/es-419/requests/new/"
            ]
          }
        ]
      },
      {
        "id": "cuenta-de-titulados",
        "zendeskSectionId": 30224552310669,
        "title": "Cuenta de Titulados",
        "description": "Esta sección está pensada para los estudiantes titulados que quieren aprovechar su cuenta de Titulado y acceder a todos los programas y beneficios que hemos preparado especialmente para ti.",
        "intentGoal": "Crear o recuperar las credenciales de mi Cuenta de Titulados Duoc UC.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/30224552310669-Cuenta-de-Titulados",
        "link": "https://titulados.duoc.cl/",
        "actionLabel": "Ingresar al Portal de Titulados",
        "instructions": "1. Conoce cuáles son tus credenciales como titulado (@titulados.duoc.cl o acceso al portal).\n2. Sigue los pasos para activar tu cuenta y acceder a beneficios, descuentos, educación continua y bolsa de empleo.",
        "paedisTip": "Como titulado sigues teniendo acceso a Duoc Laboral y asesorías de empleabilidad inclusiva.",
        "intentTags": [
          "cuenta de titulados",
          "credenciales titulado",
          "correo titulado",
          "exalumnos"
        ],
        "articlesCount": 3,
        "articles": [
          {
            "id": 32255682508429,
            "title": "¿Cuáles son mis credenciales de titulado?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/32255682508429--Cu%C3%A1les-son-mis-credenciales-de-titulado",
            "summary": "Si ya tienes tu usuario de Titulado, puedes acceder con tu usuario Duoc (XXXXX@duocuc.cl) y tu contraseña sería la primera letra de tu apellido en mayúsculas, seguido de tu RUT 💻 Recuerda ingresar en modo incógnito y por Google Chrome. Al momento de iniciar sesión te pedirá que actualices tus datos de información de contacto 🌐 Si no recuerdas o no conoces tu usuario de Titulado, podrás contactar a la Mesa de Servic...",
            "externalLinks": []
          },
          {
            "id": 30596928429581,
            "title": "¿Cómo puedo crear mi cuenta de Titulados?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30596928429581--C%C3%B3mo-puedo-crear-mi-cuenta-de-Titulados",
            "summary": "Para crear tu cuenta de Titulados debes enviar un mail a titulados@duoc.cl Recuerda que tu cuenta puede demorar hasta 48 horas en activarse y que la contraseña será misma que utilizarás en tu correo Duoc. Mesa de Servicios Teléfonos: (+56) 44220 1098 (+56) 227120245 O mediante el WhatsApp: (+56) 936639565",
            "externalLinks": []
          },
          {
            "id": 30596722324749,
            "title": "¿Cómo solucionar los problemas para ingresar a mi Cuenta de Titulados?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30596722324749--C%C3%B3mo-solucionar-los-problemas-para-ingresar-a-mi-Cuenta-de-Titulados",
            "summary": "Si tienes dificultades para ingresar al Portal de Titulados o no recuerdas tu cuenta, te recomendamos llamar a nuestra Mesa de Servicios al 442 201 098 o (+56) 227 120 245. Selecciona la Opción 3 en el menú telefónico. También en WhatsApp (+56) 936639565. Los horarios de atención de la Mesa de Servicios son: Lunes a Miércoles: 8:30 a 21:30 horas. Jueves y Viernes: 8:30 a 20:30 horas. Sábado: 8:30 a 14:00 horas. ¡Aten...",
            "externalLinks": []
          }
        ]
      }
    ]
  },
  {
    "id": "convivencia-inclusion",
    "zendeskCategoryId": 31890297128845,
    "title": "Convivencia, inclusión y equidad de género",
    "officialCategoryUrl": "https://centroayuda.duoc.cl/hc/es-419/categories/31890297128845-Convivencia-inclusi%C3%B3n-y-equidad-de-g%C3%A9nero",
    "iconName": "ShieldAlert",
    "highlight": false,
    "badge": "1 Apartado • 4 Guías",
    "sectionsCount": 1,
    "articlesCount": 4,
    "shortIntent": "Canal de denuncias por acoso o discriminación, contacto con Unidad de Apoyo y cambio de nombre social.",
    "description": "Guía de apoyo en situaciones de violencia y discriminación: descubre los pasos para realizar una denuncia por acoso o violencia, entiende las causales de denuncia que respaldan tu caso, y conoce los recursos y medios de apoyo disponibles para quienes enfrentan situaciones de vulnerabilidad o discriminación.",
    "submodules": [
      {
        "id": "convivencia-denuncias-nombre-social",
        "zendeskSectionId": 30616499763981,
        "title": "Convivencia, inclusión y equidad de género",
        "description": "Guía de apoyo en Convivencia, Inclusión y Equidad de Género: encuentra orientación para ejercer tu derecho al Cambio de Nombre Social y conoce los pasos, causales y canales de ayuda disponibles para denunciar situaciones de violencia sexual o de género, junto con los recursos que acompañan estos procesos.",
        "intentGoal": "Realizar una denuncia por acoso/discriminación, contactar a la Unidad de Apoyo o solicitar Cambio de Nombre Social.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/30616499763981-Convivencia-inclusi%C3%B3n-y-equidad-de-g%C3%A9nero",
        "link": "https://centroayuda.duoc.cl/hc/es-419/sections/30616499763981-Convivencia-inclusi%C3%B3n-y-equidad-de-g%C3%A9nero",
        "actionLabel": "Acceder a Canal de Denuncias y Apoyo",
        "instructions": "1. Canal de Denuncias y Consultas: Conoce las conductas que constituyen causal de denuncia (acoso, violencia de género, discriminación arbitraria) y cómo presentar tu caso de forma confidencial.\n2. Unidad de Apoyo: Contacta al equipo especializado para recibir contención y orientación.\n3. Cambio de Nombre Social: Solicita el uso de tu nombre social en listas académicas, correo y plataformas institucionales.",
        "paedisTip": "Cualquier trato discriminatorio o vulneración de derechos por motivo de discapacidad puede ser reportado y acompañado por la Unidad de Apoyo y PAEDIS.",
        "intentTags": [
          "denuncia",
          "canal de denuncias",
          "acoso",
          "discriminacion",
          "nombre social",
          "equidad de genero",
          "unidad de apoyo"
        ],
        "articlesCount": 4,
        "articles": [
          {
            "id": 30617527917581,
            "title": "¿Qué conductas son causales de denuncia?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30617527917581--Qu%C3%A9-conductas-son-causales-de-denuncia",
            "summary": "Las causales de denuncia son Violencia Sexual, Violencia de Género y Discriminación de género, estas incluyen cualquier acción sexual no consentida que menoscabe la integridad o dignidad de una persona; acciones basadas en el sexo, género o sexualidad que causen daño físico, sexual o psicológico; y conductas que excluyan o restrinjan a alguien por su sexo, género o sexualidad, afectando su ejercicio de derechos human...",
            "externalLinks": []
          },
          {
            "id": 30616798356493,
            "title": "¿Cómo puedo contactar con la Unidad de Apoyo?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30616798356493--C%C3%B3mo-puedo-contactar-con-la-Unidad-de-Apoyo",
            "summary": "n nuestra comunidad, nos comprometemos de todo corazón a cuidar la integridad y el respeto a la dignidad humana en todas sus dimensiones. Si alguna vez has enfrentado una situación de violencia sexual o de género , ya sea dentro o fuera de nuestras sedes, queremos que sepas que no estás solo. 💪💖 Puedes ponerte en contacto con la Unidad de Apoyo , donde profesionales especializados están listos para brindarte el apo...",
            "externalLinks": []
          },
          {
            "id": 31638144199949,
            "title": "Canal de Denuncias y Consultas Duoc UC ⚖️",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/31638144199949-Canal-de-Denuncias-y-Consultas-Duoc-UC",
            "summary": "Preguntas frecuentes ¿Cómo puedo realizar una denuncia? Puedes realizar una denuncia de toda situación que contravenga cualquier normativa interna de la Duoc UC y/o los principios de ética e integridad , a través de nuestro Canal de Denuncias ¿Para qué sirve el canal de denuncias de Duoc UC? Es un espacio creado para acompañar y orientar a todos quienes se sientan en la necesidad de interponer denuncias acerca de exp...",
            "externalLinks": [
              "https://seiduoc.integridadcorporativa.cl/"
            ]
          },
          {
            "id": 32550244579597,
            "title": "Cambio de  Nombre Social",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/32550244579597-Cambio-de-Nombre-Social",
            "summary": "En Duoc UC, fomentamos una cultura de inclusión y respeto , reconociendo la importancia de valorar la identidad de cada estudiante. Por lo mismo, tenemos disponible para nuestros estudiantes el uso del nombre social . La solicitud está disponible para todas nuestras sedes y toda la información que brinden los estudiantes de manejará de forma confidencial. Es importante señalar que el uso de nombre social solo puede s...",
            "externalLinks": [
              "https://centroayuda.duoc.cl/hc/es-419/requests/new/"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "sostenedor",
    "zendeskCategoryId": 30142097446797,
    "title": "Sostenedor",
    "officialCategoryUrl": "https://centroayuda.duoc.cl/hc/es-419/categories/30142097446797-Sostenedor",
    "iconName": "Users",
    "highlight": false,
    "badge": "1 Apartado • 2 Guías",
    "sectionsCount": 1,
    "articlesCount": 2,
    "shortIntent": "Solicitud de certificados de alumno regular e información financiera para el sostenedor.",
    "description": "Aquí encontrarás toda la información que necesitas sobre las solicitudes o certificados que un sostenedor puede solicitar. Te explicamos de manera clara qué opciones están disponibles y cómo puedes gestionarlas fácilmente.",
    "submodules": [
      {
        "id": "sostenedor-solicitudes-certificados",
        "zendeskSectionId": 30224587860493,
        "title": "Solicitudes",
        "description": "Solicitar certificados del estudiante o conocer qué información académica/financiera puede pedir el sostenedor.",
        "intentGoal": "Solicitar certificados del estudiante o conocer qué información académica/financiera puede pedir el sostenedor.",
        "helpCenterSectionUrl": "https://centroayuda.duoc.cl/hc/es-419/sections/30224587860493-Solicitudes",
        "link": "https://centroayuda.duoc.cl/hc/es-419/sections/30224587860493-Solicitudes",
        "actionLabel": "Ver Gestión para Sostenedores",
        "instructions": "1. Conoce qué certificados y antecedentes del estudiante puede solicitar formalmente la persona registrada como Sostenedor.\n2. Sigue el procedimiento indicado para gestionar certificados para asignación familiar, impuestos o trámites laborales.",
        "paedisTip": "La información médica y diagnóstica de PAEDIS es estrictamente confidencial y está protegida por la ley de derechos y deberes de los pacientes.",
        "intentTags": [
          "sostenedor",
          "certificados para sostenedor",
          "datos del alumno",
          "apoderado financiero"
        ],
        "articlesCount": 2,
        "articles": [
          {
            "id": 30598159298829,
            "title": "¿Cómo solicitar certificados del alumno?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30598159298829--C%C3%B3mo-solicitar-certificados-del-alumno",
            "summary": "El sostenedor es el responsable de las obligaciones económicas del alumno, su enfoque se limita exclusivamente a la situación financiera del alumno . Por lo cual no tiene acceso a la información académica del estudiante 🚫 . Esto incluye datos sobre calificaciones, asistencia o progreso académico. Si el sostenedor necesita información relacionada con la situación financiera, debe canalizar esas solicitudes a través d...",
            "externalLinks": []
          },
          {
            "id": 30597892186125,
            "title": "¿Qué datos del alumno pueden solicitar los Sostenedores?",
            "url": "https://centroayuda.duoc.cl/hc/es-419/articles/30597892186125--Qu%C3%A9-datos-del-alumno-pueden-solicitar-los-Sostenedores",
            "summary": "El enfoque del Sostenedor se centra únicamente en la situación financiera del alumno, por lo que solo puede solicitar información relacionada con el estado financiero del alumno, que puede incluir: Estado de deuda 📄 Montos adeudados 💰 Información de la deuda ℹ️ Fechas de pago 📅",
            "externalLinks": []
          }
        ]
      }
    ]
  }
];

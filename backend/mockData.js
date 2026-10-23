// backend/data/mockData.js

export const alumnoMock = {
  rut: "19.123.456-7",
  nombre: "Cristian Guzmán García",
  email: "cri.guzmang@duocuc.cl",
  carrera: "Ingeniería en Informática",
  perfil_paedis: true,
  alertas: [
    { 
      id: 1, 
      tipo: "academica", 
      mensaje: "Tienes una evaluación pendiente en Arquitectura de Software.",
      prioridad: "ALTA"
    },
    { 
      id: 2, 
      tipo: "sistema", 
      mensaje: "Recuerda actualizar tu credencial TNE este mes.",
      prioridad: "MEDIA"
    }
  ],
  asignaturas: [
    {
      id: "ASY4131",
      nombre: "Arquitectura de Software",
      seccion: "001V",
      docente: "Axel",
      asistencia: 85,
      notas: [
        { evaluacion: "Evaluación 1", ponderacion: 30, nota: 6.5 },
        { evaluacion: "Evaluación 2", ponderacion: 30, nota: 5.8 },
        { evaluacion: "Evaluación 3", ponderacion: 40, nota: 0.0 }
      ],
      promedio_parcial: 6.1
    },
    {
      id: "PGY4121",
      nombre: "Programación de Base de Datos",
      seccion: "002V",
      docente: "Profesor Prueba",
      asistencia: 100,
      notas: [
        { evaluacion: "Evaluación 1", ponderacion: 40, nota: 7.0 },
        { evaluacion: "Evaluación 2", ponderacion: 60, nota: 0.0 }
      ],
      promedio_parcial: 7.0
    }
  ]
};

// Nota: Si tu backend usa CommonJS (require) en lugar de ES Modules (import), 
// cambia la primera línea por: const alumnoMock = { ... } 
// y al final del archivo agrega: module.exports = { alumnoMock };
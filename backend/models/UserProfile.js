const mongoose = require('mongoose');

/**
 * REGLA DE ARQUITECTURA CRÍTICA: ZERO-KNOWLEDGE CREDENTIALS
 * Este modelo NUNCA almacena ni debe almacenar la contraseña institucional del estudiante.
 * Solo se persisten datos de perfil público institucional y preferencias de accesibilidad.
 */
const UserProfileSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'El correo institucional es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-zA-Z0-9._%+-]+@(?:profesor\.)?duoc(?:uc)?\.cl$/, 'Debe ser un correo válido de Duoc UC (@duoc.cl o @duocuc.cl)'],
    },
    rut: {
      type: String,
      trim: true,
      default: '',
    },
    nombre: {
      type: String,
      trim: true,
      default: 'Estudiante Duoc UC',
    },
    carrera: {
      type: String,
      trim: true,
      default: 'Informática / Duoc UC',
    },
    sede: {
      type: String,
      trim: true,
      default: 'Sede Alameda',
    },
    // Estado y apoyos específicos del programa PAEDIS
    paedis: {
      isEnrolled: {
        type: Boolean,
        default: true, // Diseñado para estudiantes PAEDIS Alameda
      },
      sede: {
        type: String,
        default: 'Sede Alameda',
      },
      diagnosticoDeclarado: {
        type: String,
        default: 'Estudiante con Ajustes Razonables',
      },
      ajustesAprobados: [{
        tipo: String, // Ej: 'Tiempo adicional en evaluaciones', 'Formato accesible'
        descripcion: String,
      }],
    },
    // Configuración de Accesibilidad (WCAG 2.2 AA)
    accessibilityPreferences: {
      fontSize: {
        type: String,
        enum: ['normal', 'large', 'xlarge'],
        default: 'normal',
      },
      highContrast: {
        type: Boolean,
        default: false,
      },
      reducedMotion: {
        type: Boolean,
        default: false,
      },
      dyslexicFont: {
        type: Boolean,
        default: false,
      },
      screenReaderOptimized: {
        type: Boolean,
        default: false,
      },
      letterSpacing: {
        type: String,
        enum: ['normal', 'wide', 'extra-wide'],
        default: 'normal',
      },
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Garantizar que no se añada accidentalmente un campo password
UserProfileSchema.pre('save', function (next) {
  if (this.password || this._doc.password) {
    delete this.password;
    delete this._doc.password;
  }
  next();
});

module.exports = mongoose.model('UserProfile', UserProfileSchema);

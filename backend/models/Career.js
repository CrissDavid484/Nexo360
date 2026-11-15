const mongoose = require('mongoose');

const CareerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la carrera es obligatorio'],
      unique: true,
      trim: true,
      maxlength: 150,
    },
    code: {
      type: String,
      trim: true,
      maxlength: 20,
      default: '',
    },
    school: {
      type: String,
      trim: true,
      maxlength: 120,
      default: 'Escuela Duoc UC',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Career', CareerSchema);

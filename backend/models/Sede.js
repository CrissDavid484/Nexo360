const mongoose = require('mongoose');

const SedeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la sede es obligatorio'],
      unique: true,
      trim: true,
      maxlength: 120,
    },
    city: {
      type: String,
      trim: true,
      maxlength: 80,
      default: 'Región Metropolitana',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Sede', SedeSchema);

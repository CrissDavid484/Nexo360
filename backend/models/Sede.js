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
    region: {
      type: String,
      trim: true,
      maxlength: 100,
      default: 'Región Metropolitana',
    },
    city: {
      type: String,
      trim: true,
      maxlength: 80,
      default: 'Santiago',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Sede', SedeSchema);

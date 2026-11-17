/**
 * BASE DE DATOS EDUCATIVA DE USUARIOS INSTITUCIONALES DUOC UC
 *
 * Incluye perfiles con diferentes roles, estados académicos (Activo, Deserción, Titulado),
 * métricas de asistencia, uso de simuladores y ajustes PAEDIS.
 */

const DEFAULT_SEED_PASSWORD = 'Duoc2026!';
const rawSeedUsers = require('./seedUsers.json');

const SEED_USERS = rawSeedUsers.map((user) => ({
  ...user,
  password: user.password || DEFAULT_SEED_PASSWORD,
}));

module.exports = {
  DEFAULT_SEED_PASSWORD,
  SEED_USERS,
};

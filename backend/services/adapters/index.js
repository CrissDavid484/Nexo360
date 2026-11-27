/**
 * ÍNDICE DE ADAPTADORES INSTITUCIONALES DE NEXO360
 */

const entraIdAdapter = require('./entraIdAdapter');
const sicolAdapter = require('./sicolAdapter');
const libcalAdapter = require('./libcalAdapter');
const smtpAdapter = require('./smtpAdapter');
const vivoDuocAdapter = require('./vivoDuocAdapter');

module.exports = {
  entraIdAdapter,
  sicolAdapter,
  libcalAdapter,
  smtpAdapter,
  vivoDuocAdapter,
};

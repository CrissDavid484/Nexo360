// Script de inicialización de MongoDB para Nexo360 (ejecutado al crear el volumen por primera vez).
// Crea un usuario con privilegios mínimos (readWrite) exclusivo para la base de datos de la aplicación.

const dbName = process.env.MONGO_INITDB_DATABASE || 'nexo360';
const appUser = String(process.env.MONGO_APP_USER || '').trim();
const appPassword = String(process.env.MONGO_APP_PASSWORD || '');

if (!appUser || !appPassword) {
  throw new Error('MONGO_APP_USER y MONGO_APP_PASSWORD son obligatorios para inicializar MongoDB.');
}

const appDb = db.getSiblingDB(dbName);
const existingUser = appDb.getUser(appUser);

if (!existingUser) {
  appDb.createUser({
    user: appUser,
    pwd: appPassword,
    roles: [{ role: 'readWrite', db: dbName }],
  });
  print(`[mongo-init] Usuario de aplicación '${appUser}' creado con rol readWrite en '${dbName}'.`);
} else {
  print(`[mongo-init] Usuario de aplicación '${appUser}' ya existe en '${dbName}'.`);
}

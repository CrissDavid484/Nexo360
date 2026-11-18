const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function run() {
  const defaultPassword = `Duoc${new Date().getFullYear()}!`;
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexo360');
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(defaultPassword, salt);
    const res = await mongoose.connection.collection('userprofiles').updateMany(
      { $or: [{ password: { $exists: false } }, { password: null }, { password: '' }] },
      { $set: { password: hash } }
    );
    console.log('Updated userprofiles without password:', res.modifiedCount);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error('[syncPasswords] Error sincronizando contraseñas:', err);
  process.exitCode = 1;
});

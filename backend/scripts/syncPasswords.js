const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexo360');
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('Duoc2026!', salt);
  const res = await mongoose.connection.collection('userprofiles').updateMany(
    { $or: [{ password: { $exists: false } }, { password: null }, { password: '' }] },
    { $set: { password: hash } }
  );
  console.log('Updated userprofiles without password:', res.modifiedCount);
  await mongoose.disconnect();
}

run().catch(console.error);

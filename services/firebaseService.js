const isDemo = require('./demoMode');

let db;

if (isDemo) {
  // Modo demo: Firestore en memoria con datos de ejemplo
  db = require('./demo/memoryFirestore').db;
} else {
  const serviceAccount = require('../env/serviceAccountKey.json');
  const admin = require('firebase-admin');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  db = admin.firestore();
}

module.exports = db;

// ─────────────────────────────────────────────────────────────
//  MODO DEMOSTRACIÓN
//  Se activa cuando:
//    - la variable de entorno DEMO_MODE vale "true", o
//    - no existe env/serviceAccountKey.json (no hay credenciales).
//  En modo demo, MySQL y Firebase se reemplazan por bases de datos
//  en memoria con datos de ejemplo. Tus bases reales no se tocan.
//  Para forzar la conexión real: DEMO_MODE=false
// ─────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');

const keyPath = path.join(__dirname, '..', 'env', 'serviceAccountKey.json');
const flag = (process.env.DEMO_MODE || '').toLowerCase();

const isDemo = flag === 'true' || (flag !== 'false' && !fs.existsSync(keyPath));

module.exports = isDemo;

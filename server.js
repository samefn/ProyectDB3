const express = require('express');
const path = require('path');

const firebaseRoutes = require('./routes/firebase/firebaseRoutes');
const sqlRoutes = require('./routes/mysql/sqlRoutes');
const etlRoutes = require('./routes/etlroutes');
const isDemo = require('./services/demoMode');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Modo demo: aviso en las páginas + datos de ejemplo que se reinician solos
if (isDemo) {
  const { seedAll } = require('./services/demo/seed');
  seedAll();
  const minutes = Number(process.env.DEMO_RESET_MINUTES || 30);
  setInterval(seedAll, minutes * 60 * 1000);
  app.use(require('./services/demo/demoBanner'));
}

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true })); 
app.use(express.json()); 

app.use('/nosql', firebaseRoutes);
app.use('/mysql', sqlRoutes);
app.use('/etl', etlRoutes);

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
  if (isDemo) console.log('[DEMO] Modo demostración activo: se usan bases de datos en memoria.');
});
// ─────────────────────────────────────────────────────────────
//  Datos de ejemplo del modo demo.
//  - MySQL: se cargan los INSERT de DataSoccerDB.sql (20 registros por tabla).
//  - Firebase: jugadores y partidos distintos, para poder probar la
//    migración (ETL) de Firebase → MySQL.
//  - Usuario demo para iniciar sesión.
// ─────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');
const memorySql = require('./memorySql');
const memoryFirestore = require('./memoryFirestore');

// Credenciales del usuario de demostración (se muestran en la página)
const DEMO_USER = { name: 'demo', password: 'demo1234' };

// Mismo cifrado por sustitución de public/js/Login.js
const rules = {
  a: 'k9jS1', b: 'pQ7bN', c: 'zX3vC', d: 'mO8pL', e: 'nS5jM', f: 'aZ6wS', g: 'vB7nU', h: 'lK4jH', i: 'oP2iU',
  j: 'rT9yY', k: 'qW0eE', l: 'sD1fG', m: 'hJ6kL', n: 'gH5jK', o: 'pL9oI', p: 'iU3tY', q: 'bV8cZ', r: 'eW4rT',
  s: 'tG6hJ', t: 'yY7uI', u: 'iO1pA', v: 'xS2dF', w: 'cM3kL', x: 'uJ4hG', y: 'dF5gH', z: 'wE6rT',
  0: 'rT1yU', 1: 'qW2eR', 2: 'pS3dN', 3: 'zX4cV', 4: 'mK5jH', 5: 'lO6iU', 6: 'bH7gJ', 7: 'vC8xZ', 8: 'uJ9mN', 9: 'aZ0wS',
};
const cipher = (text) => Array.from(text).map((c) => rules[c] || c).join('');

function seedSql() {
  memorySql.reset();
  const file = path.join(__dirname, '..', '..', 'DataSoccerDB.sql');
  const text = fs.readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');
  // Ejecuta solo los INSERT (la estructura de tablas ya está definida en memorySql.js)
  text
    .split(';')
    .map((s) => s.trim())
    .filter((s) => /^INSERT INTO/i.test(s))
    .forEach((stmt) => memorySql.execute(stmt));

  memorySql.execute('INSERT INTO user (name, password) VALUES (?, ?)', [DEMO_USER.name, cipher(DEMO_USER.password)]);
}

async function seedFirestore() {
  memoryFirestore.reset();
  const { db } = memoryFirestore;

  const players = [
    { id: 'FB-1', firstName: 'Erling', lastName: 'Haaland', age: 24, nationality: 'Norwegian', clubId: 11,
      stats: [{ id: 'S1', matchId: '16', goals: 2, assist: 0, minutesPlayed: 90, rating: 8.7, redCards: 0, yellowCards: 0 }] },
    { id: 'FB-2', firstName: 'Bukayo', lastName: 'Saka', age: 23, nationality: 'English', clubId: 13,
      stats: [{ id: 'S1', matchId: '17', goals: 1, assist: 1, minutesPlayed: 88, rating: 8.1, redCards: 0, yellowCards: 1 }] },
    { id: 'FB-3', firstName: 'Antoine', lastName: 'Griezmann', age: 33, nationality: 'French', clubId: 14,
      stats: [{ id: 'S1', matchId: '17', goals: 1, assist: 0, minutesPlayed: 90, rating: 7.6, redCards: 0, yellowCards: 0 }] },
    { id: 'FB-4', firstName: 'Luis', lastName: 'Díaz', age: 27, nationality: 'Colombian', clubId: 4,
      stats: [{ id: 'S1', matchId: '2', goals: 1, assist: 1, minutesPlayed: 85, rating: 8.3, redCards: 0, yellowCards: 0 }] },
    { id: 'FB-5', firstName: 'Federico', lastName: 'Valverde', age: 26, nationality: 'Uruguayan', clubId: 1,
      stats: [{ id: 'S1', matchId: '1', goals: 0, assist: 2, minutesPlayed: 90, rating: 7.9, redCards: 0, yellowCards: 1 }] },
    { id: 'FB-6', firstName: 'Julián', lastName: 'Álvarez', age: 24, nationality: 'Argentine', clubId: 14,
      stats: [] },
  ];
  for (const { stats, id, ...data } of players) {
    await db.collection('player').doc(id).set(data);
    for (const { id: statId, ...s } of stats) {
      await db.collection('player').doc(id).collection('stats').doc(statId).set({ id: statId, ...s });
    }
  }

  const matches = [
    { id: 'M-1', competition: 'UEFA Champions League', date: '2024-04-16', result: '3-3',
      clubs: [
        { id: '1', clubName: 'Real Madrid', city: 'Madrid', country: 'Spain' },
        { id: '11', clubName: 'Manchester City', city: 'Manchester', country: 'England' },
      ] },
    { id: 'M-2', competition: 'Premier League', date: '2024-03-31', result: '1-1',
      clubs: [
        { id: '11', clubName: 'Manchester City', city: 'Manchester', country: 'England' },
        { id: '13', clubName: 'Arsenal', city: 'London', country: 'England' },
      ] },
    { id: 'M-3', competition: 'Copa Libertadores', date: '2024-05-08', result: '2-0',
      clubs: [
        { id: '17', clubName: 'River Plate', city: 'Buenos Aires', country: 'Argentina' },
        { id: '18', clubName: 'Flamengo', city: 'Rio de Janeiro', country: 'Brazil' },
      ] },
  ];
  for (const { clubs, id, ...data } of matches) {
    await db.collection('footballMatch').doc(id).set(data);
    for (const club of clubs) {
      await db.collection('footballMatch').doc(id).collection('clubs').doc(club.id).set(club);
    }
  }
}

async function seedAll() {
  seedSql();
  await seedFirestore();
  console.log('[DEMO] Datos de ejemplo cargados.');
}

module.exports = { seedAll, DEMO_USER };

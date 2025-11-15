const express = require("express");
const db = require("../services/firebaseService"); 
const SqlService = require("../services/sqlService");
const router = express.Router();


// ========== POST: post firebase data on mysql ==========

router.post('/players-to-sql', async (req, res) => {
  console.log("========== [POST /etl/players-to-sql] ==========");
  console.log("[ETL] Proceso iniciado: Migrando Players de Firebase a SQL...");

  const sql = new SqlService();

  try {

    console.log("[ETL] 1. Extrayendo datos de Firebase...");
    const collectionName = "player";
    const snapshot = await db.collection(collectionName).get();

    const firebasePlayers = [];
    snapshot.forEach((doc) => {
      firebasePlayers.push({ id: doc.id, ...doc.data() });
    });

    if (firebasePlayers.length === 0) {
      console.log("[ETL] No se encontraron jugadores en Firebase. Proceso terminado.");
      return res.status(200).json({ message: "No se encontraron jugadores en Firebase para migrar." });
    }
    console.log(`[ETL] Éxito: Se encontraron ${firebasePlayers.length} jugadores en Firebase.`);
    console.log("[ETL] 2. Transformando datos para SQL...");
    
    const query = `
      INSERT INTO player 
        (first_name, last_name, age, nationality, club_id) 
      VALUES ?
    `;

    const values = firebasePlayers.map(player => [
      player.firstName,
      player.lastName,
      player.age,
      player.nationality,
      player.clubId
    ]);
    console.log("[ETL] Transformación completada.");
    console.log("[ETL] 3. Conectando a MySQL para cargar datos...");
    await sql.connectToDb();

    const result = await sql.query(query, [values]);

    console.log("[ETL] ¡Éxito! Datos cargados en MySQL.");
    console.log(`[ETL] Filas afectadas: ${result.affectedRows}`);

    res.status(201).json({
      message: "Migración de jugadores completada con éxito.",
      playersEncontrados: firebasePlayers.length,
      playersInsertados: result.affectedRows
    });

  } catch (error) {
    console.error("[ETL] ERROR DURANTE EL PROCESO:", error);
    res.status(500).json({
      error: "Error interno durante el proceso ETL.",
      details: error.message
    });
  } finally {
    await sql.closeConnection();
    console.log("[ETL] Conexión MySQL cerrada. Proceso finalizado.");
  }
});

module.exports = router;
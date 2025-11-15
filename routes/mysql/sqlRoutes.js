const express = require("express");
const SqlService = require("../../services/sqlService");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { match } = require("assert");

const router = express.Router();
const uploadPath = path.join(__dirname, '..', '..', 'public', 'uploads');

// Asegura que la carpeta existe
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log('[INIT] Created uploads folder:', uploadPath);
} else {
  console.log('[INIT] Upload path ready:', uploadPath);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('[MULTER] Destination callback called');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    console.log('[MULTER] Filename callback called');
    console.log('[MULTER] Original file name:', file.originalname);
    const filename = Date.now() + path.extname(file.originalname);
    cb(null, file.fieldname + '_' + filename);
  }
});

const upload = multer({ storage: storage });

/// Register
router.post('/postUser', async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) {
    return res.status(400).send("Missing fields.");
  }

  const db = new SqlService();
  try {
    await db.connectToDb();
    await db.query(
      `INSERT INTO user (name , password) VALUES (?, ?)`,
      [name, password]
    );
    res.status(200).send("Registro exitoso");
  } catch (err) {
    console.error("SQL error:", err);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).send("Error: El nombre de usuario ya existe.");
    } else {
      res.status(500).send("Error creando su usuario o contraseña.");
    }
  } finally {
    await db.closeConnection();
  }
});

/// Login
router.post('/login-user', async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) {
    return res.status(400).send("Missing fields.");
  }

  const db = new SqlService();
  try {
    await db.connectToDb();
    const result = await db.query(
      `SELECT * FROM user WHERE name = ? AND password = ?`,
      [name, password]
    );

    if (result.length > 0) {
      // MODIFICACIÓN: En lugar de enviar solo texto, enviamos un JSON
      // con los datos del usuario. ¡NUNCA envíes la contraseña!
      const user = {
        name: result[0].name,
        image: result[0].image || null // Envía la imagen si existe
      };

      res.status(200).json({
        message: "Inicio de sesión exitoso.",
        user: user // Enviamos el objeto de usuario
      });
    } else {
      res.status(401).send("Su usuario o contraseña son incorrectos, vuelva a intentar.");
    }
  } catch (err) {
    console.error("SQL error:", err);
    res.status(500).send("Error en el servidor.");
  } finally {
    await db.closeConnection();
  }
});


/// Profile
router.post('/upload-profile', upload.single('image'), async (req, res) => {
  console.log('\n========== [POST /mysql/upload-profile] ==========');

  try {
    if (!req.file) {
      console.warn('[WARN] (req.file is empty)');
      return res.status(400).json({ message: 'There is no file in the request' });
    }

    const { name } = req.body;
    if (!name) {
      console.warn('[WARN] Username no recibido');
      return res.status(400).send("Missing fields.");;
    }

    const filePath = `/uploads/${req.file.filename}`;
    console.log('[SAVED FILE PATH]', filePath);

    const db = new SqlService();
    console.log('[SQL] Connecting to DB...');
    await db.connectToDb();

    const result = await db.query(
      `UPDATE user SET image = ? WHERE name = ?`,
      [filePath, name]
    );

    await db.closeConnection();
    console.log('[SQL] Profile updated successfully.');

    res.status(200).json({
      message: 'Entry created',
      filePath: filePath
    });

  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({
      message: 'Error creating entry.',
      error: err.message
    });
  }
});


////////////////////////////////////////////////////////////////
/////////////////////       ALL POSTS       ////////////////////
////////////////////////////////////////////////////////////////

// ========== POST: new club ==========
router.post("/insert-club", async (req, res) => {
  const db = new SqlService();
  const { club_id, club_name, country, city, stadium } = req.body;

  if (!club_id || !club_name || !country || !city || !stadium) {
    return res.status(400).send("Missing fields.");
  }

  try {
    await db.connectToDb();
    const query = `
      INSERT INTO club (club_id, club_name, country, city, stadium)
      VALUES (?, ?, ?, ?, ?)
    `;
    await db.query(query, [club_id, club_name, country, city, stadium]);
    res.status(201).json({ message: "Club insertado correctamente" });
  } catch (error) {
    console.error("Error al insertar club:", error);
    res.status(500).json({
      error: "Error al insertar club",
      details: error.message,
    });
  } finally {
    await db.closeConnection();
  }
});

// ========== POST: new player ==========
router.post('/post-player', async (req, res) => {
  const { player_id, first_name, last_name, age, nationality, club_id } = req.body;

  if (!player_id || !first_name || !last_name || !age || !nationality || !club_id) {
    return res.status(400).send("Missing fields.");
  }

  const db = new SqlService();
  try {
    await db.connectToDb();
    await db.query(
      `INSERT INTO player (player_id, first_name, last_name, age, nationality, club_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [player_id, first_name, last_name, age, nationality, club_id]
    );
    res.status(201).json({ message: "Jugador creado correctamente." });
  } catch (err) {
    console.error("Error creando jugador.", err);
    res.status(500).json({ error: "Error creando jugador.", details: err.message });
  } finally {
    await db.closeConnection();
  }
});

// ========== POST: new match ==========
router.post('/post-match', async (req, res) => {
  const db = new SqlService();
  const { match_id, date, result, away_club_id, local_club_id } = req.body;

  try {
    console.log("POST /mysql/post-match recibido:", req.body);
    await db.connectToDb();
    await db.query(`
      INSERT INTO soccerdb.\`match\` (match_id, date, result, away_club_id, local_club_id)
      VALUES (?, ?, ?, ?, ?)
    `, [match_id, date, result, away_club_id, local_club_id]);
    res.json({ message: "Partido insertado correctamente" });
  } catch (error) {
    console.error("Error insertando partido", error.message);
    res.status(500).json({ message: "Error insertando partido", error: error.message });
  } finally {
    await db.closeConnection();
  }
});

// ========== POST: entry to playermatch ==========
router.post('/post-playermatch', async (req, res) => {
  const { player_id, match_id } = req.body;
  if (!player_id || !match_id) {
    return res.status(400).send("Missing fields.");
  }

  const db = new SqlService();
  try {
    await db.connectToDb();
    await db.query(
      `INSERT INTO playermatch (player_id, match_id) VALUES (?, ?)`,
      [player_id, match_id]
    );
    res.status(200).send("Player-Match ingresado correctamente.");
  } catch (err) {
    console.error("Error ingresando Player-Match", err);
    res.status(500).send("Error ingresando Player-Match");
  } finally {
    await db.closeConnection();
  }
});

////////////////////////////////////////////////////////////////
/////////////////////      GET ALL       ///////////////////////
////////////////////////////////////////////////////////////////

// ========== GET: all clubs ==========
router.get("/get-all-clubs", async (req, res) => {
  const db = new SqlService();

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    await db.connectToDb();

    const clubs = await db.query(
      `SELECT * FROM club LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const countResult = await db.query(`SELECT COUNT(*) AS total FROM club`);
    const total = countResult[0].total || 0;

    res.status(200).json({
      current_page: page,
      page_size: limit,
      total: total,
      data: clubs,
    });

  } catch (err) {
    console.error("Error obteniendo todos los clubes", err);
    res.status(500).send("Error obteniendo todos los clubes");
  } finally {
    await db.closeConnection();
  }
});

// ========== GET: all players ==========
router.get('/get-all-player', async (req, res) => {
  const db = new SqlService();
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    await db.connectToDb();

    const players = await db.query(
      "SELECT * FROM player LIMIT ? OFFSET ?",
      [limit, offset]
    );

    const countResult = await db.query("SELECT COUNT(*) AS total FROM player");
    const total = countResult[0].total || 0;

    res.status(200).json({
      current_page: page,
      page_size: limit,
      total: total,
      data: players,
    });

  } catch (err) {
    console.error("Error obteniendo todos los jugadores.", err);
    res.status(500).json({ error: "Error obteniendo todos los jugadores.", details: err.message });
  } finally {
    await db.closeConnection();
  }
});

// ========== GET: all matches ==========
router.get('/get-all-match', async (req, res) => {
  const db = new SqlService();
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    await db.connectToDb();

    const matches = await db.query(
      "SELECT * FROM soccerdb.`match` LIMIT ? OFFSET ?",
      [limit, offset]
    );

    const countResult = await db.query("SELECT COUNT(*) AS total FROM soccerdb.`match`");
    const total = countResult[0].total || 0;

    res.status(200).json({
      current_page: page,
      page_size: limit,
      total: total,
      data: matches,
    });

  } catch (error) {
    console.error("Error obteniendo todos los partidos.", error.message);
    res.status(500).json({ message: "Error obteniendo todos los partidos.", error: error.message });
  } finally {
    await db.closeConnection();
  }
});

// ========== GET: all player-match ==========
router.get('/get-all-playermatch', async (req, res) => {
  const db = new SqlService();
  try {
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    await db.connectToDb();

    const playerMatch = await db.query(
      `SELECT * FROM playermatch LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const countResult = await db.query(`SELECT COUNT(*) AS total FROM playermatch`);
    const total = countResult[0].total || 0;

    res.status(200).json({
      current_page: page,
      page_size: limit,
      total: total,
      data: playerMatch, 
    });

  } catch (err) {
    console.error("Error obteniendo todas la relaciones player-match.", err);
    res.status(500).send("Error obteniendo todas la relaciones player-match.");
  } finally {
    await db.closeConnection();
  }
});


////////////////////////////////////////////////////////////////
//////////////////    GET ONE BY     ///////////////////////////
////////////////////////////////////////////////////////////////

// ========== GET: Club by ID ==========
router.get("/get-one-club/:club_id", async (req, res) => {
  console.log("GET one club called:", req.params.club_id);
  const db = new SqlService();

  try {
    await db.connectToDb();
    const result = await db.query(`SELECT * FROM club WHERE club_id = ?`, [
      req.params.club_id,
    ]);

    if (result.length === 0) {
      return res.status(404).send("Club no encontrado");
    }

    res.status(200).json(result[0]);
  } catch (err) {
    console.error("Error reciviendo información del club", err);
    res.status(500).send("Error reciviendo información del club");
  } finally {
    await db.closeConnection();
  }
});

// ========== GET: One player by ID ==========
router.get('/get-one-player/:player_id', async (req, res) => {
  const { player_id } = req.params;
  const db = new SqlService();

  try {
    await db.connectToDb();
    const result = await db.query(`SELECT * FROM player WHERE player_id = ?`, [player_id]);

    if (result.length === 0) {
      return res.status(404).json({ error: "Jugador no encontrado." });
    }

    res.status(200).json(result[0]);
  } catch (err) {
    console.error("Error al obtener jugador", err);
    res.status(500).json({ error: "Error al obtener jugador", details: err.message });
  } finally {
    await db.closeConnection();
  }
});

// ========== GET: one match by ID ==========
router.get('/get-one-match/:id', async (req, res) => {
  const db = new SqlService();
  const match_id = req.params.id;

  try {
    await db.connectToDb();

    const result = await db.query("SELECT * FROM soccerdb.`match` WHERE match_id = ?", [match_id]);

    if (result.length === 0) {
      return res.status(404).json({ message: "Partido no encontrado" });
    }

    res.json(result[0]);

  } catch (error) {
    console.error("Error obteniendo partido", error.message);
    res.status(500).json({ message: "Error obteniendo partido", error: error.message });
  } finally {
    await db.closeConnection();
  }
});

// ========== GET: one player-match relation ==========
router.get('/get-one-playermatch/:player_id/:match_id', async (req, res) => {
  const db = new SqlService();
  try {
    await db.connectToDb();
    const result = await db.query(`SELECT * FROM playermatch WHERE player_id = ? AND match_id = ?`, [req.params.player_id, req.params.match_id]);
    await db.closeConnection();

    if (result.length === 0) {
      res.status(404).send("Player-Match relacion no encontrada.");
    } else {
      res.status(200).json(result[0]);
    }
  } catch (err) {
    console.error("Error obteniendo relacion Player-Match.", err);
    res.status(500).send("Error obteniendo relacion Player-Match.");
  }
});

module.exports = router;
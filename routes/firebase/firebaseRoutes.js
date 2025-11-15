const express = require("express");
const db = require("../../services/firebaseService.js");
const router = express.Router();

// =================================================================
//                        FOOTBALL MATCH ROUTES
// =================================================================

// ========== GET: all Football Matches ==========
router.get("/footballMatches", async (req, res) => {
  try {
    const collectionName = "footballMatch";
    const snapshot = await db.collection(collectionName).get();

    const data = [];
    snapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });

    return res.status(200).json(data);
  } catch (err) {
    console.error("Error retrieving football matches:", err);
    return res.status(500).send("Error retrieving all football matches");
  }
});


// ========== GET: one Football Match by ID ==========
router.get("/footballMatch/:id", async (req, res) => {
  try {
    const collectionName = "footballMatch";
    const { id } = req.params;
    const docRef = db.collection(collectionName).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).send(`Match with ID '${id}' not found`);
    }

    return res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error("Error retrieving match:", err);
    return res.status(500).send("Error retrieving the match");
  }
});


// ========== POST: new Football Match ==========
router.post("/footballMatch", async (req, res) => {
  try {
    const collectionName = "footballMatch";
    const { id, mainData, subcollections } = req.body;

    if (!id || !mainData) {
      return res.status(400).json({ error: "Missing required fields: id, mainData" });
    }

    await db.collection(collectionName).doc(id).set(mainData);

    if (subcollections && subcollections.clubs) {
      const subRef = db.collection(collectionName).doc(id).collection("clubs");
      for (const club of subcollections.clubs) {
        if (club.id) await subRef.doc(club.id).set(club);
      }
    }

    return res.status(201).json({ message: "Match successfully created", id });
  } catch (error) {
    console.error("Error creating match:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


// =================================================================
//                            PLAYER ROUTES
// =================================================================

// ========== GET: all Players ==========
router.get("/players", async (req, res) => {
  try {
    const collectionName = "player";
    const snapshot = await db.collection(collectionName).get();

    const data = [];
    snapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });

    return res.status(200).json(data);
  } catch (err) {
    console.error("Error retrieving players:", err);
    return res.status(500).send("Error retrieving all players");
  }
});


// ========== GET: one Player by ID ==========
router.get("/player/:id", async (req, res) => {
  try {
    const collectionName = "player";
    const { id } = req.params;
    const docRef = db.collection(collectionName).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).send(`Player with ID '${id}' not found`);
    }

    return res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error("Error retrieving player:", err);
    return res.status(500).send("Error retrieving the player");
  }
});

// ========== POST: new Player (MODIFICADO) ==========
router.post("/player", async (req, res) => {
  try {
    const collectionName = "player";
    const { id, mainData, subcollections } = req.body;

    if (!id || !mainData) {
      return res.status(400).json({ error: "Missing required fields: id, mainData" });
    }
    
    const typedMainData = {
      ...mainData, 
      age: isNaN(parseInt(mainData.age, 10)) ? null : parseInt(mainData.age, 10),
      clubId: isNaN(parseInt(mainData.clubId, 10)) ? null : parseInt(mainData.clubId, 10)
    };

    await db.collection(collectionName).doc(id).set(typedMainData);
    
    if (subcollections && subcollections.stats) {
      const subRef = db.collection(collectionName).doc(id).collection("stats");
      for (const stat of subcollections.stats) {
        if (stat.id) {
          
          const typedStat = {
            ...stat,
            assist: parseInt(stat.assist, 10) || 0,
            goals: parseInt(stat.goals, 10) || 0,
            minutesPlayed: parseInt(stat.minutesPlayed, 10) || 0,
            rating: parseFloat(stat.rating) || 0.0, 
            redCards: parseInt(stat.redCards, 10) || 0,
            yellowCards: parseInt(stat.yellowCards, 10) || 0
          }
          await subRef.doc(stat.id).set(typedStat);
        }
      }
    }

    return res.status(201).json({ message: "Player successfully created", id });
  } catch (error) {
    console.error("Error creating player:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// =================================================================
//                        SUBCOLLECTION ROUTES
// =================================================================

// ========== GET: all clubs from a Match ==========
router.get("/footballMatch/:matchId/clubs", async (req, res) => {
    try {
        const { matchId } = req.params;
        const snapshot = await db.collection("footballMatch").doc(matchId).collection("clubs").get();

        const data = [];
        snapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });

        if (data.length === 0) {
            return res.status(404).send(`No clubs found for match '${matchId}'`);
        }
        return res.status(200).json(data);
    } catch (err) {
        console.error("Error retrieving clubs:", err);
        return res.status(500).send("Error retrieving clubs");
    }
});

// ========== GET: one club from a Match ==========
router.get("/footballMatch/:matchId/club/:clubId", async (req, res) => {
    try {
        const { matchId, clubId } = req.params;
        const docRef = db.collection("footballMatch").doc(matchId).collection("clubs").doc(clubId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).send(`Club with ID '${clubId}' not found in match '${matchId}'`);
        }
        return res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (err) {
        console.error("Error retrieving club:", err);
        return res.status(500).send("Error retrieving club");
    }
});

// ========== GET: all stats from a Player ==========
router.get("/player/:playerId/stats", async (req, res) => {
    try {
        const { playerId } = req.params;
        const snapshot = await db.collection("player").doc(playerId).collection("stats").get();

        const data = [];
        snapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });
        
        if (data.length === 0) {
            return res.status(404).send(`No stats found for player '${playerId}'`);
        }
        return res.status(200).json(data);
    } catch (err) {
        console.error("Error retrieving stats:", err);
        return res.status(500).send("Error retrieving stats");
    }
});

// ========== GET: one stat from a Player ==========
router.get("/player/:playerId/stat/:statId", async (req, res) => {
    try {
        const { playerId, statId } = req.params;
        const docRef = db.collection("player").doc(playerId).collection("stats").doc(statId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).send(`Stat with ID '${statId}' not found for player '${playerId}'`);
        }
        return res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (err) {
        console.error("Error retrieving stat:", err);
        return res.status(500).send("Error retrieving stat");
    }
});


module.exports = router;
const PLAYER_API = "/nosql";

 // ================== POST: new player ==================
async function createPlayer() {
  const playerId = document.getElementById("playerId").value.trim();
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const nationality = document.getElementById("nationality").value.trim();
  const clubId = document.getElementById("clubId").value.trim();
  const age = document.getElementById("age").value.trim();

  if (!playerId) {
      alert("El ID del jugador es obligatorio.");
      return;
  }

  const mainData = { firstName, lastName, nationality, clubId, age };
  const stats = [];
  document.querySelectorAll('.stat-block').forEach(block => {
      const stat = {
          id: block.querySelector('[name="statId"]').value.trim(),
          assist: block.querySelector('[name="assist"]').value.trim(),
          goals: block.querySelector('[name="goals"]').value.trim(),
          matchId: block.querySelector('[name="matchId"]').value.trim(),
          minutesPlayed: block.querySelector('[name="minutesPlayed"]').value.trim(),
          rating: block.querySelector('[name="rating"]').value.trim(),
          redCards: block.querySelector('[name="redCards"]').value.trim(),
          yellowCards: block.querySelector('[name="yellowCards"]').value.trim(),
      };
      if (stat.id) {
          stats.push(stat);
      }
  });

 const payload = {
    id: playerId,
    mainData,
    subcollections: { stats },
  };

  const res = await fetch(`${PLAYER_API}/player`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  alert(data.message || data.error);
}

 // ================== GET: all players ==================
async function getAllPlayers() {
  const res = await fetch(`${PLAYER_API}/players`);

  const players = await res.json();
  console.log("Jugadores:", players);
  return players;
}

 // ================== GET: one player by id ==================
async function getPlayerById() {
  const id = document.getElementById("searchPlayerId").value.trim();
  if (!id) {
    alert("Por favor, ingresa un ID de jugador.");
    return;
  }
  
  const res = await fetch(`${PLAYER_API}/player/${id}`);

  const player = await res.json();
  const tbody = document.getElementById("playerTableBody");

  if (player.error) {
    tbody.innerHTML = `<tr><td colspan="6">${player.error}</td></tr>`;
  } else {
    tbody.innerHTML = `
      <tr>
        <td>${player.id}</td>
        <td>${player.age || 'N/A'}</td>
        <td>${player.clubId}</td>
        <td>${player.firstName}</td>
        <td>${player.lastName}</td>
        <td>${player.nationality}</td>
      </tr>
    `;
  }
  return player;
}

// ================== ETL: Migrate players from NoSQL to SQL ==================
async function migratePlayersToSql() {
  console.log("Iniciando migración ETL...");
  if (!confirm("¿Estás seguro de que deseas migrar todos los jugadores de NoSQL a SQL?")) {
    console.log("Migración cancelada por el usuario.");
    return;
  }

  const migrateBtn = document.getElementById('btnMigrateToSql');
  migrateBtn.disabled = true;
  migrateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Migrando...';

  try {
    const response = await fetch('/etl/players-to-sql', {
      method: 'POST',
    });

    const result = await response.json();

    if (response.ok) {
      alert(`¡Migración completada!\n\nJugadores encontrados en NoSQL: ${result.playersEncontrados}\nJugadores nuevos insertados en SQL: ${result.playersInsertados}`);
      console.log("Migración exitosa:", result);
    } else {
      throw new Error(result.error || "Error desconocido durante la migración.");
    }

  } catch (err) {
    console.error("Error en la migración ETL:", err);
    alert(`Error al migrar: ${err.message}`);
  } finally {
    migrateBtn.disabled = false;
    migrateBtn.innerHTML = '<i class="fa-solid fa-truck-fast"></i> Iniciar Migración a SQL';
  }
}

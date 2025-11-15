let currentStats = [];

 // ================== GET: stats of a player ==================
function addStat() {
  const statId = document.getElementById("statId").value.trim();
  const goals = document.getElementById("goals").value.trim();
  const assists = document.getElementById("assists").value.trim();
  const minutesPlayed = document.getElementById("minutesPlayed").value.trim();
  const rating = document.getElementById("rating").value.trim();

  if (!statId) {
    alert("El ID de la estadística es obligatorio");
    return;
  }

  const stat = { id: statId, goals, assists, minutesPlayed, rating };
  currentStats.push(stat);
  renderStatsTable();
}

function renderStatsTable() {
  const tbody = document.getElementById("statsTableBody");
  tbody.innerHTML = currentStats
    .map(
      (s) => `
        <tr>
          <td>${s.id}</td>
          <td>${s.goals}</td>
          <td>${s.assists}</td>
          <td>${s.minutesPlayed}</td>
          <td>${s.rating}</td>
        </tr>`
    )
    .join("");
}

function resetStats() {
  currentStats = [];
  renderStatsTable();
}

const FOOTBALL_API = "/nosql";

 // ================== POST: new matches ==================
async function createFootballMatch() {
  const id = document.getElementById("matchId").value.trim();
  const competition = document.getElementById("competition").value.trim();
  const date = document.getElementById("date").value.trim();
  const result = document.getElementById("result").value.trim();

  if (!id) {
    alert("El ID del partido es obligatorio.");
    return;
  }

  const mainData = { competition, date, result };
  const clubs = [];
  document.querySelectorAll('.club-block').forEach(block => {
    const club = {
      id: block.querySelector('[name="clubId"]').value.trim(),
      clubName: block.querySelector('[name="clubName"]').value.trim(),
      city: block.querySelector('[name="city"]').value.trim(),
      country: block.querySelector('[name="country"]').value.trim(),
    };

    if (club.id) {
      clubs.push(club);
    }
  });

  const payload = {
    id,
    mainData,
    subcollections: { clubs },
  };

  const res = await fetch(`${FOOTBALL_API}/footballMatch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  alert(data.message || data.error);
}

// ================== GET: all matches ==================
async function getAllFootballMatches() {
  const res = await fetch(`${FOOTBALL_API}/footballMatches`);

  const matches = await res.json();
  console.log("Partidos:", matches);
  return matches;
}

// ================== GET: one match by id ==================
async function getFootballMatchById() {
  const id = document.getElementById("searchMatchId").value.trim();
  if (!id) {
    alert("Por favor, ingresa un ID de partido.");
    return;
  }

  const res = await fetch(`${FOOTBALL_API}/footballMatch/${id}`);

  const match = await res.json();
  const tbody = document.getElementById('footballMatchTableBody');

  if (match.error) {
    tbody.innerHTML = `<tr><td colspan="4">${match.error}</td></tr>`;
  } else {
    tbody.innerHTML = `
      <tr>
        <td>${match.id}</td>
        <td>${match.competition}</td>
        <td>${formatDate(match.date)}</td> 
        <td>${match.result}</td>
      </tr>
    `;
  }
  return match;
}

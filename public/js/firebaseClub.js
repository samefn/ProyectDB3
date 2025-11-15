let currentClubs = [];

 // ================== GET: clubs of a match ==================
function addClub() {
  const clubId = document.getElementById("clubId").value.trim();
  const clubName = document.getElementById("clubName").value.trim();
  const city = document.getElementById("city").value.trim();
  const country = document.getElementById("country").value.trim();

  if (!clubId || !clubName) {
    alert("Debes ingresar ID y nombre del club");
    return;
  }

  const club = { id: clubId, clubName, city, country };
  currentClubs.push(club);
  renderClubTable();
}

function renderClubTable() {
  const tbody = document.getElementById("clubTableBody");
  tbody.innerHTML = currentClubs
    .map(
      (c) => `
        <tr>
          <td>${c.id}</td>
          <td>${c.clubName}</td>
          <td>${c.city || "-"}</td>
          <td>${c.country || "-"}</td>
        </tr>`
    )
    .join("");
}

function resetClubs() {
  currentClubs = [];
  renderClubTable();
}
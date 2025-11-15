document.addEventListener("DOMContentLoaded", () => {
  const matchSection = document.querySelector("#match");
  if (!matchSection) return console.error("No se encontró la sección #match");

  const inputs = matchSection.querySelectorAll(".form-section input");
  const insertBtn = matchSection.querySelector(".form-section button");
  const getAllBtn = matchSection.querySelectorAll(".table-section .query-bar button")[0];
  const getOneBtn = matchSection.querySelectorAll(".table-section .query-bar button")[1];
  const getOneInput = matchSection.querySelectorAll(".table-section .query-bar input")[0];
  const tableBody = matchSection.querySelector("table tbody");

  let paginationContainer = document.getElementById("match-pagination");
  if (!paginationContainer) {
    paginationContainer = document.createElement("div");
    paginationContainer.id = "match-pagination";
    paginationContainer.className = "pagination-container"; 
    matchSection.querySelector(".table-section").appendChild(paginationContainer);
  }
  
  // ================== RENDER TABLE ==================
  function renderTable(data) {
    tableBody.innerHTML = "";
    if (!data || data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #a8b3c0;">No se encontraron partidos.</td></tr>`;
      return;
    }

    data.forEach(match => {
      const row = document.createElement("tr");
      let formattedDate = match.date;
      try {
        formattedDate = new Date(match.date).toISOString().split('T')[0];
      } catch (e) {
      }
      
      row.innerHTML = `
        <td>${match.match_id}</td>
        <td>${formattedDate}</td>
        <td>${match.result}</td>
        <td>${match.away_club_id}</td>
        <td>${match.local_club_id}</td>
      `;
      tableBody.appendChild(row);
    });
  }

  // ================== RENDER PAGINATION ==================
  function renderPagination(totalItems, pageSize, currentPage) {
    paginationContainer.innerHTML = "";
    const totalPages = Math.ceil(totalItems / pageSize);

    if (totalPages <= 1) return;

    const prevBtn = document.createElement("button");
    prevBtn.innerHTML = "&laquo; Ant";
    prevBtn.className = "pagination-btn";
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener("click", () => fetchMatches(currentPage - 1));
    paginationContainer.appendChild(prevBtn);

    const pageInfo = document.createElement("span");
    pageInfo.className = "pagination-info";
    pageInfo.textContent = `Pág ${currentPage} de ${totalPages}`;
    paginationContainer.appendChild(pageInfo);

    const nextBtn = document.createElement("button");
    nextBtn.innerHTML = "Sig &raquo;";
    nextBtn.className = "pagination-btn";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener("click", () => fetchMatches(currentPage + 1));
    paginationContainer.appendChild(nextBtn);
  }
  
  // ================== GET ALL: PLAYER WITH PAGINATION ==================
  async function fetchMatches(page = 1) {
    console.log(`Solicitando partidos, página ${page}`);
    try {
      const response = await fetch(`/mysql/get-all-match?page=${page}&limit=10`);
      if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
      
      const result = await response.json();
      console.log("Datos paginados recibidos:", result);
      
      renderTable(result.data);
      renderPagination(result.total, result.page_size, result.current_page);

    } catch (err) {
      console.error("Error al obtener todos los partidos:", err);
      alert("Error al obtener los partidos");
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error al cargar datos.</td></tr>`;
      paginationContainer.innerHTML = "";
    }
  }


  // ================== POST: new match ==================
  insertBtn.addEventListener("click", async () => {
    const [match_id, date, result, away_club_id, local_club_id] = Array.from(inputs).map(i => i.value.trim());

    if (!match_id || !date || !result || !away_club_id || !local_club_id) {
      alert("Please fill in all fields before inserting.");
      return;
    }

    try {
      const response = await fetch("/mysql/post-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match_id, date, result, away_club_id, local_club_id })
      });

      const data = await response.json();
      console.log("Datos enviados:", { match_id, date, result, away_club_id, local_club_id });

      if (response.ok) {
        alert("Match inserted successfully!");
        inputs.forEach(i => i.value = "");
        fetchMatches(1);
      } else {
        alert(`Error: ${data.message || "Could not insert match."}`);
      }
    } catch (err) {
      console.error("Error inserting match:", err);
    }
  });

  // ================== GET: all matches (botón) ==================
  getAllBtn.addEventListener("click", () => {
    console.log("Botón 'Select all data from match' presionado");
    fetchMatches(1);
  });

  // ================== GET: match by ID ==================
  getOneBtn.addEventListener("click", async () => {
    const id = getOneInput.value.trim();
    if (!id) return alert("Please enter a match ID.");

    console.log(`Buscando match con ID ${id}`);

    try {
      const response = await fetch(`/mysql/get-one-match/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          alert("Match not found.");
          renderTable([]);
        } else {
          alert("Error fetching match data.");
        }
        paginationContainer.innerHTML = "";
        return;
      }

      const data = await response.json();
      renderTable([data]);
      paginationContainer.innerHTML = "";
    } catch (err) {
      console.error("Error fetching match by ID:", err);
    }
  });

  fetchMatches(1);

});
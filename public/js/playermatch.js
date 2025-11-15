document.addEventListener("DOMContentLoaded", () => {
  const playermatchSection = document.querySelector("#playermatch");
  if (!playermatchSection) return console.error("No se encontró la sección #playermatch");

  const inputs = playermatchSection.querySelectorAll(".form-section input");
  const insertBtn = playermatchSection.querySelector(".form-section button");
  const getAllBtn = playermatchSection.querySelectorAll(".table-section .query-bar button")[0];
  const getOneBtn = playermatchSection.querySelectorAll(".table-section .query-bar button")[1];
  const getOneInputs = playermatchSection.querySelectorAll(".table-section .query-bar input"); 
  const tableBody = playermatchSection.querySelector("table tbody");

  let paginationContainer = document.getElementById("playermatch-pagination");
  if (!paginationContainer) {
    paginationContainer = document.createElement("div");
    paginationContainer.id = "playermatch-pagination";
    paginationContainer.className = "pagination-container"; 
    playermatchSection.querySelector(".table-section").appendChild(paginationContainer);
  }

  // ================== RENDER TABLE ==================
  function renderTable(data) {
    tableBody.innerHTML = "";
    if (!data || data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="2" style="text-align: center; color: #a8b3c0;">No se encontraron relaciones.</td></tr>`;
      return;
    }

    data.forEach(pm => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${pm.player_id}</td>
        <td>${pm.match_id}</td>
      `;
      tableBody.appendChild(row);
    });
  }

  //================== RENDER PAGINATION ==================
  function renderPagination(totalItems, pageSize, currentPage) {
    paginationContainer.innerHTML = "";
    const totalPages = Math.ceil(totalItems / pageSize);

    if (totalPages <= 1) return;

    const prevBtn = document.createElement("button");
    prevBtn.innerHTML = "&laquo; Ant";
    prevBtn.className = "pagination-btn";
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener("click", () => fetchPlayerMatches(currentPage - 1));
    paginationContainer.appendChild(prevBtn);

    const pageInfo = document.createElement("span");
    pageInfo.className = "pagination-info";
    pageInfo.textContent = `Pág ${currentPage} de ${totalPages}`;
    paginationContainer.appendChild(pageInfo);

    const nextBtn = document.createElement("button");
    nextBtn.innerHTML = "Sig &raquo;";
    nextBtn.className = "pagination-btn";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener("click", () => fetchPlayerMatches(currentPage + 1));
    paginationContainer.appendChild(nextBtn);
  }
  
  // ================== GET: all playermatches with pagination ==================
  async function fetchPlayerMatches(page = 1) {
    console.log(`Solicitando player-matches, página ${page}`);
    try {
      const response = await fetch(`/mysql/get-all-playermatch?page=${page}&limit=10`);
      if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
      
      const result = await response.json();
      console.log("Datos paginados recibidos:", result);
      
      renderTable(result.data);
      renderPagination(result.total, result.page_size, result.current_page);

    } catch (err) {
      console.error("Error al obtener todos los player-matches:", err);
      console.error("Error al obtener las relaciones");
      tableBody.innerHTML = `<tr><td colspan="2" style="text-align: center; color: red;">Error al cargar datos.</td></tr>`;
      paginationContainer.innerHTML = ""; 
    }
  }

  // ================== POST: new playermatch ==================
  insertBtn.addEventListener("click", async () => {
    const [player_id, match_id] = Array.from(inputs).map(i => i.value.trim());

    if (!player_id || !match_id) {
      console.warn("Por favor, rellena ambos campos.");
      return;
    }

    try {
      const response = await fetch("/mysql/post-playermatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_id, match_id })
      });

      console.log("Datos enviados:", { player_id, match_id });

      if (response.ok) {
        console.log("Relación Player-Match insertada.");
        inputs.forEach(i => i.value = "");
        fetchPlayerMatches(1);
      } else {
        const errorText = await response.text();
        console.error(`Error: ${errorText}`);
      }
    } catch (err) {
      console.error("Error inserting player-match:", err);
    }
  });

  // ================== GET: all playermatches (botón) ==================
  getAllBtn.addEventListener("click", () => {
    console.log("Botón 'Select all data from playermatch' presionado");
    fetchPlayerMatches(1);
  });

  // ================== GET: one playermatch by player id and match id ==================
  getOneBtn.addEventListener("click", async () => {
    const value = getOneInputs[0].value.trim();

    if (!value.includes(",")) {
      console.warn("Por favor, ingresa player_id y match_id separados por coma (ej: 7,12).");
      return;
    }

    const [player_id, match_id] = value.split(",").map(v => v.trim());

    if (!player_id || !match_id) {
       console.warn("Por favor, ingresa ambos IDs.");
      return;
    }

    console.log(`Buscando relación Player ${player_id} - Match ${match_id}`);

    try {
      const response = await fetch(`/mysql/get-one-playermatch/${player_id}/${match_id}`);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn("Relación Player-Match no encontrada.");
          renderTable([]);
        } else {
          console.error("Error al obtener la relación.");
        }
        paginationContainer.innerHTML = ""; 
        return;
      }

      const data = await response.json();
      console.log("Relación encontrada:", data);
      renderTable([data]);
      paginationContainer.innerHTML = "";
    } catch (err) {
      console.error("Error fetching player-match relation:", err);
    }
  });

  fetchPlayerMatches(1);
});
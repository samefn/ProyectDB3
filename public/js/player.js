function initPlayerSection() {
  const insertBtn = document.getElementById("insertPlayerBtn");
  const getAllBtn = document.getElementById("getAllPlayersBtn");
  const searchBtn = document.getElementById("searchPlayerBtn");
  const tableBody = document.getElementById("playerTableBody");
  const searchInput = document.getElementById("searchPlayerInput"); 
  const playerSection = document.querySelector("#player"); 

  if (!insertBtn || !getAllBtn || !searchBtn || !tableBody || !playerSection || !searchInput) {
    console.warn("Elementos de la sección Player no encontrados.");
    return;
  }

  let paginationContainer = document.getElementById("player-pagination");
  if (!paginationContainer) {
    paginationContainer = document.createElement("div");
    paginationContainer.id = "player-pagination";
    paginationContainer.className = "pagination-container";
    playerSection.querySelector(".table-section").appendChild(paginationContainer);
  }

  // ================== RENDER TABLE ==================
  function renderTable(data) {
    tableBody.innerHTML = "";
    if (!data || data.length === 0) {
      tableBody.innerHTML = `<tr role="row"><td colspan="6" style="text-align: center; color: #a8b3c0;">No se encontraron jugadores.</td></tr>`;
      return;
    }

    data.forEach(p => {
      const row = `
        <tr role="row">
          <td>${p.player_id}</td>
          <td>${p.first_name}</td>
          <td>${p.last_name}</td>
          <td>${p.age}</td>
          <td>${p.nationality}</td>
          <td>${p.club_id}</td>
        </tr>`;
      tableBody.insertAdjacentHTML("beforeend", row);
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
    prevBtn.addEventListener("click", () => fetchPlayers(currentPage - 1));
    paginationContainer.appendChild(prevBtn);

    const pageInfo = document.createElement("span");
    pageInfo.className = "pagination-info";
    pageInfo.textContent = `Pág ${currentPage} de ${totalPages}`;
    paginationContainer.appendChild(pageInfo);

    const nextBtn = document.createElement("button");
    nextBtn.innerHTML = "Sig &raquo;";
    nextBtn.className = "pagination-btn";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener("click", () => fetchPlayers(currentPage + 1));
    paginationContainer.appendChild(nextBtn);
  }

  // ================== GET: ALL PLAYERS WITH PAGINATION ==================
  async function fetchPlayers(page = 1) {
    console.log(`Solicitando jugadores, página ${page}`);
    try {
      const response = await fetch(`/mysql/get-all-player?page=${page}&limit=10`); 
      if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
      
      const result = await response.json();
      console.log("Datos paginados recibidos:", result);
      
      renderTable(result.data);
      renderPagination(result.total, result.page_size, result.current_page);

    } catch (err) {
      console.error("Error al obtener todos los jugadores:", err);
      console.error("Error al obtener los jugadores");
      tableBody.innerHTML = `<tr role="row"><td colspan="6" style="text-align: center; color: red;">Error al cargar datos.</td></tr>`;
      paginationContainer.innerHTML = ""; 
    }
  }

  // ========== POST: New Player ==========
  insertBtn.addEventListener("click", async () => {
    const playerData = {
      player_id: document.getElementById("playerId").value.trim(),
      first_name: document.getElementById("firstName").value.trim(),
      last_name: document.getElementById("lastName").value.trim(),
      age: document.getElementById("age").value.trim(),
      nationality: document.getElementById("nationality").value.trim(),
      club_id: document.getElementById("clubId").value.trim(),
    };

    if (!playerData.player_id || !playerData.first_name || !playerData.last_name || !playerData.age || !playerData.nationality || !playerData.club_id) {
      console.warn("Por favor, rellena todos los campos.");
      return;
    }

    try {
      const res = await fetch("/mysql/post-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(playerData),
      });

      if (!res.ok) throw new Error(await res.text());
      console.log("Player insertado correctamente.");
      fetchPlayers(1); 
    } catch (err) {
      console.error("Error al insertar player:", err);
    }
  });

  // ========== GET: All Players (botón) ==========
  getAllBtn.addEventListener("click", () => {
    fetchPlayers(1); 
  });

  // ========== GET: Player by ID ==========
  searchBtn.addEventListener("click", async () => {
    const id = searchInput.value.trim();
    if (!id) {
      console.warn("Ingresa un ID para buscar.");
      return;
    }

    try {
      const res = await fetch(`/mysql/get-one-player/${id}`);
      if (!res.ok) {
         if (res.status === 404) {
            console.warn("Jugador no encontrado.");
            renderTable([]);
         } else {
            throw new Error(await res.text());
         }
         paginationContainer.innerHTML = "";
         return;
      }
      
      const p = await res.json();
      renderTable([p]);
      paginationContainer.innerHTML = "";

    } catch (err) {
      console.error("Error al obtener player:", err);
    }
  });

  fetchPlayers(1);
} 

document.addEventListener("DOMContentLoaded", initPlayerSection);
document.addEventListener("DOMContentLoaded", () => {
  const insertBtn = document.querySelector("#club .form-section button");
  const getAllBtn = document.querySelector("#club .table-section .query-bar:first-of-type button");
  const getOneBtn = document.querySelector("#club .table-section .query-bar:nth-of-type(2) button");
  const tableBody = document.querySelector("#club table tbody");
  const clubSection = document.getElementById("club");

  if (!insertBtn || !getAllBtn || !getOneBtn || !tableBody || !clubSection) {
    console.error("No se encontraron algunos elementos de la sección CLUB.");
    return;
  }

  const paginationStyles = `
    .pagination-container {
      padding: 15px 0;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
    }
    .pagination-btn {
      background-color: #00ff88;
      color: #000;
      border: none;
      padding: 8px 14px;
      border-radius: 6px;
      cursor: pointer;
      transition: 0.3s;
      font-weight: bold;
    }
    .pagination-btn:hover {
      background-color: #00cc6a;
    }
    .pagination-btn:disabled {
      background-color: #555;
      color: #999;
      cursor: not-allowed;
    }
    .pagination-info {
      color: #a8b3c0;
      font-size: 14px;
    }
  `;
  
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = paginationStyles;
  document.head.appendChild(styleSheet);

  let paginationContainer = document.getElementById("club-pagination");
  if (!paginationContainer) {
    paginationContainer = document.createElement("div");
    paginationContainer.id = "club-pagination";
    paginationContainer.className = "pagination-container";
    clubSection.querySelector(".table-section").appendChild(paginationContainer);
  }
  
  // ================== RENDER TABLE ==================
  function renderTable(clubs) {
    tableBody.innerHTML = "";
    if (!clubs || clubs.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #a8b3c0;">No se encontraron clubes.</td></tr>`;
      return;
    }
    
    clubs.forEach(c => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${c.club_id}</td>
        <td>${c.club_name}</td>
        <td>${c.country}</td>
        <td>${c.city}</td>
        <td>${c.stadium}</td>
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
    prevBtn.addEventListener("click", () => fetchClubs(currentPage - 1));
    paginationContainer.appendChild(prevBtn);

    const pageInfo = document.createElement("span");
    pageInfo.className = "pagination-info";
    pageInfo.textContent = `Pág ${currentPage} de ${totalPages}`;
    paginationContainer.appendChild(pageInfo);

    const nextBtn = document.createElement("button");
    nextBtn.innerHTML = "Sig &raquo;";
    nextBtn.className = "pagination-btn";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener("click", () => fetchClubs(currentPage + 1));
    paginationContainer.appendChild(nextBtn);
  }

  // ================== GET: ALL CLUBS WITH PAGINATION ==================
  async function fetchClubs(page = 1) {
    console.log(`Solicitando clubes, página ${page}`);
    try {
      const response = await fetch(`/mysql/get-all-clubs?page=${page}&limit=10`);
      if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
      
      const result = await response.json();
      console.log("Datos paginados recibidos:", result);
      
      renderTable(result.data);
      renderPagination(result.total, result.page_size, result.current_page);

    } catch (err) {
      console.error("Error al obtener todos los clubes:", err);
      alert("Error al obtener los clubes");
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error al cargar datos.</td></tr>`;
      paginationContainer.innerHTML = "";
    }
  }

  // ================== POST: new club ==================
  insertBtn.addEventListener("click", async () => {
    console.log("Botón 'Insert register' presionado");
    try {
      const inputs = document.querySelectorAll("#club .form-section input");
      const [club_id, club_name, country, city, stadium] = Array.from(inputs).map(i => i.value);
      const body = { club_id, club_name, country, city, stadium };

      console.log("Enviando datos al backend:", body);

      const response = await fetch("/mysql/insert-club", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
      const data = await response.json();
      console.log("Respuesta del servidor:", data);
      alert("Registro insertado correctamente");
      fetchClubs(1);
    } catch (err) {
      console.error("Error al insertar club:", err);
      alert("Error al insertar club. Revisa consola.");
    }
  });

  // ================== GET: all clubs (botón) ==================
  getAllBtn.addEventListener("click", () => {
    console.log("Botón 'Select all data from club' presionado");
    fetchClubs(1);
  });

  // ================== GET: one club by ID ==================
  getOneBtn.addEventListener("click", async () => {
    console.log("Botón 'Select' presionado");
    try {
      const input = document.querySelector("#club .table-section .query-bar:nth-of-type(2) input");
      const club_id = input.value.trim();
      if (!club_id) {
        alert("Por favor ingresa un Club ID o parámetro de búsqueda.");
        return;
      }

      const response = await fetch(`/mysql/get-one-club/${club_id}`);
      if (!response.ok) {
        if (response.status === 404) {
           alert("Club no encontrado.");
           renderTable([]);
           paginationContainer.innerHTML = "";
           return;
        }
        throw new Error(`Error HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Resultado del club específico:", data);

      renderTable(Array.isArray(data) ? data : [data]);
      paginationContainer.innerHTML = "";
    } catch (err) {
      console.error("Error al obtener el club específico:", err);
      alert("Error al obtener el club específico");
    }
  });

  fetchClubs(1);
});
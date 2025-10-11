const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwnXHfyWyvdBzdXGSd2EMaZLyjqNozIxChuihqSzwPiWbLWufkeSXteODfqjAcGLXBR/exec";

const classNames = {
  1: "Jantan Crossing Non Poel",
  2: "Betina Crossing Non Poel",
  3: "Jantan Crossing P1-P2",
  4: "Betina Crossing P1-P2",
  5: "Extreme Non Import",
  6: "Jantan Lokal Non Poel",
  7: "Betina Lokal Non Poel",
  8: "Lokal Extreme",
  9: "Cempe Festival"
};

let allData = [];
let currentClassId = 1;
let isMenuHidden = false;
let dataTable = null;
let podiumRendered = false;

function loadSavedClass() {
  if (window.savedClassId) {
    currentClassId = window.savedClassId;
  }
  if (window.savedMenuHidden !== undefined) {
    isMenuHidden = window.savedMenuHidden;
  }
}

function saveCurrentClass() {
  window.savedClassId = currentClassId;
}

function saveMenuState() {
  window.savedMenuHidden = isMenuHidden;
}

async function fetchData() {
  try {
    const res = await fetch(APPS_SCRIPT_URL);
    if (!res.ok) throw new Error("Gagal mengambil data");
    allData = await res.json();
    
    if (document.getElementById("classGrid").innerHTML === "") {
      loadSavedClass();
      renderClassButtons();
      updateMenuVisibility();
    }
    
    showClass(currentClassId);
    
  } catch (err) {
    console.error(err);
    document.getElementById("content").innerHTML = `<p class="no-data" style="color:red;">Error: ${err.message}</p>`;
  }
}

function renderClassButtons() {
  const grid = document.getElementById("classGrid");
  grid.innerHTML = "";
  for (let i = 1; i <= 9; i++) {
    const btn = document.createElement("button");
    btn.className = "class-btn";
    if (i === currentClassId) btn.classList.add("active");
    btn.textContent = `Kelas ${i}: ${classNames[i]}`;
    btn.onclick = () => {
      currentClassId = i;
      saveCurrentClass();
      podiumRendered = false; // Reset podium flag saat ganti kelas
      document.querySelectorAll(".class-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      showClass(i);
    };
    grid.appendChild(btn);
  }
}

function toggleMenu() {
  isMenuHidden = !isMenuHidden;
  saveMenuState();
  updateMenuVisibility();
}

function updateMenuVisibility() {
  const selector = document.querySelector(".class-selector");
  const contentCard = document.querySelector(".content-card");
  if (isMenuHidden) {
    selector.classList.add("hidden");
    contentCard.classList.add("fullscreen");
  } else {
    selector.classList.remove("hidden");
    contentCard.classList.remove("fullscreen");
  }
}

function formatValue(val) {
  return val == null || val === "" ? "–" : val;
}

function calculateTotal(item, classId) {
  if ([6, 7, 8].includes(classId)) {
    return (parseFloat(item["Berat"]) || 0) + 
           (parseFloat(item["Tinggi"]) || 0) + 
           (parseFloat(item["Performa"]) || 0) + 
           (parseFloat(item["Kesehatan"]) || 0);
  } else if (classId === 9) {
    return (parseFloat(item["Performa"]) || 0) + 
           (parseFloat(item["Kostum"]) || 0) + 
           (parseFloat(item["Keunikan"]) || 0);
  } else {
    return parseFloat(item["Berat"]) || 0;
  }
}

function updatePodiumOnly(podium, classId) {
  const order = [1, 0, 2];
  order.forEach((idx, position) => {
    if (podium[idx]) {
      const p = podium[idx];
      const place = idx === 0 ? 1 : (idx === 1 ? 2 : 3);
      const total = calculateTotal(p, classId);
      
      // Update nama domba
      const nameEl = document.querySelector(`.podium-${place} .winner-name`);
      if (nameEl) {
        nameEl.innerHTML = `${place == 1 ? '🐏' : '🐑'}<br>${formatValue(p["Nama Domba/Kambing"])}`;
      }
      
      // Update detail pemilik dan registrasi
      const detailEls = document.querySelectorAll(`.podium-${place} .winner-detail`);
      if (detailEls[0]) detailEls[0].textContent = `🕴 ${formatValue(p["Nama Pemilik"])}`;
      if (detailEls[1]) detailEls[1].textContent = `No Registrasi : ${formatValue(p["No Registrasi"])}`;
      
      // Update score
      const scoreEl = document.querySelector(`.podium-${place} .winner-score`);
      if (scoreEl) {
        const scoreText = [1, 2, 3, 4, 5].includes(classId)
          ? `⚖️ ${formatValue(p["Berat"])} kg`
          : `📝 ${total.toFixed(2)}`;
        scoreEl.textContent = scoreText;
      }
    }
  });
}

function showClass(classId) {
  currentClassId = classId;

  let classData = allData.filter(item => 
    parseInt(item["Kelas"]) === classId
  );

  classData.sort((a, b) => {
    const totalA = calculateTotal(a, classId);
    const totalB = calculateTotal(b, classId);
    return totalB - totalA;
  });

  const podium = classData.slice(0, 3);

  // Render header hanya jika belum ada
  if (!document.querySelector("#content h2")) {
    let content = `
      <h2>
        <button class="toggle-menu-btn" onclick="toggleMenu()">
          ${isMenuHidden ? '📋' : '📺'}
        </button>
        <span>Kelas ${classId}: ${classNames[classId]}</span>
      </h2>
    `;
    document.getElementById("content").innerHTML = content;
    podiumRendered = false;
  } else {
    // Update hanya judul kelas
    const titleSpan = document.querySelector("#content h2 span");
    if (titleSpan) {
      titleSpan.textContent = `Kelas ${classId}: ${classNames[classId]}`;
    }
  }

  if (classData.length === 0) {
    const existingMsg = document.querySelector(".no-data");
    if (!existingMsg) {
      document.getElementById("content").innerHTML += `<p class="no-data">Belum ada peserta terdaftar</p>`;
    }
    return;
  }

  // Render podium hanya sekali per kelas
  if (!podiumRendered && podium.length > 0) {
    let podiumHTML = `<div class="podium-container">`;
    const order = [1, 0, 2];
    order.forEach(idx => {
      if (podium[idx]) {
        const p = podium[idx];
        const place = idx === 0 ? 1 : (idx === 1 ? 2 : 3);
        const cls = `podium-${place}`;
        const total = calculateTotal(p, classId);
        
        podiumHTML += `
          <div class="podium-place ${cls}">
            <div class="place-number">${place}</div>
            <div class="winner-name">${place == 1 ? '🐏' : '🐑'}<br>${formatValue(p["Nama Domba/Kambing"])}</div>
            <div class="winner-detail">🕴 ${formatValue(p["Nama Pemilik"])}</div>
            <div class="winner-detail">No Registrasi : ${formatValue(p["No Registrasi"])}</div>
            <div class="winner-score">
              ${
                [1, 2, 3, 4, 5].includes(classId)
                  ? `⚖️ ${formatValue(p["Berat"])} kg`
                  : `📝 ${total.toFixed(2)}`
              }
            </div>
          </div>
        `;
      } else {
        podiumHTML += `<div class="podium-place" style="background:#e0e0e0;color:#999;height:220px;display:flex;align-items:center;justify-content:center;">–</div>`;
      }
    });
    podiumHTML += `</div>`;
    
    document.getElementById("content").innerHTML += podiumHTML;
    podiumRendered = true;
  } else if (podiumRendered && podium.length > 0) {
    // Update podium tanpa re-render
    updatePodiumOnly(podium, classId);
  }

  // Render atau update DataTable
  if (classData.length > 0) {
    
    let headers = Object.keys(classData[0]).filter(h => h !== "Kelas");

    // Jika kelas 1–5, hanya tampilkan kolom tertentu (Rank, Nama Domba, Nama Pemilik, No Registrasi, dan Berat)
    if ([1, 2, 3, 4, 5].includes(classId)) {
      headers = ["Nama Domba/Kambing", "Nama Pemilik", "No Registrasi", "Berat"];
    }

    // Jika DataTable sudah ada, hanya update datanya
    if (dataTable && $.fn.DataTable.isDataTable('#rankTable')) {
      console.log('Updating existing DataTable...');
      
      // Clear dan tambah data baru
      dataTable.clear();
      
      classData.forEach((item, rankIdx) => {
        const rank = rankIdx + 1;
        let rowData = [rank];
        headers.forEach(h => {
          rowData.push(formatValue(item[h]));
        });
        dataTable.row.add(rowData);
      });
      
      dataTable.draw(false); // false = stay on current page
      
    } else {
      // Buat DataTable baru
      console.log('Creating new DataTable...');
      
      // Hapus container lama jika ada
      const oldContainer = document.getElementById("dataTableContainer");
      if (oldContainer) {
        oldContainer.remove();
      }
      
      // Buat container untuk table
      let tableHTML = `<div id="dataTableContainer">
        <table id="rankTable" class="rank-table display nowrap" style="width:100%">
          <thead><tr><th>Rank</th>`;
      
      headers.forEach(h => {
        tableHTML += `<th>${h}</th>`;
      });
      tableHTML += `</tr></thead><tbody>`;
      
      classData.forEach((item, rankIdx) => {
        const rank = rankIdx + 1;
        tableHTML += `<tr><td>${rank}</td>`;
        headers.forEach(h => {
          tableHTML += `<td>${formatValue(item[h])}</td>`;
        });
        tableHTML += `</tr>`;
      });
      
      tableHTML += `</tbody></table></div>`;
      
      document.getElementById("content").innerHTML += tableHTML;
      
      // Initialize DataTable dengan jQuery
      setTimeout(() => {
        if ($.fn.DataTable) {
          dataTable = $('#rankTable').DataTable({
            pageLength: 10,
            lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "Semua"]],
            ordering: false,
            searching: true,
            paging: true,
            info: true,
            autoWidth: false,
            language: {
              search: "🔍 Cari:",
              lengthMenu: "Tampilkan _MENU_ data per halaman",
              info: "Menampilkan _START_ sampai _END_ dari _TOTAL_ peserta",
              infoEmpty: "Tidak ada data tersedia",
              infoFiltered: "(disaring dari _MAX_ total peserta)",
              zeroRecords: "Tidak ditemukan data yang cocok",
              emptyTable: "Tidak ada data di tabel",
              paginate: {
                first: "⏮ Pertama",
                last: "Terakhir ⏭",
                next: "Selanjutnya ▶",
                previous: "◀ Sebelumnya"
              }
            },
            scrollX: true,
            scrollCollapse: true,
            dom: '<"top"lf>rt<"bottom"ip><"clear">',
            drawCallback: function() {
              console.log('DataTable rendered successfully');
            }
          });
          
          console.log('DataTable initialized:', dataTable);
        } else {
          console.error('DataTables library not loaded');
        }
      }, 100);
    }
  }
}

// Load jQuery dan DataTables CSS/JS
function loadLibraries() {
  // jQuery
  if (typeof jQuery === 'undefined') {
    const jqueryScript = document.createElement('script');
    jqueryScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js';
    jqueryScript.onload = () => {
      loadDataTables();
    };
    document.head.appendChild(jqueryScript);
  } else {
    loadDataTables();
  }
}

function loadDataTables() {
  // DataTables CSS
  const dtCSS = document.createElement('link');
  dtCSS.rel = 'stylesheet';
  dtCSS.href = 'https://cdn.datatables.net/1.13.7/css/jquery.dataTables.min.css';
  document.head.appendChild(dtCSS);
  
  // DataTables JS
  const dtScript = document.createElement('script');
  dtScript.src = 'https://cdn.datatables.net/1.13.7/js/jquery.dataTables.min.js';
  dtScript.onload = () => {
    console.log('DataTables loaded successfully');
    console.log('jQuery version:', $.fn.jquery);
    console.log('DataTables available:', typeof $.fn.DataTable !== 'undefined');
    fetchData();
    setInterval(fetchData, 1500);
  };
  dtScript.onerror = () => {
    console.error('Failed to load DataTables');
  };
  document.head.appendChild(dtScript);
}

// Start
loadLibraries();
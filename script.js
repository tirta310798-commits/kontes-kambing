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

    // Load saved class from localStorage
    function loadSavedClass() {
      const saved = localStorage.getItem('selectedClass');
      if (saved) {
        currentClassId = parseInt(saved);
      }
      const menuState = localStorage.getItem('menuHidden');
      if (menuState === 'true') {
        isMenuHidden = true;
      }
    }

    // Save current class to localStorage
    function saveCurrentClass() {
      localStorage.setItem('selectedClass', currentClassId.toString());
    }

    // Save menu state
    function saveMenuState() {
      localStorage.setItem('menuHidden', isMenuHidden.toString());
    }

    async function fetchData() {
      try {
        const res = await fetch(APPS_SCRIPT_URL);
        if (!res.ok) throw new Error("Gagal mengambil data");
        allData = await res.json();
        
        if (document.getElementById("classGrid").innerHTML === "") {
          loadSavedClass(); // Load saved class
          renderClassButtons();
          updateMenuVisibility(); // Set menu visibility
        }
        
        // Tambahkan efek shimmer saat update
        const contentCard = document.getElementById("content");
        contentCard.classList.add("updating");
        
        showClass(currentClassId);
        
        // Hapus efek setelah selesai
        setTimeout(() => {
          contentCard.classList.remove("updating");
        }, 1000);
        
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
          saveCurrentClass(); // Save when changed
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

      let content = `
        <h2>
          <button class="toggle-menu-btn" onclick="toggleMenu()">
            ${isMenuHidden ? '📋' : '📺'}
          </button>
          <span>Kelas ${classId}: ${classNames[classId]}</span>
        </h2>
      `;

      if (classData.length === 0) {
        content += `<p class="no-data">Belum ada peserta terdaftar</p>`;
      } else {
        if (podium.length > 0) {
          content += `<div class="podium-container">`;

          const order = [1, 0, 2];
          order.forEach(idx => {
            if (podium[idx]) {
              const p = podium[idx];
              const place = idx === 0 ? 1 : (idx === 1 ? 2 : 3);
              const cls = `podium-${place}`;
              const total = calculateTotal(p, classId);
              
              content += `
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
              content += `<div class="podium-place" style="background:#e0e0e0;color:#999;height:220px;display:flex;align-items:center;justify-content:center;">–</div>`;
            }
          });

          content += `</div>`;
        }

        if (classData.length > 0) {
          const headers = Object.keys(classData[0]).filter(h => h !== "Kelas");
          content += `<table class="rank-table"><thead><tr><th>Rank</th>`;
          headers.forEach(h => {
            content += `<th>${h}</th>`;
          });
          content += `</tr></thead><tbody>`;

          classData.forEach((item, rankIdx) => {
            const rank = rankIdx + 1;
            content += `<tr><td>${rank}</td>`;
            headers.forEach(h => {
              content += `<td>${formatValue(item[h])}</td>`;
            });
            content += `</tr>`;
          });
          content += `</tbody></table>`;
        } else {
          content += `<p style="text-align:center;color:#999;margin-top:30px;font-style:italic;">Tidak ada peserta di luar podium</p>`;
        }
      }

      document.getElementById("content").innerHTML = content;
    }

    fetchData();
    setInterval(fetchData, 1500);
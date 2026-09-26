const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwnXHfyWyvdBzdXGSd2EMaZLyjqNozIxChuihqSzwPiWbLWufkeSXteODfqjAcGLXBR/exec";

const classNames = {
  1: "Jantan Crossing Non Poel", 2: "Betina Crossing Non Poel",
  3: "Jantan Crossing P1-P2", 4: "Betina Crossing P1-P2",
  5: "Extreme Non Import", 6: "Jantan Lokal Non Poel",
  7: "Betina Lokal Non Poel", 8: "Lokal Extreme", 9: "Cempe Festival"
};

let allData = [];
let currentClassId = null; 
let lastDataSignature = null; // dipakai untuk mendeteksi apakah data kelas yang tampil benar-benar berubah

// === LOGIKA AUDIO LOKAL (musik.mp3) === //
const bgMusic = new Audio('musik.mp3'); 
bgMusic.loop = true;
bgMusic.volume = 0.4;

let isMusicPlaying = false;
// Tombol musik visual sudah dihapus (controller dibuang), tapi fungsi ini
// dibuat aman (optional chaining) kalau elemen tsb tidak ada di DOM.
const musicToggleBtn = document.getElementById('musicToggleBtn');
const musicIcon = document.getElementById('musicIcon');

function toggleMusic() {
  if (isMusicPlaying) {
    bgMusic.pause();
    isMusicPlaying = false;
    musicToggleBtn?.classList.remove('playing');
    musicIcon?.setAttribute('data-lucide', 'volume-x');
  } else {
    bgMusic.play().then(() => {
      isMusicPlaying = true;
      musicToggleBtn?.classList.add('playing');
      musicIcon?.setAttribute('data-lucide', 'volume-2');
    }).catch(error => {
      console.warn("Gagal memutar musik. Pastikan file 'musik.mp3' ada di folder ini.", error);
    });
  }
  lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', () => { 
  lucide.createIcons(); 
  fetchData();
  // Auto-refresh data dari Google Sheet setiap 5 detik agar langsung update tanpa manual refresh
  setInterval(fetchData, 5000);
});

function toggleMenu() { document.getElementById('operatorMenu').classList.toggle('open'); }

async function fetchData() {
  try {
    const res = await fetch(APPS_SCRIPT_URL);
    if (!res.ok) throw new Error("Gagal terhubung ke data server");
    allData = await res.json();
    
    if (document.getElementById("classList").innerHTML === "") renderClassSidebar();
    
    // Jika kelas sudah dipilih, perbarui tampilan HANYA jika datanya benar-benar berubah
    // (mencegah DOM di-render ulang & animasi restart tiap polling padahal datanya sama).
    if (currentClassId !== null) {
      const newSignature = JSON.stringify(
        allData.filter(item => parseInt(item["Kelas"]) === currentClassId)
      );
      if (newSignature !== lastDataSignature) {
        lastDataSignature = newSignature;
        showClass(currentClassId);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

function renderClassSidebar() {
  const list = document.getElementById("classList");
  list.innerHTML = "";
  for (let i = 1; i <= 9; i++) {
    const btn = document.createElement("button");
    btn.className = `class-btn ${i === currentClassId ? 'active' : ''}`;
    btn.innerHTML = `Kelas ${i} &mdash; ${classNames[i]}`;
    btn.onclick = () => {
      currentClassId = i;
      document.querySelectorAll(".class-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      lastDataSignature = null; // reset supaya showClass() pasti dijalankan untuk kelas baru
      showClass(i);
      
      // Musik otomatis mulai begitu kelas dipilih (dipicu dari klik = user gesture,
      // jadi tidak diblokir kebijakan autoplay browser)
      if (!isMusicPlaying) toggleMusic();
      
      toggleMenu();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    list.appendChild(btn);
  }
}

function parseVal(val) {
  if (!val) return 0;
  const parsed = parseFloat(String(val).replace(',', '.'));
  return isNaN(parsed) ? 0 : parsed;
}

// PERBAIKAN UTAMA: Deteksi otomatis kolom Juri (baik "Juri 1", "JURI I", maupun kolom nilai juri lainnya)
function calculateScore(item, isJuriClass) {
  if (isJuriClass) {
    if (item["TOTAL"] !== undefined && item["TOTAL"] !== "") return parseVal(item["TOTAL"]);
    
    // Cari semua key yang mengandung kata "juri" atau kolom angka penilaian juri
    const judgeKeys = Object.keys(item).filter(k => /juri/i.test(k) || /^juri\s*\d+/i.test(k));
    if (judgeKeys.length > 0) {
      let sum = 0;
      judgeKeys.forEach(k => {
        sum += parseVal(item[k]);
      });
      return sum;
    }
    
    // Fallback manual jika format kuncinya spesifik
    return parseVal(item["Juri 1"] || item["JURI I"] || item["Juri1"]) + 
           parseVal(item["Juri 2"] || item["JURI II"] || item["Juri2"]) + 
           parseVal(item["Juri 3"] || item["JURI III"] || item["Juri3"]);
  } else {
    return parseVal(item["BERAT"] || item["Berat"]);
  }
}

function showClass(classId) {
  document.getElementById("displayClassName").textContent = `KELAS ${classId}: ${classNames[classId]}`;

  const isJuriClass = [6, 7, 9].includes(classId);
  let classData = allData.filter(item => parseInt(item["Kelas"]) === classId);
  classData.sort((a, b) => calculateScore(b, isJuriClass) - calculateScore(a, isJuriClass));
  
  const podiumDiv = document.getElementById("podiumShowcase");

  if (classData.length === 0) {
    podiumDiv.innerHTML = `<div style="color:var(--text-muted); font-size:16px;">Tidak ada data peserta untuk kelas ini.</div>`;
    document.getElementById("dataTableContainer").innerHTML = "";
    return;
  }

  const podium = classData.slice(0, 3);
  const order = [1, 0, 2]; 
  let htmlPodium = '';
  
  // Podium sekarang langsung ditampilkan penuh (juara 3, 2, 1 sekaligus),
  // tidak ada lagi state "concealed" yang menunggu klik controller.
  order.forEach(idx => {
    if (podium[idx]) {
      const p = podium[idx];
      const rank = idx + 1;
      const nama = p["NAMA DOMBA"] || p["Nama Domba/Kambing"] || p["Nama Domba"] || "-";
      const farm = p["NAMA FARM"] || p["Nama Pemilik"] || "-";
      const score = calculateScore(p, isJuriClass);
      
      const scoreLabel = isJuriClass ? "Poin" : "kg";
      let icon = rank === 1 ? 'crown' : 'medal';

      htmlPodium += `
        <div class="pedestal rank-${rank}" id="podium-rank-${rank}">
          <div class="pedestal-info">
            <div class="pedestal-rank-icon">
              <i data-lucide="${icon}" style="width:20px; height:20px;"></i>
            </div>
            <div class="pedestal-info-inner">
              <div class="winner-name">${nama}</div>
              <div class="winner-farm">${farm}</div>
              <div class="winner-score">${score.toFixed(isJuriClass ? 2 : 1)} <span style="font-size:12px; opacity:0.6;">${scoreLabel}</span></div>
            </div>
          </div>
          <div class="pedestal-base">
            <div class="pedestal-number">${rank}</div>
          </div>
        </div>
      `;
    }
  });
  
  podiumDiv.innerHTML = htmlPodium;

  let tableHtml = `
    <table class="rank-table">
      <thead>
        <tr>
          <th style="width: 60px;">RK</th>
          <th>No. Reg</th>
          <th>Nama Domba</th>
          <th>Farm / Pemilik</th>
  `;

  if (isJuriClass) {
    tableHtml += `<th>Juri 1</th><th>Juri 2</th><th>Juri 3</th><th style="color:var(--text-main);">TOTAL</th>`;
  } else {
    tableHtml += `<th style="color:var(--text-main);">BERAT</th>`;
  }
  tableHtml += `</tr></thead><tbody>`;

  classData.forEach((item, index) => {
    const rank = index + 1;
    const noReg = item["NO"] || item["No Registrasi"] || item["No"] || "-";
    const nama = item["NAMA DOMBA"] || item["Nama Domba/Kambing"] || item["Nama Domba"] || "-";
    const farm = item["NAMA FARM"] || item["Nama Pemilik"] || "-";

    tableHtml += `
      <tr>
        <td style="color:var(--text-muted); font-family:monospace;">${rank}</td>
        <td>${noReg}</td>
        <td style="color:var(--text-main); font-weight:600;">${nama}</td>
        <td>${farm}</td>
    `;
    if (isJuriClass) {
      const j1 = item["Juri 1"] || item["JURI I"] || item["Juri1"] || '-';
      const j2 = item["Juri 2"] || item["JURI II"] || item["Juri2"] || '-';
      const j3 = item["Juri 3"] || item["JURI III"] || item["Juri3"] || '-';
      const totalScore = calculateScore(item, true);
      tableHtml += `<td>${j1}</td><td>${j2}</td><td>${j3}</td><td style="color:var(--text-main); font-weight:700;">${totalScore.toFixed(2)}</td>`;
    } else {
      tableHtml += `<td style="color:var(--text-main); font-weight:700;">${calculateScore(item, false).toFixed(1)} kg</td>`;
    }
    tableHtml += `</tr>`;
  });
  
  tableHtml += `</tbody></table>`;
  document.getElementById("dataTableContainer").innerHTML = tableHtml;

  lucide.createIcons();
}

document.addEventListener('keydown', (e) => {
  if (e.target.tagName.toLowerCase() === 'input') return;
  if (e.key.toLowerCase() === 'm') toggleMusic();
});
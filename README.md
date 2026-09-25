# Kontes Domba — Web App

Ringkasan:
- Aplikasi menampilkan ranking peserta kontes domba berdasarkan data dari CSV / Google Sheets.
- Perubahan utama: dukungan format baru dengan kolom `Juri1..JuriN` untuk kelas 6,7,9; tampilan UI dan podium diperbarui.

Format data (Google Sheets / CSV):
- Header minimum (baris pertama): `Nama Domba/Kambing`, `Nama Pemilik`, `Kelas`, `No Registrasi`.
- Untuk kelas yang dinilai oleh juri (6,7,9), tambahkan kolom `Juri1`, `Juri2`, `Juri3` (atau kolom angka/unnamed berisi nilai di trailing columns). Skrip otomatis akan mendeteksi kolom yang berisi angka sebagai kolom juri jika header tidak bernama `Juri...`.
- Kolom lain yang didukung: `Berat`, `Tinggi`, `Performa`, `Kesehatan`, `Kostum`, `Keunikan`, `Asal`.

Cara menjalankan (preview lokal):
1. Buka terminal di folder proyek (`e:\Kontes`).
2. Jalankan server statis sederhana:
```powershell
# Jika ada Python 3
python -m http.server 8000

# atau jika pakai Node (npm tersedia)
npx http-server . -p 8000
```
3. Buka browser: `http://localhost:8000`

Catatan teknis:
- `script.js`:
  - Mendeteksi kolom `Juri` (case-insensitive) dan menjumlahkan nilai untuk kelas 6,7,9.
  - Jika tidak ada header juri, deteksi kolom numerik trailing dan gunakan sebagai juri.
  - Menampilkan kolom per-juri dan `Total Juri` pada tabel ketika terdeteksi.
- `style.css` diperbarui untuk tampilan lebih modern (Inter font + Font Awesome + podium redesign).

Jika mau, saya bisa melakukan:
- Menambahkan tombol ekspor CSV bersih dari UI.
- Menambahkan commit Git (jika Anda mau saya buat commit otomatis).

Beritahu saya langkah berikutnya yang Anda inginkan.

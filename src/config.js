export const API_URL = "PASTE_URL_APPS_SCRIPT_ANDA_DISINI";
export const SIMPANAN_POKOK = 1000000;
export const SIMPANAN_WAJIB = 10000;
export const BULAN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agt","Sep","Okt","Nov","Des"];
export const TAHUN_AKTIF = 2026;
export const STOK_WARNING = 5;
export const POIN_PER_RP = 10000;
export const KATEGORI_PENGELUARAN = ["Sewa tempat","Listrik & air","Transportasi","Perlengkapan","Gaji","Pembelian stok","Lain-lain"];
export const OPSI_ANGSURAN = [
  { label: "Lunas langsung", kali: 1, perBulan: SIMPANAN_POKOK },
  { label: "Angsur 2x", kali: 2, perBulan: SIMPANAN_POKOK / 2 },
  { label: "Angsur 4x", kali: 4, perBulan: SIMPANAN_POKOK / 4 },
];
export const adminUser = { id: "ADMIN", nama: "Administrator", role: "admin", pin: "426580" };

export const fmt = (n) => new Intl.NumberFormat("id-ID").format(n);
export const tglNow = () => new Date().toISOString().split("T")[0];
export const waktuNow = () => new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

export function compressImage(file, maxW = 400, quality = 0.4) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = Math.min(maxW / img.width, maxW / img.height, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

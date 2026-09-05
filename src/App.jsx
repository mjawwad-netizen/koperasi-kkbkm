import { useState, useEffect, useCallback, useMemo, useRef } from "react";

const API_URL = "https://script.google.com/macros/s/AKfycbzfPOY00dvqUkcG-5ef9eYWGbUT9LivtCp3nmTwdVVypMsAQxsWuUvTjv6J5jsVkDYF/exec";

const SIMPANAN_POKOK = 1000000;
const SIMPANAN_WAJIB = 10000;
const BULAN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agt","Sep","Okt","Nov","Des"];
const TAHUN_AKTIF = 2026;
const STOK_WARNING = 5;
const KATEGORI_PENGELUARAN = ["Sewa tempat","Listrik & air","Transportasi","Perlengkapan","Gaji","Pembelian stok","Lain-lain"];
const OPSI_ANGSURAN = [
  { label: "Lunas langsung", kali: 1, perBulan: SIMPANAN_POKOK },
  { label: "Angsur 2x", kali: 2, perBulan: SIMPANAN_POKOK / 2 },
  { label: "Angsur 4x", kali: 4, perBulan: SIMPANAN_POKOK / 4 },
];
const POIN_PER_RP = 10000; // 1 poin per Rp 10.000 belanja

const adminUser = { id: "ADMIN", nama: "Administrator", role: "admin", pin: "426580" };
const fmt = (n) => new Intl.NumberFormat("id-ID").format(n);
const tglNow = () => new Date().toISOString().split("T")[0];
const waktuNow = () => new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
const STORAGE_KEY = "koperasi-data-v5";

// Compress image to base64
function compressImage(file, maxW = 400, quality = 0.4) {
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

export default function KoperasiApp() {
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [simpananPokok, setSimpananPokok] = useState({});
  const [simpananWajib, setSimpananWajib] = useState({});
  const [barang, setBarang] = useState([]);
  const [transaksi, setTransaksi] = useState([]);
  const [arusKas, setArusKas] = useState([]);
  const [pembayaran, setPembayaran] = useState([]);
  const [shuConfig, setShuConfig] = useState({ pctTransaksi: 40, pctSimpanan: 20, pctCadangan: 40 });
  const [tab, setTab] = useState("anggota");
  const [subTab, setSimpananTab] = useState("wajib");
  const [kasirTab, setKasirTab] = useState("kasir");
  const [laporanTab, setLaporanTab] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [searchBarang, setSearchBarang] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [detailMember, setDetailMember] = useState(null);
  const [showBarangForm, setShowBarangForm] = useState(false);
  const [editBarang, setEditBarang] = useState(null);
  const [showRestok, setShowRestok] = useState(null);
  const [cart, setCart] = useState([]);
  const [showStruk, setShowStruk] = useState(null);
  const [showHistori, setShowHistori] = useState(false);
  const [showPengeluaran, setShowPengeluaran] = useState(false);
  const [showBayarForm, setShowBayarForm] = useState(false);
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [bayarNominal, setBayarNominal] = useState("");
  const [filterBulan, setFilterBulan] = useState(new Date().getMonth());
  const [showRegister, setShowRegister] = useState(false);
  const [regData, setRegData] = useState({ nama: "", alamat: "", hp: "", pin: "", pinConfirm: "", angsuran: 0 });
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  // Kasir: pembeli
  const [pembeliType, setPembeliType] = useState("umum"); // "anggota" | "umum"
  const [pembeliAnggotaId, setPembeliAnggotaId] = useState("");
  const [pembeliNama, setPembeliNama] = useState("");
  const [showBuktiImg, setShowBuktiImg] = useState(null);

  useEffect(() => {
    try { const s = localStorage.getItem("koperasi-user"); if (s) setUser(JSON.parse(s)); } catch (e) {}
    (async () => {
      try {
        const res = await fetch(API_URL); const json = await res.json();
        if (json.ok && json.data) {
          const d = json.data;
          if (d.members?.length) setMembers(d.members);
          if (d.simpananPokok) setSimpananPokok(d.simpananPokok);
          if (d.simpananWajib) setSimpananWajib(d.simpananWajib);
          if (d.barang?.length) setBarang(d.barang);
          if (d.transaksi?.length) setTransaksi(d.transaksi);
          if (d.arusKas?.length) setArusKas(d.arusKas);
          if (d.pembayaran?.length) setPembayaran(d.pembayaran);
          if (d.shuConfig) setShuConfig(d.shuConfig);
        }
      } catch (e) {
        try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) { const d = JSON.parse(raw); if (d.members) setMembers(d.members); if (d.simpananPokok) setSimpananPokok(d.simpananPokok); if (d.simpananWajib) setSimpananWajib(d.simpananWajib); if (d.barang) setBarang(d.barang); if (d.transaksi) setTransaksi(d.transaksi); if (d.arusKas) setArusKas(d.arusKas); if (d.pembayaran) setPembayaran(d.pembayaran); if (d.shuConfig) setShuConfig(d.shuConfig); } } catch (e2) {}
      }
      setLoaded(true);
    })();
  }, []);

  const save = useCallback((m, sp, sw, br, tr, ak, pb, sc) => {
    const data = { members: m, simpananPokok: sp, simpananWajib: sw, barang: br, transaksi: tr, arusKas: ak, pembayaran: pb, shuConfig: sc };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
    fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ action: "saveAll", data }) }).catch(e => console.error("Sync:", e));
  }, []);

  const sv = (m, sp, sw, br, tr, ak, pb) => save(m || members, sp || simpananPokok, sw || simpananWajib, br || barang, tr || transaksi, ak || arusKas, pb || pembayaran, shuConfig);

  const addKas = useCallback((tipe, kategori, keterangan, jumlah, curAk) => {
    return [{ id: `AK-${Date.now()}-${Math.random().toString(36).substr(2,4)}`, tgl: tglNow(), waktu: waktuNow(), tipe, kategori, keterangan, jumlah }, ...curAk];
  }, []);

  const handleLogin = () => {
    setLoginError("");
    if (loginId.toUpperCase() === "ADMIN" && loginPw === adminUser.pin) { setUser(adminUser); localStorage.setItem("koperasi-user", JSON.stringify(adminUser)); return; }
    const m = members.find(x => x.hp === loginId || x.id.toUpperCase() === loginId.toUpperCase());
    if (m && m.pin === loginPw) { if (m.status === "non-aktif") { setLoginError("Akun tidak aktif"); return; } setUser(m); localStorage.setItem("koperasi-user", JSON.stringify(m)); }
    else { setLoginError("No. HP/ID atau PIN salah"); }
  };
  const handleLogout = () => { setUser(null); localStorage.removeItem("koperasi-user"); };

  const nextId = () => { if (!members.length) return "KKBKM-001"; const nums = members.map(m => parseInt(m.id.split("-")[1])||0); return `KKBKM-${String(Math.max(...nums)+1).padStart(3,"0")}`; };
  const nextBarangId = () => { if (!barang.length) return "B001"; const nums = barang.map(b => parseInt(b.id.replace("B",""))||0); return `B${String(Math.max(...nums)+1).padStart(3,"0")}`; };

  const handleRegister = () => {
    setRegError(""); setRegSuccess("");
    if (!regData.nama.trim()) { setRegError("Nama wajib diisi"); return; }
    if (!regData.hp.trim()) { setRegError("No. HP wajib diisi"); return; }
    if (!regData.pin || regData.pin.length < 4) { setRegError("PIN minimal 4 digit"); return; }
    if (regData.pin !== regData.pinConfirm) { setRegError("PIN tidak cocok"); return; }
    if (members.find(m => m.hp === regData.hp)) { setRegError("No. HP sudah terdaftar"); return; }
    const id = nextId();
    const newM = { id, nama: regData.nama, alamat: regData.alamat, hp: regData.hp, pin: regData.pin, tglMasuk: tglNow(), status: "aktif", role: "anggota", poin: 0 };
    const um = [...members, newM];
    const opsi = OPSI_ANGSURAN[regData.angsuran];
    const up = { ...simpananPokok, [id]: { lunas: false, tgl: null, skemaAngsur: opsi.kali, terbayar: 0 } };
    setMembers(um); setSimpananPokok(up); sv(um, up);
    setRegSuccess(`Berhasil! No. anggota: ${id}. Login dengan No. HP + PIN.`);
    setRegData({ nama: "", alamat: "", hp: "", pin: "", pinConfirm: "", angsuran: 0 });
  };

  const addMember = (data) => { const newM = { ...data, id: nextId(), tglMasuk: tglNow(), status: "aktif", pin: "1234", role: "anggota", poin: 0 }; const u = [...members, newM]; setMembers(u); sv(u); setShowForm(false); };
  const updateMember = (data) => { const u = members.map(m => m.id === data.id ? { ...m, ...data } : m); setMembers(u); sv(u); setEditMember(null); };
  const toggleStatus = (id) => { const u = members.map(m => m.id === id ? { ...m, status: m.status === "aktif" ? "non-aktif" : "aktif" } : m); setMembers(u); sv(u); };

  const bayarPokok = (id) => {
    const u = { ...simpananPokok, [id]: { ...simpananPokok[id], lunas: true, tgl: tglNow() } };
    const nama = members.find(m => m.id === id)?.nama || id;
    const ak = addKas("masuk", "Simpanan pokok", `${nama} (${id})`, SIMPANAN_POKOK, arusKas);
    setSimpananPokok(u); setArusKas(ak); sv(null, u, null, null, null, ak);
  };
  const toggleWajib = (id, bulanIdx) => {
    const cur = simpananWajib[id] || []; const nama = members.find(m => m.id === id)?.nama || id;
    let u, ak;
    if (cur.includes(bulanIdx)) { u = { ...simpananWajib, [id]: cur.filter(b => b !== bulanIdx) }; ak = addKas("keluar", "Koreksi simpanan wajib", `Batal: ${nama} - ${BULAN[bulanIdx]}`, SIMPANAN_WAJIB, arusKas); }
    else { u = { ...simpananWajib, [id]: [...cur, bulanIdx].sort((a,b) => a-b) }; ak = addKas("masuk", "Simpanan wajib", `${nama} - ${BULAN[bulanIdx]}`, SIMPANAN_WAJIB, arusKas); }
    setSimpananWajib(u); setArusKas(ak); sv(null, null, u, null, null, ak);
  };

  const addBarang = (data) => { const u = [...barang, { ...data, id: nextBarangId() }]; setBarang(u); sv(null, null, null, u); setShowBarangForm(false); };
  const updateBarang = (data) => { const u = barang.map(b => b.id === data.id ? { ...b, ...data } : b); setBarang(u); sv(null, null, null, u); setEditBarang(null); };
  const restokBarang = (id, qty, totalBiaya) => {
    const u = barang.map(b => b.id === id ? { ...b, stok: b.stok + qty } : b); const item = barang.find(b => b.id === id);
    const ak = addKas("keluar", "Pembelian stok", `Restok: ${item?.nama} (${qty} pcs)`, totalBiaya, arusKas);
    setBarang(u); setArusKas(ak); sv(null, null, null, u, null, ak); setShowRestok(null);
  };

  const addToCart = (item) => { if (item.stok <= 0) return; const ex = cart.find(c => c.id === item.id); if (ex) { if (ex.qty >= item.stok) return; setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)); } else { setCart([...cart, { ...item, qty: 1 }]); } };
  const updateCartQty = (id, delta) => { const item = barang.find(b => b.id === id); setCart(cart.map(c => { if (c.id !== id) return c; const nq = c.qty + delta; if (nq <= 0) return null; if (nq > item.stok) return c; return { ...c, qty: nq }; }).filter(Boolean)); };
  const removeFromCart = (id) => setCart(cart.filter(c => c.id !== id));
  const cartTotal = cart.reduce((s, c) => s + c.hargaJual * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const prosesTransaksi = () => {
    const nominal = parseInt(bayarNominal.replace(/\D/g, "")) || 0;
    if (nominal < cartTotal) return;
    const pembeli = pembeliType === "anggota" ? { type: "anggota", id: pembeliAnggotaId, nama: members.find(m => m.id === pembeliAnggotaId)?.nama || "" } : { type: "umum", id: null, nama: pembeliNama || "Umum" };
    const trx = { id: `TRX-${Date.now()}`, tgl: tglNow(), waktu: waktuNow(), items: cart.map(c => ({ id: c.id, nama: c.nama, harga: c.hargaJual, hargaBeli: c.hargaBeli, qty: c.qty, subtotal: c.hargaJual * c.qty })), total: cartTotal, bayar: nominal, kembalian: nominal - cartTotal, pembeli };
    const updatedBarang = barang.map(b => { const ci = cart.find(c => c.id === b.id); return ci ? { ...b, stok: b.stok - ci.qty } : b; });
    const updatedTrx = [trx, ...transaksi];
    const ak = addKas("masuk", "Penjualan", `${pembeli.nama} · ${cart.length} jenis`, cartTotal, arusKas);
    // Tambah poin anggota
    let updatedMembers = members;
    if (pembeli.type === "anggota" && pembeli.id) {
      const poinBaru = Math.floor(cartTotal / POIN_PER_RP);
      updatedMembers = members.map(m => m.id === pembeli.id ? { ...m, poin: (m.poin || 0) + poinBaru } : m);
      setMembers(updatedMembers);
    }
    setBarang(updatedBarang); setTransaksi(updatedTrx); setArusKas(ak); setCart([]); setBayarNominal(""); setPembeliType("umum"); setPembeliAnggotaId(""); setPembeliNama("");
    save(updatedMembers, simpananPokok, simpananWajib, updatedBarang, updatedTrx, ak, pembayaran, shuConfig);
    setShowStruk(trx);
  };

  const addPengeluaran = (data) => { const ak = addKas("keluar", data.kategori, data.keterangan, parseInt(data.jumlah), arusKas); setArusKas(ak); sv(null, null, null, null, null, ak); setShowPengeluaran(false); };

  const currentMonth = new Date().getMonth();
  const isAdmin = user?.role === "admin";
  const isPengelola = user?.role === "pengelola";
  const isAnggota = user?.role === "anggota";
  useEffect(() => { if (isPengelola) setTab("kasir"); }, [user]);

  const stats = useMemo(() => {
    const activeM = members.filter(m => m.status === "aktif");
    const tPokok = Object.values(simpananPokok).filter(s => s.lunas).length * SIMPANAN_POKOK;
    const tWajib = Object.values(simpananWajib).reduce((s, a) => s + a.length * SIMPANAN_WAJIB, 0);
    const todayTrx = transaksi.filter(t => t.tgl === tglNow());
    const todayOmzet = todayTrx.reduce((s, t) => s + t.total, 0);
    const lowStock = barang.filter(b => b.stok <= STOK_WARNING);
    const bulanIni = arusKas.filter(a => { const d = new Date(a.tgl); return d.getMonth() === filterBulan && d.getFullYear() === TAHUN_AKTIF; });
    const totalMasuk = bulanIni.filter(a => a.tipe === "masuk").reduce((s, a) => s + a.jumlah, 0);
    const totalKeluar = bulanIni.filter(a => a.tipe === "keluar").reduce((s, a) => s + a.jumlah, 0);
    const allMasuk = arusKas.filter(a => a.tipe === "masuk").reduce((s, a) => s + a.jumlah, 0);
    const allKeluar = arusKas.filter(a => a.tipe === "keluar").reduce((s, a) => s + a.jumlah, 0);
    const saldoKas = allMasuk - allKeluar;
    // Laba kotor dari penjualan
    const labaKotor = transaksi.reduce((s, t) => s + t.items.reduce((si, it) => si + (it.harga - (it.hargaBeli || 0)) * it.qty, 0), 0);
    const monthlyProfit = transaksi.filter(t => { const d = new Date(t.tgl); return d.getMonth() === filterBulan && d.getFullYear() === TAHUN_AKTIF; }).reduce((s, t) => s + t.items.reduce((si, it) => si + (it.harga - (it.hargaBeli || 0)) * it.qty, 0), 0);
    // SHU
    const totalPoinAnggota = members.reduce((s, m) => s + (m.poin || 0), 0);
    const totalSimpananAnggota = members.reduce((s, m) => { const w = simpananWajib[m.id] || []; const p = simpananPokok[m.id]; return s + w.length * SIMPANAN_WAJIB + (p?.lunas ? SIMPANAN_POKOK : 0); }, 0);
    return { activeM, tPokok, tWajib, todayTrx, todayOmzet, lowStock, bulanIni, totalMasuk, totalKeluar, saldoKas, labaKotor, monthlyProfit, totalPoinAnggota, totalSimpananAnggota };
  }, [members, simpananPokok, simpananWajib, transaksi, barang, arusKas, filterBulan]);

  // SHU per anggota
  const hitungSHU = (memberId) => {
    const m = members.find(x => x.id === memberId);
    if (!m) return 0;
    const laba = stats.labaKotor;
    const shuTransaksi = laba * (shuConfig.pctTransaksi / 100);
    const shuSimpanan = laba * (shuConfig.pctSimpanan / 100);
    const poinM = m.poin || 0;
    const simpM = (simpananWajib[m.id] || []).length * SIMPANAN_WAJIB + (simpananPokok[m.id]?.lunas ? SIMPANAN_POKOK : 0);
    const bagianTrx = stats.totalPoinAnggota > 0 ? (poinM / stats.totalPoinAnggota) * shuTransaksi : 0;
    const bagianSimp = stats.totalSimpananAnggota > 0 ? (simpM / stats.totalSimpananAnggota) * shuSimpanan : 0;
    return Math.round(bagianTrx + bagianSimp);
  };

  const S = {
    app: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', maxWidth: 480, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", background: "#FDF8F0", color: "#1E293B" },
    header: { background: "#2563EB", color: "white", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    headerTitle: { fontSize: 18, fontWeight: 600, letterSpacing: 0.5 },
    content: { flex: 1, padding: "12px 12px 80px", overflowY: "auto" },
    bottomNav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, display: "grid", background: "white", borderTop: "1px solid #E2E8F0", paddingBottom: 8, zIndex: 10 },
    navItem: (a) => ({ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "8px 0 4px", fontSize: 11, color: a ? "#2563EB" : "#94A3B8", cursor: "pointer", background: "none", border: "none", fontWeight: a ? 600 : 400 }),
    card: { background: "white", borderRadius: 12, padding: "12px 14px", border: "1px solid #E8E4DC", marginBottom: 8 },
    statCard: { background: "white", borderRadius: 10, padding: "10px 14px", border: "1px solid #E8E4DC", flex: 1 },
    btn: (c = "#2563EB") => ({ background: c, color: c === "transparent" ? "#2563EB" : "white", border: c === "transparent" ? "1.5px solid #2563EB" : "none", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 500, cursor: "pointer", width: "100%" }),
    btnSm: (c = "#2563EB") => ({ background: c, color: "white", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer" }),
    btnOutline: { background: "transparent", color: "#2563EB", border: "1.5px solid #2563EB", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer" },
    input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 14, boxSizing: "border-box", background: "white", color: "#1E293B" },
    badge: (t) => ({ fontSize: 11, padding: "3px 10px", borderRadius: 12, fontWeight: 500, ...(t === "aktif" || t === "masuk" ? { background: "#DCFCE7", color: "#166534" } : t === "non-aktif" || t === "keluar" ? { background: "#FEE2E2", color: "#991B1B" } : { background: "#FEF3C7", color: "#92400E" }) }),
    fab: { position: "fixed", bottom: 76, right: "calc(50% - 210px)", width: 48, height: 48, borderRadius: "50%", background: "#2563EB", color: "white", border: "none", fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(37,99,235,0.3)", zIndex: 5 },
    sectionTitle: { fontSize: 13, fontWeight: 600, color: "#64748B", marginBottom: 8, marginTop: 12 },
    avatar: (c = "#2563EB") => ({ width: 38, height: 38, borderRadius: "50%", background: c, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }),
    monthDot: (s) => ({ width: 26, height: 22, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 600, cursor: s === "future" ? "default" : "pointer", ...(s === "paid" ? { background: "#DCFCE7", color: "#166534" } : s === "unpaid" ? { background: "#FEE2E2", color: "#991B1B" } : { background: "#F1F5F9", color: "#94A3B8" }) }),
    tabBtn: (a) => ({ flex: 1, padding: "8px 0", textAlign: "center", fontSize: 13, fontWeight: a ? 600 : 400, color: a ? "#2563EB" : "#64748B", background: "none", border: "none", borderBottom: `2px solid ${a ? "#2563EB" : "transparent"}`, cursor: "pointer" }),
    modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 20 },
    modalContent: { background: "#FDF8F0", borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto", padding: "20px 16px 32px" },
    modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    closeBtn: { background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748B" },
    qtyBtn: { width: 28, height: 28, borderRadius: 6, background: "#2563EB", color: "white", border: "none", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  };

  if (!loaded) return <div style={{ ...S.app, alignItems: "center", justifyContent: "center" }}><p style={{ color: "#64748B" }}>Memuat data...</p></div>;

  // =================== LOGIN & REGISTER ===================
  if (!user) {
    if (showRegister) return (
      <div style={{ ...S.app, padding: 24 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}><img src="/logo.png" alt="BAZARA" style={{ width: 180 }} /></div>
        <div style={{ fontSize: 18, fontWeight: 700, textAlign: "center", marginBottom: 16, color: "#2563EB" }}>Pendaftaran Anggota</div>
        <div style={{ width: "100%", maxWidth: 360, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
          <input style={S.input} placeholder="Nama lengkap" value={regData.nama} onChange={e => setRegData({...regData, nama: e.target.value})} />
          <input style={S.input} placeholder="Alamat" value={regData.alamat} onChange={e => setRegData({...regData, alamat: e.target.value})} />
          <input style={S.input} placeholder="No. HP" value={regData.hp} onChange={e => setRegData({...regData, hp: e.target.value})} />
          <input style={S.input} placeholder="Buat PIN (min 4 digit)" type="password" inputMode="numeric" value={regData.pin} onChange={e => setRegData({...regData, pin: e.target.value.replace(/\D/g,"")})} maxLength={6} />
          <input style={S.input} placeholder="Ulangi PIN" type="password" inputMode="numeric" value={regData.pinConfirm} onChange={e => setRegData({...regData, pinConfirm: e.target.value.replace(/\D/g,"")})} maxLength={6} />
          <div style={{ fontSize: 13, fontWeight: 600, color: "#64748B", marginTop: 4 }}>Pembayaran simpanan pokok (Rp {fmt(SIMPANAN_POKOK)})</div>
          {OPSI_ANGSURAN.map((o, i) => (<label key={i} style={{ ...S.card, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 0, border: regData.angsuran === i ? "2px solid #2563EB" : "1px solid #E8E4DC" }}><input type="radio" name="angsuran" checked={regData.angsuran === i} onChange={() => setRegData({...regData, angsuran: i})} /><div><div style={{ fontSize: 14, fontWeight: 500 }}>{o.label}</div><div style={{ fontSize: 12, color: "#64748B" }}>Rp {fmt(o.perBulan)}{o.kali > 1 ? ` × ${o.kali} bulan` : ""}</div></div></label>))}
          {regError && <p style={{ color: "#DC2626", fontSize: 12, margin: 0 }}>{regError}</p>}
          {regSuccess && <div style={{ background: "#DCFCE7", color: "#166534", padding: 12, borderRadius: 8, fontSize: 13 }}>{regSuccess}</div>}
          <button style={S.btn()} onClick={handleRegister}>Daftar</button>
          <button style={S.btn("transparent")} onClick={() => { setShowRegister(false); setRegSuccess(""); setRegError(""); }}>Kembali ke login</button>
        </div>
      </div>
    );
    return (
      <div style={{ ...S.app, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}><img src="/logo.png" alt="BAZARA" style={{ width: 200 }} /></div>
        <div style={{ width: "100%", maxWidth: 320 }}>
          <input style={{ ...S.input, marginBottom: 10 }} placeholder="No. HP atau Nomor Anggota" value={loginId} onChange={e => setLoginId(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
          <input style={{ ...S.input, marginBottom: 8 }} type="password" placeholder="PIN" inputMode="numeric" value={loginPw} onChange={e => setLoginPw(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
          {loginError && <p style={{ color: "#DC2626", fontSize: 12, margin: "0 0 8px" }}>{loginError}</p>}
          <button style={{ ...S.btn(), marginBottom: 10 }} onClick={handleLogin}>Masuk</button>
          <button style={S.btn("transparent")} onClick={() => setShowRegister(true)}>Daftar jadi anggota</button>
        </div>
      </div>
    );
  }

  // =================== MEMBER VIEW ===================
  if (isAnggota) {
    const me = members.find(m => m.id === user.id);
    const pokok = simpananPokok[user.id]; const wajib = simpananWajib[user.id] || [];
    const totalWajib = wajib.length * SIMPANAN_WAJIB;
    const mySHU = hitungSHU(user.id);
    return (
      <div style={S.app}>
        <div style={S.header}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><img src="/logo.png" alt="BAZARA" style={{ height: 28 }} /><div style={{ fontSize: 15, fontWeight: 600 }}>Hai, {me?.nama?.split(" ")[0]}</div></div><button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Keluar</button></div>
        <div style={S.content}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Simpanan pokok</div><div style={{ fontSize: 18, fontWeight: 600, color: pokok?.lunas ? "#16A34A" : "#DC2626", marginTop: 2 }}>{pokok?.lunas ? "Lunas" : "Belum"}</div></div>
            <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Simpanan wajib</div><div style={{ fontSize: 18, fontWeight: 600, color: "#2563EB", marginTop: 2 }}>Rp {fmt(totalWajib)}</div></div>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Poin belanja</div><div style={{ fontSize: 18, fontWeight: 600, color: "#F59E0B", marginTop: 2 }}>{me?.poin || 0}</div></div>
            <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Estimasi SHU</div><div style={{ fontSize: 18, fontWeight: 600, color: "#16A34A", marginTop: 2 }}>Rp {fmt(mySHU)}</div></div>
          </div>
          <div style={S.card}><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Simpanan wajib {TAHUN_AKTIF}</div><div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{BULAN.map((b, i) => (<div key={i} style={S.monthDot(wajib.includes(i) ? "paid" : i > currentMonth ? "future" : "unpaid")}>{b.charAt(0)}</div>))}</div><div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 11, color: "#64748B" }}><span>🟢 Lunas</span><span>🔴 Belum</span><span>⚪ Belum jatuh tempo</span></div></div>
          <div style={S.card}><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Data pribadi</div>{[["Nama", me?.nama], ["No. Anggota", me?.id], ["Alamat", me?.alamat], ["No. HP", me?.hp], ["Tgl masuk", me?.tglMasuk]].map(([l,v]) => (<div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F1F5F9", fontSize: 13 }}><span style={{ color: "#64748B" }}>{l}</span><span style={{ fontWeight: 500 }}>{v}</span></div>))}</div>
          <div style={{ ...S.card, textAlign: "center" }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Total simpanan</div><div style={{ fontSize: 24, fontWeight: 700, color: "#2563EB" }}>Rp {fmt((pokok?.lunas ? SIMPANAN_POKOK : 0) + totalWajib)}</div></div>
          <button style={{ ...S.btn(), marginTop: 8 }} onClick={() => setShowBayarForm(true)}>Kirim bukti pembayaran</button>
          {pembayaran.filter(p => p.anggotaId === user.id).length > 0 && (<><div style={S.sectionTitle}>Riwayat pembayaran</div>{pembayaran.filter(p => p.anggotaId === user.id).slice(0, 10).map(p => (<div key={p.id} style={{ ...S.card, borderLeft: `3px solid ${p.status === "diterima" ? "#16A34A" : p.status === "ditolak" ? "#DC2626" : "#F59E0B"}` }}><div style={{ display: "flex", justifyContent: "space-between" }}><div><div style={{ fontSize: 13, fontWeight: 600 }}>{p.jenis}</div><div style={{ fontSize: 11, color: "#64748B" }}>{p.tgl}</div></div><div style={{ textAlign: "right" }}><div style={{ fontSize: 14, fontWeight: 700 }}>Rp {fmt(p.jumlah)}</div><span style={S.badge(p.status === "diterima" ? "aktif" : p.status === "ditolak" ? "non-aktif" : "low")}>{p.status}</span></div></div></div>))}</>)}
        </div>
        {showBayarForm && (() => {
          const BF = () => {
            const [jenis, setJenis] = useState("Simpanan wajib");
            const [jumlah, setJumlah] = useState(""); const [buktiText, setBuktiText] = useState(""); const [buktiImg, setBuktiImg] = useState(null);
            const [ket, setKet] = useState(""); const [err, setErr] = useState(""); const [done, setDone] = useState(false); const [uploading, setUploading] = useState(false);
            const fileRef = useRef(null);
            const handleFile = async (e) => { const f = e.target.files?.[0]; if (!f) return; setUploading(true); const b64 = await compressImage(f); setBuktiImg(b64); setUploading(false); };
            const kirim = () => {
              if (!jumlah || parseInt(jumlah) <= 0) { setErr("Jumlah harus diisi"); return; }
              if (!buktiText.trim() && !buktiImg) { setErr("Upload bukti atau isi no. referensi"); return; }
              const newP = { id: `PB-${Date.now()}`, anggotaId: user.id, tgl: tglNow(), waktu: waktuNow(), jenis, jumlah: parseInt(jumlah), bukti: buktiText, buktiImg: buktiImg || "", status: "menunggu", keterangan: ket || jenis };
              const u = [newP, ...pembayaran]; setPembayaran(u); sv(null, null, null, null, null, null, u); setDone(true);
            };
            if (done) return (<div style={S.modal} onClick={() => setShowBayarForm(false)}><div style={{ ...S.modalContent, textAlign: "center" }} onClick={e => e.stopPropagation()}><div style={{ fontSize: 24, color: "#16A34A", marginBottom: 8 }}>✓</div><div style={{ fontSize: 16, fontWeight: 600 }}>Pembayaran terkirim</div><div style={{ fontSize: 13, color: "#64748B", margin: "4px 0 16px" }}>Menunggu konfirmasi admin</div><button style={S.btn()} onClick={() => setShowBayarForm(false)}>Tutup</button></div></div>);
            return (<div style={S.modal} onClick={() => setShowBayarForm(false)}><div style={S.modalContent} onClick={e => e.stopPropagation()}>
              <div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>Bukti pembayaran</span><button onClick={() => setShowBayarForm(false)} style={S.closeBtn}>✕</button></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <select style={S.input} value={jenis} onChange={e => setJenis(e.target.value)}><option>Simpanan wajib</option><option>Simpanan pokok</option><option>Angsuran simpanan pokok</option></select>
                <input style={S.input} placeholder="Jumlah (Rp)" type="number" value={jumlah} onChange={e => setJumlah(e.target.value)} />
                <div style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>Upload bukti transfer</div>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ fontSize: 13 }} />
                {uploading && <p style={{ fontSize: 12, color: "#64748B" }}>Mengompresi gambar...</p>}
                {buktiImg && <img src={buktiImg} alt="Bukti" style={{ width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 8, border: "1px solid #E8E4DC" }} />}
                <input style={S.input} placeholder="No. referensi (opsional jika sudah upload)" value={buktiText} onChange={e => setBuktiText(e.target.value)} />
                <input style={S.input} placeholder="Keterangan (opsional)" value={ket} onChange={e => setKet(e.target.value)} />
                <div style={{ fontSize: 12, color: "#64748B", background: "#F1F5F9", padding: 10, borderRadius: 8 }}>Transfer ke:<br/><strong>Bank: BCA</strong><br/><strong>No. Rek: 123456789</strong><br/><strong>A/N: Koperasi BAZARA</strong></div>
                {err && <p style={{ color: "#DC2626", fontSize: 12, margin: 0 }}>{err}</p>}
                <button style={S.btn()} onClick={kirim}>Kirim</button>
              </div>
            </div></div>);
          }; return <BF />;
        })()}
      </div>
    );
  }

  // =================== ADMIN & PENGELOLA ===================
  const filteredMembers = members.filter(m => m.nama.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase()));
  const filteredBarang = barang.filter(b => b.nama.toLowerCase().includes(searchBarang.toLowerCase()) || b.kode.toLowerCase().includes(searchBarang.toLowerCase()));
  const navItems = [...(isAdmin ? [{ key: "anggota", icon: "👥", label: "Anggota" }, { key: "simpanan", icon: "💰", label: "Simpanan" }] : []), { key: "kasir", icon: "🛒", label: "Kasir" }, ...(isAdmin ? [{ key: "laporan", icon: "📊", label: "Laporan" }] : [])];

  return (
    <div style={S.app}>
      <div style={S.header}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><img src="/logo.png" alt="BAZARA" style={{ height: 28 }} /><div style={S.headerTitle}>BAZARA</div></div><div style={{ display: "flex", alignItems: "center", gap: 10 }}>{stats.lowStock.length > 0 && tab !== "kasir" && <span style={{ background: "#FEF3C7", color: "#92400E", fontSize: 10, padding: "3px 8px", borderRadius: 10, fontWeight: 600 }}>⚠ {stats.lowStock.length}</span>}<button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Keluar</button></div></div>

      <div style={S.content}>
        {/* ANGGOTA */}
        {tab === "anggota" && isAdmin && (<>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Anggota aktif</div><div style={{ fontSize: 20, fontWeight: 700, color: "#2563EB" }}>{stats.activeM.length}</div></div><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Total simpanan</div><div style={{ fontSize: 20, fontWeight: 700, color: "#16A34A" }}>Rp {fmt(stats.tPokok + stats.tWajib)}</div></div></div>
          <input style={{ ...S.input, marginBottom: 12 }} placeholder="Cari nama atau nomor..." value={search} onChange={e => setSearch(e.target.value)} />
          {filteredMembers.map(m => (<div key={m.id} style={{ ...S.card, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setDetailMember(m)}><div style={S.avatar(m.status === "aktif" ? "#2563EB" : "#94A3B8")}>{m.nama.split(" ").map(n => n[0]).join("").substring(0,2)}</div><div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 500 }}>{m.nama}</div><div style={{ fontSize: 12, color: "#64748B" }}>{m.id} · Poin: {m.poin||0}</div></div><span style={S.badge(m.status)}>{m.status}</span></div>))}
          <button style={S.fab} onClick={() => setShowForm(true)}>+</button>
        </>)}

        {/* SIMPANAN */}
        {tab === "simpanan" && isAdmin && (<>
          <div style={{ display: "flex", gap: 0, marginBottom: 12, borderBottom: "1px solid #E2E8F0" }}><button style={S.tabBtn(subTab === "wajib")} onClick={() => setSimpananTab("wajib")}>Wajib</button><button style={S.tabBtn(subTab === "pokok")} onClick={() => setSimpananTab("pokok")}>Pokok</button></div>
          {subTab === "wajib" && (<><div style={{ display: "flex", gap: 8, marginBottom: 12 }}><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Sudah</div><div style={{ fontSize: 20, fontWeight: 700, color: "#16A34A" }}>{stats.activeM.filter(m => (simpananWajib[m.id]||[]).includes(currentMonth)).length}</div></div><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Belum</div><div style={{ fontSize: 20, fontWeight: 700, color: "#DC2626" }}>{stats.activeM.filter(m => !(simpananWajib[m.id]||[]).includes(currentMonth)).length}</div></div></div><div style={S.sectionTitle}>Rp {fmt(SIMPANAN_WAJIB)}/bln — {TAHUN_AKTIF}</div>{stats.activeM.map(m => { const w = simpananWajib[m.id]||[]; return (<div key={m.id} style={S.card}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 13, fontWeight: 600 }}>{m.nama}</span><span style={{ fontSize: 12, color: "#2563EB", fontWeight: 500 }}>Rp {fmt(w.length*SIMPANAN_WAJIB)}</span></div><div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>{BULAN.map((b,i) => (<div key={i} style={S.monthDot(w.includes(i) ? "paid" : i > currentMonth ? "future" : "unpaid")} onClick={() => i <= currentMonth && toggleWajib(m.id, i)}>{b.substring(0,1)}</div>))}</div></div>); })}</>)}
          {subTab === "pokok" && (<><div style={{ display: "flex", gap: 8, marginBottom: 12 }}><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Lunas</div><div style={{ fontSize: 20, fontWeight: 700, color: "#16A34A" }}>{Object.values(simpananPokok).filter(s => s.lunas).length}</div></div><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Belum</div><div style={{ fontSize: 20, fontWeight: 700, color: "#DC2626" }}>{stats.activeM.length - Object.values(simpananPokok).filter(s => s.lunas).length}</div></div></div>{stats.activeM.map(m => { const s = simpananPokok[m.id]; return (<div key={m.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontSize: 13, fontWeight: 600 }}>{m.nama}</div><div style={{ fontSize: 11, color: "#64748B" }}>{m.id}</div></div>{s?.lunas ? <span style={S.badge("aktif")}>Lunas</span> : <button style={S.btnOutline} onClick={() => bayarPokok(m.id)}>Bayar</button>}</div>); })}</>)}
        </>)}

        {/* KASIR */}
        {tab === "kasir" && (<>
          <div style={{ display: "flex", gap: 0, marginBottom: 12, borderBottom: "1px solid #E2E8F0" }}><button style={S.tabBtn(kasirTab === "kasir")} onClick={() => setKasirTab("kasir")}>Kasir</button><button style={S.tabBtn(kasirTab === "stok")} onClick={() => setKasirTab("stok")}>Stok</button></div>
          {kasirTab === "kasir" && (<>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Transaksi</div><div style={{ fontSize: 20, fontWeight: 700, color: "#2563EB" }}>{stats.todayTrx.length}</div></div><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Omzet hari ini</div><div style={{ fontSize: 20, fontWeight: 700, color: "#16A34A" }}>Rp {fmt(stats.todayOmzet)}</div></div></div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}><input style={{ ...S.input, flex: 1 }} placeholder="Cari barang..." value={searchBarang} onChange={e => setSearchBarang(e.target.value)} /><button style={{ ...S.btnSm("#64748B"), whiteSpace: "nowrap" }} onClick={() => setShowHistori(true)}>Riwayat</button></div>
            {searchBarang && (<div style={{ marginBottom: 12 }}>{filteredBarang.slice(0,6).map(b => (<div key={b.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontSize: 13, fontWeight: 600 }}>{b.nama}</div><div style={{ fontSize: 12, color: "#64748B" }}>Rp {fmt(b.hargaJual)} · Stok: {b.stok}</div></div><button style={S.btnSm(b.stok > 0 ? "#2563EB" : "#CBD5E1")} onClick={() => addToCart(b)} disabled={b.stok<=0}>+ Tambah</button></div>))}</div>)}
            {cart.length > 0 && (<>
              <div style={S.sectionTitle}>Keranjang ({cartCount} item)</div>
              {cart.map(c => (<div key={c.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{c.nama}</div><div style={{ fontSize: 12, color: "#64748B" }}>Rp {fmt(c.hargaJual)} × {c.qty} = <span style={{ color: "#2563EB", fontWeight: 600 }}>Rp {fmt(c.hargaJual*c.qty)}</span></div></div><div style={{ display: "flex", alignItems: "center", gap: 6 }}><button style={S.qtyBtn} onClick={() => updateCartQty(c.id,-1)}>−</button><span style={{ fontSize: 14, fontWeight: 600, minWidth: 20, textAlign: "center" }}>{c.qty}</span><button style={S.qtyBtn} onClick={() => updateCartQty(c.id,1)}>+</button><button style={{ ...S.qtyBtn, background: "#DC2626", marginLeft: 4, fontSize: 12 }} onClick={() => removeFromCart(c.id)}>✕</button></div></div>))}
              {/* PEMBELI */}
              <div style={{ ...S.card, background: "#F0F9FF", border: "1px solid #BAE6FD" }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Pembeli</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <button style={S.btnSm(pembeliType === "anggota" ? "#2563EB" : "#CBD5E1")} onClick={() => setPembeliType("anggota")}>Anggota</button>
                  <button style={S.btnSm(pembeliType === "umum" ? "#2563EB" : "#CBD5E1")} onClick={() => setPembeliType("umum")}>Bukan anggota</button>
                </div>
                {pembeliType === "anggota" ? (
                  <select style={S.input} value={pembeliAnggotaId} onChange={e => setPembeliAnggotaId(e.target.value)}>
                    <option value="">-- Pilih anggota --</option>
                    {stats.activeM.map(m => <option key={m.id} value={m.id}>{m.nama} ({m.id})</option>)}
                  </select>
                ) : (
                  <input style={S.input} placeholder="Nama pembeli (opsional)" value={pembeliNama} onChange={e => setPembeliNama(e.target.value)} />
                )}
                {pembeliType === "anggota" && pembeliAnggotaId && <div style={{ fontSize: 11, color: "#16A34A", marginTop: 6 }}>+{Math.floor(cartTotal/POIN_PER_RP)} poin untuk anggota ini</div>}
              </div>
              {/* TOTAL & BAYAR */}
              <div style={{ ...S.card, background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}><span style={{ fontSize: 15, fontWeight: 600 }}>Total</span><span style={{ fontSize: 18, fontWeight: 700, color: "#2563EB" }}>Rp {fmt(cartTotal)}</span></div>
                <input style={{ ...S.input, marginBottom: 8 }} placeholder="Nominal bayar" value={bayarNominal} onChange={e => setBayarNominal(e.target.value)} type="number" />
                {bayarNominal && parseInt(bayarNominal) >= cartTotal && <div style={{ fontSize: 13, color: "#16A34A", fontWeight: 500, marginBottom: 8 }}>Kembalian: Rp {fmt(parseInt(bayarNominal)-cartTotal)}</div>}
                <button style={S.btn(parseInt(bayarNominal||0) >= cartTotal && (pembeliType === "umum" || pembeliAnggotaId) ? "#16A34A" : "#CBD5E1")} onClick={prosesTransaksi} disabled={parseInt(bayarNominal||0) < cartTotal || (pembeliType === "anggota" && !pembeliAnggotaId)}>Proses pembayaran</button>
              </div>
            </>)}
            {cart.length === 0 && !searchBarang && <div style={{ textAlign: "center", padding: "40px 20px", color: "#94A3B8" }}><div style={{ fontSize: 36, marginBottom: 8 }}>🛒</div><div style={{ fontSize: 14, color: "#64748B" }}>Ketik nama barang untuk mulai</div></div>}
          </>)}
          {kasirTab === "stok" && (<>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Jenis</div><div style={{ fontSize: 20, fontWeight: 700, color: "#2563EB" }}>{barang.length}</div></div><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Stok rendah</div><div style={{ fontSize: 20, fontWeight: 700, color: stats.lowStock.length > 0 ? "#DC2626" : "#16A34A" }}>{stats.lowStock.length}</div></div></div>
            {stats.lowStock.length > 0 && (<><div style={S.sectionTitle}>⚠ Perlu restok</div>{stats.lowStock.map(b => (<div key={b.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "3px solid #F59E0B" }}><div><div style={{ fontSize: 13, fontWeight: 600 }}>{b.nama}</div><div style={{ fontSize: 12, color: "#64748B" }}>Stok: <span style={{ color: "#DC2626", fontWeight: 600 }}>{b.stok}</span></div></div><button style={S.btnSm("#F59E0B")} onClick={() => setShowRestok(b)}>Restok</button></div>))}</>)}
            <div style={S.sectionTitle}>Semua barang</div>
            {barang.map(b => (<div key={b.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{b.nama}</div><div style={{ fontSize: 11, color: "#64748B" }}>{b.kode} · {b.kategori}</div><div style={{ fontSize: 12, marginTop: 2 }}><span style={{ color: "#64748B" }}>Beli: Rp {fmt(b.hargaBeli)}</span> · <span style={{ color: "#2563EB", fontWeight: 500 }}>Jual: Rp {fmt(b.hargaJual)}</span></div></div><div style={{ textAlign: "right" }}><div style={{ fontSize: 16, fontWeight: 700, color: b.stok <= STOK_WARNING ? "#DC2626" : "#1E293B" }}>{b.stok}</div><div style={{ display: "flex", gap: 4, marginTop: 4 }}><button style={S.btnSm("#64748B")} onClick={() => setEditBarang(b)}>Edit</button><button style={S.btnSm("#F59E0B")} onClick={() => setShowRestok(b)}>+Stok</button></div></div></div>))}
            <button style={S.fab} onClick={() => setShowBarangForm(true)}>+</button>
          </>)}
        </>)}

        {/* LAPORAN */}
        {tab === "laporan" && isAdmin && (<>
          <div style={{ display: "flex", gap: 0, marginBottom: 12, borderBottom: "1px solid #E2E8F0" }}><button style={S.tabBtn(laporanTab === "dashboard")} onClick={() => setLaporanTab("dashboard")}>Dashboard</button><button style={S.tabBtn(laporanTab === "aruskas")} onClick={() => setLaporanTab("aruskas")}>Arus kas</button><button style={S.tabBtn(laporanTab === "shu")} onClick={() => setLaporanTab("shu")}>SHU</button></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><span style={{ fontSize: 12, color: "#64748B" }}>Bulan:</span><select style={{ ...S.input, width: "auto", padding: "6px 10px", fontSize: 13 }} value={filterBulan} onChange={e => setFilterBulan(parseInt(e.target.value))}>{BULAN.map((b,i) => <option key={i} value={i}>{b} {TAHUN_AKTIF}</option>)}</select></div>

          {laporanTab === "dashboard" && (<>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Anggota aktif</div><div style={{ fontSize: 22, fontWeight: 700, color: "#2563EB" }}>{stats.activeM.length}</div></div>
              <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Saldo kas</div><div style={{ fontSize: 22, fontWeight: 700, color: stats.saldoKas >= 0 ? "#16A34A" : "#DC2626" }}>Rp {fmt(stats.saldoKas)}</div></div>
            </div>
            <div style={S.sectionTitle}>Keuangan — {BULAN[filterBulan]}</div>
            <div style={{ ...S.card, background: "#F0FDF4", border: "1px solid #BBF7D0" }}><div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14 }}><span style={{ color: "#166534" }}>Pemasukan</span><span style={{ fontWeight: 700, color: "#166534" }}>Rp {fmt(stats.totalMasuk)}</span></div><div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14 }}><span style={{ color: "#991B1B" }}>Pengeluaran</span><span style={{ fontWeight: 700, color: "#991B1B" }}>Rp {fmt(stats.totalKeluar)}</span></div><div style={{ borderTop: "1px solid #BBF7D0", marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 15 }}><span style={{ fontWeight: 600 }}>Selisih</span><span style={{ fontWeight: 700, color: stats.totalMasuk-stats.totalKeluar >= 0 ? "#166534" : "#991B1B" }}>Rp {fmt(stats.totalMasuk-stats.totalKeluar)}</span></div></div>
            {/* PEMBAYARAN PENDING */}
            {(() => { const pending = pembayaran.filter(p => p.status === "menunggu"); return pending.length > 0 ? (<><div style={S.sectionTitle}>🔔 Verifikasi pembayaran ({pending.length})</div>{pending.map(p => { const a = members.find(m => m.id === p.anggotaId); return (<div key={p.id} style={{ ...S.card, borderLeft: "3px solid #F59E0B" }}><div style={{ fontSize: 13, fontWeight: 600 }}>{a?.nama || p.anggotaId}</div><div style={{ fontSize: 12, color: "#64748B" }}>{p.jenis} · Rp {fmt(p.jumlah)}</div><div style={{ fontSize: 11, color: "#94A3B8" }}>{p.tgl} · {p.bukti && `Ref: ${p.bukti}`}</div>{p.buktiImg && <img src={p.buktiImg} alt="Bukti" onClick={() => setShowBuktiImg(p.buktiImg)} style={{ width: "100%", maxHeight: 120, objectFit: "contain", borderRadius: 6, marginTop: 6, cursor: "pointer", border: "1px solid #E8E4DC" }} />}<div style={{ display: "flex", gap: 6, marginTop: 8 }}><button style={S.btnSm("#16A34A")} onClick={() => { const u = pembayaran.map(x => x.id === p.id ? { ...x, status: "diterima" } : x); setPembayaran(u); sv(null,null,null,null,null,null,u); }}>✓ Terima</button><button style={S.btnSm("#DC2626")} onClick={() => { const u = pembayaran.map(x => x.id === p.id ? { ...x, status: "ditolak" } : x); setPembayaran(u); sv(null,null,null,null,null,null,u); }}>✕ Tolak</button></div></div>); })}</>) : null; })()}
            {stats.lowStock.length > 0 && (<><div style={S.sectionTitle}>⚠ Perlu restok</div>{stats.lowStock.map(b => (<div key={b.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "3px solid #F59E0B" }}><span style={{ fontSize: 13 }}>{b.nama}</span><span style={{ fontSize: 14, fontWeight: 700, color: "#DC2626" }}>{b.stok}</span></div>))}</>)}
          </>)}

          {laporanTab === "aruskas" && (<>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Masuk</div><div style={{ fontSize: 18, fontWeight: 700, color: "#16A34A" }}>Rp {fmt(stats.totalMasuk)}</div></div><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Keluar</div><div style={{ fontSize: 18, fontWeight: 700, color: "#DC2626" }}>Rp {fmt(stats.totalKeluar)}</div></div></div>
            <button style={{ ...S.btn("#DC2626"), marginBottom: 12 }} onClick={() => setShowPengeluaran(true)}>+ Catat pengeluaran</button>
            <div style={S.sectionTitle}>Riwayat — {BULAN[filterBulan]}</div>
            {stats.bulanIni.length === 0 ? <div style={{ textAlign: "center", padding: 30, color: "#94A3B8", fontSize: 13 }}>Belum ada catatan</div> : stats.bulanIni.map(a => (<div key={a.id} style={{ ...S.card, borderLeft: `3px solid ${a.tipe === "masuk" ? "#16A34A" : "#DC2626"}` }}><div style={{ display: "flex", justifyContent: "space-between" }}><div><div style={{ fontSize: 13, fontWeight: 600 }}>{a.kategori}</div><div style={{ fontSize: 12, color: "#64748B" }}>{a.keterangan}</div><div style={{ fontSize: 11, color: "#94A3B8" }}>{a.tgl}</div></div><span style={{ fontSize: 14, fontWeight: 700, color: a.tipe === "masuk" ? "#16A34A" : "#DC2626" }}>{a.tipe === "masuk" ? "+" : "−"}Rp {fmt(a.jumlah)}</span></div></div>))}
          </>)}

          {laporanTab === "shu" && (<>
            <div style={S.sectionTitle}>Pengaturan alokasi SHU</div>
            <div style={S.card}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}><span>Berdasarkan transaksi (poin)</span><div style={{ display: "flex", alignItems: "center", gap: 4 }}><input type="number" style={{ ...S.input, width: 60, padding: "4px 8px", textAlign: "center" }} value={shuConfig.pctTransaksi} onChange={e => { const v = { ...shuConfig, pctTransaksi: parseInt(e.target.value)||0 }; setShuConfig(v); save(members,simpananPokok,simpananWajib,barang,transaksi,arusKas,pembayaran,v); }} /><span>%</span></div></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}><span>Berdasarkan simpanan</span><div style={{ display: "flex", alignItems: "center", gap: 4 }}><input type="number" style={{ ...S.input, width: 60, padding: "4px 8px", textAlign: "center" }} value={shuConfig.pctSimpanan} onChange={e => { const v = { ...shuConfig, pctSimpanan: parseInt(e.target.value)||0 }; setShuConfig(v); save(members,simpananPokok,simpananWajib,barang,transaksi,arusKas,pembayaran,v); }} /><span>%</span></div></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}><span>Cadangan koperasi</span><div style={{ display: "flex", alignItems: "center", gap: 4 }}><input type="number" style={{ ...S.input, width: 60, padding: "4px 8px", textAlign: "center" }} value={shuConfig.pctCadangan} onChange={e => { const v = { ...shuConfig, pctCadangan: parseInt(e.target.value)||0 }; setShuConfig(v); save(members,simpananPokok,simpananWajib,barang,transaksi,arusKas,pembayaran,v); }} /><span>%</span></div></div>
                <div style={{ fontSize: 12, color: (shuConfig.pctTransaksi+shuConfig.pctSimpanan+shuConfig.pctCadangan) === 100 ? "#16A34A" : "#DC2626", fontWeight: 600 }}>Total: {shuConfig.pctTransaksi+shuConfig.pctSimpanan+shuConfig.pctCadangan}% {(shuConfig.pctTransaksi+shuConfig.pctSimpanan+shuConfig.pctCadangan) !== 100 && "(harus 100%)"}</div>
              </div>
            </div>

            <div style={S.sectionTitle}>Ringkasan SHU</div>
            <div style={{ ...S.card, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14 }}><span>Laba kotor toko</span><span style={{ fontWeight: 700 }}>Rp {fmt(stats.labaKotor)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, color: "#64748B" }}><span>Bagian transaksi ({shuConfig.pctTransaksi}%)</span><span>Rp {fmt(Math.round(stats.labaKotor * shuConfig.pctTransaksi/100))}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, color: "#64748B" }}><span>Bagian simpanan ({shuConfig.pctSimpanan}%)</span><span>Rp {fmt(Math.round(stats.labaKotor * shuConfig.pctSimpanan/100))}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, color: "#64748B" }}><span>Cadangan ({shuConfig.pctCadangan}%)</span><span>Rp {fmt(Math.round(stats.labaKotor * shuConfig.pctCadangan/100))}</span></div>
            </div>

            <div style={S.sectionTitle}>SHU per anggota</div>
            {stats.activeM.map(m => { const shu = hitungSHU(m.id); return (
              <div key={m.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div style={{ fontSize: 13, fontWeight: 600 }}>{m.nama}</div><div style={{ fontSize: 11, color: "#64748B" }}>Poin: {m.poin||0} · Simpanan: Rp {fmt(((simpananWajib[m.id]||[]).length * SIMPANAN_WAJIB) + (simpananPokok[m.id]?.lunas ? SIMPANAN_POKOK : 0))}</div></div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#16A34A" }}>Rp {fmt(shu)}</div>
                </div>
              </div>
            ); })}
          </>)}
        </>)}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ ...S.bottomNav, gridTemplateColumns: `repeat(${navItems.length}, 1fr)` }}>{navItems.map(n => (<button key={n.key} style={S.navItem(tab === n.key)} onClick={() => { setTab(n.key); setSearch(""); setSearchBarang(""); }}><span style={{ fontSize: 20 }}>{n.icon}</span>{n.label}{n.key === "kasir" && cart.length > 0 && <span style={{ background: "#DC2626", color: "white", fontSize: 9, padding: "1px 5px", borderRadius: 8 }}>{cartCount}</span>}</button>))}</div>

      {/* ===== MODALS ===== */}
      {showForm && (() => { const F = () => { const [f, setF] = useState({ nama: "", alamat: "", hp: "" }); const [err, setErr] = useState(""); return (<div style={S.modal} onClick={() => setShowForm(false)}><div style={S.modalContent} onClick={e => e.stopPropagation()}><div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>Tambah anggota</span><button onClick={() => setShowForm(false)} style={S.closeBtn}>✕</button></div><div style={{ display: "flex", flexDirection: "column", gap: 10 }}><input style={S.input} placeholder="Nama lengkap" value={f.nama} onChange={e => { setF({...f, nama: e.target.value}); setErr(""); }} /><input style={S.input} placeholder="Alamat" value={f.alamat} onChange={e => setF({...f, alamat: e.target.value})} /><input style={S.input} placeholder="No. HP" value={f.hp} onChange={e => setF({...f, hp: e.target.value})} />{err && <p style={{ color: "#DC2626", fontSize: 12, margin: 0 }}>{err}</p>}<button style={S.btn()} onClick={() => { if (!f.nama.trim()) { setErr("Nama wajib diisi"); return; } addMember(f); }}>Simpan</button></div></div></div>); }; return <F />; })()}

      {editMember && (() => { const F = () => { const [f, setF] = useState({ nama: editMember.nama, alamat: editMember.alamat, hp: editMember.hp }); return (<div style={S.modal} onClick={() => setEditMember(null)}><div style={S.modalContent} onClick={e => e.stopPropagation()}><div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>Edit anggota</span><button onClick={() => setEditMember(null)} style={S.closeBtn}>✕</button></div><div style={{ display: "flex", flexDirection: "column", gap: 10 }}><input style={S.input} placeholder="Nama" value={f.nama} onChange={e => setF({...f, nama: e.target.value})} /><input style={S.input} placeholder="Alamat" value={f.alamat} onChange={e => setF({...f, alamat: e.target.value})} /><input style={S.input} placeholder="No. HP" value={f.hp} onChange={e => setF({...f, hp: e.target.value})} /><button style={S.btn()} onClick={() => updateMember({ ...editMember, ...f })}>Simpan</button></div></div></div>); }; return <F />; })()}

      {detailMember && (() => { const m = members.find(x => x.id === detailMember.id)||detailMember; const pokok = simpananPokok[m.id]; const wajib = simpananWajib[m.id]||[]; const shu = hitungSHU(m.id); return (<div style={S.modal} onClick={() => setDetailMember(null)}><div style={S.modalContent} onClick={e => e.stopPropagation()}><div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>Detail anggota</span><button onClick={() => setDetailMember(null)} style={S.closeBtn}>✕</button></div><div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}><div style={S.avatar(m.status === "aktif" ? "#2563EB" : "#94A3B8")}>{m.nama.split(" ").map(n => n[0]).join("").substring(0,2)}</div><div><div style={{ fontWeight: 600, fontSize: 15 }}>{m.nama}</div><div style={{ fontSize: 12, color: "#64748B" }}>{m.id}</div></div><span style={S.badge(m.status)}>{m.status}</span></div>{[["No. HP", m.hp], ["Alamat", m.alamat], ["Tgl masuk", m.tglMasuk], ["Poin", m.poin||0], ["Estimasi SHU", `Rp ${fmt(shu)}`]].map(([l,v]) => (<div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F1F5F9", fontSize: 13 }}><span style={{ color: "#64748B" }}>{l}</span><span style={{ fontWeight: 500 }}>{v}</span></div>))}<div style={S.sectionTitle}>Simpanan pokok</div><div style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontWeight: 500, color: pokok?.lunas ? "#16A34A" : "#DC2626" }}>{pokok?.lunas ? `Lunas (${pokok.tgl})` : "Belum"}</span>{!pokok?.lunas && <button style={S.btnOutline} onClick={() => bayarPokok(m.id)}>Bayar</button>}</div><div style={S.sectionTitle}>Simpanan wajib</div><div style={S.card}><div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{BULAN.map((b,i) => (<div key={i} style={S.monthDot(wajib.includes(i) ? "paid" : i > currentMonth ? "future" : "unpaid")} onClick={() => i<=currentMonth && toggleWajib(m.id,i)}>{b}</div>))}</div><div style={{ fontSize: 12, color: "#64748B", marginTop: 8 }}>Total: Rp {fmt(wajib.length*SIMPANAN_WAJIB)}</div></div><div style={{ display: "flex", gap: 8, marginTop: 16 }}><button style={{ ...S.btnOutline, flex: 1 }} onClick={() => { setDetailMember(null); setEditMember(m); }}>Edit</button><button style={{ ...S.btn(m.status === "aktif" ? "#DC2626" : "#16A34A"), flex: 1, fontSize: 13 }} onClick={() => { toggleStatus(m.id); setDetailMember(null); }}>{m.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}</button></div></div></div>); })()}

      {showBarangForm && (() => { const F = () => { const [f, setF] = useState({ kode: "", nama: "", kategori: "Sembako", hargaBeli: "", hargaJual: "", stok: "" }); const [err, setErr] = useState(""); return (<div style={S.modal} onClick={() => setShowBarangForm(false)}><div style={S.modalContent} onClick={e => e.stopPropagation()}><div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>Tambah barang</span><button onClick={() => setShowBarangForm(false)} style={S.closeBtn}>✕</button></div><div style={{ display: "flex", flexDirection: "column", gap: 10 }}><input style={S.input} placeholder="Kode" value={f.kode} onChange={e => setF({...f, kode: e.target.value})} /><input style={S.input} placeholder="Nama barang" value={f.nama} onChange={e => { setF({...f, nama: e.target.value}); setErr(""); }} /><select style={S.input} value={f.kategori} onChange={e => setF({...f, kategori: e.target.value})}>{["Sembako","Bumbu","Makanan","Minuman","Kebersihan","Lainnya"].map(k => <option key={k}>{k}</option>)}</select><div style={{ display: "flex", gap: 8 }}><input style={S.input} placeholder="Harga beli" type="number" value={f.hargaBeli} onChange={e => setF({...f, hargaBeli: e.target.value})} /><input style={S.input} placeholder="Harga jual" type="number" value={f.hargaJual} onChange={e => setF({...f, hargaJual: e.target.value})} /></div><input style={S.input} placeholder="Stok awal" type="number" value={f.stok} onChange={e => setF({...f, stok: e.target.value})} />{err && <p style={{ color: "#DC2626", fontSize: 12, margin: 0 }}>{err}</p>}<button style={S.btn()} onClick={() => { if (!f.nama.trim()) { setErr("Nama wajib"); return; } if (!f.hargaJual) { setErr("Harga jual wajib"); return; } addBarang({ ...f, hargaBeli: parseInt(f.hargaBeli)||0, hargaJual: parseInt(f.hargaJual)||0, stok: parseInt(f.stok)||0 }); }}>Simpan</button></div></div></div>); }; return <F />; })()}

      {editBarang && (() => { const F = () => { const [f, setF] = useState(editBarang); return (<div style={S.modal} onClick={() => setEditBarang(null)}><div style={S.modalContent} onClick={e => e.stopPropagation()}><div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>Edit barang</span><button onClick={() => setEditBarang(null)} style={S.closeBtn}>✕</button></div><div style={{ display: "flex", flexDirection: "column", gap: 10 }}><input style={S.input} placeholder="Kode" value={f.kode} onChange={e => setF({...f, kode: e.target.value})} /><input style={S.input} placeholder="Nama" value={f.nama} onChange={e => setF({...f, nama: e.target.value})} /><select style={S.input} value={f.kategori} onChange={e => setF({...f, kategori: e.target.value})}>{["Sembako","Bumbu","Makanan","Minuman","Kebersihan","Lainnya"].map(k => <option key={k}>{k}</option>)}</select><div style={{ display: "flex", gap: 8 }}><input style={S.input} placeholder="H. beli" type="number" value={f.hargaBeli} onChange={e => setF({...f, hargaBeli: e.target.value})} /><input style={S.input} placeholder="H. jual" type="number" value={f.hargaJual} onChange={e => setF({...f, hargaJual: e.target.value})} /></div><button style={S.btn()} onClick={() => updateBarang({ ...f, hargaBeli: parseInt(f.hargaBeli)||0, hargaJual: parseInt(f.hargaJual)||0 })}>Simpan</button></div></div></div>); }; return <F />; })()}

      {showRestok && (() => { const F = () => { const [qty, setQty] = useState(""); const [biaya, setBiaya] = useState(""); return (<div style={S.modal} onClick={() => setShowRestok(null)}><div style={{ ...S.modalContent, paddingBottom: 24 }} onClick={e => e.stopPropagation()}><div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>Restok: {showRestok.nama}</span><button onClick={() => setShowRestok(null)} style={S.closeBtn}>✕</button></div><div style={{ fontSize: 13, color: "#64748B", marginBottom: 12 }}>Stok: <strong>{showRestok.stok}</strong></div><input style={{ ...S.input, marginBottom: 8 }} placeholder="Jumlah tambahan" type="number" value={qty} onChange={e => setQty(e.target.value)} /><input style={{ ...S.input, marginBottom: 10 }} placeholder="Total biaya (Rp)" type="number" value={biaya} onChange={e => setBiaya(e.target.value)} /><button style={S.btn()} onClick={() => { if (parseInt(qty) > 0) restokBarang(showRestok.id, parseInt(qty), parseInt(biaya)||0); }}>Tambah stok</button></div></div>); }; return <F />; })()}

      {showPengeluaran && (() => { const F = () => { const [f, setF] = useState({ kategori: KATEGORI_PENGELUARAN[0], keterangan: "", jumlah: "" }); const [err, setErr] = useState(""); return (<div style={S.modal} onClick={() => setShowPengeluaran(false)}><div style={S.modalContent} onClick={e => e.stopPropagation()}><div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>Catat pengeluaran</span><button onClick={() => setShowPengeluaran(false)} style={S.closeBtn}>✕</button></div><div style={{ display: "flex", flexDirection: "column", gap: 10 }}><select style={S.input} value={f.kategori} onChange={e => setF({...f, kategori: e.target.value})}>{KATEGORI_PENGELUARAN.map(k => <option key={k}>{k}</option>)}</select><input style={S.input} placeholder="Keterangan" value={f.keterangan} onChange={e => { setF({...f, keterangan: e.target.value}); setErr(""); }} /><input style={S.input} placeholder="Jumlah (Rp)" type="number" value={f.jumlah} onChange={e => setF({...f, jumlah: e.target.value})} />{err && <p style={{ color: "#DC2626", fontSize: 12, margin: 0 }}>{err}</p>}<button style={S.btn("#DC2626")} onClick={() => { if (!f.keterangan.trim()) { setErr("Keterangan wajib"); return; } if (!f.jumlah || parseInt(f.jumlah)<=0) { setErr("Jumlah harus > 0"); return; } addPengeluaran(f); }}>Simpan</button></div></div></div>); }; return <F />; })()}

      {showStruk && (<div style={S.modal} onClick={() => setShowStruk(null)}><div style={{ ...S.modalContent, textAlign: "center" }} onClick={e => e.stopPropagation()}><div style={{ fontSize: 24, color: "#16A34A", marginBottom: 8 }}>✓</div><div style={{ fontSize: 18, fontWeight: 600 }}>Transaksi berhasil</div><div style={{ fontSize: 12, color: "#64748B", marginBottom: 4 }}>{showStruk.tgl} · {showStruk.waktu}</div>{showStruk.pembeli && <div style={{ fontSize: 12, color: "#2563EB", marginBottom: 12 }}>Pembeli: {showStruk.pembeli.nama}{showStruk.pembeli.type === "anggota" ? ` (+${Math.floor(showStruk.total/POIN_PER_RP)} poin)` : ""}</div>}<div style={{ textAlign: "left", borderTop: "1px dashed #CBD5E1", paddingTop: 12 }}>{showStruk.items.map((it,i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}><span>{it.nama} ×{it.qty}</span><span style={{ fontWeight: 500 }}>Rp {fmt(it.subtotal)}</span></div>))}<div style={{ borderTop: "1px dashed #CBD5E1", marginTop: 8, paddingTop: 8 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700 }}><span>Total</span><span>Rp {fmt(showStruk.total)}</span></div><div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748B", marginTop: 4 }}><span>Bayar</span><span>Rp {fmt(showStruk.bayar)}</span></div><div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#16A34A", fontWeight: 500 }}><span>Kembalian</span><span>Rp {fmt(showStruk.kembalian)}</span></div></div></div><button style={{ ...S.btn(), marginTop: 16 }} onClick={() => setShowStruk(null)}>Tutup</button></div></div>)}

      {showHistori && (<div style={S.modal} onClick={() => setShowHistori(false)}><div style={S.modalContent} onClick={e => e.stopPropagation()}><div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>Riwayat transaksi</span><button onClick={() => setShowHistori(false)} style={S.closeBtn}>✕</button></div>{transaksi.length === 0 ? <div style={{ textAlign: "center", padding: 30, color: "#94A3B8", fontSize: 13 }}>Belum ada</div> : transaksi.slice(0,20).map(t => (<div key={t.id} style={{ ...S.card, cursor: "pointer" }} onClick={() => { setShowHistori(false); setShowStruk(t); }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontSize: 13, fontWeight: 600 }}>{t.tgl} · {t.waktu}</div><div style={{ fontSize: 11, color: "#64748B" }}>{t.pembeli?.nama || "—"} · {t.items.length} item</div></div><div style={{ fontSize: 15, fontWeight: 700, color: "#2563EB" }}>Rp {fmt(t.total)}</div></div></div>))}</div></div>)}

      {showBuktiImg && (<div style={{ ...S.modal, alignItems: "center" }} onClick={() => setShowBuktiImg(null)}><img src={showBuktiImg} alt="Bukti" style={{ maxWidth: "90%", maxHeight: "80vh", borderRadius: 12 }} /></div>)}
    </div>
  );
}

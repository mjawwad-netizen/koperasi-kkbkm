import { useState, useEffect, useCallback, useMemo } from "react";

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

const defaultMembers = [];
const defaultSimpananPokok = {};
const defaultSimpananWajib = {};
const defaultBarang = [];

const adminUser = { id: "ADMIN", nama: "Administrator", role: "admin", password: "admin123" };
const fmt = (n) => new Intl.NumberFormat("id-ID").format(n);
const tglNow = () => new Date().toISOString().split("T")[0];
const waktuNow = () => new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

export default function KoperasiApp() {
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState(defaultMembers);
  const [simpananPokok, setSimpananPokok] = useState(defaultSimpananPokok);
  const [simpananWajib, setSimpananWajib] = useState(defaultSimpananWajib);
  const [barang, setBarang] = useState(defaultBarang);
  const [transaksi, setTransaksi] = useState([]);
  const [arusKas, setArusKas] = useState([]);
  const [pembayaran, setPembayaran] = useState([]);
  const [showBayarForm, setShowBayarForm] = useState(false);
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
  const STORAGE_KEY = "koperasi-data-v3";

  useEffect(() => {
    // Persistent login
    try {
      const savedUser = localStorage.getItem("koperasi-user");
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch (e) {}

    // Load data
    (async () => {
      try {
        const res = await fetch(API_URL);
        const json = await res.json();
        if (json.ok && json.data) {
          const d = json.data;
          if (d.members?.length) setMembers(d.members);
          if (d.simpananPokok) setSimpananPokok(d.simpananPokok);
          if (d.simpananWajib) setSimpananWajib(d.simpananWajib);
          if (d.barang?.length) setBarang(d.barang);
          if (d.transaksi?.length) setTransaksi(d.transaksi);
          if (d.arusKas?.length) setArusKas(d.arusKas);
          if (d.pembayaran?.length) setPembayaran(d.pembayaran);
        }
      } catch (e) {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const d = JSON.parse(raw);
            if (d.members) setMembers(d.members);
            if (d.simpananPokok) setSimpananPokok(d.simpananPokok);
            if (d.simpananWajib) setSimpananWajib(d.simpananWajib);
            if (d.barang) setBarang(d.barang);
            if (d.transaksi) setTransaksi(d.transaksi);
            if (d.arusKas) setArusKas(d.arusKas);
          }
        } catch (e2) {}
      }
      setLoaded(true);
    })();
  }, []);

  const save = useCallback((m, sp, sw, br, tr, ak, pb) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ members: m, simpananPokok: sp, simpananWajib: sw, barang: br, transaksi: tr, arusKas: ak, pembayaran: pb })); } catch (e) {}
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: "saveAll", data: { members: m, simpananPokok: sp, simpananWajib: sw, barang: br, transaksi: tr, arusKas: ak, pembayaran: pb } })
    }).catch(e => console.error("Sync error:", e));
  }, []);

  const addKas = useCallback((tipe, kategori, keterangan, jumlah, currentAk) => {
    const entry = { id: `AK-${Date.now()}-${Math.random().toString(36).substr(2,4)}`, tgl: tglNow(), waktu: waktuNow(), tipe, kategori, keterangan, jumlah };
    return [entry, ...currentAk];
  }, []);

      const handleLogin = () => {
    setLoginError("");
    if (loginId.toUpperCase() === "ADMIN" && loginPw === "admin123") {
      const u = adminUser;
      setUser(u); localStorage.setItem("koperasi-user", JSON.stringify(u)); return;
    }
    const m = members.find(x => x.hp === loginId || x.id.toUpperCase() === loginId.toUpperCase());
    if (m && m.pin === loginPw) {
    const m = members.find(x => x.id.toUpperCase() === loginId.toUpperCase());
    if (m && m.password === loginPw) {
      if (m.status === "non-aktif") { setLoginError("Akun tidak aktif"); return; }
      const u = { ...m };
      setUser(u); localStorage.setItem("koperasi-user", JSON.stringify(u));
    } else { setLoginError("Nomor anggota atau password salah"); }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("koperasi-user");
  };

  const handleRegister = () => {
    setRegError(""); setRegSuccess("");
    if (!regData.nama.trim()) { setRegError("Nama wajib diisi"); return; }
        if (!regData.hp.trim()) { setRegError("No. HP wajib diisi"); return; }
    if (!regData.pin || regData.pin.length < 4) { setRegError("PIN minimal 4 digit"); return; }
    if (regData.pin !== regData.pinConfirm) { setRegError("PIN tidak cocok"); return; }
    if (members.find(m => m.hp === regData.hp)) { setRegError("No. HP sudah terdaftar"); return; }
    const id = nextId();
    const newM = { id, nama: regData.nama, alamat: regData.alamat, hp: regData.hp, pin: regData.pin, tglMasuk: tglNow(), status: "aktif", role: "anggota" };
    const updatedMembers = [...members, newM];
    // Setup simpanan pokok berdasarkan pilihan angsuran
    const opsi = OPSI_ANGSURAN[regData.angsuran];
    const updatedPokok = { ...simpananPokok, [id]: { lunas: false, tgl: null, angsuran: opsi.kali, terbayar: 0 } };
    setMembers(updatedMembers); setSimpananPokok(updatedPokok);
    save(updatedMembers, updatedPokok, simpananWajib, barang, transaksi, arusKas, pembayaran);
    setRegSuccess(`Berhasil! Nomor anggota Anda: ${id}. Login dengan No. HP + PIN yang Anda buat.`);
    setRegData({ nama: "", alamat: "", hp: "", pin: "", pinConfirm: "", angsuran: 0 });
  };

  const nextId = () => { const nums = members.map(m => parseInt(m.id.split("-")[1])); return `KKBKM-${String(Math.max(...nums) + 1).padStart(3, "0")}`; };
  const nextBarangId = () => { const nums = barang.map(b => parseInt(b.id.replace("B",""))); return `B${String(Math.max(...nums, 0) + 1).padStart(3, "0")}`; };

  const addMember = (data) => {
    const newM = { ...data, id: nextId(), tglMasuk: tglNow(), status: "aktif", password: "1234", role: "anggota" };
    const u = [...members, newM]; setMembers(u); save(u, simpananPokok, simpananWajib, barang, transaksi, arusKas, pembayaran); setShowForm(false);
  };
  const updateMember = (data) => {
    const u = members.map(m => m.id === data.id ? { ...m, ...data } : m); setMembers(u); save(u, simpananPokok, simpananWajib, barang, transaksi, arusKas, pembayaran); setEditMember(null);
  };
  const toggleStatus = (id) => {
    const u = members.map(m => m.id === id ? { ...m, status: m.status === "aktif" ? "non-aktif" : "aktif" } : m); setMembers(u); save(u, simpananPokok, simpananWajib, barang, transaksi, arusKas, pembayaran);
  };
  const bayarPokok = (id) => {
    const u = { ...simpananPokok, [id]: { lunas: true, tgl: tglNow() } };
    const nama = members.find(m => m.id === id)?.nama || id;
    const ak = addKas("masuk", "Simpanan pokok", `${nama} (${id})`, SIMPANAN_POKOK, arusKas);
    setSimpananPokok(u); setArusKas(ak); save(members, u, simpananWajib, barang, transaksi, ak, pembayaran);
  };
  const toggleWajib = (id, bulanIdx) => {
    const cur = simpananWajib[id] || [];
    const nama = members.find(m => m.id === id)?.nama || id;
    let u, ak;
    if (cur.includes(bulanIdx)) {
      u = { ...simpananWajib, [id]: cur.filter(b => b !== bulanIdx) };
      ak = addKas("keluar", "Koreksi simpanan wajib", `Batal: ${nama} - ${BULAN[bulanIdx]}`, SIMPANAN_WAJIB, arusKas);
    } else {
      u = { ...simpananWajib, [id]: [...cur, bulanIdx].sort((a,b) => a-b) };
      ak = addKas("masuk", "Simpanan wajib", `${nama} - ${BULAN[bulanIdx]}`, SIMPANAN_WAJIB, arusKas);
    }
    setSimpananWajib(u); setArusKas(ak); save(members, simpananPokok, u, barang, transaksi, ak, pembayaran);
  };

  const addBarang = (data) => {
    const newB = { ...data, id: nextBarangId() };
    const u = [...barang, newB]; setBarang(u); save(members, simpananPokok, simpananWajib, u, transaksi, arusKas, pembayaran); setShowBarangForm(false);
  };
  const updateBarang = (data) => {
    const u = barang.map(b => b.id === data.id ? { ...b, ...data } : b); setBarang(u); save(members, simpananPokok, simpananWajib, u, transaksi, arusKas, pembayaran); setEditBarang(null);
  };
  const restokBarang = (id, qty, totalBiaya) => {
    const u = barang.map(b => b.id === id ? { ...b, stok: b.stok + qty } : b);
    const item = barang.find(b => b.id === id);
    const ak = addKas("keluar", "Pembelian stok", `Restok: ${item?.nama} (${qty} pcs)`, totalBiaya, arusKas);
    setBarang(u); setArusKas(ak); save(members, simpananPokok, simpananWajib, u, transaksi, ak, pembayaran); setShowRestok(null);
  };

  const addToCart = (item) => {
    if (item.stok <= 0) return;
    const existing = cart.find(c => c.id === item.id);
    if (existing) { if (existing.qty >= item.stok) return; setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)); }
    else { setCart([...cart, { ...item, qty: 1 }]); }
  };
  const updateCartQty = (id, delta) => {
    const item = barang.find(b => b.id === id);
    setCart(cart.map(c => { if (c.id !== id) return c; const nq = c.qty + delta; if (nq <= 0) return null; if (nq > item.stok) return c; return { ...c, qty: nq }; }).filter(Boolean));
  };
  const removeFromCart = (id) => setCart(cart.filter(c => c.id !== id));
  const cartTotal = cart.reduce((s, c) => s + c.hargaJual * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const prosesTransaksi = () => {
    const nominal = parseInt(bayarNominal.replace(/\D/g, "")) || 0;
    if (nominal < cartTotal) return;
    const trx = { id: `TRX-${Date.now()}`, tgl: tglNow(), waktu: waktuNow(), items: cart.map(c => ({ id: c.id, nama: c.nama, harga: c.hargaJual, hargaBeli: c.hargaBeli, qty: c.qty, subtotal: c.hargaJual * c.qty })), total: cartTotal, bayar: nominal, kembalian: nominal - cartTotal };
    const updatedBarang = barang.map(b => { const ci = cart.find(c => c.id === b.id); return ci ? { ...b, stok: b.stok - ci.qty } : b; });
    const updatedTrx = [trx, ...transaksi];
    const ak = addKas("masuk", "Penjualan", `${cart.length} jenis barang`, cartTotal, arusKas);
    setBarang(updatedBarang); setTransaksi(updatedTrx); setArusKas(ak); setCart([]); setBayarNominal("");
    save(members, simpananPokok, simpananWajib, updatedBarang, updatedTrx, ak, pembayaran);
    setShowStruk(trx);
  };

  const addPengeluaran = (data) => {
    const ak = addKas("keluar", data.kategori, data.keterangan, parseInt(data.jumlah), arusKas);
    setArusKas(ak); save(members, simpananPokok, simpananWajib, barang, transaksi, ak, pembayaran); setShowPengeluaran(false);
  };

  const currentMonth = new Date().getMonth();
  const isAdmin = user?.role === "admin";
  const isPengelola = user?.role === "pengelola";
  const isAnggota = user?.role === "anggota";
    useEffect(() => {
    if (isPengelola) setTab("kasir");
  }, [user]);

  // COMPUTED STATS
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

    const monthlyProfit = transaksi.filter(t => { const d = new Date(t.tgl); return d.getMonth() === filterBulan && d.getFullYear() === TAHUN_AKTIF; })
      .reduce((s, t) => s + t.items.reduce((si, it) => si + (it.harga - (it.hargaBeli || 0)) * it.qty, 0), 0);

    return { activeM, tPokok, tWajib, todayTrx, todayOmzet, lowStock, bulanIni, totalMasuk, totalKeluar, saldoKas, monthlyProfit };
  }, [members, simpananPokok, simpananWajib, transaksi, barang, arusKas, filterBulan]);

  const S = {
    app: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', maxWidth: 480, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", background: "#FDF8F0", color: "#1E293B" },
    header: { background: "#2563EB", color: "white", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    headerTitle: { fontSize: 18, fontWeight: 600, letterSpacing: 0.5 },
    headerSub: { fontSize: 12, opacity: 0.85, marginTop: 2 },
    content: { flex: 1, padding: "12px 12px 80px", overflowY: "auto" },
    bottomNav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", background: "white", borderTop: "1px solid #E2E8F0", paddingBottom: 8, zIndex: 10 },
    navItem: (a) => ({ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "8px 0 4px", fontSize: 11, color: a ? "#2563EB" : "#94A3B8", cursor: "pointer", background: "none", border: "none", fontWeight: a ? 600 : 400 }),
    card: { background: "white", borderRadius: 12, padding: "12px 14px", border: "1px solid #E8E4DC", marginBottom: 8 },
    statCard: { background: "white", borderRadius: 10, padding: "10px 14px", border: "1px solid #E8E4DC", flex: 1 },
    btn: (c = "#2563EB") => ({ background: c, color: "white", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 500, cursor: "pointer", width: "100%" }),
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
    bigStat: (color) => ({ textAlign: "center", ...({ background: "white", borderRadius: 12, padding: "14px", border: "1px solid #E8E4DC", flex: 1 }), }),
  };

  if (!loaded) return <div style={{ ...S.app, alignItems: "center", justifyContent: "center" }}><p style={{ color: "#64748B" }}>Memuat data...</p></div>;

    // LOGIN & REGISTER
  if (!user) {
    if (showRegister) {
      return (
        <div style={{ ...S.app, padding: 24 }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <img src="/Logo_Koperasi.png" alt="BAZARA" style={{ width: 180, marginBottom: 8 }} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, textAlign: "center", marginBottom: 16, color: "#2563EB" }}>Pendaftaran Anggota</div>
          <div style={{ width: "100%", maxWidth: 360, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
            <input style={S.input} placeholder="Nama lengkap" value={regData.nama} onChange={e => setRegData({...regData, nama: e.target.value})} />
            <input style={S.input} placeholder="Alamat" value={regData.alamat} onChange={e => setRegData({...regData, alamat: e.target.value})} />
            <input style={S.input} placeholder="No. HP" value={regData.hp} onChange={e => setRegData({...regData, hp: e.target.value})} />
            <input style={S.input} placeholder="Buat PIN (minimal 4 digit)" type="password" inputMode="numeric" value={regData.pin} onChange={e => setRegData({...regData, pin: e.target.value.replace(/\D/g,"")})} maxLength={6} />
            <input style={S.input} placeholder="Ulangi PIN" type="password" inputMode="numeric" value={regData.pinConfirm} onChange={e => setRegData({...regData, pinConfirm: e.target.value.replace(/\D/g,"")})} maxLength={6} />
            <div style={{ fontSize: 13, fontWeight: 600, color: "#64748B", marginTop: 4 }}>Pembayaran simpanan pokok
              <label key={i} style={{ ...S.card, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 0, border: regData.angsuran === i ? "2px solid #2563EB" : "1px solid #E8E4DC" }}>
                <input type="radio" name="angsuran" checked={regData.angsuran === i} onChange={() => setRegData({...regData, angsuran: i})} />
                <div><div style={{ fontSize: 14, fontWeight: 500 }}>{o.label}</div><div style={{ fontSize: 12, color: "#64748B" }}>Rp {fmt(o.perBulan)}{o.kali > 1 ? ` × ${o.kali} bulan` : ""}</div></div>
              </label>
            ))}
            {regError && <p style={{ color: "#DC2626", fontSize: 12, margin: 0 }}>{regError}</p>}
            {regSuccess && <div style={{ background: "#DCFCE7", color: "#166534", padding: 12, borderRadius: 8, fontSize: 13 }}>{regSuccess}</div>}
            <button style={S.btn()} onClick={handleRegister}>Daftar</button>
            <button style={{ ...S.btn("transparent"), color: "#2563EB", border: "1.5px solid #2563EB" }} onClick={() => { setShowRegister(false); setRegSuccess(""); setRegError(""); }}>Kembali ke login</button>
          </div>
        </div>
      );
    }
    return (
      <div style={{ ...S.app, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src="/Logo_Koperasi.png" alt="BAZARA" style={{ width: 200, marginBottom: 8 }} />
        </div>
        <div style={{ width: "100%", maxWidth: 320 }}>
          <input style={{ ...S.input, marginBottom: 10 }} placeholder="No. HP atau Nomor Anggota" value={loginId} onChange={e => setLoginId(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
          <input style={{ ...S.input, marginBottom: 8 }} type="password" placeholder="PIN" inputMode="numeric" value={loginPw} onChange={e => setLoginPw(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
          {loginError && <p style={{ color: "#DC2626", fontSize: 12, margin: "0 0 8px" }}>{loginError}</p>}
          <button style={{ ...S.btn(), marginBottom: 10 }} onClick={handleLogin}>Masuk</button>
          <button style={{ ...S.btn("transparent"), color: "#2563EB", border: "1.5px solid #2563EB" }} onClick={() => setShowRegister(true)}>Daftar jadi anggota</button>
        </div>
      </div>
    );
  }

  // MEMBER VIEW
  if (!isAdmin) {
    const me = members.find(m => m.id === user.id);
    const pokok = simpananPokok[user.id];
    const wajib = simpananWajib[user.id] || [];
    const totalWajib = wajib.length * SIMPANAN_WAJIB;
    return (
      <div style={S.app}>
        <div style={S.header}><div><div style={S.headerTitle}>Hai, {me?.nama?.split(" ")[0]}</div><div style={S.headerSub}>{user.id}</div></div><button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Keluar</button></div>
        <div style={S.content}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Simpanan pokok</div><div style={{ fontSize: 18, fontWeight: 600, color: pokok?.lunas ? "#16A34A" : "#DC2626", marginTop: 2 }}>{pokok?.lunas ? "Lunas" : "Belum"}</div><div style={{ fontSize: 11, color: "#94A3B8" }}>Rp {fmt(SIMPANAN_POKOK)}</div></div>
            <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Simpanan wajib</div><div style={{ fontSize: 18, fontWeight: 600, color: "#2563EB", marginTop: 2 }}>Rp {fmt(totalWajib)}</div><div style={{ fontSize: 11, color: "#94A3B8" }}>{wajib.length} bulan terbayar</div></div>
          </div>
          <div style={S.card}><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Simpanan wajib {TAHUN_AKTIF}</div><div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{BULAN.map((b, i) => (<div key={i} style={S.monthDot(wajib.includes(i) ? "paid" : i > currentMonth ? "future" : "unpaid")}>{b.charAt(0)}</div>))}</div><div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 11, color: "#64748B" }}><span>🟢 Lunas</span><span>🔴 Belum</span><span>⚪ Belum jatuh tempo</span></div></div>
          <div style={S.card}><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Data pribadi</div>{[["Nama", me?.nama], ["Alamat", me?.alamat], ["No. HP", me?.hp], ["Tgl masuk", me?.tglMasuk], ["Status", me?.status]].map(([l,v]) => (<div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F1F5F9", fontSize: 13 }}><span style={{ color: "#64748B" }}>{l}</span><span style={{ fontWeight: 500 }}>{v}</span></div>))}</div>
          <div style={{ ...S.card, textAlign: "center" }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Total simpanan Anda</div><div style={{ fontSize: 24, fontWeight: 700, color: "#2563EB" }}>Rp {fmt((pokok?.lunas ? SIMPANAN_POKOK : 0) + totalWajib)}</div></div>
          <button style={{ ...S.btn(), marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={() => setShowBayarForm(true)}>
            Kirim bukti pembayaran
          </button>

          {/* Riwayat pembayaran anggota */}
          {pembayaran.filter(p => p.anggotaId === user.id).length > 0 && (<>
            <div style={S.sectionTitle}>Riwayat pembayaran Anda</div>
            {pembayaran.filter(p => p.anggotaId === user.id).slice(0, 10).map(p => (
              <div key={p.id} style={{ ...S.card, borderLeft: `3px solid ${p.status === "diterima" ? "#16A34A" : p.status === "ditolak" ? "#DC2626" : "#F59E0B"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div><div style={{ fontSize: 13, fontWeight: 600 }}>{p.jenis}</div><div style={{ fontSize: 11, color: "#64748B" }}>{p.tgl} · {p.keterangan}</div></div>
                  <div style={{ textAlign: "right" }}><div style={{ fontSize: 14, fontWeight: 700, color: "#2563EB" }}>Rp {fmt(p.jumlah)}</div><span style={S.badge(p.status === "diterima" ? "aktif" : p.status === "ditolak" ? "non-aktif" : "low")}>{p.status}</span></div>
                </div>
              </div>
            ))}
          </>)}

  // ADMIN VIEW
  const filteredMembers = members.filter(m => m.nama.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase()));
  const filteredBarang = barang.filter(b => b.nama.toLowerCase().includes(searchBarang.toLowerCase()) || b.kode.toLowerCase().includes(searchBarang.toLowerCase()));

  const MemberForm = ({ initial, onSave, onCancel, title }) => {
    const [f, setF] = useState(initial || { nama: "", alamat: "", hp: "" });
    const [err, setErr] = useState("");
    return (<div style={S.modal} onClick={onCancel}><div style={S.modalContent} onClick={e => e.stopPropagation()}><div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>{title}</span><button onClick={onCancel} style={S.closeBtn}>✕</button></div><div style={{ display: "flex", flexDirection: "column", gap: 10 }}><input style={S.input} placeholder="Nama lengkap" value={f.nama} onChange={e => { setF({...f, nama: e.target.value}); setErr(""); }} /><input style={S.input} placeholder="Alamat" value={f.alamat} onChange={e => setF({...f, alamat: e.target.value})} /><input style={S.input} placeholder="No. HP" value={f.hp} onChange={e => setF({...f, hp: e.target.value})} />{err && <p style={{ color: "#DC2626", fontSize: 12, margin: 0 }}>{err}</p>}<button style={S.btn()} onClick={() => { if (!f.nama.trim()) { setErr("Nama wajib diisi"); return; } onSave(f); }}>Simpan</button></div></div></div>);
  };

  const BarangForm = ({ initial, onSave, onCancel, title }) => {
    const [f, setF] = useState(initial || { kode: "", nama: "", kategori: "Sembako", hargaBeli: "", hargaJual: "", stok: "" });
    const [err, setErr] = useState("");
    return (<div style={S.modal} onClick={onCancel}><div style={S.modalContent} onClick={e => e.stopPropagation()}><div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>{title}</span><button onClick={onCancel} style={S.closeBtn}>✕</button></div><div style={{ display: "flex", flexDirection: "column", gap: 10 }}><input style={S.input} placeholder="Kode barang" value={f.kode} onChange={e => setF({...f, kode: e.target.value})} /><input style={S.input} placeholder="Nama barang" value={f.nama} onChange={e => { setF({...f, nama: e.target.value}); setErr(""); }} /><select style={S.input} value={f.kategori} onChange={e => setF({...f, kategori: e.target.value})}>{["Sembako","Bumbu","Makanan","Minuman","Kebersihan","Lainnya"].map(k => <option key={k} value={k}>{k}</option>)}</select><div style={{ display: "flex", gap: 8 }}><input style={S.input} placeholder="Harga beli" type="number" value={f.hargaBeli} onChange={e => setF({...f, hargaBeli: e.target.value})} /><input style={S.input} placeholder="Harga jual" type="number" value={f.hargaJual} onChange={e => setF({...f, hargaJual: e.target.value})} /></div><input style={S.input} placeholder="Stok awal" type="number" value={f.stok} onChange={e => setF({...f, stok: e.target.value})} />{err && <p style={{ color: "#DC2626", fontSize: 12, margin: 0 }}>{err}</p>}<button style={S.btn()} onClick={() => { if (!f.nama.trim()) { setErr("Nama barang wajib diisi"); return; } if (!f.hargaJual) { setErr("Harga jual wajib diisi"); return; } onSave({ ...f, hargaBeli: parseInt(f.hargaBeli) || 0, hargaJual: parseInt(f.hargaJual) || 0, stok: parseInt(f.stok) || 0 }); }}>Simpan</button></div></div></div>);
  };

  const PengeluaranForm = () => {
    const [f, setF] = useState({ kategori: KATEGORI_PENGELUARAN[0], keterangan: "", jumlah: "" });
    const [err, setErr] = useState("");
    return (<div style={S.modal} onClick={() => setShowPengeluaran(false)}><div style={S.modalContent} onClick={e => e.stopPropagation()}><div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>Catat pengeluaran</span><button onClick={() => setShowPengeluaran(false)} style={S.closeBtn}>✕</button></div><div style={{ display: "flex", flexDirection: "column", gap: 10 }}><select style={S.input} value={f.kategori} onChange={e => setF({...f, kategori: e.target.value})}>{KATEGORI_PENGELUARAN.map(k => <option key={k} value={k}>{k}</option>)}</select><input style={S.input} placeholder="Keterangan" value={f.keterangan} onChange={e => { setF({...f, keterangan: e.target.value}); setErr(""); }} /><input style={S.input} placeholder="Jumlah (Rp)" type="number" value={f.jumlah} onChange={e => setF({...f, jumlah: e.target.value})} />{err && <p style={{ color: "#DC2626", fontSize: 12, margin: 0 }}>{err}</p>}<button style={S.btn("#DC2626")} onClick={() => { if (!f.keterangan.trim()) { setErr("Keterangan wajib diisi"); return; } if (!f.jumlah || parseInt(f.jumlah) <= 0) { setErr("Jumlah harus lebih dari 0"); return; } addPengeluaran(f); }}>Simpan pengeluaran</button></div></div></div>);
  };

  const MemberDetail = ({ member, onClose }) => {
    const pokok = simpananPokok[member.id]; const wajib = simpananWajib[member.id] || [];
    return (<div style={S.modal} onClick={onClose}><div style={S.modalContent} onClick={e => e.stopPropagation()}><div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>Detail anggota</span><button onClick={onClose} style={S.closeBtn}>✕</button></div><div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}><div style={S.avatar(member.status === "aktif" ? "#2563EB" : "#94A3B8")}>{member.nama.split(" ").map(n => n[0]).join("").substring(0,2)}</div><div><div style={{ fontWeight: 600, fontSize: 15 }}>{member.nama}</div><div style={{ fontSize: 12, color: "#64748B" }}>{member.id}</div></div><span style={S.badge(member.status)}>{member.status}</span></div>{[["Alamat", member.alamat], ["No. HP", member.hp], ["Tgl masuk", member.tglMasuk], ["Password", member.password]].map(([l,v]) => (<div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F1F5F9", fontSize: 13 }}><span style={{ color: "#64748B" }}>{l}</span><span style={{ fontWeight: 500 }}>{v}</span></div>))}<div style={{ ...S.sectionTitle, marginTop: 16 }}>Simpanan pokok — Rp {fmt(SIMPANAN_POKOK)}</div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", ...S.card }}><span style={{ fontWeight: 500, fontSize: 14, color: pokok?.lunas ? "#16A34A" : "#DC2626" }}>{pokok?.lunas ? `Lunas (${pokok.tgl})` : "Belum bayar"}</span>{!pokok?.lunas && <button style={S.btnOutline} onClick={() => bayarPokok(member.id)}>Bayar</button>}</div><div style={S.sectionTitle}>Simpanan wajib {TAHUN_AKTIF} — Rp {fmt(SIMPANAN_WAJIB)}/bln</div><div style={S.card}><div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{BULAN.map((b, i) => (<div key={i} style={S.monthDot(wajib.includes(i) ? "paid" : i > currentMonth ? "future" : "unpaid")} onClick={() => i <= currentMonth && toggleWajib(member.id, i)}>{b}</div>))}</div><div style={{ fontSize: 12, color: "#64748B", marginTop: 8 }}>Total: Rp {fmt(wajib.length * SIMPANAN_WAJIB)} ({wajib.length} bulan)</div></div><div style={{ display: "flex", gap: 8, marginTop: 16 }}><button style={{ ...S.btnOutline, flex: 1 }} onClick={() => { onClose(); setEditMember(member); }}>Edit data</button><button style={{ ...S.btn(member.status === "aktif" ? "#DC2626" : "#16A34A"), flex: 1, fontSize: 13 }} onClick={() => { toggleStatus(member.id); onClose(); }}>{member.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}</button></div></div></div>);
  };

  return (
    <div style={S.app}>
      <div style={S.header}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><img src="/Logo_Koperasi.png" alt="BAZARA" style={{ height: 32 }} /><div><div style={S.headerTitle}>BAZARA</div></div></div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {stats.lowStock.length > 0 && tab !== "kasir" && <span style={{ background: "#FEF3C7", color: "#92400E", fontSize: 10, padding: "3px 8px", borderRadius: 10, fontWeight: 600 }}>⚠ {stats.lowStock.length} stok rendah</span>}
          <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Keluar</button>
        </div>
      </div>

      <div style={S.content}>
        {/* === TAB ANGGOTA === */}
        {tab === "anggota" && (<>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Total anggota</div><div style={{ fontSize: 20, fontWeight: 700, color: "#2563EB" }}>{stats.activeM.length}</div><div style={{ fontSize: 11, color: "#94A3B8" }}>aktif dari {members.length}</div></div>
            <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Total simpanan</div><div style={{ fontSize: 20, fontWeight: 700, color: "#16A34A" }}>Rp {fmt(stats.tPokok + stats.tWajib)}</div><div style={{ fontSize: 11, color: "#94A3B8" }}>pokok + wajib</div></div>
          </div>
          <input style={{ ...S.input, marginBottom: 12 }} placeholder="Cari nama atau nomor anggota..." value={search} onChange={e => setSearch(e.target.value)} />
          {filteredMembers.map(m => (<div key={m.id} style={{ ...S.card, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setDetailMember(m)}><div style={S.avatar(m.status === "aktif" ? "#2563EB" : "#94A3B8")}>{m.nama.split(" ").map(n => n[0]).join("").substring(0,2)}</div><div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 500 }}>{m.nama}</div><div style={{ fontSize: 12, color: "#64748B" }}>{m.id}</div></div><span style={S.badge(m.status)}>{m.status}</span></div>))}
          <button style={S.fab} onClick={() => setShowForm(true)}>+</button>
        </>)}

        {/* === TAB SIMPANAN === */}
        {tab === "simpanan" && (<>
          <div style={{ display: "flex", gap: 0, marginBottom: 12, borderBottom: "1px solid #E2E8F0" }}><button style={S.tabBtn(subTab === "wajib")} onClick={() => setSimpananTab("wajib")}>Simpanan wajib</button><button style={S.tabBtn(subTab === "pokok")} onClick={() => setSimpananTab("pokok")}>Simpanan pokok</button></div>
          {subTab === "wajib" && (<><div style={{ display: "flex", gap: 8, marginBottom: 12 }}><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Sudah bayar</div><div style={{ fontSize: 20, fontWeight: 700, color: "#16A34A" }}>{stats.activeM.filter(m => (simpananWajib[m.id] || []).includes(currentMonth)).length}</div></div><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Belum bayar</div><div style={{ fontSize: 20, fontWeight: 700, color: "#DC2626" }}>{stats.activeM.filter(m => !(simpananWajib[m.id] || []).includes(currentMonth)).length}</div></div></div><div style={S.sectionTitle}>Rp {fmt(SIMPANAN_WAJIB)} / bulan — {TAHUN_AKTIF}</div>{stats.activeM.map(m => { const w = simpananWajib[m.id] || []; return (<div key={m.id} style={S.card}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 13, fontWeight: 600 }}>{m.nama}</span><span style={{ fontSize: 12, color: "#2563EB", fontWeight: 500 }}>Rp {fmt(w.length * SIMPANAN_WAJIB)}</span></div><div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>{BULAN.map((b, i) => (<div key={i} style={S.monthDot(w.includes(i) ? "paid" : i > currentMonth ? "future" : "unpaid")} onClick={() => i <= currentMonth && toggleWajib(m.id, i)}>{b.substring(0,1)}</div>))}</div></div>); })}</>)}
          {subTab === "pokok" && (<><div style={{ display: "flex", gap: 8, marginBottom: 12 }}><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Sudah lunas</div><div style={{ fontSize: 20, fontWeight: 700, color: "#16A34A" }}>{Object.values(simpananPokok).filter(s => s.lunas).length}</div></div><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Belum lunas</div><div style={{ fontSize: 20, fontWeight: 700, color: "#DC2626" }}>{stats.activeM.length - Object.values(simpananPokok).filter(s => s.lunas).length}</div></div></div><div style={S.sectionTitle}>Rp {fmt(SIMPANAN_POKOK)} (sekali bayar)</div>{stats.activeM.map(m => { const s = simpananPokok[m.id]; return (<div key={m.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontSize: 13, fontWeight: 600 }}>{m.nama}</div><div style={{ fontSize: 11, color: "#64748B" }}>{m.id}</div></div>{s?.lunas ? <span style={S.badge("aktif")}>Lunas</span> : <button style={S.btnOutline} onClick={() => bayarPokok(m.id)}>Bayar</button>}</div>); })}</>)}
        </>)}

        {/* === TAB KASIR === */}
        {tab === "kasir" && (<>
          <div style={{ display: "flex", gap: 0, marginBottom: 12, borderBottom: "1px solid #E2E8F0" }}><button style={S.tabBtn(kasirTab === "kasir")} onClick={() => setKasirTab("kasir")}>Kasir</button><button style={S.tabBtn(kasirTab === "stok")} onClick={() => setKasirTab("stok")}>Stok barang</button></div>
          {kasirTab === "kasir" && (<>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Transaksi hari ini</div><div style={{ fontSize: 20, fontWeight: 700, color: "#2563EB" }}>{stats.todayTrx.length}</div></div><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Omzet hari ini</div><div style={{ fontSize: 20, fontWeight: 700, color: "#16A34A" }}>Rp {fmt(stats.todayOmzet)}</div></div></div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}><input style={{ ...S.input, flex: 1 }} placeholder="Cari barang..." value={searchBarang} onChange={e => setSearchBarang(e.target.value)} /><button style={{ ...S.btnSm("#64748B"), whiteSpace: "nowrap" }} onClick={() => setShowHistori(true)}>Riwayat</button></div>
            {searchBarang && (<div style={{ marginBottom: 12 }}>{filteredBarang.slice(0, 6).map(b => (<div key={b.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontSize: 13, fontWeight: 600 }}>{b.nama}</div><div style={{ fontSize: 12, color: "#64748B" }}>Rp {fmt(b.hargaJual)} · Stok: {b.stok}</div></div><button style={S.btnSm(b.stok > 0 ? "#2563EB" : "#CBD5E1")} onClick={() => addToCart(b)} disabled={b.stok <= 0}>+ Tambah</button></div>))}</div>)}
            {cart.length > 0 && (<><div style={S.sectionTitle}>Keranjang ({cartCount} item)</div>{cart.map(c => (<div key={c.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{c.nama}</div><div style={{ fontSize: 12, color: "#64748B" }}>Rp {fmt(c.hargaJual)} × {c.qty} = <span style={{ color: "#2563EB", fontWeight: 600 }}>Rp {fmt(c.hargaJual * c.qty)}</span></div></div><div style={{ display: "flex", alignItems: "center", gap: 6 }}><button style={S.qtyBtn} onClick={() => updateCartQty(c.id, -1)}>−</button><span style={{ fontSize: 14, fontWeight: 600, minWidth: 20, textAlign: "center" }}>{c.qty}</span><button style={S.qtyBtn} onClick={() => updateCartQty(c.id, 1)}>+</button><button style={{ ...S.qtyBtn, background: "#DC2626", marginLeft: 4, fontSize: 12 }} onClick={() => removeFromCart(c.id)}>✕</button></div></div>))}<div style={{ ...S.card, background: "#EFF6FF", border: "1px solid #BFDBFE" }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}><span style={{ fontSize: 15, fontWeight: 600 }}>Total</span><span style={{ fontSize: 18, fontWeight: 700, color: "#2563EB" }}>Rp {fmt(cartTotal)}</span></div><input style={{ ...S.input, marginBottom: 8 }} placeholder="Nominal bayar" value={bayarNominal} onChange={e => setBayarNominal(e.target.value)} type="number" />{bayarNominal && parseInt(bayarNominal) >= cartTotal && (<div style={{ fontSize: 13, color: "#16A34A", fontWeight: 500, marginBottom: 8 }}>Kembalian: Rp {fmt(parseInt(bayarNominal) - cartTotal)}</div>)}<button style={S.btn(parseInt(bayarNominal || 0) >= cartTotal ? "#16A34A" : "#CBD5E1")} onClick={prosesTransaksi} disabled={parseInt(bayarNominal || 0) < cartTotal}>Proses pembayaran</button></div></>)}
            {cart.length === 0 && !searchBarang && (<div style={{ textAlign: "center", padding: "40px 20px", color: "#94A3B8" }}><div style={{ fontSize: 36, marginBottom: 8 }}>🛒</div><div style={{ fontSize: 14, color: "#64748B" }}>Ketik nama barang untuk mulai transaksi</div></div>)}
          </>)}
          {kasirTab === "stok" && (<>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Jenis barang</div><div style={{ fontSize: 20, fontWeight: 700, color: "#2563EB" }}>{barang.length}</div></div><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Stok rendah</div><div style={{ fontSize: 20, fontWeight: 700, color: stats.lowStock.length > 0 ? "#DC2626" : "#16A34A" }}>{stats.lowStock.length}</div></div></div>
            {stats.lowStock.length > 0 && (<><div style={S.sectionTitle}>⚠ Stok perlu diisi ulang</div>{stats.lowStock.map(b => (<div key={b.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "3px solid #F59E0B" }}><div><div style={{ fontSize: 13, fontWeight: 600 }}>{b.nama}</div><div style={{ fontSize: 12, color: "#64748B" }}>Stok: <span style={{ color: "#DC2626", fontWeight: 600 }}>{b.stok}</span></div></div><button style={S.btnSm("#F59E0B")} onClick={() => setShowRestok(b)}>Restok</button></div>))}</>)}
            <div style={S.sectionTitle}>Semua barang</div>
            {barang.map(b => (<div key={b.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{b.nama}</div><div style={{ fontSize: 11, color: "#64748B" }}>{b.kode} · {b.kategori}</div><div style={{ fontSize: 12, marginTop: 2 }}><span style={{ color: "#64748B" }}>Beli: Rp {fmt(b.hargaBeli)}</span> · <span style={{ color: "#2563EB", fontWeight: 500 }}>Jual: Rp {fmt(b.hargaJual)}</span></div></div><div style={{ textAlign: "right" }}><div style={{ fontSize: 16, fontWeight: 700, color: b.stok <= STOK_WARNING ? "#DC2626" : "#1E293B" }}>{b.stok}</div><div style={{ display: "flex", gap: 4, marginTop: 4 }}><button style={S.btnSm("#64748B")} onClick={() => setEditBarang(b)}>Edit</button><button style={S.btnSm("#F59E0B")} onClick={() => setShowRestok(b)}>+Stok</button></div></div></div>))}
            <button style={S.fab} onClick={() => setShowBarangForm(true)}>+</button>
          </>)}
        </>)}

        {/* === TAB LAPORAN === */}
        {tab === "laporan" && (<>
          <div style={{ display: "flex", gap: 0, marginBottom: 12, borderBottom: "1px solid #E2E8F0" }}>
            <button style={S.tabBtn(laporanTab === "dashboard")} onClick={() => setLaporanTab("dashboard")}>Dashboard</button>
            <button style={S.tabBtn(laporanTab === "aruskas")} onClick={() => setLaporanTab("aruskas")}>Arus kas</button>
          </div>

          {/* FILTER BULAN */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: "#64748B" }}>Bulan:</span>
            <select style={{ ...S.input, width: "auto", padding: "6px 10px", fontSize: 13 }} value={filterBulan} onChange={e => setFilterBulan(parseInt(e.target.value))}>
              {BULAN.map((b, i) => <option key={i} value={i}>{b} {TAHUN_AKTIF}</option>)}
            </select>
          </div>

          {laporanTab === "dashboard" && (<>
            {/* RINGKASAN KOPERASI */}
            <div style={S.sectionTitle}>Ringkasan koperasi</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Anggota aktif</div><div style={{ fontSize: 22, fontWeight: 700, color: "#2563EB" }}>{stats.activeM.length}</div></div>
              <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Saldo kas</div><div style={{ fontSize: 22, fontWeight: 700, color: stats.saldoKas >= 0 ? "#16A34A" : "#DC2626" }}>Rp {fmt(stats.saldoKas)}</div></div>
              <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Total simpanan</div><div style={{ fontSize: 18, fontWeight: 700, color: "#2563EB" }}>Rp {fmt(stats.tPokok + stats.tWajib)}</div></div>
              <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Stok rendah</div><div style={{ fontSize: 22, fontWeight: 700, color: stats.lowStock.length > 0 ? "#DC2626" : "#16A34A" }}>{stats.lowStock.length} item</div></div>
            </div>

            {/* KEUANGAN BULAN INI */}
            <div style={S.sectionTitle}>Keuangan — {BULAN[filterBulan]} {TAHUN_AKTIF}</div>
            <div style={{ ...S.card, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14 }}>
                <span style={{ color: "#166534" }}>Pemasukan</span>
                <span style={{ fontWeight: 700, color: "#166534" }}>Rp {fmt(stats.totalMasuk)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14 }}>
                <span style={{ color: "#991B1B" }}>Pengeluaran</span>
                <span style={{ fontWeight: 700, color: "#991B1B" }}>Rp {fmt(stats.totalKeluar)}</span>
              </div>
              <div style={{ borderTop: "1px solid #BBF7D0", marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 15 }}>
                <span style={{ fontWeight: 600 }}>Selisih</span>
                <span style={{ fontWeight: 700, color: stats.totalMasuk - stats.totalKeluar >= 0 ? "#166534" : "#991B1B" }}>
                  Rp {fmt(stats.totalMasuk - stats.totalKeluar)}
                </span>
              </div>
            </div>

            {/* LABA KOTOR TOKO */}
            <div style={S.sectionTitle}>Laba kotor toko — {BULAN[filterBulan]}</div>
            <div style={{ ...S.card }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: stats.monthlyProfit > 0 ? "#16A34A" : "#64748B", textAlign: "center" }}>
                Rp {fmt(stats.monthlyProfit)}
              </div>
              <div style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 4 }}>Selisih harga jual - harga beli dari penjualan</div>
            </div>

            {/* STOK RENDAH */}
            {stats.lowStock.length > 0 && (<>
              <div style={S.sectionTitle}>⚠ Perlu restok</div>
              {stats.lowStock.map(b => (
                <div key={b.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "3px solid #F59E0B" }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{b.nama}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#DC2626" }}>{b.stok} pcs</span>
                </div>
              ))}
            </>)}

            {/* SIMPANAN BELUM BAYAR */}
            {(() => {
              const belum = stats.activeM.filter(m => !(simpananWajib[m.id] || []).includes(currentMonth));
              return belum.length > 0 ? (<>
                <div style={S.sectionTitle}>Simpanan wajib belum bayar — {BULAN[currentMonth]}</div>
                            {/* PEMBAYARAN MENUNGGU VERIFIKASI */}
            {(() => {
              const pending = pembayaran.filter(p => p.status === "menunggu");
              return pending.length > 0 ? (<>
                <div style={S.sectionTitle}>🔔 Pembayaran menunggu verifikasi ({pending.length})</div>
                {pending.map(p => {
                  const anggota = members.find(m => m.id === p.anggotaId);
                  return (
                    <div key={p.id} style={{ ...S.card, borderLeft: "3px solid #F59E0B" }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{anggota?.nama || p.anggotaId}</div>
                      <div style={{ fontSize: 12, color: "#64748B" }}>{p.jenis} · Rp {fmt(p.jumlah)}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8" }}>{p.tgl} · Bukti: {p.bukti}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        <button style={S.btnSm("#16A34A")} onClick={() => {
                          const updated = pembayaran.map(x => x.id === p.id ? { ...x, status: "diterima" } : x);
                          setPembayaran(updated);
                          save(members, simpananPokok, simpananWajib, barang, transaksi, arusKas, updated);
                        }}>✓ Terima</button>
                        <button style={S.btnSm("#DC2626")} onClick={() => {
                          const updated = pembayaran.map(x => x.id === p.id ? { ...x, status: "ditolak" } : x);
                          setPembayaran(updated);
                          save(members, simpananPokok, simpananWajib, barang, transaksi, arusKas, updated);
                        }}>✕ Tolak</button>
                      </div>
                    </div>
                  );
                })}
              </>) : null;
            })()}

          {laporanTab === "aruskas" && (<>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Masuk</div><div style={{ fontSize: 18, fontWeight: 700, color: "#16A34A" }}>Rp {fmt(stats.totalMasuk)}</div></div>
              <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Keluar</div><div style={{ fontSize: 18, fontWeight: 700, color: "#DC2626" }}>Rp {fmt(stats.totalKeluar)}</div></div>
            </div>

            <button style={{ ...S.btn("#DC2626"), marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={() => setShowPengeluaran(true)}>
              + Catat pengeluaran
            </button>

            <div style={S.sectionTitle}>Riwayat — {BULAN[filterBulan]} {TAHUN_AKTIF}</div>
            {stats.bulanIni.length === 0 ? (
              <div style={{ textAlign: "center", padding: 30, color: "#94A3B8", fontSize: 13 }}>Belum ada catatan bulan ini</div>
            ) : stats.bulanIni.map(a => (
              <div key={a.id} style={{ ...S.card, borderLeft: `3px solid ${a.tipe === "masuk" ? "#16A34A" : "#DC2626"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{a.kategori}</div>
                    <div style={{ fontSize: 12, color: "#64748B" }}>{a.keterangan}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{a.tgl} · {a.waktu}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: a.tipe === "masuk" ? "#16A34A" : "#DC2626" }}>
                      {a.tipe === "masuk" ? "+" : "−"} Rp {fmt(a.jumlah)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </>)}
        </>)}
      </div>

      {/* BOTTOM NAV */}
      <div style={S.bottomNav}>
        {[
          ...(isAdmin ? [{ key: "anggota", icon: "👥", label: "Anggota" }] : []),
          ...(isAdmin ? [{ key: "simpanan", icon: "💰", label: "Simpanan" }] : []),
          ...(isAdmin || isPengelola ? [{ key: "kasir", icon: "🛒", label: "Kasir" }] : []),
          ...(isAdmin ? [{ key: "laporan", icon: "📊", label: "Laporan" }] : []),
        ].map(n => (
          <button key={n.key} style={{ ...S.navItem(tab === n.key), flex: 1 }} onClick={() => { setTab(n.key); setSearch(""); setSearchBarang(""); }}>
            <span style={{ fontSize: 20 }}>{n.icon}</span>{n.label}
            {n.key === "kasir" && cart.length > 0 && <span style={{ background: "#DC2626", color: "white", fontSize: 9, padding: "1px 5px", borderRadius: 8, marginTop: -2 }}>{cartCount}</span>}
          </button>
        ))}
      </div>

      {/* ALL MODALS */}
      {showForm && <MemberForm title="Tambah anggota baru" onSave={addMember} onCancel={() => setShowForm(false)} />}
      {editMember && <MemberForm title="Edit data anggota" initial={editMember} onSave={(d) => updateMember({ ...editMember, ...d })} onCancel={() => setEditMember(null)} />}
      {detailMember && <MemberDetail member={members.find(m => m.id === detailMember.id) || detailMember} onClose={() => setDetailMember(null)} />}
      {showBarangForm && <BarangForm title="Tambah barang baru" onSave={addBarang} onCancel={() => setShowBarangForm(false)} />}
      {editBarang && <BarangForm title="Edit barang" initial={editBarang} onSave={(d) => updateBarang({ ...editBarang, ...d })} onCancel={() => setEditBarang(null)} />}
      {showPengeluaran && <PengeluaranForm />}

      {showRestok && (() => { const RestokModal = () => { const [qty, setQty] = useState(""); const [biaya, setBiaya] = useState(""); return (<div style={S.modal} onClick={() => setShowRestok(null)}><div style={{ ...S.modalContent, paddingBottom: 24 }} onClick={e => e.stopPropagation()}><div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>Restok: {showRestok.nama}</span><button onClick={() => setShowRestok(null)} style={S.closeBtn}>✕</button></div><div style={{ fontSize: 13, color: "#64748B", marginBottom: 12 }}>Stok saat ini: <span style={{ fontWeight: 600, color: "#1E293B" }}>{showRestok.stok}</span></div><input style={{ ...S.input, marginBottom: 8 }} placeholder="Jumlah tambahan" type="number" value={qty} onChange={e => setQty(e.target.value)} /><input style={{ ...S.input, marginBottom: 10 }} placeholder="Total biaya beli (Rp)" type="number" value={biaya} onChange={e => setBiaya(e.target.value)} /><button style={S.btn()} onClick={() => { if (parseInt(qty) > 0) restokBarang(showRestok.id, parseInt(qty), parseInt(biaya) || 0); }}>Tambah stok</button></div></div>); }; return <RestokModal />; })()}

      {showStruk && (<div style={S.modal} onClick={() => setShowStruk(null)}><div style={{ ...S.modalContent, textAlign: "center" }} onClick={e => e.stopPropagation()}><div style={{ fontSize: 24, color: "#16A34A", marginBottom: 8 }}>✓</div><div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Transaksi berhasil</div><div style={{ fontSize: 12, color: "#64748B", marginBottom: 16 }}>{showStruk.tgl} · {showStruk.waktu}</div><div style={{ textAlign: "left", borderTop: "1px dashed #CBD5E1", paddingTop: 12 }}>{showStruk.items.map((item, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}><span>{item.nama} ×{item.qty}</span><span style={{ fontWeight: 500 }}>Rp {fmt(item.subtotal)}</span></div>))}<div style={{ borderTop: "1px dashed #CBD5E1", marginTop: 8, paddingTop: 8 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700 }}><span>Total</span><span>Rp {fmt(showStruk.total)}</span></div><div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748B", marginTop: 4 }}><span>Bayar</span><span>Rp {fmt(showStruk.bayar)}</span></div><div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#16A34A", fontWeight: 500 }}><span>Kembalian</span><span>Rp {fmt(showStruk.kembalian)}</span></div></div></div><button style={{ ...S.btn(), marginTop: 16 }} onClick={() => setShowStruk(null)}>Tutup</button></div></div>)}

      {showHistori && (<div style={S.modal} onClick={() => setShowHistori(false)}><div style={S.modalContent} onClick={e => e.stopPropagation()}><div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>Riwayat transaksi</span><button onClick={() => setShowHistori(false)} style={S.closeBtn}>✕</button></div>{transaksi.length === 0 ? (<div style={{ textAlign: "center", padding: 30, color: "#94A3B8", fontSize: 13 }}>Belum ada transaksi</div>) : transaksi.slice(0, 20).map(t => (<div key={t.id} style={{ ...S.card, cursor: "pointer" }} onClick={() => { setShowHistori(false); setShowStruk(t); }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontSize: 13, fontWeight: 600 }}>{t.tgl} · {t.waktu}</div><div style={{ fontSize: 11, color: "#64748B" }}>{t.items.length} jenis barang</div></div><div style={{ fontSize: 15, fontWeight: 700, color: "#2563EB" }}>Rp {fmt(t.total)}</div></div></div>))}</div></div>)}
    {/* FORM BAYAR - ANGGOTA → TARUH DI SINI */}
      {showBayarForm && (() => {
        const BayarForm = () => {
          const [jenis, setJenis] = useState("Simpanan wajib");
          const [jumlah, setJumlah] = useState("");
          const [bukti, setBukti] = useState("");
          const [ket, setKet] = useState("");
          const [err, setErr] = useState("");
          const [done, setDone] = useState(false);
          const kirim = () => {
            if (!jumlah || parseInt(jumlah) <= 0) { setErr("Jumlah harus diisi"); return; }
            if (!bukti.trim()) { setErr("Bukti transfer wajib diisi (no. referensi / keterangan)"); return; }
            const newP = { id: `PB-${Date.now()}`, anggotaId: user.id, tgl: tglNow(), waktu: waktuNow(), jenis, jumlah: parseInt(jumlah), bukti, status: "menunggu", keterangan: ket || jenis };
            const updated = [newP, ...pembayaran];
            setPembayaran(updated);
            save(members, simpananPokok, simpananWajib, barang, transaksi, arusKas, updated);
            setDone(true);
          };
          if (done) return (
            <div style={S.modal} onClick={() => { setShowBayarForm(false); }}><div style={{ ...S.modalContent, textAlign: "center" }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 24, color: "#16A34A", marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Pembayaran terkirim</div>
              <div style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>Menunggu konfirmasi admin</div>
              <button style={S.btn()} onClick={() => setShowBayarForm(false)}>Tutup</button>
            </div></div>
          );
          return (
            <div style={S.modal} onClick={() => setShowBayarForm(false)}><div style={S.modalContent} onClick={e => e.stopPropagation()}>
              <div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>Kirim bukti pembayaran</span><button onClick={() => setShowBayarForm(false)} style={S.closeBtn}>✕</button></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <select style={S.input} value={jenis} onChange={e => setJenis(e.target.value)}>
                  <option>Simpanan wajib</option>
                  <option>Simpanan pokok</option>
                  <option>Angsuran simpanan pokok</option>
                </select>
                <input style={S.input} placeholder="Jumlah (Rp)" type="number" value={jumlah} onChange={e => setJumlah(e.target.value)} />
                <input style={S.input} placeholder="No. referensi / bukti transfer" value={bukti} onChange={e => setBukti(e.target.value)} />
                <input style={S.input} placeholder="Keterangan (opsional)" value={ket} onChange={e => setKet(e.target.value)} />
                <div style={{ fontSize: 12, color: "#64748B", background: "#F1F5F9", padding: 10, borderRadius: 8 }}>
                  Transfer ke:<br/><strong>Bank: [BCA]</strong><br/><strong>No. Rek: [3160054581]</strong><br/><strong>A/N: Koperasi BAZARA</strong>
                </div>
                {err && <p style={{ color: "#DC2626", fontSize: 12, margin: 0 }}>{err}</p>}
                <button style={S.btn()} onClick={kirim}>Kirim</button>
              </div>
            </div></div>
          );
        };
        return <BayarForm />;
      })()}

    </div>
  );
}

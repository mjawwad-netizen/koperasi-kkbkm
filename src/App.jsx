import { useState, useEffect, useCallback } from "react";

const SIMPANAN_POKOK = 1000000;
const SIMPANAN_WAJIB = 10000;
const BULAN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agt","Sep","Okt","Nov","Des"];
const TAHUN_AKTIF = 2026;
const STOK_WARNING = 5;

const defaultMembers = [
  { id: "KKBKM-001", nama: "Siti Rahmawati", alamat: "Jl. Mawar No. 12", hp: "081234567890", tglMasuk: "2025-01-15", status: "aktif", password: "1234", role: "anggota" },
  { id: "KKBKM-002", nama: "Budi Wicaksono", alamat: "Jl. Melati No. 5", hp: "081345678901", tglMasuk: "2025-02-20", status: "aktif", password: "1234", role: "anggota" },
  { id: "KKBKM-003", nama: "Dewi Hartini", alamat: "Jl. Kenanga No. 8", hp: "081456789012", tglMasuk: "2025-03-10", status: "aktif", password: "1234", role: "anggota" },
  { id: "KKBKM-004", nama: "Agus Prasetyo", alamat: "Jl. Anggrek No. 3", hp: "081567890123", tglMasuk: "2025-04-05", status: "non-aktif", password: "1234", role: "anggota" },
  { id: "KKBKM-005", nama: "Rina Kusuma", alamat: "Jl. Dahlia No. 17", hp: "081678901234", tglMasuk: "2025-05-12", status: "aktif", password: "1234", role: "anggota" },
];

const defaultSimpananPokok = {
  "KKBKM-001": { lunas: true, tgl: "2025-01-15" },
  "KKBKM-002": { lunas: true, tgl: "2025-02-20" },
  "KKBKM-003": { lunas: false, tgl: null },
  "KKBKM-005": { lunas: true, tgl: "2025-05-12" },
};

const defaultSimpananWajib = {
  "KKBKM-001": [0,1,2,3,4,5,6,7,8],
  "KKBKM-002": [0,1,2,3,4,7,8],
  "KKBKM-003": [0,1,2,3,4,5],
  "KKBKM-005": [0,1,2,3,4,5,6,7,8],
};

const defaultBarang = [
  { id: "B001", kode: "BRS-5K", nama: "Beras 5kg", kategori: "Sembako", hargaBeli: 58000, hargaJual: 65000, stok: 25 },
  { id: "B002", kode: "MYK-1L", nama: "Minyak Goreng 1L", kategori: "Sembako", hargaBeli: 15000, hargaJual: 18000, stok: 30 },
  { id: "B003", kode: "GLP-1K", nama: "Gula Pasir 1kg", kategori: "Sembako", hargaBeli: 12000, hargaJual: 14500, stok: 20 },
  { id: "B004", kode: "TEP-1K", nama: "Tepung Terigu 1kg", kategori: "Sembako", hargaBeli: 10000, hargaJual: 12500, stok: 15 },
  { id: "B005", kode: "KCP-SKS", nama: "Kecap Manis 600ml", kategori: "Bumbu", hargaBeli: 14000, hargaJual: 17000, stok: 18 },
  { id: "B006", kode: "MIE-INS", nama: "Mie Instan (dus)", kategori: "Makanan", hargaBeli: 95000, hargaJual: 110000, stok: 12 },
  { id: "B007", kode: "SBN-BTG", nama: "Sabun Batang", kategori: "Kebersihan", hargaBeli: 3000, hargaJual: 4500, stok: 40 },
  { id: "B008", kode: "DTR-1L", nama: "Deterjen Cair 1L", kategori: "Kebersihan", hargaBeli: 18000, hargaJual: 22000, stok: 3 },
  { id: "B009", kode: "GRM-1K", nama: "Garam Halus 1kg", kategori: "Sembako", hargaBeli: 5000, hargaJual: 7000, stok: 22 },
  { id: "B010", kode: "KPI-SCH", nama: "Kopi Sachet (renceng)", kategori: "Minuman", hargaBeli: 10000, hargaJual: 13000, stok: 35 },
  { id: "B011", kode: "AQA-GLS", nama: "Air Mineral Gelas (dus)", kategori: "Minuman", hargaBeli: 18000, hargaJual: 22000, stok: 8 },
  { id: "B012", kode: "TLR-1K", nama: "Telur 1kg", kategori: "Sembako", hargaBeli: 26000, hargaJual: 29000, stok: 10 },
];

const defaultTransaksi = [];

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
  const [transaksi, setTransaksi] = useState(defaultTransaksi);
  const [tab, setTab] = useState("anggota");
  const [subTab, setSimpananTab] = useState("wajib");
  const [kasirTab, setKasirTab] = useState("kasir");
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
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [bayarNominal, setBayarNominal] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("koperasi-data-v2");
      if (raw) {
        const d = JSON.parse(raw);
        if (d.members) setMembers(d.members);
        if (d.simpananPokok) setSimpananPokok(d.simpananPokok);
        if (d.simpananWajib) setSimpananWajib(d.simpananWajib);
        if (d.barang) setBarang(d.barang);
        if (d.transaksi) setTransaksi(d.transaksi);
      }
    } catch (e) {}
    setLoaded(true);
  }, []);

  const saveData = useCallback((m, sp, sw, br, tr) => {
    try {
      localStorage.setItem("koperasi-data-v2", JSON.stringify({
        members: m, simpananPokok: sp, simpananWajib: sw, barang: br, transaksi: tr
      }));
    } catch (e) {}
  }, []);

  const handleLogin = () => {
    setLoginError("");
    if (loginId.toUpperCase() === "ADMIN" && loginPw === "admin123") { setUser(adminUser); return; }
    const m = members.find(x => x.id.toUpperCase() === loginId.toUpperCase());
    if (m && m.password === loginPw) {
      if (m.status === "non-aktif") { setLoginError("Akun tidak aktif"); return; }
      setUser({ ...m, role: "anggota" });
    } else { setLoginError("Nomor anggota atau password salah"); }
  };

  const nextId = () => { const nums = members.map(m => parseInt(m.id.split("-")[1])); return `KKBKM-${String(Math.max(...nums) + 1).padStart(3, "0")}`; };
  const nextBarangId = () => { const nums = barang.map(b => parseInt(b.id.replace("B",""))); return `B${String(Math.max(...nums, 0) + 1).padStart(3, "0")}`; };

  const addMember = (data) => {
    const newM = { ...data, id: nextId(), tglMasuk: tglNow(), status: "aktif", password: "1234", role: "anggota" };
    const u = [...members, newM]; setMembers(u); saveData(u, simpananPokok, simpananWajib, barang, transaksi); setShowForm(false);
  };
  const updateMember = (data) => {
    const u = members.map(m => m.id === data.id ? { ...m, ...data } : m); setMembers(u); saveData(u, simpananPokok, simpananWajib, barang, transaksi); setEditMember(null);
  };
  const toggleStatus = (id) => {
    const u = members.map(m => m.id === id ? { ...m, status: m.status === "aktif" ? "non-aktif" : "aktif" } : m); setMembers(u); saveData(u, simpananPokok, simpananWajib, barang, transaksi);
  };
  const bayarPokok = (id) => {
    const u = { ...simpananPokok, [id]: { lunas: true, tgl: tglNow() } }; setSimpananPokok(u); saveData(members, u, simpananWajib, barang, transaksi);
  };
  const toggleWajib = (id, bulanIdx) => {
    const cur = simpananWajib[id] || [];
    const u = cur.includes(bulanIdx) ? { ...simpananWajib, [id]: cur.filter(b => b !== bulanIdx) } : { ...simpananWajib, [id]: [...cur, bulanIdx].sort((a,b) => a-b) };
    setSimpananWajib(u); saveData(members, simpananPokok, u, barang, transaksi);
  };

  // BARANG
  const addBarang = (data) => {
    const newB = { ...data, id: nextBarangId() };
    const u = [...barang, newB]; setBarang(u); saveData(members, simpananPokok, simpananWajib, u, transaksi); setShowBarangForm(false);
  };
  const updateBarang = (data) => {
    const u = barang.map(b => b.id === data.id ? { ...b, ...data } : b); setBarang(u); saveData(members, simpananPokok, simpananWajib, u, transaksi); setEditBarang(null);
  };
  const restokBarang = (id, qty) => {
    const u = barang.map(b => b.id === id ? { ...b, stok: b.stok + qty } : b); setBarang(u); saveData(members, simpananPokok, simpananWajib, u, transaksi); setShowRestok(null);
  };

  // CART
  const addToCart = (item) => {
    if (item.stok <= 0) return;
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      if (existing.qty >= item.stok) return;
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
  };
  const updateCartQty = (id, delta) => {
    const item = barang.find(b => b.id === id);
    setCart(cart.map(c => {
      if (c.id !== id) return c;
      const newQty = c.qty + delta;
      if (newQty <= 0) return null;
      if (newQty > item.stok) return c;
      return { ...c, qty: newQty };
    }).filter(Boolean));
  };
  const removeFromCart = (id) => setCart(cart.filter(c => c.id !== id));
  const cartTotal = cart.reduce((sum, c) => sum + c.hargaJual * c.qty, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  const prosesTransaksi = () => {
    const nominal = parseInt(bayarNominal.replace(/\D/g, "")) || 0;
    if (nominal < cartTotal) return;
    const trx = {
      id: `TRX-${Date.now()}`,
      tgl: tglNow(),
      waktu: waktuNow(),
      items: cart.map(c => ({ id: c.id, nama: c.nama, harga: c.hargaJual, qty: c.qty, subtotal: c.hargaJual * c.qty })),
      total: cartTotal,
      bayar: nominal,
      kembalian: nominal - cartTotal,
    };
    const updatedBarang = barang.map(b => {
      const cartItem = cart.find(c => c.id === b.id);
      return cartItem ? { ...b, stok: b.stok - cartItem.qty } : b;
    });
    const updatedTrx = [trx, ...transaksi];
    setBarang(updatedBarang); setTransaksi(updatedTrx); setCart([]); setBayarNominal("");
    saveData(members, simpananPokok, simpananWajib, updatedBarang, updatedTrx);
    setShowStruk(trx);
  };

  const currentMonth = new Date().getMonth();
  const isAdmin = user?.role === "admin";

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
    badge: (t) => ({ fontSize: 11, padding: "3px 10px", borderRadius: 12, fontWeight: 500, ...(t === "aktif" ? { background: "#DCFCE7", color: "#166534" } : t === "non-aktif" ? { background: "#FEE2E2", color: "#991B1B" } : t === "low" ? { background: "#FEF3C7", color: "#92400E" } : { background: "#E0E7FF", color: "#3730A3" }) }),
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

  // LOGIN
  if (!user) {
    return (
      <div style={{ ...S.app, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#2563EB", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, margin: "0 auto 16px" }}>K</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#2563EB" }}>KKBKM</div>
          <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Koperasi Konsumen</div>
        </div>
        <div style={{ width: "100%", maxWidth: 320 }}>
          <input style={{ ...S.input, marginBottom: 10 }} placeholder="Nomor anggota (KKBKM-001)" value={loginId} onChange={e => setLoginId(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
          <input style={{ ...S.input, marginBottom: 6 }} type="password" placeholder="Password" value={loginPw} onChange={e => setLoginPw(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
          {loginError && <p style={{ color: "#DC2626", fontSize: 12, margin: "4px 0 8px" }}>{loginError}</p>}
          <p style={{ fontSize: 11, color: "#94A3B8", margin: "4px 0 14px" }}>Admin: ADMIN / admin123</p>
          <button style={S.btn()} onClick={handleLogin}>Masuk</button>
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
        <div style={S.header}>
          <div><div style={S.headerTitle}>Hai, {me?.nama?.split(" ")[0]}</div><div style={S.headerSub}>{user.id}</div></div>
          <button onClick={() => setUser(null)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Keluar</button>
        </div>
        <div style={S.content}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Simpanan pokok</div><div style={{ fontSize: 18, fontWeight: 600, color: pokok?.lunas ? "#16A34A" : "#DC2626", marginTop: 2 }}>{pokok?.lunas ? "Lunas" : "Belum"}</div><div style={{ fontSize: 11, color: "#94A3B8" }}>Rp {fmt(SIMPANAN_POKOK)}</div></div>
            <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Simpanan wajib</div><div style={{ fontSize: 18, fontWeight: 600, color: "#2563EB", marginTop: 2 }}>Rp {fmt(totalWajib)}</div><div style={{ fontSize: 11, color: "#94A3B8" }}>{wajib.length} bulan terbayar</div></div>
          </div>
          <div style={S.card}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Simpanan wajib {TAHUN_AKTIF}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{BULAN.map((b, i) => (<div key={i} style={S.monthDot(wajib.includes(i) ? "paid" : i > currentMonth ? "future" : "unpaid")}>{b.charAt(0)}</div>))}</div>
            <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 11, color: "#64748B" }}><span>🟢 Lunas</span><span>🔴 Belum</span><span>⚪ Belum jatuh tempo</span></div>
          </div>
          <div style={S.card}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Data pribadi</div>
            {[["Nama", me?.nama], ["Alamat", me?.alamat], ["No. HP", me?.hp], ["Tgl masuk", me?.tglMasuk], ["Status", me?.status]].map(([l,v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F1F5F9", fontSize: 13 }}><span style={{ color: "#64748B" }}>{l}</span><span style={{ fontWeight: 500 }}>{v}</span></div>
            ))}
          </div>
          <div style={{ ...S.card, textAlign: "center" }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Total simpanan Anda</div><div style={{ fontSize: 24, fontWeight: 700, color: "#2563EB" }}>Rp {fmt((pokok?.lunas ? SIMPANAN_POKOK : 0) + totalWajib)}</div></div>
        </div>
      </div>
    );
  }

  // ADMIN VIEW
  const activeMembers = members.filter(m => m.status === "aktif");
  const totalPokok = Object.values(simpananPokok).filter(s => s.lunas).length * SIMPANAN_POKOK;
  const totalWajibAll = Object.values(simpananWajib).reduce((sum, arr) => sum + arr.length * SIMPANAN_WAJIB, 0);
  const filteredMembers = members.filter(m => m.nama.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase()));
  const lowStockItems = barang.filter(b => b.stok <= STOK_WARNING);
  const filteredBarang = barang.filter(b => b.nama.toLowerCase().includes(searchBarang.toLowerCase()) || b.kode.toLowerCase().includes(searchBarang.toLowerCase()));
  const todayTrx = transaksi.filter(t => t.tgl === tglNow());
  const todayOmzet = todayTrx.reduce((s, t) => s + t.total, 0);

  const MemberForm = ({ initial, onSave, onCancel, title }) => {
    const [f, setF] = useState(initial || { nama: "", alamat: "", hp: "" });
    const [err, setErr] = useState("");
    return (
      <div style={S.modal} onClick={onCancel}><div style={S.modalContent} onClick={e => e.stopPropagation()}>
        <div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>{title}</span><button onClick={onCancel} style={S.closeBtn}>✕</button></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input style={S.input} placeholder="Nama lengkap" value={f.nama} onChange={e => { setF({...f, nama: e.target.value}); setErr(""); }} />
          <input style={S.input} placeholder="Alamat" value={f.alamat} onChange={e => setF({...f, alamat: e.target.value})} />
          <input style={S.input} placeholder="No. HP" value={f.hp} onChange={e => setF({...f, hp: e.target.value})} />
          {err && <p style={{ color: "#DC2626", fontSize: 12, margin: 0 }}>{err}</p>}
          <button style={S.btn()} onClick={() => { if (!f.nama.trim()) { setErr("Nama wajib diisi"); return; } onSave(f); }}>Simpan</button>
        </div>
      </div></div>
    );
  };

  const BarangForm = ({ initial, onSave, onCancel, title }) => {
    const [f, setF] = useState(initial || { kode: "", nama: "", kategori: "Sembako", hargaBeli: "", hargaJual: "", stok: "" });
    const [err, setErr] = useState("");
    return (
      <div style={S.modal} onClick={onCancel}><div style={S.modalContent} onClick={e => e.stopPropagation()}>
        <div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>{title}</span><button onClick={onCancel} style={S.closeBtn}>✕</button></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input style={S.input} placeholder="Kode barang" value={f.kode} onChange={e => setF({...f, kode: e.target.value})} />
          <input style={S.input} placeholder="Nama barang" value={f.nama} onChange={e => { setF({...f, nama: e.target.value}); setErr(""); }} />
          <select style={S.input} value={f.kategori} onChange={e => setF({...f, kategori: e.target.value})}>
            {["Sembako","Bumbu","Makanan","Minuman","Kebersihan","Lainnya"].map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={S.input} placeholder="Harga beli" type="number" value={f.hargaBeli} onChange={e => setF({...f, hargaBeli: e.target.value})} />
            <input style={S.input} placeholder="Harga jual" type="number" value={f.hargaJual} onChange={e => setF({...f, hargaJual: e.target.value})} />
          </div>
          <input style={S.input} placeholder="Stok awal" type="number" value={f.stok} onChange={e => setF({...f, stok: e.target.value})} />
          {err && <p style={{ color: "#DC2626", fontSize: 12, margin: 0 }}>{err}</p>}
          <button style={S.btn()} onClick={() => {
            if (!f.nama.trim()) { setErr("Nama barang wajib diisi"); return; }
            if (!f.hargaJual) { setErr("Harga jual wajib diisi"); return; }
            onSave({ ...f, hargaBeli: parseInt(f.hargaBeli) || 0, hargaJual: parseInt(f.hargaJual) || 0, stok: parseInt(f.stok) || 0 });
          }}>Simpan</button>
        </div>
      </div></div>
    );
  };

  const MemberDetail = ({ member, onClose }) => {
    const pokok = simpananPokok[member.id];
    const wajib = simpananWajib[member.id] || [];
    return (
      <div style={S.modal} onClick={onClose}><div style={S.modalContent} onClick={e => e.stopPropagation()}>
        <div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>Detail anggota</span><button onClick={onClose} style={S.closeBtn}>✕</button></div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={S.avatar(member.status === "aktif" ? "#2563EB" : "#94A3B8")}>{member.nama.split(" ").map(n => n[0]).join("").substring(0,2)}</div>
          <div><div style={{ fontWeight: 600, fontSize: 15 }}>{member.nama}</div><div style={{ fontSize: 12, color: "#64748B" }}>{member.id}</div></div>
          <span style={S.badge(member.status)}>{member.status}</span>
        </div>
        {[["Alamat", member.alamat], ["No. HP", member.hp], ["Tgl masuk", member.tglMasuk], ["Password", member.password]].map(([l,v]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F1F5F9", fontSize: 13 }}><span style={{ color: "#64748B" }}>{l}</span><span style={{ fontWeight: 500 }}>{v}</span></div>
        ))}
        <div style={{ ...S.sectionTitle, marginTop: 16 }}>Simpanan pokok — Rp {fmt(SIMPANAN_POKOK)}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", ...S.card }}>
          <span style={{ fontWeight: 500, fontSize: 14, color: pokok?.lunas ? "#16A34A" : "#DC2626" }}>{pokok?.lunas ? `Lunas (${pokok.tgl})` : "Belum bayar"}</span>
          {!pokok?.lunas && <button style={S.btnOutline} onClick={() => bayarPokok(member.id)}>Bayar</button>}
        </div>
        <div style={S.sectionTitle}>Simpanan wajib {TAHUN_AKTIF} — Rp {fmt(SIMPANAN_WAJIB)}/bln</div>
        <div style={S.card}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{BULAN.map((b, i) => (<div key={i} style={S.monthDot(wajib.includes(i) ? "paid" : i > currentMonth ? "future" : "unpaid")} onClick={() => i <= currentMonth && toggleWajib(member.id, i)}>{b}</div>))}</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 8 }}>Total: Rp {fmt(wajib.length * SIMPANAN_WAJIB)} ({wajib.length} bulan)</div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button style={{ ...S.btnOutline, flex: 1 }} onClick={() => { onClose(); setEditMember(member); }}>Edit data</button>
          <button style={{ ...S.btn(member.status === "aktif" ? "#DC2626" : "#16A34A"), flex: 1, fontSize: 13 }} onClick={() => { toggleStatus(member.id); onClose(); }}>{member.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}</button>
        </div>
      </div></div>
    );
  };

  return (
    <div style={S.app}>
      <div style={S.header}>
        <div><div style={S.headerTitle}>KKBKM</div><div style={S.headerSub}>Koperasi Konsumen</div></div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {lowStockItems.length > 0 && tab !== "kasir" && <span style={{ background: "#FEF3C7", color: "#92400E", fontSize: 10, padding: "3px 8px", borderRadius: 10, fontWeight: 600 }}>⚠ {lowStockItems.length} stok rendah</span>}
          <button onClick={() => setUser(null)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Keluar</button>
        </div>
      </div>

      <div style={S.content}>
        {/* TAB ANGGOTA */}
        {tab === "anggota" && (<>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Total anggota</div><div style={{ fontSize: 20, fontWeight: 700, color: "#2563EB" }}>{activeMembers.length}</div><div style={{ fontSize: 11, color: "#94A3B8" }}>aktif dari {members.length}</div></div>
            <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Total simpanan</div><div style={{ fontSize: 20, fontWeight: 700, color: "#16A34A" }}>Rp {fmt(totalPokok + totalWajibAll)}</div><div style={{ fontSize: 11, color: "#94A3B8" }}>pokok + wajib</div></div>
          </div>
          <input style={{ ...S.input, marginBottom: 12 }} placeholder="Cari nama atau nomor anggota..." value={search} onChange={e => setSearch(e.target.value)} />
          {filteredMembers.map(m => (
            <div key={m.id} style={{ ...S.card, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setDetailMember(m)}>
              <div style={S.avatar(m.status === "aktif" ? "#2563EB" : "#94A3B8")}>{m.nama.split(" ").map(n => n[0]).join("").substring(0,2)}</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 500 }}>{m.nama}</div><div style={{ fontSize: 12, color: "#64748B" }}>{m.id}</div></div>
              <span style={S.badge(m.status)}>{m.status}</span>
            </div>
          ))}
          <button style={S.fab} onClick={() => setShowForm(true)}>+</button>
        </>)}

        {/* TAB SIMPANAN */}
        {tab === "simpanan" && (<>
          <div style={{ display: "flex", gap: 0, marginBottom: 12, borderBottom: "1px solid #E2E8F0" }}>
            <button style={S.tabBtn(subTab === "wajib")} onClick={() => setSimpananTab("wajib")}>Simpanan wajib</button>
            <button style={S.tabBtn(subTab === "pokok")} onClick={() => setSimpananTab("pokok")}>Simpanan pokok</button>
          </div>
          {subTab === "wajib" && (<>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Sudah bayar</div><div style={{ fontSize: 20, fontWeight: 700, color: "#16A34A" }}>{activeMembers.filter(m => (simpananWajib[m.id] || []).includes(currentMonth)).length}</div></div>
              <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Belum bayar</div><div style={{ fontSize: 20, fontWeight: 700, color: "#DC2626" }}>{activeMembers.filter(m => !(simpananWajib[m.id] || []).includes(currentMonth)).length}</div></div>
            </div>
            <div style={S.sectionTitle}>Rp {fmt(SIMPANAN_WAJIB)} / bulan — {TAHUN_AKTIF}</div>
            {activeMembers.map(m => { const w = simpananWajib[m.id] || []; return (
              <div key={m.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 13, fontWeight: 600 }}>{m.nama}</span><span style={{ fontSize: 12, color: "#2563EB", fontWeight: 500 }}>Rp {fmt(w.length * SIMPANAN_WAJIB)}</span></div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>{BULAN.map((b, i) => (<div key={i} style={S.monthDot(w.includes(i) ? "paid" : i > currentMonth ? "future" : "unpaid")} onClick={() => i <= currentMonth && toggleWajib(m.id, i)}>{b.substring(0,1)}</div>))}</div>
              </div>
            ); })}
          </>)}
          {subTab === "pokok" && (<>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Sudah lunas</div><div style={{ fontSize: 20, fontWeight: 700, color: "#16A34A" }}>{Object.values(simpananPokok).filter(s => s.lunas).length}</div></div>
              <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Belum lunas</div><div style={{ fontSize: 20, fontWeight: 700, color: "#DC2626" }}>{activeMembers.length - Object.values(simpananPokok).filter(s => s.lunas).length}</div></div>
            </div>
            <div style={S.sectionTitle}>Rp {fmt(SIMPANAN_POKOK)} (sekali bayar)</div>
            {activeMembers.map(m => { const s = simpananPokok[m.id]; return (
              <div key={m.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>{m.nama}</div><div style={{ fontSize: 11, color: "#64748B" }}>{m.id}</div></div>
                {s?.lunas ? <span style={S.badge("aktif")}>Lunas</span> : <button style={S.btnOutline} onClick={() => bayarPokok(m.id)}>Bayar</button>}
              </div>
            ); })}
          </>)}
        </>)}

        {/* TAB KASIR */}
        {tab === "kasir" && (<>
          <div style={{ display: "flex", gap: 0, marginBottom: 12, borderBottom: "1px solid #E2E8F0" }}>
            <button style={S.tabBtn(kasirTab === "kasir")} onClick={() => setKasirTab("kasir")}>Kasir</button>
            <button style={S.tabBtn(kasirTab === "stok")} onClick={() => setKasirTab("stok")}>Stok barang</button>
          </div>

          {kasirTab === "kasir" && (<>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Transaksi hari ini</div><div style={{ fontSize: 20, fontWeight: 700, color: "#2563EB" }}>{todayTrx.length}</div></div>
              <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Omzet hari ini</div><div style={{ fontSize: 20, fontWeight: 700, color: "#16A34A" }}>Rp {fmt(todayOmzet)}</div></div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input style={{ ...S.input, flex: 1 }} placeholder="Cari barang..." value={searchBarang} onChange={e => setSearchBarang(e.target.value)} />
              <button style={{ ...S.btnSm("#64748B"), whiteSpace: "nowrap" }} onClick={() => setShowHistori(true)}>Riwayat</button>
            </div>

            {searchBarang && (
              <div style={{ marginBottom: 12 }}>
                {filteredBarang.slice(0, 6).map(b => (
                  <div key={b.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{b.nama}</div>
                      <div style={{ fontSize: 12, color: "#64748B" }}>Rp {fmt(b.hargaJual)} · Stok: {b.stok}</div>
                    </div>
                    <button style={S.btnSm(b.stok > 0 ? "#2563EB" : "#CBD5E1")} onClick={() => addToCart(b)} disabled={b.stok <= 0}>+ Tambah</button>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (<>
              <div style={S.sectionTitle}>Keranjang ({cartCount} item)</div>
              {cart.map(c => (
                <div key={c.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.nama}</div>
                    <div style={{ fontSize: 12, color: "#64748B" }}>Rp {fmt(c.hargaJual)} × {c.qty} = <span style={{ color: "#2563EB", fontWeight: 600 }}>Rp {fmt(c.hargaJual * c.qty)}</span></div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button style={S.qtyBtn} onClick={() => updateCartQty(c.id, -1)}>−</button>
                    <span style={{ fontSize: 14, fontWeight: 600, minWidth: 20, textAlign: "center" }}>{c.qty}</span>
                    <button style={S.qtyBtn} onClick={() => updateCartQty(c.id, 1)}>+</button>
                    <button style={{ ...S.qtyBtn, background: "#DC2626", marginLeft: 4, fontSize: 12 }} onClick={() => removeFromCart(c.id)}>✕</button>
                  </div>
                </div>
              ))}

              <div style={{ ...S.card, background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>Total</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#2563EB" }}>Rp {fmt(cartTotal)}</span>
                </div>
                <input style={{ ...S.input, marginBottom: 8 }} placeholder="Nominal bayar" value={bayarNominal} onChange={e => setBayarNominal(e.target.value)} type="number" />
                {bayarNominal && parseInt(bayarNominal) >= cartTotal && (
                  <div style={{ fontSize: 13, color: "#16A34A", fontWeight: 500, marginBottom: 8 }}>Kembalian: Rp {fmt(parseInt(bayarNominal) - cartTotal)}</div>
                )}
                <button style={S.btn(parseInt(bayarNominal || 0) >= cartTotal ? "#16A34A" : "#CBD5E1")} onClick={prosesTransaksi} disabled={parseInt(bayarNominal || 0) < cartTotal}>
                  Proses pembayaran
                </button>
              </div>
            </>)}

            {cart.length === 0 && !searchBarang && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#94A3B8" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🛒</div>
                <div style={{ fontSize: 14, color: "#64748B" }}>Ketik nama barang di kolom pencarian untuk mulai transaksi</div>
              </div>
            )}
          </>)}

          {kasirTab === "stok" && (<>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Total jenis barang</div><div style={{ fontSize: 20, fontWeight: 700, color: "#2563EB" }}>{barang.length}</div></div>
              <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Stok rendah</div><div style={{ fontSize: 20, fontWeight: 700, color: lowStockItems.length > 0 ? "#DC2626" : "#16A34A" }}>{lowStockItems.length}</div></div>
            </div>

            {lowStockItems.length > 0 && (<>
              <div style={S.sectionTitle}>⚠ Stok perlu diisi ulang (≤{STOK_WARNING})</div>
              {lowStockItems.map(b => (
                <div key={b.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "3px solid #F59E0B" }}>
                  <div><div style={{ fontSize: 13, fontWeight: 600 }}>{b.nama}</div><div style={{ fontSize: 12, color: "#64748B" }}>Stok: <span style={{ color: "#DC2626", fontWeight: 600 }}>{b.stok}</span></div></div>
                  <button style={S.btnSm("#F59E0B")} onClick={() => setShowRestok(b)}>Restok</button>
                </div>
              ))}
            </>)}

            <div style={S.sectionTitle}>Semua barang</div>
            {barang.map(b => (
              <div key={b.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{b.nama}</div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>{b.kode} · {b.kategori}</div>
                  <div style={{ fontSize: 12, marginTop: 2 }}>
                    <span style={{ color: "#64748B" }}>Beli: Rp {fmt(b.hargaBeli)}</span> · <span style={{ color: "#2563EB", fontWeight: 500 }}>Jual: Rp {fmt(b.hargaJual)}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: b.stok <= STOK_WARNING ? "#DC2626" : "#1E293B" }}>{b.stok}</div>
                  <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                    <button style={S.btnSm("#64748B")} onClick={() => setEditBarang(b)}>Edit</button>
                    <button style={S.btnSm("#F59E0B")} onClick={() => setShowRestok(b)}>+Stok</button>
                  </div>
                </div>
              </div>
            ))}
            <button style={S.fab} onClick={() => setShowBarangForm(true)}>+</button>
          </>)}
        </>)}

        {/* TAB LAPORAN (placeholder fase 3) */}
        {tab === "laporan" && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94A3B8" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#64748B" }}>Arus kas & laporan</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Akan dikerjakan di Fase 3</div>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={S.bottomNav}>
        {[{ key: "anggota", icon: "👥", label: "Anggota" }, { key: "simpanan", icon: "💰", label: "Simpanan" }, { key: "kasir", icon: "🛒", label: "Kasir" }, { key: "laporan", icon: "📊", label: "Laporan" }].map(n => (
          <button key={n.key} style={S.navItem(tab === n.key)} onClick={() => { setTab(n.key); setSearch(""); setSearchBarang(""); }}>
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

      {/* RESTOK MODAL */}
      {showRestok && (() => {
        const RestokModal = () => {
          const [qty, setQty] = useState("");
          return (
            <div style={S.modal} onClick={() => setShowRestok(null)}><div style={{ ...S.modalContent, paddingBottom: 24 }} onClick={e => e.stopPropagation()}>
              <div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>Restok: {showRestok.nama}</span><button onClick={() => setShowRestok(null)} style={S.closeBtn}>✕</button></div>
              <div style={{ fontSize: 13, color: "#64748B", marginBottom: 12 }}>Stok saat ini: <span style={{ fontWeight: 600, color: "#1E293B" }}>{showRestok.stok}</span></div>
              <input style={{ ...S.input, marginBottom: 10 }} placeholder="Jumlah tambahan" type="number" value={qty} onChange={e => setQty(e.target.value)} />
              <button style={S.btn()} onClick={() => { if (parseInt(qty) > 0) restokBarang(showRestok.id, parseInt(qty)); }}>Tambah stok</button>
            </div></div>
          );
        };
        return <RestokModal />;
      })()}

      {/* STRUK MODAL */}
      {showStruk && (
        <div style={S.modal} onClick={() => setShowStruk(null)}><div style={{ ...S.modalContent, textAlign: "center" }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 24, color: "#16A34A", marginBottom: 8 }}>✓</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Transaksi berhasil</div>
          <div style={{ fontSize: 12, color: "#64748B", marginBottom: 16 }}>{showStruk.tgl} · {showStruk.waktu}</div>
          <div style={{ textAlign: "left", borderTop: "1px dashed #CBD5E1", paddingTop: 12 }}>
            {showStruk.items.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
                <span>{item.nama} ×{item.qty}</span><span style={{ fontWeight: 500 }}>Rp {fmt(item.subtotal)}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px dashed #CBD5E1", marginTop: 8, paddingTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700 }}><span>Total</span><span>Rp {fmt(showStruk.total)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748B", marginTop: 4 }}><span>Bayar</span><span>Rp {fmt(showStruk.bayar)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#16A34A", fontWeight: 500 }}><span>Kembalian</span><span>Rp {fmt(showStruk.kembalian)}</span></div>
            </div>
          </div>
          <button style={{ ...S.btn(), marginTop: 16 }} onClick={() => setShowStruk(null)}>Tutup</button>
        </div></div>
      )}

      {/* HISTORI TRANSAKSI MODAL */}
      {showHistori && (
        <div style={S.modal} onClick={() => setShowHistori(false)}><div style={S.modalContent} onClick={e => e.stopPropagation()}>
          <div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>Riwayat transaksi</span><button onClick={() => setShowHistori(false)} style={S.closeBtn}>✕</button></div>
          {transaksi.length === 0 ? (
            <div style={{ textAlign: "center", padding: 30, color: "#94A3B8", fontSize: 13 }}>Belum ada transaksi</div>
          ) : transaksi.slice(0, 20).map(t => (
            <div key={t.id} style={{ ...S.card, cursor: "pointer" }} onClick={() => { setShowHistori(false); setShowStruk(t); }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>{t.tgl} · {t.waktu}</div><div style={{ fontSize: 11, color: "#64748B" }}>{t.items.length} jenis barang</div></div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#2563EB" }}>Rp {fmt(t.total)}</div>
              </div>
            </div>
          ))}
        </div></div>
      )}
    </div>
  );
}

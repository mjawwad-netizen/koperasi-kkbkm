import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { API_URL, SIMPANAN_POKOK, SIMPANAN_WAJIB, BULAN, TAHUN_AKTIF, STOK_WARNING, POIN_PER_RP, OPSI_ANGSURAN, adminUser, tglNow, waktuNow } from "../config";

const STORAGE_KEY = "koperasi-data-v5";
const Ctx = createContext();
export const useData = () => useContext(Ctx);

export function DataProvider({ children }) {
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [simpananPokok, setSimpananPokok] = useState({});
  const [simpananWajib, setSimpananWajib] = useState({});
  const [barang, setBarang] = useState([]);
  const [transaksi, setTransaksi] = useState([]);
  const [arusKas, setArusKas] = useState([]);
  const [pembayaran, setPembayaran] = useState([]);
  const [shuConfig, setShuConfig] = useState({ pctTransaksi: 40, pctSimpanan: 20, pctCadangan: 40 });
  const [loaded, setLoaded] = useState(false);

  // Load
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
        try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) { const d = JSON.parse(raw); Object.entries({ members: setMembers, simpananPokok: setSimpananPokok, simpananWajib: setSimpananWajib, barang: setBarang, transaksi: setTransaksi, arusKas: setArusKas, pembayaran: setPembayaran, shuConfig: setShuConfig }).forEach(([k, fn]) => { if (d[k]) fn(d[k]); }); } } catch (e2) {}
      }
      setLoaded(true);
    })();
  }, []);

  // Save
  const save = useCallback((m, sp, sw, br, tr, ak, pb, sc) => {
    const data = { members: m, simpananPokok: sp, simpananWajib: sw, barang: br, transaksi: tr, arusKas: ak, pembayaran: pb, shuConfig: sc };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
    fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ action: "saveAll", data }) }).catch(() => {});
  }, []);

  const sv = useCallback((m, sp, sw, br, tr, ak, pb, sc) => {
    save(m || members, sp || simpananPokok, sw || simpananWajib, br || barang, tr || transaksi, ak || arusKas, pb || pembayaran, sc || shuConfig);
  }, [save, members, simpananPokok, simpananWajib, barang, transaksi, arusKas, pembayaran, shuConfig]);

  const addKas = useCallback((tipe, kategori, keterangan, jumlah, curAk) => {
    return [{ id: `AK-${Date.now()}-${Math.random().toString(36).substr(2,4)}`, tgl: tglNow(), waktu: waktuNow(), tipe, kategori, keterangan, jumlah }, ...curAk];
  }, []);

  // Auth
  const login = (id, pin) => {
    if (id.toUpperCase() === "ADMIN" && pin === adminUser.pin) { setUser(adminUser); localStorage.setItem("koperasi-user", JSON.stringify(adminUser)); return { ok: true }; }
    const m = members.find(x => x.hp === id || x.id.toUpperCase() === id.toUpperCase());
    if (m && m.pin === pin) { if (m.status === "non-aktif") return { ok: false, error: "Akun tidak aktif" }; setUser(m); localStorage.setItem("koperasi-user", JSON.stringify(m)); return { ok: true }; }
    return { ok: false, error: "No. HP/ID atau PIN salah" };
  };
  const logout = () => { setUser(null); localStorage.removeItem("koperasi-user"); };

  // ID generators
  const nextId = () => { if (!members.length) return "KKBKM-001"; const nums = members.map(m => parseInt(m.id.split("-")[1])||0); return `KKBKM-${String(Math.max(...nums)+1).padStart(3,"0")}`; };
  const nextBarangId = () => { if (!barang.length) return "B001"; const nums = barang.map(b => parseInt(b.id.replace("B",""))||0); return `B${String(Math.max(...nums)+1).padStart(3,"0")}`; };

  // Register
  const register = (regData) => {
    if (!regData.nama.trim()) return { ok: false, error: "Nama wajib diisi" };
    if (!regData.hp.trim()) return { ok: false, error: "No. HP wajib diisi" };
    if (!regData.pin || regData.pin.length < 4) return { ok: false, error: "PIN minimal 4 digit" };
    if (regData.pin !== regData.pinConfirm) return { ok: false, error: "PIN tidak cocok" };
    if (members.find(m => m.hp === regData.hp)) return { ok: false, error: "No. HP sudah terdaftar" };
    const id = nextId();
    const newM = { id, nama: regData.nama, alamat: regData.alamat, hp: regData.hp, pin: regData.pin, tglMasuk: tglNow(), status: "aktif", role: "anggota", poin: 0 };
    const um = [...members, newM];
    const opsi = OPSI_ANGSURAN[regData.angsuran];
    const up = { ...simpananPokok, [id]: { lunas: false, tgl: null, skemaAngsur: opsi.kali, terbayar: 0 } };
    setMembers(um); setSimpananPokok(up); sv(um, up);
    return { ok: true, id };
  };

  // Member CRUD
  const addMember = (data) => { const u = [...members, { ...data, id: nextId(), tglMasuk: tglNow(), status: "aktif", pin: "1234", role: "anggota", poin: 0 }]; setMembers(u); sv(u); };
  const updateMember = (data) => { const u = members.map(m => m.id === data.id ? { ...m, ...data } : m); setMembers(u); sv(u); };
  const toggleStatus = (id) => { const u = members.map(m => m.id === id ? { ...m, status: m.status === "aktif" ? "non-aktif" : "aktif" } : m); setMembers(u); sv(u); };

  // Simpanan
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

  // Barang
  const addBarang = (data) => { const u = [...barang, { ...data, id: nextBarangId() }]; setBarang(u); sv(null, null, null, u); };
  const updateBarang = (data) => { const u = barang.map(b => b.id === data.id ? { ...b, ...data } : b); setBarang(u); sv(null, null, null, u); };
  const restokBarang = (id, qty, totalBiaya) => {
    const u = barang.map(b => b.id === id ? { ...b, stok: b.stok + qty } : b);
    const item = barang.find(b => b.id === id);
    const ak = addKas("keluar", "Pembelian stok", `Restok: ${item?.nama} (${qty} pcs)`, totalBiaya, arusKas);
    setBarang(u); setArusKas(ak); sv(null, null, null, u, null, ak);
  };

  // Transaksi
  const prosesTransaksi = (cart, nominal, pembeli) => {
    const cartTotal = cart.reduce((s, c) => s + c.hargaJual * c.qty, 0);
    const trx = { id: `TRX-${Date.now()}`, tgl: tglNow(), waktu: waktuNow(), items: cart.map(c => ({ id: c.id, nama: c.nama, harga: c.hargaJual, hargaBeli: c.hargaBeli, qty: c.qty, subtotal: c.hargaJual * c.qty })), total: cartTotal, bayar: nominal, kembalian: nominal - cartTotal, pembeli };
    const ub = barang.map(b => { const ci = cart.find(c => c.id === b.id); return ci ? { ...b, stok: b.stok - ci.qty } : b; });
    const ut = [trx, ...transaksi];
    const ak = addKas("masuk", "Penjualan", `${pembeli.nama} · ${cart.length} jenis`, cartTotal, arusKas);
    let um = members;
    if (pembeli.type === "anggota" && pembeli.id) {
      const poinBaru = Math.floor(cartTotal / POIN_PER_RP);
      um = members.map(m => m.id === pembeli.id ? { ...m, poin: (m.poin || 0) + poinBaru } : m);
      setMembers(um);
    }
    setBarang(ub); setTransaksi(ut); setArusKas(ak);
    save(um, simpananPokok, simpananWajib, ub, ut, ak, pembayaran, shuConfig);
    return trx;
  };

  // Pengeluaran
  const addPengeluaran = (data) => { const ak = addKas("keluar", data.kategori, data.keterangan, parseInt(data.jumlah), arusKas); setArusKas(ak); sv(null, null, null, null, null, ak); };

  // Pembayaran
  const addPembayaran = (data) => { const u = [data, ...pembayaran]; setPembayaran(u); sv(null, null, null, null, null, null, u); };
  const updatePembayaranStatus = (id, status) => { const u = pembayaran.map(x => x.id === id ? { ...x, status } : x); setPembayaran(u); sv(null, null, null, null, null, null, u); };

  // SHU
  const updateShuConfig = (cfg) => { setShuConfig(cfg); save(members, simpananPokok, simpananWajib, barang, transaksi, arusKas, pembayaran, cfg); };

  const currentMonth = new Date().getMonth();
  const activeMembers = useMemo(() => members.filter(m => m.status === "aktif"), [members]);
  const lowStock = useMemo(() => barang.filter(b => b.stok <= STOK_WARNING), [barang]);

  const hitungSHU = useCallback((memberId) => {
    const m = members.find(x => x.id === memberId); if (!m) return 0;
    const labaKotor = transaksi.reduce((s, t) => s + t.items.reduce((si, it) => si + (it.harga - (it.hargaBeli || 0)) * it.qty, 0), 0);
    const totalPoin = members.reduce((s, x) => s + (x.poin || 0), 0);
    const totalSimp = members.reduce((s, x) => { const w = simpananWajib[x.id] || []; const p = simpananPokok[x.id]; return s + w.length * SIMPANAN_WAJIB + (p?.lunas ? SIMPANAN_POKOK : 0); }, 0);
    const shuT = labaKotor * (shuConfig.pctTransaksi / 100);
    const shuS = labaKotor * (shuConfig.pctSimpanan / 100);
    const poinM = m.poin || 0;
    const simpM = ((simpananWajib[m.id] || []).length * SIMPANAN_WAJIB) + (simpananPokok[m.id]?.lunas ? SIMPANAN_POKOK : 0);
    return Math.round((totalPoin > 0 ? (poinM / totalPoin) * shuT : 0) + (totalSimp > 0 ? (simpM / totalSimp) * shuS : 0));
  }, [members, simpananPokok, simpananWajib, transaksi, shuConfig]);

  const labaKotor = useMemo(() => transaksi.reduce((s, t) => s + t.items.reduce((si, it) => si + (it.harga - (it.hargaBeli || 0)) * it.qty, 0), 0), [transaksi]);

  const value = {
    user, loaded, members, simpananPokok, simpananWajib, barang, transaksi, arusKas, pembayaran, shuConfig,
    activeMembers, lowStock, currentMonth, labaKotor,
    login, logout, register,
    addMember, updateMember, toggleStatus,
    bayarPokok, toggleWajib,
    addBarang, updateBarang, restokBarang,
    prosesTransaksi, addPengeluaran,
    addPembayaran, updatePembayaranStatus,
    updateShuConfig, hitungSHU, sv,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { API_URL, SIMPANAN_POKOK, SIMPANAN_WAJIB, BULAN, TAHUN_AKTIF, STOK_WARNING, POIN_PER_RP, OPSI_ANGSURAN, adminUser, tglNow, waktuNow } from "../config";

const STORAGE_KEY = "koperasi-data-v5";
const Ctx = createContext();
export const useData = () => useContext(Ctx);

const pinStr = (v) => v === null || v === undefined ? "" : String(v).trim();

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

  useEffect(() => {
    (async () => {
      let loadedMembers = [];
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const d = JSON.parse(raw);
          if (d.members?.length) { setMembers(d.members); loadedMembers = d.members; }
          if (d.simpananPokok) setSimpananPokok(d.simpananPokok);
          if (d.simpananWajib) setSimpananWajib(d.simpananWajib);
          if (d.barang?.length) setBarang(d.barang);
          if (d.transaksi?.length) setTransaksi(d.transaksi);
          if (d.arusKas?.length) setArusKas(d.arusKas);
          if (d.pembayaran?.length) setPembayaran(d.pembayaran);
          if (d.shuConfig) setShuConfig(d.shuConfig);
        }
      } catch (e) {}
      try {
        const res = await fetch(API_URL);
        const json = await res.json();
        if (json.ok && json.data) {
          const d = json.data;
          const nm = (d.members || []).map(m => ({ ...m, pin: pinStr(m.pin), hp: String(m.hp || "") }));
          if (nm.length || !loadedMembers.length) { setMembers(nm); loadedMembers = nm; }
          if (d.simpananPokok) setSimpananPokok(d.simpananPokok);
          if (d.simpananWajib) setSimpananWajib(d.simpananWajib);
          if (d.barang?.length) setBarang(d.barang.map(b => ({ ...b, hargaBeli: Number(b.hargaBeli), hargaJual: Number(b.hargaJual), stok: Number(b.stok) })));
          if (d.transaksi?.length) setTransaksi(d.transaksi);
          if (d.arusKas?.length) setArusKas(d.arusKas);
          if (d.pembayaran?.length) setPembayaran(d.pembayaran);
          if (d.shuConfig) setShuConfig(d.shuConfig);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ members: nm, simpananPokok: d.simpananPokok, simpananWajib: d.simpananWajib, barang: d.barang, transaksi: d.transaksi, arusKas: d.arusKas, pembayaran: d.pembayaran, shuConfig: d.shuConfig })); } catch (e) {}
        }
      } catch (e) { console.log("Sheets offline, pakai data lokal"); }
      try {
        const su = localStorage.getItem("koperasi-user");
        if (su) {
          const p = JSON.parse(su);
          if (p.id === "ADMIN") { setUser(adminUser); }
          else { const fresh = loadedMembers.find(m => m.id === p.id); if (fresh && fresh.status === "aktif") setUser(fresh); else localStorage.removeItem("koperasi-user"); }
        }
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  const save = useCallback((m, sp, sw, br, tr, ak, pb, sc) => {
    const data = { members: m, simpananPokok: sp, simpananWajib: sw, barang: br, transaksi: tr, arusKas: ak, pembayaran: pb, shuConfig: sc };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
    fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ action: "saveAll", data }) }).catch(() => {});
  }, []);

  const sv = useCallback((m, sp, sw, br, tr, ak, pb, sc) => {
    save(m || members, sp || simpananPokok, sw || simpananWajib, br || barang, tr || transaksi, ak || arusKas, pb || pembayaran, sc || shuConfig);
  }, [save, members, simpananPokok, simpananWajib, barang, transaksi, arusKas, pembayaran, shuConfig]);

  const addKas = useCallback((tipe, kategori, keterangan, jumlah, curAk) => {
    return [{ id: "AK-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4), tgl: tglNow(), waktu: waktuNow(), tipe, kategori, keterangan, jumlah }, ...curAk];
  }, []);

  const login = useCallback((id, pin) => {
    const iid = String(id).trim().toUpperCase();
    const ipin = String(pin).trim();
    if (iid === "ADMIN" && ipin === pinStr(adminUser.pin)) { setUser(adminUser); localStorage.setItem("koperasi-user", JSON.stringify(adminUser)); return { ok: true }; }
    const m = members.find(x => (String(x.id).toUpperCase() === iid || String(x.hp).trim() === String(id).trim()) && pinStr(x.pin) === ipin);
    if (m) { if (m.status === "non-aktif") return { ok: false, error: "Akun tidak aktif" }; setUser(m); localStorage.setItem("koperasi-user", JSON.stringify(m)); return { ok: true }; }
    const found = members.find(x => String(x.id).toUpperCase() === iid || String(x.hp).trim() === String(id).trim());
    if (found) return { ok: false, error: "PIN salah" };
    return { ok: false, error: "No. HP/ID tidak terdaftar" };
  }, [members]);

  const logout = useCallback(() => { setUser(null); localStorage.removeItem("koperasi-user"); }, []);

  const nextId = useCallback(() => {
    if (!members.length) return "KKBKM-001";
    const nums = members.map(m => parseInt(m.id.split("-")[1]) || 0);
    return "KKBKM-" + String(Math.max(...nums) + 1).padStart(3, "0");
  }, [members]);

  const nextBarangId = useCallback(() => {
    if (!barang.length) return "B001";
    const nums = barang.map(b => parseInt(b.id.replace("B", "")) || 0);
    return "B" + String(Math.max(...nums) + 1).padStart(3, "0");
  }, [barang]);

  const register = useCallback((regData) => {
    if (!regData.nama.trim()) return { ok: false, error: "Nama wajib diisi" };
    if (!regData.hp.trim()) return { ok: false, error: "No. HP wajib diisi" };
    if (!regData.pin || regData.pin.length < 4) return { ok: false, error: "PIN minimal 4 digit" };
    if (regData.pin !== regData.pinConfirm) return { ok: false, error: "PIN tidak cocok" };
    if (members.find(m => String(m.hp).trim() === String(regData.hp).trim())) return { ok: false, error: "No. HP sudah terdaftar" };
    const id = nextId();
    const newM = { id, nama: regData.nama, alamat: regData.alamat, hp: String(regData.hp).trim(), pin: String(regData.pin).trim(), tglMasuk: tglNow(), status: "aktif", role: "anggota", poin: 0 };
    const um = [...members, newM];
    const opsi = OPSI_ANGSURAN[regData.angsuran];
    const up = { ...simpananPokok, [id]: { lunas: false, tgl: null, skemaAngsur: opsi.kali, terbayar: 0 } };
    setMembers(um); setSimpananPokok(up);
    save(um, up, simpananWajib, barang, transaksi, arusKas, pembayaran, shuConfig);
    return { ok: true, id };
  }, [members, simpananPokok, simpananWajib, barang, transaksi, arusKas, pembayaran, shuConfig, save, nextId]);

  const addMember = useCallback((data) => {
    const u = [...members, { ...data, id: nextId(), tglMasuk: tglNow(), status: "aktif", pin: String(data.pin || "1234"), role: "anggota", poin: 0 }];
    setMembers(u); sv(u);
  }, [members, nextId, sv]);

  const updateMember = useCallback((data) => {
    const u = members.map(m => m.id === data.id ? { ...m, ...data, pin: pinStr(data.pin || m.pin) } : m);
    setMembers(u); sv(u);
  }, [members, sv]);

  const toggleStatus = useCallback((id) => {
    const u = members.map(m => m.id === id ? { ...m, status: m.status === "aktif" ? "non-aktif" : "aktif" } : m);
    setMembers(u); sv(u);
  }, [members, sv]);

  const bayarPokok = useCallback((id) => {
    const u = { ...simpananPokok, [id]: { ...simpananPokok[id], lunas: true, tgl: tglNow() } };
    const nama = members.find(m => m.id === id)?.nama || id;
    const ak = addKas("masuk", "Simpanan pokok", nama + " (" + id + ")", SIMPANAN_POKOK, arusKas);
    setSimpananPokok(u); setArusKas(ak); sv(null, u, null, null, null, ak);
  }, [simpananPokok, members, arusKas, addKas, sv]);

  const toggleWajib = useCallback((id, bulanIdx) => {
    const cur = simpananWajib[id] || [];
    const nama = members.find(m => m.id === id)?.nama || id;
    let u, ak;
    if (cur.includes(bulanIdx)) {
      u = { ...simpananWajib, [id]: cur.filter(b => b !== bulanIdx) };
      ak = addKas("keluar", "Koreksi simpanan wajib", "Batal: " + nama + " - " + BULAN[bulanIdx], SIMPANAN_WAJIB, arusKas);
    } else {
      u = { ...simpananWajib, [id]: [...cur, bulanIdx].sort((a, b) => a - b) };
      ak = addKas("masuk", "Simpanan wajib", nama + " - " + BULAN[bulanIdx], SIMPANAN_WAJIB, arusKas);
    }
    setSimpananWajib(u); setArusKas(ak); sv(null, null, u, null, null, ak);
  }, [simpananWajib, members, arusKas, addKas, sv]);

  const addBarang = useCallback((data) => {
    const u = [...barang, { ...data, id: nextBarangId() }]; setBarang(u); sv(null, null, null, u);
  }, [barang, nextBarangId, sv]);

  const updateBarang = useCallback((data) => {
    const u = barang.map(b => b.id === data.id ? { ...b, ...data } : b); setBarang(u); sv(null, null, null, u);
  }, [barang, sv]);

  const restokBarang = useCallback((id, qty, totalBiaya) => {
    const u = barang.map(b => b.id === id ? { ...b, stok: b.stok + qty } : b);
    const item = barang.find(b => b.id === id);
    const ak = addKas("keluar", "Pembelian stok", "Restok: " + (item?.nama || "") + " (" + qty + " pcs)", totalBiaya, arusKas);
    setBarang(u); setArusKas(ak); sv(null, null, null, u, null, ak);
  }, [barang, arusKas, addKas, sv]);

  const prosesTransaksi = useCallback((cart, nominal, pembeli) => {
    const cartTotal = cart.reduce((s, c) => s + c.hargaJual * c.qty, 0);
    const trx = { id: "TRX-" + Date.now(), tgl: tglNow(), waktu: waktuNow(), items: cart.map(c => ({ id: c.id, nama: c.nama, harga: c.hargaJual, hargaBeli: c.hargaBeli, qty: c.qty, subtotal: c.hargaJual * c.qty })), total: cartTotal, bayar: nominal, kembalian: nominal - cartTotal, pembeli: pembeli };
    const ub = barang.map(b => { const ci = cart.find(c => c.id === b.id); return ci ? { ...b, stok: b.stok - ci.qty } : b; });
    const ut = [trx, ...transaksi];
    const ak = addKas("masuk", "Penjualan", pembeli.nama + " - " + cart.length + " jenis", cartTotal, arusKas);
    let um = members;
    if (pembeli.type === "anggota" && pembeli.id) {
      const poinBaru = Math.floor(cartTotal / POIN_PER_RP);
      um = members.map(m => m.id === pembeli.id ? { ...m, poin: (m.poin || 0) + poinBaru } : m);
      setMembers(um);
    }
    setBarang(ub); setTransaksi(ut); setArusKas(ak);
    save(um, simpananPokok, simpananWajib, ub, ut, ak, pembayaran, shuConfig);
    return trx;
  }, [members, barang, transaksi, arusKas, simpananPokok, simpananWajib, pembayaran, shuConfig, addKas, save]);

  const addPengeluaran = useCallback((data) => {
    const ak = addKas("keluar", data.kategori, data.keterangan, parseInt(data.jumlah), arusKas);
    setArusKas(ak); sv(null, null, null, null, null, ak);
  }, [arusKas, addKas, sv]);

  const addPembayaran = useCallback((data) => {
    const u = [data, ...pembayaran]; setPembayaran(u); sv(null, null, null, null, null, null, u);
  }, [pembayaran, sv]);

  const updatePembayaranStatus = useCallback((id, status) => {
    const u = pembayaran.map(x => x.id === id ? { ...x, status: status } : x); setPembayaran(u); sv(null, null, null, null, null, null, u);
  }, [pembayaran, sv]);

  const updateShuConfig = useCallback((cfg) => {
    setShuConfig(cfg); save(members, simpananPokok, simpananWajib, barang, transaksi, arusKas, pembayaran, cfg);
  }, [members, simpananPokok, simpananWajib, barang, transaksi, arusKas, pembayaran, save]);

  const currentMonth = new Date().getMonth();
  const activeMembers = useMemo(() => members.filter(m => m.status === "aktif"), [members]);
  const lowStock = useMemo(() => barang.filter(b => b.stok <= STOK_WARNING), [barang]);

  const hitungSHU = useCallback((memberId) => {
    const m = members.find(x => x.id === memberId);
    if (!m) return 0;
    const labaK = transaksi.reduce((s, t) => s + t.items.reduce((si, it) => si + (it.harga - (it.hargaBeli || 0)) * it.qty, 0), 0);
    const totalPoin = members.reduce((s, x) => s + (x.poin || 0), 0);
    const totalSimp = members.reduce((s, x) => {
      const w = simpananWajib[x.id] || [];
      const p = simpananPokok[x.id];
      return s + w.length * SIMPANAN_WAJIB + (p && p.lunas ? SIMPANAN_POKOK : 0);
    }, 0);
    const shuT = labaK * (shuConfig.pctTransaksi / 100);
    const shuS = labaK * (shuConfig.pctSimpanan / 100);
    const poinM = m.poin || 0;
    const simpM = ((simpananWajib[m.id] || []).length * SIMPANAN_WAJIB) + (simpananPokok[m.id] && simpananPokok[m.id].lunas ? SIMPANAN_POKOK : 0);
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
    updateShuConfig, hitungSHU, sv
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { API_URL, SIMPANAN_POKOK, SIMPANAN_WAJIB, BULAN, TAHUN_AKTIF, STOK_WARNING, POIN_PER_RP, OPSI_ANGSURAN, adminUser, tglNow, waktuNow, normalizeHP } from "../config";

const STORAGE_KEY = "koperasi-data-v6";
const OLD_KEYS = ["koperasi-data-v5", "koperasi-data-v4", "koperasi-data-v3"];
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
  const [notifikasi, setNotifikasi] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const dataLoaded = useRef(false); // Mencegah save sebelum data selesai load

  useEffect(() => {
    (async () => {
      let localData = null;

      // 1. Cari data lokal (coba key baru dulu, lalu key lama)
      for (const key of [STORAGE_KEY, ...OLD_KEYS]) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) { localData = JSON.parse(raw); break; }
        } catch (e) {}
      }

      // 2. Terapkan data lokal sebagai baseline
      if (localData) {
        if (localData.members?.length) setMembers(localData.members);
        if (localData.simpananPokok && Object.keys(localData.simpananPokok).length) setSimpananPokok(localData.simpananPokok);
        if (localData.simpananWajib && Object.keys(localData.simpananWajib).length) setSimpananWajib(localData.simpananWajib);
        if (localData.barang?.length) setBarang(localData.barang);
        if (localData.transaksi?.length) setTransaksi(localData.transaksi);
        if (localData.arusKas?.length) setArusKas(localData.arusKas);
        if (localData.pembayaran?.length) setPembayaran(localData.pembayaran);
        if (localData.shuConfig) setShuConfig(localData.shuConfig);
        if (localData.notifikasi?.length) setNotifikasi(localData.notifikasi);
      }

      // 3. Coba ambil dari Sheets (hanya overwrite kalau Sheets punya data)
      let sheetsData = null;
      try {
        const res = await fetch(API_URL);
        const json = await res.json();
        if (json.ok && json.data) sheetsData = json.data;
      } catch (e) { console.log("Sheets offline"); }

      if (sheetsData) {
        const d = sheetsData;
        const nm = (d.members || []).map(m => ({ ...m, pin: pinStr(m.pin), hp: normalizeHP(m.hp) }));
        // Hanya overwrite kalau Sheets punya data LEBIH BANYAK atau lokal kosong
        if (nm.length > 0) setMembers(nm);
        if (d.simpananPokok && Object.keys(d.simpananPokok).length) setSimpananPokok(d.simpananPokok);
        if (d.simpananWajib && Object.keys(d.simpananWajib).length) setSimpananWajib(d.simpananWajib);
        if (d.barang?.length) setBarang(d.barang.map(b => ({ ...b, hargaBeli: Number(b.hargaBeli), hargaJual: Number(b.hargaJual), stok: Number(b.stok) })));
        if (d.transaksi?.length) setTransaksi(d.transaksi);
        if (d.arusKas?.length) setArusKas(d.arusKas);
        if (d.pembayaran?.length) setPembayaran(d.pembayaran);
        if (d.shuConfig) setShuConfig(d.shuConfig);
        if (d.notifikasi?.length) setNotifikasi(d.notifikasi);
      }

      // 4. Restore session
      try {
        const su = localStorage.getItem("koperasi-user");
        if (su) {
          const p = JSON.parse(su);
          if (p.id === "ADMIN") setUser(adminUser);
          else {
            // Cari dari data terbaru
            const allMembers = sheetsData?.members?.length ? sheetsData.members : (localData?.members || []);
            const fresh = allMembers.find(m => m.id === p.id);
            if (fresh && fresh.status !== "non-aktif") setUser({ ...fresh, pin: pinStr(fresh.pin), hp: normalizeHP(fresh.hp) });
            else localStorage.removeItem("koperasi-user");
          }
        }
      } catch (e) {}

      // 5. Simpan ke key terbaru & hapus key lama
      try {
        const currentData = { members: sheetsData?.members?.length ? sheetsData.members.map(m => ({...m, pin: pinStr(m.pin), hp: normalizeHP(m.hp)})) : (localData?.members || []), simpananPokok: sheetsData?.simpananPokok || localData?.simpananPokok || {}, simpananWajib: sheetsData?.simpananWajib || localData?.simpananWajib || {}, barang: sheetsData?.barang || localData?.barang || [], transaksi: sheetsData?.transaksi || localData?.transaksi || [], arusKas: sheetsData?.arusKas || localData?.arusKas || [], pembayaran: sheetsData?.pembayaran || localData?.pembayaran || [], shuConfig: sheetsData?.shuConfig || localData?.shuConfig || { pctTransaksi: 40, pctSimpanan: 20, pctCadangan: 40 }, notifikasi: sheetsData?.notifikasi || localData?.notifikasi || [] };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
        OLD_KEYS.forEach(k => localStorage.removeItem(k));
      } catch (e) {}

      dataLoaded.current = true;
      setLoaded(true);
    })();
  }, []);

  // Save — hanya jalan kalau data sudah loaded
  const save = useCallback((m, sp, sw, br, tr, ak, pb, sc, nf) => {
    if (!dataLoaded.current) return; // PENTING: jangan save sebelum load selesai
    const data = { members: m, simpananPokok: sp, simpananWajib: sw, barang: br, transaksi: tr, arusKas: ak, pembayaran: pb, shuConfig: sc, notifikasi: nf };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
    // Hanya sync ke Sheets kalau ada data member (hindari overwrite dengan kosong)
    if (m && m.length > 0) {
      fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ action: "saveAll", data }) }).catch(() => {});
    }
  }, []);

  // Helper save — ambil state terkini via callback
  const doSave = useCallback((overrides) => {
    setMembers(curM => {
      setSimpananPokok(curSP => {
        setSimpananWajib(curSW => {
          setBarang(curBR => {
            setTransaksi(curTR => {
              setArusKas(curAK => {
                setPembayaran(curPB => {
                  setShuConfig(curSC => {
                    setNotifikasi(curNF => {
                      save(
                        overrides.members || curM,
                        overrides.simpananPokok || curSP,
                        overrides.simpananWajib || curSW,
                        overrides.barang || curBR,
                        overrides.transaksi || curTR,
                        overrides.arusKas || curAK,
                        overrides.pembayaran || curPB,
                        overrides.shuConfig || curSC,
                        overrides.notifikasi || curNF
                      );
                      return curNF;
                    });
                    return curSC;
                  });
                  return curPB;
                });
                return curAK;
              });
              return curTR;
            });
            return curBR;
          });
          return curSW;
        });
        return curSP;
      });
      return curM;
    });
  }, [save]);

  const addKas = useCallback((tipe, kategori, keterangan, jumlah, curAk) => {
    return [{ id: "AK-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4), tgl: tglNow(), waktu: waktuNow(), tipe, kategori, keterangan, jumlah }, ...curAk];
  }, []);

  // AUTH
  const login = useCallback((id, pin) => {
    const iid = String(id).trim().toUpperCase();
    const ipin = String(pin).trim();
    const inputHp = normalizeHP(id);
    if (iid === "ADMIN" && ipin === pinStr(adminUser.pin)) { setUser(adminUser); localStorage.setItem("koperasi-user", JSON.stringify(adminUser)); return { ok: true }; }
    const m = members.find(x => (String(x.id).toUpperCase() === iid || normalizeHP(x.hp) === inputHp) && pinStr(x.pin) === ipin);
    if (m) { if (m.status === "non-aktif") return { ok: false, error: "Akun tidak aktif" }; setUser(m); localStorage.setItem("koperasi-user", JSON.stringify(m)); return { ok: true }; }
    const found = members.find(x => String(x.id).toUpperCase() === iid || normalizeHP(x.hp) === inputHp);
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

  // REGISTER
  const register = useCallback((regData) => {
    if (!regData.nama.trim()) return { ok: false, error: "Nama wajib diisi" };
    if (!regData.hp.trim()) return { ok: false, error: "No. HP wajib diisi" };
    if (!regData.pin || regData.pin.length < 4) return { ok: false, error: "PIN minimal 4 digit" };
    if (regData.pin !== regData.pinConfirm) return { ok: false, error: "PIN tidak cocok" };
    const hpNorm = normalizeHP(regData.hp);
    if (members.find(m => normalizeHP(m.hp) === hpNorm)) return { ok: false, error: "No. HP sudah terdaftar" };
    const id = nextId();
    const newM = { id, nama: regData.nama, alamat: regData.alamat, hp: hpNorm, pin: String(regData.pin).trim(), tglMasuk: tglNow(), status: "aktif", role: "anggota", poin: 0 };
    const um = [...members, newM];
    const opsi = OPSI_ANGSURAN[regData.angsuran];
    const up = { ...simpananPokok, [id]: { lunas: false, tgl: null, skemaAngsur: opsi.kali, terbayar: 0 } };
    setMembers(um); setSimpananPokok(up);
    doSave({ members: um, simpananPokok: up });
    return { ok: true, id };
  }, [members, simpananPokok, nextId, doSave]);

  // MEMBER CRUD
  const addMember = useCallback((data) => {
    const u = [...members, { ...data, id: nextId(), tglMasuk: tglNow(), status: "aktif", pin: String(data.pin || "1234"), role: "anggota", poin: 0 }];
    setMembers(u); doSave({ members: u });
  }, [members, nextId, doSave]);

  const updateMember = useCallback((data) => {
    const u = members.map(m => m.id === data.id ? { ...m, ...data, pin: pinStr(data.pin || m.pin) } : m);
    setMembers(u); doSave({ members: u });
  }, [members, doSave]);

  const toggleStatus = useCallback((id) => {
    const u = members.map(m => m.id === id ? { ...m, status: m.status === "aktif" ? "non-aktif" : "aktif" } : m);
    setMembers(u); doSave({ members: u });
  }, [members, doSave]);

  // SIMPANAN
  const bayarPokok = useCallback((id) => {
    const u = { ...simpananPokok, [id]: { ...simpananPokok[id], lunas: true, tgl: tglNow() } };
    const nama = members.find(m => m.id === id)?.nama || id;
    const ak = addKas("masuk", "Simpanan pokok", nama + " (" + id + ")", SIMPANAN_POKOK, arusKas);
    setSimpananPokok(u); setArusKas(ak); doSave({ simpananPokok: u, arusKas: ak });
  }, [simpananPokok, members, arusKas, addKas, doSave]);

  const toggleWajib = useCallback((id, bulanIdx) => {
    const cur = simpananWajib[id] || []; const nama = members.find(m => m.id === id)?.nama || id;
    let u, ak;
    if (cur.includes(bulanIdx)) { u = { ...simpananWajib, [id]: cur.filter(b => b !== bulanIdx) }; ak = addKas("keluar", "Koreksi simpanan wajib", "Batal: " + nama + " - " + BULAN[bulanIdx], SIMPANAN_WAJIB, arusKas); }
    else { u = { ...simpananWajib, [id]: [...cur, bulanIdx].sort((a, b) => a - b) }; ak = addKas("masuk", "Simpanan wajib", nama + " - " + BULAN[bulanIdx], SIMPANAN_WAJIB, arusKas); }
    setSimpananWajib(u); setArusKas(ak); doSave({ simpananWajib: u, arusKas: ak });
  }, [simpananWajib, members, arusKas, addKas, doSave]);

  // BARANG
  const addBarang = useCallback((data) => {
    const u = [...barang, { ...data, id: nextBarangId() }]; setBarang(u); doSave({ barang: u });
  }, [barang, nextBarangId, doSave]);

  const updateBarang = useCallback((data) => {
    const u = barang.map(b => b.id === data.id ? { ...b, ...data } : b); setBarang(u); doSave({ barang: u });
  }, [barang, doSave]);

  const restokBarang = useCallback((id, qty, totalBiaya) => {
    const u = barang.map(b => b.id === id ? { ...b, stok: b.stok + qty } : b);
    const item = barang.find(b => b.id === id);
    const ak = addKas("keluar", "Pembelian stok", "Restok: " + (item?.nama || "") + " (" + qty + " pcs)", totalBiaya, arusKas);
    setBarang(u); setArusKas(ak); doSave({ barang: u, arusKas: ak });
  }, [barang, arusKas, addKas, doSave]);

  // TRANSAKSI
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
    doSave({ members: um, barang: ub, transaksi: ut, arusKas: ak });
    return trx;
  }, [members, barang, transaksi, arusKas, addKas, doSave]);

  const addPengeluaran = useCallback((data) => {
    const ak = addKas("keluar", data.kategori, data.keterangan, parseInt(data.jumlah), arusKas);
    setArusKas(ak); doSave({ arusKas: ak });
  }, [arusKas, addKas, doSave]);

  const addPembayaran = useCallback((data) => {
    const u = [data, ...pembayaran]; setPembayaran(u); doSave({ pembayaran: u });
  }, [pembayaran, doSave]);

  const updatePembayaranStatus = useCallback((id, status) => {
    const u = pembayaran.map(x => x.id === id ? { ...x, status: status } : x); setPembayaran(u); doSave({ pembayaran: u });
  }, [pembayaran, doSave]);

  const updateShuConfig = useCallback((cfg) => {
    setShuConfig(cfg); doSave({ shuConfig: cfg });
  }, [doSave]);

  // NOTIFIKASI
  const addNotifikasi = useCallback((data) => {
    const n = { id: "NF-" + Date.now(), tgl: tglNow(), waktu: waktuNow(), ...data, dibaca: {} };
    const u = [n, ...notifikasi];
    setNotifikasi(u); doSave({ notifikasi: u });
    return n;
  }, [notifikasi, doSave]);

  const tandaiBaca = useCallback((notifId, userId) => {
    const u = notifikasi.map(n => n.id === notifId ? { ...n, dibaca: { ...n.dibaca, [userId]: true } } : n);
    setNotifikasi(u); doSave({ notifikasi: u });
  }, [notifikasi, doSave]);

  const hapusNotifikasi = useCallback((notifId) => {
    const u = notifikasi.filter(n => n.id !== notifId);
    setNotifikasi(u); doSave({ notifikasi: u });
  }, [notifikasi, doSave]);

  const currentMonth = new Date().getMonth();
  const activeMembers = useMemo(() => members.filter(m => m.status === "aktif"), [members]);
  const lowStock = useMemo(() => barang.filter(b => b.stok <= STOK_WARNING), [barang]);

  const hitungSHU = useCallback((memberId) => {
    const m = members.find(x => x.id === memberId); if (!m) return 0;
    const labaK = transaksi.reduce((s, t) => s + t.items.reduce((si, it) => si + (it.harga - (it.hargaBeli || 0)) * it.qty, 0), 0);
    const totalPoin = members.reduce((s, x) => s + (x.poin || 0), 0);
    const totalSimp = members.reduce((s, x) => { const w = simpananWajib[x.id] || []; const p = simpananPokok[x.id]; return s + w.length * SIMPANAN_WAJIB + (p && p.lunas ? SIMPANAN_POKOK : 0); }, 0);
    const shuT = labaK * (shuConfig.pctTransaksi / 100); const shuS = labaK * (shuConfig.pctSimpanan / 100);
    const poinM = m.poin || 0; const simpM = ((simpananWajib[m.id] || []).length * SIMPANAN_WAJIB) + (simpananPokok[m.id] && simpananPokok[m.id].lunas ? SIMPANAN_POKOK : 0);
    return Math.round((totalPoin > 0 ? (poinM / totalPoin) * shuT : 0) + (totalSimp > 0 ? (simpM / totalSimp) * shuS : 0));
  }, [members, simpananPokok, simpananWajib, transaksi, shuConfig]);

  const labaKotor = useMemo(() => transaksi.reduce((s, t) => s + t.items.reduce((si, it) => si + (it.harga - (it.hargaBeli || 0)) * it.qty, 0), 0), [transaksi]);

  const value = {
    user, loaded, members, simpananPokok, simpananWajib, barang, transaksi, arusKas, pembayaran, shuConfig, notifikasi,
    activeMembers, lowStock, currentMonth, labaKotor,
    login, logout, register, addMember, updateMember, toggleStatus,
    bayarPokok, toggleWajib, addBarang, updateBarang, restokBarang,
    prosesTransaksi, addPengeluaran, addPembayaran, updatePembayaranStatus,
    updateShuConfig, hitungSHU,
    addNotifikasi, tandaiBaca, hapusNotifikasi,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
